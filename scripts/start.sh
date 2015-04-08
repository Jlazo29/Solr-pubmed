# Author: Jorge Lazo
# Purpose: Script to start a Solr Instance, as well as run the frontend web application (flask). 

if [ $# -eq 0 ]; then
	echo "	ERROR: No Arguments supplied to script!";
	echo  "	USAGE: pass either 'run' or 'stop' arguments; 
			run: 	Instanciates a solr server and runs the flask web application. 
			stop:	Stops the Solr Server.

		Even if you exit the command line, the solr server will still run on the background, 
		you can either rerun this script with the 'stop' command, 
		or use 'ps' to find the PID (its a java app) and kill it.
		"
	exit 1;
fi

if [ "$1" = "run" ]; 
then
	cd sub/;
	pwd;
	sh -x start-solr.sh & sh -x start-frontend.sh;

elif [ "$1" = "stop" ]; 
then
	cd ../solr-config/; 
	mvn jetty:stop;
fi



