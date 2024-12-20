// TODO: convert

const exec = require('@actions/exec');

async function calculateSize(excludes) {
	let changed = ''
	await exec.exec(
		'git',
		['diff', 'origin/${{ github.base_ref }}', 'HEAD', '--numstat', '--ignore-space-change', '--', '.', ...excludes],
		{
			listeners: {
				stdout: (data) => {
					changed += data.toString();
				},
			}
		},
	);

	return changed
		.split(/\r?\n/)
		.filter(c => c.length > 0)
		.map(c => {
			const parts = c.split(/\s+/);
			return {
				added: parseInt(parts[0]),
				removed: parseInt(parts[1]),
				name: parts[2],
			};
		})
		.reduce((total, d) => total + d.added + d.removed, 0);
}

module.exports = { calculateSize };
