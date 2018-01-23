// @flow
import _ from 'lodash';

import { Stage } from './Stage';
import {
  getStageMetadataStoreProvider,
  type StageMetadataStoreProvider,
} from './stage-metadata-store';
import { checkIsFunction, checkIsParameter } from './checks';

type ParameterFormatterDecorator = {
  (target: any, key: string, descriptor: any): any,
};

type ParameterFormatter = {
  (...parameterNames: string[]): ParameterFormatterDecorator,
  +formatParameter: (
    stageClass: Class<Stage>,
    stepMethodName: string,
    ...parameterNames: string[]
  ) => void,
};

export type Formatter = (parameterValue: any) => string;

type ParameterFormatting = {
  +stepMethodName: string,
  +parameterName: string,
  +formatter: Formatter,
};

const storeProvider: StageMetadataStoreProvider<
  ParameterFormatting
> = getStageMetadataStoreProvider('@ParameterFormatters');

export function getFormatters(
  stage: Stage,
  requestedStepMethodName: string,
  requestedParameterName: string
): Formatter[] {
  const formattings = storeProvider.getStoreFromTarget(stage).getProperties();
  return formattings
    .filter(
      ({ stepMethodName, parameterName }) =>
        requestedStepMethodName === stepMethodName &&
        requestedParameterName === parameterName
    )
    .map(({ formatter }) => formatter);
}

export function restParameterName(): 'JSGIVEN_REST_PARAMETER_NAME' {
  return 'JSGIVEN_REST_PARAMETER_NAME';
}

export function buildParameterFormatter(
  formatter: Formatter
): ParameterFormatter {
  const parameterFormatter = function(
    ...parameterNames: string[]
  ): ParameterFormatterDecorator {
    const decorator = function(
      target: any,
      stepMethodName: string,
      descriptor: any
    ): any {
      parameterNames.forEach(parameterName => {
        checkIsFunction(
          target[stepMethodName],
          `Formatter decorators can only be applied to methods: '${stepMethodName}' is not a method.`
        );
        checkIsParameter(
          target[stepMethodName],
          parameterName,
          `Formatter decorator cannot be applied on method: ${stepMethodName}(): parameter '${parameterName}' was not found.`
        );
        storeProvider.getStoreFromTarget(target).addProperty({
          formatter,
          parameterName,
          stepMethodName,
        });
      });
      return { ...descriptor, writable: true };
    };
    return decorator;
  };
  parameterFormatter.formatParameter = function(
    stageClass: Class<Stage>,
    stepMethodName: string,
    ...parameterNames: string[]
  ) {
    parameterNames.forEach(parameterName => {
      checkIsFunction(
        // $FlowIgnore
        stageClass.prototype[stepMethodName],
        `Formatter.formatParameter() can only be applied to methods: '${stepMethodName}' is not a method.`
      );
      checkIsParameter(
        // $FlowIgnore
        stageClass.prototype[stepMethodName],
        parameterName,
        `Formatter.formatParameter() cannot be applied on method: ${stepMethodName}(): parameter '${parameterName}' was not found.`
      );
      storeProvider.getStoreFromStageClass(stageClass).addProperty({
        formatter,
        parameterName,
        stepMethodName,
      });
    });
  };

  return parameterFormatter;
}

export const Quoted = buildParameterFormatter(
  parameterValue => `"${parameterValue}"`
);

export const QuotedWith = (quoteCharacter: string) =>
  buildParameterFormatter(
    parameterValue => `${quoteCharacter}${parameterValue}${quoteCharacter}`
  );

export const NotFormatter = buildParameterFormatter(
  parameterValue => (parameterValue ? '' : 'not')
);

export function formatParameter(
  parameter: any,
  formatters: Formatter[]
): string {
  if (formatters.length > 0) {
    return applyFormatters(parameter, formatters);
  } else {
    return applyDefaultFormatter(parameter);
  }
}

function applyFormatters(parameter: any, formatters: Formatter[]): string {
  let value = parameter;
  for (const formatter of formatters) {
    value = formatter(value);
  }
  return formatParameter(value, []);
}

function applyDefaultFormatter(parameter: any): string {
  if (_.isString(parameter)) {
    return parameter;
  } else if (isObjectOrArray(parameter)) {
    return formatObjectOrArray(parameter);
  } else {
    return toString(parameter);
  }
}

function isObjectOrArray(parameter: any): boolean {
  return _.isObject(parameter) || Array.isArray(parameter);
}

function formatObjectOrArray(parameter: any): string {
  if (hasOverridenTostring(parameter)) {
    return parameter.toString();
  } else {
    return JSON.stringify(parameter);
  }
}

function hasOverridenTostring(parameter: any): boolean {
  return (
    parameter.toString &&
    parameter.toString !== Object.prototype.toString &&
    parameter.toString !== Array.prototype.toString
  );
}

function toString(parameter: any): string {
  if (hasToString(parameter)) {
    return parameter.toString();
  } else {
    return JSON.stringify(parameter);
  }
}

function hasToString(parameter: any): boolean {
  return parameter && parameter.toString;
}
