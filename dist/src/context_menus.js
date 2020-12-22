// closure around createContextMenus to ensure
// it will only ever be called once
export default () => {
    var setupBefore = false;
    return () => {
        if (!setupBefore) {
            setupBefore = true;
            createContextMenus();
        }
    };
};
function createContextMenus() {
    // browser actions
    chrome.contextMenus.create({
        id: 'baAddToFilterList',
        title: 'Block this:',
        contexts: ['browser_action'],
    });
    chrome.contextMenus.create({
        parentId: 'baAddToFilterList',
        id: 'baAddSiteToFilterList',
        title: 'Page',
        contexts: ['browser_action'],
    });
    chrome.contextMenus.create({
        parentId: 'baAddToFilterList',
        id: 'baAddDomainToFilterList',
        title: 'Domain',
        contexts: ['browser_action'],
    });
    chrome.contextMenus.create({
        id: 'pgAddToFilterList',
        title: 'Block this:',
        contexts: ['page'],
    });
    chrome.contextMenus.create({
        parentId: 'pgAddToFilterList',
        id: 'pgAddSiteToFilterList',
        title: 'Page',
        contexts: ['page'],
    });
    chrome.contextMenus.create({
        parentId: 'pgAddToFilterList',
        id: 'pgAddDomainToFilterList',
        title: 'Domain',
        contexts: ['page'],
    });
}
