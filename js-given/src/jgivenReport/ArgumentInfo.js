// @flow
export type ArgumentInfo = {
  /**
   * In case this word can be replaced by a parameter name,
   * e.g. for data tables, this value is set, otherwise it is {@code null}.
   * The parameter name is in general taken from scenario parameters.
   * In case of a derived parameter the parameter name is actually equal to the
   * argumentName.
   *
   */
  +parameterName?: ?string,

  /**
   * The name of the argument as declared in the step method.
   */
  +argumentName: string,

  /**
   * The value of the argument after formatting has been applied.
   * Can be {@code null}
   */
  +formattedValue: ?string,

  /**
   * Is set when the value of the argument is a data table value,
   * otherwise is {@code null}
   */
  +dataTable?: ?DataTable,
};

export type DataTable = {
  /*
    * The type of the header
    */
  +headerType: HeaderType,

  /**
   * The data of the table as a list of rows
   */
  +data: Array<Array<String>>,
};

export type HeaderType =
  /**
   * The table has no header
   */
  | 'NONE'
  /**
   * Treat the first row as a header
   */
  | 'HORIZONTAL'
  /**
   * Treat the first column as a header
   */
  | 'VERTICAL'
  /**
   * Treat both, the first row and the first column as headers
   */
  | 'BOTH';
