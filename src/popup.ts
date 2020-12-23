import { getStorage } from './storage'
import { cleanDomain } from './util'

document.addEventListener('DOMContentLoaded', () => {
  const toggleSwitch: HTMLInputElement = document.querySelector(
    '#reflect-toggle'
  ) as HTMLInputElement
  toggleSwitch.addEventListener('change', toggleState, false)

  // get current state and set approriately
  getStorage().then((storage) => {
    toggleSwitch.checked = storage.isEnabled
    setupBlockListener(storage.blockedSites)
  })
})

// message background
function toggleState(e) {
  const port: chrome.runtime.Port = chrome.runtime.connect({
    name: 'toggleState',
  })

  port.postMessage({ state: e.target.checked })
  port.disconnect()
}

function getButtonText(url: string, blockedSites: string[]): string {
  return blockedSites.includes(url) ? 'unblock page.' : 'block page.'
}

function setupBlockListener(blockedSites) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const urls: string[] = tabs.map((x) => x.url)
    const domain: string = cleanDomain(urls)

    if (domain === '') {
      document.getElementById('curDomain').textContent = 'none.'
      return
    }

    document.getElementById('curDomain').textContent = domain

    document.getElementById('block').innerHTML = getButtonText(domain, blockedSites)
    document.getElementById('block').addEventListener('click', () => {
      // send url to be blocked by background script
      const port: chrome.runtime.Port = chrome.runtime.connect({
        name: 'blockFromPopup',
      })

      // toggle state text
      const buttonText: string = document.getElementById('block').innerHTML
      if (buttonText == 'block page.') {
        port.postMessage({ unblock: false, siteURL: domain })
        document.getElementById('block').innerHTML = 'unblock page.'
      } else {
        port.postMessage({ unblock: true, siteURL: domain })
        document.getElementById('block').innerHTML = 'block page.'
      }
      port.disconnect()
    })
  })
}
