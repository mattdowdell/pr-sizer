// TODO: convert

const core = require('@actions/core');

async function assign(octokit, context, size) {
	const labels = await octokit.rest.issues.listLabelsOnIssue({
		owner: context.repo.owner,
		repo: context.repo.repo,
		issue_number: context.issue.number,
	});

	const assigned = new Set(labels.data.map(l => l.name));
	const sizes = new Set([
		core.getInput('xs-label'),
		core.getInput('s-label'),
		core.getInput('m-label'),
		core.getInput('l-label'),
		core.getInput('xl-label'),
		core.getInput('xxl-label'),
	]);

	sizes.delete(size);

	if (!assigned.has(size)) {
		core.debug(`adding label: ${size}`);

		octokit.rest.issues.addLabels({
			owner: context.repo.owner,
			repo: context.repo.repo,
			issue_number: context.issue.number,
			labels: [size],
		})
	}

	for (const s of sizes) {
		if (assigned.has(s)) {
			core.debug(`removing label: ${s}`);

			octokit.rest.issues.removeLabel({
				owner: context.repo.owner,
				repo: context.repo.repo,
				issue_number: context.issue.number,
				name: s,
			});
		}
	}
}

module.exports = { assign };
