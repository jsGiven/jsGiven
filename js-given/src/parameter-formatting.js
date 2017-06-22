// @flow
import {Stage} from './Stage';

type ParameterFormatterDecorator = {
    (target: any, key: string, descriptor: any): any,
};

type ParameterFormatter = {
    (parameterName: string): ParameterFormatterDecorator,
    formatParameter: (
        stageClass: Class<Stage>,
        property: string,
        parameterName: string
    ) => void,
};

export function buildParameterFormatter(
    formatter: (parameterValue: any) => string
): ParameterFormatter {
    const parameterFormatter = function(
        parameterName: string
    ): ParameterFormatterDecorator {
        const decorator = function(
            target: any,
            key: string,
            descriptor: any
        ): any {
            return {...descriptor, writable: true};
        };
        return decorator;
    };
    parameterFormatter.formatParameter = function(
        stageClass: Class<Stage>,
        property: string,
        parameterName: string
    ) {};

    return parameterFormatter;
}

export const Quoted = buildParameterFormatter(
    parameterValue => `"${parameterValue}"`
);

export const QuotedWith = (quoteCharacter: string) =>
    buildParameterFormatter(
        parameterValue => `${quoteCharacter}${parameterValue}${quoteCharacter}`
    );
