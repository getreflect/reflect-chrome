var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import * as tf from '@tensorflow/tfjs';
const stop_words = [
    'i',
    'me',
    'my',
    'myself',
    'we',
    'our',
    'ours',
    'ourselves',
    'you',
    'your',
    'yours',
    'yourself',
    'yourselves',
    'he',
    'him',
    'his',
    'himself',
    'she',
    'her',
    'hers',
    'herself',
    'it',
    'its',
    'itself',
    'they',
    'them',
    'their',
    'theirs',
    'themselves',
    'what',
    'which',
    'who',
    'whom',
    'this',
    'that',
    'these',
    'those',
    'am',
    'is',
    'are',
    'was',
    'were',
    'be',
    'been',
    'being',
    'have',
    'has',
    'had',
    'having',
    'do',
    'does',
    'did',
    'doing',
    'a',
    'an',
    'the',
    'and',
    'but',
    'if',
    'or',
    'because',
    'as',
    'until',
    'while',
    'of',
    'at',
    'by',
    'for',
    'with',
    'about',
    'against',
    'between',
    'into',
    'through',
    'during',
    'before',
    'after',
    'above',
    'below',
    'to',
    'from',
    'up',
    'down',
    'in',
    'out',
    'on',
    'off',
    'over',
    'under',
    'again',
    'further',
    'then',
    'once',
    'here',
    'there',
    'when',
    'where',
    'why',
    'how',
    'all',
    'any',
    'both',
    'each',
    'few',
    'more',
    'most',
    'other',
    'some',
    'such',
    'no',
    'nor',
    'only',
    'own',
    'same',
    'so',
    'than',
    'too',
    'very',
    's',
    't',
    'can',
    'will',
    'just',
    'don',
    'should',
    'now',
    'd',
    'll',
    'm',
    'o',
    're',
    've',
    'y',
    'ain',
    'aren',
    'couldn',
    'didn',
    'doesn',
    'hadn',
    'hasn',
    'haven',
    'isn',
    'ma',
    'mightn',
    'mustn',
    'needn',
    'shan',
    'shouldn',
    'wasn',
    'weren',
    'won',
    'wouldn',
];
const contractions = {
    im: 'i am',
    ill: 'i will',
    dont: 'do not',
    havent: 'have not',
    doesnt: 'does not',
    "he'll": 'he will',
    "she'll": 'she will',
};
export class Tokenizer {
    constructor(modelName, max_len) {
        this.max_len = max_len;
        this.json_url = chrome.runtime.getURL('res/models/' + modelName + '/tokenizer.json');
    }
    // fetch word mapping from tokenizer json
    load_from_json() {
        return __awaiter(this, void 0, void 0, function* () {
            return fetch(this.json_url)
                .then((response) => response.json())
                .then((jsonString) => JSON.parse(jsonString))
                .then((json) => json.config.word_index)
                .then((wordMappingString) => {
                this.wordMap = JSON.parse(wordMappingString);
            });
        });
    }
    cleanStopWords(inputIntent) {
        const split = inputIntent.split(' ');
        split.filter((word) => {
            return stop_words.includes(word);
        });
        return split.join(' ');
    }
    expandContractions(inputIntent) {
        const split = inputIntent.split(' ');
        split.map((word) => {
            if (contractions.hasOwnProperty(word)) {
                return contractions[word];
            }
            else {
                return word;
            }
        });
        return split.join(' ');
    }
    cleanStr(inputIntent) {
        // strip punctuation
        const noPunc = inputIntent.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '');
        // strip capitalization
        const lower = noPunc.toLowerCase();
        // expand contractions
        const expanded = this.expandContractions(lower);
        // clean stop words
        const clean = this.cleanStopWords(expanded);
        // cleanup leftover spaces (2+ spaces to 1)
        return clean.replace(/\s{2,}/g, ' ');
    }
    lookup(key) {
        const val = this.wordMap[key];
        if (val === undefined) {
            return 0;
        }
        else {
            return val;
        }
    }
    // ensure sequence is of max length by padding with zeroes
    pad(tokens) {
        const paddedArray = Array(this.max_len).fill(0, 0, this.max_len);
        for (var i = 0; i < paddedArray.length; i++) {
            if (tokens[i] !== undefined) {
                paddedArray[i + (this.max_len - tokens.length)] = tokens[i];
            }
        }
        return paddedArray;
    }
    tokenize(intent) {
        // clean string and split into array
        const splitString = this.cleanStr(intent).split(' ');
        // lookup each item and return
        const tokens = splitString.map((word) => this.lookup(word));
        return this.pad(tokens);
    }
}
// Load local ML Model
export class IntentClassifier {
    constructor(modelName, seq_max_len = 75) {
        this.tokenizer = new Tokenizer(modelName, seq_max_len);
        this.loadModel(modelName);
    }
    predict(intent, threshold = 0.5) {
        return __awaiter(this, void 0, void 0, function* () {
            // tokenize and convert to 1d tensor
            const tokens = this.tokenizer.tokenize(intent);
            const inputTensor = tf.tensor2d([tokens]);
            // predict
            const predictionTensor = this.model.predict(inputTensor);
            return predictionTensor.data().then((predictions) => {
                // garbage collect finished tensor to prevent mem leak
                tf.dispose(inputTensor);
                // threshold net output
                const confidence = predictions[0];
                return confidence > threshold;
            });
        });
    }
    loadModel(modelName) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('Loading model...');
            // start a performance timer
            const startTime = performance.now();
            // attempt to load model
            const modelDir = chrome.runtime.getURL('res/models/' + modelName + '/model.json');
            this.model = yield tf.loadLayersModel(modelDir);
            // initialize tokenizer
            yield this.tokenizer.load_from_json();
            const totalTime = Math.floor(performance.now() - startTime);
            console.log(`Model loaded and initialized in ${totalTime} ms...`);
            // Warms up the model by causing intermediate tensor values
            // to be built and pushed to GPU.
            this.predict('');
            console.log('Model warmed.');
        });
    }
}
