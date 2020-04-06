import * as tf from '@tensorflow/tfjs';

export class Tokenizer {

	constructor(modelName: string) {
		const url = chrome.runtime.getURL('res/models/'+modelName+'/tokenizer.json');

		fetch(url)
		    .then((response) => response.json())
		    .then((json) => {
		    	console.log(json);
		    });
	}

	tokenize(cleanedIntent: string): number[] {
		// stub
		return [];
	}
}

// Load local ML Model
export class IntentClassifier {

	model: tf.GraphModel;
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
		try {
			const modelDir = chrome.runtime.getURL('res/models/'+modelName+'/model.json');
			this.model = await tf.loadGraphModel(modelDir);

			// Warms up the model by causing intermediate tensor values
			// to be built and pushed to GPU.
			// tf.tidy(() => {
			// 	this.model.predict(tf.zeros([1, IMAGE_SIZE, IMAGE_SIZE, 3]));
			// });

			const totalTime = Math.floor(performance.now() - startTime);
			console.log(`Model loaded and initialized in ${totalTime} ms...`);
		} catch {
			console.error(`Unable to load model.`);
		}
	}
}