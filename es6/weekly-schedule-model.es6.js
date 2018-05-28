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
				daysWithTimeBlocks = d3.nest()
					.key(rawBlock => rawBlock.dayOfWeek)
					.entries(rawTimeBlocks);
				daysWithTimeBlocks.forEach((day, index) => day.index = index);
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

		const dayIndex = weeklyTimeBlock.dayIndex;

		this.daysWithTimeBlocks[dayIndex].values.push(weeklyTimeBlock);
		this.daysWithTimeBlocks[dayIndex].values.sort(comparator);

		return weeklyTimeBlock;
	}

	editBlock(weeklyTimeBlock) {
		if (!(weeklyTimeBlock instanceof WeeklyTimeBlock))
			throw new Error('Invalid time block given to WeeklySchedule.editBlock');

		const dayIndex = weeklyTimeBlock.dayIndex;
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

	/** Copies the given time block to each day indicated by the dayIndexesAndOverwrites argument,
	 * which is an array of objects. Each object indicates a day index to copy the block to w/the
	 * 'index' property.  The objects also indcate whether or not to overwrite any existing time
	 * blocks for that day where there is overlap using the 'overwrite' property. An object is
	 * returned w/three array properties named 'createdBlocks', 'updatedBlocks', and 'deletedBlocks'.
	 * Each array contains blocks that were created, updated, and deleted during the copying process. */
	copyBlock(timeBlock, dayIndexesAndOverwrites) {
		const createdBlocks = [];
		const updatedBlocks = [];
		const deletedBlocks = [];

		// copy time block to each day of the week matching the given day indexes
		dayIndexesAndOverwrites.forEach(dayIndexAndOverwrite => {
			let addCopyBlock = true;
			const dayIndex = dayIndexAndOverwrite.index;
			const overwrite = dayIndexAndOverwrite.overwrite;
			const day = this.daysWithTimeBlocks[dayIndex];
			const copyBlock = timeBlock.copy(dayIndex);

			// adjust time blocks and copy block for the day as needed
			for (let blockIndex = day.values.length-1; blockIndex >= 0; blockIndex--) {
				const currentBlock = day.values[blockIndex];

				// copy block completely encompasses current block
				if (
					(
						copyBlock.startMoment.isBefore(currentBlock.startMoment, 'minute') ||
						copyBlock.startMoment.isSame(currentBlock.startMoment, 'minute')
					) &&
					(
						copyBlock.endMoment.isAfter(currentBlock.endMoment, 'minute') ||
						copyBlock.endMoment.isSame(currentBlock.endMoment, 'minute')
					)
				) {
					if (overwrite) {
						// delete current block
						deletedBlocks.push(this.daysWithTimeBlocks[dayIndex].values.splice(blockIndex, 1).shift());
					} else {
						// create a new block from current block end time to copy block end time (or don't, if they're the same)
						if (!currentBlock.endMoment.isSame(copyBlock.endMoment, 'minute')) {
							const newBlock = new WeeklyTimeBlock(copyBlock);
							newBlock.blockID = undefined;
							newBlock.startMoment = currentBlock.endMoment;
							newBlock.endMoment = copyBlock.endMoment;
							createdBlocks.push(newBlock);
						}

						// move copy block end time to current block start time
						copyBlock.endMoment = currentBlock.startMoment;
					}
				}

				// copy block overlaps beginning section of current block
				else if (
					(
						copyBlock.startMoment.isBefore(currentBlock.startMoment, 'minute') ||
						copyBlock.startMoment.isSame(currentBlock.startMoment, 'minute')
					) &&
					copyBlock.endMoment.isAfter(currentBlock.startMoment, 'minute') &&
					copyBlock.endMoment.isBefore(currentBlock.endMoment, 'minute')
				) {
					if (overwrite) {
						// move current block start time to copy block end time (or delete current block if doing so would make it's start time >= it's end time)
						if (!copyBlock.endMoment.isSame(currentBlock.endMoment, 'minute') && !copyBlock.endMoment.isAfter(currentBlock.endMoment, 'minute')) {
							currentBlock.startMoment = copyBlock.endMoment;
							updatedBlocks.push(currentBlock);
						} else {
							deletedBlocks.push(this.daysWithTimeBlocks[dayIndex].values.splice(blockIndex, 1).shift());
						}
					} else {
						// move copy block end time to current block start time
						copyBlock.endMoment = currentBlock.startMoment;
					}
				}

				// copy block overlaps middle section of current block
				else if (
					copyBlock.startMoment.isAfter(currentBlock.startMoment, 'minute') &&
					copyBlock.startMoment.isBefore(currentBlock.endMoment, 'minute') &&
					copyBlock.endMoment.isBefore(currentBlock.endMoment, 'minute')
				) {
					if (overwrite) {
						// create a new block from copy block end time to current block end time
						const newBlock = currentBlock.copy();
						newBlock.startMoment = copyBlock.endMoment;
						newBlock.endMoment = currentBlock.endMoment;
						createdBlocks.push(newBlock);

						// move current block end time to copy block start time
						currentBlock.endMoment = copyBlock.startMoment;
						updatedBlocks.push(currentBlock);
					} else {
						// delete copy block (this makes single-block copy not occur at all)
						addCopyBlock = false;
					}

					// no more time blocks need to be checked for overlap for the day - this would be the last one
					break;
				}

				// copy block overlaps end section of current block
				else if (
					copyBlock.startMoment.isAfter(currentBlock.startMoment, 'minute') &&
					copyBlock.startMoment.isBefore(currentBlock.endMoment, 'minute') &&
					(
						copyBlock.endMoment.isAfter(currentBlock.endMoment, 'minute') ||
						copyBlock.endMoment.isSame(currentBlock.endMoment, 'minute')
					)
				) {
					if (overwrite) {
						// move current block end time to copy block start time
						currentBlock.endMoment = copyBlock.startMoment;
						updatedBlocks.push(currentBlock);
					} else {
						// move copy block start time to current block end time
						copyBlock.startMoment = currentBlock.endMoment;
					}

					// no more time blocks need to be checked for overlap for the day - this would be the last one
					break;
				}
			}

			addCopyBlock = addCopyBlock && !copyBlock.startMoment.isSame(copyBlock.endMoment, 'minute');

			if (addCopyBlock) {
				createdBlocks.push(copyBlock);
				createdBlocks.forEach(block => this.daysWithTimeBlocks[dayIndex].values.push(block));
				this.daysWithTimeBlocks[dayIndex].values.sort(comparator);
			} else {
				createdBlocks.length = 0;
			}
		});

		return { createdBlocks, updatedBlocks, deletedBlocks };
	}

	/** Given a time range, searches the day of the time range for
	 * any conflicting (i.e. overlapping) time blocks.  If any are
	 * found, they are returned. */
	getConflictingBlocks(startTime, endTime) {
		const conflictBlocks = [];
		const startMoment = moment(startTime);
		const endMoment = moment(endTime);
		const day = this.daysWithTimeBlocks[startMoment.day()];

		day.values.forEach((timeBlock, blockIndex) => {
			if (
				timeBlock.startMoment.isBefore(endMoment, 'minute') &&
				startMoment.isBefore(timeBlock.endMoment, 'minute')
			) {
				conflictBlocks.push(timeBlock);
			}
		});

		return conflictBlocks;
	}

	/** Returns top & bottom boundaries (as moments) for the time block with the given ID.
	 * These boundaries indicate the extent to which the time block can grow
	 * before running either into another time block, or running off the day. */
	findGrowthBoundaries(blockID) {
		const [dayIndex, blockIndex] = getDayAndBlockIndexes.call(this, blockID);
		const timeBlocks = this.daysWithTimeBlocks[dayIndex].values;

		let topBoundaryTime = moment().day(dayIndex).startOf('day');
		let bottomBoundaryTime = moment().day(dayIndex).endOf('day');
		if (blockIndex > 0)
			topBoundaryTime = timeBlocks[blockIndex-1].endMoment;
		if (blockIndex < timeBlocks.length-1)
			bottomBoundaryTime = timeBlocks[blockIndex+1].startMoment;

		return [topBoundaryTime, bottomBoundaryTime];
	}

	/** Given a time that does not lie within any time block, this will return
	 * the upper and lower boundary times (as moments) of this empty space for the day.
	 * The upper and lower boundaries will either be the beginning or end of the day,
	 * or the end or beginning of an adjacent block, respectively. */
	findEmptyBoundaries(time, dayIndex = time.getDay()) {
		const day = this.daysWithTimeBlocks[dayIndex];
		let topBoundary;
		let bottomBoundary;
		time = moment(time).day(dayIndex);

		for (let i = 0; i < day.values.length; i++) {
			const block = day.values[i];

			// target time is before any blocks
			if (!topBoundary && block.startMoment.isAfter(time, 'minute')) {
				topBoundary = moment().day(dayIndex).startOf('day');
				bottomBoundary = block.startMoment;
				break;
			}

			// target time is after the last block
			else if (!bottomBoundary && i === day.values.length-1) {
				topBoundary = block.endMoment;
				bottomBoundary = moment().day(dayIndex).endOf('day');
				break;
			}

			// target time may be in between this block and the next block
			else {
				const nextBlock = day.values[i+1];
				if (time.isAfter(block.endTime, 'minute') && time.isBefore(nextBlock.startTime, 'minute')) {
					topBoundary = block.endMoment;
					bottomBoundary = nextBlock.startMoment;
					break;
				}
			}
		}

		return [topBoundary, bottomBoundary];
	}

	/** Returns a special WeeklySchedule object containing only empty time blocks, i.e. a
	 * WeeklyTimeBlock object for each block of time for which no calls or texts are being received.
	 * The blocks in the returned schedule represent the times between normal text/call blocks. */
	getEmptyTimeBlocks() {
		const daysWithEmptyBlocks = WeeklySchedule.days.map(day => ({ key: day, values: [] }));

		// iterate through each day
		for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
			const startOfDay = moment().day(dayIndex).startOf('day');
			const endOfDay = moment().day(dayIndex).endOf('day');
			const blocks = this.daysWithTimeBlocks[dayIndex].values;

			// the entire day is empty
			if (blocks.length == 0) {
				daysWithEmptyBlocks[dayIndex].values.push(new WeeklyTimeBlock({
					dayOfWeek: WeeklySchedule.days[dayIndex],
					startHour: startOfDay.hour(),
					startMinute: startOfDay.minute(),
					endHour: endOfDay.hour(),
					endMinute: endOfDay.minute()
				}));
			}

			// iterate through each time block of each day
			for (let blockIndex = 0; blockIndex < blocks.length; blockIndex++) {
				const currentBlock = blocks[blockIndex];

				// there is an empty space between the start of the day and the first time block
				if (blockIndex === 0 && currentBlock.startMoment.isAfter(startOfDay, 'minute')) {
					daysWithEmptyBlocks[dayIndex].values.push(new WeeklyTimeBlock({
						dayOfWeek: WeeklySchedule.days[dayIndex],
						startHour: startOfDay.hour(),
						startMinute: startOfDay.minute(),
						endHour: currentBlock.startHour,
						endMinute: currentBlock.startMinute
					}))
				}

				// current block isn't the last for the day
				if (blockIndex !== blocks.length-1) {
					const nextBlock = blocks[blockIndex+1];

					// there is an empty space between the current and next blocks
					if (!nextBlock.startMoment.isSame(currentBlock.endMoment, 'minute')) {
						daysWithEmptyBlocks[dayIndex].values.push(new WeeklyTimeBlock({
							dayOfWeek: WeeklySchedule.days[dayIndex],
							startHour: currentBlock.endHour,
							startMinute: currentBlock.endMinute,
							endHour: nextBlock.startHour,
							endMinute: nextBlock.startMinute
						}));
					}
				}

				// there is an empty space between the last block and the end of the day
				else if (currentBlock.endMoment.isBefore(endOfDay, 'minute')) {
					daysWithEmptyBlocks[dayIndex].values.push(new WeeklyTimeBlock({
						dayOfWeek: WeeklySchedule.days[dayIndex],
						startHour: currentBlock.endHour,
						startMinute: currentBlock.endMinute,
						endHour: endOfDay.hour(),
						endMinute: endOfDay.minute()
					}));
				}
			}
		}

		return new WeeklySchedule(daysWithEmptyBlocks);
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
		return 1;
	}

	else if (blockA.startHour === blockB.startHour && blockA.startMinute === blockB.startMinute) {
		return 0;
	}

	else {
		return -1;
	}
}

export default WeeklySchedule;