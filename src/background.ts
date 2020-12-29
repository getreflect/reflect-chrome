import * as nn from './nn'
import { cleanDomain } from './util'
import { getStorage, setStorage, addToBlocked, addToWhitelist, removeFromBlocked } from './storage'
import setupContextMenus from './context_menus'
import { Intent } from './types'
import { setBadgeUpdate, cleanupBadge } from './badge'

// On install script
chrome.runtime.onInstalled.addListener((details) => {
  // on first time install
  if (details.reason === 'install') {
    chrome.tabs.create({
      // redir to onboarding url
      url: 'http://getreflect.app/onboarding',
      active: true,
    })

    firstTimeSetup()
  }

  // on version update
  const prevVersion: string = details.previousVersion
  const thisVersion: string = chrome.runtime.getManifest().version
  if (details.reason === 'update') {
    turnFilteringOn()

    if (prevVersion != thisVersion) {
      chrome.tabs.create({
        // redir to latest release patch notes
        url: 'http://getreflect.app/latest',
        active: true,
      })

      console.log(`Updated from ${prevVersion} to ${thisVersion}!`)
    }
  }

  // set uninstall url
  chrome.runtime.setUninstallURL('http://getreflect.app/uninstall')
})

function firstTimeSetup(): void {
  // defualt to on
  turnFilteringOn()

  // set whitelist
  const whitelist: { [key: string]: string } = {}
  const intentList: { [key: string]: Intent } = {}
  const blockedSites: string[] = ['facebook.com', 'twitter.com', 'instagram.com', 'youtube.com']

  setStorage({
    whitelistedSites: whitelist,
    intentList: intentList,
    whitelistTime: 5,
    numIntentEntries: 20,
    predictionThreshold: 0.5,
    customMessage: '',
    enableBlobs: true,
    enable3D: true,
    blockedSites: blockedSites,
    isEnabled: true,
  }).then(() => {
    console.log('Default values have been set.')
  })

  // set default badge background colour
  chrome.browserAction.setBadgeBackgroundColor({
    color: '#576ca8',
  })
}

// On Chrome startup, setup extension icons
chrome.runtime.onStartup.addListener(() => {
  getStorage().then((storage) => {
    let icon: string = 'res/icon.png'
    if (storage.isEnabled) {
      icon = 'res/on.png'
    } else if (!storage.isEnabled) {
      icon = 'res/off.png'
    }

    chrome.browserAction.setIcon({ path: { '16': icon } })
  })
})

function turnFilteringOff(): void {
  setStorage({ isEnabled: false }).then(() => {
    // stop checking for badge updates
    cleanupBadge()

    chrome.browserAction.setIcon({ path: 'res/off.png' }, () => {
      console.log('Filtering disabled')
    })
    reloadActive()
  })
}

function turnFilteringOn(): void {
  setStorage({ isEnabled: true }).then(() => {
    // start badge update counter
    setBadgeUpdate()

    chrome.browserAction.setIcon({ path: 'res/on.png' }, () => {
      console.log('Filtering enabled.')
    })
    reloadActive()
  })
}

// reloads tab that is currently in focus
function reloadActive(): void {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.reload(tabs[0].id)
  })
}

// Catch menu clicks (page context and browser action context)
chrome.contextMenus.onClicked.addListener((info, tab) => {
  switch (info.menuItemId) {
    case 'baFilterListMenu':
      chrome.runtime.openOptionsPage()
      break
    case 'baAddSiteToFilterList':
    case 'pgAddSiteToFilterList':
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const urls: string[] = tabs.map((x) => x.url)
        addToBlocked(urls[0])
      })
      break
    case 'baAddDomainToFilterList':
    case 'pgAddDomainToFilterList':
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const urls: string[] = tabs.map((x) => x.url)
        const domain: string = cleanDomain(urls)
        addToBlocked(domain)
      })
      break
  }
})

// load context menus
setupContextMenus()

// Load ML model
const model: nn.IntentClassifier = new nn.IntentClassifier('acc85.95')

// Listen for new signals from non-background scripts
chrome.runtime.onConnect.addListener((port) => {
  // check comm channel
  switch (port.name) {
    // listens for messages from content scripts
    case 'intentStatus': {
      port.onMessage.addListener((msg) => intentHandler(port, msg))
    }

    // listens for messages from popup
    case 'toggleState': {
      port.onMessage.addListener((msg) => toggleStateHandler(port, msg))
    }

    // listens for block from popup
    case 'blockFromPopup': {
      port.onMessage.addListener((msg) => blockFromPopupHandler(port, msg))
    }
  }
})

// handle content script intent submission
async function intentHandler(port: chrome.runtime.Port, msg) {
  // extract intent and url from message
  const intent: string = msg.intent

  // get whitelist period
  getStorage().then(async (storage) => {
    const WHITELIST_PERIOD: number = storage.whitelistTime
    const words: string[] = intent.split(' ')

    if (words.length <= 3) {
      // if too short, let content script know and early return
      port.postMessage({ status: 'too_short' })
      return
    }

    // send to nlp model for prediction
    const valid: boolean = await model.predict(intent)
    if (!valid) {
      // if invalid, let content script know and early return
      port.postMessage({ status: 'invalid' })
      console.log('Failed. Remaining on page.')
      return
    }

    // add whitelist period for site
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const urls: string[] = tabs.map((x) => x.url)
      const domain: string = cleanDomain(urls)
      addToWhitelist(domain, WHITELIST_PERIOD)
    })

    // send status to tab
    port.postMessage({ status: 'ok' })
    console.log(`Success! Redirecting`)
  })
}

// handle user toggling extension on/off
function toggleStateHandler(port: chrome.runtime.Port, msg) {
  const on: boolean = msg.state
  if (on) {
    turnFilteringOn()
  } else if (on === false) {
    turnFilteringOff()
  }
}

// handle user blocking current site from popup
function blockFromPopupHandler(port: chrome.runtime.Port, msg) {
  const url: string = msg.siteURL
  const unblock: boolean = msg.unblock
  if (url !== undefined && url !== '' && unblock !== undefined) {
    if (unblock) {
      removeFromBlocked(url)
    } else if (!unblock) {
      addToBlocked(url)
    }
    reloadActive()
  }
}
