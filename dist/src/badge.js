// badge.ts is a module responsible for controlling the badge that displays whitelist time left
import { cleanDomain } from './util';
import { getStorage } from './storage';
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
        const domain = cleanDomain(urls);
        if (domain === '') {
            cleanupBadge();
            return;
        }
        // get whitelisted sites
        getStorage().then((storage) => {
            if (storage.whitelistedSites.hasOwnProperty(domain)) {
                const expiry = new Date(storage.whitelistedSites[domain]);
                const currentDate = new Date();
                const timeDifference = expiry.getTime() - currentDate.getTime();
                setBadge(timeDifference);
            }
            else {
                cleanupBadge();
            }
        });
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
