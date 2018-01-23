// @flow
import type { Formatter } from './parameter-formatting';

export type ParametrizedScenarioFuncWithParameters = {
  +func: (...args: any[]) => void,
  +parameters: Array<Array<any>>,
};

export function parametrized(
  parameters: Array<Array<any>>,
  func: () => void
): ParametrizedScenarioFuncWithParameters {
  return {
    parameters: (parameters: any),
    func,
  };
}

export function parametrized1<T>(
  parameters: T[],
  func: (a: T) => void
): ParametrizedScenarioFuncWithParameters {
  return {
    parameters: parameters.map(param => [param]),
    func,
  };
}
export function parametrized2<A, B>(
  parameters: Array<[A, B]>,
  func: (a: A, b: B) => void
): ParametrizedScenarioFuncWithParameters {
  return {
    parameters: (parameters: any),
    func,
  };
}
export function parametrized3<A, B, C>(
  parameters: Array<[A, B, C]>,
  func: (a: A, b: B, c: C) => void
): ParametrizedScenarioFuncWithParameters {
  return {
    parameters: (parameters: any),
    func,
  };
}
export function parametrized4<A, B, C, D>(
  parameters: Array<[A, B, C, D]>,
  func: (a: A, b: B, c: C, d: D) => void
): ParametrizedScenarioFuncWithParameters {
  return {
    parameters: (parameters: any),
    func,
  };
}
export function parametrized5<A, B, C, D, E>(
  parameters: Array<[A, B, C, D, E]>,
  func: (a: A, b: B, c: C, d: D, e: E) => void
): ParametrizedScenarioFuncWithParameters {
  return {
    parameters: (parameters: any),
    func,
  };
}
export function parametrized6<A, B, C, D, E, F>(
  parameters: Array<[A, B, C, D, E, F]>,
  func: (a: A, b: B, c: C, d: D, e: E, f: F) => void
): ParametrizedScenarioFuncWithParameters {
  return {
    parameters: (parameters: any),
    func,
  };
}
export function parametrized7<A, B, C, D, E, F, G>(
  parameters: Array<[A, B, C, D, E, F, G]>,
  func: (a: A, b: B, c: C, d: D, e: E, f: F, g: G) => void
): ParametrizedScenarioFuncWithParameters {
  return {
    parameters: (parameters: any),
    func,
  };
}

export type WrappedParameter = {
  +scenarioParameterName: string,
  +value: any,
  +IS_JSGIVEN_WRAPPER_PARAMETER: true,
};
export function wrapParameter(
  value: any,
  scenarioParameterName: string
): WrappedParameter {
  return {
    scenarioParameterName,
    value,
    IS_JSGIVEN_WRAPPER_PARAMETER: true,
  };
}

export type DecodedParameter = {
  +value: any,
  +scenarioParameterName: string | null,
  +stepParameterName: string,
  +formatters: Formatter[],
};
export function decodeParameter(
  parameter: any,
  stepParameterName: string,
  formatters: Formatter[]
): DecodedParameter {
  if (parameter instanceof Object && parameter.IS_JSGIVEN_WRAPPER_PARAMETER) {
    const wrapped: WrappedParameter = (parameter: any);
    return { ...wrapped, stepParameterName, formatters };
  } else {
    if (stepParameterName === undefined) {
      throw new Error('cant be undefined');
    }
    return {
      value: parameter,
      scenarioParameterName: null,
      stepParameterName,
      formatters,
    };
  }
}
