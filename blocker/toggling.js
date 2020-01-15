function turnFilteringOff() {
	chrome.storage.sync.set({ 'isEnabled': false }, function() {
		chrome.browserAction.setIcon({ path: { "16": 'blocker/res/off.png' } });
		console.log('Filtering disabled');
	});
}

function turnFilteringOn(callback) {
	if (callback === undefined) {
		callback = function(confirm) { };
	}
	var tabsToDeny = [];
	chrome.storage.sync.get('blockedSites', function(data) {
		chrome.tabs.query({}, function(tabs) {
			tabs.forEach(function(tab) {
				data.blockedSites.forEach(function(site) {
					if (tab.url.includes(site)) {
						tabsToDeny.push(tab);
					}
				});
			});
			chrome.storage.sync.set({ 'isEnabled': true }, function() {
				chrome.browserAction.setIcon({ path: 'blocker/res/on.png' }, function() {
					console.log('Filtering enabled.');
					callback(true);
				});
			});
		});
	});
};