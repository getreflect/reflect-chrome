import 'babel-polyfill';
import {Tokenizer, IntentClassifier} from "./nn"

const SERVER_URL: string = "http://34.67.167.214/api";
const REQ_TIMEOUT: number = 2000; // time in milliseconds
const WHITELIST_PERIOD: number = 5;

// On install script --> TODO: onboarding flow
chrome.runtime.onInstalled.addListener(() => {
	turnFilteringOff();

	// set whitelist
	const whitelist: {[key: string]: Date} = {};
	chrome.storage.sync.set({ 'whitelistedSites': whitelist }, () => {
		console.log('Default whitelist sites have been set.');
	});

	// populate blocked sites
	chrome.storage.sync.get('blockedSites', (storage) => {
		let blockedSites: string[] = storage.blockedSites;

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
function addDefaultFilters(): void {
	const blockedSites: string[] = ["facebook.com", "twitter.com", "instagram.com", "youtube.com"];
	chrome.storage.sync.set({ 'blockedSites': blockedSites }, () => {
		console.log('Default blocked sites have been loaded.');
	});
};

// Listen for new runtime connections
chrome.runtime.onConnect.addListener((port) => {
	// check comm channel
	console.assert(port.name === "intentStatus");

	port.onMessage.addListener((msg) => {
		// extract intent and url from message
		const intent: string = msg.intent;
		const url: string = msg.url;

		// send new intent to server
		const sendIntent: string = JSON.stringify({intent: intent, url: url});
		let xhr: XMLHttpRequest = new XMLHttpRequest();
		xhr.timeout = REQ_TIMEOUT;
		xhr.open("POST", SERVER_URL, true);
		xhr.setRequestHeader('Content-Type', 'application/json');
		xhr.send(sendIntent);

		// handle response
		xhr.onload = () => {
			if (xhr.status === 200) {
				// add whitelist period for site
				chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
					const urls: string[] = tabs.map(x => x.url);
					const domain: string = cleanDomain(urls)
					addUrlToWhitelistedSites(domain, WHITELIST_PERIOD);
				});

				// send status to tab
				port.postMessage({status: "ok"});
				console.log(`Success! Redirecting`);
			} else {
				// send status to tab
				port.postMessage({status: "invalid"});
				console.log("Failed. Remaining on page.");
			}
		}

		// if timeout or error (e.g. not internet connection)
		xhr.ontimeout = (e) => {
			port.postMessage({status: "timeout"});
		};

		xhr.onerror = (e) => {
			port.postMessage({status: "timeout"});
		};
	});
});

// On Chrome startup, setup extension icons
chrome.runtime.onStartup.addListener(() => {
	chrome.storage.sync.get('isEnabled', (storage) => {
		let icon: string = 'res/icon.png';
		if (storage.isEnabled) {
			icon = 'res/on.png';
		}
		else if (!storage.isEnabled) {
			icon = 'res/off.png';
		}
		chrome.browserAction.setIcon({ path: { "16": icon } });
	});
});

// Toggle filtering
chrome.browserAction.onClicked.addListener(() => {
	chrome.storage.sync.get('isEnabled', (storage) => {
		if (storage.isEnabled) {
			turnFilteringOff();
		}
		else {
			turnFilteringOn();
		}
	});
});

// Catch menu clicks (page context and browser action context)
chrome.contextMenus.onClicked.addListener((info, tab) => {
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

// Load ML model stuff
const model: IntentClassifier = new IntentClassifier("acc84.78");

// push current site to storage
function addUrlToBlockedSites(url: string | undefined, tab: object | undefined): void {
	chrome.storage.sync.get('blockedSites', (storage) => {
		storage.blockedSites.push(url); // urls.hostname
		chrome.storage.sync.set({ 'blockedSites': storage.blockedSites }, () => {
			console.log(`${url} added to blocked sites`);
		});
	});
}


// push current site to whitelist with time to whitelist
function addUrlToWhitelistedSites(url: string, minutes: number): void {
	chrome.storage.sync.get('whitelistedSites', (storage) => {

		let whitelistedSites: {[key: string]: string} = storage.whitelistedSites

		let expiry: Date = addMinutes(new Date(), minutes)

		whitelistedSites[url] = expiry.toJSON();

		chrome.storage.sync.set({ 'whitelistedSites': whitelistedSites }, () => {
			console.log(`${url} added to whitelisted sites`);
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