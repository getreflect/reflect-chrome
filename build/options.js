const ENTER_KEY_CODE = 13;
// On page load, draw table and add button listener
document.addEventListener('DOMContentLoaded', function renderFilterListTable() {
    drawFilterListTable(setDeleteButtonsListeners);
    setAddButtonListener();
});
function setDeleteButtonsListeners() {
    let buttons = document.getElementsByTagName("button");
    for (var i = 0; i < buttons.length; i++) {
        buttons[i].addEventListener("click", function () {
            var _a;
            let url = (_a = document.getElementById(this.id[0] + "site")) === null || _a === void 0 ? void 0 : _a.innerHTML;
            let id = this.id[0];
            chrome.storage.sync.get('blockedSites', function (data) {
                let blockedSites = data.blockedSites;
                blockedSites.splice(id, 1);
                chrome.storage.sync.set({ 'blockedSites': blockedSites }, function () {
                    console.log(url + " has been removed from filter list");
                    drawFilterListTable(setDeleteButtonsListeners);
                });
            });
        });
    }
    ;
}
;
function drawFilterListTable(callback) {
    chrome.storage.sync.get('blockedSites', function (data) {
        let blockedSites = data.blockedSites;
        let tableDiv = document.getElementById('filterList');
        let table = "<table>";
        let counter = 0;
        blockedSites.forEach(function (site) {
            table += "<tr><td id =\"" + counter + "site\">"
                + site + "</td><td><button id =\"" + counter++
                + "button\">&times;</button ></td></tr>";
        });
        table += "</table>";
        let filterList = document.getElementById('filterList');
        if (filterList != null) {
            filterList.innerHTML = table;
        }
        if (callback === undefined) {
            callback = function () { };
        }
        callback();
    });
}
;
function setAddButtonListener() {
    var _a, _b;
    (_a = document.getElementById('urlInput')) === null || _a === void 0 ? void 0 : _a.addEventListener("keypress", function (event) {
        if (event.keyCode == ENTER_KEY_CODE) {
            addUrlToFilterList();
        }
    });
    let addButton = document.getElementById('add');
    (_b = addButton) === null || _b === void 0 ? void 0 : _b.addEventListener('click', function () {
        addUrlToFilterList();
    });
}
;
function addUrlToFilterList() {
    let urlInput = document.getElementById('urlInput');
    if (urlInput.value != "") {
        chrome.storage.sync.get('blockedSites', function (data) {
            let blockedSites = data.blockedSites;
            blockedSites.push(urlInput.value);
            chrome.storage.sync.set({ 'blockedSites': blockedSites }, function () {
                console.log(urlInput + " has been added to filter list");
                urlInput.value = "";
                drawFilterListTable(setDeleteButtonsListeners);
            });
        });
    }
}
;
