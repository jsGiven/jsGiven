// @flow
import {Stage} from './Stage';
import {
    getStageMetadataStoreProvider,
    type StageMetadataStoreProvider,
} from './stage-metadata-store';

type ParameterFormatterDecorator = {
    (target: any, key: string, descriptor: any): any,
};

type ParameterFormatter = {
    (...parameterNames: string[]): ParameterFormatterDecorator,
    formatParameter: (
        stageClass: Class<Stage>,
        property: string,
        ...parameterName: string[]
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
            ({stepMethodName, parameterName}) =>
                requestedStepMethodName === stepMethodName &&
                requestedParameterName === parameterName
        )
        .map(({formatter}) => formatter);
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
            parameterNames.forEach(parameterName =>
                storeProvider.getStoreFromTarget(target).addProperty({
                    formatter,
                    parameterName,
                    stepMethodName,
                })
            );
            return {...descriptor, writable: true};
        };
        return decorator;
    };
    parameterFormatter.formatParameter = function(
        stageClass: Class<Stage>,
        stepMethodName: string,
        ...parameterNames: string[]
    ) {
        parameterNames.forEach(parameterName =>
            storeProvider.getStoreFromStageClass(stageClass).addProperty({
                formatter,
                parameterName,
                stepMethodName,
            })
        );
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
