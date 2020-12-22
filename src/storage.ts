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
