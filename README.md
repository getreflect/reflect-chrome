# reflect.
"a mindful website blocker for the productive."

reflect is a digitally mindful chrome extension that encourages users to reflect on their relationship with technology. 

when you attempt to visit distracting websites, reflect will ask you what your intention in doing so is. if you have a valid reason, you are allowed to enter the website; if not, you are encouraged to reflect further. 

## Directory
A brief overview of the file structure in the repository,
```python
src # holds the source code for the extension (typescript)
 | - background.ts # handles intent classification, setup, whitelist, etc.
 | - content.ts # injected into every page, actual block page
 | - contextMenus.ts # create chrome right click context menu
 | - nn.ts # tokenizer and classifier class implementation
 | - options.ts # handle site block changes
 | - util.ts # random util functions
build # stores intermediate js files compiled from ts [GENERATED]
 | - background.js
 | - content.js       # as these are generated, you shouldn't be 
 | - contextMenus.js  # editing these if you need the change
 | - nn.js            # functionality, do it in `src/`
 | - options.js
 | - util.js
dist # distribution folder, select this when loading as extension
 | - res # resources folder
 |   | - models # stores converted keras models (jackyzha0/reflect-nlp/nlp)
 |   |   | - acc%%.%% # where %%.%% represents accuracy on the test set
 |   |   |   | - group1-shar1of1.bin # binary storage of model weights
 |   |   |   | - model.json # stores architecture of model
 |   |   |   | - tokenizer.json # stores word tokenizer mappings
 |   |   ...
 |   | - pages # html files
 |   |   | - options.html # page to edit website whitelist
 |   |   | - prompt.html # actual block page
 |   | ... # misc. svg files, fonts, css, and images
 | - src # final source code, generated from `npm run build` [GENERATED]
 | - jquery-3.4.1.min.js # jquery source code, used for DOM manipulation
 | - jquery-ui.min.js # jquery ui source code, used for animations
 | - manifest.json # for chrome to figure out what the extension does/needs
 tsconfig.json # config for how typescript compiles to javascript
 README.md # this file
 package.json # tells npm about the project and how to build it
```

## Building the project
0. Ensure you have [TypeScript](https://www.typescriptlang.org/) installed.
1. Then, install the `node` package dependencies by doing `npm i`. 
2. Finally, `npm run build`.

## Git Workflow
0. Get an up to date version of the remote by doing `git pull`
1. Create a new branch BEFORE you start working by doing `git checkout -b ###-NAME-OF-BRANCH` where `NAME-OF-BRANCH` describes the new thing you're working on and `###` is the ticket number. e.g. `git checkout -b 001-add-feature`
2. Then, make your changes
3. Add files for staging by doing `git add .`
4. Commit these changes by doing `git commit -m "describe changes here"`
5. Push these changes to the remote repository by doing `git push origin ###-NAME-OF-BRANCH` where the branch name is the same as above. You can always do `git branch` to see which branch you are on.
6. Make a pull-request on Github!

### Using different intent classifiers
Just drop them into `dist/res/models/` and call it in `src/background.ts`:
```typescript
// Load ML model stuff
const model: IntentClassifier = new IntentClassifier("acc84.78");
```

## FAQ
I'm getting errors about `Cannot find namespace/name ___`.
* Install the JQuery support by doing `npm i @types/jquery` in the directory.
* Install the JQuery UI Library by doing `npm i @types/jqueryui` in the directory.
* Install the `@types` library by doing `npm i @types/chrome` in the directory.

My changes aren't being displayed
* After saving, build the extension using `npm run build`.
* Reload the extension in the Chrome Extensions menu