chrome.runtime.onInstalled.addListener(function initialization() {
	turnFilteringOff();

	chrome.storage.sync.set({ 'blockingMethod': "close_tab" });
	let timerData = { isTimerEnabled: false, blockUntilMilliseconds: 0 };
	chrome.storage.sync.set({ 'timerData': timerData });

	chrome.storage.sync.get('blockedSites', function(data) {
		blockedSites = data.blockedSites;
		if (typeof blockedSites != "undefined" && blockedSites != null
			&& blockedSites.length != null && blockedSites.length > 0) {
			var defaultListConfirm = confirm("Welcome back! \nDo you want to load your old filter list?");
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

function addDefaultFilters() {
	var blockedSites = ["://www.facebook.com", "://www.twitter.com", "://www.instagram.com", "://www.youtube.com"];
	chrome.storage.sync.set({ 'blockedSites': blockedSites }, function() {
		console.log('Default blocked sites have been loaded.');
	});
};

chrome.runtime.onStartup.addListener(function() {
	chrome.storage.sync.get('isEnabled', function(data) {
		if (data.isEnabled) {
			icon = 'blocker/res/on.png';
		}
		else if (!data.isEnabled) {
			icon = 'blocker/res/off.png';
		} else {
			icon = 'blocker/res/icon.png';
		}
		chrome.browserAction.setIcon({ path: { "16": icon } });
	});
});

chrome.browserAction.onClicked.addListener(function toggleBlocking() {
	chrome.storage.sync.get('timerData', function(data) {
		chrome.storage.sync.get('isEnabled', function(data) {
			if (data.isEnabled) {
				turnFilteringOff();
			}
			else {
				turnFilteringOn();
			}
		});
	});
});

chrome.contextMenus.create({
	id: "baFilterListMenu",
	title: "Show filter list",
	contexts: ["browser_action"]
});

chrome.contextMenus.create({
	id: "baAddToFilterList",
	title: "Block this:",
	contexts: ["browser_action"]
});

chrome.contextMenus.create({
	parentId: "baAddToFilterList",
	id: "baAddSiteToFilterList",
	title: "Page",
	contexts: ["browser_action"]
});

chrome.contextMenus.create({
	parentId: "baAddToFilterList",
	id: "baAddDomainToFilterList",
	title: "Domain",
	contexts: ["browser_action"]
});

chrome.contextMenus.create({
	id: "pgAddToFilterList",
	title: "Block this:",
	contexts: ["page"]
});

chrome.contextMenus.create({
	parentId: "pgAddToFilterList",
	id: "pgAddSiteToFilterList",
	title: "Page",
	contexts: ["page"]
});

chrome.contextMenus.create({
	parentId: "pgAddToFilterList",
	id: "pgAddDomainToFilterList",
	title: "Domain",
	contexts: ["page"]
});

chrome.contextMenus.onClicked.addListener(function contextMenuHandler(info, tab) {
	switch (info.menuItemId) {
		case "baFilterListMenu":
			chrome.tabs.create({ url: 'options/options.html' });
			break;
		case "baAddSiteToFilterList":
		case "pgAddSiteToFilterList":
			chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
				let urls = tabs.map(x => x.url);
				addUrlToBlockedSites(urls[0], tab);
			});
			break;
		case "baAddDomainToFilterList":
		case "pgAddDomainToFilterList":
			chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
				let urls = tabs.map(x => x.url);
				var domain = urls[0].match(/^[\w]+:\/{2}([\w\.:-]+)/)[1];
				addUrlToBlockedSites(domain, tab);
			});
			break;
	}
});

function addUrlToBlockedSites(url, tab) {
	chrome.storage.sync.get('blockedSites', function(data) {
		data.blockedSites.push(url); // urls.hostname
		chrome.storage.sync.set({ 'blockedSites': data.blockedSites }, function(data) {
			console.log(url + ' added to blocked sites');
		});
	});
}
