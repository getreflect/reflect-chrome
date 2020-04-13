const ENTER_KEY_CODE = 13;

// On page load, draw table and add button listener
document.addEventListener('DOMContentLoaded', function renderFilterListTable() {
	drawFilterListTable();
	setAddButtonListener();
	restoreSavedOptions();

	// options listeners
	setupOptionsListener();
});

function setupOptionsListener(): void {
	document.getElementById('save').addEventListener('click',
    saveCurrentOptions);
}

function saveCurrentOptions(): void {
	// get all form values
	const whitelistTimeElement: HTMLFormElement = document.getElementById('whitelistTime') as HTMLFormElement;
	const whitelistTime: number = whitelistTimeElement.value

	chrome.storage.sync.set({'whitelistTime': whitelistTime}, () => {
	    // Update status to let user know options were saved.
	    const status = document.getElementById('statusContent');
	    status.textContent = 'options saved.';
	    setTimeout(() => {
	    	status.textContent = '';
	    }, 1500);
	});
}

function restoreSavedOptions(): void {
	chrome.storage.sync.get('whitelistTime', (storage) => {
		const WHITELIST_PERIOD: number = storage.whitelistTime;
		(document.getElementById('whitelistTime') as HTMLFormElement).value = WHITELIST_PERIOD;
	})
}

function updateButtonListeners(): void {
	// get all buttons
	const buttons = document.getElementsByTagName("button");
	for (const button of <any>buttons) {
		button.addEventListener("click", () => {
			// get button ID
			const id: number = parseInt(button.id[0]);

			// get url
			const url: string = document.getElementById(button.id[0] + "site")?.innerHTML;

			// get blockedSites
			chrome.storage.sync.get('blockedSites', (storage) => {
				const blockedSites: string[]  = storage.blockedSites;

				// remove by ID
				blockedSites.splice(id, 1);

				// sync with chrome storage
				chrome.storage.sync.set({'blockedSites': blockedSites }, () => {
					console.log(`removed ${url} from blocked list`);
					drawFilterListTable();
				});
			});
		});
	};
};

function generateWebsiteDiv(id: number, site: string): string {
	return "<tr>" +
				`<td style="width: 95%"><p class="urlDisplay" id=${id}>${site}</p></td>` +
				`<td style="width: 5%"><button id=${id}>&times;</button></td>` +
		   "</tr>"
}

function drawFilterListTable(): void {
	chrome.storage.sync.get('blockedSites', (storage) => {
		const blockedSites: string[] = storage.blockedSites;
		const tableDiv: HTMLElement = document.getElementById('filterList');
		let table: string = '<table class="hover shadow styled">';
		let cur_id: number = 0;
		blockedSites.forEach((site: string) => {
			table += generateWebsiteDiv(cur_id, site)
			cur_id++;
		});
		table += "</table>";
		const filterList: HTMLElement = document.getElementById('filterList')
		if (filterList != null) {
			filterList.innerHTML = table;
		}		

		updateButtonListeners()
	});
};

// sets event listeners for add new url operations
function setAddButtonListener(): void {
	const urlInputElement: HTMLElement = document.getElementById('urlInput')

	// add key listener to submit new url on <ENTER> pressed
	urlInputElement.addEventListener("keypress", (event) => {
		if (event.keyCode == ENTER_KEY_CODE) {
			addUrlToFilterList();
		}
	});

	// add click listener to add URL button
	const addButton: HTMLElement = document.getElementById('add');
	addButton.addEventListener('click', () => {
		addUrlToFilterList();
	});
};

function addUrlToFilterList(): void {
	// get urlInput
	const urlInput: HTMLFormElement = document.getElementById('urlInput') as HTMLFormElement;

	// see if value is non-empty
	if (urlInput.value != "") {
		chrome.storage.sync.get('blockedSites', (storage) => {
			// get current blocked sites
			const blockedSites: string[] = storage.blockedSites;

			// add to blocked sites
			blockedSites.push(urlInput.value)

			// sync changes with chrome storage
			chrome.storage.sync.set({ 'blockedSites': blockedSites }, () => {
				console.log(`added ${urlInput} from blocked list`);

				// clear input
				urlInput.value = "";

				// redraw filterList
				drawFilterListTable();
			});
		});
	}
};
