const REFLECT_INFO = "#576ca8";
const REFLECT_ERR = "#ff4a47";

chrome.storage.sync.get(null, (storage) => {
	// check to see if reflect is enabled
	if (storage.isEnabled) {
		// check for is blocked
		storage.blockedSites.forEach((site: string) => {

			// is blocked
			if (window.location.href.includes(site)) {
				iterWhitelist()
			}
		});
	}
});

function displayStatus(message: string, duration: number = 3000, colour: string = REFLECT_INFO): void {
	// set content
	$("#statusContent").css("color", colour);
	$("#statusContent").text(message);

	// show, wait, then hide
	$("#statusContent").show().delay(duration).fadeOut()
}

function iterWhitelist(): void {
	// iterate whitelisted sites
	chrome.storage.sync.get(null, (storage) => {
		const activeURL : RegExpMatchArray | null = window.location.href.match(/^[\w]+:\/{2}([\w\.:-]+)/)

		// activeURL exists
		if (activeURL != null) {
			const strippedURL: string = activeURL[1].replace("www.", "");

			// if url in whitelist
			const m: {[key: string]: Date} = storage.whitelistedSites

			if (m.hasOwnProperty(strippedURL)) {
				console.log("whitelisted");

				// check if expired
				const parsedDate: Date = new Date(m[strippedURL])
				const currentDate: Date = new Date()
				if (currentDate >= parsedDate) {
					console.log("expired");
					loadBlockPage(strippedURL)
				} else {
					// is currently on whitelist
					const timeDifference: number = parsedDate.getTime() - currentDate.getTime();
					setTimeout(loadBlockPage, timeDifference);
				}
			} else {
				console.log("blocked");
				loadBlockPage(strippedURL)
			}
		}
		// otherwise do nothing
	})
}

function loadBlockPage(strippedURL: string): void {
	// get prompt page content
	$.get(chrome.runtime.getURL("res/pages/prompt.html"), (page) => {
		// refresh page with our blocker page
        document.open();
	    document.write(page);
	    document.close();

	    addFormListener(strippedURL);

	    // inject show options page
		$("#linkToOptions").attr("href", chrome.runtime.getURL('res/pages/options.html'));

	    // load css
		const cssPath: string = chrome.runtime.getURL('res/common.css');
		$("head").append(
			$('<link rel="stylesheet" type="text/css" />').attr('href', cssPath)
		);

		// add blobs
		$("#top-left-blob").attr("src", chrome.runtime.getURL('res/blob-big-2.svg'))
		$("#bottom-right-blob").attr("src", chrome.runtime.getURL('res/blob-big-1.svg'))
		$("#small-blob1").attr("src", chrome.runtime.getURL('res/blob-med.svg'))
		$("#small-blob2").attr("src", chrome.runtime.getURL('res/blob-small.svg'))
	});
}


function addFormListener(strippedURL: string): void {
    const form: HTMLFormElement | null = document.forms.namedItem("inputForm");

	// add listener for form submit
	form?.addEventListener('submit', (event) => {
		// prevent default submit
	    event.preventDefault();

	    // extract entry
	    const intentForm: HTMLFormElement | null = event.target as HTMLFormElement;
	    const intent: FormDataEntryValue = new FormData(intentForm).get('intent')
		const intentString: string = intent.toString()
		const intentDate: Date = new Date;

		callBackgroundWithIntent(intentString);
		addToStorage(intentString, intentDate, strippedURL);
	});
}

function addToStorage(intentString: string, intentDate: Date, url: string): void {
	chrome.storage.sync.get(null, (storage) => {
		// getting intent list map from storage
		let intentList: {[key: string]: Object} = storage.intentList;

		// getting oldest date value from intent list map
		let oldest_date: Date = new Date();
		for (const rawDate in intentList) {
			const date: Date = new Date(rawDate);
			if (date < oldest_date) {
				oldest_date = date;
			}
		}

		// deleting oldest intent to keep intent count under 20
		if (Object.keys(intentList).length > storage.numIntentEntries) {
			console.log(`list full, popping ${oldest_date.toJSON()}`);
			delete intentList[oldest_date.toJSON()]
		}

		// adding new intent and date to intent list
		intentList[intentDate.toJSON()] = {
			"intent": intentString,
			"url": url,
		};

		// saving intentList to chrome storage
		chrome.storage.sync.set({'intentList': intentList}, () => {
			console.log('the intent "' + intentString + '" has been added');
		});
	});
}

function callBackgroundWithIntent(intent: string): void {
    // open connection to runtime (background.ts)
    const port = chrome.runtime.connect({name: "intentStatus"});
	port.postMessage({intent: intent, url: window.location.href});
	port.onMessage.addListener((msg) => {
		switch (msg.status) {
			case "ok":
				// show success message
				// optional: transition?
				chrome.storage.sync.get(null, (storage) => {
					const WHITELIST_PERIOD: number = storage.whitelistTime;
					displayStatus(`got it! ${WHITELIST_PERIOD} minutes starting now.`, 3000, REFLECT_INFO);
					location.reload();
				})
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
		port.disconnect()
	});
}
