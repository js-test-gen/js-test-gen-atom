"use babel";

import { CompositeDisposable } from "atom";
import fs from "fs";
import { generateTestTemplate, generateTest } from "js-test-gen";
import packageConfig from "./config-schema.json";
import TestGenView from "./js-test-gen-view";

/**
 * User messages
 */

// fs related messages
const pathExistsWarning = "Test already exists, cannot overwrite existing test";
const failedToCreateFileWarning = "Failed to write test template to disk";
const failedToCreateFolderWarning = "Failed to write folder to disk";

// common warnings
const noActiveFileWarning = "No active file open to generate test";

// selection related messages
const noSelectionWarning = "No text selected ";
const selectionSuccess = "Test copied to clipboard";
const noTestFromSelectionWarning = "Could not create test from selection";

// Template generation related messages
const templateGenSuccess = "Test Template Generated";
const templateGenFailed = "Could not create test template from this file";

/**
 * File related utils
 */

const ensureDirectoryExistence = filePath => {
  if (fs.existsSync(filePath)) {
    return true;
  }
  try {
    fs.mkdirSync(filePath);
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
};

// path up to just before fileName
const getFilePath = (path = "") => path.slice(0, path.lastIndexOf("/"));
//fileName without extension
const getFileName = (path = "") => {
  return path
    .slice(path.lastIndexOf("/"), path.length)
    .replace(/\.(js|ts|jsx|tsx)$/, "");
};
// no dirName specified ? import code from "./" : else "../"
const determinePath = (dirName = "", fileName = "") =>
  dirName ? `../${fileName}` : `./${fileName}`;
// No dirName specified ? write to current dir : write to specified dir
const determineSaveLoc = (dirName = "", filePath = "", fileName = "") =>
  dirName
    ? `${filePath}/${dirName}/${fileName}` // save to user specified loc
    : `${filePath}/${fileName}`; // save to current dir

// We dont want to overwrite an existing test file.
// So lets check if one exists and tell our user that
// we will not overwrite it.
const areExistingTestFile = path => (fs.existsSync(path) ? true : false);

/**
 * Plugin Class
 **/
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

  /**
   * All user defined settings set via atom
   **/
  getUserSettings() {
    return {
      testDirName: atom.config.get("js-test-gen-atom.testDirName"),
      testSufix: atom.config.get("js-test-gen-atom.testSufix"),
      typeSystem: atom.config.get("js-test-gen-atom.typeSystem")
    };
  },

  writeTemplate(saveLocation, template) {
    return fs.writeFile(saveLocation, template, err => {
      if (err) {
        console.error(err);
        return atom.notifications.addWarning(failedToCreateFileWarning);
      }
      return atom.notifications.addSuccess(templateGenSuccess);
    });
  },

  /**
   * Generates a test based on selection
   */
  generateTest() {
    let editor;
    if ((editor = atom.workspace.getActiveTextEditor())) {
      let selection = editor.getSelectedText(); // Get Selection
      if (selection) {
        const { typeSystem } = this.getUserSettings();
        const template = generateTest(selection, typeSystem);
        if (template) {
          // Check if their is actually a template, it could be an empty string
          atom.clipboard.write(template);
          return atom.notifications.addSuccess(selectionSuccess);
        }
        return atom.notifications.addWarning(noTestFromSelectionWarning);
      } else {
        return atom.notifications.addWarning(noSelectionWarning);
      }
    }
    return atom.notifications.addWarning(noActiveFileWarning);
  },
  /**
   * Generates a test and writes to disk for active file
   */
  generateTestTemplate() {
    let editor;
    if ((editor = atom.workspace.getActiveTextEditor())) {
      // user settings
      const { testDirName, testSufix, typeSystem } = this.getUserSettings();
      // file info: Name, path
      const srcFileName = getFileName(editor.getTitle()); // fileName without extension
      const filePath = getFilePath(editor.getPath(), "/"); // The dir the file is located
      // generated test info: testFileName, saveLocation for test
      const testFileName = `${srcFileName}${testSufix}.js`; // Add the suffix
      const saveLocation = determineSaveLoc(
        testDirName,
        filePath,
        testFileName
      );
      // Do not overwrite users current test files !!!!
      if (areExistingTestFile(saveLocation)) {
        return atom.notifications.addWarning(pathExistsWarning);
      } else {
        // This is the test template
        const template = generateTestTemplate({
          contents: editor.getText(),
          srcFileName,
          importFromPath: determinePath(testDirName, srcFileName),
          typeSystem
        });
        // possability template could be an empty string
        if (!template) {
          return atom.notifications.addError(templateGenFailed);
        }
        // check and write to user defined folder if it exists
        if (testDirName) {
          // check if able to write to disk
          if (!ensureDirectoryExistence(`${filePath}/${testDirName}`)) {
            return atom.notifications.addWarning(failedToCreateFolderWarning);
          }
        }
        // Write the contents to the new test file.
        return this.writeTemplate(saveLocation, template);
      }
    }
    return atom.notifications.addWarning(noActiveFileWarning);
  }
};
