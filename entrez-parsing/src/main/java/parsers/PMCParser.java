package parsers;

import parsers.PMC.*;
import org.apache.solr.common.SolrInputDocument;

import javax.xml.bind.JAXBContext;
import javax.xml.bind.JAXBException;
import javax.xml.bind.Unmarshaller;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.text.ParseException;
import java.util.ArrayList;
import java.util.List;

/**
 * Created by jlazo on 3/18/15.
 */
public class PMCParser {

    private final Unmarshaller unmarshaller;
    private boolean indexable;
    private String message;

    public PMCParser() throws JAXBException {
        JAXBContext jaxbContext = JAXBContext.newInstance("parsers.PMC", ObjectFactory.class.getClassLoader());
        unmarshaller = jaxbContext.createUnmarshaller();
    }

    public Article unmarshall(File xml) throws FileNotFoundException, JAXBException {
        return unmarshall(new FileInputStream(xml));
    }

    public Article unmarshall(InputStream inputStream) throws JAXBException {
        unmarshaller.setSchema(null);
        return (Article) unmarshaller.unmarshal(inputStream);
    }

    public Article unmarshallPath(Path path)throws Exception{
        return (Article) unmarshaller.unmarshal(Files.newInputStream(path));
    }

    public SolrInputDocument mapToSolrInputDocument(Article article) throws Exception {
        indexable = true;
        message = "!ERROR: ";
        SolrInputDocument document = new SolrInputDocument();

        addPMID(document, "pmid", article.getFront().getArticleMeta().getArticleId());
        String title = addTitle(document, "title", article.getFront().getArticleMeta().getTitleGroup());
        addJournal(document, "journal", article.getFront().getJournalMeta());
        if (article.getFront().getArticleMeta().getHistory() != null){
            addDate1(document, "date", article.getFront().getArticleMeta().getHistory());
        }
        else{
            addDate2(document, "date", article.getFront().getArticleMeta().getPubDate());
        }

        addAuthors(document, "authors", article.getFront().getArticleMeta().getContribGroupOrAffOrAffAlternatives());
        addAbstract(document, "abstract", article.getFront().getArticleMeta().getAbstract());
        addBody(document, article.getBody());

//        System.out.println(document);
        if (indexable){
            return document;
        }
        else{
            message += "Title: " + title + ". ";
            System.out.println(message);
            throw new Exception();
        }
    }

    public void addPMID(SolrInputDocument document, String name, List<ArticleId> IDs){
        for (ArticleId id : IDs){
            if (id.getPubIdType().equals("pmid")){
                document.addField(name, id.getContent());
                break;
            }
            else{
                if(id.getPubIdType().equals("pmc")){
                    document.addField(name, "PMC" + id.getContent());
                }
            }
        }
    }

    public void addJournal(SolrInputDocument document, String name, JournalMeta JM){
        String result = "";
        if (JM.getJournalTitleDeprec() != null){
                    result = JM.getJournalTitleDeprec().getText();
        }
        if (JM.getJournalTitleGroup() != null){
            for (JournalTitleGroup jtd : JM.getJournalTitleGroup()){
                for (JournalTitle journalTitle : jtd.getJournalTitle()){
                    result = journalTitle.getText();
                }
            }
        }
        if (!result.equals("")){
            document.addField(name, result);
        }
        else{
            indexable = false;
            message += "Could not Find any Journal!";
        }
    }

    public void addDate1(SolrInputDocument document, String name, History history) throws ParseException {
        Date date;
        if (history.getContent().size() > 1){
            date = (Date) history.getContent().get(1);
        }
        else{
            date = (Date) history.getContent().get(0);
        }
        document.addField(name, date.getDate());
        }

    public void addDate2(SolrInputDocument document, String name, List<PubDate> pubDateList)throws ParseException{
        PubDate pubDate = pubDateList.get(0);
        document.addField(name, pubDate.getDate());
    }

    public String addTitle(SolrInputDocument document, String name, TitleGroup titleGroup){
        String result = "";
        if(titleGroup.getArticleTitle().getContent() != null){
            result = titleGroup.getArticleTitle().getText();
        }
        if (!result.equals("")){
            result = result.replaceAll( "\\(\\)", "");
            result = result.replaceAll("\n", "");
            result = result.replaceAll("\t", "");
            result = result.replaceAll(" +", " ");
            document.addField(name, result);
        }
        else{
            indexable = false;
            message += "Could not Find any Title! ";
        }
        return result;
    }

    public void addAuthors(SolrInputDocument document, String name, List<Object> contribsOrAffs){
        List<String> result  = new ArrayList<>();
        for (Object o : contribsOrAffs){
            if (o instanceof ContribGroup){
                ContribGroup contribgroup = (ContribGroup) o;
                for (Object j: contribgroup.getContribOrAddressOrAff()){
                    if (j instanceof Contrib){
                        Contrib contrib = (Contrib) j;
                        if (contrib.getContribType().equals("author")){
                            String author = "";
                            for (Object i: contrib.getContribIdOrAnonymousOrCollab()){
                                if (i instanceof Collab){
                                    author = i.toString();
                                }
                                if (i instanceof Name){
                                    Name fullName = (Name) i;
                                    author = fullName.toString();
                                }
                            }
                            if(!author.equals("")){
                                result.add(author);
                            }
                        }
                    }
                }
            }
        }
        if (result.size() > 0){
            document.addField(name, result);
        }
        else{
            indexable = false;
            message += "Could not Find any Authors! ";
        }
    }

    public void addAbstract(SolrInputDocument document, String name, List<Abstract> abstractList){
        String result = "";
        for (Abstract abs: abstractList){
            if (abs.getAbstractType() == null){
                for (Object o: abs.getAddressOrAlternativesOrArray()){
                    if (o instanceof P){
                        P paragraph = (P) o;
                        result += paragraph.toString();
                    }
                }
            }
        }
        if (!result.equals("")){
            result = result.replaceAll( "\\(\\)", "");
            result = result.replaceAll("\n", "");
            result = result.replaceAll("\t", "");
            result = result.replaceAll(" +", " ");
            document.addField(name, result);
        }
    }

    public void addBody(SolrInputDocument document, Body body){
        String intro = "";
        String discuss = "";
        if (body != null){
            if (body.getSec() != null){
                int numSecs = body.getSec().size();
                for (int i = 0; i<numSecs; i++){
                    if (i <= (Math.ceil(numSecs / 2))){
                        intro += body.getSec().get(i).getAllText();
                    }
                    else{
                        discuss += body.getSec().get(i).getAllText();
                    }
                }
            }
            if(body.getAddressOrAlternativesOrArray()!= null){
                for (Object o: body.getAddressOrAlternativesOrArray()){
                    if (o instanceof P){
                        System.out.println();
                        discuss += o.toString();
                    }
                }
            }
        }
        intro = intro.replaceAll( "\\(\\)", "");
        intro = intro.replaceAll(System.getProperty("line.separator"), "");
        intro = intro.replaceAll(" +", " ");
        intro = intro.replaceAll(",(,*),", " ");
        intro = intro.replaceAll(", (, *),", " ");
        document.addField("intro-results", intro);

        discuss = discuss.replaceAll( "\\(\\)", "");
        discuss = discuss.replaceAll(System.getProperty("line.separator"), "");
        discuss = discuss.replaceAll(" +", " ");
        discuss = discuss.replaceAll(",(,*),", " ");
        discuss = discuss.replaceAll(", (, *),", " ");
        document.addField("discussion-conclusion", discuss);

        if (intro.equals("") && discuss.equals("")){
            indexable = false;
            message += "Could not Find any body! ";
        }

    }


}
