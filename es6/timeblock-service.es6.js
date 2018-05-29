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

	return activeWeeklySchedule;
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
}

export function mergeIdenticalAdjacentBlocks(schedule, dayIndexes) {
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

	return ajaxService.post('/weeklytimeblocks', operations)
		.then(extractSchedule)
		.then(setActiveWeeklySchedule);
}

function extractSchedule(response) { return new WeeklySchedule(response.schedule); }