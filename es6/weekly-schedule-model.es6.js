import 'babel-polyfill';

export class WeeklySchedule {

	constructor(rawTimeBlocks) {

		// allow WeeklySchedule object as argument
		if (rawTimeBlocks instanceof WeeklySchedule) {
			this.daysWithTimeBlocks = rawTimeBlocks.daysWithTimeBlocks;
		}

		// argument should be an array of raw time block records
		else if (Array.isArray(rawTimeBlocks)) {
			// validate data
			rawTimeBlocks.forEach(rawBlock => {
				if (
					rawBlock.blockID === undefined ||
					rawBlock.dayOfWeek === undefined ||
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
			});

			// group time blocks by day of week
			this.daysWithTimeBlocks = d3.nest().key(rawBlock => rawBlock.dayOfWeek).entries(rawTimeBlocks);
		}

		else {
			throw new Error('Invalid argument in WeeklySchedule constructor');
		}
	}
}

export default WeeklySchedule;