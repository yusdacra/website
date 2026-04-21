// https://noe.sh/dollcode/
const charmap = ['▌', '▖', '▘'];
export const genDollcode = (number: number) => {
	const output = [];
	let window = number;
	let loopProtection = 1000;

	while (loopProtection > 0 && window > 0) {
		const mod = window % 3;

		if (mod == 0) {
			window = (window - 3) / 3;
		} else {
			window = (window - mod) / 3;
		}

		output.unshift(charmap[mod]);

		loopProtection--;
	}

	return output.join('');
};
