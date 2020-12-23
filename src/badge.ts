// badge.ts is a module responsible for controlling the badge that displays whitelist time left

var badgeUpdateCounter: number = window.setInterval(badgeCountDown, 1000)

export function setBadgeUpdate() {
  badgeUpdateCounter = window.setInterval(badgeCountDown, 1000)
}

export function cleanupBadge(): void {
  window.clearInterval(badgeUpdateCounter)
  chrome.browserAction.setBadgeText({
    text: '',
  })
}

function badgeCountDown(): void {
  // get current active tab
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const urls: string[] = tabs.map((x) => x.url)
    const currentURL: string = urls[0]

    // check if currently on a page
    if (currentURL != undefined) {
      // clean url prefix stuff
      const matched: RegExpMatchArray | null = currentURL.match(/^[\w]+:\/{2}([\w\.:-]+)/)
      if (matched != null) {
        // strip url
        const strippedURL: string = matched[1].replace('www.', '')

        // get whitelisted sites
        chrome.storage.sync.get(null, (storage) => {
          const whitelistedSites: { [key: string]: Date } = storage.whitelistedSites

          if (whitelistedSites.hasOwnProperty(strippedURL)) {
            const expiry: Date = new Date(whitelistedSites[strippedURL])
            const currentDate: Date = new Date()

            const timeDifference: number = expiry.getTime() - currentDate.getTime()

            setBadge(timeDifference)
          } else {
            cleanupBadge()
          }
        })
      }
    } else {
      cleanupBadge()
    }
  })
}

function setBadge(time: number) {
  time = Math.round(time / 1000)
  if (time <= 0) {
    cleanupBadge()
  } else {
    if (time > 60) {
      const min: number = Math.round(time / 60)
      chrome.browserAction.setBadgeText({
        text: min.toString() + 'm',
      })
    } else {
      chrome.browserAction.setBadgeText({
        text: time.toString() + 's',
      })
    }
  }
}
