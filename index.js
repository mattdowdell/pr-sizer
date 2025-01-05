module.exports = async ({context, core, exec, github}) => {
    if (!context.payload.pull_request) {
        console.debug('skipping non-pull request')
        return
    }

    const baseRef = context.payload.pull_request.base.ref

    try {
        await createLabels({context, github})

        const excludes = await gatherExcludes({baseRef, exec})
        core.setOutput('excludes', excludes.join(' '))

        const { size, includes } = await getSize({baseRef, exec, excludes})
        core.setOutput('size', size)
        core.setOutput('includes', includes.join(' '))

        const label = selectLabel({size})
        core.setOutput('label', label.name)

        await assignLabel({context, github, label})
    } catch (error) {
        if (error instanceof Error) {
            core.setFailed(error.message)
        }
    }
}

function labels() {
    return [
        {
            name: process.env.xs_label,
            color: process.env.color,
            threshold: process.env.xs_threshold,
            description: 'Pull requests with a very small number of lines changed.',
        },
        {
            name: process.env.s_label,
            color: process.env.color,
            threshold: process.env.s_threshold,
            description: 'Pull requests with a small number of lines changed.'
        },
        {
            name: process.env.m_label,
            color: process.env.color,
            threshold: process.env.m_threshold,
            description: 'Pull requests with a medium number of lines changed.'
        },
        {
            name: process.env.l_label,
            color: process.env.color,
            threshold: process.env.l_threshold,
            description: 'Pull requests with a large number of lines changed.'
        },
        {
            name: process.env.xl_label,
            color: process.env.color,
            threshold: process.env.xl_threshold,
            description: 'Pull requests with a very large number of lines changed.'
        },
        {
            name: process.env.xxl_label,
            color: process.env.color,
            threshold: Infinity,
            description: 'Pull requests with a very, very large number of lines changed.'
        },
    ]
}

async function createLabels({context, github}) {
    const resp = await github.rest.issues.listLabelsForRepo(context.repo)
    const have = new Set(resp.data.map(l => l.name))

    const missing = labels().filter(l => !have.has(l.name))

    for (const label of missing) {
      console.debug(`creating label: ${label.name}`)

      await github.rest.issues.createLabel({
        ...context.repo,
        name: label.name,
        color: label.color,
        description: label.description
      })
    }
}

function selectLabel({size}) {
    return labels().find(l => l.threshold > size)
}

async function assignLabel({context, github, label}) {
    const resp = await github.rest.issues.listLabelsOnIssue({
      ...context.repo,
      issue_number: context.issue.number
    })

    const have = new Set(resp.data.map(l => l.name))
    const remove = new Set(labels())

    remove.delete(label)
    console.debug('have', have)
    console.debug('remove', remove)

    if (!have.has(label.name)) {
      console.debug(`adding label: ${label.name}`)

      await github.rest.issues.addLabels({
        ...context.repo,
        issue_number: context.issue.number,
        labels: [label.name]
      })
    }

    for (const rm of remove) {
      if (have.has(rm.name)) {
        console.debug(`removing label: ${rm.name}`)

        await github.rest.issues.removeLabel({
          ...context.repo,
          issue_number: context.issue.number,
          name: rm.name
        })
      }
    }
}

async function gatherExcludes({baseRef, exec}) {
    const s1 = await execute(
        exec,
        'git',
        ['diff', `origin/${baseRef}`, 'HEAD', '--name-only', '--no-renames']
    )
    const files = s1
        .split(/\r?\n/)
        .filter(n => n.length > 0)

    const s2 = await execute(
        exec,
        'git',
        ['check-attr', 'linguist-generated', 'linguist-vendored', '--', ...files]
    )
    const excludes = s2
        .split(/\r?\n/)
        .filter(a => a.endsWith(': set'))
        .map(a => a.split(':')[0])

    return [...new Set(excludes)]
}

async function getSize({baseRef, exec, excludes}) {
    const output = await execute(
        exec,
        'git',
        [
            'diff',
            `origin/${baseRef}`,
            'HEAD', '--numstat',
            '--ignore-space-change',
            '--',
            '.',
            ...excludes.map(e => `:^${e}`)
        ],
    );
    const data = output
        .split(/\r?\n/)
        .filter(c => c.length > 0)
        .map(c => {
            const parts = c.split(/\s+/)

            return {
                added: parseInt(parts[0]) || 0,
                removed: parseInt(parts[1]) || 0,
                name: parts[2]
            }
        })

    return {
        size: data.reduce((t, d) => t + d.added + d.removed, 0),
        includes: data.map(d => d.name)
    }
}

async function execute(exec, cmd, args) {
    let output = '';
    const options = {
        listeners: {
            stdout: (data) => {
                output += data.toString();
            },
        },
    };

    await exec.exec(cmd, args, options);
    return output
}
