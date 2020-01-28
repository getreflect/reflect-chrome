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

	    const f: HTMLFormElement | null = document.forms.namedItem("inputForm");

    	// add listener for form submit
		f?.addEventListener('submit', (event) => {
			// prevent default submit
		    event.preventDefault();

		    // extract entry
		    const targ: HTMLFormElement | null = event.target as HTMLFormElement;
		    const intent: FormDataEntryValue = (new FormData(targ)).get('intent')

		    // store in chrome storage
			chrome.storage.sync.set({ 'lastIntent': intent }, () => {
				console.log('Intent set to: ' + intent);
			});
		});

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

		// save url to cache
	    const url: string = location.href;
		chrome.storage.sync.set({ 'cachedURL': url}, () => {
			console.log(`Set cached url to: ${url}`);
		});	
	});
}