document.addEventListener("DOMContentLoaded", () => {
  const toggleSwitch: HTMLInputElement = document.querySelector(
    "#reflect-toggle"
  ) as HTMLInputElement;
  toggleSwitch.addEventListener("change", toggleState, false);

  // get current state and set approriately
  chrome.storage.sync.get(null, (storage) => {
    if (storage.isEnabled) {
      toggleSwitch.checked = true;
    } else {
      toggleSwitch.checked = false;
    }

    setupBlockListener(storage.blockedSites);
  });
});

// message background
function toggleState(e) {
  const port: chrome.runtime.Port = chrome.runtime.connect({
    name: "toggleState",
  });

  if (e.target.checked) {
    port.postMessage({ state: true });
  } else {
    port.postMessage({ state: false });
  }
}

function getButtonText(url: string, blockedSites: string[]): string {
  if (blockedSites.includes(url)) {
    return "unblock page.";
  } else {
    return "block page.";
  }
}

function setupBlockListener(blockedSites) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const urls: string[] = tabs.map((x) => x.url);

    if (urls[0] !== undefined) {
      // regex match for url
      const activeURL: RegExpMatchArray | null = urls[0].match(
        /^[\w]+:\/{2}([\w\.:-]+)/
      );

      // no matching sites, set empty
      if (activeURL !== null) {
        // strip www.
        const url: string = activeURL[1].replace("www.", "");
        document.getElementById("curDomain").textContent = url;

        // check if text should be "block" or "unblock"
        document.getElementById("block").innerHTML = getButtonText(
          url,
          blockedSites
        );

        document.getElementById("block").addEventListener("click", () => {
          // send url to be blocked by background script
          const port: chrome.runtime.Port = chrome.runtime.connect({
            name: "blockFromPopup",
          });

          // toggle state text
          const buttonText: string = document.getElementById("block").innerHTML;
          if (buttonText == "block page.") {
            port.postMessage({ unblock: false, siteURL: url });
            document.getElementById("block").innerHTML = "unblock page.";
          } else {
            port.postMessage({ unblock: true, siteURL: url });
            document.getElementById("block").innerHTML = "block page.";
          }
        });
      }
    } else {
      document.getElementById("curDomain").textContent = "none.";
    }
  });
}
