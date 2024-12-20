module.exports = async ({context, core, exec}) => {
	const baseRef = context.payload.pull_request.base.ref;
	const excludes = process.env.excludes.split(' ').filter(e => e.length > 0);

	let changed = ''
	await exec.exec(
		'git',
		['diff', `origin/${baseRef}`, 'HEAD', '--numstat', '--ignore-space-change', '--', '.', ...excludes],
		{
			listeners: {
				stdout: (data) => {
					changed += data.toString();
				},
			}
		},
	);

	const data = changed.split(/\r?\n/).filter(c => c.length > 0).map((c) => {
		const parts = c.split(/\s+/);
		return {
			added: parseInt(parts[0]),
			removed: parseInt(parts[1]),
			name: parts[2],
		};
	});

	const size = data.reduce((total, d) => total + d.added + d.removed, 0);
	const includes = data.map(d => d.name);

	core.setOutput('size', size);
	core.setOutput('includes', includes.join(' '));
}
