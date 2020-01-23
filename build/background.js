// On install script --> TODO: onboarding flow
chrome.runtime.onInstalled.addListener(function initialization() {
    turnFilteringOff();
    // set last intent to N/A
    chrome.storage.sync.set({ 'lastIntent': "N/A" }, function () {
        console.log('Set default intent.');
    });
    // set whitelist
    var whitelist = JSON.stringify([]);
    chrome.storage.sync.set({ 'whitelistedSites': whitelist }, function () {
        console.log('Default whitelist sites have been set.');
    });
    // populate blocked sites
    chrome.storage.sync.get('blockedSites', function (data) {
        let blockedSites = data.blockedSites;
        // check to see if extension was installed before
        if (typeof blockedSites != "undefined" && blockedSites != null
            && blockedSites.length != null && blockedSites.length > 0) {
            var defaultListConfirm = confirm("Welcome back to reflect! \nDo you want to load your old filter list?");
            if (defaultListConfirm) {
                console.log("User confirmed keeping a previous filter list");
            }
            else {
                console.log("User cancelled loading a previous filter list.");
                addDefaultFilters();
            }
        }
        else {
            console.log("User didn't have any previous filters");
            addDefaultFilters();
        }
    });
});
// default list of blocked sites
function addDefaultFilters() {
    var blockedSites = ["facebook.com", "twitter.com", "instagram.com", "youtube.com"];
    chrome.storage.sync.set({ 'blockedSites': blockedSites }, function () {
        console.log('Default blocked sites have been loaded.');
    });
}
;
// Listen for changes in chrome storage
chrome.storage.onChanged.addListener(function (changes, namespace) {
    for (var key in changes) {
        var storageChange = changes[key];
        // watch for intent change
        if (key == "lastIntent") {
            // send new intent to server
            let sendIntent = JSON.stringify({ intent: storageChange.newValue });
            var xhr = new XMLHttpRequest();
            xhr.open("POST", "http://localhost:8081/", true);
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.send(sendIntent);
            xhr.onload = function () {
                // on success -> redirect to cached url
                if (xhr.status == 200) {
                    chrome.storage.sync.get('cachedURL', function (data) {
                        // add whitelist period for site
                        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                            let urls = tabs.map(x => x.url);
                            var domain = cleanDomain(urls);
                            addUrlToWhitelistedSites(domain, 5);
                        });
                        chrome.tabs.update({ url: data.cachedURL });
                        console.log("Success! Redirecting to: " + data.cachedURL);
                    });
                }
                else {
                    console.log("Failed. Remaining on page.");
                    // show blocked page 
                }
            };
        }
    }
});
// On Chrome startup, setup extension icons
chrome.runtime.onStartup.addListener(function () {
    chrome.storage.sync.get('isEnabled', function (data) {
        let icon = 'res/icon.png';
        if (data.isEnabled) {
            icon = 'res/on.png';
        }
        else if (!data.isEnabled) {
            icon = 'res/off.png';
        }
        chrome.browserAction.setIcon({ path: { "16": icon } });
    });
});
// Toggle filtering
chrome.browserAction.onClicked.addListener(function toggleBlocking() {
    chrome.storage.sync.get('isEnabled', function (data) {
        if (data.isEnabled) {
            turnFilteringOff();
        }
        else {
            turnFilteringOn();
        }
    });
});
// Catch menu clicks (page context and browser action context)
chrome.contextMenus.onClicked.addListener(function contextMenuHandler(info, tab) {
    switch (info.menuItemId) {
        case "baFilterListMenu":
            chrome.tabs.create({ url: 'options/options.html' });
            break;
        case "baAddSiteToFilterList":
        case "pgAddSiteToFilterList":
            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                let urls = tabs.map(x => x.url);
                addUrlToBlockedSites(urls[0], tab);
            });
            break;
        case "baAddDomainToFilterList":
        case "pgAddDomainToFilterList":
            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                let urls = tabs.map(x => x.url);
                let domain = cleanDomain(urls);
                addUrlToBlockedSites(domain, tab);
            });
            break;
    }
});
// push current site to storage
function addUrlToBlockedSites(url, tab) {
    chrome.storage.sync.get('blockedSites', function (data) {
        data.blockedSites.push(url); // urls.hostname
        chrome.storage.sync.set({ 'blockedSites': data.blockedSites }, function () {
            console.log(url + ' added to blocked sites');
        });
    });
}
// push current site to whitelist with time to whitelist
function addUrlToWhitelistedSites(url, minutes) {
    chrome.storage.sync.get('whitelistedSites', function (data) {
        let m = new Map(JSON.parse(data.whitelistedSites));
        let expiry = addMinutes(new Date(), minutes);
        m.set(url, expiry);
        let mstring = JSON.stringify(m);
        chrome.storage.sync.set({ 'whitelistedSites': mstring }, function () {
            console.log(url + ' added to whitelisted sites');
        });
    });
}
function turnFilteringOff() {
    chrome.storage.sync.set({ 'isEnabled': false }, function () {
        chrome.browserAction.setIcon({ path: { "16": 'res/off.png' } });
        console.log('Filtering disabled');
    });
}
function turnFilteringOn() {
    chrome.storage.sync.set({ 'isEnabled': true }, function () {
        chrome.browserAction.setIcon({ path: 'res/on.png' }, function () {
            console.log('Filtering enabled.');
        });
    });
}
;
