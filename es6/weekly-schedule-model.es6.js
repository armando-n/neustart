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
			const scheduleToCopy = rawTimeBlocks;
			daysWithTimeBlocks = scheduleToCopy.daysWithTimeBlocks
				.map(day => ({
					index: day.index,
					key: day.key,
					scale: day.scale,
					values: day.values.map(block => new WeeklyTimeBlock(block))
				})
			);
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

			// rawTimeBlocks actually is an array of raw time blocks
			else {
				rawTimeBlocks = rawTimeBlocks.map(validateBlock);

				// group time blocks by day of week
				daysWithTimeBlocks = d3.nest()
					.key(rawBlock => rawBlock.dayOfWeek)
					.entries(rawTimeBlocks);
			}

		}

		else {
			throw new Error('Invalid argument in WeeklySchedule constructor');
		}

		// fill in any missing day objects and add index property to each day
		const allDays = WeeklySchedule.days.map((dayOfWeek, dayIndex) =>
			(daysWithTimeBlocks[0] && daysWithTimeBlocks[0].key === dayOfWeek)
			? Object.assign(daysWithTimeBlocks.shift(), { index: dayIndex })
			: { key: dayOfWeek, values: [], index: dayIndex }
		)

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

		return this.daysWithTimeBlocks[dayIndex].values[blockIndex];
	}

	removeBlock(blockID) {
		const [dayIndex, blockIndex] = getDayAndBlockIndexes.call(this, blockID);
		this.daysWithTimeBlocks[dayIndex].values.splice(blockIndex, 1);
		return this;
	}

	getBlock(blockID) {
		const [dayIndex, blockIndex] = getDayAndBlockIndexes.call(this, blockID);
		return this.daysWithTimeBlocks[dayIndex].values[blockIndex];
	}

	/** Creates and returns a new WeeklyScheduleModel object, to which it
	 * copies the given time block to each day indicated by the dayIndexesAndOverwrites argument,
	 * which is an array of objects. Each object indicates a day index to copy the block to w/the
	 * 'index' property.  The objects also indcate whether or not to overwrite any existing time
	 * blocks for that day where there is overlap using the 'overwrite' property. An object is
	 * returned w/three array properties named 'createdBlocks', 'updatedBlocks', and 'deletedBlocks'.
	 * Each array contains blocks that were created, updated, and deleted during the copying process. */
	copyBlock(timeBlock, dayIndexesAndOverwrites) {
		const newSchedule = new WeeklySchedule(this);
		const createdBlocks = [];
		const updatedBlocks = [];
		const deletedBlocks = [];

		// copy time block to each day of the week matching the given day indexes
		dayIndexesAndOverwrites.forEach(({ index, overwrite }) => {
			const copyResults = this.copyBlockToDay(timeBlock, index, overwrite, newSchedule);

			createdBlocks.push(...copyResults.createdBlocks);
			updatedBlocks.push(...copyResults.updatedBlocks);
			deletedBlocks.push(...copyResults.deletedBlocks);
		});

		return { schedule: newSchedule, createdBlocks, updatedBlocks, deletedBlocks };
	}

	copyBlockToDay(timeBlock, dayIndex, overwrite = true, newSchedule = new WeeklySchedule(this)) {
		let addCopyBlock = true;
		const day = newSchedule.daysWithTimeBlocks[dayIndex];
		const copyBlock = timeBlock.copy(dayIndex);
		const createdBlocks = [];
		const updatedBlocks = [];
		const deletedBlocks = [];

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
					deletedBlocks.push(newSchedule.daysWithTimeBlocks[dayIndex].values.splice(blockIndex, 1).shift());
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
						deletedBlocks.push(newSchedule.daysWithTimeBlocks[dayIndex].values.splice(blockIndex, 1).shift());
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

		// sometimes the origin copy block rect itself doesn't need to be added
		if (addCopyBlock && !copyBlock.startMoment.isSame(copyBlock.endMoment, 'minute'))
			createdBlocks.push(copyBlock);

		// add any block rects we've decided to add while keeping the data sorted
		createdBlocks.forEach(block => newSchedule.daysWithTimeBlocks[dayIndex].values.push(block));
		newSchedule.daysWithTimeBlocks[dayIndex].values.sort(comparator);

		// const mergeResults = mergeIdentAdjacentBlocks([dayIndex]);
		// const mergeResults = mergeIdenticalAdjacentBlocks.call(this, [dayIndex]); // TODO how should this affect the returned crud arrays?
		// updatedBlocks.push(...mergeResults.updatedBlocks);
		// deletedBlocks.push(...mergeResults.deletedBlocks);

		return { schedule: newSchedule, createdBlocks, updatedBlocks, deletedBlocks }
	}

	mergeIdentAdjacentBlocks(dayIndexes) {
		return mergeIdenticalAdjacentBlocks.call(this, dayIndexes);
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
	findGrowthBoundaries(blockOrblockID) {
		let topBoundaryMoment, bottomBoundaryMoment;

		if (blockOrblockID instanceof WeeklyTimeBlock) {
			const { previousBlock, nextBlock } = getAdjacentBlocks.call(this, blockOrblockID);
			topBoundaryMoment = moment().day(blockOrblockID.dayIndex).startOf('day');
			bottomBoundaryMoment = moment().day(blockOrblockID.dayIndex).endOf('day');

			if (previousBlock)
				topBoundaryMoment = previousBlock.endMoment;
			if (nextBlock)
				bottomBoundaryMoment = nextBlock.startMoment;
		}

		else {
			const [ dayIndex, blockIndex ] = getDayAndBlockIndexes.call(this, blockOrblockID);
			const timeBlocks = this.daysWithTimeBlocks[dayIndex].values;
			topBoundaryMoment = moment().day(dayIndex).startOf('day');
			bottomBoundaryMoment = moment().day(dayIndex).endOf('day');

			if (blockIndex > 0)
				topBoundaryMoment = timeBlocks[blockIndex-1].endMoment;
			if (blockIndex < timeBlocks.length-1)
				bottomBoundaryMoment = timeBlocks[blockIndex+1].startMoment;
		}

		return [ topBoundaryMoment, bottomBoundaryMoment ];
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
		throw new Error('Invalid block ID given to WeeklySchedule.getDayAndBlockIndexes');

	return [targetDayIndex, targetBlockIndex];
}

function getAdjacentBlocks(block) {
	let previousBlock, currentBlock, nextBlock;
	const dayOfBlock = this.daysWithTimeBlocks[block.dayIndex];

	// go through each block of the day
	for (let i = 0; i < dayOfBlock.values.length; i++) {
		previousBlock = currentBlock;
		currentBlock = dayOfBlock.values[i];
		nextBlock = dayOfBlock.values[i+1];
		if (currentBlock.startMoment.isSame(block.startMoment, 'minute') && currentBlock.endMoment.isSame(block.endMoment, 'minute'))
			break;

		let isPrevBlockBefore, isNextBlockAfter;
		if (previousBlock)
			isPrevBlockBefore = previousBlock.endMoment.isBefore(block.startMoment, 'minute');
		if (nextBlock)
			isNextBlockAfter = nextBlock.startMoment.isAfter(block.endMoment, 'minute');
		if (currentBlock.startMoment.isAfter(block.endMoment, 'minute')) {
			nextBlock = currentBlock;
			break;
		} else if (currentBlock.endMoment.isBefore(block.startMoment, 'minute') && (!nextBlock || nextBlock.startMoment.isAfter(block.endMoment, 'minute'))) {
			previousBlock = currentBlock;
			break;
		}

		if (previousBlock && nextBlock && isPrevBlockBefore && isNextBlockAfter)
			break;
		else if (nextBlock && isNextBlockAfter)
			break;
		else if (previousBlock && isPrevBlockBefore)
			break;
		else if (currentBlock && !previousBlock && !nextBlock) {
			if (currentBlock.endMoment.isBefore(block.startMoment, 'minute'))
				previousBlock = currentBlock;
			else if (currentBlock.startMoment.isAfter(block.endMoment, 'minute'))
				nextBlock = currentBlock;
		}
	}

	return { previousBlock, nextBlock }
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

function mergeIdenticalAdjacentBlocks(days = [0, 1, 2, 3, 4, 5, 6, 7]) {
	const updatedBlocksObj = {};
	const deletedBlocksObj = {};

	days = days.filter(dayIndex => this.daysWithTimeBlocks[dayIndex].values.length > 1);

	days.forEach(dayIndex => {
		const currentDay = this.daysWithTimeBlocks[dayIndex];

		// iterate through the day's blocks in reverse so that removals do not affect traversal
		for (let i = currentDay.values.length-2; i >= 0; i--) {
			const currentBlock = currentDay.values[i];
			const blockAfterCurrent = currentDay.values[i + 1];
			const areWeeklyTimeBlocks = currentBlock instanceof WeeklyTimeBlock && blockAfterCurrent instanceof WeeklyTimeBlock;
			const areAdjacent = currentBlock.endMoment.isSame(blockAfterCurrent.startMoment, 'minute');
			const areIdentical = currentBlock.equals(blockAfterCurrent);

			if (!areWeeklyTimeBlocks)
				continue;

			if (!areAdjacent)
				continue;

			if (areIdentical) {
				// delete the block after the current block and remove it from the update object if present
				currentDay.values.splice(i + 1, 1);
				deletedBlocksObj[blockAfterCurrent.blockID] = blockAfterCurrent;
				if (updatedBlocksObj[blockAfterCurrent.blockID])
					updatedBlocksObj[blockAfterCurrent.blockID] = false;

				// update the current block so that it covers the space left by the block after it
				currentBlock.endMoment = blockAfterCurrent.endMoment;
				updatedBlocksObj[currentBlock.blockID] = currentBlock;
			}
		}
	});

	const updatedBlocks = Object.values(updatedBlocksObj).filter(value => value instanceof WeeklyTimeBlock);
	const deletedBlocks = Object.values(deletedBlocksObj);

	return { updatedBlocks, deletedBlocks };
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