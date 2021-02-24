import { expect, jest } from "@jest/globals";
import { MyApp } from "@myapp/MyApp";

describe("MyApp.test", function () {
  it("dummy test", async function () {
    let content = "";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const consoleMock = jest.fn((input: any) => {
      content += input;
    });

    // eslint-disable-next-line no-console
    const tmpLog = console.log;
    // eslint-disable-next-line no-console
    console.log = consoleMock;

    MyApp.doSmth();

    consoleMock.mockRestore();
    // eslint-disable-next-line no-console
    console.log = tmpLog;

    expect(content).toBe(`${MyApp.MY_CONST}`);
  });
});
