import * as tf from '@tensorflow/tfjs';

export class Tokenizer {

	json_url: string;
	max_len: number;
	wordMap: Map<string, string>;

	constructor(modelName: string, max_len: number) {
		this.max_len = max_len;
		this.json_url = chrome.runtime.getURL('res/models/'+modelName+'/tokenizer.json');
	}

	async load_from_json(): Promise<void> {
		return fetch(this.json_url)
		    .then((response) => response.json())
		    .then((jsonString) => JSON.parse(jsonString))
		    .then((json) => json.config.word_index)
		    .then((wordMappingString) => {this.wordMap = JSON.parse(wordMappingString)});
	}

	cleanStr(inputIntent: string): string {
		// strip punctuation
		const noPunc = inputIntent.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")

		// strip capitalization
		const lower = noPunc.toLowerCase()

		// remove personal prefix
		const noPrefix = lower.replace("im ", "")
							  .replace("i ", "")

		// cleanup leftover spaces (2+ spaces to 1)
		return noPrefix.replace(/\s{2,}/g, " ");
	}

	lookup(key: string): number {
		const val: (number | undefined) = this.wordMap[key]

		if (val == undefined) {
			return 0
		} else {
			return val
		}
	}

	pad(tokens: number[]): number[] {
		let paddedArray = new Array(this.max_len).fill(0);
		for (var i = 0; i < tokens.length; i++) {
			paddedArray[i] = tokens[i]
		}

		return paddedArray
	}

	tokenize(intent: string): number[] {
		// clean string and split into array
		const splitString: string[] = this.cleanStr(intent).split(" ")

		console.log(this.lookup("asdfasdfasdfsdf"))

		// lookup each item and return
		const tokens: number[] = splitString.map((word) => (this.lookup(word)))
		return this.pad(tokens);
	}
}

// Load local ML Model
export class IntentClassifier {

	model: tf.LayersModel;
	tokenizer: Tokenizer;
	readonly SEQ_MAX_LEN = 75;

	constructor(modelName: string) {
		this.tokenizer = new Tokenizer(modelName, this.SEQ_MAX_LEN);
		this.loadModel(modelName);
	}

	predict(intent: string, threshold: number = 0.5): boolean {
		// tokenize and convert to 1d tensor
		const tokens: number[] = this.tokenizer.tokenize(intent);
		const inputTensor: tf.Tensor = tf.tensor2d([tokens]);

		// predict
		(this.model.predict(inputTensor) as tf.Tensor).data().then(predictions => {
			// get raw prediction tensor
			const confidenceTensor: tf.Tensor = tf.argMax(predictions);

			// sync tensor value from gpu to cpu
			const confidence: number = confidenceTensor.dataSync()[0];

			if (confidence > 0.5) {
				return true;
			}
		})
		return false;
	}

	async loadModel(modelName: string) {
		console.log('Loading model...');

		// start a performance timer
		const startTime = performance.now();

		// attempt to load model
		const modelDir = chrome.runtime.getURL('res/models/'+modelName+'/model.json');
		this.model = await tf.loadLayersModel(modelDir);

		// initialize tokenizer
		await this.tokenizer.load_from_json();

		const totalTime = Math.floor(performance.now() - startTime);
		console.log(`Model loaded and initialized in ${totalTime} ms...`);

		// Warms up the model by causing intermediate tensor values
		// to be built and pushed to GPU.
		tf.tidy(() => this.predict(""));
		console.log("Model warmed.")
	}
}