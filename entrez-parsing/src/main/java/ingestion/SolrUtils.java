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

    public static void deleteRecords() throws Exception {
        BasicConfigurator.configure();
        SolrClient client = new SolrClient(false);
        client.deleteRecords();
    }

    public static void importMedline(File f) {
        try{
            MedlineCitationSet set = medlineParser.unmarshall(f);
            collection = medlineParser.mapToSolrInputDocumentCollection(set);
            count += collection.size();
            client.update(collection);
        }catch(Exception e){
            System.out.println("Could not index collection at file " + f.getName() + " at " + f.getAbsolutePath());
            e.printStackTrace();
        }
    }


    public static void importPMC(File f) throws Exception {
        try{
            Article article = pmcParser.unmarshall(f);
            String articleType = article.getArticleType();
            if (articleType.equals("case-report") || articleType.equals("research-article")) {
                SolrInputDocument document = pmcParser.mapToSolrInputDocument(article);
                count++;
                collection.add(document);
                System.out.println("Successfully parsed" + f.getName());
            }
            else{
                System.out.println("This file: " + f.getName() + " is not a research article or a case-report, it is a " + article.getArticleType());
            }

        }catch(Exception e){
            System.out.println("Could not index file " + f.getName() + " at " + f.getAbsolutePath());
            e.printStackTrace();
        }
    }

    /**
     *
     * @param args:
     *            arg[0]: type of parser to use. Possible Strings "medline" or "pmc".
     *            arg[1]: Absolute root directory to extract XML files. R0epresented as String.
     *            arg[2]: if "del" is passed as third argument, files are deleted from solr.
     * @throws Exception
     */
    public static void main(String[] args) throws Exception {
        BasicConfigurator.configure();
        client = new SolrClient(false);
        collection = new ArrayList<>();
        long startTime = System.nanoTime();
        count = 0;

        if(args[2].equals("del")){
            client.deleteRecords();
        }
        if(args[0].equals("medline")){
            medlineParser = new MedlineParser();
            File rootDir = new File(args[1]);
            for (File f : Files.fileTreeTraverser().postOrderTraversal(rootDir)) {
                if (f.isFile()){
                    importMedline(f);
                }
            }
        }
        if(args[0].equals("pmc")){
            pmcParser = new PMCParser();
            File rootDir = new File(args[1]);
            TreeTraverser<File> tree = Files.fileTreeTraverser();
            for (File f : tree.postOrderTraversal(rootDir)) {
                if (collection.size() >= 500){ //batches of 500
                    client.update(collection);
                    collection.clear();
                }
                if (f.isFile()){
                    importPMC(f);
                }
            }
            client.update(collection);
        }


        long elapsedTime = System.nanoTime() - startTime;
        String time = String.valueOf(elapsedTime / 1000000000.0 );
        System.out.println(System.getProperty("line.separator") + "Took " + time + " seconds to index " + count + " files!" + System.getProperty("line.separator"));

    }

}
