const REFLECT_INFO = "#576ca8";
const REFLECT_ERR = "#ff4a47";
chrome.storage.sync.get('isEnabled', (storage) => {
    // check to see if reflect is enabled
    if (storage.isEnabled) {
        // check for is blocked
        chrome.storage.sync.get('blockedSites', (storage) => {
            storage.blockedSites.forEach((site) => {
                // is blocked
                if (window.location.href.includes(site)) {
                    iterWhitelist();
                }
            });
        });
    }
});
function displayStatus(message, duration = 3000, colour = REFLECT_INFO) {
    // set content
    $("#statusContent").css("color", colour);
    $("#statusContent").text(message);
    // show, wait, then hide
    $("#statusContent").show().delay(duration).fadeOut();
}
function iterWhitelist() {
    // iterate whitelisted sites
    chrome.storage.sync.get('whitelistedSites', (storage) => {
        const activeURL = window.location.href.match(/^[\w]+:\/{2}([\w\.:-]+)/);
        // activeURL exists
        if (activeURL != null) {
            const strippedURL = activeURL[1].replace("www.", "");
            // if url in whitelist
            const m = storage.whitelistedSites;
            if (m.hasOwnProperty(strippedURL)) {
                console.log("whitelisted");
                // check if expired
                const parsedDate = new Date(m[strippedURL]);
                if ((new Date) >= parsedDate) {
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
    $.get(chrome.runtime.getURL("res/pages/prompt.html"), (page) => {
        // refresh page with our blocker page
        document.open();
        document.write(page);
        document.close();
        addFormListener();
        // load css
        const cssPath = chrome.runtime.getURL('res/common.css');
        $("head").append($('<link rel="stylesheet" type="text/css" />').attr('href', cssPath));
        // add blobs
        $("#top-left-blob").attr("src", chrome.runtime.getURL('res/blob-big-2.svg'));
        $("#bottom-right-blob").attr("src", chrome.runtime.getURL('res/blob-big-1.svg'));
        $("#small-blob1").attr("src", chrome.runtime.getURL('res/blob-med.svg'));
        $("#small-blob2").attr("src", chrome.runtime.getURL('res/blob-small.svg'));
    });
}
function addFormListener() {
    var _a;
    const form = document.forms.namedItem("inputForm");
    // add listener for form submit
    (_a = form) === null || _a === void 0 ? void 0 : _a.addEventListener('submit', (event) => {
        // prevent default submit
        event.preventDefault();
        // extract entry
        const intentForm = event.target;
        const intent = new FormData(intentForm).get('intent');
        const intentString = intent.toString();
        callBackgroundWithIntent(intentString);
    });
}
function callBackgroundWithIntent(intent) {
    // open connection to runtime (background.ts)
    const port = chrome.runtime.connect({ name: "intentStatus" });
    port.postMessage({ intent: intent, url: window.location.href });
    displayStatus("connecting...", 3000, REFLECT_INFO);
    port.onMessage.addListener((msg) => {
        switch (msg.status) {
            case "ok":
                // show success message
                // optional: transition?
                displayStatus("got it! 5 minutes starting now.", 3000, REFLECT_INFO);
                location.reload();
                break;
            case "invalid":
                $('#textbox').effect("shake");
                // display message
                displayStatus("that doesn't seem to productive. try being more specific.", 3000, REFLECT_ERR);
                // clear input
                $("#textbox").val("");
                break;
            case "timeout":
                // display message
                displayStatus("couldn't reach server, try again later.", 3000, REFLECT_ERR);
                break;
        }
        // close connection
        port.disconnect();
    });
}
