import 'babel-polyfill';
import WeeklyTimeBlock from './weekly-timeblock-model.es6';

export class WeeklySchedule {

	static get days() {
		return ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
	}

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
					day.values = day.values.map(validateBlock)
				);
				daysWithTimeBlocks = rawTimeBlocks;
			}

			else {
				rawTimeBlocks = rawTimeBlocks.map(validateBlock);

				// group time blocks by day of week
				daysWithTimeBlocks = d3.nest().key(rawBlock => rawBlock.dayOfWeek).entries(rawTimeBlocks);
			}

		}

		else {
			throw new Error('Invalid argument in WeeklySchedule constructor');
		}

		// fill in any missing day objects
		const days = WeeklySchedule.days;
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

	addBlock(weeklyTimeBlock) {
		if (!(weeklyTimeBlock instanceof WeeklyTimeBlock))
			throw new Error('Invalid time block given to WeeklySchedule.addBlock');

		const dayIndex = WeeklySchedule.days.indexOf(weeklyTimeBlock.dayOfWeek);

		this.daysWithTimeBlocks[dayIndex].values.push(weeklyTimeBlock);
		this.daysWithTimeBlocks[dayIndex].values.sort(comparator);

		return weeklyTimeBlock;
	}

	editBlock(weeklyTimeBlock) {
		if (!(weeklyTimeBlock instanceof WeeklyTimeBlock))
			throw new Error('Invalid time block given to WeeklySchedule.editBlock');

		const dayIndex = WeeklySchedule.days.indexOf(weeklyTimeBlock.dayOfWeek);
		const blockIndex = findIndexOfBlock(this.daysWithTimeBlocks[dayIndex].values, weeklyTimeBlock.blockID);

		Object.assign(this.daysWithTimeBlocks[dayIndex].values[blockIndex], weeklyTimeBlock);

		this.daysWithTimeBlocks[dayIndex].values[blockIndex];
	}

	removeBlock(blockID) {
		const [dayIndex, blockIndex] = getDayAndBlockIndexes.call(this, blockID);
		this.daysWithTimeBlocks[dayIndex].values.splice(blockIndex, 1);
	}

	getBlock(blockID) {
		const [dayIndex, blockIndex] = getDayAndBlockIndexes.call(this, blockID);
		return this.daysWithTimeBlocks[dayIndex].values[blockIndex];
	}
}

function getDayAndBlockIndexes(blockID) {
	let targetDayIndex = -1;
	let targetBlockIndex = -1;

	// go through each day of the week
	for (let i = 0; i < this.daysWithTimeBlocks.length; i++) {
		// search day for the block with the given block ID
		const candidateIndex = findIndexOfBlock(this.daysWithTimeBlocks[i].values, blockID);
		if (candidateIndex !== -1) {
			targetDayIndex = i;
			targetBlockIndex = candidateIndex;
			break;
		}
	}

	if (targetDayIndex === -1 || targetBlockIndex === -1)
		throw new Error('Invalid block ID given to WeeklySchedule.removeBlock');

	return [targetDayIndex, targetBlockIndex];
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

	return new WeeklyTimeBlock(rawBlock);
}

function findIndexOfBlock(timeBlocks, blockID) {
	let targetIndex = -1;
	for (let i = 0; i < timeBlocks.length; i++) {
		if (timeBlocks[i].blockID == blockID) {
			targetIndex = i;
			break;
		}
	}

	return targetIndex;
}

function comparator(blockA, blockB) {
	if (
		blockA.startHour > blockB.startHour || (
			blockA.startHour === blockB.startHour &&
			blockA.startMinute > blockB.startMinute
		)
	) {
		return -1;
	}

	else if (blockA.startHour === blockB.startHour && blockA.startMinute === blockB.startMinute) {
		return 0;
	}

	else {
		return 1;
	}
}

export default WeeklySchedule;