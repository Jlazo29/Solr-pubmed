# Author: Jorge Lazo
# Purpose: Script to Train a model using the bc2.TrainModel Java class of BANNER. 

#ARGUMENTS -- MAKE SURE TO PASS THEM CORRECTLY!
#EXAMPLE --  bash train.sh ../entrez-parsing/banner-external/bc2geneMention/train/train.in ../entrez-parsing/banner-external/bc2geneMention/train/GENE.eval ../entrez-parsing/banner-external/models/model2_BC2GM.bin 0.01
if [ $# -eq 0 ]; then
	echo "	ERROR: No Arguments supplied to script!";
	echo  "	USAGE: 
			arg[0]: Absolute path location of BioCreative 2 Gene Mention sentence file ('train.in')
			arg[1]: location of BioCreative 2 Gene Mention mention file ('GENE.eval')
			arg[2]: name & location of the model to output (eg passing '../entrez-parsing/banner-external/models/example_model.bin'
				Will create example_model.bin inside the models directory after the training is done. (DOES NOT CREATE NON-EXISTANT DIRS!)
			arg[3]: (OPTIONAL) proportion of the training data to use. Specify e.g. 0.01 to quickly verify everything is working. Leave off to use all of the data.

		Make absolutely sure that there are no other file types or compressed folders inside the directory.
		Full training could take hours.";
	exit 1;
else
	echo "Compiling bc2.TrainModel..";
fi

# 1: Compile and run the main Java sources
cd ../entrez-parsing/;
mvn compile;

echo "Running bc2.TrainModel..";
mvn  -e exec:java -Dexec.mainClass="bc2.TrainModel" -Dexec.args="banner-external/banner.properties $1 $2 $3 $4" -Dexec.MAVEN_OPTS=-Xmx2G;
echo "Done!"

# 3: Return files to schema folder

