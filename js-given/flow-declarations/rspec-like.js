// @flow
declare function describe(suiteMessage: string, suite: () => void): void;
declare function it(testMessage: string, test: () => void | Promise<void>): void;
