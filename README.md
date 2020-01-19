# reflect.
a mindful website blocker for the productive.

## Getting set up
0. Open CMD and navigate to a convenient folder through `cd`
1. Clone the repository by doing `git clone https://github.com/jackyzha0/reflect-chrome.git`
2. Load the extension by opening Chrome first turning on developer mode in extensions `Settings > Extensions`.
3. Then, click `Load unpacked extension` and select the `reflect-chrome` folder.
4. To run the Python web server, make sure you have Python and Flask installed (see FAQ for more details). Then, clone the web server repository by doing `git clone https://github.com/jackyzha0/reflect-nlp.git` in your project folder.
5. Next, run the web server by doing `python server.py`

## Git Workflow
1. Get an up to date version of the remote by doing `git pull`
2. Create a new branch BEFORE you start working by doing `git checkout -b ###-NAME-OF-BRANCH` where `NAME-OF-BRANCH` describes the new thing you're working on and `###` is the ticket number. e.g. `git checkout -b 001-add-feature`
3. Then, make your changes
4. Add files for staging by doing `git add .`
5. Commit these changes by doing `git commit -m "describe changes here"`
6. Push these changes to the remote repository by doing `git push origin ###-NAME-OF-BRANCH` where the branch name is the same as above. You can always do `git branch` to see which branch you are on.
7. Make a pull-request on Github!

## FAQ

Help! How do I get Python set up?
* On Windows, follow the instructions [here.](https://www.python.org/downloads/release/python-376/) Make sure you select the `Add Python to PATH` option!
* On Mac, if you have Homebrew installed, just do `brew install python`
* Afterwards, do `pip install flask` to install Flask