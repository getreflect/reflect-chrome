// On install script --> TODO: onboarding flow
chrome.runtime.onInstalled.addListener(function initialization() {
	turnFilteringOff();

	chrome.storage.sync.set({ 'lastIntent': "N/A" }, function() {
		console.log('Set default intent');
	});	

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

// default list of blocked sites
function addDefaultFilters() {
	var blockedSites = ["://www.facebook.com", "://www.twitter.com", "://www.instagram.com", "://www.youtube.com"];
	chrome.storage.sync.set({ 'blockedSites': blockedSites }, function() {
		console.log('Default blocked sites have been loaded.');
	});
};

// Listen for changes in chrome storage
chrome.storage.onChanged.addListener(function(changes, namespace) {
	for (var key in changes) {
		var storageChange = changes[key];

		// watch for intent change
		if (key == "lastIntent") {
			// send new intent to server
			sendIntent = JSON.stringify({intent: storageChange.newValue});

			var xhr = new XMLHttpRequest();
			xhr.open("POST", "http://localhost:8081/", true);
			xhr.setRequestHeader('Content-Type', 'application/json');
			xhr.send(sendIntent);

			xhr.onload = function() {
				// on success -> redirect to cached url
				if (xhr.status == 200) {
					chrome.storage.sync.get('cachedURL', function(data) {
						chrome.tabs.update({url: data.cachedURL});
						console.log("Success! Redirecting to: " + data.cachedURL);
					});
				} else {
					console.log("Failed. Remaining on page.");
				}
			}
		}
	}
});

// On Chrome startup, setup extension icons
chrome.runtime.onStartup.addListener(function() {
	chrome.storage.sync.get('isEnabled', function(data) {
		if (data.isEnabled) {
			icon = 'res/on.png';
		}
		else if (!data.isEnabled) {
			icon = 'res/off.png';
		} else {
			icon = 'res/icon.png';
		}
		chrome.browserAction.setIcon({ path: { "16": icon } });
	});
});

// Toggle filtering
chrome.browserAction.onClicked.addListener(function toggleBlocking() {
	chrome.storage.sync.get('isEnabled', function(data) {
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

// push current site to storage
function addUrlToBlockedSites(url, tab) {
	chrome.storage.sync.get('blockedSites', function(data) {
		data.blockedSites.push(url); // urls.hostname
		chrome.storage.sync.set({ 'blockedSites': data.blockedSites }, function(data) {
			console.log(url + ' added to blocked sites');
		});
	});
}
