import * as tf from '@tensorflow/tfjs';

function cleanStr(inputIntent: string ) : string {
	// strip punctuation

	// strip capitalization

	// remove personal prefix

} 

function tokenize(cleanedIntent: string) : number[] {
	
}

class IntentClassifier {

	model: tf.GraphModel;
	readonly SEQ_MAX_LEN = 75;
	readonly myReadOnlyProperty = 1;

	constructor() {
		this.loadModel();
	}


  async loadModel() {
	console.log('Loading model...');

	// start a performance timer
	const startTime = performance.now();

	// attempt to load model
	try {
	  this.model = await tf.loadGraphModel('res/models/acc82.61/model.js');

	  // Warms up the model by causing intermediate tensor values
	  // to be built and pushed to GPU.
	  tf.tidy(() => {
		this.model.predict(tf.zeros([1, IMAGE_SIZE, IMAGE_SIZE, 3]));
	  });

	  const totalTime = Math.floor(performance.now() - startTime);
	  console.log(`Model loaded and initialized in ${totalTime} ms...`);
	} catch {
	  console.error(`Unable to load model.`);
	}
  }
}