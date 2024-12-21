// ...

import { exec } from "child_process";
import { promisify } from "util";

const execute = promisify(exec);

// ...
export async excludes(baseRef: string): string[] {
	const r1 = await execute(`git diff origin/${baseRef} HEAD --name-only --no-renames`);
	const files = r1.stdout.split(/\r?\n/).filter(n => n.length > 0).join(' ');

	const r2 = await execute(`git check-attr linguist-generated linguist-vendored -- ${files}`);
	const excludes = r2.split(/\r?\n/).filter(a => a.endsWith(': set')).map(a => a.split(':')[0]);

	return [...new Set(excludes)];
}

// ...
export async size(baseRef: string, excludes: Array<string>): {size: number, includes: string[]} {
	const res = await execute(
		`git diff origin/${baseRef} HEAD --numstat --ignore-space-change -- . ${excludes.join(' ')}`,
	);

	const data = res.stdout.
		split(/\r?\n/).
		filter(c => c.length > 0).
		map(c => {
			const parts = c.split(/\s+/);
			return {
				added: parseInt(parts[0]),
				removed: parseInt(parts[1]),
				name: parts[2],
			};
		});

	return {
		size: data.reduce((t, d) => t + d.added + d.removed, 0),
		includes: data.map(d => d.name),
	};
}
