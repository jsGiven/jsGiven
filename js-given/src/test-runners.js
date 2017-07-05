// @flow
import { INSTANCE } from './scenarios';

export type GroupFunc = {
    (groupName: string, suiteFunc: RunnableFunc): void,
};

export type RunnableFunc = {
    (): void | Promise<void>,
};

export type TestFunc = {
    (testName: string, testFunc: RunnableFunc): void | Promise<void>,
};

export function setupForRspec(describe: any, it: any): void {
    return INSTANCE.setup(
        (groupName, suiteFunc) => {
            describe(groupName, suiteFunc);
        },
        (testName, testFunc) => {
            it(testName, testFunc);
        }
    );
}

export function setupForAva(test: any): void {
    let capturedGroupName = '';
    return INSTANCE.setup(
        (groupName, suiteFunc) => {
            capturedGroupName = groupName;
            suiteFunc();
        },
        (testName, testFunc) => {
            test(`${capturedGroupName} / ${testName}`, testFunc);
        }
    );
}
