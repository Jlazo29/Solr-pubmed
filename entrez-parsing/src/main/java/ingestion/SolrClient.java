package ingestion;

import org.apache.solr.client.solrj.SolrQuery;
import org.apache.solr.client.solrj.SolrServer;
import org.apache.solr.client.solrj.SolrServerException;
import org.apache.solr.client.solrj.impl.ConcurrentUpdateSolrServer;
import org.apache.solr.client.solrj.impl.HttpSolrServer;
import org.apache.solr.common.SolrDocumentList;
import org.apache.solr.common.SolrInputDocument;

import java.io.IOException;
import java.util.Collection;

/**
 * A {@link org.apache.solr.client.solrj.SolrServer} placeholder, to be used by {@link ingestion.SolrUtils}.
 * @author Jorge Lazo 2/2015
 */

public class SolrClient {
    private static final String BASE_URL = "http://localhost:8983/core0";
    private SolrServer solrServer;

    /**
     * Constructor for a {@link ingestion.SolrClient}.
     *
     * @param useConcurrentUpdate: {@link java.lang.Boolean} whether to use concurrent update or not.
     */
    public SolrClient(boolean useConcurrentUpdate) {
        if (useConcurrentUpdate) {
            this.solrServer = new ConcurrentUpdateSolrServer(BASE_URL, 400000, 4);
        } else {
            this.solrServer = new HttpSolrServer(BASE_URL);
        }
    }

    /**
     * This method is called to index data to Solr.
     * See https://wiki.apache.org/solr/Solrj#Adding_Data_to_Solr
     *
     * @param documents: the {@link java.util.Collection} of {@link org.apache.solr.common.SolrInputDocument}
     *                   to index to Solr.
     */
    public void update(Collection<SolrInputDocument> documents) {
        try {
            solrServer.add(documents);
            solrServer.commit();
        } catch (SolrServerException | IOException e) {
            e.printStackTrace();
        }
    }

    /**
     * Method to delete all indexed records in Solr.
     *
     * @throws IOException
     * @throws SolrServerException
     */
    public void deleteRecords() throws IOException, SolrServerException {
        solrServer.deleteByQuery("*:*");
        solrServer.commit();
    }

    public long getCount() throws SolrServerException {
        SolrQuery q = new SolrQuery("*:*");
        q.setRows(0);  // don't actually request any data
        return solrServer.query(q).getResults().getNumFound();
    }

    public SolrDocumentList getRecords(String query, int maxRows) throws SolrServerException {
        SolrQuery q = new SolrQuery(query);
        q.setRows(maxRows);
        return solrServer.query(q).getResults();
    }
}
