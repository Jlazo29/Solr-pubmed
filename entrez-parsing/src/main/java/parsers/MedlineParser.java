package parsers;

import banner.Tag;
import banner.tagging.Mention;
import ingestion.SolrClient;
import parsers.medline.*;
import org.apache.solr.common.SolrInputDocument;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import parsers.medline.Date;
import parsers.medline.ObjectFactory;
import parsers.medline.Suffix;

import javax.xml.bind.JAXBContext;
import javax.xml.bind.JAXBException;
import javax.xml.bind.Unmarshaller;
import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.text.ParseException;
import java.util.*;

public class MedlineParser {

    private final Unmarshaller unmarshaller;
    private final Logger logger;
    private Set<String> mentionText;

    public MedlineParser() throws JAXBException , IOException {
        logger = LoggerFactory.getLogger(SolrClient.class);
        JAXBContext jaxbContext = JAXBContext.newInstance("parsers.medline", ObjectFactory.class.getClassLoader());
        unmarshaller = jaxbContext.createUnmarshaller();


    }

    public MedlineCitationSet unmarshall(File xml) throws FileNotFoundException, JAXBException {
        return unmarshall(new FileInputStream(xml));
    }

    public MedlineCitationSet unmarshall(InputStream inputStream) throws JAXBException {
        return (MedlineCitationSet) unmarshaller.unmarshal(inputStream);
    }

    public Collection<SolrInputDocument> mapToSolrInputDocumentCollection(MedlineCitationSet citationSet, Tag tagger) {
        Collection<SolrInputDocument> documentCollection = new ArrayList<>(citationSet.getMedlineCitation().size());
        for(MedlineCitation citation : citationSet.getMedlineCitation()) {
            documentCollection.add(mapToSolrInputDocument(citation, tagger));
        }
        return documentCollection;
    }

    public SolrInputDocument mapToSolrInputDocument(MedlineCitation citation, Tag tagger) {
        mentionText = new HashSet<>();

        SolrInputDocument document = new SolrInputDocument();
        addField(document, "pmid", citation.getPMID().getvalue());
        addDateField(document, "date", citation.getDateCreated());
        addField(document, "title", citation.getArticle().getArticleTitle());
        addField(document, "journal", citation.getArticle().getJournal().getTitle());
        if (citation.getArticle().getAuthorList() != null) {
            addAuthors(document, "authors", citation.getArticle().getAuthorList().getAuthor());
        }
        if (citation.getArticle().getAbstract() != null) {
            addAbstractText(document, "abstract", citation.getArticle().getAbstract().getAbstractText(), tagger);
        }
        addGeneMentions(document, "gene-mention");

//        System.out.println(document);
        System.out.println(mentionText);

        return document ;
    }

    private void addAuthors(SolrInputDocument document, String name, List<Author> authors) {
        for (Author author : authors) {
            try {
                document.addField(name, formatAuthorName(author));
            } catch (NullPointerException e) {
                logger.error(e.getMessage(), e);
            }
        }
    }

    private void addAbstractText(SolrInputDocument document, String name, List<AbstractText> abstractTexts, Tag tagger) {
        String result = "";
        for (AbstractText abstractText : abstractTexts) {
            result += abstractText.getvalue();
        }
        result = tagger.tagText(result);
        System.out.println(result);
        mentionText = tagger.getMentionSet();
        document.addField(name, result);
    }

    private void addDateField(SolrInputDocument document, String name, Date date) {
        if (date != null) {
            try {
                document.addField(name, date.getConvertedDate());
            } catch (ParseException e) {
                logger.error(String.format("Failed to add date to field %s", name), e);
            }
        }
    }

    private void addField(SolrInputDocument document, String name, Object object) {
        if (object != null)
            document.addField(name, object);
    }

    private String formatAuthorName(Author author) {
        String lastName = null, foreName = null, initials = null, suffix = null, collectiveName = null;
        for (Object o : author.getLastNameOrForeNameOrInitialsOrSuffixOrCollectiveName()) {
            if (o instanceof LastName) {
                lastName = ((LastName) o).getvalue();
            }
            if (o instanceof Initials) {
                initials = ((Initials) o).getvalue();
            }
            if (o instanceof Suffix) {
                suffix = ((Suffix) o).getvalue();
            }
            if (o instanceof CollectiveName) {
                collectiveName = ((CollectiveName) o).getvalue();
            }
        }
        if (lastName != null && initials != null)
            return String.format("%s %s", initials, lastName);
        if (lastName != null)
            return lastName;
        if (collectiveName != null)
            return collectiveName;
        else
            throw new NullPointerException("Cannot process: " + author.toString());
    }

    private void addGeneMentions(SolrInputDocument document, String field){
        if (mentionText.size() > 0){
            for (String gene : mentionText){
                document.addField(field,gene);
            }
        }
    }


}
