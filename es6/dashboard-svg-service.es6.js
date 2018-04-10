import 'babel-polyfill';
import * as timeBlockModal from './timeblock-modal.es6.js';
import * as timeBlockService from './timeblock-service.es6.js';
import * as confirmModal from './confirm-modal.es6.js';
import * as toolbar from './toolbar.es6.js';
import WeeklySchedule from './weekly-schedule-model.es6.js';
import { toNum, to12Hours, zPad } from './utils.es6.js';
import WeeklyTimeBlock from './weekly-timeblock-model.es6.js';

let mode = '';

export function createSvg(weeklySchedule) {
	const dimensions = getDimensions();

	// save a reference to schedule
	timeBlockService.setActiveWeeklySchedule(weeklySchedule);

	const svg = d3.select('#svg')
		.attr('width', dimensions.svgWidth)
		.attr('height', dimensions.svgHeight);

	// svg group representing the main drawing area
	const canvas = svg.append('g')
		.attr('class', 'canvas')
		.attr('transform', `translate(${dimensions.marginLeft}, 0)`);

	// scale for axes
	const domainStart = moment().startOf('day').toDate();
	const domainEnd = moment().endOf('day').add(1, 'minutes').toDate();
	const scale = d3.scaleTime()
		.domain([domainStart, domainEnd])
		.range([0, dimensions.dayHeight]);

	// left axis
	const leftAxis = d3.axisLeft(scale).ticks(5, "%I %p");
	svg.append('g')
		.attr('class', 'axis')
		.attr('transform', `translate(${dimensions.marginLeft}, ${dimensions.marginTop-0.5})`)
		.call(leftAxis);

	// right axis
	const rightAxis = d3.axisRight(scale).ticks(5, "%I %p");
	svg.append('g')
		.attr('class', 'axis')
		.attr('transform', `translate(${dimensions.svgWidth - dimensions.marginRight}, ${dimensions.marginTop-0.5})`)
		.call(rightAxis);

	// background rect for empty spaces
	canvas.append('rect')
		.attr('class', 'background')
		.attr('x', 0)
		.attr('y', dimensions.marginTop)
		.attr('width', dimensions.canvasWidth)
		.attr('height', dimensions.dayHeight);

	// group to hold elements for empty space mouseover effects
	const undergroundCanvas = canvas.append('g')
		.attr('class', 'underground-canvas')
		.attr('transform', `translate(0, ${dimensions.marginTop})`);
	const mouseTrackingG = canvas.append('g')
		.attr('class', 'tracking-empty')
		.attr('transform', `translate(0, ${dimensions.marginTop})`);

	// horizontal mouseover line and text for empty spaces
	const trackLine = mouseTrackingG.append('line')
		.attr('x1', 0).attr('y1', 0)
		.attr('x2', dimensions.canvasWidth).attr('y2', 0)
		.attr('display', 'none');
	const trackLineBottom = mouseTrackingG.append('line')
		.attr('class', 'bottom-line')
		.attr('x1', 0).attr('y1', 0)
		.attr('x2', dimensions.canvasWidth).attr('y2', 0)
		.attr('display', 'none');
	const trackText = mouseTrackingG.append('text')
		.attr('x', 0)
		.attr('y', 0)
		.attr('text-anchor', 'middle')
		.attr('display', 'none');
	const trackTextBottom = mouseTrackingG.append('text')
		.attr('class', 'bottom-text')
		.attr('x', 0)
		.attr('y', 0)
		.attr('text-anchor', 'middle')
		.attr('display', 'none');

	// invisible surface to handle mouseover effects in empty spaces
	mouseTrackingG.append('rect')
		.attr('x', 0)
		.attr('y', 0)
		.attr('width', dimensions.canvasWidth)
		.attr('height', dimensions.dayHeight)
		.attr('fill-opacity', 0.0)
		.attr('stroke-opacity', 0.0)
		.on('mouseover', () => {
			trackLine.attr('display', 'inline');
			trackText.attr('display', 'inline');
		})
		.on('mousedown', function(...args) {
			mode = 'creating';

			// determine the necessary height to make the new rect 30 mins long
			const snapTo = getSnapTo(this, scale);
			const startTime = scale.invert(snapTo.y);
			const thirtyMinAfterStart = moment(startTime).add(30, 'minutes');
			const endTimeY = scale(thirtyMinAfterStart.toDate());
			const newRectHeight = endTimeY - snapTo.y;
			undergroundCanvas.append('rect')
				.attr('class', 'time-block time-block-new')
				.attr('x', dimensions.dayWidth * snapTo.day)
				.attr('y', snapTo.y)
				.attr('rx', 8)
				.attr('ry', 8)
				.attr('width', dimensions.dayWidth)
				.attr('height', newRectHeight);
		})
		.on('mousemove', function() {

			if (mode === 'creating') {

				// determine height to snap to for new time block rect
				const snapTo = getSnapTo(this, scale);
				const newRect = d3.select('.time-block-new');
				let newRectHeight;
				if (snapTo.y - newRect.attr('y') > 1) {
					newRectHeight = snapTo.y - newRect.attr('y');
				} else {
					// determine the necessary height to make the new rect 30 mins long
					const startTime = scale.invert(newRect.attr('y'));
					const thirtyMinAfterStart = moment(startTime).add(30, 'minutes');
					const endTimeY = scale(thirtyMinAfterStart.toDate());
					newRectHeight = endTimeY - newRect.attr('y');
				}

				newRect.attr('height', newRectHeight);

				// move tracking line/text for the buttom of the new time block rect
				const lineY = toNum(newRect.attr('y')) + toNum(newRect.attr('height'));
				trackLineBottom
					.attr('display', 'inline')
					.attr('y1', lineY).attr('y2', lineY);
				trackTextBottom
					.attr('display', 'inline')
					.attr('x', snapTo.x).attr('y', snapTo.y + 18);
				trackTextBottom.text(`${snapTo.hours12}:${zPad(snapTo.minutes)} ${snapTo.meridiem}`);
			}

			else {
				// determine x/y values to snap the line and text to
				const snapTo = getSnapTo(this, scale);
				const isTextTooHigh = snapTo.hours12 < 3 && snapTo.meridiem === 'am';
				const textX = isTextTooHigh ? snapTo.x - 10 : snapTo.x;
				const textY = isTextTooHigh ? snapTo.y + 20 : snapTo.y - 10;

				// move line/text to mouse pointer and display corresponding time-value
				trackLine.attr('y1', snapTo.y).attr('y2', snapTo.y);
				trackText.attr('x', textX).attr('y', textY);
				trackText.text(`${snapTo.hours12}:${zPad(snapTo.minutes)} ${snapTo.meridiem}`);
			}
		})
		.on('mouseup', function() {
			mode = '';

			if (mode === 'creating') {
				// remove tracking lines and texts
				trackLineBottom.attr('display', 'none');
				trackTextBottom.attr('display', 'none');

				// create basic new time block from new rect data
				const newTimeBlock = createBlockFromNewRect(this, scale);

				// show add time block modal
				showAddBlockModal(newTimeBlock);
			}
		})
		.on('mouseout', function() {
			if (mode === 'creating') {
				mode = '';
				const newTimeBlock = createBlockFromNewRect(this, scale);
				showAddBlockModal(newTimeBlock);
			}

			// remove tracking lines and texts
			trackLine.attr('display', 'none');
			trackText.attr('display', 'none');
			trackLineBottom.attr('display', 'none');
			trackTextBottom.attr('display', 'none');
		});

	// bind data and draw day squares and time blocks for each day of the week
	setWeeklyData(weeklySchedule);

	// create titles for each day
	canvas.selectAll('g.day').append('text')
		.attr('class', 'day-title')
		.attr('x', dimensions.dayWidth / 2)
		.attr('y', 20)
		.attr('text-anchor', 'middle')
		.text(day => day.key);

	// create border for each day square
	canvas.selectAll('g.day-square').append('rect')
		.attr('class', 'day')
		.attr('x', 0)
		.attr('y', 0)
		.attr('width', dimensions.dayWidth)
		.attr('height', dimensions.dayHeight);
}

export function setDeleteMode(value = true) {
	mode = value ? 'delete' : '';
	d3.selectAll('rect.time-block').classed('delete-mode', value);
}

function createBlockFromNewRect(svgElement, scale) {
	const snapTo = getSnapTo(svgElement, scale);
	const newRectTopY = d3.select('.time-block-new').attr('y');
	const startTime = scale.invert(newRectTopY);
	return new WeeklyTimeBlock({
		dayOfWeek: WeeklySchedule.days[snapTo.day],
		startHour: startTime.getHours(),
		startMinute: startTime.getMinutes(),
		endHour: snapTo.hours24,
		endMinute: snapTo.minutes
	});
}

function showAddBlockModal(newTimeBlock) {
	timeBlockModal.show(
		newTimeBlock,
		'add',
		() => { cancelBlockCreation(); setWeeklyData(); },
		cancelBlockCreation
	);
}

function cancelBlockCreation() {
	d3.select('.time-block-new').remove();
	d3.select('.tracking-empty bottom-line').attr('display', 'none');
	d3.select('.tracking-empty bottom-text').attr('display', 'none');
}

/** Binds the weekly data, overriding previous data, then redraws the SVG elements. */
function setWeeklyData(weeklySchedule = timeBlockService.getActiveWeeklySchedule()) {
	if (!(weeklySchedule instanceof WeeklySchedule))
		throw new Error('Invalid argument in SvgService.createSvg');

	// bind day data and create a svg groups for each day column and day square
	const dimensions = getDimensions();
	d3.select('.canvas')
			.selectAll('g.day')
			.data(weeklySchedule.daysWithTimeBlocks)
			.enter()
		.append('g')
			.attr('class', 'day')
			.attr('transform', (day, index) => `translate(${index*dimensions.dayWidth}, 0)`)
		.append('g')
			.attr('class', 'day-square')
			.attr('transform', `translate(0, ${dimensions.marginTop})`);

	// draw time blocks for each day
	d3.selectAll('g.day-square').each(function(day, dayIndex) {

		// y-scale for the current day
		const domainStart = moment().day(dayIndex).startOf('day').toDate();
		const domainEnd = moment().day(dayIndex).endOf('day').toDate();
		const yScale = d3.scaleTime()
			.domain([domainStart, domainEnd])
			.range([0, dimensions.dayHeight]);

		// create time block rects
		const blockRects = d3.select(this) // this is the <g> day-square element
			.selectAll('rect.time-block')
			.data(day => day.values, block => block.blockID); // values are time blocks

		blockRects.enter()
			.append('rect')
				.attr('class', block => 'time-block ' + timeBlockColorClass(block))
				.attr('x', 0)
				.attr('y', block => yScale(block.startTime))
				.attr('rx', 8)
				.attr('ry', 8)
				.attr('width', dimensions.dayWidth)
				.attr('height', block => yScale(block.endTime) - yScale(block.startTime))
				.on('click', timeBlockClicked);

		blockRects.each(function(block) {
			if (!(block instanceof WeeklyTimeBlock))
				throw new Error('bleh');

			const blockRect = d3.select(this);

			// determine if start time was changed
			const rectY = blockRect.attr('y');
			const rectStartDate = yScale.invert(rectY);
			const rectStartTime = moment(rectStartDate);
			const blockStartTime = moment(block.startTime);
			const isStartSame = rectStartTime.isSame(blockStartTime, 'minute');

			// determine if end time was changed
			const rectEndY = toNum(blockRect.attr('y')) + toNum(blockRect.attr('height'));
			const rectEndTime = moment(yScale.invert(rectEndY));
			const blockEndTime = moment(block.endTime);
			const isEndSame = rectEndTime.isSame(blockEndTime, 'minute');

			if (!isStartSame) {
				blockRect.transition().duration(1000).ease(d3.easeExp)
					.attr('y', block => yScale(block.startTime))
					.attr('height', block => yScale(block.endTime) - yScale(block.startTime));
			}

			if (!isEndSame && isStartSame) {
				blockRect.transition().duration(1000).ease(d3.easeExp)
					.attr('height', block => yScale(block.endTime) - yScale(block.startTime));
			}

			// check if type of time block has changed (no text/calls, text/call only, both texts/calls)
			if (!blockRect.classed(block.type)) {
				WeeklyTimeBlock.blockTypes.forEach(type => blockRect.classed(type, false));
				blockRect.classed(block.type, true);
			}
		});

		blockRects.exit()
			.transition()
			.delay(200)
			.duration(1250)
			.style('opacity', 0.0)
			.remove();
	});
}

/** Determine the coordinates, x-scale day value, and y-scale time-value of the location to snap to */
function getSnapTo(svgElement, scale) {
	const [mouseX, mouseY] = d3.mouse(svgElement);
	const mouseTime = moment(scale.invert(mouseY));
	const [hours24, minutes] = [ mouseTime.hours(), mouseTime.minutes() ];
	const [snapToHours24, snapToMinutes] = findClosest30Mins(hours24, minutes);
	const [snapToHours12, meridiem] = to12Hours(snapToHours24);
	const snapToTime = moment().hours(snapToHours24).minutes(snapToMinutes).toDate();
	const snapToY = scale(snapToTime);

	// determine day of week
	const dimensions = getDimensions();
	const step = dimensions.canvasWidth / 7;
	for (var dayIndex = 0; dayIndex <= 6; dayIndex++) {
		if (step*dayIndex < mouseX && mouseX < step*(dayIndex+1))
			break;
	}
	if (dayIndex > 6)
		throw new Error('Day not found in SvgService.getMouseDay');

	// find the boundaries' time-values for this empty space
	const [topBoundaryTime, bottomBoundaryTime] = timeBlockService.findBlockBoundaries(snapToTime, dayIndex);

	return { x: mouseX, y: snapToY, day: dayIndex, hours12: snapToHours12, hours24: snapToHours24, minutes: snapToMinutes, meridiem, topBoundaryTime, bottomBoundaryTime };
}

function findClosest30Mins(hours24, minutes) {
	let resultHours = hours24;
	let resultMinutes = 0;

	if (minutes >= 15 && minutes < 45)
		resultMinutes = 30;
	else if (minutes >= 45)
		resultHours++;

	return [resultHours, resultMinutes];
};

function getDimensions() {
	const colPadding = 15;
	const marginTop = 30;
	const marginLeft = 45;
	const marginRight= 45;
	const marginBottom = 30;

	const clientWidth = window.innerWidth;
	const svgWidth = clientWidth - colPadding*2;
	const canvasWidth = svgWidth - marginLeft - marginRight;
	const dayWidth = canvasWidth / 7;

	const clientHeight = window.innerHeight;
	const dayHeight = dayWidth;
	const svgHeight = dayHeight + marginTop + marginBottom;
	const canvasHeight = svgHeight - marginBottom;

	return {
		colPadding,
		marginTop,
		marginLeft,
		marginRight,
		marginBottom,
		clientWidth,
		clientHeight,
		svgWidth,
		canvasWidth,
		dayWidth,
		svgHeight,
		canvasHeight,
		dayHeight,
	}
}

function getSquareForDay(dayIndex) {
	let targetDaySquare;
	d3.selectAll('g.day-square').each(function(day, index) {
		if (index === dayIndex) {
			targetDaySquare = d3.select(this);
		}
	});
	return targetDaySquare;
}

function timeBlockColorClass(timeBlock) {
	if (timeBlock.isReceivingTexts) {
		return timeBlock.isReceivingCalls ? 'text-and-call' : 'text-only';
	} else {
		return timeBlock.isReceivingCalls ? 'call-only' : 'no-text-or-call';
	}
}

// --------------------------- Event Handlers --------------------------- \\

function timeBlockClicked(timeBlock) {
	switch (mode) {

		// show confirmation modal
		case 'delete':
			const deleteBlock = () => {
				const newSchedule = timeBlockService.remove(timeBlock);
				setWeeklyData(newSchedule);
				setDeleteMode(false);
				toolbar.clearButtons();
			};
			const cancelDelete = () => {
				setDeleteMode(false);
				toolbar.clearButtons();
			}

			confirmModal.show(deleteBlock, cancelDelete);
			break;

		// show edit time block modal
		default:
			timeBlockModal.show(timeBlock, 'edit', setWeeklyData);
	}
}