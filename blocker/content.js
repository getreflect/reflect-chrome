(function () {
	chrome.storage.sync.get('isEnabled', function(data) {
		console.log(data)
		if (data.isEnabled) {
			alert("boi is on");

			// check for is blocked
			chrome.storage.sync.get('blockedSites', function(data) {
				data.blockedSites.forEach(function(site) {
					if (window.location.href.includes(site)) {
						alert("haha get fucked");
					}
				});
			});
		}
	});
})();