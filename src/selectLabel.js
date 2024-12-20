module.exports = async ({core}) => {
	const size = parseInt(process.env.size);
	const thresholds = [
		{
			label: process.env.xs_label,
			max: parseInt(process.env.xs_threshold),
		},
		{
			label: process.env.s_label,
			max: parseInt(process.env.s_threshold),
		},
		{
			label: process.env.m_label,
			max: parseInt(process.env.m_threshold),
		},
		{
			label: process.env.l_label,
			max: parseInt(process.env.l_threshold),
		},
		{
			label: process.env.xl_label,
			max: parseInt(process.env.xl_threshold),
		},
	];

	let label = process.env.xxl_label;

	for (t of thresholds) {
		if (t.max > size) {
			label = t.label;
			break;
		}
	}

	core.setOutput('label', label);
}
