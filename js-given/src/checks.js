// @flow
import _ from 'lodash';

export function checkIsFunction(target: any, errorMessage: string) {
    if (!target || ! _.isFunction(target)) {
        throw new Error(errorMessage);
    }
}
