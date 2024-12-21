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
export function getThreshold(threshold: Threshold): number {
  return parseInt(getInput(threshold))
}

/**
 *
 */
export function getLabel(label: Label): string {
  return getInput(label)
}
