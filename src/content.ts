const REFLECT_INFO = "#576ca8";
const REFLECT_ERR = "#ff4a47";

chrome.storage.sync.get(null, (storage) => {
	// check to see if reflect is enabled
	if (storage.isEnabled) {
		// check for is blocked
		const strippedURL : string = getStrippedUrl();
		storage.blockedSites.forEach((site: string) => {

			// is blocked
			if (strippedURL.includes(site)) {
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

function getStrippedUrl(): string {
	// match url
	const activeURL : RegExpMatchArray | null = window.location.href.match(/^[\w]+:\/{2}([\w\.:-]+)/)
	if (activeURL != null) {
		const strippedURL: string = activeURL[1].replace("www.", "");
		return strippedURL;
	}

	// no url?
	return "";
}

function iterWhitelist(): void {
	// iterate whitelisted sites
	chrome.storage.sync.get(null, (storage) => {
		const strippedURL : string = getStrippedUrl();

		// activeURL exists
		if (strippedURL != "") {
			console.log(strippedURL)
			
			// if url in whitelist
			const m: {[key: string]: Date} = storage.whitelistedSites

			if (m.hasOwnProperty(strippedURL)) {
				console.log("whitelisted");

				// check if expired
				const parsedDate: Date = new Date(m[strippedURL])
				const currentDate: Date = new Date()
				if (currentDate >= parsedDate) {
					console.log("expired");
					loadBlockPage()
				} else {
					// is currently on whitelist
					const timeDifference: number = parsedDate.getTime() - currentDate.getTime();
					setTimeout(loadBlockPage, timeDifference);
				}
			} else {
				console.log("blocked");
				loadBlockPage()
			}
		}
		// otherwise do nothing
	})
}

function loadBlockPage(): void {
	// get prompt page content
	$.get(chrome.runtime.getURL("res/pages/prompt.html"), (page) => {
		// stop current page and replace with our blocker page
        window.stop();
        $('html').html(page)

	    addFormListener();

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

function addFormListener(): void {
    const form: HTMLFormElement | null = document.forms.namedItem("inputForm");

	// add listener for form submit
	form?.addEventListener('submit', (event) => {
		// prevent default submit
	    event.preventDefault();

	    // extract entry
	    const intentForm: HTMLFormElement | null = event.target as HTMLFormElement;
	    const intent: FormDataEntryValue = new FormData(intentForm).get('intent')
	    const intentString: string = intent.toString()

	    callBackgroundWithIntent(intentString);
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