import 'babel-polyfill';
import { WeeklySchedule } from './weekly-schedule-model.es6.js';

let activeWeeklySchedule;

function getActiveWeeklySchedule() {
	if (!(activeWeeklySchedule instanceof WeeklySchedule))
		throw new Error('Invalid active weekly schedule accessed in TimeBlockService.getActiveWeeklySchedule');
	return activeWeeklySchedule;
}

export function setActiveWeeklySchedule(weeklySchedule) {
	if (!(weeklySchedule instanceof WeeklySchedule))
		throw new Error('Invalid argument passed to TimeBlockService.setActiveWeeklySchedule');

	activeWeeklySchedule = weeklySchedule;
}

export function edit(event) {
	event.preventDefault();

	// check form input validty

	// if invalid, display errors and finish

	// process input

	// create new time block

	// adjust other time blocks affected by new block

	// send modified time block data to server to be stored

	// close modal dialog

	// update weekly schedule svg
}

export function remove(timeBlock) {
	getActiveWeeklySchedule().removeBlock(timeBlock.blockID);
	return getActiveWeeklySchedule();
}