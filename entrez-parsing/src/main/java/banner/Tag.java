/* 
 Copyright (c) 2007 Arizona State University, Dept. of Computer Science and Dept. of Biomedical Informatics.
 This file is part of the BANNER Named Entity Recognition System, http://banner.sourceforge.net
 This software is provided under the terms of the Common Public License, version 1.0, as published by http://www.opensource.org.  For further information, see the file 'LICENSE.txt' included with this distribution.
 */

package banner;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.io.PrintWriter;
import java.text.BreakIterator;
import java.util.HashSet;

import banner.processing.PostProcessor;
import banner.tagging.CRFTagger;
import banner.tagging.Mention;
import banner.tokenization.Tokenizer;

public class Tag {

	private final Tokenizer tokenizer;
	private final CRFTagger crfTagger;
	PostProcessor postProcessor;
    private HashSet<String> mentionText; //mentions

	public Tag() throws IOException {
		banner.BannerProperties properties = banner.BannerProperties.load("banner-external/banner.properties");
		tokenizer = properties.getTokenizer();
		crfTagger = CRFTagger.load(new File("banner-external/models/model_BC2GM.bin"), properties.getLemmatiser(), properties.getPosTagger(), properties.getPreTagger());
        postProcessor = properties.getPostProcessor();
	}

	/**
	 * @param args
	 */
	public static void main(String[] args) throws IOException {
		String propertiesFilename = args[0]; // banner.properties
		String modelFilename = args[1]; // model.bin
		String inputFilename = args[2]; //sentences to tag
		String outputFilename = args[3]; //output file

		// Get the properties and create the tagger
		banner.BannerProperties properties = BannerProperties.load(propertiesFilename);
		Tokenizer tokenizer = properties.getTokenizer();
		CRFTagger tagger = CRFTagger.load(new File(modelFilename), properties.getLemmatiser(), properties.getPosTagger(), properties.getPreTagger());
		PostProcessor postProcessor = properties.getPostProcessor();

		// Get the input text
		BufferedReader inputReader = new BufferedReader(new FileReader(inputFilename));
		String text = "";
		String line = inputReader.readLine();
		while (line != null) {
			text += line.trim() + " ";
			line = inputReader.readLine();
		}
		inputReader.close();

		// Break the input into sentences, tag and write to the output file
		PrintWriter outputWriter = new PrintWriter(new BufferedWriter(new FileWriter(outputFilename)));
		try {
			BreakIterator breaker = BreakIterator.getSentenceInstance();
			breaker.setText(text);
			int start = breaker.first();
			for (int end = breaker.next(); end != BreakIterator.DONE; start = end, end = breaker.next()) {
				String sentenceText = text.substring(start, end).trim();
				if (sentenceText.length() > 0) {
					Sentence sentence = new Sentence(null, sentenceText);
					tokenizer.tokenize(sentence);
					tagger.tag(sentence);
					System.out.println(sentence.getMentions());
					if (postProcessor != null)
						postProcessor.postProcess(sentence);
					outputWriter.println(sentence.getSGML());
				}
			}
		} finally {
			outputWriter.close();
		}
	}

    /**
     * author: Jorge Luis Lazo
     * Adapated from the Main() function, to be used by any Parser as it indexes text into SolrInputDocuments
     * @param text: The text to tag and extract mentions
     */
	public String tagText(String text) {
        mentionText = new HashSet<>();
        StringBuilder result = new StringBuilder();

		BreakIterator breaker = BreakIterator.getSentenceInstance();
		breaker.setText(text);
		int start = breaker.first();
		for (int end = breaker.next(); end != BreakIterator.DONE; start = end, end = breaker.next()) {
			String sentenceText = text.substring(start, end).trim();
			if (sentenceText.length() > 0) {
				Sentence sentence = new Sentence(null, sentenceText);
				tokenizer.tokenize(sentence);
				crfTagger.tag(sentence);
				mentionText.addAll(sentence.getMentionText());

				if (postProcessor != null) {
                    postProcessor.postProcess(sentence);
                }

                if(sentence.getMentions().size() > 0){
                    StringBuilder sentenceString = new StringBuilder(sentence.getText());

                    for(Mention m : sentence.getMentions()){
                        int start_char = sentenceString.indexOf(m.getText()); //start index
                        int end_char = start_char + m.getText().length(); //end index
                        sentenceString = sentenceString.insert(end_char, "</span>");//insert end tag first (so start char is preserved)
                        sentenceString = sentenceString.insert(start_char, ("<span class=\"" + m.getType().getText() + "\">")); //start tag
                    }
                    result = result.append(sentenceString);
                }
                else{
                    result = result.append(sentence.getText());
                }
			}
		}
        text = text.replaceAll(" [,] ", ", ");
        text = text.replaceAll(" [-] ", "-");
        text = text.replaceAll(" [\\.] ", ". ");

//        System.out.println(text);

        return result.toString();
	}

    public HashSet<String> getMentionSet(){
        return mentionText;
    }
}
