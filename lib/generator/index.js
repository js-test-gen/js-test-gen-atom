"use babel";

import nativeFs from "fs";
import { generateTestTemplate, generateTest } from "js-test-gen";

/**
 * User messages
 */

// fs related messages
const pathExistsWarning = "Test already exists, cannot overwrite existing test";
const failedToCreateFileWarning = "Failed to write test template to disk";
const failedToCreateFolderWarning = "Failed to write folder to disk";

// selection related messages
const noSelectionWarning = "No text selected ";
const selectionSuccess = "Test copied to clipboard";
const noTestFromSelectionWarning = "Could not create test from selection";

// Template generation related messages
const templateGenSuccess = "Test Template Generated";
const templateGenFailed = "Could not create test template from this file";

const getUserSettings = () => {
  return {
    testDirName: atom.config.get("js-test-gen-atom.testDirName"),
    testSufix: atom.config.get("js-test-gen-atom.testSufix"),
    typeSystem: atom.config.get("js-test-gen-atom.typeSystem")
  };
};
/*
* File related utils
*/

const doesDirExists = (filePath, fs) => fs.existsSync(filePath);

const createDir = (filePath, fs) => {
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
    .slice(path.lastIndexOf("/") + 1, path.length)
    .replace(/\.(js|ts|jsx|tsx)$/, "");
};
// no dirName specified ? import code from current dir : else "../" (assumed test dir created)
const determinePath = (dirName = "", fileName = "") =>
  dirName ? `../${fileName}` : `./${fileName}`;

// No dirName specified ? write to current dir : write to specified dir
const determineSaveLoc = (dirName = "", filePath = "", fileName = "") =>
  dirName ? `${filePath}/${dirName}/${fileName}` : `${filePath}/${fileName}`;

// We dont want to overwrite an existing test file.
const isAnExistingTestFile = (path, fs) => (fs.existsSync(path) ? true : false);

const writeTemplate = (saveLocation, template, fs) => {
  return fs.writeFile(saveLocation, template, err => {
    if (err) {
      console.error(err);
      return atom.notifications.addWarning(failedToCreateFileWarning);
    }
    return atom.notifications.addSuccess(templateGenSuccess);
  });
};

export const generateTestFile = (editor = {}, fs = nativeFs) => {
  // user settings
  const { testDirName, testSufix, typeSystem } = getUserSettings();

  // file info: Name, path
  const srcFileName = getFileName(editor.getTitle()); // fileName without extension
  const filePath = getFilePath(editor.getPath(), "/"); // The dir the file is located

  // generated test info: testFileName, saveLocation for test
  const testFileName = `${srcFileName}${testSufix}.js`;
  const saveLocation = determineSaveLoc(testDirName, filePath, testFileName);

  if (isAnExistingTestFile(saveLocation, fs)) {
    return atom.notifications.addWarning(pathExistsWarning);
  } else {
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
    // write folder to disk if test folder specified
    if (testDirName) {
      const desiredPath = `${filePath}/${testDirName}`;
      if (doesDirExists(desiredPath, fs)) {
        return atom.notifications.addWarning(failedToCreateFolderWarning);
      }
      createDir(desiredPath, fs);
    }
    // Write the contents to the new test file.
    return writeTemplate(saveLocation, template, fs);
  }
};

export const generateTestSelection = (editor = {}) => {
  let selection = editor.getSelectedText(); // Get Selection
  if (selection) {
    const { typeSystem } = getUserSettings();
    const template = generateTest(selection, typeSystem);
    // Check if their is actually a template, it could be an empty string
    if (template) {
      atom.clipboard.write(template);
      return atom.notifications.addSuccess(selectionSuccess);
    }
    return atom.notifications.addWarning(noTestFromSelectionWarning);
  }
  return atom.notifications.addWarning(noSelectionWarning);
};
