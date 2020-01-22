"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
chrome.storage.sync.get('isEnabled', function (data) {
    // check to see if reflect is enabled
    if (data.isEnabled) {
        // check for is blocked
        chrome.storage.sync.get('blockedSites', function (data) {
            data.blockedSites.forEach(function (site) {
                // is blocked
                if (window.location.href.includes(site)) {
                    iterWhitelist();
                }
            });
        });
    }
});
function iterWhitelist() {
    // iterate whitelisted sites
    chrome.storage.sync.get('whitelistedSites', function (data) {
        var activeURL = window.location.href.match(/^[\w]+:\/{2}([\w\.:-]+)/);
        // activeURL exists
        if (activeURL != null) {
            var strippedURL = activeURL[1].replace("www.", "");
            // if url in whitelist
            var m = JSON.parse(data.whitelistedSites);
            if (m.hasOwnProperty(strippedURL)) {
                console.log("whitelisted");
                // check if expired
                if ((new Date) >= m[strippedURL]) {
                    console.log("expired");
                    loadBlockPage();
                }
            }
            else {
                console.log("blocked");
                loadBlockPage();
            }
        }
        // otherwise do nothing
    });
}
function loadBlockPage() {
    // get prompt page content
    $.get(chrome.runtime.getURL("res/pages/prompt.html"), function (page) {
        var _a;
        // refresh page with our blocker page
        document.open();
        document.write(page);
        document.close();
        var f = document.forms.namedItem("inputForm");
        // add listener for form submit
        (_a = f) === null || _a === void 0 ? void 0 : _a.addEventListener('submit', function (event) {
            // prevent default submit
            event.preventDefault();
            // extract entry
            var targ = event.target;
            var intent = (new FormData(targ)).get('intent');
            // store in chrome storage
            chrome.storage.sync.set({ 'lastIntent': intent }, function () {
                console.log('Intent set to: ' + intent);
            });
        });
        // load css
        var cssPath = chrome.runtime.getURL('res/common.css');
        $("head").append($('<link rel="stylesheet" type="text/css" />').attr('href', cssPath));
        // add blobs
        $("#top-left-blob").attr("src", chrome.runtime.getURL('res/blob-big-2.svg'));
        $("#bottom-right-blob").attr("src", chrome.runtime.getURL('res/blob-big-1.svg'));
        $("#small-blob1").attr("src", chrome.runtime.getURL('res/blob-med.svg'));
        $("#small-blob2").attr("src", chrome.runtime.getURL('res/blob-small.svg'));
        // save url to cache
        var url = location.href;
        chrome.storage.sync.set({ 'cachedURL': url }, function () {
            console.log('Set cached url to: ' + url);
        });
    });
}
