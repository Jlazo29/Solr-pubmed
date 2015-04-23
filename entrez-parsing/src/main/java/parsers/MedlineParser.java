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
/**
 * An object representation of a JAXB parser to convert  medline XML data into {@link org.apache.solr.common.SolrInputDocument}s.
 * @author Alex Purdy on 11/14.
 */

public class MedlineParser {

    private final Unmarshaller unmarshaller;
    private Set<String> mentionText;

    /**
     * Constructor for {@link parsers.MedlineParser}. Creates a {@link javax.xml.bind.JAXBContext}
     * and a {@link javax.xml.bind.Unmarshaller} to work with.
     *
     * @throws JAXBException
     * @throws IOException
     */
    public MedlineParser() throws JAXBException , IOException {
        JAXBContext jaxbContext = JAXBContext.newInstance("parsers.medline", ObjectFactory.class.getClassLoader());
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
    public MedlineCitationSet unmarshall(File xml) throws FileNotFoundException, JAXBException {
        return unmarshall(new FileInputStream(xml));
    }
    public MedlineCitationSet unmarshall(InputStream inputStream) throws JAXBException{
        return (MedlineCitationSet) unmarshaller.unmarshal(inputStream);
    }

    /**
     * This method loops through the multiple {@link parsers.medline.MedlineCitation}
     * inside a {@link parsers.medline.MedlineCitationSet} in order to extract the data from each one.
     * A {@link banner.tagging.Tagger} Is passed along.
     *
     * @param citationSet: the {@link parsers.medline.MedlineCitationSet} to extract data from.
     * @param tagger: the {@link banner.tagging.Tagger}to tag text.
     * @return documentCollection: A {@link java.util.Collection} of {@link org.apache.solr.common.SolrInputDocument}.
     */
    public Collection<SolrInputDocument> mapToSolrInputDocumentCollection(MedlineCitationSet citationSet, Tag tagger) {
        Collection<SolrInputDocument> documentCollection = new ArrayList<>(citationSet.getMedlineCitation().size());
        for(MedlineCitation citation : citationSet.getMedlineCitation()) {
            documentCollection.add(mapToSolrInputDocument(citation, tagger));
        }
        return documentCollection;
    }

    /**
     * This method is called for each {@link parsers.medline.MedlineCitation} to map
     * data into a {@link org.apache.solr.common.SolrInputDocument}.
     *
     * @param citation: The {@link parsers.medline.MedlineCitation} to extract data from.
     * @param tagger: the {@link banner.tagging.Tagger}to tag text.
     * @return a {@link org.apache.solr.common.SolrInputDocument}, a java object with data
     *         ready for indexing.
     */
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
                e.printStackTrace();
            }
        }
    }

    private void addAbstractText(SolrInputDocument document, String name, List<AbstractText> abstractTexts, Tag tagger) {
        String result = "";
        for (AbstractText abstractText : abstractTexts) {
            result += abstractText.getvalue();
        }
        if (tagger != null){
            result = tagger.tagText(result);
            System.out.println(result);
            mentionText = tagger.getMentionSet();
        }
        document.addField(name, result);
    }

    private void addDateField(SolrInputDocument document, String name, Date date) {
        if (date != null) {
            try {
                document.addField(name, date.getConvertedDate());
            } catch (ParseException e) {
                e.printStackTrace();
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
