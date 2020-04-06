import * as tf from '@tensorflow/tfjs';

export class Tokenizer {

	wordMap: Map<string, string>;

	constructor(modelName: string) {
		const url = chrome.runtime.getURL('res/models/'+modelName+'/tokenizer.json');

		fetch(url)
		    .then((response) => response.json())
		    .then((jsonString) => JSON.parse(jsonString))
		    .then((json) => json.config.word_index)
		    .then((wordMappingString) => this.wordMap = JSON.parse(wordMappingString));
	}

	lookup(key: string): number {
		const val: (string | undefined) = this.wordMap.get(key);

		if (!val) {
			return 0;
		} else {
			return parseInt(val);
		}
	}

	tokenize(cleanedIntent: string): number[] {
		// stub
		return [];
	}
}

// Load local ML Model
export class IntentClassifier {

	model: tf.LayersModel;
	tokenizer: Tokenizer;
	readonly SEQ_MAX_LEN = 75;

	constructor(modelName: string) {
		this.tokenizer = new Tokenizer(modelName);
		this.loadModel(modelName);
	}

	pred(intent: string): boolean {
		// stub
		return false;
	}

	async loadModel(modelName: string) {
		console.log('Loading model...');

		// start a performance timer
		const startTime = performance.now();

		// attempt to load model
		const modelDir = chrome.runtime.getURL('res/models/'+modelName+'/model.json');
		this.model = await tf.loadLayersModel(modelDir);

		// Warms up the model by causing intermediate tensor values
		// to be built and pushed to GPU.
		// tf.tidy(() => {
		// 	this.model.predict(tf.zeros([1, IMAGE_SIZE, IMAGE_SIZE, 3]));
		// });

		const totalTime = Math.floor(performance.now() - startTime);
		console.log(`Model loaded and initialized in ${totalTime} ms...`);
	}
}