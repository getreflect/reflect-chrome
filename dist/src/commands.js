// commands.ts is a module responsible for handling keyboard shortcuts
import { getStorage } from './storage';
export function listenForCommand() {
    chrome.commands.onCommand.addListener((command) => {
        getStorage().then((storage) => {
            if (storage.isEnabled) {
                turnFilteringOff();
            }
            else {
                turnFilteringOn();
            }
        });
    });
}
