// helper function to retrive chrome storage object
// usage:
//
// getStorage(null).then(storage => {
//     ...
// })
//
// or
//
// getStorage(['some_key']).then(some_key_value => {
//     ...
// })
function getStorage(key: Object = null): Promise<any> {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(key, (storage) => {
      if (storage === undefined) {
        reject(`Failed to fetch storage, storage was undefined`)
      } else {
        resolve(storage)
      }
    })
  })
}
