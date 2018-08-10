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

		this.blockID = blockID ? +blockID : undefined;
		this.comment = comment || undefined;
		this.dayOfWeek = dayOfWeek;
		this.startHour = +startHour;
		this.startMinute = +startMinute;
		this.endHour = +endHour;
		this.endMinute = +endMinute;
		this.isReceivingTexts = isReceivingTexts;
		this.isReceivingCalls = isReceivingCalls;
		this.isTextRepeating = isTextRepeating;
		this.isCallRepeating = isCallRepeating;
		this.repeatTextDuration = repeatTextDuration;
		this.repeatCallDuration = repeatCallDuration;
	}

	setTime(startTime, endTime) {
		if (!(startTime instanceof Date) || !(endTime instanceof Date))
			throw new Error('Invalid moment passed to WeeklyTimeBlock.setTime');
		this.startTime = startTime;
		this.endTime = endTime;
		return this;
	}

	setMoments(startMoment, endMoment) {
		if (!moment.isMoment(startMoment) || !moment.isMoment(endMoment))
			throw new Error('Invalid moment passed to WeeklyTimeBlock.setMoments');
		this.startMoment = startMoment;
		this.endMoment = endMoment;
		return this;
	}

	copy(dayIndex) {
		const blockCopy = new WeeklyTimeBlock(this);

		blockCopy.blockID = undefined;
		if (dayIndex !== undefined)
			blockCopy.dayIndex = +dayIndex;

		return blockCopy;
	}

	clone() {
		return new WeeklyTimeBlock(this);
	}

	equals(otherWeeklyTimeBlock) {
		console.log('equals entered');
		if (this.isReceivingTexts === otherWeeklyTimeBlock.isReceivingTexts) {
			console.log('pass 1');
		}
		if (this.isReceivingCalls === otherWeeklyTimeBlock.isReceivingCalls) {
			console.log('pass 2');
		}
		if (this.isTextRepeating === otherWeeklyTimeBlock.isTextRepeating) {
			console.log('pass 3');
		}
		if (this.isCallRepeating === otherWeeklyTimeBlock.isCallRepeating) {
			console.log('pass 4');
		}
		if (this.repeatTextDuration === otherWeeklyTimeBlock.repeatTextDuration) {
			console.log('pass 5');
		}
		if (this.repeatCallDuration === otherWeeklyTimeBlock.repeatCallDuration) {
			console.log('pass 6');
		}

		if (
			this.isReceivingTexts === otherWeeklyTimeBlock.isReceivingTexts &&
			this.isReceivingCalls === otherWeeklyTimeBlock.isReceivingCalls &&
			this.isTextRepeating === otherWeeklyTimeBlock.isTextRepeating &&
			this.isCallRepeating === otherWeeklyTimeBlock.isCallRepeating
		) {
			const isTextRepeatDurationOkay = !this.isTextRepeating || this.repeatTextDuration === otherWeeklyTimeBlock.repeatTextDuration;
			const isCallRepeatDurationOkay = !this.isCallRepeating || this.repeatCallDuration === otherWeeklyTimeBlock.repeatCallDuration;
			if (!isTextRepeatDurationOkay)
				return false;
			if (!isCallRepeatDurationOkay)
				return false;

			return true;
		}

		return false;
	}

	get dayIndex() {
		return WeeklyTimeBlock.days.indexOf(this.dayOfWeek);
	}

	set dayIndex(dayIndex) {
		this.dayOfWeek = WeeklyTimeBlock.days[+dayIndex];
	}

	get duration() {
		return moment.duration(this.endMoment.diff(this.startMoment));
	}

	get startTime() {
		return new Date(this.startMoment.toDate().valueOf());
	}

	get endTime() {
		return new Date(this.endMoment.toDate().valueOf());
	}

	get midTime() {
		return new Date(this.midMoment.toDate().valueOf());
	}

	get startMoment() {
		return moment({hour: this.startHour, minute: this.startMinute}).day(this.dayIndex);
	}

	get endMoment() {
		return moment({hour: this.endHour, minute: this.endMinute}).day(this.dayIndex);
	}

	get midMoment() {
		const blockDurationMins = this.endMoment.diff(this.startMoment, 'minutes');
		return this.startMoment.add(blockDurationMins / 2, 'minutes');
	}

	set startMoment(startMoment) {
		if (!moment.isMoment(startMoment))
			throw new Error('Invalid moment passed to WeeklyTimeBlock.startMoment');
		this.startHour = startMoment.hour();
		this.startMinute = startMoment.minute();
	}

	set endMoment(endMoment) {
		if (!moment.isMoment(endMoment))
			throw new Error('Invalid moment passed to WeeklyTimeBlock.endMoment');
		this.endHour = endMoment.hour();
		this.endMinute = endMoment.minute();
	}

	set startTime(startTime) {
		if (!(startTime instanceof Date))
			throw new Error('Invalid moment passed to WeeklyTimeBlock.startTime');
		this.startHour = startTime.getHours();
		this.startMinute = startTime.getMinutes();
	}

	set endTime(endTime) {
		if (!(endTime instanceof Date))
			throw new Error('Invalid moment passed to WeeklyTimeBlock.endTime');
		this.endHour = endTime.getHours();
		this.endMinute = endTime.getMinutes();
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