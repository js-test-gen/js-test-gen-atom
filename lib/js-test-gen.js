"use babel";

import { CompositeDisposable } from "atom";
import fs from "fs";
import { generateTestTemplate, generateTest } from "js-test-gen";
import packageConfig from "./config-schema.json";
import TestGenView from "./js-test-gen-view";

const removeRest = (str = "") => str.slice(0, str.lastIndexOf("/"));

// TODO ERROR HANDLING
const ensureDirectoryExistence = filePath => {
  if (fs.existsSync(filePath)) {
    return true;
  }
  fs.mkdirSync(filePath);
  return true;
};

export default {
  config: packageConfig,
  testGenView: null,
  modalPanel: null,
  subscriptions: null,

  activate(state) {
    this.testGenView = new TestGenView(state.testGenViewState);
    this.modalPanel = atom.workspace.addModalPanel({
      item: this.testGenView.getElement(),
      visible: false
    });

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    this.subscriptions.add(
      atom.commands.add("atom-workspace", {
        "js-test-gen:generateTestTemplate": () => this.generateTestTemplate(),
        "js-test-gen:generateTest": () => this.generateTest()
      })
    );
  },

  deactivate() {
    this.modalPanel.destroy();
    this.subscriptions.dispose();
    this.testGenView.destroy();
  },

  serialize() {
    return {
      testGenViewState: this.testGenView.serialize()
    };
  },

  generateTest() {
    let editor;
    if ((editor = atom.workspace.getActiveTextEditor())) {
      let selection = editor.getSelectedText();
      if (selection) {
        const template = generateTest(selection);
        atom.clipboard.write(template);
        atom.notifications.addSuccess("Test copied to clipboard");
      } else {
        atom.notifications.addWarning("No text selected ");
      }
    } else {
      atom.notifications.addWarning("No active editor open ");
    }
  },

  generateTestTemplate() {
    let editor;
    if ((editor = atom.workspace.getActiveTextEditor())) {
      // get file name without file extension
      // TODO: Update to support different extensions
      const srcFileName = editor.getTitle().replace(/\.(js)$/, "");

      // Get user define config settings
      const saveToDir = atom.config.get("js-test-gen.testDirName");
      const saveNameSufix = atom.config.get("js-test-gen.testSufix");
      // create the test template file.
      const template = generateTestTemplate({
        contents: editor.getText(),
        srcFileName,
        importFromPath: saveToDir ? `../${srcFileName}` : `./${srcFileName}` // important for import
      });

      // create a string of current directory
      const testFilePath = removeRest(editor.getPath(), "/");

      if (saveToDir) {
        // creare saveToDir if it does not exist
        ensureDirectoryExistence(`${testFilePath}/${saveToDir}`);
      }
      // create fileName
      const testFileName = `${srcFileName}${saveNameSufix}.js`;
      // Save to specified location or current dir
      const saveLocation = saveToDir
        ? `${testFilePath}/${saveToDir}/${testFileName}`
        : `${testFilePath}/${testFileName}`;
      // Write the contents to the new test file.
      fs.writeFile(saveLocation, template, function(err) {
        if (err) {
          atom.notifications.addWarning(
            "Failed to write test template to disk"
          );
          return console.error(err);
        }
        atom.notifications.addSuccess("Test Template Generated");
      });
    }
  }
};
