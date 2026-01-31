/*global console, module, process*/

module.exports = async ({ context, core, exec, github }) => {
  if (!context.payload.pull_request) {
    console.debug("skipping non-pull request");
    return;
  }

  const baseRef = context.payload.pull_request.base.ref;

  const ignoreDeletedFiles = process.env.ignore_deleted_files === "true";
  if (ignoreDeletedFiles) {
    console.debug(`ignoring deleted files to calculate size`);
  }

  const ignoreDeletedLines = process.env.ignore_deleted_lines === "true";
  if (ignoreDeletedLines) {
    console.debug(`ignoring deleted lines to calculate size`);
  }

  const dryRun = process.env.dry_run === "true";

  try {
    if (!dryRun) {
      await createLabels({ context, github });
    }

    const excludes = await gatherExcludes({ baseRef, exec });
    core.setOutput("excludes", excludes.join(" "));

    let ignores = await gatherIgnores({ baseRef, exec, ignoreDeletedFiles });

    const {
      size,
      includes,
      ignores: additionalIgnores,
    } = await getSize({ baseRef, exec, excludes, ignores, ignoreDeletedLines });
    core.setOutput("size", size);
    core.setOutput("includes", includes.join(" "));

    ignores = [...new Set([...ignores, ...additionalIgnores])];
    core.setOutput("ignores", ignores.join(" "));

    const label = selectLabel({ size });
    core.setOutput("label", label.name);

    if (!dryRun) {
      await assignLabel({ context, github, label });
    }
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    }
  }
};

/**
 * Collect the configuration for all labels.
 */
function labels() {
  return [
    {
      name: process.env.xs_label,
      color: process.env.color,
      threshold: process.env.xs_threshold,
      description: "Pull requests with a very small number of lines changed.",
    },
    {
      name: process.env.s_label,
      color: process.env.color,
      threshold: process.env.s_threshold,
      description: "Pull requests with a small number of lines changed.",
    },
    {
      name: process.env.m_label,
      color: process.env.color,
      threshold: process.env.m_threshold,
      description: "Pull requests with a medium number of lines changed.",
    },
    {
      name: process.env.l_label,
      color: process.env.color,
      threshold: process.env.l_threshold,
      description: "Pull requests with a large number of lines changed.",
    },
    {
      name: process.env.xl_label,
      color: process.env.color,
      threshold: process.env.xl_threshold,
      description: "Pull requests with a very large number of lines changed.",
    },
    {
      name: process.env.xxl_label,
      color: process.env.color,
      threshold: Infinity,
      description:
        "Pull requests with a very, very large number of lines changed.",
    },
  ];
}

/**
 * Create size labels so they can be assigned to pull requests.
 */
async function createLabels({ context, github }) {
  const resp = await github.rest.issues.listLabelsForRepo(context.repo);
  const have = new Set(resp.data.map((l) => l.name.toLowerCase()));

  const missing = labels().filter((l) => !have.has(l.name.toLowerCase()));

  for (const label of missing) {
    console.debug(`creating label: ${label.name}`);

    await github.rest.issues.createLabel({
      ...context.repo,
      name: label.name,
      color: label.color,
      description: label.description,
    });
  }
}

/**
 * Map the calculated size to the corresponding label.
 */
function selectLabel({ size }) {
  return labels().find((l) => l.threshold > size);
}

/**
 * Assign the chosen label to the pull request.
 */
async function assignLabel({ context, github, label }) {
  const resp = await github.rest.issues.listLabelsOnIssue({
    ...context.repo,
    issue_number: context.issue.number,
  });

  const have = new Set(resp.data.map((l) => l.name));
  const remove = labels()
    .map((l) => l.name)
    .filter((l) => l != label.name);

  if (!have.has(label.name)) {
    console.debug(`adding label: ${label.name}`);

    await github.rest.issues.addLabels({
      ...context.repo,
      issue_number: context.issue.number,
      labels: [label.name],
    });
  }

  for (const rm of remove) {
    if (have.has(rm)) {
      console.debug(`removing label: ${rm}`);

      await github.rest.issues.removeLabel({
        ...context.repo,
        issue_number: context.issue.number,
        name: rm,
      });
    }
  }
}

/**
 * Gather the files that should be excluded from the size calculation.
 */
async function gatherExcludes({ baseRef, exec }) {
  const o1 = await exec.getExecOutput("git", [
    "diff",
    `origin/${baseRef}...HEAD`,
    "--name-only",
    "--no-renames",
  ]);
  const files = o1.stdout.split(/\r?\n/).filter((n) => n.length > 0);

  if (!files.length) {
    return [];
  }

  const o2 = await exec.getExecOutput("git", [
    "check-attr",
    "linguist-generated",
    "linguist-vendored",
    "--",
    ...files,
  ]);
  const excludes = o2.stdout
    .split(/\r?\n/)
    .filter((a) => a.endsWith(": set") || a.endsWith(": true"))
    .map((a) => a.split(":")[0]);

  return [...new Set(excludes)];
}

/**
 * Gather the files to ignore from the size calculation.
 */
async function gatherIgnores({ baseRef, exec, ignoreDeletedFiles }) {
  let files = [];
  if (ignoreDeletedFiles) {
    const o1 = await exec.getExecOutput("git", [
      "log",
      "--diff-filter=D",
      "--pretty=format:",
      "--name-only",
      "--no-commit-id",
      `origin/${baseRef}...HEAD`,
    ]);
    files.push(...o1.stdout.split(/\r?\n/).filter((n) => n.length > 0));
  }
  return [...new Set(files)];
}

/**
 * Calculate the size of the change, returning the size and the files used in the calculation.
 */
async function getSize({
  baseRef,
  exec,
  excludes,
  ignores,
  ignoreDeletedLines,
}) {
  const ignoreAndExclude = [...excludes, ...ignores];
  const output = await exec.getExecOutput("git", [
    "diff",
    `origin/${baseRef}...HEAD`,
    "--no-renames",
    "--numstat",
    "--ignore-space-change",
    "--",
    ".",
    ...ignoreAndExclude.map((e) => `:^${e}`),
  ]);
  let data = output.stdout
    .split(/\r?\n/)
    .filter((c) => c.length > 0)
    .map((c) => {
      const parts = c.split(/\s+/);

      return {
        added: parseInt(parts[0]) || 0,
        removed: parseInt(parts[1]) || 0,
        name: parts[2],
      };
    });

  let additionalIgnores = [];
  if (ignoreDeletedLines) {
    additionalIgnores = data
      .filter((d) => d.added === 0 && d.removed > 0)
      .map((d) => d.name);
  }

  return {
    size: data.reduce(
      (t, d) => t + (ignoreDeletedLines ? d.added : d.added + d.removed),
      0,
    ),
    includes: data
      .map((d) => d.name)
      .filter((f) => !additionalIgnores.includes(f)),
    ignores: additionalIgnores,
  };
}
