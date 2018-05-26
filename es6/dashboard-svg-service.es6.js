import 'babel-polyfill';
import * as timeBlockModal from './timeblock-modal.es6.js';
import * as timeBlockService from './timeblock-service.es6.js';
import * as confirmModal from './confirm-modal.es6.js';
import * as toolbar from './toolbar.es6.js';
import WeeklySchedule from './weekly-schedule-model.es6.js';
import { toNum, to12Hours, zPad } from './utils.es6.js';
import WeeklyTimeBlock from './weekly-timeblock-model.es6.js';
import * as copyMode from './copy-mode.es6.js';

let mode = '';

export function getMode() {
	return mode;
}

export function setMode(newMode) {
	mode = newMode;
}

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
		.attr('id', 'track-line-top')
		.attr('x1', 0).attr('y1', 0)
		.attr('x2', dimensions.canvasWidth).attr('y2', 0)
		.attr('display', 'none');
	const trackLineBottom = mouseTrackingG.append('line')
		.attr('id', 'track-line-bottom')
		.attr('x1', 0).attr('y1', 0)
		.attr('x2', dimensions.canvasWidth).attr('y2', 0)
		.attr('display', 'none');
	const trackTextBorder = mouseTrackingG.append('rect')
		.attr('id', 'track-text-border-top')
		.attr('class', 'tooltip-border')
		.attr('x', 0).attr('y', 0)
		.attr('width', 0).attr('height', 0)
		.attr('display', 'none');
	const trackText = mouseTrackingG.append('text')
		.attr('id', 'track-text-top')
		.attr('class', 'tooltip-text')
		.attr('x', 0)
		.attr('y', 0)
		.attr('text-anchor', 'middle')
		.attr('display', 'none');
	const trackTextBorderBottom = mouseTrackingG.append('rect')
		.attr('id', 'track-text-border-bottom')
		.attr('class', 'tooltip-border')
		.attr('x', 0).attr('y', 0)
		.attr('width', 0).attr('height', 0)
		.attr('display', 'none');
	const trackTextBottom = mouseTrackingG.append('text')
		.attr('id', 'track-text-bottom')
		.attr('class', 'tooltip-text')
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
		.on('mousedown', emptySpaceMouseDown)
		.on('mousemove', emptySpaceMouseMove)
		.on('mouseup', emptySpaceMouseOut)
		.on('mouseout', emptySpaceMouseOut);

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

export function setDeleteMode(enable = true) {
	mode = enable ? 'delete' : '';
	d3.selectAll('rect.time-block').classed('delete-mode', enable);
}

export function setFillMode(enable = true) {
	mode = enable ? 'fill' : '';

	if (enable) {

		// dim normal time blocks and remove their hover effects
		d3.selectAll('g.day').selectAll('rect.time-block')
			.classed('no-hover', true)
			.transition().duration(1000)
			.style('opacity', 0.2);

		// remove borders on day squares
		d3.selectAll('rect.day').style('opacity', 0.0);

		createEmptyBlocks();

	} else {
		toolbar.clearButtons();

		// show borders on day squares and remove empty blocks
		d3.selectAll('rect.day').style('opacity', 1.0);
		d3.selectAll('rect.time-block-new').remove();

		// undim normal time blocks and enable their hover effects again
		const blockRects = d3.selectAll('rect.time-block');
		blockRects.interrupt();
		blockRects.style('opacity', 0.5).classed('no-hover', false);
	}
}

export function showMessage(message) {
	document.getElementById('messages-to-user').textContent = message;
}

function createEmptyBlocks() {
	const dimensions = getDimensions();
	const emptyBlocksSchedule = timeBlockService.getActiveWeeklySchedule().getEmptyTimeBlocks();

	d3.selectAll('g.day').each(function(day) {

		d3.select(this).selectAll('g.day-square').selectAll('rect.time-block-new')
			.data(emptyBlocksSchedule.daysWithTimeBlocks[day.index].values)
			.enter()
			.append('rect')
			.attr('class', 'time-block time-block-new')
			.attr('x', 0)
			.attr('y', timeBlock => day.scale(timeBlock.startTime))
			.attr('width', dimensions.dayWidth)
			.attr('height', timeBlock => day.scale(timeBlock.endTime) - day.scale(timeBlock.startTime))
			.attr('rx', 8)
			.attr('ry', 8)
			.attr('stroke-dasharray', '10, 5')
			.attr('stroke-dashoffset', '0%')
			.attr('stroke-opacity', 1.0)
			.attr('fill-opacity', 0.0)
			.style('opacity', 1.0)
			.each(function(datum) {
				datum.animate = true;
				animateDashes.call(this, datum);
			})
			.on('mouseover', fillBlockMouseOver)
			.on('mouseout', fillBlockMouseOut)
			.on('click', fillBlockClick);
	});
}

/** Animates dashed border around the svgElement assigned to 'this'.
 * The animation repeats so long as the datum's 'animate' property is truthy. */
function animateDashes(datum) {
	if (datum && datum.animate) {
		d3.select(this)
			.transition()
			.duration(15000)
			.ease(d3.easeLinear)
			.attr('stroke-dashoffset', '100%')
			.transition()
			.duration(15000)
			.ease(d3.easeLinear)
			.attr('stroke-dashoffset', '0%')
			.on('end', function(datum) {
				d3.select(this).attr('stroke-dashoffset', '0%');
				animateDashes.call(this, datum);
			});
	}
}

function createBlockFromNewRect(svgElement) {
	const snapTo = getSnapTo(svgElement);
	const newRectTopY = d3.select('.time-block-new').attr('y');
	const startTime = snapTo.scale.invert(newRectTopY);
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
	toolbar.clearButtons();
	d3.selectAll('.time-block-new').remove();
	d3.select('#track-line-bottom').attr('display', 'none');
	d3.select('#track-text-bottom').attr('display', 'none');
}

/** Binds the weekly data, overriding previous data, then redraws the SVG elements. */
function setWeeklyData(weeklySchedule = timeBlockService.getActiveWeeklySchedule()) {
	if (!(weeklySchedule instanceof WeeklySchedule))
		throw new Error('Invalid argument in SvgService.createSvg');

	// bind day data and create a svg groups for each day column and day square
	const dimensions = getDimensions();
	d3.select('.canvas')
			.selectAll('g.day')
			.data(weeklySchedule.daysWithTimeBlocks, day => day.index)
			.enter()
		.append('g')
			.attr('class', 'day')
			.attr('transform', (day) => `translate(${day.index*dimensions.dayWidth}, 0)`)
		.append('g')
			.attr('class', 'day-square')
			.attr('transform', `translate(0, ${dimensions.marginTop})`);

	// draw time blocks for each day
	d3.selectAll('g.day-square').each(function(day) {

		// y-scale for the current day
		const domainStart = moment().day(day.index).startOf('day').toDate();
		const domainEnd = moment().day(day.index).endOf('day').toDate();
		const yScale = d3.scaleTime()
			.domain([domainStart, domainEnd])
			.range([0, dimensions.dayHeight]);

		// store scale in day square datum for easy access/use
		d3.select(this).each(day => day.scale = yScale);

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
				.each(function(block) { block.rect = this })
				.on('click', timeBlockClicked)
				.call(d3.drag()
					.on('drag', function(timeBlock) {
						if (mode !== '')
							return;

						const schedule = timeBlockService.getActiveWeeklySchedule();
						const newTopY = +d3.select(this).attr('y') + d3.event.dy;
						const [topBoundaryY, bottomBoundaryY] = schedule.findGrowthBoundaries(timeBlock.blockID).map(yScale);
						const newBottomY = +d3.select(this).attr('height') + newTopY;

						// move/resize rect
						if (newTopY < topBoundaryY)
							d3.select(this).attr('y', topBoundaryY);
						else if (newBottomY > bottomBoundaryY)
							d3.select(this).attr('y', bottomBoundaryY - +d3.select(this).attr('height'));
						else
							d3.select(this).attr('y', newTopY);

						// determine positioning/values for top/bottom lines/texts
						const paddingV = 2.5;
						const paddingH = 5;
						const topTime = yScale.invert(newTopY);
						const [topHours12, topMeridiem] = to12Hours(topTime.getHours());
						const bottomTime =yScale.invert(newBottomY);
						const [bottomHours12, bottomMeridiem] = to12Hours(bottomTime.getHours());
						const x = d3.mouse(d3.select('.tracking-empty').node())[0];
						const topLineText = `${zPad(topHours12)}:${zPad(topTime.getMinutes())} ${topMeridiem}`;
						const bottomLineText = `${zPad(bottomHours12)}:${zPad(bottomTime.getMinutes())} ${bottomMeridiem}`;

						// adjust top and bottom tracking lines/texts
						Hover.showTopLine(newTopY, x, newTopY - 10, topLineText);
						Hover.showBottomLine(newBottomY, x, newBottomY + 21, bottomLineText);
					})
					.on('end', function(timeBlock) {
						if (mode !== '')
							return;

						const newTopY = +d3.select(this).attr('y') + d3.event.dy;
						const newBottomY = +d3.select(this).attr('height') + newTopY;
						const newStartTime = yScale.invert(newTopY);
						const newEndTime = yScale.invert(newBottomY);

						let tempModifiedTimeBlock = new WeeklyTimeBlock(timeBlock);
						tempModifiedTimeBlock.startHour = newStartTime.getHours();
						tempModifiedTimeBlock.startMinute = newStartTime.getMinutes();
						tempModifiedTimeBlock.endHour = newEndTime.getHours();
						tempModifiedTimeBlock.endMinute = newEndTime.getMinutes();

						Hover.hideLines();

						const editCanceled = () => d3.select(this)
							.transition()
							.duration(1000)
							.delay(250)
							.ease(d3.easeExp)
							.attr('y', block => yScale(block.startTime));
						setTimeout(() =>
							timeBlockModal.show(tempModifiedTimeBlock, 'edit', setWeeklyData, editCanceled, 0)
						);
					})
				);

		blockRects.each(function(block) {
			if (!(block instanceof WeeklyTimeBlock))
				throw new Error('bleh');

			const blockRect = d3.select(this);

			// determine if start time was changed
			const rectY = blockRect.attr('y');
			const rectStartDate = yScale.invert(rectY);
			const rectStartTime = moment(rectStartDate);
			const isStartSame = rectStartTime.isSame(block.startTime, 'minute');

			// determine if end time was changed
			const rectEndY = toNum(blockRect.attr('y')) + toNum(blockRect.attr('height'));
			const rectEndTime = moment(yScale.invert(rectEndY));
			const isEndSame = rectEndTime.isSame(block.endTime, 'minute');

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
function getSnapTo(svgElement) {
	const [mouseX, mouseY] = d3.mouse(svgElement);

	// determine day of week
	const dimensions = getDimensions();
	const step = dimensions.canvasWidth / 7;
	for (var dayIndex = 0; dayIndex <= 6; dayIndex++) {
		if (step*dayIndex < mouseX && mouseX < step*(dayIndex+1))
			break;
	}
	if (dayIndex > 6)
		throw new Error('Day not found in SvgService.getMouseDay');

	// create scale
	const scale = d3.scaleTime()
		.domain([moment().startOf('day').toDate(), moment().endOf('day').toDate()])
		.range([0, getDimensions().dayHeight]);

	// calculate remaining values
	const mouseTime = moment(scale.invert(mouseY));
	const [hours24, minutes] = [ mouseTime.hours(), mouseTime.minutes() ];
	const [snapToHours24, snapToMinutes] = findClosest30Mins(hours24, minutes);
	const [snapToHours12, meridiem] = to12Hours(snapToHours24);
	const snapToTime = moment().hours(snapToHours24).minutes(snapToMinutes).toDate();
	const snapToY = scale(snapToTime);

	// find the boundaries' time-values for this empty space
	const [topBoundaryTime, bottomBoundaryTime] = timeBlockService.getActiveWeeklySchedule().findEmptyBoundaries(snapToTime, dayIndex);

	return { x: mouseX, y: snapToY, day: dayIndex, hours12: snapToHours12, hours24: snapToHours24, minutes: snapToMinutes, meridiem, topBoundaryTime, bottomBoundaryTime, scale };
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

export function getDimensions() {
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

// function createScale(dayIndex) {
// 	let domainStart, domainEnd;

// 	if (dayIndex !== undefined) {
// 		domainStart = moment().day(dayIndex).startOf('day').toDate();
// 		domainEnd = moment().day(dayIndex).endOf('day').toDate();
// 	} else {
// 		domainStart = moment().startOf('day').toDate();
// 		domainEnd = moment().endOf('day').toDate();
// 	}

// 	return d3.scaleTime()
// 		.domain([domainStart, domainEnd])
// 		.range([0, getDimensions().dayHeight]);
// }

export function getDayScale(dayIndex) {
	let scale;
	d3.selectAll('g.day-square')
		.filter(day => day.index === dayIndex)
		.each(day => scale = day.scale);
	if (scale === undefined)
		throw new Error(`Unable to find scale for day index ${dayIndex}`);

	return scale;
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

class Hover {
	static showTopLine(lineY, textX, textY = lineY, lineText) {
		const paddingV = 2.5;
		const paddingH = 5;

		d3.select('#track-line-top')
			.attr('display', 'inline')
			.attr('y1', lineY).attr('y2', lineY);
		const trackText = d3.select('#track-text-top')
			.attr('display', 'inline')
			.attr('x', textX).attr('y', textY)
			.text(lineText);
		const textBBox = trackText.node().getBBox();
		d3.select('#track-text-border-top')
			.attr('display', 'inline')
			.attr('x', textBBox.x - paddingH)
			.attr('y', textBBox.y - paddingV)
			.attr('width', textBBox.width + paddingH*2)
			.attr('height', textBBox.height + paddingV*2);
	}

	static showBottomLine(lineY, textX, textY = lineY, lineText) {
		const paddingV = 2.5;
		const paddingH = 5;

		d3.select('#track-line-bottom')
			.attr('display', 'inline')
			.attr('y1', lineY).attr('y2', lineY);
		const trackTextBottom = d3.select('#track-text-bottom')
			.attr('display', 'inline')
			.attr('x', textX).attr('y', textY)
			.text(lineText);
		const textBBox = trackTextBottom.node().getBBox();
		d3.select('#track-text-border-bottom')
			.attr('display', 'inline')
			.attr('x', textBBox.x - paddingH)
			.attr('y', textBBox.y - paddingV)
			.attr('width', textBBox.width + paddingH*2)
			.attr('height', textBBox.height + paddingV*2);
	}

	static hideTopLine() {
		d3.select('#track-line-top').attr('display', 'none');
		d3.select('#track-text-top').attr('display', 'none');
		d3.select('#track-text-border-top').attr('display', 'none');
	}

	/** remove mouseover tracking lines and texts */
	static hideBotomLine() {
		d3.select('#track-line-bottom').attr('display', 'none');
		d3.select('#track-text-bottom').attr('display', 'none');
		d3.select('#track-text-border-bottom').attr('display', 'none');
	}

	static hideLines() {
		Hover.hideTopLine();
		Hover.hideBotomLine();
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

		case 'copy':
			if (d3.select('g.day-square rect.time-block.selected').empty()) {
				toolbar.showPasteButtons();
				d3.select(this.parentNode).selectAll('.time-block:not(.selected)')
					.classed('no-hover', true);
				d3.select(this).classed('selected', true);
				showMessage('Select days to paste to');
				copyMode.showDaySelectionMode(timeBlock.dayIndex);
			}
			break;

		// show edit time block modal
		case '':
			timeBlockModal.show(timeBlock, 'edit', setWeeklyData);
	}
}

/** Enables 'creating' mode and Creates a new 30-min time block rect at the location clicked. */
function emptySpaceMouseDown() {
	if (mode !== '')
		return;

	mode = 'creating';

	const dimensions = getDimensions();
	const snapTo = getSnapTo(this);

	// determine the necessary height to make the new rect 30 mins long
	const startTime = snapTo.scale.invert(snapTo.y);
	const thirtyMinAfterStart = moment(startTime).add(30, 'minutes');
	const endTimeY = snapTo.scale(thirtyMinAfterStart.toDate());
	const newRectHeight = endTimeY - snapTo.y;
	d3.select('.underground-canvas').append('rect')
		.attr('class', 'time-block time-block-new')
		.attr('x', dimensions.dayWidth * snapTo.day)
		.attr('y', snapTo.y)
		.attr('rx', 8)
		.attr('ry', 8)
		.attr('width', dimensions.dayWidth)
		.attr('height', newRectHeight);
}

function emptySpaceMouseMove() {
	const snapTo = getSnapTo(this);
	const lineText = `${snapTo.hours12}:${zPad(snapTo.minutes)} ${snapTo.meridiem}`;
	
	if (mode === 'creating') {

		// determine height to snap to for new time block rect
		const newRect = d3.select('.time-block-new');
		let newRectHeight;
		if (snapTo.y - newRect.attr('y') > 1) {
			newRectHeight = snapTo.y - newRect.attr('y');
		} else {
			// determine the necessary height to make the new rect 30 mins long
			const startTime = snapTo.scale.invert(newRect.attr('y'));
			const thirtyMinAfterStart = moment(startTime).add(30, 'minutes');
			const endTimeY = snapTo.scale(thirtyMinAfterStart.toDate());
			newRectHeight = endTimeY - newRect.attr('y');
		}

		newRect.attr('height', newRectHeight);

		// move tracking line/text for the bottom of the new time block rect
		const lineY = toNum(newRect.attr('y')) + toNum(newRect.attr('height'));
		Hover.showBottomLine(lineY, snapTo.x, snapTo.y + 21, lineText);
	}

	// move line/text to mouse pointer and display corresponding time-value
	else if (mode === '') {
		Hover.showTopLine(snapTo.y, snapTo.x, snapTo.y - 10, lineText);
	}
}

/** Create time block from new rect data and show add block modal using the new block. */
// function emptySpaceMouseUp() {
// 	if (mode === 'creating') {
// 		Hover.hideBotomLine();
// 		const newTimeBlock = createBlockFromNewRect(this, scale);
// 		showAddBlockModal(newTimeBlock);
// 	}
// 	mode = '';
// }

/** Create time block from new rect data and show add block modal using the new block. */
function emptySpaceMouseOut() {
	if (mode === 'creating') {
		mode = '';
		const newTimeBlock = createBlockFromNewRect(this);
		showAddBlockModal(newTimeBlock);
	}

	// remove tracking lines and texts
	Hover.hideLines();
}

function fillBlockMouseOver(fillBlock) {
	if (mode === 'fill') {
		// disable animation and show rect fill
		fillBlock.animate = false;
		d3.select(this).interrupt();
		d3.select(this)
			.transition().duration(200)
			.attr('fill-opacity', 0.7);
	}
}

function fillBlockMouseOut(fillBlock) {
	if (mode === 'fill') {
		// enable animation and hide rect fill
		fillBlock.animate = true;
		d3.select(this).interrupt();
		d3.select(this)
			.transition().duration(200)
			.attr('fill-opacity', 0.0)
			.on('end', animateDashes);
	}
}

function fillBlockClick(fillBlock) {
	mode = '';

	// disable animation
	fillBlock.animate = false;

	// remove all other empty time block rects
	const rect = this;
	d3.selectAll('.time-block-new').each(function() {
		if (this !== rect)
			d3.select(this).remove();
	});

	// show add block modal w/clicked empty time block
	timeBlockModal.show(
		fillBlock,
		'add',
		() => { setFillMode(false); setWeeklyData(); },
		() => setFillMode(false)
	);
}