// @flow
import _ from 'lodash';
import functionArguments from 'function-arguments';

export function checkIsFunction(target: any, errorMessage: string) {
  if (!target || !_.isFunction(target)) {
    throw new Error(errorMessage);
  }
}

export function checkIsParameter(
  func: () => any,
  parameterName: string,
  errorMessage: string
) {
  if (!functionArguments(func).includes(parameterName)) {
    throw new Error(errorMessage);
  }
}
