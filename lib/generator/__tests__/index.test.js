"use babel";

import { generateTestFile, generateTestSelection } from "../index";
import {
  noSelectionWarning,
  selectionSuccess,
  noTestFromSelectionWarning
} from "../../notifications";

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
    get: () => {}
  }
};

const editorObj = {
  getTitle: () => {},
  getFilePath: () => {},
  getText: () => {},
  getSelectedText: () => {}
};

const createMock = (mockObj = {}, overrides = {}) => {
  return { ...mockObj, ...overrides };
};

// describe("generateTestFile", () => {
//   it("should fail auto generated test", () => {
//     expect(generateTestFile(editorMock())).toBe(false);
//   });
// });
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
