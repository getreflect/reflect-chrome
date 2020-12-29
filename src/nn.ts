// nn.ts is the definition for the NLP model
import * as tf from '@tensorflow/tfjs'
import { getStorage } from './storage'

const stop_words: string[] = [
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
]

const contractions: Record<string, string> = {
  im: 'i am',
  ill: 'i will',
  dont: 'do not',
  havent: 'have not',
  doesnt: 'does not',
  "he'll": 'he will',
  "she'll": 'she will',
}

export class Tokenizer {
  json_url: string // tokenizer json url
  max_len: number // maximum sequence length
  wordMap: Map<string, number> // mapping from word to token

  constructor(modelName: string, max_len: number) {
    this.max_len = max_len
    this.json_url = chrome.runtime.getURL('res/models/' + modelName + '/tokenizer.json')
  }

  // fetch word mapping from tokenizer json
  async load_from_json(): Promise<void> {
    return fetch(this.json_url)
      .then((response) => response.json())
      .then((jsonString) => JSON.parse(jsonString))
      .then((json) => json.config.word_index)
      .then((wordMappingString) => {
        this.wordMap = JSON.parse(wordMappingString)
      })
  }

  private cleanStopWords(inputIntent: string): string {
    const split: string[] = inputIntent.split(' ')
    split.filter((word) => {
      return stop_words.includes(word)
    })

    return split.join(' ')
  }

  private expandContractions(inputIntent: string): string {
    const split: string[] = inputIntent.split(' ')
    split.map((word) => {
      if (contractions.hasOwnProperty(word)) {
        return contractions[word]
      } else {
        return word
      }
    })

    return split.join(' ')
  }

  private cleanStr(inputIntent: string): string {
    // strip punctuation
    const noPunc: string = inputIntent.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')

    // strip capitalization
    const lower: string = noPunc.toLowerCase()

    // expand contractions
    const expanded: string = this.expandContractions(lower)

    // clean stop words
    const clean: string = this.cleanStopWords(expanded)

    // cleanup leftover spaces (2+ spaces to 1)
    return clean.replace(/\s{2,}/g, ' ')
  }

  lookup(key: string): number {
    const val: number | undefined = this.wordMap[key]
    if (val === undefined) {
      return 0
    } else {
      return val
    }
  }

  // ensure sequence is of max length by padding with zeroes
  pad(tokens: number[]): number[] {
    const paddedArray: number[] = Array(this.max_len).fill(0, 0, this.max_len)

    for (var i = 0; i < paddedArray.length; i++) {
      if (tokens[i] !== undefined) {
        paddedArray[i + (this.max_len - tokens.length)] = tokens[i]
      }
    }

    return paddedArray
  }

  tokenize(intent: string): number[] {
    // clean string and split into array
    const splitString: string[] = this.cleanStr(intent).split(' ')

    // lookup each item and return
    const tokens: number[] = splitString.map((word) => this.lookup(word))
    return this.pad(tokens)
  }
}

// Load local ML Model
export class IntentClassifier {
  model: tf.LayersModel
  modelName: string
  tokenizer: Tokenizer
  threshold: number

  constructor(modelName: string, seq_max_len: number = 75) {
    this.tokenizer = new Tokenizer(modelName, seq_max_len)
    this.modelName = modelName
    this.reload()
  }

  reload() {
    this.loadModel(this.modelName)
    getStorage().then((storage) => {
      this.threshold = storage.predictionThreshold ?? 0.5
    })
  }

  async predict(intent: string): Promise<boolean> {
    // tokenize and convert to 1d tensor
    const tokens: number[] = this.tokenizer.tokenize(intent)
    const inputTensor: tf.Tensor = tf.tensor2d([tokens])

    // predict
    const predictionTensor: tf.Tensor = this.model.predict(inputTensor) as tf.Tensor
    return predictionTensor.data().then((predictions) => {
      // garbage collect finished tensor to prevent mem leak
      tf.dispose(inputTensor)

      // threshold net output
      const confidence: number = predictions[0]
      return confidence > this.threshold
    })
  }

  async loadModel(modelName: string) {
    console.log('Loading model...')

    // start a performance timer
    const startTime = performance.now()

    // attempt to load model
    const modelDir = chrome.runtime.getURL('res/models/' + modelName + '/model.json')
    this.model = await tf.loadLayersModel(modelDir)

    // initialize tokenizer
    await this.tokenizer.load_from_json()

    const totalTime = Math.floor(performance.now() - startTime)
    console.log(`Model loaded and initialized in ${totalTime} ms...`)

    // Warms up the model by causing intermediate tensor values
    // to be built and pushed to GPU.
    this.predict('')
    console.log('Model warmed.')
  }
}
