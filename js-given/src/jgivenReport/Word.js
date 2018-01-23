// @flow
import type { ArgumentInfo } from './ArgumentInfo';

/**
 * Represents a part of a step.
 */
export type Word = {
  /**
   * The string representation of this word formatted with the default string formatter.
   */
  +value: string,

  /**
   * Whether this word is an introduction word.
   * <p>
   * Typical English introduction words are given, when, then, and, but
   * <p>
   * Is {@code null} if false to avoid unneeded entries in the JSON model
   * </p>
   */
  +isIntroWord?: boolean,

  /**
   * Is set when this word is an argument, is <code>null</code> otherwise.
   */
  +argumentInfo?: ?ArgumentInfo,

  /**
   * Whether this word does not appear in all cases of the scenario.
   * This is can be used to highlight this word in the report.
   * <p>
   * Is {@code null} if false to avoid unneeded entries in the JSON model
   * </p>
   */
  +isDifferent?: ?boolean,
};
