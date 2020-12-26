(() => {
  // build/blob_animation.js
  var BlobElement = class {
    constructor(x, y, r, is3D) {
      this.x = this.originalX = x;
      this.y = this.originalY = y;
      this.r = r || 10;
      this.element = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      this.fill = is3D ? "url(#_r_gradient)" : "#A6B1CE";
      this.element.setAttribute("r", this.r.toString());
      this.element.setAttribute("style", `fill: ${this.fill};`);
    }
    update(mouseX, mouseY, repulsion, attraction) {
      const dx = this.x - mouseX;
      const dy = this.y - mouseY;
      const angle = Math.atan2(dy, dx);
      const dist = repulsion / Math.sqrt(dx * dx + dy * dy);
      this.x += Math.cos(angle) * dist;
      this.y += Math.sin(angle) * dist;
      this.x += (this.originalX - this.x) * attraction;
      this.y += (this.originalY - this.y) * attraction;
      this.element.setAttribute("cx", this.x.toString());
      this.element.setAttribute("cy", this.y.toString());
    }
  };
  var BlobAnimation = class {
    constructor(is3D) {
      this.config = {
        blur: 8,
        alphaMult: 30,
        alphaAdd: -10,
        numSeeds: 6,
        childrenPerSeed: 4,
        childrenDistanceRange: 125,
        circleMinRadius: 15,
        circleMaxRadius: 75,
        attraction: 0.1,
        repulsion: 1e3
      };
      this.animate = () => {
        requestAnimationFrame(this.animate);
        this.elements.forEach((e) => {
          e.update(this.mouseX, this.mouseY, this.config.repulsion, this.config.attraction);
        });
      };
      this.is3D = is3D;
      this.svg = document.getElementById("svg");
      this.colorMatrixF = document.getElementById("colorMatrixF");
      const body = document.getElementById("reflect-main");
      window.addEventListener("resize", this.onResize, false);
      body.addEventListener("mousemove", (e) => {
        this.mouseX = e.clientX;
        this.mouseY = e.clientY;
      }, false);
      body.addEventListener("mouseleave", this.resetMouse, false);
      this.onResize();
      this.resetMouse();
      this.initElements();
      this.colorMatrixF.setAttribute("values", `1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 ${this.config.alphaMult} ${this.config.alphaAdd}`);
    }
    random(min, max) {
      return min + Math.random() * (max - min);
    }
    randomRange(targ, range) {
      return targ + (Math.random() * 2 - 1) * range;
    }
    initElements() {
      this.elements = [];
      const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
      this.svg.appendChild(group);
      for (let i = 0; i < this.config.numSeeds; i++) {
        const e = new BlobElement(this.random(this.width * 0.4, this.width), this.randomRange(this.centerY, this.height * 0.4), this.random(this.config.circleMinRadius, this.config.circleMaxRadius), this.is3D);
        e.update(this.mouseX, this.mouseY, this.config.repulsion, this.config.attraction);
        group.appendChild(e.element);
        this.elements.push(e);
      }
      this.elements.forEach((e) => {
        for (let j = 0; j < this.config.childrenPerSeed; j++) {
          const child = new BlobElement(this.randomRange(e.x, this.config.childrenDistanceRange), this.randomRange(e.y, this.config.childrenDistanceRange), this.random(this.config.circleMinRadius, this.config.circleMaxRadius), this.is3D);
          child.update(this.mouseX, this.mouseY, this.config.repulsion, this.config.attraction);
          group.appendChild(child.element);
          this.elements.push(child);
        }
      });
    }
    resetMouse() {
      this.mouseX = this.centerX;
      this.mouseY = 5 * this.centerY;
    }
    onResize() {
      this.width = window.innerWidth;
      this.height = window.innerHeight;
      this.centerX = this.width / 2;
      this.centerY = this.height / 2;
    }
  };
  var blob_animation_default = BlobAnimation;

  // build/util.js
  function cleanDomain(urls) {
    if (urls[0] === void 0) {
      return "";
    } else {
      const activeURL = urls[0].match(/^[\w]+:\/{2}([\w\.:-]+)/);
      if (activeURL == null) {
        return "";
      } else {
        return activeURL[1].replace("www.", "");
      }
    }
  }
  function insertAfter(newNode, existingNode) {
    existingNode.parentNode.insertBefore(newNode, existingNode.nextSibling);
  }
  function createDivFromHTML(htmlString) {
    const newDiv = document.createElement("div");
    newDiv.insertAdjacentHTML("beforeend", htmlString);
    return newDiv;
  }
  function getElementFromForm(id) {
    return document.getElementById(id);
  }

  // build/storage.js
  function getStorage() {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.get(null, (storage3) => {
        if (chrome.runtime.lastError !== void 0) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(storage3);
        }
      });
    });
  }
  function setStorage(key) {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.set(key, () => {
        if (chrome.runtime.lastError !== void 0) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  }
  function logIntentToStorage(intentString, intentDate, url) {
    getStorage().then((storage3) => {
      let intentList = storage3.intentList;
      let oldest_date = new Date();
      for (const rawDate in intentList) {
        const date = new Date(rawDate);
        if (date < oldest_date) {
          oldest_date = date;
        }
      }
      if (Object.keys(intentList).length > storage3.numIntentEntries) {
        console.log(`list full, popping ${oldest_date.toJSON()}`);
        delete intentList[oldest_date.toJSON()];
      }
      intentList[intentDate.toJSON()] = {
        intent: intentString,
        url
      };
      setStorage({intentList}).then(() => {
        console.log(`logged intent "${intentString}"`);
      });
    });
  }

  // build/onboarding_options.js
  var getSettingsHTMLString = () => {
    return `
    <table class="options_panel">
        <tr>
            <td style="width:60%">
                <h3 class="setting">enable blobs.</h3>
                <p class="subtext">whether to render the interactive blobs on the block page.</p>
            </td>
            <td>
                <input class='toggle' id='enableBlobs' type='checkbox'>
                <label class='toggle-button' for='enableBlobs'></label>
            </td>
        </tr>
        <tr>
            <td>
                <h3 class="setting">enable 3D.</h3>
                <p class="subtext">whether to enable the 3D-like effect on the blobs on the block page.</p>
            </td>
            <td>
                <input class='toggle' id='enable3D' type='checkbox'>
                <label class='toggle-button' for='enable3D'></label>
            </td>
        </tr>
        <tr>
            <td>
                <h3 class="setting">whitelist time.</h3>
                <p class="subtext">time allowed on a website after successful intent (minutes).</p>
            </td>
            <td>
                <input id="whitelistTime" type="number" min="0">
            </td>
        </tr>
    </table>
    <p id="statusMessage">
        <span id="statusContent"></span>
        <span>&nbsp;</span>
    </p>
    `;
  };
  var saveSettings = () => {
    const whitelistTime = getElementFromForm("whitelistTime").value;
    const enableBlobs = getElementFromForm("enableBlobs").checked;
    const enable3D = getElementFromForm("enable3D").checked;
    setStorage({
      whitelistTime,
      enableBlobs,
      enable3D
    }).then(() => {
      const status = document.getElementById("statusContent");
      status.textContent = "options saved.";
      setTimeout(() => {
        status.textContent = "";
      }, 1500);
    });
  };
  var onboarding_options_default = () => {
    document.addEventListener("DOMContentLoaded", () => {
      getStorage().then((storage3) => {
        var _a, _b;
        getElementFromForm("whitelistTime").value = storage3.whitelistTime;
        getElementFromForm("enableBlobs").checked = (_a = storage3.enableBlobs, _a !== null && _a !== void 0 ? _a : true);
        getElementFromForm("enable3D").checked = (_b = storage3.enable3D, _b !== null && _b !== void 0 ? _b : true);
      });
      const optionsDiv = document.getElementById("options");
      const goToEndButton = document.getElementById("page3button");
      goToEndButton.innerText = "skip.";
      const newOptionsSection = createDivFromHTML(`
            <div class="text-section">
                <h2>configure.</h2>
                <p>buttons and knobs to customize your reflect experience.</p>
                ${getSettingsHTMLString()}
                <a id="saveButton" class="lt-hover white_button shadow nextPage">save!</a>
            </div>
            `);
      insertAfter(newOptionsSection, optionsDiv);
      document.getElementById("saveButton").addEventListener("click", saveSettings);
    });
  };

  // build/content.js
  var REFLECT_INFO = "#576ca8";
  var REFLECT_ERR = "#ff4a47";
  var REFLECT_ONBOARDING_URL = "https://getreflect.app/onboarding/";
  var DEV_REFLECT_ONBOARDING_URL = "http://localhost:1313/onboarding/";
  checkIfBlocked();
  window.addEventListener("focus", checkIfBlocked);
  function checkIfBlocked() {
    if (window.location.href === REFLECT_ONBOARDING_URL || window.location.href === DEV_REFLECT_ONBOARDING_URL) {
      onboarding_options_default();
      return;
    }
    if (!!document.getElementById("reflect-main")) {
      return;
    }
    getStorage().then((storage3) => {
      if (!storage3.isEnabled) {
        return;
      }
      const strippedURL = getStrippedUrl();
      storage3.blockedSites.forEach((site) => {
        if (strippedURL.includes(site) && !isWhitelistedWrapper()) {
          iterWhitelist();
        }
      });
    });
  }
  function displayStatus(message, duration = 3e3, colour = REFLECT_INFO) {
    $("#statusContent").css("color", colour);
    $("#statusContent").text(message);
    $("#statusContent").show().delay(duration).fadeOut();
  }
  function isWhitelistedWrapper() {
    const WHITELISTED_WRAPPERS = ["facebook.com/flx", "l.facebook.com"];
    return WHITELISTED_WRAPPERS.some((wrapper) => window.location.href.includes(wrapper));
  }
  function getStrippedUrl() {
    return cleanDomain([window.location.href]);
  }
  function iterWhitelist() {
    getStorage().then((storage3) => {
      const strippedURL = getStrippedUrl();
      if (strippedURL === "") {
        return;
      }
      const whitelist = storage3.whitelistedSites;
      if (!whitelist.hasOwnProperty(strippedURL)) {
        loadBlockPage(strippedURL);
        return;
      }
      const parsedDate = new Date(whitelist[strippedURL]);
      const currentDate = new Date();
      const expired = currentDate >= parsedDate;
      if (expired) {
        loadBlockPage(strippedURL);
        return;
      }
      const timeDifference = parsedDate.getTime() - currentDate.getTime();
      setTimeout(() => {
        loadBlockPage(strippedURL);
      }, timeDifference);
    });
  }
  function loadBlockPage(strippedURL) {
    const prompt_page_url = chrome.runtime.getURL("res/pages/prompt.html");
    const options_page_url = chrome.runtime.getURL("res/pages/options.html");
    getStorage().then((storage3) => {
      $.get(prompt_page_url, (page) => {
        var _a, _b;
        window.stop();
        $("html").html(page);
        addFormListener(strippedURL);
        $("#linkToOptions").attr("href", options_page_url);
        if (_a = storage3.enableBlobs, _a !== null && _a !== void 0 ? _a : true) {
          const anim = new blob_animation_default((_b = storage3.enable3D, _b !== null && _b !== void 0 ? _b : true));
          anim.animate();
        }
        console.log($("html"));
        const welcome = document.getElementById("customMessageContent");
        welcome.textContent = storage3.customMessage || "hey! what are you here for?";
      });
    });
  }
  function addFormListener(strippedURL) {
    var _a;
    const form = document.forms.namedItem("inputForm");
    (_a = form) === null || _a === void 0 ? void 0 : _a.addEventListener("submit", (event) => {
      event.preventDefault();
      const intentForm = event.target;
      const intent = new FormData(intentForm).get("intent");
      const intentString = intent.toString();
      const intentDate = new Date();
      callBackgroundWithIntent(intentString);
      logIntentToStorage(intentString, intentDate, strippedURL);
    });
  }
  function callBackgroundWithIntent(intent) {
    const port = chrome.runtime.connect({
      name: "intentStatus"
    });
    port.postMessage({intent, url: window.location.href});
    port.onMessage.addListener((msg) => {
      switch (msg.status) {
        case "ok":
          getStorage().then((storage3) => {
            const WHITELIST_PERIOD = storage3.whitelistTime;
            displayStatus(`got it! ${WHITELIST_PERIOD} minutes starting now.`, 3e3, REFLECT_INFO);
            location.reload();
          });
          break;
        case "too_short":
          invalidIntent("your response is a little short. be more specific!");
          break;
        case "invalid":
          invalidIntent("that doesn't seem to be productive. try being more specific.");
          break;
      }
      port.disconnect();
    });
  }
  function invalidIntent(msg) {
    $("#inputFields").effect("shake", {times: 3, distance: 5});
    displayStatus(msg, 3e3, REFLECT_ERR);
    $("#textbox").val("");
  }
})();
//# sourceMappingURL=content.js.map
