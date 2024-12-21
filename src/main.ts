import * as core from '@actions/core'
import { Octokit } from 'octokit'

import { LabelManager } from './labels'
import * as git from './git'

/**
 * The main function for the action.
 *
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  const octokit = new Octokit()
  const baseRef = 'main' // TODO: how to get this programatically?

  const mgr = new LabelManager(octokit) // FIXME: get owner, repo and PR number programatically

  try {
    await mgr.create()

    const excludes = await git.excludes(baseRef)
    core.setOutput('excludes', excludes.join(' '))

    const { size, includes } = await git.size(baseRef, excludes)
    core.setOutput('size', size)
    core.setOutput('includes', includes.join(' '))

    const label = mgr.select(size)
    core.setOutput('label', label)

    await mgr.assign(label)
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}
