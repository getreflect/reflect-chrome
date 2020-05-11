const ENTER_KEY_CODE = 13;
// On page load, draw table and add button listener
document.addEventListener('DOMContentLoaded', function renderFilterListTable() {
    drawFilterListTable();
    drawIntentListTable();
    setAddButtonListener();
    restoreSavedOptions();
    // options listeners
    setupOptionsListener();
});
function setupOptionsListener() {
    document.getElementById('save').addEventListener('click', saveCurrentOptions);
}
// taken from https://www.w3schools.com/howto/howto_js_sort_table.asp
function sortTable() {
    var table, rows, switching, i, x, y, shouldSwitch, dir, switchcount = 0;
    table = document.getElementById("intentList");
    switching = true;
    dir = "asc";
    while (switching) {
        switching = false;
        rows = table.rows;
        for (i = 1; i < (rows.length - 1); i++) {
            shouldSwitch = false;
            x = rows[i].getElementsByTagName("td")[0].childNodes[0];
            y = rows[i + 1].getElementsByTagName("td")[0].childNodes[0];
            if (dir == "asc") {
                if (x.innerHTML.toLowerCase() > y.innerHTML.toLowerCase()) {
                    shouldSwitch = true;
                    break;
                }
            }
            else if (dir == "desc") {
                if (x.innerHTML.toLowerCase() < y.innerHTML.toLowerCase()) {
                    shouldSwitch = true;
                    break;
                }
            }
        }
        if (shouldSwitch) {
            rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
            switching = true;
            switchcount++;
        }
        else {
            if (switchcount == 0 && dir == "asc") {
                dir = "desc";
                switching = true;
            }
        }
    }
}
function saveCurrentOptions() {
    // get all form values
    const whitelistTimeElement = document.getElementById('whitelistTime');
    const whitelistTime = whitelistTimeElement.value;
    const numIntentEntriesElement = document.getElementById('numIntentEntries');
    const numIntentEntries = numIntentEntriesElement.value;
    chrome.storage.sync.set({ 'numIntentEntries': numIntentEntries }, () => {
        chrome.storage.sync.set({ 'whitelistTime': whitelistTime }, () => {
            // Update status to let user know options were saved.
            const status = document.getElementById('statusContent');
            status.textContent = 'options saved.';
            setTimeout(() => {
                status.textContent = '';
            }, 1500);
        });
    });
}
function restoreSavedOptions() {
    chrome.storage.sync.get(null, (storage) => {
        document.getElementById('whitelistTime').value = storage.whitelistTime;
        document.getElementById('numIntentEntries').value = storage.numIntentEntries;
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
            chrome.storage.sync.get(null, (storage) => {
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
function generateIntentDiv(id, intent, date, url) {
    // reformatting date to only include month, date, and 12 hour time
    const formattedDate = date.toLocaleDateString('default', { month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true });
    // creating display table for intents and dates
    return "<tr>" +
        `<td style="width: 40%"><p class="intentDisplay" id=${id}>${url}</p></td>` +
        `<td style="width: 40%"><p class="intentDisplay" id=${id}>${intent}</p></td>` +
        `<td style="width: 20%"><p class="intentDisplay" id=${id}>${formattedDate}</p></td>` +
        "</tr>";
}
function drawFilterListTable() {
    // accessing chrome storage for blocked sites
    chrome.storage.sync.get(null, (storage) => {
        //fetch blocked sites
        const blockedSites = storage.blockedSites;
        // generating table
        let table = '<table class="hover shadow styled">';
        let cur_id = 0;
        // appending row for each addiitonal blocked site
        blockedSites.forEach((site) => {
            table += generateWebsiteDiv(cur_id, site);
            cur_id++;
        });
        // generates new line in table for new intent
        table += "</table>";
        // adds table to html
        const filterList = document.getElementById('filterList');
        if (filterList != null) {
            filterList.innerHTML = table;
        }
        // adding listener to "x"
        updateButtonListeners();
    });
}
;
function drawIntentListTable() {
    // accessing chrome storage for intents
    chrome.storage.sync.get(null, (storage) => {
        // fetch intent list
        const intentList = storage.intentList;
        // generate table element
        let table = '<table id="intentList" class="hover shadow styled">' +
            "<tr>" +
            '<th id="urlHeader" style="width: 40%">url</th>' +
            '<th style="width: 40%">intent</th>' +
            '<th style="width: 20%">date</th>' +
            "</tr>";
        let cur_id = 0;
        // iter dates in intentList
        for (const rawDate in intentList) {
            // if number of entries is less than max
            if (cur_id < storage.numIntentEntries) {
                // parse fields from intentlist[rawDate]
                const date = new Date(rawDate);
                const intent = intentList[rawDate]['intent'];
                const url = intentList[rawDate]['url'];
                // append table row with this info
                table += generateIntentDiv(cur_id, intent, date, url);
                cur_id++;
            }
        }
        // generates new line in table for new intent
        table += "</table>";
        // insert table into html
        const previousIntents = document.getElementById('previousIntents');
        if (previousIntents != null) {
            previousIntents.innerHTML = table;
        }
        // setup table sort events
        document.getElementById('urlHeader').addEventListener('click', sortTable);
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
        chrome.storage.sync.get(null, (storage) => {
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
