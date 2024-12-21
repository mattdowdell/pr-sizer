import { exec } from 'child_process'
import { promisify } from 'util'

const execute = promisify(exec)

/**
 *
 */
export async function excludes(baseRef: string): Promise<string[]> {
  const r1 = await execute(
    `git diff origin/${baseRef} HEAD --name-only --no-renames`
  )
  const files = r1.stdout
    .split(/\r?\n/)
    .filter(n => n.length > 0)
    .join(' ')

  const r2 = await execute(
    `git check-attr linguist-generated linguist-vendored -- ${files}`
  )
  const excludes = r2.stdout
    .split(/\r?\n/)
    .filter(a => a.endsWith(': set'))
    .map(a => a.split(':')[0])

  return [...new Set(excludes)]
}

/**
 *
 */
export async function size(
  baseRef: string,
  excludes: string[]
): Promise<{ size: number; includes: string[] }> {
  const skip = excludes.map(e => `:^${e}`).join(' ')
  const cmd = `git diff origin/${baseRef} HEAD --numstat --ignore-space-change -- . ${skip}`
  console.log(cmd)
  const res = await execute(cmd)

  console.log(excludes)
  console.log(res.stdout)

  const data = res.stdout
    .split(/\r?\n/)
    .filter(c => c.length > 0)
    .map(c => {
      const parts = c.split(/\s+/)
      const added = parseInt(parts[0])
      const removed = parseInt(parts[1])

      return {
        added: isNaN(added) ? 0 : added,
        removed: isNaN(removed) ? 0 : removed,
        name: parts[2]
      }
    })

  console.log(data)

  return {
    size: data.reduce((t, d) => t + d.added + d.removed, 0),
    includes: data.map(d => d.name)
  }
}
