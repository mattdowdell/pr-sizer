// TODO: convert

async function excludes() {
	let names = '';
	await exec.exec(
		'git',
		['diff', 'origin/${{ github.base_ref }}', 'HEAD', '--name-only', '--no-renames'],
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

	return new Set(attrs.split(/\r?\n/).filter(e => e.endsWith(': set')).map(e => e.split(':')[0]));
}

module.export = { excludes };
