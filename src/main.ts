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
  console.log(1)
  const token = core.getInput('github-token')
  const octokit = github.getOctokit(token)

  const baseRef = 'main'

  const mgr = new LabelManager(github.context, octokit)

  try {
    console.log(2)
    await mgr.create()

    console.log(3)
    const excludes = await git.excludes(baseRef)
    core.setOutput('excludes', excludes.join(' '))

    console.log(4)
    const { size, includes } = await git.size(baseRef, excludes)
    core.setOutput('size', size)
    core.setOutput('includes', includes.join(' '))

    console.log(5)
    const label = mgr.select(size)
    console.log('5.1', label)
    core.setOutput('label', label)

    console.log(6)
    await mgr.assign(label)
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}
