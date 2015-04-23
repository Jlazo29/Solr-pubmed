package parsers;

import org.apache.commons.io.FileUtils;
import org.junit.Before;
import org.junit.Test;
import parsers.PMC.Article;
import parsers.PMCParser;

import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
import java.net.URL;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

/**
 * Created by jlazo on 4/22/15.
 */
public class PMCParserTest {
    private static final String TEST_FILE= "/samples/PMC_sample.xml";
    private PMCParser ingestion;
    private File testFile;

    @Before
    public void setUp() throws Exception {
        ingestion = new PMCParser();
        testFile = getTestFile();
    }

    private File getTestFile() {
        URL url = PMCParser.class.getResource(TEST_FILE);
        return new File(url.getFile());
    }

    @Test
    public void testUnmarshallFromInputStream() throws Exception {
        assertTrue(testFile.exists());
        Article article = ingestion.unmarshall(new FileInputStream(testFile));
        assertNotNull(article);
    }

    @Test
    public void testUnmarshallFromFile() throws Exception {
        assertTrue(testFile.exists());
        parsers.PMC.Article article = ingestion.unmarshall(testFile);
        assertNotNull(article);
    }

    @Test
    public void testUnmarshallSetsJournalTitle() throws Exception {
        parsers.PMC.Article article = ingestion.unmarshall(testFile);
        assertEquals("Envelope structure of Synechococcus sp. WH8113, a nonflagellated swimming cyanobacterium", article.getFront().getArticleMeta().getTitleGroup().getArticleTitle().getText());
    }
}
