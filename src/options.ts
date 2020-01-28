const ENTER_KEY_CODE = 13;

// On page load, draw table and add button listener
document.addEventListener('DOMContentLoaded', function renderFilterListTable() {
	drawFilterListTable(setDeleteButtonsListeners);
	setAddButtonListener();
});

function setDeleteButtonsListeners() : void {
	let buttons: HTMLCollectionOf<HTMLButtonElement> = document.getElementsByTagName("button");
	for (const button of buttons) {
		button.addEventListener("click", () => {
			let id: number = parseInt(button.id[0]);
			let url: string = document.getElementById(button.id[0] + "site")?.innerHTML;
			chrome.storage.sync.get('blockedSites', (data) => {
				let blockedSites: string[]  = data.blockedSites;
				blockedSites.splice(id, 1);
				chrome.storage.sync.set({ 'blockedSites': blockedSites }, () => {
					console.log(`removed ${url} from blocked list`);
					drawFilterListTable(setDeleteButtonsListeners);
				});
			});
		});
	};
};

function drawFilterListTable(callback: Function | undefined) : void {
	chrome.storage.sync.get('blockedSites', (data) => {
		let blockedSites: string[] = data.blockedSites;
		let tableDiv: HTMLElement = document.getElementById('filterList');
		let table: string = "<table>";
		let counter: number = 0;
		blockedSites.forEach((site: string) => {
			table += "<tr><td id =\"" + counter + "site\">"
				+ site + "</td><td><button id =\"" + counter++
				+ "button\">&times;</button ></td></tr>";
		});
		table += "</table>";
		let filterList: HTMLElement = document.getElementById('filterList')
		if (filterList != null) {
			filterList.innerHTML = table;
		}		

		if (callback === undefined) {
      		// create empty callback
			callback = () => { };
		}
		callback();
	});
};

function setAddButtonListener() : void {
	document.getElementById('urlInput')?.addEventListener("keypress", (event) => {
		if (event.keyCode == ENTER_KEY_CODE) {
			addUrlToFilterList();
		}
	});
	let addButton: HTMLElement = document.getElementById('add');
	addButton?.addEventListener('click', () => {
		addUrlToFilterList();
	});
};

function addUrlToFilterList() : void {
	let urlInput: HTMLFormElement = document.getElementById('urlInput') as HTMLFormElement;
	if (urlInput.value != "") {
		chrome.storage.sync.get('blockedSites', (data) => {
			let blockedSites: string[] = data.blockedSites;
			blockedSites.push(urlInput.value)
			chrome.storage.sync.set({ 'blockedSites': blockedSites }, () => {
				console.log(`added ${urlInput} from blocked list`);
				urlInput.value = "";
				drawFilterListTable(setDeleteButtonsListeners);
			});
		});
	}
};
