import { addToBlocked, getStorage, setStorage } from './storage'
import { Intent } from './types'
import { getElementFromForm } from './util'

const ENTER_KEY_CODE = 13

// On page load, draw table and add button listener
document.addEventListener('DOMContentLoaded', () => {
  // setup button listeners and draw tables
  drawFilterListTable()
  drawIntentListTable()
  setAddButtonListener()

  // update threshold display value
  const slider = document.getElementById('thresholdSlider') as HTMLInputElement
  const display = document.getElementById('thresholdSliderValue')

  const sliderToValue = (slider) => `${Math.round(+slider.value * 100)}%`
  slider.oninput = () => {
    display.innerHTML = sliderToValue(slider)
  }

  // set state of page based off of storage
  getStorage().then((storage) => {
    getElementFromForm('whitelistTime').value = storage.whitelistTime
    getElementFromForm('numIntentEntries').value = storage.numIntentEntries
    getElementFromForm('minIntentLength').value = storage.minIntentLength ?? 3
    getElementFromForm('customMessage').value = storage.customMessage || ''
    getElementFromForm('enableBlobs').checked = storage.enableBlobs ?? true
    getElementFromForm('enable3D').checked = storage.enable3D ?? true
    getElementFromForm('thresholdSlider').value = storage.predictionThreshold || 0.5
    display.innerHTML = sliderToValue(slider)
  })

  // options listeners
  document.getElementById('save').addEventListener('click', saveCurrentOptions)
})

function saveCurrentOptions(): void {
  // get all form values
  const whitelistTime: number = getElementFromForm('whitelistTime').value
  const numIntentEntries: number = getElementFromForm('numIntentEntries').value
  const minIntentLength: number = getElementFromForm('minIntentLength').value
  const customMessage: string = getElementFromForm('customMessage').value
  const enableBlobs: boolean = getElementFromForm('enableBlobs').checked
  const enable3D: boolean = getElementFromForm('enable3D').checked
  const predictionThreshold: number = getElementFromForm('thresholdSlider').value
  const keyboardShortcut: string = getElementFromForm('keyboardShortcut').value

  setStorage({
    numIntentEntries: numIntentEntries,
    whitelistTime: whitelistTime,
    customMessage: customMessage,
    enableBlobs: enableBlobs,
    enable3D: enable3D,
    predictionThreshold: predictionThreshold,
    minIntentLength: minIntentLength,
    keyboardShortcut: keyboardShortcut,
  }).then(() => {
    // Update status to let user know options were saved.
    const status = document.getElementById('statusContent')
    status.textContent = 'options saved.'
    setTimeout(() => {
      status.textContent = ''
    }, 1500)
  })
}

function updateButtonListeners(): void {
  // get all buttons
  const buttons = document.getElementsByTagName('button')
  for (const button of <any>buttons) {
    button.addEventListener('click', () => {
      // get button ID
      const id: number = parseInt(button.id[0])

      // get url
      const url: string = document.getElementById(button.id[0] + 'site')?.innerHTML

      // get blockedSites
      getStorage().then((storage) => {
        const blockedSites: string[] = storage.blockedSites

        // remove by ID
        blockedSites.splice(id, 1)

        // sync with chrome storage
        setStorage({ blockedSites: blockedSites }).then(() => {
          console.log(`removed ${url} from blocked list`)
          drawFilterListTable()
        })
      })
    })
  }
}

function generateWebsiteDiv(id: number, site: string): string {
  return `<tr>
    <td style="width: 95%"><p class="urlDisplay" id=${id}>${site}</p></td>
    <td style="width: 5%"><button id=${id}>&times;</button></td>
    </tr>`
}

function generateIntentDiv(id: number, intent: string, date: Date, url: string): string {
  // reformatting date to only include month, date, and 12 hour time
  const formattedDate: string = date.toLocaleDateString('default', {
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  })

  // creating display table for intents and dates
  return `<tr>
      <td style="width: 40%"><p class="intentDisplay" id=${id}>${url}</p></td>
      <td style="width: 40%"><p class="intentDisplay" id=${id}>${intent}</p></td>
      <td style="width: 20%"><p class="intentDisplay" id=${id}>${formattedDate}</p></td>
    </tr>`
}

function drawFilterListTable(): void {
  getStorage().then((storage) => {
    const blockedSites: string[] = storage.blockedSites

    // appending row for each addiitonal blocked site
    const tableContent: string = blockedSites.reduce((table, site, cur_id) => {
      table += generateWebsiteDiv(cur_id, site)
      return table
    }, '')
    // generates new line in table for new intent
    const table: string = `<table class="hover shadow styled">${tableContent}</table>`

    // adds table to html
    const filterList: HTMLElement = document.getElementById('filterList')
    if (filterList != null) {
      filterList.innerHTML = table
    }
    // adding listener to "x"
    updateButtonListeners()
  })
}

function drawIntentListTable(): void {
  getStorage().then((storage) => {
    const intentList: { [key: string]: Intent } = storage.intentList

    // generate table element
    let table: string = `<table id="intentList" class="hover shadow styled">
        <tr>
        <th id="urlHeader" style="width: 40%">url</th>
        <th style="width: 40%">intent</th>
        <th style="width: 20%">date</th>
      </tr>`

    let cur_id: number = 0
    // iter dates in intentList
    for (const rawDate in intentList) {
      // if number of entries is less than max
      if (cur_id < storage.numIntentEntries) {
        // parse fields from intentlist[rawDate]
        const date: Date = new Date(rawDate)
        const intent: string = intentList[rawDate].intent
        const url: string = intentList[rawDate].url

        // append table row with this info
        table += generateIntentDiv(cur_id, intent, date, url)
        cur_id++
      }
    }
    // generates new line in table for new intent
    table += '</table>'

    // insert table into html
    const previousIntents: HTMLElement = document.getElementById('previousIntents')
    if (previousIntents != null) {
      previousIntents.innerHTML = table
    }
  })
}

// sets event listeners for add new url operations
function setAddButtonListener(): void {
  const urlInputElement: HTMLElement = document.getElementById('urlInput')

  // add key listener to submit new url on <ENTER> pressed
  urlInputElement.addEventListener('keypress', (event) => {
    if (event.keyCode === ENTER_KEY_CODE) {
      addUrlToFilterList()
    }
  })

  // add click listener to add URL button
  const addButton: HTMLElement = document.getElementById('add')
  addButton.addEventListener('click', () => {
    addUrlToFilterList()
  })
}

function addUrlToFilterList(): void {
  // get urlInput
  const urlInput: HTMLFormElement = document.getElementById('urlInput') as HTMLFormElement

  // see if value is non-empty
  if (urlInput.value !== '') {
    const url: string = urlInput.value
    addToBlocked(url, () => {
      urlInput.value = ''
      drawFilterListTable()
    })
  }
}
