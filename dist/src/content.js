const REFLECT_INFO = "#576ca8";
const REFLECT_ERR = "#ff4a47";
class WeekStats {
    constructor(obj) {
        // cast object obj to this (type WeekStats)
        Object.assign(this, obj);
        // map dayStats from obj to DayStats
        this.dayStats = this.dayStats.map((dayStatObj) => DayStats.fromData(dayStatObj));
        this.updateCurrentDay();
    }
    // update current day
    updateCurrentDay() {
        this.currentDay = this.dayStats[0];
    }
    // get current day
    getCurrentDay() {
        return this.currentDay;
    }
    // check to see if the current day is not actually today
    // returns true if current day != today's actual date
    currentDayExpired() {
        return this.currentDay.getDate() != (new Date()).getDay();
    }
    pushbackDates() {
        let tempDayStats = this.dayStats;
        // take current dayStats and pop off the last element
        tempDayStats.pop();
        // concatenate a new DayStats object to the front of it
        tempDayStats.unshift(new DayStats());
        // replace dayStats with tempDayStats
        this.dayStats = tempDayStats;
        this.updateCurrentDay();
    }
    incrementDayStats(type) {
        // check to see if currentDay is expired
        if (this.currentDayExpired()) {
            // if it is expired, push dates back and create new date
            this.pushbackDates();
        }
        // modify currentDay based off of the type of visit
        console.log(`${type} count has been incremented`);
        switch (type) {
            case "visited":
                this.currentDay.visited++;
                break;
            case "blocked":
                this.currentDay.blocked++;
                break;
            case "passed":
                this.currentDay.passed++;
                break;
        }
    }
}
class DayStats {
    constructor() {
        this.visited = 0;
        this.blocked = 0;
        this.passed = 0;
        this.date = (new Date()).getDay();
        this.dateString = (new Date()).toLocaleDateString('default', { month: 'long', day: 'numeric' });
    }
    static fromData(obj) {
        let newDayStats = new DayStats();
        Object.assign(newDayStats, obj);
        return newDayStats;
    }
    getDate() {
        return this.date;
    }
    getDateString() {
        return this.dateString;
    }
}
chrome.storage.sync.get(null, (storage) => {
    // check to see if reflect is enabled
    if (storage.isEnabled) {
        // increment number of times visited
        incrementDayStats('visited');
        // check for is blocked
        const strippedURL = getStrippedUrl();
        storage.blockedSites.forEach((site) => {
            // is blocked
            if (strippedURL.includes(site)) {
                iterWhitelist();
            }
        });
    }
});
function displayStatus(message, duration = 3000, colour = REFLECT_INFO) {
    // set content
    $("#statusContent").css("color", colour);
    $("#statusContent").text(message);
    // show, wait, then hide
    $("#statusContent").show().delay(duration).fadeOut();
}
function getStrippedUrl() {
    // match url
    const activeURL = window.location.href.match(/^[\w]+:\/{2}([\w\.:-]+)/);
    if (activeURL != null) {
        const strippedURL = activeURL[1].replace("www.", "");
        return strippedURL;
    }
    // no url?
    return "";
}
function iterWhitelist() {
    // iterate whitelisted sites
    chrome.storage.sync.get(null, (storage) => {
        const strippedURL = getStrippedUrl();
        // activeURL exists
        if (strippedURL != "") {
            // if url in whitelist
            const m = storage.whitelistedSites;
            if (m.hasOwnProperty(strippedURL)) {
                console.log("whitelisted");
                // check if expired
                const parsedDate = new Date(m[strippedURL]);
                const currentDate = new Date();
                if (currentDate >= parsedDate) {
                    console.log("expired");
                    loadBlockPage(strippedURL);
                }
                else {
                    // is currently on whitelist
                    const timeDifference = parsedDate.getTime() - currentDate.getTime();
                    setTimeout(loadBlockPage, timeDifference);
                }
            }
            else {
                console.log("blocked");
                loadBlockPage(strippedURL);
            }
        }
        // otherwise do nothing
    });
}
function loadBlockPage(strippedURL) {
    // increment number of times blocked
    incrementDayStats('blocked');
    // get prompt page content
    $.get(chrome.runtime.getURL("res/pages/prompt.html"), (page) => {
        // stop current page and replace with our blocker page
        window.stop();
        $('html').html(page);
        addFormListener(strippedURL);
        // inject show options page
        $("#linkToOptions").attr("href", chrome.runtime.getURL('res/pages/options.html'));
        // load css
        const cssPath = chrome.runtime.getURL('res/common.css');
        $("head").append($('<link rel="stylesheet" type="text/css" />').attr('href', cssPath));
        // add blobs
        $("#top-left-blob").attr("src", chrome.runtime.getURL('res/blob-big-2.svg'));
        $("#bottom-right-blob").attr("src", chrome.runtime.getURL('res/blob-big-1.svg'));
        $("#small-blob1").attr("src", chrome.runtime.getURL('res/blob-med.svg'));
        $("#small-blob2").attr("src", chrome.runtime.getURL('res/blob-small.svg'));
    });
}
function addFormListener(strippedURL) {
    var _a;
    const form = document.forms.namedItem("inputForm");
    // add listener for form submit
    (_a = form) === null || _a === void 0 ? void 0 : _a.addEventListener('submit', (event) => {
        // prevent default submit
        event.preventDefault();
        // extract entry
        const intentForm = event.target;
        const intent = new FormData(intentForm).get('intent');
        const intentString = intent.toString();
        const intentDate = new Date;
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
            "intent": intentString,
            "url": url,
        };
        // saving intentList to chrome storage
        chrome.storage.sync.set({ 'intentList': intentList }, () => {
            console.log('the intent "' + intentString + '" has been added');
        });
    });
}
function callBackgroundWithIntent(intent) {
    // open connection to runtime (background.ts)
    const port = chrome.runtime.connect({ name: "intentStatus" });
    port.postMessage({ intent: intent, url: window.location.href });
    port.onMessage.addListener((msg) => {
        switch (msg.status) {
            case "ok":
                // increment number of times passed
                incrementDayStats('passed');
                chrome.storage.sync.get(null, (storage) => {
                    const WHITELIST_PERIOD = storage.whitelistTime;
                    displayStatus(`got it! ${WHITELIST_PERIOD} minutes starting now.`, 3000, REFLECT_INFO);
                    location.reload();
                });
                break;
            case "too_short":
                $('#textbox').effect("shake");
                // display message
                displayStatus("your response is a little short. be more specific!", 3000, REFLECT_ERR);
                $("#textbox").val("");
                break;
            case "invalid":
                $('#textbox').effect("shake");
                // display message
                displayStatus("that doesn't seem to be productive. try being more specific.", 3000, REFLECT_ERR);
                // clear input
                $("#textbox").val("");
                break;
        }
        // close connection
        port.disconnect();
    });
}
function incrementDayStats(type) {
    chrome.storage.sync.get(null, (storage) => {
        // getting dayStats array from storage
        let pastSevenDays = new WeekStats(storage.pastSevenDays);
        pastSevenDays.incrementDayStats(type);
        chrome.storage.sync.set({ 'pastSevenDays': pastSevenDays }, () => {
            console.log(pastSevenDays);
            console.log('synced statistics');
        });
    });
}
