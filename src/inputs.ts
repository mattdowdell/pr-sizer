import { getInput } from '@actions/core'

/**
 *
 */
export enum Threshold {
  ExtraSmall = 'xs-threshold',
  Small = 's-threshold',
  Medium = 'm-threshold',
  Large = 'l-threshold',
  ExtraLarge = 'xl-threshold'
}

/**
 *
 */
export enum Label {
  ExtraSmall = 'xs-label',
  Small = 's-label',
  Medium = 'm-label',
  Large = 'l-label',
  ExtraLarge = 'xl-label',
  ExtraExtraLarge = 'xxl-label'
}

/**
 *
 */
export class InputUtil {
  /**
   *
   */
  getThreshold(t: Threshold): number {
    return parseInt(getInput(t))
  }

  /**
   *
   */
  getLabel(l: Label): string {
    return getInput(l)
  }
}
