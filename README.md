# reflect.

"a mindful website blocker for the productive."

reflect is a digitally mindful chrome extension that encourages users to reflect on their relationship with technology.

when you attempt to visit distracting websites, reflect will ask you what your intention in doing so is. if you have a valid reason, you are allowed to enter the website; if not, you are encouraged to reflect further.

## Directory

A brief overview of the file structure in the repository,

```python
┏╼╾src # holds the source code for the extension (typescript)
╏  ┣╼╾background.ts # handles intent classification, setup, whitelist, etc.
╏  ┣╼╾content.ts # injected into every page, actual block page
╏  ┣╼╾contextMenus.ts # create chrome right click context menu
╏  ┣╼╾nn.ts # tokenizer and classifier class implementation
╏  ┣╼╾options.ts # handle site block changes
╏  ┗╼╾util.ts # random util functions
┣╼╾build # stores intermediate js files compiled from ts [GENERATED]
╏  ┣╼╾background.js
╏  ┣╼╾content.js       # as these are generated, you shouldn't be
╏  ┣╼╾contextMenus.js  # editing these if you need the change
╏  ┣╼╾nn.js            # functionality, do it in `src/`
╏  ┣╼╾options.js
╏  ┗╼╾util.js
┣╼╾dist # distribution folder, select this when loading as extension
╏  ┣╼╾res # resources folder
╏  ╏  ┣╼╾models # stores converted keras models (jackyzha0/reflect-nlp/nlp)
╏  ╏  ╏  ┣╼╾acc%%.%% # where %%.%% represents accuracy on the test set
╏  ╏  ╏  ╏  ┣╼╾group1-shar1of1.bin # binary storage of model weights
╏  ╏  ╏  ╏  ┣╼╾model.json # stores architecture of model
╏  ╏  ╏  ╏  ┗╼╾tokenizer.json # stores word tokenizer mappings
╏  ╏  ╏  ┗╼╾...
╏  ╏  ┣╼╾pages # html files
╏  ╏  ╏  ┣╼╾options.html # page to edit website whitelist
╏  ╏  ╏  ┗╼╾prompt.html # actual block page
╏  ╏  ┗╼╾... # misc. svg files, fonts, css, and images
╏  ┣╼╾src # final source code, generated from `npm run build` [GENERATED]
╏  ┣╼╾jquery-3.4.1.min.js # jquery source code, used for DOM manipulation
╏  ┣╼╾jquery-ui.min.js # jquery ui source code, used for animations
╏  ┗╼╾manifest.json # for chrome to figure out what the extension does/needs
┣╼╾tsconfig.json # config for how typescript compiles to javascript
┣╼╾README.md # this file
┗╼╾package.json # tells npm about the project and how to build it
```

## Building the project (Chrome)

1. Ensure you have [TypeScript](https://www.typescriptlang.org/) installed.
2. Then, install the `node` package dependencies by doing `npm i`.
3. Finally, `npm run build`.

## Building the project (Firefox)

1. Follow steps 1 and 2 of `Building the project (Chrome)`
2. To build, run `npm run ff-build`
3. To see your changes in Firefox, run `npm run ff-run`
4. Finally, to package the extension for distribution, run `ff-pkg`

### Using different intent classifiers

You can find the latest models on our NLP repository here [https://github.com/jackyzha0/reflect-nlp](https://github.com/jackyzha0/reflect-nlp) inside the `nlp` folder. To convert a model, just run `./convert_to_js.sh <model_name>` and drop the result into `dist/res/models/` and call it in `src/background.ts`:

```typescript
// Load ML model stuff
const model: IntentClassifier = new IntentClassifier('acc84.78')
```

## FAQ

### I'm getting errors about `Cannot find namespace/name ___`

-   Install all the required libraries by doing `npm i` in the directory.

### My changes aren't being displayed

-   After saving, build the extension using `npm run build`.
-   Reload the extension in the Chrome Extensions menu
