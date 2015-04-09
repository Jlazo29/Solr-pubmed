# Author: Jorge Lazo
# Purpose: Script to download PMC/medline files from the medline ftp server using wget.

cd ..;
pwd;
mkdir files;

if [ $# -eq 0 ]; then
	echo "	ERROR: No Arguments supplied to script!";
	echo  "	USAGE: pass either 'pmc' or 'medline' arguments; 
			pmc: 	Downloads the open access subset, this should be done first.
				WARNING: you need at least 50GB of space to download & extract. 
			medline: Downloads the full medline baseline subset, this should be done second. 
				 WARNING: you need at least 50GB of space to download & extract.

		This script downloads the files from the ftp server into the 'files' folder of solr-pubmed,
		you can just simply use wget to get them, as the script simply runs this. 
		Note that for the medline baseline access you need a valid license IP access."
	exit 1;
fi

if [ "$1" = "pmc" ]; 
then
	cd files;
	wget  -erobots=off  "ftp://ftp.ncbi.nlm.nih.gov/pub/pmc/articles.A-B.tar.gz"
	wget  -erobots=off  "ftp://ftp.ncbi.nlm.nih.gov/pub/pmc/articles.C-H.tar.gz"
	wget  -erobots=off  "ftp://ftp.ncbi.nlm.nih.gov/pub/pmc/articles.I-N.tar.gz"
	wget  -erobots=off  "ftp://ftp.ncbi.nlm.nih.gov/pub/pmc/articles.O-Z.tar.gz"


elif [ "$1" = "medline" ]; 
then
	cd files;
	wget -r --reject "*.md5" "ftp://ftp.nlm.nih.gov/nlmdata/.medleasebaseline/zip/"

fi
