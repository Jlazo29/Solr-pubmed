An [Apache Solr](http://lucene.apache.org/solr/) based tool for fetching, indexing and searching PubMed/MEDLINE records.

Requirements
---------
* [Apache Maven](http://maven.apache.org/download.cgi)
* [Oracle JDK 7](http://www.oracle.com/technetwork/java/javase/downloads/jdk7-downloads-1880260.html)
* Python 2.7
* [pip](https://pip.pypa.io/en/latest/index.html)

[Anaconda](https://store.continuum.io/cshop/anaconda/) is an easy to install Python distribution that doesn’t require root or local admin privileges.

If you use the default Python, make sure you have the python-dev package installed. It contains headers needed for building some of the Python packages.

[virtualenv](https://virtualenv.pypa.io/en/latest/) is recommended for create isolated Python development environments.

Get the code
------------
This repo contains submodules, so use the following command to clone the repository and it's dependencies:

    git clone --recursive https://github.com/Jlazo29/solr-pubmed.git
    
If you've already cloned the repository and you need to initialize the submodules you can run:

    git submodule init
    git submodule update

Installation
---------
To install the project, go to the scripts folder and run install.sh

    cd solr-pubmed
    cd scripts
    bash install.sh

Alternatively, you can install them by running maven and pip independently:

    	cd solr-pubmed
    	mvn install

and then:

    cd solr-pubmed/solr-frontend
    virtualenv .
    source bin/activate
    pip install -r requirements.txt
    
The build artifacts will be installed to your local maven repository (typically `~/.m2` on Unix systems or `C:\Documents and Settings\{your-username}\.m2` on Windows). This is a one time installation only.


Starting the Solr Server and Frontend
-------------
To run the configured Solr instance on a local Jetty server, use the `start.sh script`. It accepts one argument only, either "run" or "stop":

    bash start.sh run

Note that the Jetty server will keep running in the background, to terminate it you need to use the sript or run `mvn jetty:stop` in the solr-config folder.

Alternatively, the independant commands to run the solr server are:

    cd solr-pubmed/solr-config
    mvn jetty:run-war

While the commands to run the frontend:

    cd solr-pubmed/solr-frontend
    python app.py

The Solr instance will run on [http://localhost:8983/core0/](http://localhost:8983/core0/) by default.
The Flask server will run on [http://localhost:5000](http://localhost:5000) by default.

Downloading Pubmed and PMC records
-------------
To download the Pubmed/PMC files, you can use wget to download them directly from the ftp server:

The script `download.sh` will facilitate this; running `bash download.sh pmc` will download the whole pubmed open access subset through wget into the "files" folder. After it finishes, running `bash download.sh medline` will download the medline subset with the same configuration.
Each of this downloads is greater than 5GB so the time taken will depend on the download speed. You can also use wget to manually download smaller subsets, opening this script is a good example to start with. 

Indexing the files
-------------
The indexing is done through the main class of ingestion.SolrUtils, inside the entrez-parsing folder. To compile and run it, simply run `bash index.sh`, this script takes 1 mandatory first argument and a optional second argument. The first one is the absolute path to the directory in which the XML files are located (if downloaded through the script they will be located in `solr-pubmed/files`). The second possible argument is "del" and it tells Solr to delete all the files previous to indexing. 

Note that the Solr instance needs to be running in order for the indexing to take place, and SolrUtils will only work with XML files, all other files and compressed folders cannot be in the same folder. 
    
If you're on Windows using the Anaconda python distribution, you may run into issues installing the MarkupSafe package. If so, you can solve this issue by modifying `cygwinccompiler.py` as desribed here: [http://bugs.python.org/issue21821](http://bugs.python.org/issue21821)


The Flask server will run on [http://localhost:5000](http://localhost:5000) by default.
