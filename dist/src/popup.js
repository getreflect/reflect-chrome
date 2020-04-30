document.addEventListener("DOMContentLoaded", () => {
    const toggleSwitch = document.querySelector('#reflect-toggle');
    toggleSwitch.addEventListener('change', toggleState, false);
    // get current state and set approriately
    chrome.storage.sync.get(null, (storage) => {
        if (storage.isEnabled) {
            toggleSwitch.checked = true;
        }
        else {
            toggleSwitch.checked = false;
        }
    });
    // message background
    function toggleState(e) {
        const port = chrome.runtime.connect({ name: "toggleState" });
        if (e.target.checked) {
            port.postMessage({ state: true });
        }
        else {
            port.postMessage({ state: false });
        }
    }
});
