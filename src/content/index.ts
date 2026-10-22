import { sendCommand, toggleFrame, updateCheckedAlerts } from "src/content/frame-host";
import { addLauncher } from "src/content/launcher";
import { startRowSelection } from "src/content/row-selection";
import { parseToggleMessage } from "src/shared/messages";

addLauncher({ onClick: toggleFrame });
startRowSelection({
  onChange: (alerts) => { updateCheckedAlerts({ alerts }); },
  onCommand: (command) => { sendCommand({ command }); },
});

chrome.runtime.onMessage.addListener((message: unknown): boolean => {
  if (parseToggleMessage({ value: message })) {
    toggleFrame();
  }
  return false;
});
