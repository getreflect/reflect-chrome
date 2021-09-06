(() => {
  // build/util.js
  function cleanDomain(urls, exact = false) {
    if (urls[0] === void 0) {
      return "";
    } else {
      const activeURL = urls[0].match(exact ? /^[\w]+:\/{2}([^#?]+)/ : /^[\w]+:\/{2}([\w\.:-]+)/);
      if (activeURL == null) {
        return "";
      } else {
        return activeURL[1].replace("www.", "");
      }
    }
  }

  // build/storage.js
  function getStorage() {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.get(null, (storage2) => {
        if (chrome.runtime.lastError !== void 0) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(storage2);
        }
      });
    });
  }

  // build/popup.js
  document.addEventListener("DOMContentLoaded", () => {
    const toggleSwitch = document.querySelector("#reflect-toggle");
    toggleSwitch.addEventListener("change", toggleState, false);
    getStorage().then((storage2) => {
      toggleSwitch.checked = storage2.isEnabled;
      setupBlockListener(storage2.blockedSites);
    });
  });
  function toggleState(e) {
    const port = chrome.runtime.connect({
      name: "toggleState"
    });
    port.postMessage({state: e.target.checked});
    port.disconnect();
  }
  function updateButton(unblock) {
    document.getElementById("block").innerHTML = unblock ? "block page." : "unblock page.";
    document.getElementById("block").style.borderRadius = unblock ? "5px 0 0 5px" : "5px";
    document.getElementById("dropdown").style.display = unblock ? "block" : "none";
  }
  function setupBlockListener(blockedSites) {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      const urls = tabs.map((x) => x.url);
      const domain = cleanDomain(urls);
      const url = cleanDomain(urls, true);
      if (domain === "") {
        document.getElementById("curDomain").textContent = "none.";
        return;
      }
      document.getElementById("curDomain").textContent = domain;
      let exact = false;
      if (blockedSites.includes(domain)) {
        updateButton(false);
      } else if (blockedSites.includes(url)) {
        updateButton(false);
        exact = true;
      }
      document.getElementById("block").addEventListener("click", () => {
        const port = chrome.runtime.connect({
          name: "blockFromPopup"
        });
        const buttonText = document.getElementById("block").innerHTML;
        if (buttonText === "block page.") {
          port.postMessage({unblock: false, siteURL: domain});
          updateButton(false);
        } else {
          port.postMessage({unblock: true, siteURL: exact ? url : domain});
          updateButton(true);
        }
        port.disconnect();
      });
      document.getElementById("blockPath").addEventListener("click", () => {
        const port = chrome.runtime.connect({
          name: "blockFromPopup"
        });
        const buttonText = document.getElementById("block").innerHTML;
        if (buttonText === "block page.") {
          port.postMessage({unblock: false, siteURL: url});
          updateButton(false);
        }
        port.disconnect();
      });
      document.getElementById("dropdown").addEventListener("click", () => {
        const dropdown = document.getElementById("blockPath");
        console.log(dropdown.style.display);
        dropdown.style.display = dropdown.style.display === "none" ? "block" : "none";
      });
      window.onclick = function(event) {
        const target = event.target;
        if (!target.matches("#dropdown")) {
          const dropdown = document.getElementById("blockPath");
          dropdown.style.display = "none";
        }
      };
    });
  }
})();
//# sourceMappingURL=popup.js.map
