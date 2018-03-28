import 'babel-polyfill';

class WeeklySchedule extends Array {

	constructor(rawTimeBlocks) {

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
		const daysWithTimeBlocks = d3.nest().key(rawBlock => rawBlock.dayOfWeek).entries(rawTimeBlocks);

		// spread days into array
		super(...daysWithTimeBlocks);
	}
}

export default WeeklySchedule;