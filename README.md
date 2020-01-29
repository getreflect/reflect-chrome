# reflect.
a mindful website blocker for the productive.

## Building the project
First, ensure you have [TypeScript](https://www.typescriptlang.org/) installed. Then, in the root directory of this project, run `tsc` to compile the `.ts` files to `.js` files which you can find in the `build` directory.

## Getting set up
0. Open CMD and navigate to a convenient folder through `cd`
1. Clone the repository by doing `git clone https://github.com/jackyzha0/reflect-chrome.git`
2. Compile the TypeScript to JavaScript by running `tsc`.
3. Load the extension by opening Chrome first turning on developer mode in extensions `Settings > Extensions`.
4. Then, click `Load unpacked extension` and select the `reflect-chrome` folder.

## Git Workflow
0. Get an up to date version of the remote by doing `git pull`
1. Create a new branch BEFORE you start working by doing `git checkout -b ###-NAME-OF-BRANCH` where `NAME-OF-BRANCH` describes the new thing you're working on and `###` is the ticket number. e.g. `git checkout -b 001-add-feature`
2. Then, make your changes
3. Add files for staging by doing `git add .`
4. Commit these changes by doing `git commit -m "describe changes here"`
5. Push these changes to the remote repository by doing `git push origin ###-NAME-OF-BRANCH` where the branch name is the same as above. You can always do `git branch` to see which branch you are on.
6. Make a pull-request on Github!

## FAQ
I'm getting errors about `Cannot find namespace/name chrome`.
* Install the `@types` library by doing `npm i @types/chrome` in the directory.

<br>

I'm getting errors about `Cannot find name $`.
* Install the JQuery support by doing `npm i @types/jquery` in the directory.