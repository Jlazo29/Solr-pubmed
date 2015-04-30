/* 
 Copyright (c) 2007 Arizona State University, Dept. of Computer Science and Dept. of Biomedical Informatics.
 This file is part of the BANNER Named Entity Recognition System, http://banner.sourceforge.net
 This software is provided under the terms of the Common Public License, version 1.0, as published by http://www.opensource.org.  For further information, see the file 'LICENSE.txt' included with this distribution.
 */

package bc2;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.IOException;
import java.io.PrintStream;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;

import banner.BannerProperties;
import banner.Sentence;
import banner.tagging.CRFTagger;
import banner.tokenization.Tokenizer;

/**
 * This class enables the training of new model.bin files, using training sentences files and
 * mention files from different corpora. Make sure to specify the location and name of the model
 * output (eg "../entrez-parsing/banner-external/models/example_model.bin" ) will create said model
 * (directory needs to exist). Training could take an extended amount of time depending on training set (minutes to hours).
 */

public class TrainModel extends Base
{
	/**
	 * Main function. called by train.sh with specified parameters.
	 * @param args:
	 *				$1 = location of BioCreative 2 Gene Mention sentence file ('train.in')
	 *				$2 = location of BioCreative 2 Gene Mention mention file ('GENE.eval')
	 *				$3 = name & location of the model to output
	 *				$4 (optional) = proportion of the training data to use. Specify e.g. 0.01 to quickly verify everything is working. Leave off to use all of the data.
	 * @throws IOException
	 */
	public static void main(String[] args) throws IOException {
		BannerProperties properties = BannerProperties.load(args[0]);
		BufferedReader sentenceFile = new BufferedReader(new FileReader(args[1]));
		String tagFilename = args[2];
		String modelName = args[3];
		Double percentage = null;
		if (args.length == 5)
			percentage = Double.valueOf(args[4]);

		properties.log();
		PrintStream sysOut = System.out;

		BufferedReader tagFile = new BufferedReader(new FileReader(tagFilename));
		HashMap<String, LinkedList<Base.Tag>> tags = Base.getTags(tagFile);
		tagFile.close();

		Tokenizer tokenizer = properties.getTokenizer();
		String line = sentenceFile.readLine();
		List<Sentence> sentences = new ArrayList<Sentence>();
		while (line != null) {
			if (percentage == null || Math.random() < percentage.doubleValue()) {
				int space = line.indexOf(' ');
				String id = line.substring(0, space).trim();
				String sentence = line.substring(space).trim();
				sentences.add(getSentence(id, sentence, tokenizer, tags));
			}
			line = sentenceFile.readLine();
		}
		sentenceFile.close();

		sysOut.println("Getting sentence list");

		sysOut.println("Training data loaded, starting training");
		CRFTagger tagger = CRFTagger.train(sentences, properties.getOrder(), properties.isUseFeatureInduction(), properties.getTagFormat(), properties.getTextDirection(), properties.getLemmatiser(),
				properties.getPosTagger(), properties.isUseNumericNormalization(), properties.getPreTagger(), properties.getRegexFilename());
		sysOut.println("Training complete, saving model");
		tagger.write(new File(modelName));
	}

}
