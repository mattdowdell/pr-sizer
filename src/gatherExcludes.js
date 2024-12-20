module.exports = async ({core, exec, context}) => {
	const baseRef = process.env.GITHUB_BASE_REF
	console.debug(baseRef);
	console.debug(context);

	let names = '';
	await exec.exec(
		'git',
		['diff', `origin/${baseRef}`, 'HEAD', '--name-only', '--no-renames'],
		{
			listeners: {
				stdout: (data) => {
					names += data.toString();
				},
			}
		},
	);

	const files = names.split(/\r?\n/).filter(n => n.length > 0);

	let attrs = '';
	await exec.exec(
		'git',
		['check-attr', 'linguist-generated', 'linguist-vendored', '--', ...files],
		{
			listeners: {
				stdout: (data) => {
					attrs += data.toString();
				},
			}
		},
	);

	let excludes = new Set(attrs.split(/\r?\n/).filter(e => e.endsWith(': set')).map(e => e.split(':')[0]));
	core.setOutput('excludes', [...excludes].join(' '));
}
