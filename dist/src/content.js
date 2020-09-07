const REFLECT_INFO = '#576ca8';
const REFLECT_ERR = '#ff4a47';
const WHITELISTED_WRAPPERS = ['facebook.com/flx', 'l.facebook.com'];
checkIfBlocked();
// re-check page everytime this page gets focus again
window.addEventListener('focus', checkIfBlocked);
function checkIfBlocked() {
    // check if already blocked
    if (!!document.getElementById('reflectMain') === false) {
        chrome.storage.sync.get(null, (storage) => {
            // check to see if reflect is enabled
            if (storage.isEnabled) {
                // check for is blocked
                const strippedURL = getStrippedUrl();
                storage.blockedSites.forEach((site) => {
                    // is blocked and not a whitelisted wrapper
                    if (strippedURL.includes(site) && !isWhitelistedWrapper()) {
                        iterWhitelist();
                    }
                });
            }
        });
    }
}
function displayStatus(message, duration = 3000, colour = REFLECT_INFO) {
    // set content
    $('#statusContent').css('color', colour);
    $('#statusContent').text(message);
    // show, wait, then hide
    $('#statusContent').show().delay(duration).fadeOut();
}
function isWhitelistedWrapper() {
    // check if any wrapper urls are present in current url
    return WHITELISTED_WRAPPERS.some((wrapper) => window.location.href.includes(wrapper));
}
function getStrippedUrl() {
    // match url
    const activeURL = window.location.href.match(/^[\w]+:\/{2}([\w\.:-]+)/);
    if (activeURL != null) {
        const strippedURL = activeURL[1].replace('www.', '');
        return strippedURL;
    }
    // no url?
    return '';
}
function iterWhitelist() {
    // iterate whitelisted sites
    chrome.storage.sync.get(null, (storage) => {
        const strippedURL = getStrippedUrl();
        // activeURL exists
        if (strippedURL != '') {
            console.log(strippedURL);
            // if url in whitelist
            const m = storage.whitelistedSites;
            if (m.hasOwnProperty(strippedURL)) {
                console.log('whitelisted');
                // check if expired
                const parsedDate = new Date(m[strippedURL]);
                const currentDate = new Date();
                if (currentDate >= parsedDate) {
                    console.log('expired');
                    loadBlockPage(strippedURL);
                }
                else {
                    // is currently on whitelist
                    const timeDifference = parsedDate.getTime() - currentDate.getTime();
                    setTimeout(loadBlockPage, timeDifference);
                }
            }
            else {
                console.log('blocked');
                loadBlockPage(strippedURL);
            }
        }
        // otherwise do nothing
    });
}
function loadBlockPage(strippedURL) {
    // get prompt page content
    $.get(chrome.runtime.getURL('res/pages/prompt.html'), (page) => {
        // stop current page and replace with our blocker page
        window.stop();
        $('html').html(page);
        addFormListener(strippedURL);
        // inject show options page
        $('#linkToOptions').attr('href', chrome.runtime.getURL('res/pages/options.html'));
        // load css
        const cssPath = chrome.runtime.getURL('res/common.css');
        const cssLink = `<link rel="stylesheet" type="text/css" href="${cssPath}">`;
        document.head.innerHTML += cssLink;
        // animate background
        const anim = new BlobAnimation();
        anim.animate();
    });
}
function addFormListener(strippedURL) {
    var _a;
    const form = document.forms.namedItem('inputForm');
    // add listener for form submit
    (_a = form) === null || _a === void 0 ? void 0 : _a.addEventListener('submit', (event) => {
        // prevent default submit
        event.preventDefault();
        // extract entry
        const intentForm = event.target;
        const intent = new FormData(intentForm).get('intent');
        const intentString = intent.toString();
        const intentDate = new Date();
        callBackgroundWithIntent(intentString);
        addToStorage(intentString, intentDate, strippedURL);
    });
}
function addToStorage(intentString, intentDate, url) {
    chrome.storage.sync.get(null, (storage) => {
        // getting intent list map from storage
        let intentList = storage.intentList;
        // getting oldest date value from intent list map
        let oldest_date = new Date();
        for (const rawDate in intentList) {
            const date = new Date(rawDate);
            if (date < oldest_date) {
                oldest_date = date;
            }
        }
        // deleting oldest intent to keep intent count under 20
        if (Object.keys(intentList).length > storage.numIntentEntries) {
            console.log(`list full, popping ${oldest_date.toJSON()}`);
            delete intentList[oldest_date.toJSON()];
        }
        // adding new intent and date to intent list
        intentList[intentDate.toJSON()] = {
            intent: intentString,
            url: url,
        };
        // saving intentList to chrome storage
        chrome.storage.sync.set({ intentList: intentList }, () => {
            console.log('the intent "' + intentString + '" has been added');
        });
    });
}
function callBackgroundWithIntent(intent) {
    // open connection to runtime (background.ts)
    const port = chrome.runtime.connect({
        name: 'intentStatus',
    });
    port.postMessage({ intent: intent, url: window.location.href });
    port.onMessage.addListener((msg) => {
        switch (msg.status) {
            case 'ok':
                // show success message
                // optional: transition?
                chrome.storage.sync.get(null, (storage) => {
                    const WHITELIST_PERIOD = storage.whitelistTime;
                    displayStatus(`got it! ${WHITELIST_PERIOD} minutes starting now.`, 3000, REFLECT_INFO);
                    location.reload();
                });
                break;
            case 'too_short':
                $('#textbox').effect('shake');
                // display message
                displayStatus('your response is a little short. be more specific!', 3000, REFLECT_ERR);
                $('#textbox').val('');
                break;
            case 'invalid':
                $('#textbox').effect('shake');
                // display message
                displayStatus("that doesn't seem to be productive. try being more specific.", 3000, REFLECT_ERR);
                // clear input
                $('#textbox').val('');
                break;
        }
        // close connection
        port.disconnect();
    });
}
class BlobElement {
    constructor(maxX, maxY, minR, maxR) {
        this.fill = "#A6B1CE";
        this.x = this.originalX = Math.random() * maxX;
        this.y = this.originalY = Math.random() * maxY;
        this.r = minR + (Math.random() * (maxR - minR));
        this.element = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        // set styling
        this.element.setAttribute("r", this.r.toString());
        this.element.setAttribute("style", `fill: ${this.fill};`);
    }
    // update element
    update(mouseX, mouseY, repulsion, attraction) {
        const dx = this.x - mouseX;
        const dy = this.y - mouseY;
        const angle = Math.atan2(dy, dx);
        const dist = repulsion / Math.sqrt(dx * dx + dy * dy);
        this.x += Math.cos(angle) * dist;
        this.y += Math.sin(angle) * dist;
        this.x += (this.originalX - this.x) * attraction;
        this.y += (this.originalY - this.y) * attraction;
        this.element.setAttribute("cx", this.x.toString());
        this.element.setAttribute("cy", this.y.toString());
    }
}
BlobElement.COLOURS = ["#6474AC", "#8B9AC0", "#A6B1CE"];
class BlobAnimation {
    constructor() {
        this.config = {
            blur: 14,
            alphaMult: 30,
            alphaAdd: -10,
            numElements: 30,
            circleMinRadius: 15,
            circleMaxRadius: 60,
            attraction: 0.1,
            repulsion: 1000
        };
        this.animate = () => {
            requestAnimationFrame(this.animate);
            this.elements.forEach(e => {
                e.update(this.mouseX, this.mouseY, this.config.repulsion, this.config.attraction);
            });
        };
        // grab dom elements
        this.svg = document.getElementById("svg");
        this.colorMatrixF = document.getElementById("colorMatrixF");
        // bind event listeners
        const body = document.getElementById("reflect-main");
        window.addEventListener("resize", this.onResize, false);
        body.addEventListener("mousemove", (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
        }, false);
        body.addEventListener("mouseleave", this.resetMouse, false);
        // create initial svg g elements
        this.onResize();
        this.resetMouse();
        this.initElements();
        this.colorMatrixF.setAttribute("values", `1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 ${this.config.alphaMult} ${this.config.alphaAdd}`);
    }
    initElements() {
        // create group div with namespace
        this.elements = [];
        const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
        this.svg.appendChild(group);
        for (let i = 0; i < this.config.numElements; i++) {
            const e = new BlobElement(this.width, this.height, this.config.circleMinRadius, this.config.circleMaxRadius);
            e.update(this.mouseX, this.mouseY, this.config.repulsion, this.config.attraction);
            group.appendChild(e.element);
            this.elements.push(e);
        }
    }
    // set mouse cords back to bottom centre screen
    resetMouse() {
        this.mouseX = this.centerX;
        this.mouseY = 5 * this.centerY;
    }
    // recompute width, height, and centre
    onResize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.centerX = this.width / 2;
        this.centerY = this.height / 2;
    }
}
// function anim(): void {
//     let width = 0,
//         height = 0,
//         cx = 0,
//         cy = 0;
//     let svg, group, colorMatrixF;
//     let conf = {
//         blur: 14,
//         redMult: 1,
//         greenMult: 1,
//         blueMult: 1,
//         alphaMult: 30,
//         alphaAdd: -10,
//         randomColors: false,
//         numElements: 30,
//         circleMinRadius: 15,
//         circleMaxRadius: 60,
//         attraction: 0.1,
//         repulsion: 1000
//     };
//     let elements = [];
//     let mouseX = 0,
//         mouseY = 0;
//     function init() {
//         svg = document.getElementById("svg");
//         const body = document.getElementById("reflect-main");
//         colorMatrixF = document.getElementById("colorMatrixF");
//         onResize();
//         initElements();
//         updateColorMatrixF();
//         resetMouse();
//         window.addEventListener("resize", onResize, false);
//         body.addEventListener("mousemove", onMouseMove, false);
//         body.addEventListener("mouseleave", resetMouse, false);
//         animate();
//     }
//     function initElements() {
//         elements = [];
//         if (group) {
//             svg.removeChild(group);
//         }
//         group = document.createElementNS("http://www.w3.org/2000/svg", "g");
//         svg.appendChild(group);
//         let fill = REFLECT_INFO;
//         let x, y, r;
//         for (let i = 0; i < conf.numElements; i++) {
//             x = rnd(width);
//             y = rnd(height);
//             r = conf.circleMinRadius + rnd(conf.circleMaxRadius - conf.circleMinRadius);
//             let e: any = { x, y, ox: x, oy: y, r, fill };
//             e.elt = document.createElementNS("http://www.w3.org/2000/svg", "circle");
//             updateElement(e);
//             group.appendChild(e.elt);
//             elements.push(e);
//         }
//     }
//     function resetMouse() {
//         mouseX = cx;
//         mouseY = 5 * cy;
//     }
//     function animate() {
//         requestAnimationFrame(animate);
//         let dx, dy, dist, angle, x, y;
//         elements.forEach((e, i) => {
//             dx = e.x - mouseX;
//             dy = e.y - mouseY;
//             angle = Math.atan2(dy, dx);
//             dist = conf.repulsion / Math.sqrt(dx * dx + dy * dy);
//             e.x += Math.cos(angle) * dist;
//             e.y += Math.sin(angle) * dist;
//             e.x += (e.ox - e.x) * conf.attraction;
//             e.y += (e.oy - e.y) * conf.attraction;
//             updateElementPos(e);
//         });
//     }
//     function updateElement(e) {
//         updateElementPos(e);
//         e.elt.setAttribute("r", e.r);
//         e.elt.setAttribute("style", estyle(e));
//     }
//     function updateElementPos(e) {
//         e.elt.setAttribute("cx", e.x);
//         e.elt.setAttribute("cy", e.y);
//     }
//     function estyle(e) {
//         return `fill: ${e.fill};`;
//     }
//     function updateColorMatrixF() {
//         colorMatrixF.setAttribute("values", colorMatrixValues());
//     }
//     function onResize() {
//         width = window.innerWidth;
//         height = window.innerHeight;
//         cx = width / 2;
//         cy = height / 2;
//     }
//     function onMouseMove(e) {
//         mouseX = e.clientX;
//         mouseY = e.clientY;
//     }
//     function colorMatrixValues() {
//         return `${conf.redMult} 0 0 0 0 0 ${conf.greenMult} 0 0 0 0 0 ${conf.blueMult} 0 0 0 0 0 ${conf.alphaMult} ${conf.alphaAdd}`;
//     }
//     function rnd(max, negative = false) {
//         return negative ? Math.random() * 2 * max - max : Math.random() * max;
//     }
//     init();
// }
