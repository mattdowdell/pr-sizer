import * as core from '@actions/core'
import * as github from '@actions/github'

import { LabelManager } from './labels'
import * as git from './git'

/**
 * The main function for the action.
 *
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  const token = core.getInput('github-token')
  const octokit = github.getOctokit(token)

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const baseRef = github.context.payload.pull_request?.base.ref as string

  const mgr = new LabelManager(github.context, octokit)

  try {
    await mgr.create()

    const excludes = await git.excludes(baseRef)
    core.setOutput('excludes', excludes.join(' '))

    const { size, includes } = await git.size(baseRef, excludes)
    core.setOutput('size', size)
    core.setOutput('includes', includes.join(' '))

    const label = mgr.select(size)
    core.setOutput('label', label.name)

    await mgr.assign(label)
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}
