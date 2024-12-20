module.exports = async ({context, core, exec}) => {
	const baseRef = context.payload.pull_request.base.ref

	// TODO: use https://www.geeksforgeeks.org/node-js-util-promisify-method/
	// see https://github.com/golangci/golangci-lint-action/blob/master/src/install.ts#L10
	// (once converted to js action)
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
