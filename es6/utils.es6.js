export const toNum = num => {
	if (typeof num === 'number')
		return num;
	return parseFloat(num, 10);
}

export const zPad = (num, size = 2, ignoreOverflow = false) => {
	const numStr = num.toString().trim();

	if (numStr.length > size) {
		if (ignoreOverflow)
			return numStr;
		throw new Error('zPad size too small: digits would need to be dropped to make it fit');
	}

	return ('0'.repeat(size) + num.toString()).slice(-size);
}

/** Takes a number from 0 to 24 and returns an array.
 * The first array element is the hour converted to 1-12,
 * and the second array element is the meridiem (am or pm). */
export const to12Hours = (hour24) => {
	const numHour24 = toNum(hour24);
	if (numHour24 === 0 || numHour24 === 24)
		return [12, 'am'];
	else if (numHour24 < 12)
		return [numHour24, 'am'];
	else if (numHour24 === 12)
		return [12, 'pm'];
	else
		return [numHour24 % 12, 'pm'];
}

export const timeout = (milliseconds) =>
	new Promise(resolve => setTimeout(resolve, milliseconds))