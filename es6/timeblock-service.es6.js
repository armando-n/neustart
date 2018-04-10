import 'babel-polyfill';
import ajaxService from './ajax-service.es6.js';
import WeeklySchedule from './weekly-schedule-model.es6.js';
import WeeklyTimeBlock from './weekly-timeblock-model.es6.js';

let activeWeeklySchedule;

export function getActiveWeeklySchedule() {
	if (!(activeWeeklySchedule instanceof WeeklySchedule))
		throw new Error('Invalid active weekly schedule accessed in TimeBlockService.getActiveWeeklySchedule');
	return activeWeeklySchedule;
}

export function setActiveWeeklySchedule(weeklySchedule) {
	if (!(weeklySchedule instanceof WeeklySchedule))
		throw new Error('Invalid argument passed to TimeBlockService.setActiveWeeklySchedule');

	activeWeeklySchedule = weeklySchedule;
}

export function add(timeBlock) {
	// send add time block request to server
	const timeBlockDataPromise = ajaxService.post('/weeklytimeblocks', timeBlock);

	// add time block returned in response to the weekly schedule in memory (it will have the blockID)
	return timeBlockDataPromise
		.then(newBlockData => new WeeklyTimeBlock(newBlockData))
		.then(newTimeBlock => getActiveWeeklySchedule().addBlock(newTimeBlock));
}

export function edit(timeBlock) {
	// send edit time block request to server
	const timeBlockDataPromise = ajaxService.put(`/weeklytimeblocks/${timeBlock.blockID}`, timeBlock);

	// edit time block in the weekly schedule in memory
	return timeBlockDataPromise
		.then(() => getActiveWeeklySchedule().editBlock(timeBlock));
}

export function remove(timeBlock) {
	// send delete request to server
	ajaxService.remove(`/weeklytimeblocks/${timeBlock.blockID}`)
		.catch(error => console.log(error));

	// delete time block from memory
	getActiveWeeklySchedule().removeBlock(timeBlock.blockID);

	// return modified weekly schedule
	return getActiveWeeklySchedule();
}

/** Given a time that does not lie within any time block, this will return
 * the upper and lower boundary times of this empty space for the day. The
 * upper and lower boundaries will either be the beginning or end of the day,
 * or the end or beginning of an adjacent block, respectively.
 */
export function findBlockBoundaries(time, dayIndex = time.getDay()) {
	const day = getActiveWeeklySchedule().daysWithTimeBlocks[dayIndex];
	let topBoundary;
	let bottomBoundary;
	time = moment(time).day(dayIndex);

	for (let i = 0; i < day.values.length; i++) {
		const block = day.values[i];
		let blockStartTime = moment({hour: block.startHour, minute: block.startMinute}).day(dayIndex);
		let blockEndTime = moment({hour: block.endHour, minute: block.endMinute}).day(dayIndex);

		// target time is before any blocks
		if (!topBoundary && blockStartTime.isAfter(time, 'minute')) {
			topBoundary = moment().day(dayIndex).startOf('day');
			bottomBoundary = blockStartTime;
			break;
		}

		// target time is after the last block
		else if (!bottomBoundary && i === day.values.length-1) {
			topBoundary = blockEndTime;
			bottomBoundary = moment().day(dayIndex).endOf('day');
			break;
		}

		// target time may be in between this block and the next block
		else {
			const nextBlock = day.values[i+1];
			let nextBlockStartTime = moment({hour: nextBlock.startHour, minute: nextBlock.startMinute}).day(dayIndex);
			let nextBlockEndTime = moment({hour: nextBlock.endHour, minute: nextBlock.endMinute}).day(dayIndex);

			if (time.isAfter(blockEndTime, 'minute') && time.isBefore(nextBlockStartTime, 'minute')) {
				topBoundary = blockEndTime;
				bottomBoundary = nextBlockStartTime;
				break;
			}
		}
	}

	return [topBoundary, bottomBoundary];
}