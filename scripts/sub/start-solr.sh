echo "Starting Solr Server..";
cd ../../solr-config/;
pwd;
mvn jetty:run-war;
