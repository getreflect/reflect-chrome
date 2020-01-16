(function () {
	chrome.storage.sync.get('isEnabled', function(data) {
		// check to see if reflect is enabled
		if (data.isEnabled) {

			// check for is blocked
			chrome.storage.sync.get('blockedSites', function(data) {
				data.blockedSites.forEach(function(site) {
					if (window.location.href.includes(site)) {
						oldDat = $(":root").html()
						$.get(chrome.runtime.getURL("res/pages/prompt.html"), function(page) {
					        document.open();
						    document.write(page);
						    document.close();

    						var cssPath = chrome.runtime.getURL('res/common.css');
							$("head").append(
								$('<link rel="stylesheet" type="text/css" />').attr('href', cssPath)
							);
						})
						// save url to cache

						// load css and images
					}
				});
			});
		}
	});
})();