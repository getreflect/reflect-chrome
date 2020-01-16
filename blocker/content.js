(function () {
	chrome.storage.sync.get('isEnabled', function(data) {
		// check to see if reflect is enabled
		if (data.isEnabled) {

			// check for is blocked
			chrome.storage.sync.get('blockedSites', function(data) {
				data.blockedSites.forEach(function(site) {
					if (window.location.href.includes(site)) {
						oldDat = $(":root").html()

						// get prompt page content
						$.get(chrome.runtime.getURL("res/pages/prompt.html"), function(page) {
							// refresh page with our blocker page
					        document.open();
						    document.write(page);
						    document.close();

						    // load css
    						var cssPath = chrome.runtime.getURL('res/common.css');
							$("head").append(
								$('<link rel="stylesheet" type="text/css" />').attr('href', cssPath)
							);

							// add blobs
							$("#top-left-blob").attr("src", chrome.runtime.getURL('res/blob-big-2.svg'))
							$("#bottom-right-blob").attr("src", chrome.runtime.getURL('res/blob-big-1.svg'))
							$("#small-blob1").attr("src", chrome.runtime.getURL('res/blob-med.svg'))
							$("#small-blob2").attr("src", chrome.runtime.getURL('res/blob-small.svg'))
						})

						// save url to cache
					}
				});
			});
		}
	});
})();