// helper function to retrive chrome storage object
// usage:
//
// getStorage(null).then(storage => {
//     ...
// })
export function getStorage(): Promise<any> {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(null, (storage) => {
      if (storage === undefined) {
        reject(`Failed to fetch storage, storage was undefined`)
      } else {
        resolve(storage)
      }
    })
  })
}
