var badgeUpdateCounter = window.setInterval(badgeCountDown, 1000);
export function setBadgeUpdate() {
    badgeUpdateCounter = window.setInterval(badgeCountDown, 1000);
}
export function cleanupBadge() {
    window.clearInterval(badgeUpdateCounter);
    chrome.browserAction.setBadgeText({
        text: '',
    });
}
function badgeCountDown() {
    // get current active tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const urls = tabs.map((x) => x.url);
        const currentURL = urls[0];
        // check if currently on a page
        if (currentURL != undefined) {
            // clean url prefix stuff
            const matched = currentURL.match(/^[\w]+:\/{2}([\w\.:-]+)/);
            if (matched != null) {
                // strip url
                const strippedURL = matched[1].replace('www.', '');
                // get whitelisted sites
                chrome.storage.sync.get(null, (storage) => {
                    const whitelistedSites = storage.whitelistedSites;
                    if (whitelistedSites.hasOwnProperty(strippedURL)) {
                        const expiry = new Date(whitelistedSites[strippedURL]);
                        const currentDate = new Date();
                        const timeDifference = expiry.getTime() - currentDate.getTime();
                        setBadge(timeDifference);
                    }
                    else {
                        cleanupBadge();
                    }
                });
            }
        }
        else {
            cleanupBadge();
        }
    });
}
function setBadge(time) {
    time = Math.round(time / 1000);
    if (time <= 0) {
        cleanupBadge();
    }
    else {
        if (time > 60) {
            const min = Math.round(time / 60);
            chrome.browserAction.setBadgeText({
                text: min.toString() + 'm',
            });
        }
        else {
            chrome.browserAction.setBadgeText({
                text: time.toString() + 's',
            });
        }
    }
}
