<p align="center">
    <h1 align="center" >reflect.</h1>
    <p align="center">
        "a mindful website blocker for the productive."
    </p>
    <div align="center">
        <a href="https://getreflect.app/">Learn More</a> | <a href="https://chrome.google.com/webstore/detail/reflect-a-mindful-website/bicebchdpeichdlmoaflplakefkjkade">Install for Chrome</a> | <a href="https://addons.mozilla.org/en-US/firefox/addon/reflect-app/">Install for Firefox</a>
    </div>
    <br />
    <img src="assets/video_demo.gif" alt="Video Demo">
</p>

reflect is a digitally mindful chrome extension that encourages users to reflect on their relationship with technology.

when you attempt to visit distracting websites, reflect will ask you what your intention in doing so is. if you have a valid reason, you are allowed to enter the website; if not, you are encouraged to reflect further.

## Building the project
1. Install the package dependencies by doing `npm i`
2. Run `npm run build`
3. Load the extension in the Chrome Extensions menu
   * Go to extensions > enable developer mode (top right corner)
   * Click load unpacked, select the `dist` folder
## Developing
When developing, you will likely want to use a different workflow that is slightly faster. This assumed you already 1) Have all the dependencies installed 2) Have run `npm run build` once already and 3) Have the extension installed

1. Run `npm run watch`
2. Reload extension in the Chrome Extensions menu
   * Go to extension > under reflect, press the refresh icon

### Using different intent classifiers

You can find the latest models on our NLP repository here [https://github.com/jackyzha0/reflect-nlp](https://github.com/jackyzha0/reflect-nlp) inside the `nlp` folder. To convert a model, just run `./convert_to_js.sh <model_name>` and drop the result into `dist/res/models/` and call it in `src/background.ts`:

```typescript
// Load ML model stuff
const model: IntentClassifier = new IntentClassifier('acc84.78')
```