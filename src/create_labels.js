// TODO: convert

async function createLabels() {
	const labels = await github.rest.issues.listLabelsForRepo({
		owner: context.repo.owner,
		repo: context.repo.repo,
	});

	const have = new Set(labels.data.map((l) => l.name));
	const want = [
		{
			name: core.getInput('xs-label'),
			description: 'Pull requests with a very small number of lines changed.',
		},
		{
			name: core.getInput('s-label'),
			description: 'Pull requests with a small number of lines changed.',
		},
		{
			name: core.getInput('m-label'),
			description: 'Pull requests with a medium number of lines changed.',
		},
		{
			name: core.getInput('l-label'),
			description: 'Pull requests with a large number of lines changed.',
		},
		{
			name: core.getInput('xl-label'),
			description: 'Pull requests with a very large number of lines changed.',
		},
		{
			name: core.getInput('xxl-label'),
			description: 'Pull requests with a very, very large number of lines changed.',
		},
	];

	const missing = want.filter(l => !have.has(l.name));

	for (label of missing) {
		core.debug(`creating label: ${label.name}`);

		await github.rest.issues.createLabel({
			owner: context.repo.owner,
			repo: context.repo.repo,
			name: label.name,
			color: '4f348b',
			description: label.description,
		});
	}
}

module.exports = { createLabels };
