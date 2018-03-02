"use babel";

import { CompositeDisposable } from "atom";

import packageConfig from "./config-schema.json";
import { generateTestSelection, generateTestFile } from "./generator";

// common warnings
const noActiveFileWarning = "No active file open to generate test";

const getGenerateTestSelection = () => {
  const editor = atom.workspace.getActiveTextEditor();
  if (editor) {
    return generateTestSelection(editor);
  }
  return atom.notifications.addError(noActiveFileWarning);
};

const getGenerateTestFile = () => {
  const editor = atom.workspace.getActiveTextEditor();
  if (editor) {
    return generateTestFile(editor);
  }
  return atom.notifications.addError(noActiveFileWarning);
};

/**
 * Plugin Class
 **/
export default {
  config: packageConfig,
  modalPanel: null,
  subscriptions: null,

  activate() {
    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    this.subscriptions.add(
      atom.commands.add("atom-workspace", {
        "js-test-gen:generateTestTemplate": () => getGenerateTestFile(),
        "js-test-gen:generateTest": () => getGenerateTestSelection()
      })
    );
  },

  deactivate() {
    this.modalPanel.destroy();
    this.subscriptions.dispose();
  },

  serialize() {
    return {};
  }
};
