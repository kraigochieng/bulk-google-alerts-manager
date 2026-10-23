import { startHeadingCount } from "src/content/alerts-heading";
import { addFrame, sendCommand, updateCheckedAlerts } from "src/content/frame-host";
import { startRowSelection } from "src/content/row-selection";
import { parseToggleMessage } from "src/shared/messages";

addFrame();
startHeadingCount();
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
