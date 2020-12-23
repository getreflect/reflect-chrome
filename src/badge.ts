// badge.ts is a module responsible for controlling the badge that displays whitelist time left
import { cleanDomain } from './util'
import { getStorage } from './storage'

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
    const domain: string = cleanDomain(urls)

    if (domain === '') {
      cleanupBadge()
      return
    }

    // get whitelisted sites
    getStorage().then((storage) => {
      if (storage.whitelistedSites.hasOwnProperty(domain)) {
        const expiry: Date = new Date(storage.whitelistedSites[domain])
        const currentDate: Date = new Date()
        const timeDifference: number = expiry.getTime() - currentDate.getTime()

        setBadge(timeDifference)
      } else {
        cleanupBadge()
      }
    })
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
