const ENTER_KEY_CODE = 13;
// On page load, draw table and add button listener
document.addEventListener('DOMContentLoaded', function renderFilterListTable() {
    drawFilterListTable();
    setAddButtonListener();
    restoreSavedOptions();
    // options listeners
    setupOptionsListener();
});
function setupOptionsListener() {
    document.getElementById('save').addEventListener('click', saveCurrentOptions);
}
function saveCurrentOptions() {
    // get all form values
    const whitelistTimeElement = document.getElementById('whitelistTime');
    const whitelistTime = whitelistTimeElement.value;
    chrome.storage.sync.set({ 'whitelistTime': whitelistTime }, () => {
        // Update status to let user know options were saved.
        const status = document.getElementById('statusContent');
        status.textContent = 'options saved.';
        setTimeout(() => {
            status.textContent = '';
        }, 1500);
    });
}
function restoreSavedOptions() {
    chrome.storage.sync.get('whitelistTime', (storage) => {
        const WHITELIST_PERIOD = storage.whitelistTime;
        document.getElementById('whitelistTime').value = storage.whitelistTime;
    });
}
function updateButtonListeners() {
    // get all buttons
    const buttons = document.getElementsByTagName("button");
    for (const button of buttons) {
        button.addEventListener("click", () => {
            var _a;
            // get button ID
            const id = parseInt(button.id[0]);
            // get url
            const url = (_a = document.getElementById(button.id[0] + "site")) === null || _a === void 0 ? void 0 : _a.innerHTML;
            // get blockedSites
            chrome.storage.sync.get('blockedSites', (storage) => {
                const blockedSites = storage.blockedSites;
                // remove by ID
                blockedSites.splice(id, 1);
                // sync with chrome storage
                chrome.storage.sync.set({ 'blockedSites': blockedSites }, () => {
                    console.log(`removed ${url} from blocked list`);
                    drawFilterListTable();
                });
            });
        });
    }
    ;
}
;
function generateWebsiteDiv(id, site) {
    return "<tr>" +
        `<td style="width: 95%"><p class="urlDisplay" id=${id}>${site}</p></td>` +
        `<td style="width: 5%"><button id=${id}>&times;</button></td>` +
        "</tr>";
}
function drawFilterListTable() {
    chrome.storage.sync.get('blockedSites', (storage) => {
        const blockedSites = storage.blockedSites;
        const tableDiv = document.getElementById('filterList');
        let table = '<table class="hover shadow styled">';
        let cur_id = 0;
        blockedSites.forEach((site) => {
            table += generateWebsiteDiv(cur_id, site);
            cur_id++;
        });
        table += "</table>";
        const filterList = document.getElementById('filterList');
        if (filterList != null) {
            filterList.innerHTML = table;
        }
        updateButtonListeners();
    });
}
;
// sets event listeners for add new url operations
function setAddButtonListener() {
    const urlInputElement = document.getElementById('urlInput');
    // add key listener to submit new url on <ENTER> pressed
    urlInputElement.addEventListener("keypress", (event) => {
        if (event.keyCode == ENTER_KEY_CODE) {
            addUrlToFilterList();
        }
    });
    // add click listener to add URL button
    const addButton = document.getElementById('add');
    addButton.addEventListener('click', () => {
        addUrlToFilterList();
    });
}
;
function addUrlToFilterList() {
    // get urlInput
    const urlInput = document.getElementById('urlInput');
    // see if value is non-empty
    if (urlInput.value != "") {
        chrome.storage.sync.get('blockedSites', (storage) => {
            // get current blocked sites
            const blockedSites = storage.blockedSites;
            // add to blocked sites
            blockedSites.push(urlInput.value);
            // sync changes with chrome storage
            chrome.storage.sync.set({ 'blockedSites': blockedSites }, () => {
                console.log(`added ${urlInput} from blocked list`);
                // clear input
                urlInput.value = "";
                // redraw filterList
                drawFilterListTable();
            });
        });
    }
}
;
