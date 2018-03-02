import { generateTestFile, generateTestSelection } from "../index";
describe("generateTestFile", () => {
  it("should fail auto generated test", () => {
    expect(generateTestFile()).toBe(false);
  });
});
describe("generateTestSelection", () => {
  it("should fail auto generated test", () => {
    expect(generateTestSelection()).toBe(false);
  });
});
