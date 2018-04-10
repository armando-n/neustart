import 'babel-polyfill';

class WeeklyTimeBlock {

	static get days() {
		return ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
	}

	static get blockTypes() {
		return ['no-text-or-call', 'text-only', 'call-only', 'text-and-call'];
	}

	constructor({
		blockID,
		dayOfWeek,
		startHour,
		startMinute,
		endHour,
		endMinute,
		comment,
		isReceivingTexts = false,
		isReceivingCalls = false,
		isTextRepeating = false,
		isCallRepeating = false,
		repeatTextDuration = 5,
		repeatCallDuration = 10
	}) {
		if (
			dayOfWeek === undefined ||
			startHour === undefined ||
			startMinute === undefined ||
			endHour === undefined ||
			endMinute === undefined
		) {
			throw new Error('Required arguments missing in WeeklyTimeBLock constructor');
		}

		this.blockID = blockID || undefined;
		this.comment = comment || undefined;
		this.dayOfWeek = dayOfWeek;
		this.startHour = startHour;
		this.startMinute = startMinute;
		this.endHour = endHour;
		this.endMinute = endMinute;
		this.isReceivingTexts = isReceivingTexts;
		this.isReceivingCalls = isReceivingCalls;
		this.isTextRepeating = isTextRepeating;
		this.isCallRepeating = isCallRepeating;
		this.repeatTextDuration = repeatTextDuration;
		this.repeatCallDuration = repeatCallDuration;
	}

	get dayIndex() {
		return WeeklyTimeBlock.days.indexOf(this.dayOfWeek);
	}

	get startTime() {
		return new Date(moment({hour: this.startHour, minute: this.startMinute}).day(this.dayIndex).toDate().valueOf());
	}

	get endTime() {
		return new Date(moment({hour: this.endHour, minute: this.endMinute}).day(this.dayIndex).toDate().valueOf());
	}

	get type() {
		if (this.isReceivingTexts) {
			if (this.isReceivingCalls)
				return 'text-and-call';
			return 'text-only';
		} else if (this.isReceivingCalls) {
			return 'call-only';
		} else {
			return 'no-text-or-call';
		}
	}
}

export default WeeklyTimeBlock;