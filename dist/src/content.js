(() => {
  // build/blob_animation.js
  var BlobElement = class {
    constructor(x, y, r) {
      this.fill = "#A6B1CE";
      this.x = this.originalX = x;
      this.y = this.originalY = y;
      this.r = r || 10;
      this.element = document.createElementNS("http://www.w3.org/2000/svg", "circle");
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
    constructor() {
      this.config = {
        blur: 8,
        alphaMult: 30,
        alphaAdd: -10,
        numSeeds: 8,
        childrenPerSeed: 3,
        childrenDistanceRange: 100,
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
        const e = new BlobElement(this.randomRange(this.centerX, this.width * 0.4), this.randomRange(this.centerY, this.height * 0.4), this.random(this.config.circleMinRadius, this.config.circleMaxRadius));
        e.update(this.mouseX, this.mouseY, this.config.repulsion, this.config.attraction);
        group.appendChild(e.element);
        this.elements.push(e);
      }
      this.elements.forEach((e) => {
        for (let j = 0; j < this.config.childrenPerSeed; j++) {
          const child = new BlobElement(this.randomRange(e.x, this.config.childrenDistanceRange), this.randomRange(e.y, this.config.childrenDistanceRange), this.random(this.config.circleMinRadius, this.config.circleMaxRadius));
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
    getStorage().then((storage2) => {
      let intentList = storage2.intentList;
      let oldest_date = new Date();
      for (const rawDate in intentList) {
        const date = new Date(rawDate);
        if (date < oldest_date) {
          oldest_date = date;
        }
      }
      if (Object.keys(intentList).length > storage2.numIntentEntries) {
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

  // build/content.js
  var REFLECT_INFO = "#576ca8";
  var REFLECT_ERR = "#ff4a47";
  checkIfBlocked();
  window.addEventListener("focus", checkIfBlocked);
  function checkIfBlocked() {
    if (!!document.getElementById("reflect-main")) {
      return;
    }
    getStorage().then((storage2) => {
      console.log(storage2);
      if (!storage2.isEnabled) {
        return;
      }
      const strippedURL = getStrippedUrl();
      storage2.blockedSites.forEach((site) => {
        if (strippedURL.includes(site) && !isWhitelistedWrapper()) {
          console.log("bro wtf just block this shit already");
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
    getStorage().then((storage2) => {
      const strippedURL = getStrippedUrl();
      if (strippedURL === "") {
        return;
      }
      const whitelist = storage2.whitelistedSites;
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
    getStorage().then((enableBlobs) => {
      $.get(prompt_page_url, (page) => {
        window.stop();
        $("html").html(page);
        addFormListener(strippedURL);
        $("#linkToOptions").attr("href", options_page_url);
        if (enableBlobs !== null && enableBlobs !== void 0 ? enableBlobs : true) {
          const anim = new blob_animation_default();
          anim.animate();
        }
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
          chrome.storage.sync.get(null, (storage2) => {
            const WHITELIST_PERIOD = storage2.whitelistTime;
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
