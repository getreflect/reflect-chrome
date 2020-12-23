import { getStorage } from './storage';
import { cleanDomain } from './util';
document.addEventListener('DOMContentLoaded', () => {
    const toggleSwitch = document.querySelector('#reflect-toggle');
    toggleSwitch.addEventListener('change', toggleState, false);
    // get current state and set approriately
    getStorage().then(storage => {
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
    const port = chrome.runtime.connect({
        name: 'toggleState',
    });
    if (e.target.checked) {
        port.postMessage({ state: true });
    }
    else {
        port.postMessage({ state: false });
    }
}
function getButtonText(url, blockedSites) {
    return blockedSites.includes(url) ? 'unblock page.' : 'block page.';
}
function setupBlockListener(blockedSites) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const urls = tabs.map((x) => x.url);
        const domain = cleanDomain(urls);
        if (domain === '') {
            document.getElementById('curDomain').textContent = 'none.';
            return;
        }
        document.getElementById('curDomain').textContent = domain;
        document.getElementById('block').innerHTML = getButtonText(domain, blockedSites);
        document.getElementById('block').addEventListener('click', () => {
            // send url to be blocked by background script
            const port = chrome.runtime.connect({
                name: 'blockFromPopup',
            });
            // toggle state text
            const buttonText = document.getElementById('block').innerHTML;
            if (buttonText == 'block page.') {
                port.postMessage({ unblock: false, siteURL: domain });
                document.getElementById('block').innerHTML = 'unblock page.';
            }
            else {
                port.postMessage({ unblock: true, siteURL: domain });
                document.getElementById('block').innerHTML = 'block page.';
            }
        });
    });
}
