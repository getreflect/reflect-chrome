"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function turnFilteringOff() {
    chrome.storage.sync.set({ 'isEnabled': false }, function () {
        chrome.browserAction.setIcon({ path: { "16": 'res/off.png' } });
        console.log('Filtering disabled');
    });
}
exports.turnFilteringOff = turnFilteringOff;
function turnFilteringOn() {
    chrome.storage.sync.set({ 'isEnabled': true }, function () {
        chrome.browserAction.setIcon({ path: 'res/on.png' }, function () {
            console.log('Filtering enabled.');
        });
    });
}
exports.turnFilteringOn = turnFilteringOn;
;
chrome.contextMenus.create({
    id: "baFilterListMenu",
    title: "Show filter list",
    contexts: ["browser_action"]
});
chrome.contextMenus.create({
    id: "baAddToFilterList",
    title: "Block this:",
    contexts: ["browser_action"]
});
chrome.contextMenus.create({
    parentId: "baAddToFilterList",
    id: "baAddSiteToFilterList",
    title: "Page",
    contexts: ["browser_action"]
});
chrome.contextMenus.create({
    parentId: "baAddToFilterList",
    id: "baAddDomainToFilterList",
    title: "Domain",
    contexts: ["browser_action"]
});
chrome.contextMenus.create({
    id: "pgAddToFilterList",
    title: "Block this:",
    contexts: ["page"]
});
chrome.contextMenus.create({
    parentId: "pgAddToFilterList",
    id: "pgAddSiteToFilterList",
    title: "Page",
    contexts: ["page"]
});
chrome.contextMenus.create({
    parentId: "pgAddToFilterList",
    id: "pgAddDomainToFilterList",
    title: "Domain",
    contexts: ["page"]
});
