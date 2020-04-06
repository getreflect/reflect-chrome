const ENTER_KEY_CODE = 13;
// On page load, draw table and add button listener
document.addEventListener('DOMContentLoaded', function renderFilterListTable() {
    drawFilterListTable(setDeconsteButtonsListeners);
    setAddButtonListener();
});
function setDeconsteButtonsListeners() {
    const buttons = document.getElementsByTagName("button");
    for (const button of buttons) {
        button.addEventListener("click", () => {
            var _a;
            const id = parseInt(button.id[0]);
            const url = (_a = document.getElementById(button.id[0] + "site")) === null || _a === void 0 ? void 0 : _a.innerHTML;
            chrome.storage.sync.get('blockedSites', (storage) => {
                const blockedSites = storage.blockedSites;
                blockedSites.splice(id, 1);
                chrome.storage.sync.set({ 'blockedSites': blockedSites }, () => {
                    console.log(`removed ${url} from blocked list`);
                    drawFilterListTable(setDeconsteButtonsListeners);
                });
            });
        });
    }
    ;
}
;
function drawFilterListTable(callback) {
    chrome.storage.sync.get('blockedSites', (storage) => {
        const blockedSites = storage.blockedSites;
        const tableDiv = document.getElementById('filterList');
        let table = "<table>";
        let counter = 0;
        blockedSites.forEach((site) => {
            table += "<tr><td id =\"" + counter + "site\">"
                + site + "</td><td><button id =\"" + counter++
                + "button\">&times;</button ></td></tr>";
        });
        table += "</table>";
        const filterList = document.getElementById('filterList');
        if (filterList != null) {
            filterList.innerHTML = table;
        }
        if (callback === undefined) {
            // create empty callback
            callback = () => { };
        }
        callback();
    });
}
;
function setAddButtonListener() {
    var _a, _b;
    (_a = document.getElementById('urlInput')) === null || _a === void 0 ? void 0 : _a.addEventListener("keypress", (event) => {
        if (event.keyCode == ENTER_KEY_CODE) {
            addUrlToFilterList();
        }
    });
    const addButton = document.getElementById('add');
    (_b = addButton) === null || _b === void 0 ? void 0 : _b.addEventListener('click', () => {
        addUrlToFilterList();
    });
}
;
function addUrlToFilterList() {
    const urlInput = document.getElementById('urlInput');
    if (urlInput.value != "") {
        chrome.storage.sync.get('blockedSites', (storage) => {
            const blockedSites = storage.blockedSites;
            blockedSites.push(urlInput.value);
            chrome.storage.sync.set({ 'blockedSites': blockedSites }, () => {
                console.log(`added ${urlInput} from blocked list`);
                urlInput.value = "";
                drawFilterListTable(setDeconsteButtonsListeners);
            });
        });
    }
}
;
