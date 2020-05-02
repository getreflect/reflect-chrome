document.addEventListener("DOMContentLoaded", () => {
    const toggleSwitch = document.querySelector('#reflect-toggle');
    toggleSwitch.addEventListener('change', toggleState, false);
    // get current state and set approriately
    chrome.storage.sync.get(null, (storage) => {
        if (storage.isEnabled) {
            toggleSwitch.checked = true;
        }
        else {
            toggleSwitch.checked = false;
        }
        setupBlockListener(storage.blockedSites);
    });
});
// message background
function toggleState(e) {
    const port = chrome.runtime.connect({ name: "toggleState" });
    if (e.target.checked) {
        port.postMessage({ state: true });
    }
    else {
        port.postMessage({ state: false });
    }
}
function getButtonText(url, blockedSites) {
    if (blockedSites.includes(url)) {
        return "unblock page.";
    }
    else {
        return "block page.";
    }
}
function setupBlockListener(blockedSites) {
    chrome.tabs.query({ 'active': true, 'currentWindow': true }, (tabs) => {
        const urls = tabs.map(x => x.url);
        if (urls[0] != undefined) {
            // regex match for url
            const activeURL = urls[0].match(/^[\w]+:\/{2}([\w\.:-]+)/);
            // no matching sites, set empty
            if (activeURL != null) {
                // strip www.
                const url = activeURL[1].replace("www.", "");
                document.getElementById("curDomain").textContent = url;
                // check if text should be "block" or "unblock"
                document.getElementById("block").innerHTML = getButtonText(url, blockedSites);
                document.getElementById("block").addEventListener("click", (event) => {
                    // send url to be blocked by background script
                    const port = chrome.runtime.connect({ name: "blockFromPopup" });
                    // toggle state text
                    const buttonText = document.getElementById("block").innerHTML;
                    if (buttonText == "block page.") {
                        port.postMessage({ unblock: false, siteURL: url });
                        document.getElementById("block").innerHTML = "unblock page.";
                    }
                    else {
                        port.postMessage({ unblock: true, siteURL: url });
                        document.getElementById("block").innerHTML = "block page.";
                    }
                });
            }
        }
        else {
            document.getElementById("curDomain").textContent = "none.";
        }
    });
}
