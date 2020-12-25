// util.ts provides utility functions that can be reused in other modules
export function addMinutes(date, minutes) {
    return new Date(date.getTime() + minutes * 60000);
}
export function cleanDomain(urls) {
    // check to see if urls exist
    if (urls[0] === undefined) {
        // return empty if not
        return '';
    }
    else {
        // regex match for url
        const activeURL = urls[0].match(/^[\w]+:\/{2}([\w\.:-]+)/);
        // no matching sites, return empty
        if (activeURL == null) {
            return '';
        }
        else {
            // strip www.
            return activeURL[1].replace('www.', '');
        }
    }
}
export function insertAfter(newNode, existingNode) {
    existingNode.parentNode.insertBefore(newNode, existingNode.nextSibling);
}
export function createDivFromHTML(htmlString) {
    const newDiv = document.createElement("div");
    newDiv.insertAdjacentHTML('beforeend', htmlString);
    return newDiv;
}
export function getElementFromForm(id) {
    return document.getElementById(id);
}
