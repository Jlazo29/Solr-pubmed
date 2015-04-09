package ingestion;

import com.google.common.collect.TreeTraverser;
import com.google.common.io.Files;
import com.google.common.io.Resources;
import parsers.PMC.Article;
import parsers.PMCParser;
import parsers.medline.MedlineCitationSet;
import org.apache.log4j.BasicConfigurator;
import org.apache.solr.common.SolrInputDocument;
import parsers.MedlineParser;
import parsers.PubMedParser;
import parsers.pubmed.PubmedArticleSet;

import java.io.*;
import java.util.*;

public class  SolrUtils {
    public static final String SAMPLE_FILE = "samples/medsamp2014.xml";
    public static final String SAMPLE_FILE_2 = "samples/pubmed_sample_2009.xml";
    public static SolrClient client;
    public static Collection<SolrInputDocument> collection;
    public static MedlineParser medlineParser;
    public static PMCParser pmcParser;
    public static Integer count;
    public static boolean pmc;

    public static void deleteRecords() throws Exception {
        BasicConfigurator.configure();
        SolrClient client = new SolrClient(false);
        client.deleteRecords();
    }

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

    public static void importFile(File f, int tries){
        if(pmc){
            try{
                Article article = pmcParser.unmarshall(f);
                String articleType = article.getArticleType();
                if (articleType.equals("case-report") || articleType.equals("research-article")) {
                    SolrInputDocument document = pmcParser.mapToSolrInputDocument(article);
                    count++;
                    if (document != null){
                        collection.add(document);
                        System.out.println("Successfully parsed " + f.getName());
                    }
                    else{
                        System.out.println("Could not parse " + f.getName());
                    }
                }
                else{
                    System.out.println("This file: " + f.getName() + " is not a research article or a case-report, it is a " + article.getArticleType());
                }
            }catch(Exception e){
                if (tries > 2){
                    e.printStackTrace();
                    return;
                }
                //Try again with medline
                pmc = false;
                tries++;
                importFile(f, tries);}
        }
        else{
            try{
                MedlineCitationSet set = medlineParser.unmarshall(f);
                collection = medlineParser.mapToSolrInputDocumentCollection(set);
                count += collection.size();
                pmc = false;
                System.out.println("Successfully parsed collection " + f.getName());
            }catch(Exception e){
                if (tries > 2){
                    e.printStackTrace();
                    return;
                }
                //try again with pmc
                pmc = true;
                tries++;
                importFile(f, tries);}
        }
    }

    /**
     *
     * @param args:
     *            arg[0]: Absolute path to folder containing XML files.
     *            arg[1]: Optional argument, if "del" is specified, all the indexed files will be cleared.
     * @throws Exception
     */
    public static void main(String[] args) throws Exception {

        try{
            String arg1 = args[0];
        }catch(Exception e){
            e.printStackTrace();
            System.out.println("\n\nERROR: Invalid arguments passed.\nArguments passed: " + printArgs(args));
            System.out.println("\n\nUSAGE: \n\targ[0]: Absolute path to folder containing XML files.\n\targ[1]: Optional argument, if \"del\" is specified, all the indexed files will be cleared.");
            return;
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
        File rootDir = new File(args[0]);

        if(args.length > 1){
            if(args[1].equals("del")){
                client.deleteRecords();
            }
        }

        for (File f : Files.fileTreeTraverser().postOrderTraversal(rootDir)) {
            if (collection.size() >= 500){ //batches of 500
                client.update(collection);
                collection.clear();
            }
            if (f.isFile()){
                importFile(f,0);
            }
        }
        if (collection.size() > 0){
            client.update(collection);

        }

        long elapsedTime = System.nanoTime() - startTime;
        String time = String.valueOf(elapsedTime / 60000000000.0 );
        System.out.println(System.getProperty("line.separator") + "Took " + time + " minutes to index " + count + " files!" + System.getProperty("line.separator"));

    }

}
