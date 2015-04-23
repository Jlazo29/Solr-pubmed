package parsers;

import banner.Tag;
import banner.tagging.Mention;
import parsers.PMC.*;
import org.apache.solr.common.SolrInputDocument;
import parsers.PMC.Date;

import javax.xml.bind.JAXBContext;
import javax.xml.bind.JAXBException;
import javax.xml.bind.Unmarshaller;
import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.text.ParseException;
import java.util.*;
import java.util.List;

/**
 * An object representation of a JAXB parser to convert Pubmed Open acess XML data into {@link org.apache.solr.common.SolrInputDocument}s.
 * @author Jorge Lazo on 3/18/15.
 */
public class PMCParser {

    private final Unmarshaller unmarshaller;
    private boolean indexable;
    private String message;
    private Set<String> mentionTexts;

    /**
     * Constructor for {@link parsers.PMCParser}. Creates a {@link javax.xml.bind.JAXBContext}
     * and a {@link javax.xml.bind.Unmarshaller} to work with.
     *
     * @throws JAXBException
     * @throws IOException
     */
    public PMCParser() throws JAXBException, IOException {
        JAXBContext jaxbContext = JAXBContext.newInstance("parsers.PMC", ObjectFactory.class.getClassLoader());
        unmarshaller = jaxbContext.createUnmarshaller();
    }

    /**
     * Unmarshalling step to read the data contents of an xml {@link File}.
     *
     * @param xml: A {@link File} to unmarshall.
     * @return The {@link parsers.medline.MedlineCitationSet} associated with the {@link File}.
     * @throws FileNotFoundException
     * @throws JAXBException
     */
    public Article unmarshall(File xml) throws FileNotFoundException, JAXBException {
        return unmarshall(new FileInputStream(xml));
    }
    public Article unmarshall(InputStream inputStream) throws JAXBException{
        return (Article) unmarshaller.unmarshal(inputStream);
    }

    /**
     * This method is called on each {@link parsers.PMC.Article} to map the data into a
     * {@link org.apache.solr.common.SolrInputDocument} in order to be indexed.
     *
     * @param article: The {@link parsers.PMC.Article} to extract data from.
     * @param tagger: the {@link banner.tagging.Tagger}to tag text.
     * @return a {@link org.apache.solr.common.SolrInputDocument}, a java object with data
     * ready for indexing.
     */
    public SolrInputDocument mapToSolrInputDocument(Article article, Tag tagger) throws Exception {
        indexable = true;
        message = "!ERROR: ";
        mentionTexts = new HashSet<>();
        SolrInputDocument document = new SolrInputDocument();

        String id = addPMID(document, "pmid", article.getFront().getArticleMeta().getArticleId());
        String title = addTitle(document, "title", article.getFront().getArticleMeta().getTitleGroup());
        addJournal(document, "journal", article.getFront().getJournalMeta());
        if (article.getFront().getArticleMeta().getHistory() != null){
            addDate1(document, "date", article.getFront().getArticleMeta().getHistory());
        }
        else{
            addDate2(document, "date", article.getFront().getArticleMeta().getPubDate());
        }

        addAuthors(document, "authors", article.getFront().getArticleMeta().getContribGroupOrAffOrAffAlternatives());
        addAbstract(document, "abstract", article.getFront().getArticleMeta().getAbstract(), tagger);
        addBody(document, article.getBody());
        addGeneMentions(document, "gene-mention");

//        System.out.println(document);
        System.out.println(mentionTexts);

        if (indexable){
            return document;
        }
        else{
            message += "Title: " + title + ". " + id;
            System.out.println(message);
            return null;
        }
    }

    public String addPMID(SolrInputDocument document, String name, List<ArticleId> IDs){
        String result = "";
        for (ArticleId id : IDs){
            if (id.getPubIdType().equals("pmid")){
                result = id.getContent();
                document.addField(name, id.getContent());
                break;
            }
            else{
                if(id.getPubIdType().equals("pmc")){
                    result = id.getContent();
                    document.addField(name, "PMC" + id.getContent());
                }
            }
        }
        return result;
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

    public void addAbstract(SolrInputDocument document, String name, List<Abstract> abstractList, Tag tagger){
        String result = "";
        for (Abstract abs: abstractList){
            if (abs.getAbstractType() == null){
                for (Object o: abs.getAddressOrAlternativesOrArray()){
                    if (o instanceof P){
                        P paragraph = (P) o;
                        result += paragraph.toString();
                    }
                }
                if (abs.getSec() != null){
                    for (Sec section: abs.getSec()){
                        result += section.getAllText();
                    }
                }
            }
        }
        if (!result.equals("")){
            result = result.replaceAll( "\\(\\)", "");
            result = result.replaceAll("\n", "");
            result = result.replaceAll("\t", "");
            result = result.replaceAll(" +", " ");

            result = tagger.tagText(result);
            System.out.println(result + "\n");

            mentionTexts = tagger.getMentionSet();

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
//        mentionTexts.addAll(tagger.tagText(intro));
        document.addField("intro-results", intro);

        discuss = discuss.replaceAll( "\\(\\)", "");
        discuss = discuss.replaceAll(System.getProperty("line.separator"), "");
        discuss = discuss.replaceAll(" +", " ");
        discuss = discuss.replaceAll(",(,*),", " ");
        discuss = discuss.replaceAll(", (, *),", " ");
//        mentionTexts.addAll(tagger.tagText(discuss));
        document.addField("discussion-conclusion", discuss);

        if (intro.equals("") && discuss.equals("")){
            indexable = false;
            message += "Could not Find any body! ";
        }

    }

    private void addGeneMentions(SolrInputDocument document, String field){
        if (mentionTexts.size() > 0){
            for (String gene : mentionTexts){
                document.addField(field, gene);
            }
        }
    }

}
