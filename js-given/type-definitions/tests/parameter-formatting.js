// @flow
import {
  Stage,
  Quoted,
  QuotedWith,
  NotFormatter,
  buildParameterFormatter,
} from '../index.js';

class AStage extends Stage {
  @Quoted('value')
  a_value(value: string): this {
    return this;
  }

  @Quoted('value1', 'value2')
  two_values(value1: string, value2: string): this {
    return this;
  }
}

// $ExpectError
Quoted.formatParameter();
// $ExpectError
Quoted.formatParameter(AStage);
// $ExpectError
Quoted.formatParameter(AStage, 1);

Quoted.formatParameter(AStage, 'a_value');
Quoted.formatParameter(AStage, 'a_value', 'value');
Quoted.formatParameter(AStage, 'two_values', 'value1', 'value2');

class BStage extends Stage {
  @QuotedWith("'")('value')
  a_value(value: string): this {
    return this;
  }

  @QuotedWith("'")('value1', 'value2')
  two_values(value1: string, value2: string): this {
    return this;
  }
}

// $ExpectError
QuotedWith();
// $ExpectError
QuotedWith("'").formatParameter();
// $ExpectError
QuotedWith("'").formatParameter(BStage);
// $ExpectError
QuotedWith("'").formatParameter(BStage, 1);

QuotedWith("'").formatParameter(BStage, '_a_value');
QuotedWith("'").formatParameter(BStage, '_a_value', 'value');
QuotedWith("'").formatParameter(BStage, '_two_values', 'value1', 'value2');

class CStage extends Stage {
  @NotFormatter('booleanValue')
  a_value(booleanValue: boolean): this {
    return this;
  }

  @NotFormatter('booleanValue1', 'booleanValue2')
  two_values(booleanValue1: string, booleanValue2: string): this {
    return this;
  }
}

// $ExpectError
NotFormatter.formatParameter();
// $ExpectError
NotFormatter.formatParameter(CStage);
// $ExpectError
NotFormatter.formatParameter(CStage, 1);

NotFormatter.formatParameter(CStage, 'a_value');
NotFormatter.formatParameter(CStage, 'a_value', 'booleanValue');
NotFormatter.formatParameter(
  CStage,
  'two_values',
  'booleanValue1',
  'booleanValue2'
);

// $ExpectError
buildParameterFormatter();
// $ExpectError
buildParameterFormatter('');
// $ExpectError
buildParameterFormatter(() => {});
// $ExpectError
buildParameterFormatter(() => null);
// $ExpectError
buildParameterFormatter(x => 1);

buildParameterFormatter(() => '');
buildParameterFormatter(x => '');
buildParameterFormatter(x => '').formatParameter(CStage, 'a_value');
// $ExpectError
buildParameterFormatter(x => '').formatParameter(CStage);
// $ExpectError
buildParameterFormatter(x => '').formatParameter();
