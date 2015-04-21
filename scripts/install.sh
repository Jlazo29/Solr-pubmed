# Author: Jorge Lazo
# Purpose: Initial installation of maven goals and sub project dependencies.

# First install maven local dependencies required by BANNER
cd ../entrez-parsing/

mvn install:install-file -Dfile="src/main/resources/libs/banner.jar" -DgroupId=banner -DartifactId=banner -Dversion=1.0 -Dpackaging=jar
mvn install:install-file -Dfile="src/main/resources/libs/bsh.jar" -DgroupId=bsh -DartifactId=bsh -Dversion=1.0 -Dpackaging=jar
mvn install:install-file -Dfile="src/main/resources/libs/dragontool.jar" -DgroupId=dragontool -DartifactId=dragontool -Dversion=1.0 -Dpackaging=jar
mvn install:install-file -Dfile="src/main/resources/libs/heptag.jar" -DgroupId=heptag -DartifactId=heptag -Dversion=1.0 -Dpackaging=jar
mvn install:install-file -Dfile="src/main/resources/libs/jdom-1.0.jar" -DgroupId=jdom -DartifactId=jdom -Dversion=1.0 -Dpackaging=jar
mvn install:install-file -Dfile="src/main/resources/libs/jwnl-1.3.jar" -DgroupId=jwnl -DartifactId=jwnl -Dversion=1.3 -Dpackaging=jar
mvn install:install-file -Dfile="src/main/resources/libs/medpost.jar" -DgroupId=medpost -DartifactId=medpost -Dversion=1.0 -Dpackaging=jar
mvn install:install-file -Dfile="src/main/resources/libs/openjgraph.jar" -DgroupId=openjgraph -DartifactId=openjgraph -Dversion=1.0 -Dpackaging=jar
mvn install:install-file -Dfile="src/main/resources/libs/secondstring.jar" -DgroupId=secondstring -DartifactId=secondstring -Dversion=1.0 -Dpackaging=jar

# Now install the full project
cd ../;
mvn install;

#Finally install some python dependencies for the frontend
cd solr-frontend;
virtualenv . ;
source bin/activate ;
pip install -r requirements.txt
