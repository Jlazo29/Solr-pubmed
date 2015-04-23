package ingestion;

import banner.Tag;
import com.google.common.io.Files;
import org.apache.solr.client.solrj.SolrServerException;
import parsers.PMC.Article;
import parsers.PMCParser;
import parsers.medline.MedlineCitationSet;
import org.apache.log4j.BasicConfigurator;
import org.apache.solr.common.SolrInputDocument;
import parsers.MedlineParser;

import javax.xml.bind.JAXBException;
import java.io.*;
import java.nio.file.NoSuchFileException;
import java.util.*;

/**
 * This class manipulates A {@link ingestion.SolrClient} for indexing {@link org.apache.solr.common.SolrInputDocument}s
 * once they are parsed from XML files. It also holds a {@link banner.Tag}ger to tag text as they are indexed.
 *
 * It supports parsing and indexing of XML files and nothing else.
 * @author Jorge Lazo 2/2015
 */

public class  SolrUtils {
    public static SolrClient client;
    public static Collection<SolrInputDocument> collection;
    public static MedlineParser medlineParser;
    public static PMCParser pmcParser;
    public static Tag tagger;
    public static Integer count;
    public static boolean pmc;

    /**
     * Main function, called from the index.sh script.
     *
     * @param args:
     *            arg[0]: Absolute path to folder containing XML files.
     *            arg[1]: Optional argument, if "del" is specified, all the indexed files will be cleared.
     * @throws java.io.IOException
     * @throws javax.xml.bind.JAXBException
     * @throws org.apache.solr.client.solrj.SolrServerException
     */
    public static void main(String[] args) throws JAXBException, IOException, SolrServerException {
        boolean isDirectory = (new File(args[0]).isDirectory());
        if (!isDirectory){
            System.out.println("\n\nERROR: Invalid arguments passed.");
            System.out.println("\n\nUSAGE: \n\targ[0]: Absolute path to folder containing XML files.\n\targ[1]: Optional argument, if \"del\" is specified, all the indexed files will be cleared.");
            throw new NoSuchFileException(printArgs(args));
        }
        // Initializations
        BasicConfigurator.configure();
        client = new SolrClient(false);
        collection = new ArrayList<>();
        long startTime = System.nanoTime();
        count = 0;
        pmc = false;
        medlineParser = new MedlineParser();
        pmcParser = new PMCParser();
        tagger = new Tag("banner-external/");
        File rootDir = new File(args[0]);

        if(args.length > 1){
            if(args[1].equals("del")){
                System.out.println("----------DELETING ALL INDEXED FILES!----------");
                client.deleteRecords();}
        }

        for (File f : Files.fileTreeTraverser().postOrderTraversal(rootDir)) {
            if (collection.size() >= 500){ //batches of 500
                client.update(collection);
                collection.clear();}
            if (f.isFile()){
                importFile(f,0);}
        }
        if (collection.size() > 0){
            client.update(collection);}

        long elapsedTime = System.nanoTime() - startTime;
        int time =(int) (elapsedTime / 1000000000.0);
        System.out.println(System.getProperty("line.separator") + formatTime(time) +  ". To index " + count + " files!" + System.getProperty("line.separator"));
    }

    /**
     * This method is called on every file inside the XML directory, it tries to unmarshall it as
     * either a PMC or a medline file. If both fail, it wil throw a RuntimeException.
     *
     * @param f: a File to unmarshall and parse upon.
     * @param tries: number of tries (starts as 0 when called using the FileTreeTraverser, so it is
     *             reset on every new file call) if it reaches 2, a RuntimeException is thrown.
     *
     * @throws java.lang.RuntimeException
     */
     public static void importFile(File f, int tries){
        if(pmc){
            try{
                Article article = pmcParser.unmarshall(f);
                String articleType = article.getArticleType();
                if (articleType.equals("case-report") || articleType.equals("research-article")) {
                    SolrInputDocument document = pmcParser.mapToSolrInputDocument(article, tagger);
                    if (document != null){
                        tries = 0;
                        count++;
                        collection.add(document);
                        System.out.println("Successfully parsed " + f.getName());
                    }
                }
                else{
                    System.out.println("This file: " + f.getName() + " is not a research article or a case-report, it is a " + article.getArticleType());
                }
            }catch(Exception e){
                if (tries > 2){
                    e.printStackTrace();
                    throw new RuntimeException("The file supplied is neither medline or PMC! " + f.getName() + " Located at: " + f.getAbsolutePath());
                }
                //Try one more time as medline
                pmc = false;
                tries++;
                importFile(f, tries);}
        }
        else{
            try{
                MedlineCitationSet set = medlineParser.unmarshall(f);
                collection = medlineParser.mapToSolrInputDocumentCollection(set, tagger);
                count += collection.size();
                pmc = false;
                tries = 0;
                System.out.println("Successfully parsed collection " + f.getName());
            }catch(Exception e){
                if (tries > 2){
                    e.printStackTrace();
                    throw new RuntimeException("The file supplied is neither medline or PMC! " + f.getName() + " Located at: " + f.getAbsolutePath());
                }
                //try one more time as pmc
                pmc = true;
                tries++;
                importFile(f, tries);}
        }
    }

    /**
     * Method to pretty print arguments for debugging.
     *
     * @param arguments: String, the arguments passed on to the main function
     *                   to pretty print.
     * @return result: String. a printable version of the arguments supplied
     */
    private static String printArgs(String[] arguments){
        String result = "";
        for (String arg: arguments){
            result += arg + "\n";
        }
        if (result.equals("")){
            return "NO ARGUMENTS SUPPLIED";
        }
        return result;
    }

    /**
     * Method to pretty print time.
     *
     * @param time: int, time taken in seconds.
     * @return result: String, pretty printed time taken.
     */
    private static String formatTime(int time){
        StringBuilder result = new StringBuilder("Total time taken: ");
        if ((time/604800) >= 1) {
            result.append(time / 604800).append("weeks ");
            time = time % 604800;
        }
        if ((time/86400) >= 1){
            result.append(time / 86400).append("days ");
            time = time % 86400;
        }
        if ((time/3600) >= 1){
            result.append(time / 3600).append("hrs ");
            time = (time % 3600);
        }
        if ((time/60) >= 1){
            result.append(time / 60).append("Mins ");
            time = (time % 60);
        }
        result.append(time).append("Secs ");
        return result.toString();
    }
}