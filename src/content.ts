const REFLECT_INFO: string = '#576ca8'
const REFLECT_ERR: string = '#ff4a47'

const WHITELISTED_WRAPPERS: string[] = ['facebook.com/flx', 'l.facebook.com']

checkIfBlocked()

// re-check page everytime this page gets focus again
window.addEventListener('focus', checkIfBlocked)

function checkIfBlocked() {
    // check if already blocked
    if (!!document.getElementById('reflectMain') === false) {
        chrome.storage.sync.get(null, (storage) => {
            // check to see if reflect is enabled
            if (storage.isEnabled) {
                // check for is blocked

                const strippedURL: string = getStrippedUrl()
                storage.blockedSites.forEach((site: string) => {
                    // is blocked and not a whitelisted wrapper
                    if (strippedURL.includes(site) && !isWhitelistedWrapper()) {
                        iterWhitelist()
                    }
                })
            }
        })
    }
}

function displayStatus(
    message: string,
    duration: number = 3000,
    colour: string = REFLECT_INFO
): void {
    // set content
    $('#statusContent').css('color', colour)
    $('#statusContent').text(message)

    // show, wait, then hide
    $('#statusContent').show().delay(duration).fadeOut()
}

function isWhitelistedWrapper(): boolean {
    // check if any wrapper urls are present in current url
    return WHITELISTED_WRAPPERS.some((wrapper) => window.location.href.includes(wrapper))
}

function getStrippedUrl(): string {
    // match url
    const activeURL: RegExpMatchArray | null = window.location.href.match(/^[\w]+:\/{2}([\w\.:-]+)/)
    if (activeURL != null) {
        const strippedURL: string = activeURL[1].replace('www.', '')
        return strippedURL
    }

    // no url?
    return ''
}

function iterWhitelist(): void {
    // iterate whitelisted sites
    chrome.storage.sync.get(null, (storage) => {
        const strippedURL: string = getStrippedUrl()

        // activeURL exists
        if (strippedURL != '') {
            console.log(strippedURL)

            // if url in whitelist
            const m: { [key: string]: Date } = storage.whitelistedSites

            if (m.hasOwnProperty(strippedURL)) {
                console.log('whitelisted')

                // check if expired
                const parsedDate: Date = new Date(m[strippedURL])
                const currentDate: Date = new Date()
                if (currentDate >= parsedDate) {
                    console.log('expired')
                    loadBlockPage(strippedURL)
                } else {
                    // is currently on whitelist
                    const timeDifference: number = parsedDate.getTime() - currentDate.getTime()
                    setTimeout(loadBlockPage, timeDifference)
                }
            } else {
                console.log('blocked')
                loadBlockPage(strippedURL)
            }
        }
        // otherwise do nothing
    })
}

function loadBlockPage(strippedURL: string): void {
    // get prompt page content
    $.get(chrome.runtime.getURL('res/pages/prompt.html'), (page) => {
        // stop current page and replace with our blocker page
        window.stop()
        $('html').html(page)

        addFormListener(strippedURL)

        // inject show options page
        $('#linkToOptions').attr('href', chrome.runtime.getURL('res/pages/options.html'))

        // load css
        const cssPath: string = chrome.runtime.getURL('res/common.css')
        const cssLink: string = `<link rel="stylesheet" type="text/css" href="${cssPath}">`

        document.head.innerHTML += cssLink

        // animate background
        const anim = new BlobAnimation()
        anim.animate()
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
                    displayStatus(
                        `got it! ${WHITELIST_PERIOD} minutes starting now.`,
                        3000,
                        REFLECT_INFO
                    )
                    location.reload()
                })
                break

            case 'too_short':
                $('#textbox').effect('shake')

                // display message
                displayStatus(
                    'your response is a little short. be more specific!',
                    3000,
                    REFLECT_ERR
                )
                $('#textbox').val('')
                break

            case 'invalid':
                $('#textbox').effect('shake')

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

interface BlobConfig {
    blur: number
    alphaMult: number
    alphaAdd: number
    numSeeds: number
    childrenPerSeed: number
    childrenDistanceRange: number
    circleMinRadius: number
    circleMaxRadius: number
    attraction: number
    repulsion: number
}

class BlobElement {
    fill: string = '#A6B1CE'
    x: number
    y: number
    r: number
    originalX: number
    originalY: number
    element: SVGCircleElement

    constructor(x: number, y: number, r: number) {
        this.x = this.originalX = x
        this.y = this.originalY = y
        this.r = r || 10
        this.element = document.createElementNS('http://www.w3.org/2000/svg', 'circle')

        // set styling
        this.element.setAttribute('r', this.r.toString())
        this.element.setAttribute('style', `fill: ${this.fill};`)
    }

    // update element
    update(mouseX: number, mouseY: number, repulsion: number, attraction: number): void {
        const dx = this.x - mouseX
        const dy = this.y - mouseY
        const angle = Math.atan2(dy, dx)
        const dist = repulsion / Math.sqrt(dx * dx + dy * dy)
        this.x += Math.cos(angle) * dist
        this.y += Math.sin(angle) * dist
        this.x += (this.originalX - this.x) * attraction
        this.y += (this.originalY - this.y) * attraction

        this.element.setAttribute('cx', this.x.toString())
        this.element.setAttribute('cy', this.y.toString())
    }
}

class BlobAnimation {
    width: number
    height: number
    centerX: number
    centerY: number

    // dom refs
    svg: HTMLElement
    colorMatrixF: HTMLElement
    elements: BlobElement[]

    // mouse
    mouseX: number
    mouseY: number

    config: BlobConfig = {
        blur: 8,
        alphaMult: 30,
        alphaAdd: -10,
        numSeeds: 8,
        childrenPerSeed: 3,
        childrenDistanceRange: 100,
        circleMinRadius: 15,
        circleMaxRadius: 75,
        attraction: 0.1,
        repulsion: 1000,
    }

    constructor() {
        // grab dom elements
        this.svg = document.getElementById('svg')
        this.colorMatrixF = document.getElementById('colorMatrixF')

        // bind event listeners
        const body = document.getElementById('reflect-main')
        window.addEventListener('resize', this.onResize, false)
        body.addEventListener(
            'mousemove',
            (e) => {
                this.mouseX = e.clientX
                this.mouseY = e.clientY
            },
            false
        )
        body.addEventListener('mouseleave', this.resetMouse, false)

        // create initial svg g elements
        this.onResize()
        this.resetMouse()
        this.initElements()
        this.colorMatrixF.setAttribute(
            'values',
            `1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 ${this.config.alphaMult} ${this.config.alphaAdd}`
        )
    }

    private random(min: number, max: number): number {
        return min + Math.random() * (max - min)
    }

    private randomRange(targ: number, range: number): number {
        return targ + (Math.random() * 2 - 1) * range
    }

    private initElements(): void {
        // create group div with namespace
        this.elements = []
        const group: SVGElement = document.createElementNS('http://www.w3.org/2000/svg', 'g')
        this.svg.appendChild(group)

        // create seeds
        for (let i = 0; i < this.config.numSeeds; i++) {
            const e: BlobElement = new BlobElement(
                this.randomRange(this.centerX, this.width * 0.4),
                this.randomRange(this.centerY, this.height * 0.4),
                this.random(this.config.circleMinRadius, this.config.circleMaxRadius)
            )

            e.update(this.mouseX, this.mouseY, this.config.repulsion, this.config.attraction)
            group.appendChild(e.element)
            this.elements.push(e)
        }

        // add children to seeds
        this.elements.forEach((e) => {
            for (let j = 0; j < this.config.childrenPerSeed; j++) {
                const child: BlobElement = new BlobElement(
                    this.randomRange(e.x, this.config.childrenDistanceRange),
                    this.randomRange(e.y, this.config.childrenDistanceRange),
                    this.random(this.config.circleMinRadius, this.config.circleMaxRadius)
                )

                child.update(
                    this.mouseX,
                    this.mouseY,
                    this.config.repulsion,
                    this.config.attraction
                )
                group.appendChild(child.element)
                this.elements.push(child)
            }
        })
    }

    // set mouse cords back to bottom centre screen
    private resetMouse(): void {
        this.mouseX = this.centerX
        this.mouseY = 5 * this.centerY
    }

    // recompute width, height, and centre
    private onResize(): void {
        this.width = window.innerWidth
        this.height = window.innerHeight
        this.centerX = this.width / 2
        this.centerY = this.height / 2
    }

    animate = () => {
        requestAnimationFrame(this.animate)
        this.elements.forEach((e) => {
            e.update(this.mouseX, this.mouseY, this.config.repulsion, this.config.attraction)
        })
    }
}
