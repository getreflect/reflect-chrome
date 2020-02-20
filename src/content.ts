chrome.storage.sync.get('isEnabled', (storage) => {
	// check to see if reflect is enabled
	if (storage.isEnabled) {
		// check for is blocked
		chrome.storage.sync.get('blockedSites', (storage) => {
			storage.blockedSites.forEach((site: string) => {

				// is blocked
				if (window.location.href.includes(site)) {
					iterWhitelist()
				}
			});
		});
	}
});

function iterWhitelist() : void {
	// iterate whitelisted sites
	chrome.storage.sync.get('whitelistedSites', (storage) => {
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
				if ((new Date) >= parsedDate) {
					console.log("expired");
					loadBlockPage()
				}
			} else {
				console.log("blocked");
				loadBlockPage()
			}
		}
		// otherwise do nothing
	})
}

function loadBlockPage() : void {
	// get prompt page content
	$.get(chrome.runtime.getURL("res/pages/prompt.html"), (page) => {
		// refresh page with our blocker page
        document.open();
	    document.write(page);
	    document.close();

	    addFormListener();

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

function addFormListener() : void {
    const form: HTMLFormElement | null = document.forms.namedItem("inputForm");

	// add listener for form submit
	form?.addEventListener('submit', (event) => {
		// prevent default submit
	    event.preventDefault();

	    // extract entry
	    const intentForm: HTMLFormElement | null = event.target as HTMLFormElement;
	    const intent: FormDataEntryValue = new FormData(intentForm).get('intent')

	    callBackgroundWithIntent(intent.toString());
	});
}

function callBackgroundWithIntent(intent: string) : void {
    // open connection to runtime (background.ts)
    const port = chrome.runtime.connect({name: "intentStatus"});
	port.postMessage({intent: intent});

	// TODO !!!
	// Display loader while we wait for response

	port.onMessage.addListener((msg) => {
		switch (msg.status) {
			case "ok":
				// show success message
				// optional: transition?
				location.reload();
				break;

			case "invalid":
				$('#textbox').effect("shake");
				// clear input
				break;
			
			case "timeout":
				$('#textbox').effect("shake");
				break;
		}

		// close connection
		port.disconnect()
	});
}