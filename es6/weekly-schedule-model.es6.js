import 'babel-polyfill';

export class WeeklySchedule {

	constructor(rawTimeBlocks) {
		let daysWithTimeBlocks;

		// allow WeeklySchedule object as argument
		if (rawTimeBlocks instanceof WeeklySchedule) {
			daysWithTimeBlocks = rawTimeBlocks.daysWithTimeBlocks;
		}

		// argument should be an array of either raw time block records or nested records grouped by day
		else if (Array.isArray(rawTimeBlocks) && rawTimeBlocks.length > 0) {

			// allow nested time blocks grouped by day as argument
			if (rawTimeBlocks[0].key === 'sunday') {
				rawTimeBlocks.forEach(day =>
					day.values.forEach(validateBlock)
				);
				daysWithTimeBlocks = rawTimeBlocks;
			}

			else {
				rawTimeBlocks.forEach(validateBlock);

				// group time blocks by day of week
				daysWithTimeBlocks = d3.nest().key(rawBlock => rawBlock.dayOfWeek).entries(rawTimeBlocks);
			}

		}

		else {
			throw new Error('Invalid argument in WeeklySchedule constructor');
		}

		// fill in any missing day objects
		const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
		const allDays = [];
		for (let dayIndex = 0, dataIndex = 0; dayIndex < days.length; dayIndex++, dataIndex++) {
			if (daysWithTimeBlocks[dataIndex] && daysWithTimeBlocks[dataIndex].key === days[dayIndex]) {
				allDays.push(daysWithTimeBlocks[dataIndex]);
			}
			else {
				allDays.push({ key: days[dayIndex], values: [] });
				dataIndex--;
			}
		}
		this.daysWithTimeBlocks = allDays;
	}

	removeBlock(blockID) {
		let targetDayIndex = -1;
		let targetBlockIndex = -1;

		for (let i = 0; i < this.daysWithTimeBlocks.length; i++) {
			const candidateIndex = findIndexOfBlock(this.daysWithTimeBlocks[i].values, blockID);
			if (candidateIndex !== -1) {
				targetDayIndex = i;
				targetBlockIndex = candidateIndex;
				break;
			}
		}

		if (targetDayIndex === -1 || targetBlockIndex === -1)
			throw new Error('Invalid block ID given to WeeklySchedule.removeBlock');

		this.daysWithTimeBlocks[targetDayIndex].values.splice(targetBlockIndex, 1);
	}
}

function validateBlock(rawBlock, ignoreDayOfWeek = false) {
	if (
		rawBlock.blockID === undefined ||
		(rawBlock.dayOfWeek === undefined && !ignoreDayOfWeek) ||
		rawBlock.startHour === undefined ||
		rawBlock.startMinute === undefined ||
		rawBlock.endHour === undefined ||
		rawBlock.endMinute === undefined ||
		rawBlock.isReceivingTexts === undefined ||
		rawBlock.isReceivingCalls === undefined ||
		rawBlock.isTextRepeating === undefined ||
		rawBlock.isCallRepeating === undefined ||
		rawBlock.repeatTextDuration === undefined ||
		rawBlock.repeatCallDuration === undefined
	) {
		throw new Error('Invalid argument in WeeklySchedule constructor');
	}
}

function findIndexOfBlock(array, blockID) {
	let targetIndex = -1;
	for (let i = 0; i < array.length; i++) {
		if (array[i].blockID === blockID) {
			targetIndex = i;
			break;
		}
	}

	return targetIndex;
}

export default WeeklySchedule;