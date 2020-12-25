import { getStorage, setStorage } from './storage';
import { createDivFromHTML, insertAfter, getElementFromForm } from './util';
const getSettingsHTMLString = () => {
    return `
    <table class="options_panel">
        <tr>
            <td style="width:50%">
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
        <span>&nbsp;</span>
        <span id="statusContent"></span>
    </p>
    `;
};
const saveSettings = () => {
    const whitelistTime = getElementFromForm('whitelistTime').value;
    const enableBlobs = getElementFromForm('enableBlobs').checked;
    const enable3D = getElementFromForm('enable3D').checked;
    setStorage({
        whitelistTime: whitelistTime,
        enableBlobs: enableBlobs,
        enable3D: enable3D,
    }).then(() => {
        // Update status to let user know options were saved.
        const status = document.getElementById('statusContent');
        status.textContent = 'options saved.';
        setTimeout(() => {
            status.textContent = '';
        }, 1500);
    });
};
export default () => {
    document.addEventListener('DOMContentLoaded', () => {
        getStorage().then((storage) => {
            var _a, _b;
            getElementFromForm('whitelistTime').value = storage.whitelistTime;
            getElementFromForm('enableBlobs').checked = (_a = storage.enableBlobs, (_a !== null && _a !== void 0 ? _a : true));
            getElementFromForm('enable3D').checked = (_b = storage.enable3D, (_b !== null && _b !== void 0 ? _b : true));
        });
        const optionsDiv = document.getElementById("options");
        // change last button to say it will skip rather than setting settings
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
        document.getElementById('saveButton').addEventListener('click', saveSettings);
    });
};
