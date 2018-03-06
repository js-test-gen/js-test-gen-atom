"use babel";
import { generateTestFile, generateTestSelection } from "../index";
import {
  noSelectionWarning,
  selectionSuccess,
  noTestFromSelectionWarning,
  pathExistsWarning,
  templateGenFailed
} from "../../notifications";

const mockFs = require("mock-fs");

global.atom = {
  notifications: {
    addWarning: () => {},
    addError: () => {},
    addSuccess: () => {}
  },
  clipboard: {
    write: () => {}
  },
  config: {
    get: param => {
      if (param === "js-test-gen-atom.testDirName") {
        return "";
      }
      if (param === "js-test-gen-atom.testSufix") {
        return ".test";
      }
      if (param === "js-test-gen-atom.typeSystem") {
        return "";
      }
    }
  }
};

const editorObj = {
  getPath: () => {},
  getTitle: () => {},
  getFilePath: () => {},
  getText: () => {},
  getSelectedText: () => {}
};

const createMock = (mockObj = {}, overrides = {}) => {
  return { ...mockObj, ...overrides };
};

xdescribe("generateTestFile", () => {
  let editor;
  beforeEach(() => {
    const atomMock = {
      notifications: {
        addWarning: jest.fn(),
        addError: jest.fn(),
        addSuccess: jest.fn()
      },
      clipboard: {
        write: jest.fn()
      }
    };
    global.atom = createMock(global.atom, atomMock);
  });
  afterEach(() => {
    mockFs.restore();
  });
  it("should not generate test if an existing test file", () => {
    mockFs({
      "mock/module/": {
        "index.test.js": ""
      }
    });
    editor = createMock(editorObj, {
      getTitle: () => "index.js",
      getText: () => "non parsable contents",
      getPath: () => "mock/module/index.js"
    });
    const { addWarning } = global.atom.notifications;
    generateTestFile(editor);
    expect(addWarning.mock.calls[0][0]).toBe(pathExistsWarning);
  });
  it("should show 'templateGenFailed' error if cannot create template", () => {
    mockFs({
      "mock/module/": {}
    });
    editor = createMock(editorObj, {
      getTitle: () => "index.js",
      getText: () => "export const heyya = () => '';",
      getPath: () => "mock/module/index.js"
    });
    generateTestFile(editor);
    const { addError } = global.atom.notifications;
    expect(addError.mock.calls[0][0]).toBe(templateGenFailed);
  });
  xit("should show success message if template created", () => {
    mockFs({
      "mock/module/": {}
    });
    editor = createMock(editorObj, {
      getTitle: () => "index.js",
      getText: () => "export const addOne = (x) => x+1;",
      getPath: () => "mock/module/index.js"
    });
    generateTestFile(editor);
    const { addSuccess } = global.atom.notifications;
    expect(addSuccess.mock.calls[0][0]).toBe(templateGenFailed);
  });
});
describe("generateTestSelection", () => {
  beforeEach(() => {
    const atomMock = {
      notifications: {
        addWarning: jest.fn(),
        addError: jest.fn(),
        addSuccess: jest.fn()
      },
      clipboard: {
        write: jest.fn()
      }
    };
    global.atom = createMock(global.atom, atomMock);
  });
  let editor;
  it("should show 'noSelectionWarning' if no selection found", () => {
    editor = createMock(editorObj, { getSelectedText: () => undefined });
    generateTestSelection(editor);
    const { addWarning } = global.atom.notifications;
    expect(addWarning.mock.calls[0][0]).toBe(noSelectionWarning);
  });
  it("should show 'noTestFromSelectionWarning' if no test generated from selection", () => {
    editor = createMock(editorObj, {
      getSelectedText: () => "inValid content"
    });
    generateTestSelection(editor);
    const { addWarning } = global.atom.notifications;
    expect(addWarning.mock.calls[0][0]).toBe(noTestFromSelectionWarning);
  });
  it("should show 'selectionSuccess' if test generated from selection", () => {
    editor = createMock(editorObj, {
      getSelectedText: () => "export const addone = () => 1+1"
    });
    generateTestSelection(editor);
    const { addSuccess } = global.atom.notifications;
    const { write } = global.atom.clipboard;
    expect(addSuccess.mock.calls[0][0]).toBe(selectionSuccess);
    expect(write.mock.calls.length).toBe(1);
  });
});
