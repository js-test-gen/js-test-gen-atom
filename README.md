# test-gen

### Current WIP

Generate js test templates for your code!

![](https://s3-us-west-2.amazonaws.com/js-test-gen/atom-gen-tests.gif)

## TODO

* [x] create basic atom package.
* [x] read active file in atom.
* [x] ability to write file.
* [x] read babel handbook.
* [x] use babel get exported funcs etc.
* [x] create test template.
* [x] use prettier to format the file.
* [x] ability to specify a path of where to save the file
* [x] Revise current template strcture (currently too many 'describes')
* [x] ability to create a test template based on a selection.
* [ ] vscode package support
* [ ] extract parser to its own package
* [ ] create organisation github
* [ ] add tests for code
* [ ] add packaging ability
* [ ] add linting etc
* [ ] package nicely for end users to use.

## Future TODOS

* [ ] ability to detect type of exports (are they functions)
* [ ] auto generate tests based on the type declarations?

## Objectives

Create an atom plugin that can read js files and create a base test template for that file.

### Example

Given the following file

```javascript
//name of this file is myfuncs.js

export const someModule1 = () => {};
export const someModule2 = () => {};

const someModule = () => {};

export default someModule;
```

Running the plugin on the snippet above, should produce the following

```javascript
import someModule, { someModule1, someModule2 } from "./myfuncs";

describe("someModule", () => {
  it("should fail auto generated test", () => {
    expect(someModule().toBe(false));
  });
});
describe("someModule1", () => {
  it("should fail auto generated test", () => {
    expect(someModule1().toBe(false));
  });
});
describe("someModule2", () => {
  it("should fail auto generated test", () => {
    expect(someModule2().toBe(false));
  });
});
```
