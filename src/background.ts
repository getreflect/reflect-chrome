// On install script --> TODO: onboarding flow
chrome.runtime.onInstalled.addListener(function initialization() {
	turnFilteringOff();


	// set last intent to N/A
	chrome.storage.sync.set({ 'lastIntent': "N/A" }, () => {
		console.log('Set default intent.');
	});	

	// set whitelist
	const whitelist: {[key: string]: Date} = {};
	chrome.storage.sync.set({ 'whitelistedSites': whitelist }, () => {
		console.log('Default whitelist sites have been set.');
	});

	// populate blocked sites
	chrome.storage.sync.get('blockedSites', (data) => {
		let blockedSites: string[] = data.blockedSites;

		// check to see if extension was installed before
		if (typeof blockedSites != "undefined" && blockedSites != null
			&& blockedSites.length != null && blockedSites.length > 0) {
			const defaultListConfirm: boolean = confirm("Welcome back to reflect! \nDo you want to load your old filter list?");
			if (defaultListConfirm) {
				console.log("User confirmed keeping a previous filter list");
			}
			else {
				console.log("User cancelled loading a previous filter list.");
				addDefaultFilters();
			}
		}
		else {
			console.log("User didn't have any previous filters");
			addDefaultFilters();
		}
	});
});

// default list of blocked sites
function addDefaultFilters() : void {
	const blockedSites: string[] = ["facebook.com", "twitter.com", "instagram.com", "youtube.com"];
	chrome.storage.sync.set({ 'blockedSites': blockedSites }, () => {
		console.log('Default blocked sites have been loaded.');
	});
};
//TODO
// Listen for changes in chrome storage
chrome.storage.onChanged.addListener((changes, namespace) => { 
	for (const key in changes) {
		const storageChange: chrome.storage.StorageChange = changes[key]; 

		// watch for intent change
		if (key == "lastIntent") {
			// send new intent to server
			const sendIntent: string = JSON.stringify({intent: storageChange.newValue});

			let xhr: XMLHttpRequest = new XMLHttpRequest();
			xhr.open("POST", "https://reflect-nlp.herokuapp.com/", true);
			xhr.setRequestHeader('Content-Type', 'application/json');
			xhr.send(sendIntent);

			xhr.onload = function() {
				// on success -> redirect to cached url
				if (xhr.status == 200) {
					chrome.storage.sync.get('cachedURL', (data) => {
						// add whitelist period for site
						chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
							const urls: string[] = tabs.map(x => x.url);
							const domain: string = cleanDomain(urls)
							addUrlToWhitelistedSites(domain, 5);
						});

						chrome.tabs.update({url: data.cachedURL});
						console.log(`Success! Redirecting to: ${data.cachedURL}`);
					});
				} else {
					console.log("Failed. Remaining on page.");
					// show blocked page 
				}
			}
		}
	}
});

// On Chrome startup, setup extension icons
chrome.runtime.onStartup.addListener( () => {
	chrome.storage.sync.get('isEnabled', (data) => {
		let icon: string = 'res/icon.png';
		if (data.isEnabled) {
			icon = 'res/on.png';
		}
		else if (!data.isEnabled) {
			icon = 'res/off.png';
		}
		chrome.browserAction.setIcon({ path: { "16": icon } });
	});
});

// Toggle filtering
chrome.browserAction.onClicked.addListener(function toggleBlocking() {
	chrome.storage.sync.get('isEnabled', (data) => {
		if (data.isEnabled) {
			turnFilteringOff();
		}
		else {
			turnFilteringOn();
		}
	});
});

// Catch menu clicks (page context and browser action context)
chrome.contextMenus.onClicked.addListener(function contextMenuHandler(info, tab) {
	switch (info.menuItemId) {
		case "baFilterListMenu":
			chrome.tabs.create({ url: 'res/pages/options.html' });
			break;
		case "baAddSiteToFilterList":
		case "pgAddSiteToFilterList":
			chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
				const urls: string[]= tabs.map(x => x.url);
				addUrlToBlockedSites(urls[0], tab);
			});
			break;
		case "baAddDomainToFilterList":
		case "pgAddDomainToFilterList":
			chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
				const urls: string[] = tabs.map(x => x.url);
				const domain: string= cleanDomain(urls)
				addUrlToBlockedSites(domain, tab);
			});
			break;
	}
});

// push current site to storage
function addUrlToBlockedSites(url: string | undefined, tab: object | undefined) : void {
	chrome.storage.sync.get('blockedSites', (data) => {
		data.blockedSites.push(url); // urls.hostname
		chrome.storage.sync.set({ 'blockedSites': data.blockedSites }, () => {
			console.log(`${url} added to blocked sites`);
		});
	});
}


// push current site to whitelist with time to whitelist
function addUrlToWhitelistedSites(url: string, minutes: number) : void {
	chrome.storage.sync.get('whitelistedSites', (data) => {

		let m: {[key: string]: string} = data.whitelistedSites

		let expiry: Date = addMinutes(new Date(), minutes)

		m[url] = expiry.toJSON();

		chrome.storage.sync.set({ 'whitelistedSites': m }, () => {
			console.log(`${url} added to whitelisted sites`);
			chrome.storage.sync.get(['whitelistedSites'], (data) => {
				console.log(data.whitelistedSites);
			});
		});
	});
}

function turnFilteringOff() : void {
	chrome.storage.sync.set({ 'isEnabled': false }, () => {
		chrome.browserAction.setIcon({ path: { "16": 'res/off.png' } });
		console.log('Filtering disabled');
	});
}

function turnFilteringOn() : void {
	chrome.storage.sync.set({ 'isEnabled': true }, () => {
		chrome.browserAction.setIcon({ path: 'res/on.png' }, () => {
			console.log('Filtering enabled.');
		});
	});
};