import BlobAnimation from './blob_animation'
import { getStorage } from './storage'
import { cleanDomain } from './util'

// some colour definitions
const REFLECT_INFO: string = '#576ca8'
const REFLECT_ERR: string = '#ff4a47'

// as soon as page loads, check if we need to block it
checkIfBlocked()

// re-check page everytime this page gets focus again
window.addEventListener('focus', checkIfBlocked)

// check to see if the current website needs to be blocked
function checkIfBlocked() {
  // if already on reflect page, don't need to re-block
  if (!!document.getElementById('reflect-main') === false) {
    getStorage().then((storage) => {
      if (storage.isEnabled) {
        const strippedURL: string = getStrippedUrl()

        // match current url against stored blocklist
        storage.blockedSites.forEach((site: string) => {
          if (strippedURL.includes(site) && !isWhitelistedWrapper()) {
            // found a match, check if currently on whitelist
            iterWhitelist()
          }
        })
      }
    })
  }
}

// display a message under intent entry field
function displayStatus(
  message: string,
  duration: number = 3000,
  colour: string = REFLECT_INFO
): void {
  $('#statusContent').css('color', colour)
  $('#statusContent').text(message)
  $('#statusContent').show().delay(duration).fadeOut()
}

// check to see if domain is whitelisted
function isWhitelistedWrapper(): boolean {
  const WHITELISTED_WRAPPERS: string[] = ['facebook.com/flx', 'l.facebook.com']

  // check if any wrapper urls are present in current url
  return WHITELISTED_WRAPPERS.some((wrapper) => window.location.href.includes(wrapper))
}

// thin wrapper around util.ts/cleanDomain
function getStrippedUrl(): string {
  return cleanDomain([window.location.href])
}

function iterWhitelist(): void {
  // iterate whitelisted sites
  getStorage().then((storage) => {
    const strippedURL: string = getStrippedUrl()
    if (strippedURL != '') {
      // get dictionary of whitelisted sites
      const whitelist: { [key: string]: Date } = storage.whitelistedSites

      // is current url whitelisted?
      if (whitelist.hasOwnProperty(strippedURL)) {
        // check whitelist period is expired
        const parsedDate: Date = new Date(whitelist[strippedURL])
        const currentDate: Date = new Date()
        const expired: boolean = currentDate >= parsedDate
        if (expired) {
          loadBlockPage(strippedURL)
        } else {
          const timeDifference: number = parsedDate.getTime() - currentDate.getTime()

          // set timer to re-block page after whitelist period expires
          setTimeout(() => {
            loadBlockPage(strippedURL)
          }, timeDifference)
        }
      } else {
        loadBlockPage(strippedURL)
      }
    }
  })
}

// replace current page with reflect block page
function loadBlockPage(strippedURL: string): void {
  const prompt_page_url: string = chrome.runtime.getURL('res/pages/prompt.html')
  const options_page_url: string = chrome.runtime.getURL('res/pages/options.html')

  getStorage().then((enableBlobs) => {
    // get prompt page content
    $.get(prompt_page_url, (page) => {
      // stop current page and replace with our blocker page
      window.stop()
      $('html').html(page)

      addFormListener(strippedURL)
      $('#linkToOptions').attr('href', options_page_url)
      if (enableBlobs ?? true) {
        const anim = new BlobAnimation()
        anim.animate()
      }
    })
  })
}

function addFormListener(strippedURL: string): void {
  const form: HTMLFormElement | null = document.forms.namedItem('inputForm')

  // add listener for form submit
  form?.addEventListener('submit', (event) => {
    // prevent default submit
    event.preventDefault()

    // extract entry
    const intentForm: HTMLFormElement | null = event.target as HTMLFormElement
    const intent: FormDataEntryValue = new FormData(intentForm).get('intent')
    const intentString: string = intent.toString()
    const intentDate: Date = new Date()

    callBackgroundWithIntent(intentString)
    addToStorage(intentString, intentDate, strippedURL)
  })
}

function addToStorage(intentString: string, intentDate: Date, url: string): void {
  chrome.storage.sync.get(null, (storage) => {
    // getting intent list map from storage
    let intentList: { [key: string]: Object } = storage.intentList

    // getting oldest date value from intent list map
    let oldest_date: Date = new Date()
    for (const rawDate in intentList) {
      const date: Date = new Date(rawDate)
      if (date < oldest_date) {
        oldest_date = date
      }
    }

    // deleting oldest intent to keep intent count under 20
    if (Object.keys(intentList).length > storage.numIntentEntries) {
      console.log(`list full, popping ${oldest_date.toJSON()}`)
      delete intentList[oldest_date.toJSON()]
    }

    // adding new intent and date to intent list
    intentList[intentDate.toJSON()] = {
      intent: intentString,
      url: url,
    }

    // saving intentList to chrome storage
    chrome.storage.sync.set({ intentList: intentList }, () => {
      console.log('the intent "' + intentString + '" has been added')
    })
  })
}

function callBackgroundWithIntent(intent: string): void {
  // open connection to runtime (background.ts)
  const port: chrome.runtime.Port = chrome.runtime.connect({
    name: 'intentStatus',
  })
  port.postMessage({ intent: intent, url: window.location.href })
  port.onMessage.addListener((msg) => {
    switch (msg.status) {
      case 'ok':
        // show success message
        // optional: transition?
        chrome.storage.sync.get(null, (storage) => {
          const WHITELIST_PERIOD: number = storage.whitelistTime
          displayStatus(`got it! ${WHITELIST_PERIOD} minutes starting now.`, 3000, REFLECT_INFO)
          location.reload()
        })
        break

      case 'too_short':
        $('#inputFields').effect('shake', { times: 3, distance: 5 })

        // display message
        displayStatus('your response is a little short. be more specific!', 3000, REFLECT_ERR)
        $('#textbox').val('')
        break

      case 'invalid':
        $('#inputFields').effect('shake', { times: 3, distance: 5 })

        // display message
        displayStatus(
          "that doesn't seem to be productive. try being more specific.",
          3000,
          REFLECT_ERR
        )

        // clear input
        $('#textbox').val('')
        break
    }

    // close connection
    port.disconnect()
  })
}
