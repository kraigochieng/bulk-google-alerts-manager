import { addFrame, sendCommand, updateCheckedAlerts } from "src/content/frame-host";
import { startRowSelection } from "src/content/row-selection";
import { parseToggleMessage } from "src/shared/messages";

addFrame();
startRowSelection({
  onChange: (alerts) => { updateCheckedAlerts({ alerts }); },
  onCommand: (command) => { sendCommand({ command }); },
});

chrome.runtime.onMessage.addListener((message: unknown): boolean => {
  if (parseToggleMessage({ value: message })) {
    sendCommand({ command: "add" });
  }
  return false;
});
