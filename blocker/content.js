(function () {
	chrome.storage.sync.get('isEnabled', function(data) {

		// check to see if reflect is enabled
		if (data.isEnabled) {

			// check for is blocked
			chrome.storage.sync.get('blockedSites', function(data) {
				data.blockedSites.forEach(function(site) {
					if (window.location.href.includes(site)) {
						$(":root").load(chrome.runtime.getURL("res/prompt.html"));
					}
				});
			});
		}
	});
})();