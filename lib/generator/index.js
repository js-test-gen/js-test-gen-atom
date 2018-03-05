"use babel";

import fs from "fs";
import { generateTestTemplate, generateTest } from "js-test-gen";
import {
  pathExistsWarning,
  failedToCreateFileWarning,
  failedToCreateFolderWarning,
  noSelectionWarning,
  selectionSuccess,
  noTestFromSelectionWarning,
  templateGenSuccess,
  templateGenFailed
} from "../notifications";

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

const doesDirExists = filePath => fs.existsSync(filePath);

const createDir = filePath => {
  try {
    fs.mkdirSync(filePath);
    return true;
  } catch (err) {
    console.error(err);
    atom.notifications.addWarning("Failed to create directory");
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
const isAnExistingTestFile = path => (fs.existsSync(path) ? true : false);

const writeTemplate = (saveLocation, template, fs) => {
  return fs.writeFile(saveLocation, template, err => {
    if (err) {
      console.error(err);
      return atom.notifications.addWarning(failedToCreateFileWarning);
    }
    return atom.notifications.addSuccess(templateGenSuccess);
  });
};

export const generateTestFile = (editor = {}) => {
  // user settings
  const { testDirName, testSufix, typeSystem } = getUserSettings();
  // file info: Name, path
  const srcFileName = getFileName(editor.getTitle()); // fileName without extension
  const filePath = getFilePath(editor.getPath(), "/"); // The dir the file is located

  // generated test info: testFileName, saveLocation for test
  const testFileName = `${srcFileName}${testSufix}.js`;
  const saveLocation = determineSaveLoc(testDirName, filePath, testFileName);
  if (isAnExistingTestFile(saveLocation)) {
    return atom.notifications.addWarning(pathExistsWarning);
  } else {
    const template = generateTestTemplate({
      contents: editor.getText(),
      srcFileName,
      importFromPath: determinePath(testDirName, srcFileName),
      typeSystem
    });
    // possibility template could be an empty string
    if (!template) {
      return atom.notifications.addError(templateGenFailed);
    }
    // write folder to disk if test folder specified
    if (testDirName) {
      const desiredPath = `${filePath}/${testDirName}`;
      if (doesDirExists(desiredPath)) {
        return atom.notifications.addWarning(failedToCreateFolderWarning);
      }
      createDir(desiredPath);
    }
    // Write the contents to the new test file.
    return writeTemplate(saveLocation, template);
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
