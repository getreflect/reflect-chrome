// helper function to retrive chrome storage object
// usage:
//
// getStorage(null).then(storage => {
//     ...
// })
export function getStorage() {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.get(null, (storage) => {
            if (chrome.runtime.lastError !== undefined) {
                reject(chrome.runtime.lastError);
            }
            else {
                resolve(storage);
            }
        });
    });
}
// helper function to set fields in chrome storage
// usage:
//
// getStorage({enableBlobs: false}).then(storage => {
//     ...
// })
export function setStorage(key) {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.set(key, () => {
            if (chrome.runtime.lastError !== undefined) {
                reject(chrome.runtime.lastError);
            }
            else {
                resolve();
            }
        });
    });
}
