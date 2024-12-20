module.exports = async ({context, github}) => {
	const resp = await github.rest.issues.listLabelsOnIssue({
		...context.repo,
		issue_number: context.issue.number,
	});

	const assigned = new Set(resp.data.map(l => l.name));
	const sizes = new Set([
		process.env.xs_label,
		process.env.s_label,
		process.env.m_label,
		process.env.l_label,
		process.env.xl_label,
		process.env.xxl_label,
	]);

	const size = process.env.label;
	sizes.delete(size);

	if (!assigned.has(size)) {
		console.debug(`adding label: ${size}`);

		github.rest.issues.addLabels({
			...context.repo,
			issue_number: context.issue.number,
			labels: [size],
		})
	}

	for (const s of sizes) {
		if (assigned.has(s)) {
			console.debug(`removing label: ${s}`);

			github.rest.issues.removeLabel({
				...context.repo,
				issue_number: context.issue.number,
				name: s,
			});
		}
	}
}
