import * as core from '@actions/core'
import * as github from '@actions/github'

import { InputUtil } from './inputs'
import { LabelManager } from './labels'
import { GitExec, GitUtil } from './git'

/**
 * The main function for the action.
 *
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  if (github.context.payload.pull_request == null) {
    console.debug('skipping for non-pull request')
    return
  }

  const token = core.getInput('github-token')
  const octokit = github.getOctokit(token)

  const gitExec = new GitExec()
  const gitUtil = new GitUtil(gitExec)

  const inputUtil = new InputUtil()
  const mgr = new LabelManager(github.context, octokit, inputUtil)

  const baseRef = github.context.payload.pull_request.base.ref as string

  try {
    await mgr.create()

    const excludes = await gitUtil.getExcludes(baseRef)
    core.setOutput('excludes', excludes.join(' '))

    const { size, includes } = await gitUtil.getSize(baseRef, excludes)
    core.setOutput('size', size)
    core.setOutput('includes', includes.join(' '))

    const label = mgr.select(size)
    core.setOutput('label', label.name)

    await mgr.assign(label)
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}
