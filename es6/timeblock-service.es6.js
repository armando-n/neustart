import 'babel-polyfill';
import ajaxService from './ajax-service.es6.js';
import * as svgService from './dashboard-svg-service.es6.js';
import WeeklySchedule from './weekly-schedule-model.es6.js';
import WeeklyTimeBlock from './weekly-timeblock-model.es6.js';

let activeWeeklySchedule;
const scheduleHistory = [];

export function getActiveWeeklySchedule() {
	if (!(activeWeeklySchedule instanceof WeeklySchedule))
		throw new Error('Invalid active weekly schedule accessed in TimeBlockService.getActiveWeeklySchedule');
	return activeWeeklySchedule;
}

export function setActiveWeeklySchedule(weeklySchedule) {
	if (!(weeklySchedule instanceof WeeklySchedule))
		throw new Error('Invalid argument passed to TimeBlockService.setActiveWeeklySchedule');

	activeWeeklySchedule = weeklySchedule;
	scheduleHistory.push(weeklySchedule);

	return activeWeeklySchedule;
}

export function add(timeBlock) {
	// clone block to strip superfluous properties
	const blockClone = timeBlock.clone();

	// send add time block request to server
	const timeBlockDataPromise = ajaxService.post('/weeklytimeblocks', blockClone);

	// add time block returned in response to the weekly schedule in memory (it will have the blockID)
	return timeBlockDataPromise
		.then(newBlockData => new WeeklyTimeBlock(newBlockData))
		.then(newTimeBlock => getActiveWeeklySchedule().addBlock(newTimeBlock));
}

export function edit(timeBlock) {
	// clone block to strip superfluous properties
	const blockClone = timeBlock.clone();

	// send edit time block request to server
	const timeBlockDataPromise = ajaxService.put(`/weeklytimeblocks/${blockClone.blockID}`, blockClone);

	// edit time block in the weekly schedule in memory
	return timeBlockDataPromise
		.then(() => getActiveWeeklySchedule().editBlock(blockClone));
}

/** Sends a delete time block request to the server, then deletes the block
 * from memory and returns the modified schedule as a promise. */
export function remove(timeBlock) {
	return ajaxService.remove(`/weeklytimeblocks/${timeBlock.blockID}`)
		.then(() => getActiveWeeklySchedule().removeBlock(timeBlock.blockID));
}

export function copy(blockToCopy, daysToCopyTo) {
	const copyResults = getActiveWeeklySchedule().copyBlock(blockToCopy, daysToCopyTo);
	const operations = [];

	copyResults.deletedBlocks.forEach(deletedBlock =>
		operations.push({
			method: 'DELETE',
			body: deletedBlock.blockID
		})
	);

	copyResults.updatedBlocks.forEach(updatedBlock =>
		operations.push({
			method: 'PUT',
			body: new WeeklyTimeBlock(updatedBlock)
		})
	);

	copyResults.createdBlocks.forEach(createdBlock =>
		operations.push({
			method: 'POST',
			body: createdBlock
		})
	);

	return ajaxService.post('/weeklytimeblocks', operations)
		.then(extractSchedule)
		.then(setActiveWeeklySchedule)
		.then(svgService.setWeeklyData)
		.then(schedule => mergeIdenticalAdjacentBlocks(schedule, daysToCopyTo.map(day => day.index)))
		.then(svgService.setWeeklyData)
}

export function mergeIdenticalAdjacentBlocks(schedule, dayIndexes) {
	if (!(schedule instanceof WeeklySchedule))
		throw new Error('Invalid schedule passed to timeBlockService.mergeIdenticalAdjacentBlocks');

	const mergeResults = schedule.mergeIdentAdjacentBlocks(dayIndexes);
	const operations = [];

	mergeResults.deletedBlocks.forEach(deletedBlock =>
		operations.push({
			method: 'DELETE',
			body: deletedBlock.blockID
		})
	);

	mergeResults.updatedBlocks.forEach(updatedBlock =>
		operations.push({
			method: 'PUT',
			body: new WeeklyTimeBlock(updatedBlock)
		})
	);

	if (operations.length === 0)
		return Promise.resolve(schedule);

	return ajaxService.post('/weeklytimeblocks', operations)
		.then(extractSchedule)
		.then(setActiveWeeklySchedule);
}

function extractSchedule(response) { return new WeeklySchedule(response.schedule); }