declare module 'js-given' {
    class Stage {
        constructor();

        and(): this;
        but(): this;
        with(): this;
        given(): this;
        when(): this;
        then(): this;
    }

    type ScenariosParam<G, W, T> = {
        given: () => G;
        when: () => W;
        then: () => T;
    };

    type ScenarioFunc =
        | SimpleScenarioFunc
        | ParametrizedScenarioFuncWithParameters;

    type SimpleScenarioFunc = {
        (): void;
    };

    type ParametrizedScenarioFuncWithParameters = {
        func: (...args: any[]) => void;
        parameters: Array<Array<any>>;
    };

    type Class<T> = {
        new (): T;
    };

    type ScenariosDescriptions<G, W, T> = {
        (scenariosParam: ScenariosParam<G, W, T>): {
            [key: string]: ScenarioDescription;
        };
    };

    type ScenarioDescription = {
        scenarioFunction: ScenarioFunc;
    };

    type ScenarioOptions = {};
    function scenario(
        options: ScenarioOptions,
        scenarioFunction: ScenarioFunc
    ): ScenarioDescription;

    function scenarios<S>(
        groupName: string,
        stagesParam: Class<S>,
        scenarioFunc: ScenariosDescriptions<S, S, S>
    ): void;
    function scenarios<G, W, T>(
        groupName: string,
        stagesParam: [Class<G>, Class<W>, Class<T>],
        scenarioFunc: ScenariosDescriptions<G, W, T>
    ): void;

    function setupForRspec(describe: any, it: any): void;
    function setupForAva(test: any): void;

    type StateType = {
        (target: object, decoratedPropertyKey: string, descriptor?: TypedPropertyDescriptor<
            () => any
        >): any;
        addProperty: (target: Class<Stage>, propertyName: string) => void;
    };
    var State: StateType;

    type HiddenType = {
        (target: object, decoratedPropertyKey: string, descriptor?: TypedPropertyDescriptor<
            () => any
        >): any;
        addHiddenStep: (target: Class<Stage>, methodName: string) => void;
    };
    var Hidden: HiddenType;

    function doAsync(action: () => Promise<any>): void;

    function setupForAva(test: any): void;

    function parametrized(
        parameters: Array<Array<any>>,
        func: () => void
    ): ParametrizedScenarioFuncWithParameters;
    function parametrized1<T>(
        parameters: T[],
        func: (a: T) => void
    ): ParametrizedScenarioFuncWithParameters;
    function parametrized2<A, B>(
        parameters: Array<[A, B]>,
        func: (a: A, b: B) => void
    ): ParametrizedScenarioFuncWithParameters;
    function parametrized3<A, B, C>(
        parameters: Array<[A, B, C]>,
        func: (a: A, b: B, c: C) => void
    ): ParametrizedScenarioFuncWithParameters;
    function parametrized4<A, B, C, D>(
        parameters: Array<[A, B, C, D]>,
        func: (a: A, b: B, c: C, d: D) => void
    ): ParametrizedScenarioFuncWithParameters;
    function parametrized5<A, B, C, D, E>(
        parameters: Array<[A, B, C, D, E]>,
        func: (a: A, b: B, c: C, d: D, e: E) => void
    ): ParametrizedScenarioFuncWithParameters;
    function parametrized6<A, B, C, D, E, F>(
        parameters: Array<[A, B, C, D, E, F]>,
        func: (a: A, b: B, c: C, d: D, e: E, f: F) => void
    ): ParametrizedScenarioFuncWithParameters;
    function parametrized7<A, B, C, D, E, F, G>(
        parameters: Array<[A, B, C, D, E, F, G]>,
        func: (a: A, b: B, c: C, d: D, e: E, f: F, g: G) => void
    ): ParametrizedScenarioFuncWithParameters;

    type ParameterFormatterDecorator = {
        (target: object, decoratedPropertyKey: string, descriptor?: TypedPropertyDescriptor<
            () => any
        >): any;
    };

    type ParameterFormatter = {
        (...parameterNames: string[]): ParameterFormatterDecorator;
        formatParameter: (
            stageClass: Class<Stage>,
            stepMethodName: string,
            ...parameterNames: string[]
        ) => void;
    };

    var Quoted: ParameterFormatter;
    function QuotedWith(quoteCharacter: string): ParameterFormatter;
    var NotFormatter: ParameterFormatter;

    type Formatter = (parameterValue: any) => string;
    function buildParameterFormatter(formatter: Formatter): ParameterFormatter;

    export {
        Stage,
        State,
        setupForRspec,
        setupForAva,
        scenarios,
        scenario,
        doAsync,
        parametrized,
        parametrized1,
        parametrized2,
        parametrized3,
        parametrized4,
        parametrized5,
        parametrized6,
        parametrized7,
        Hidden,
        Quoted,
        QuotedWith,
        NotFormatter,
        buildParameterFormatter,
    };
}
