import 'babel-polyfill';
import * as timeBlockModal from './timeblock-modal.es6.js';
import * as timeBlockService from './timeblock-service.es6.js';
import * as confirmModal from './confirm-modal.es6.js';
import * as toolbar from './toolbar.es6.js';
import WeeklySchedule from './weekly-schedule-model.es6.js';
import { toNum, to12Hours, zPad, timeout } from './utils.es6.js';
import WeeklyTimeBlock from './weekly-timeblock-model.es6.js';
import * as copyMode from './copy-mode.es6.js';
import IconLoader from './icon-loader.es6.js';
import Mode from './mode';
import { BLOCK_COLOR_CLASSES, DAY_MIN_WIDTH } from './constants.js';

init();

function init() {
	const modalSaveButtons = d3.selectAll('.modal-buttons button[type=submit]').each(function () {
		IconLoader.createSaveIcon(this, undefined, undefined, undefined, true, -6, 1)
	});
	const modalCancelButtons = d3.selectAll('.modal-buttons button[type=button]')
		.filter(function() { // the confirm modal handles its own icons. skip it.
			return !this.closest('#confirm-modal')
		})
		.each(function () {
			IconLoader.createForbiddenIcon(this, 10, 10, '#ff0000', true, -6, 0)
		});

	document.querySelector('#block-time-modal button[type=submit]').onclick = saveTimeClick;
	document.querySelector('#block-time-modal button[type=button]').onclick = cancelTimeClick;
	document.querySelector('#block-note-modal button[type=submit]').onclick = saveNoteClicked;
	document.querySelector('#block-note-modal button[type=button]').onclick = cancelNoteClicked;

	// responsiveness handler
	window.addEventListener('resize', debounceResize);
}

let debounceResizeTimer;
function debounceResize() {
	clearTimeout(debounceResizeTimer);
	debounceResizeTimer = setTimeout(resize, 300);
}

function resize() {
	const dimensions = getDimensions();

	// hide/show days to maintain min day width
	if (dimensions.numDaysToShow < 7) {
		d3.selectAll('g.day').each(function(day) {
			d3.select(this).style('display', day.index < dimensions.numDaysToShow ? 'inline' : 'none');
		});
	} else {
		d3.selectAll('g.day').style('display', 'inline');
	}

	// resize stuff
	d3.select('#svg')
		.attr('width', dimensions.svgWidth)
		.attr('height', dimensions.svgHeight);
	d3.selectAll('rect.day')
		.attr('width', dimensions.dayWidth)
		.attr('height', dimensions.dayHeight)
		.each(day => {
			const domainStart = moment().day(day.index).startOf('day').toDate();
			const domainEnd = moment().day(day.index).endOf('day').toDate();
			const yScale = d3.scaleTime()
				.domain([domainStart, domainEnd])
				.range([0, dimensions.dayHeight]);
			day.scale = yScale;
		});
	d3.selectAll('rect.time-block')
		.attr('width', dimensions.dayWidth)
		.attr('height', block => getDayScale(block.dayIndex)(block.endTime) - getDayScale(block.dayIndex)(block.startTime))
		.attr('y', block => getDayScale(block.dayIndex)(block.startTime));
	d3.selectAll('g.day')
		.attr('transform', day => `translate(${day.index*dimensions.dayWidth}, 0)`);
	d3.selectAll('g.day-square')
		.attr('transform', `translate(0, ${dimensions.marginTop})`);
	d3.selectAll('.background, .empty-space-events')
		.attr('width', dimensions.canvasWidth)
		.attr('height', dimensions.dayHeight);
	d3.selectAll('.aboveground-canvas > line')
		.attr('x2', dimensions.canvasWidth);
	d3.selectAll('text.day-title')
		.attr('x', dimensions.dayWidth / 2);

	// scale for axes
	const domainStart = moment().startOf('day').toDate();
	const domainEnd = moment().endOf('day').add(1, 'minutes').toDate();
	const scale = d3.scaleTime()
		.domain([domainStart, domainEnd])
		.range([0, dimensions.dayHeight]);

	// left axis
	const leftAxis = d3.axisLeft(scale).ticks(5, "%I %p");
	d3.select('g.axis.left')
		.attr('transform', `translate(${dimensions.marginLeft}, ${dimensions.marginTop-0.5})`)
		.call(leftAxis);

	// right axis
	const rightAxis = d3.axisRight(scale).ticks(5, "%I %p");
	d3.select('g.axis.right')
		.attr('transform', `translate(${dimensions.svgWidth - dimensions.marginRight}, ${dimensions.marginTop-0.5})`)
		.call(rightAxis);
}

function getNumberOfDaysToShow(dayWidth = getDimensions().dayWidth) {
	const numOverflowPixels = (DAY_MIN_WIDTH - dayWidth) * 7;
	const numOverflowDays = Math.ceil(numOverflowPixels / dayWidth);
	const numDaysToShow = 7 - numOverflowDays;
	return numDaysToShow >= 1 ? numDaysToShow : 1;
}

export function getMode() {
	return Mode.get();
}

export function setMode(newMode) {
	Mode.set(newMode);
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
		.attr('class', 'axis left')
		.attr('transform', `translate(${dimensions.marginLeft}, ${dimensions.marginTop-0.5})`)
		.call(leftAxis);

	// right axis
	const rightAxis = d3.axisRight(scale).ticks(5, "%I %p");
	svg.append('g')
		.attr('class', 'axis right')
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
		.attr('class', 'empty-space-events')
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
		.text(day => day.key)
		.lower();

	// create border for each day square
	canvas.selectAll('g.day-square').append('rect')
		.attr('class', 'day')
		.attr('x', 0)
		.attr('y', 0)
		.attr('width', dimensions.dayWidth)
		.attr('height', dimensions.dayHeight);

	// above-ground canvas
	const abovegroundCanvas = canvas.append('g')
		.attr('class', 'aboveground-canvas')
		.attr('transform', `translate(0, ${dimensions.marginTop})`);

	// horizontal mouseover line and text for empty spaces
	const trackLineAbove = abovegroundCanvas.append('line')
		.attr('id', 'track-line-above-top')
		.attr('x1', 0).attr('y1', 0)
		.attr('x2', dimensions.canvasWidth).attr('y2', 0)
		.attr('display', 'none');
	const trackLineBottomAbove = abovegroundCanvas.append('line')
		.attr('id', 'track-line-above-bottom')
		.attr('x1', 0).attr('y1', 0)
		.attr('x2', dimensions.canvasWidth).attr('y2', 0)
		.attr('display', 'none');
	const trackTextAboveG = abovegroundCanvas.append('g')
		.attr('class', 'start-time overlay-time')
		.style('cursor', 'pointer')
		.on('mouseover', addHoverClass)
		.on('mouseout', removeHoverClass)
		.on('click', timeClick);
	const trackTextBorderAbove = trackTextAboveG.append('rect')
		.attr('id', 'track-text-above-border-top')
		.attr('class', 'tooltip-border')
		.attr('x', 0).attr('y', 0)
		.attr('width', 0).attr('height', 0)
		.attr('display', 'none');
	const trackTextAbove = trackTextAboveG.append('text')
		.attr('id', 'track-text-above-top')
		.attr('class', 'tooltip-text')
		.attr('x', 0)
		.attr('y', 0)
		.attr('text-anchor', 'middle')
		.attr('display', 'none');
	const trackTextBelowG = abovegroundCanvas.append('g')
		.attr('class', 'end-time overlay-time')
		.style('cursor', 'pointer')
		.on('mouseover', addHoverClass)
		.on('mouseout', removeHoverClass)
		.on('click', timeClick);
	const trackTextBorderBottomAbove = trackTextBelowG.append('rect')
		.attr('id', 'track-text-above-border-bottom')
		.attr('class', 'tooltip-border')
		.attr('x', 0).attr('y', 0)
		.attr('width', 0).attr('height', 0)
		.attr('display', 'none');
	const trackTextBottomAbove = trackTextBelowG.append('text')
		.attr('id', 'track-text-above-bottom')
		.attr('class', 'tooltip-text')
		.attr('x', 0)
		.attr('y', 0)
		.attr('text-anchor', 'middle')
		.attr('display', 'none');

	// create call/text/repeat tooltip icons
	const callIconG = abovegroundCanvas.append('g')
		.attr('id', 'call-icon')
		.attr('class', 'overlay-button')
		.style('cursor', 'pointer')
		.attr('display', 'none')
		.on('click', callIconClicked);
	callIconG.append('rect')
		.attr('width', 20)
		.attr('height', 20)
		.attr('rx', 4)
		.attr('ry', 4)
	const textIconG = abovegroundCanvas.append('g')
		.attr('id', 'text-icon')
		.attr('class', 'overlay-button')
		.style('cursor', 'pointer')
		.attr('display', 'none')
		.on('click', textIconClicked);
	textIconG.append('rect')
		.attr('width', 20)
		.attr('height', 20)
		.attr('rx', 4)
		.attr('ry', 4)
	const repeatCallIconG = abovegroundCanvas.append('g')
		.attr('id', 'repeat-call-icon')
		.attr('class', 'overlay-button')
		.style('cursor', 'pointer')
		.attr('display', 'none')
		.on('click', repeatCallIconClicked);
	repeatCallIconG.append('rect')
		.attr('width', 20)
		.attr('height', 20)
		.attr('rx', 4)
		.attr('ry', 4);
	const repeatTextIconG = abovegroundCanvas.append('g')
		.attr('id', 'repeat-text-icon')
		.attr('class', 'overlay-button')
		.style('cursor', 'pointer')
		.attr('display', 'none')
		.on('click', repeatTextIconClicked);
	repeatTextIconG.append('rect')
		.attr('width', 20)
		.attr('height', 20)
		.attr('rx', 4)
		.attr('ry', 4);
	const closeIconG = abovegroundCanvas.append('g')
		.attr('id', 'close-block-overlay-icon')
		.attr('class', 'overlay-button')
		.attr('display', 'none')
		.style('cursor', 'pointer')
		.on('mouseover', addHoverClass)
		.on('mouseout', removeHoverClass)
		.on('click', closeOverlayIconClicked);
	closeIconG.append('rect')
		.attr('width', 10)
		.attr('height', 10)
		.attr('rx', 2)
		.attr('ry', 2)
		.style('stroke-width', 1);
	const noteIconG = abovegroundCanvas.append('g')
		.attr('id', 'note-icon')
		.attr('class', 'svg-icon-button overlay-button')
		.attr('display', 'none')
		.style('cursor', 'pointer')
		.on('mouseover', addHoverClass)
		.on('mouseout', removeHoverClass)
		.on('click', noteIconClicked);
	noteIconG.append('rect')
		.attr('width', 20)
		.attr('height', 20)
		.attr('rx', 2)
		.attr('ry', 2);
	const noteContentG = abovegroundCanvas.append('g')
		.attr('id', 'note-content')
		.attr('class', 'svg-icon-button overlay-button')
		.attr('display', 'none')
		.style('cursor', 'pointer')
		.on('mouseover', addHoverClass)
		.on('mouseout', removeHoverClass)
		.on('click', noteIconClicked);
	noteContentG.append('rect')
		.attr('width', dimensions.dayWidth)
		.attr('height', 16)
		.attr('rx', 2)
		.attr('ry', 2);
	noteContentG.append('text')
		.attr('id', 'note-content-text')
		.attr('text-anchor', 'start')
		.attr('x', 2).attr('y', 12);
	const deleteIconG = abovegroundCanvas.append('g')
		.attr('id', 'delete-icon')
		.attr('class', 'svg-icon-button overlay-button')
		.attr('display', 'none')
		.style('cursor', 'pointer')
		.on('mouseover', addHoverClass)
		.on('mouseout', removeHoverClass)
		.on('click', deleteIconClicked);
	deleteIconG.append('rect')
		.attr('class', 'delete')
		.attr('width', 20)
		.attr('height', 20)
		.attr('rx', 2)
		.attr('ry', 2);
	const copyIconG = abovegroundCanvas.append('g')
		.attr('id', 'copy-icon')
		.attr('class', 'svg-icon-button overlay-button')
		.attr('display', 'none')
		.style('cursor', 'pointer')
		.on('mouseover', addHoverClass)
		.on('mouseout', removeHoverClass)
		.on('click', copyIconClicked);
	copyIconG.append('rect')
		.attr('width', 20)
		.attr('height', 20)
		.attr('rx', 2)
		.attr('ry', 2);
	const moveIconG = undergroundCanvas.append('g')
		.attr('id', 'move-icon')
		.attr('class', 'svg-icon-button overlay-button')
		.attr('display', 'none');
	const resizeTopRectG = abovegroundCanvas.append('g')
		.attr('id', 'resize-top')
		.attr('class', 'svg-icon-button overlay-button')
		.attr('display', 'none')
		.style('cursor', 'pointer')
		.on('dblclick', timeBlockStretch)
		.call(d3.drag()
			.on('drag', timeBlockResized)
			.on('end', timeBlockResizeEnded)
		);
	resizeTopRectG.append('rect')
		.attr('width', 24)
		.attr('height', 4)
		.attr('x', 0)
		.attr('y', 0)
		.style('cursor', 'ns-resize');
	const resizeBottomRectG = abovegroundCanvas.append('g')
		.attr('id', 'resize-bottom')
		.attr('class', 'svg-icon-button overlay-button')
		.attr('display', 'none')
		.style('cursor', 'pointer')
		.on('dblclick', timeBlockStretch)
		.call(d3.drag()
			.on('drag', timeBlockResized)
			.on('end', timeBlockResizeEnded)
		);
	resizeBottomRectG.append('rect')
		.attr('width', 24)
		.attr('height', 4)
		.attr('x', 0)
		.attr('y', 0)
		.style('cursor', 'ns-resize');
	const saveIconG = abovegroundCanvas.append('g')
		.attr('id', 'save-icon')
		.attr('class', 'svg-icon-button overlay-button')
		.attr('display', 'none')
		.style('cursor', 'pointer')
		.on('mouseover', addHoverClass)
		.on('mouseout', removeHoverClass)
		.on('click', saveIconClicked);
	saveIconG.append('rect')
		.attr('class', 'save')
		.attr('width', 20)
		.attr('height', 20)
		.attr('rx', 2)
		.attr('ry', 2);

	IconLoader.createCallIcon(callIconG.node());
	IconLoader.createTextIcon(textIconG.node());
	IconLoader.createRepeatIcon(repeatCallIconG.node());
	IconLoader.createRepeatIcon(repeatTextIconG.node());
	IconLoader.createCloseIcon(closeIconG.node());
	IconLoader.createNoteIcon(noteIconG.node());
	IconLoader.createDeleteIcon(deleteIconG.node());
	IconLoader.createCopyIcon(copyIconG.node());
	IconLoader.createMoveVerticalAlternateIcon(moveIconG.node());
	IconLoader.createSaveIcon(saveIconG.node(), 14, 14, null, false, 3, 3);
}

export function setDeleteMode(enable = true) {
	Mode.set(enable ? 'delete' : '');
	d3.selectAll('rect.time-block').classed('delete-mode', enable);
}

export function setFillMode(enable = true) {
	Mode.set(enable ? 'fill' : '');

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
export function setWeeklyData(weeklySchedule = timeBlockService.getActiveWeeklySchedule()) {
	const dimensions = getDimensions();

	// bind day data and create a svg groups for each day column and day square
	d3.select('.canvas')
			.selectAll('g.day')
			.data(weeklySchedule.daysWithTimeBlocks, day => day.index)
			.enter()
		.append('g')
			.attr('class', 'day')
			.attr('transform', (day) => `translate(${day.index*dimensions.dayWidth}, 0)`)
		.append('g')
			.attr('class', 'day-square')
			.attr('transform', `translate(0, ${dimensions.marginTop})`)
	d3.selectAll('g.day').selectAll('g.day-square').data(weeklySchedule.daysWithTimeBlocks, day => day.index);

	// create and store a scale for each day into each day's datum
	d3.selectAll('g.day').selectAll('g.day-square').each(day => {
		const domainStart = moment().day(day.index).startOf('day').toDate();
		const domainEnd = moment().day(day.index).endOf('day').toDate();
		const yScale = d3.scaleTime()
			.domain([domainStart, domainEnd])
			.range([0, dimensions.dayHeight]);
		day.scale = yScale;
	});

	// bind time block data to time block rects
	const blockRects = d3.selectAll('g.day-square') // this is the <g> day-square element
		.selectAll('rect.time-block')
		.data(day => day.values, block => block.blockID) // values are time blocks
		.each(function(block) { block.rect = this });

	// ceate/update/delete time block rects
	const updateCompletePromise = updateScheduleView(blockRects, weeklySchedule);
	return updateCompletePromise;
}

export function updateScheduleView(blockRects, weeklySchedule = {}) {
	const animationsCompletePromise = removeBlockRects(blockRects)
		.then(updateExistingBlockRects)
		.then(createBlockRects)
		.then(() => weeklySchedule);

	return animationsCompletePromise;
}

/** Determine the coordinates, x-scale day value, and y-scale time-value of the location to snap to */
function getSnapTo(svgElement) {
	const [ mouseX, mouseY ] = d3.mouse(svgElement);

	// determine day of week
	const dimensions = getDimensions();
	const step = dimensions.canvasWidth / 7;
	for (var dayIndex = 0; dayIndex <= 6; dayIndex++) {
		if (step*dayIndex < mouseX && mouseX < step*(dayIndex+1))
			break;
	}
	if (dayIndex > 6)
		throw new Error('Day not found in SvgService.getSnapTo');

	// create scale
	const scale = d3.scaleTime()
		.domain([ moment().startOf('day').toDate(), moment().endOf('day').toDate() ])
		.range([0, getDimensions().dayHeight]);

	// calculate remaining values
	const mouseTime = scale.invert(mouseY);
	const snapToTime = findClosest30Mins(mouseTime).toDate();
	const [ snapToHours12, meridiem ] = to12Hours(snapToTime.getHours());
	const snapToY = scale(snapToTime);

	// find the boundaries' time-values for this empty space
	const [topBoundaryTime, bottomBoundaryTime] = timeBlockService.getActiveWeeklySchedule().findEmptyBoundaries(snapToTime, dayIndex);

	return { x: mouseX, y: snapToY, day: dayIndex, hours12: snapToHours12, hours24: snapToTime.getHours(), minutes: snapToTime.getMinutes(), meridiem, topBoundaryTime, bottomBoundaryTime, scale };
}

function findClosest30Mins(time) {
	if (!(time instanceof Date) && !(time instanceof moment))
		return;

	const origMoment = moment(time);

	if (origMoment.minutes() < 15)
		return origMoment.clone().minutes(0).seconds(0);

	if (origMoment.minutes() >= 15 && origMoment.minutes() < 45)
		return origMoment.clone().minutes(30).seconds(0);

	// origMoment.minutes() >= 45
	return origMoment.clone().minutes(0).seconds(0).add(1, 'hour');
};

export function getDimensions() {
	const colPadding = 15;
	const marginTop = 55;
	const marginLeft = 45;
	const marginRight= 45;
	const marginBottom = 50;

	const clientWidth = window.innerWidth;
	const svgWidth = clientWidth - colPadding*2;
	const canvasWidth = svgWidth - marginLeft - marginRight;
	let dayWidth = canvasWidth / 7;

	let numDaysToShow = 7;
	if (dayWidth < DAY_MIN_WIDTH) {
		numDaysToShow = getNumberOfDaysToShow(dayWidth);
		dayWidth = canvasWidth / numDaysToShow;
	}

	const clientHeight = window.innerHeight;
	const dayHeight = dayWidth;
	const canvasHeight = dayHeight;
	const svgHeight = dayHeight + marginTop + marginBottom;

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
		numDaysToShow,
	}
}

export function getDayScale(dayIndex) {
	let scale;
	d3.selectAll('g.day-square')
		.filter(day => day.index === dayIndex)
		.each(day => scale = day.scale);
	if (scale === undefined)
		throw new Error(`Unable to find scale for day index ${dayIndex}`);

	return scale;
}

function getGForDay(dayIndex) {
	let targetDaySquare;
	d3.selectAll('g.day')
		.filter(day => day.index === dayIndex)
		.each(function() {
			targetDaySquare = d3.select(this);
		});
	return targetDaySquare;
}

function getSquareForDay(dayIndex) {
	let targetDaySquare;
	d3.selectAll('g.day-square')
		.filter(day => day.index === dayIndex)
		.each(function() {
			targetDaySquare = d3.select(this);
		});
	return targetDaySquare;
}

function updateColorClass(blockRect) {
	const colorClass = timeBlockColorClass(blockRect.datum());
	BLOCK_COLOR_CLASSES
		.filter(className => className !== colorClass)
		.forEach(className => blockRect.classed(className, false));
	blockRect.classed(colorClass, true);
}

function timeBlockColorClass(timeBlock) {
	if (!timeBlock)
		return '';

	if (timeBlock.isReceivingTexts) {
		return timeBlock.isReceivingCalls ? 'text-and-call' : 'text-only';
	} else {
		return timeBlock.isReceivingCalls ? 'call-only' : 'no-text-or-call';
	}
}

/** create needed new block rects */
function createBlockRects(blockRects) {
	const newBlockRects = blockRects.enter().filter(block => block.startHour !== undefined).append('rect');
	if (newBlockRects.empty())
		return Promise.resolve(blockRects);

	// create block rect with an initial height of 0
	newBlockRects
		.attr('class', block => 'time-block ' + timeBlockColorClass(block))
		.attr('x', 0)
		.attr('y', block => getDayScale(block.dayIndex)(block.midTime))
		.attr('width', getDimensions().dayWidth)
		.attr('height', 0)
		.each(function(block) { block.rect = this })
		.on('click', timeBlockClicked)
		.on('mouseover', timeBlockEnter)
		.on('mouseout', timeBlockLeave)
		.call(d3.drag()
			.on('drag', timeBlockDragged)
			.on('end', timeBlockDragEnded)
		);

	// grow block rect to its actual size
	return new Promise(resolve =>
		newBlockRects.transition().duration(550).ease(d3.easeBounce)
			.attr('y', block => getDayScale(block.dayIndex)(block.startTime))
			.attr('height', block => {
				const scale = getDayScale(block.dayIndex);
				return scale(block.endTime) - scale(block.startTime);
			})
			.on('end', () => resolve(blockRects))
	);
}

function updateExistingBlockRects(blockRects) {
	let updateCompletePromise = Promise.resolve(blockRects);

	blockRects.each(function(block) {
		const scale = getDayScale(block.dayIndex);
		const blockRect = d3.select(this);
		const { startMoment, endMoment } = getRectBoundaryMoments(blockRect);
		block.rect = this; // sometimes you need to be told twice

		// grow or shrink time block rect if it has been changed
		if (!startMoment.isSame(block.startMoment, 'minute') || !endMoment.isSame(block.endMoment, 'minute')) {
			updateCompletePromise = new Promise(resolve =>
				blockRect.transition().duration(450).ease(d3.easeSin)
					.attr('y', block => scale(block.startTime))
					.attr('height', block => scale(block.endTime) - scale(block.startTime))
					.on('end', () => resolve(blockRects))
			);
		}

		// check if type of time block has changed (no text/calls, text/call only, both texts/calls)
		if (!blockRect.classed(block.type)) {
			WeeklyTimeBlock.blockTypes.forEach(type => blockRect.classed(type, false));
			blockRect.classed(block.type, true);
		}
	});

	return updateCompletePromise;
}

function removeBlockRects(blockRects) {
	if (blockRects.exit().empty())
		return Promise.resolve(blockRects);

	let blocksRemovedPromise;
	blockRects.exit().each(function(block) {
		blocksRemovedPromise = new Promise((resolve, reject) => {
			const blockRect = d3.select(this);
			const origColorClass = timeBlockColorClass(block);
			const turnRed = () => blockRect.classed(origColorClass, false).classed('no-text-or-call', true);
			const turnBack = () => blockRect.classed('no-text-or-call', false).classed(origColorClass, true);
			const flashOnce = () => timeout(80).then(turnBack).then(() => timeout(80)).then(turnRed);
			const removeBlock = () => blockRect.transition().duration(750)
				.style('opacity', 0.0)
				.on('end', () => resolve(blockRects))
				.remove();

			timeout(0).then(turnRed)
				.then(flashOnce)
				.then(flashOnce)
				.then(removeBlock);
		});
	});

	return blocksRemovedPromise;
}

/** Given a D3 selection of a rect positioned within a day square, its start and
 * end times are determined and returned as moment properties of an object. */
export function getRectBoundaryMoments(blockRect) {
	const scale = getDayScale(blockRect.datum().dayIndex);

	// determine start time
	const rectStartY = blockRect.attr('y');
	const startMoment = moment(scale.invert(rectStartY));

	// determine end time
	const rectEndY = toNum(blockRect.attr('y')) + toNum(blockRect.attr('height'));
	const endMoment = moment(scale.invert(rectEndY));

	return { startMoment, endMoment };
}

function showBlockOverlay(block, verbose = false) {
	if (!(block instanceof WeeklyTimeBlock))
		return;

	const scale = getDayScale(block.dayIndex);
	const topLineY = scale(block.startTime);
	const bottomLineY = scale(block.endTime);
	const dimensions = getDimensions();
	const textX = dimensions.dayWidth * (block.dayIndex + 0.5);
	const topTextY = topLineY - 11;
	const bottomTextY = bottomLineY + 20;
	const topLineText = block.startMoment.format('h:mm a');
	const bottomLineText = block.endMoment.format('h:mm a');

	setTimeout(() => Hover.showTopLine(topLineY, textX, topTextY, topLineText, false, true), 25);
	setTimeout(() => Hover.showBottomLine(bottomLineY, textX, bottomTextY, bottomLineText, false, true), 25);

	// calculate positioning coordinates
	const dayX = block.dayIndex * dimensions.dayWidth;
	const nextDayX = (block.dayIndex + 1) * dimensions.dayWidth;
	const midDayX = dayX + (nextDayX - dayX)/2;
	const midDayY = scale(block.midTime);
	const firstQuarterX = dayX + dimensions.dayWidth/4;
	const lastQuarterX = dayX + dimensions.dayWidth*3/4;

	// bind block
	const callIconG = d3.select('#call-icon').datum(block);
	const textIconG = d3.select('#text-icon').datum(block);
	const repeatCallIconG = d3.select('#repeat-call-icon').datum(block);
	const repeatTextIconG = d3.select('#repeat-text-icon').datum(block);
	const noteIconG = d3.select('#note-icon').datum(block);
	const closeOverlayIconG = d3.select('#close-block-overlay-icon').datum(block);
	const startTimeG = d3.select('g.start-time').datum(block);
	const endTimeG = d3.select('g.end-time').datum(block);
	const noteContentG = d3.select('#note-content').datum(block);
	const deleteIconG = d3.select('#delete-icon').datum(block);
	const copyIconG = d3.select('#copy-icon').datum(block);
	const moveIconG = d3.select('#move-icon').datum(block);
	const resizeTopG = d3.select('#resize-top').datum(block);
	const resizeBottomG = d3.select('#resize-bottom').datum(block);
	const saveIconG = d3.select('#save-icon').datum(block);

	callIconG.attr('transform', `translate(${dayX + 6}, ${topLineY - 26})`)
			.attr('display', 'block')
		.select('rect')
			.attr('fill', block.isReceivingCalls ? 'rgb(11, 239, 65)' : 'rgb(150, 150, 150)');

	textIconG.attr('transform', `translate(${nextDayX - 26}, ${topLineY - 26})`)
			.attr('display', 'block')
		.select('rect')
			.attr('fill', block.isReceivingTexts ? 'rgb(15, 114, 255)' : 'rgb(150, 150, 150)');

	repeatCallIconG.attr('transform', `translate(${dayX + 6}, ${bottomLineY + 3})`)
			.attr('display', block.isCallRepeating ? 'block' : 'none')
		.select('rect')
			.attr('fill', block.isReceivingCalls && block.isCallRepeating ? 'rgb(11, 239, 65)' : 'rgb(150, 150, 150)');

	repeatTextIconG.attr('transform', `translate(${nextDayX - 26}, ${bottomLineY + 3})`)
			.attr('display', block.isTextRepeating ? 'block' : 'none')
		.select('rect')
			.attr('fill', block.isReceivingTexts && block.isTextRepeating ? 'rgb(15, 114, 255)' : 'rgb(150, 150, 150)');

	if (block.comment) {
		const noteText = noteContentG.attr('transform', `translate(${dayX}, ${bottomLineY + 27})`)
				.attr('display', 'block')
			.select('text');
		svgTextWithoutOverflow(block.comment, noteText.node(), dimensions.dayWidth - 4);
	} else {
		noteContentG.attr('display', 'none');
	}

	if (verbose) {
		repeatCallIconG.attr('display', block.isReceivingCalls ? 'block' : 'none');
		repeatTextIconG.attr('display', block.isReceivingTexts ? 'block' : 'none');
		noteIconG.attr('transform', `translate(${nextDayX + 3}, ${topLineY - 26})`)
			.attr('display', 'block');
		deleteIconG.attr('transform', `translate(${nextDayX + 3}, ${topLineY - 2})`)
			.attr('display', 'block');
		copyIconG.attr('transform', `translate(${nextDayX + 3}, ${topLineY + 22})`)
			.attr('display', 'block');
		moveIconG.attr('transform', `translate(${midDayX - 5}, ${midDayY - 10})`)
			.attr('display', 'block');
		resizeTopG.attr('transform', `translate(${midDayX - 12}, ${topLineY - 2})`)
			.attr('display', 'block');
		resizeBottomG.attr('transform', `translate(${midDayX - 12}, ${bottomLineY - 2})`)
			.attr('display', 'block');
		d3.selectAll('.time-block:not([data-selected])').style('pointer-events', 'none');
		d3.select('.tracking-empty').style('pointer-events', 'none');

		if (Mode.get() === 'edit') {
			closeOverlayIconG
				.attr('transform', `translate(${nextDayX + 11}, ${topLineY - 53})`)
				.attr('display', 'block');
		} else { // mode === 'creating'
			saveIconG
				.attr('transform', `translate(${nextDayX + 3}, ${topLineY - 53})`)
				.attr('display', 'block');
		}
	}
}

function svgTextWithoutOverflow(text, textNode, maxWidth) {
	textNode.textContent = text = text || '';
	let textLength = textNode.getComputedTextLength();
	while (textLength > maxWidth) {
		text = text.slice(0, -1);
		textNode.textContent = `${text}...`;
		textLength = textNode.getComputedTextLength();
	}
	return text;
}

class Hover {
	static showTopLine(lineY, textX, textY = lineY, lineText, below = true, debug = false) {
		const paddingV = 2.5;
		const paddingH = 5;
		const aOrB = below ? '' : '-above';

		// d3.select(`#track-line${aOrB}-top`)
		d3.select(`#track-line-top`)
			.attr('display', 'inline')
			.attr('y1', lineY).attr('y2', lineY);
		const trackText = d3.select(`#track-text${aOrB}-top`)
			.attr('display', 'inline')
			.attr('x', textX).attr('y', textY)
			.text(lineText);
		const textBBox = trackText.node().getBBox();
		d3.select(`#track-text${aOrB}-border-top`)
			.attr('display', 'inline')
			.attr('x', textBBox.x - paddingH)
			.attr('y', textBBox.y - paddingV)
			.attr('width', textBBox.width + paddingH*2)
			.attr('height', textBBox.height + paddingV*2);
	}

	static showBottomLine(lineY, textX, textY = lineY, lineText, below = true, debug = false) {
		const paddingV = 2.5;
		const paddingH = 5;
		const aOrB = below ? '' : '-above';

		// d3.select(`#track-line${aOrB}-bottom`)
		d3.select(`#track-line-bottom`)
			.attr('display', 'inline')
			.attr('y1', lineY).attr('y2', lineY);
		const trackTextBottom = d3.select(`#track-text${aOrB}-bottom`)
			.attr('display', 'inline')
			.attr('x', textX).attr('y', textY)
			.text(lineText);
		const textBBox = trackTextBottom.node().getBBox();
		d3.select(`#track-text${aOrB}-border-bottom`)
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

		d3.select('#track-line-above-top').attr('display', 'none');
		d3.select('#track-text-above-top').attr('display', 'none');
		d3.select('#track-text-above-border-top').attr('display', 'none');
	}

	/** remove mouseover tracking lines and texts */
	static hideBotomLine() {
		d3.select('#track-line-bottom').attr('display', 'none');
		d3.select('#track-text-bottom').attr('display', 'none');
		d3.select('#track-text-border-bottom').attr('display', 'none');

		d3.select('#track-line-above-bottom').attr('display', 'none');
		d3.select('#track-text-above-bottom').attr('display', 'none');
		d3.select('#track-text-above-border-bottom').attr('display', 'none');
	}

	static hideLines() {
		Hover.hideTopLine();
		Hover.hideBotomLine();
	}
}

// --------------------------- Event Handlers --------------------------- \\

function addHoverClass() {
	d3.select(this).selectAll('*').classed('hover', true);
}

function removeHoverClass() {
	d3.select(this).selectAll('*').classed('hover', false);
}

function timeBlockEnter(block) {
	if (Mode.get() === 'edit' || Mode.get().includes('dragging') || Mode.get() === 'creating')
		return;
	showBlockOverlay(block);
}

function timeBlockLeave(block) {
	if (Mode.get() === 'edit' || Mode.get() === 'creating')
		return;

	Hover.hideLines()
	d3.selectAll('.overlay-button').attr('display', 'none');
}

function timeBlockClicked(block) {
	switch (Mode.get()) {

		// show confirmation modal
		case 'delete':
			const deleteBlock = () => {
				const newSchedule = timeBlockService.remove(block);
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
			console.log("DEBUG timeBlockClicked case 'copy'");
			if (!this.hasAttribute('data-selected')) {
				console.log("DEBUG timeBlockClicked inside if");
				d3.select(this).attr('data-selected', '');
				copyMode.showDaySelectionSquares(block.dayIndex);
			}
			break;

		// show edit time block modal
		case '':
			Mode.set('edit');
			d3.select(this).attr('data-selected', '');
			showBlockOverlay(block, true);
	}
}

let totalDragDistance = 0;
let totalDragOverflow = 0;
let dragStart = 0;

function timeBlockDragged(block) {
	if (Mode.get() !== 'edit' && Mode.get() !== 'creating')
		return;

	const blockRect = Mode.get() === 'edit' ? d3.select(block.rect) : d3.select('.time-block-new');

	// initialize drag state on first drag event
	if (!dragStart) {
		dragStart = +blockRect.attr('y');
		d3.selectAll('.overlay-button').attr('display', 'none');
	}

	// determine how far the block can be dragged in either direction
	const schedule = timeBlockService.getActiveWeeklySchedule();
	const [ topBoundaryMoment, bottomBoundaryMoment ] = schedule.findGrowthBoundaries(block);

	// update drag state properties and determine new block rect y coordinate
	const dragDistance = d3.event.dy;
	if (totalDragOverflow > 5 || totalDragOverflow < -5)
		totalDragOverflow += dragDistance;
	else
		totalDragDistance += dragDistance;
	const newTopY = dragStart + totalDragDistance;

	// find the 30-min block closest to the block start time (we will snap to this time)
	const scale = getDayScale(block.dayIndex);
	const topTime = scale.invert(newTopY);
	let snapToMoment = findClosest30Mins(topTime);
	let snapToBottomMoment = snapToMoment.clone().add(block.duration);

	// adjust time to snap to if it would be outside of its growth boundaries
	if (topBoundaryMoment.isAfter(snapToMoment, 'minute')) {
		totalDragDistance -= dragDistance;
		totalDragOverflow += dragDistance;
		snapToMoment = topBoundaryMoment.clone();
	}
	if (bottomBoundaryMoment.isBefore(snapToBottomMoment, 'minute')) {
		totalDragDistance -= dragDistance;
		totalDragOverflow += dragDistance;
		snapToMoment = bottomBoundaryMoment.clone().subtract(block.duration);
	}
	snapToBottomMoment = snapToMoment.clone().add(block.duration);

	// determine positioning/values for top/bottom tooltip lines/texts
	const dimensions = getDimensions();
	const x = dimensions.dayWidth * (block.dayIndex + 0.5);
	const [topHours12, topMeridiem] = to12Hours(snapToMoment.hours());
	const [bottomHours12, bottomMeridiem] = to12Hours(snapToBottomMoment.hours());
	const topLineText = `${topHours12}:${zPad(snapToMoment.minutes())} ${topMeridiem}`;
	const bottomLineText = `${bottomHours12}:${zPad(snapToBottomMoment.minutes())} ${bottomMeridiem}`;

	// convert times to snap-to to coordinates
	const snapToY = scale(snapToMoment.toDate());
	const snapToBottomY = +blockRect.attr('height') + snapToY;

	// adjust top and bottom tracking lines/texts
	Hover.showTopLine(snapToY, x, snapToY - 10, topLineText, false);
	Hover.showBottomLine(snapToBottomY, x, snapToBottomY + 21, bottomLineText, false);

	// snap time block rect to the calculated coordinates
	blockRect.attr('y', snapToY);
}

function timeBlockDragEnded(block) {
	if (Mode.get() !== 'edit' && Mode.get() !== 'creating')
		return;

	if (isBlockEqualToRect(block)) {
		d3.selectAll('.overlay-button')
			.filter(function() {
				const isNotEmptyNote = d3.select(this).attr('id') !== 'note-content' || block.comment;
				const isNotRepeatCall = d3.select(this).attr('id') !== 'repeat-call-icon' || block.isCallRepeating;
				const isNotRepeatText = d3.select(this).attr('id') !== 'repeat-text-icon' || block.isTextRepeating;
				return isNotEmptyNote && isNotRepeatCall && isNotRepeatText;
			})
			.attr('display', 'block');
		return;
	}

	Mode.set(`dragging ${Mode.get()}`);

	dragStart = 0;
	totalDragDistance = 0;
	totalDragOverflow = 0;
	const scale = getDayScale(block.dayIndex);
	const newTopY = +d3.select(block.rect).attr('y') + d3.event.dy;
	const newBottomY = +d3.select(block.rect).attr('height') + newTopY;
	const newStartTime = scale.invert(newTopY);
	const newEndTime = scale.invert(newBottomY);

	let tempModifiedTimeBlock = block.clone().setTime(newStartTime, newEndTime);

	Hover.hideLines();
	d3.select(block.rect).attr('data-selected', '');

	timeClick(tempModifiedTimeBlock);
}

function timeBlockStretch(block) {
	console.log('stretch');
	const schedule = timeBlockService.getActiveWeeklySchedule();
	const scale = getDayScale(block.dayIndex);
	let [ topBoundaryMoment, bottomBoundaryMoment ] = schedule.findGrowthBoundaries(block.blockID);
	const isTop = d3.select(this).attr('id').indexOf('bottom') === -1;

	Mode.set(`dragging ${Mode.get()}`);
	d3.selectAll('.overlay-button').attr('display', 'none');

	// determine new block rect attributes
	let rectY, rectHeight, tempModifiedTimeBlock = block.clone();
	if (isTop) {
		rectY = scale(topBoundaryMoment.toDate());
		rectHeight = scale(block.endTime) - rectY;
		tempModifiedTimeBlock.startMoment = topBoundaryMoment;
	} else {
		rectY = scale(block.startTime);
		rectHeight = scale(bottomBoundaryMoment.toDate()) - scale(block.startTime);
		tempModifiedTimeBlock.endMoment = bottomBoundaryMoment;
	}
	Hover.hideLines();

	// stretch time block rect, then show time modal
	d3.select(block.rect).transition().duration(450).ease(d3.easeSin)
		.attr('y', rectY)
		.attr('height', rectHeight)
		.on('end', () => timeClick(tempModifiedTimeBlock));
}

function timeBlockResized(block) {
	if (Mode.get() !== 'edit')
		return;

	if (clickTimer)
		return;

	// initialize drag state on first drag event
	if (!dragStart) {
		dragStart = +d3.select(block.rect).attr('y');
		d3.selectAll('.overlay-button').attr('display', 'none');
	}

	const scale = getDayScale(block.dayIndex);
	const snapTo = getSnapTo(getSquareForDay(block.dayIndex).node());
	const isTop = d3.select(this).attr('id').indexOf('bottom') === -1;
	const blockRect = d3.select(block.rect);

	// determine how far the block edge can be dragged in either direction
	const schedule = timeBlockService.getActiveWeeklySchedule();
	let [ topBoundaryMoment, bottomBoundaryMoment ] = schedule.findGrowthBoundaries(block.blockID);
	if (isTop)
		bottomBoundaryMoment = block.endMoment.subtract(30, 'minutes');
	else // isBottom
		topBoundaryMoment = block.startMoment.add(30, 'minutes');
	const topBoundaryY = scale(topBoundaryMoment.toDate());
	const bottomBoundaryY = scale(bottomBoundaryMoment.toDate());

	// adjust the y coordinate if it is out of bounds
	if (snapTo.y < topBoundaryY)
		snapTo.y = topBoundaryY;
	else if (snapTo.y > bottomBoundaryY)
		snapTo.y = bottomBoundaryY;

	// apply new y-coord and height to block rect
	const height = isTop ? scale(block.endTime) - snapTo.y : snapTo.y - blockRect.attr('y');
	blockRect.attr('height', height);
	if (isTop) {
		blockRect.attr('y', snapTo.y);
	}

	// determine positioning/values for top/bottom tooltip lines/texts
	let topTimeY, bottomTimeY;
	if (isTop) {
		topTimeY = snapTo.y;
		bottomTimeY = snapTo.y + height;
	} else {
		topTimeY = snapTo.y - height;
		bottomTimeY = snapTo.y;
	}
	const dimensions = getDimensions();
	const x = dimensions.dayWidth * (block.dayIndex + 0.5);
	const snapToTopTime = scale.invert(topTimeY);
	const snapToBottomTime = scale.invert(bottomTimeY);
	const [topHours12, topMeridiem] = to12Hours(snapToTopTime.getHours());
	const [bottomHours12, bottomMeridiem] = to12Hours(snapToBottomTime.getHours());
	const topLineText = `${topHours12}:${zPad(snapToTopTime.getMinutes())} ${topMeridiem}`;
	const bottomLineText = `${bottomHours12}:${zPad(snapToBottomTime.getMinutes())} ${bottomMeridiem}`;

	// adjust top and bottom tracking lines/texts
	Hover.showTopLine(topTimeY, x, topTimeY - 10, topLineText, false);
	Hover.showBottomLine(bottomTimeY, x, bottomTimeY + 21, bottomLineText, false);
}

let clickTimer = null;
function timeBlockResizeEnded(block) {
	if (Mode.get() !== 'edit' && Mode.get() !== 'creating')
		return;

	dragStart = 0;
	totalDragDistance = 0;
	totalDragOverflow = 0;
	const scale = getDayScale(block.dayIndex);
	const newTopY = +d3.select(block.rect).attr('y') + d3.event.dy;
	const newBottomY = +d3.select(block.rect).attr('height') + newTopY;
	const newStartTime = scale.invert(newTopY);
	const newEndTime = scale.invert(newBottomY);

	// if (moment(newStartTime).isSame(block.startMoment, 'minute') && moment(newEndTime).isSame(block.endMoment, 'minute')) {
	if (isBlockEqualToRect(block)) {
		clickTimer = setInterval(() => {
			clearInterval(clickTimer);
			clickTimer = null;
		}, 500)
		d3.selectAll('.overlay-button')
			.filter(function() {
				const isNotEmptyNote = d3.select(this).attr('id') !== 'note-content' || block.comment;
				const isNotNoRepeatCall = d3.select(this).attr('id') !== 'repeat-call-icon' || block.isCallRepeating;
				const isNotNoRepeatText = d3.select(this).attr('id') !== 'repeat-text-icon' || block.isTextRepeating;
				return isNotEmptyNote && isNotNoRepeatCall && isNotNoRepeatText;
			})
			.attr('display', 'block');
		return;
	}

	Mode.set(`dragging ${Mode.get()}`);

	let tempModifiedTimeBlock = block.clone();
	tempModifiedTimeBlock.startHour = newStartTime.getHours();
	tempModifiedTimeBlock.startMinute = newStartTime.getMinutes();
	tempModifiedTimeBlock.endHour = newEndTime.getHours();
	tempModifiedTimeBlock.endMinute = newEndTime.getMinutes();

	Hover.hideLines();
	d3.select(block.rect).attr('data-selected', '');

	timeClick(tempModifiedTimeBlock);
}

function isBlockEqualToRect(block) {
	const rect = d3.select(block.rect);
	const scale = getDayScale(block.dayIndex);
	const rectY = +rect.attr('y');
	const rectHeight = +rect.attr('height');
	const rectStartMoment = moment(scale.invert(rectY));
	const rectEndMoment = moment(scale.invert(rectY + rectHeight));
	return rectStartMoment.isSame(block.startMoment, 'minute') && rectEndMoment.isSame(block.endMoment, 'minute');
}

function closeOverlayIconClicked() {
	Hover.hideLines();
	d3.selectAll('.overlay-button').attr('display', 'none');
	d3.selectAll('.time-block').style('pointer-events', 'auto');
	d3.select('.tracking-empty').style('pointer-events', 'auto');
	d3.selectAll('[data-selected]').attr('data-selected', null);
	if (!d3.selectAll('rect.day-select').empty()) {
		toolbar.removeCopyModeButtons();
		copyMode.setCopyMode(false);
	}
	Mode.set('');
}

function callIconClicked(block) {
	const { isReceivingCalls } = block;
	d3.select(this).select('rect')
		.attr('fill', isReceivingCalls ? 'rgb(150, 150, 150)' : 'rgb(11, 239, 65)');
	if (isReceivingCalls) {
		block.isCallRepeating = false;
		d3.select('#repeat-call-icon')
				.attr('display', 'none')
			.select('rect')
				.attr('fill', 'rgb(150, 150, 150)');
	} else {
		d3.select('#repeat-call-icon').attr('display', 'block');
	}

	block.isReceivingCalls = !isReceivingCalls;
	updateColorClass(d3.select(block.rect));

	if (Mode.get() === 'edit') {
		timeBlockService.edit(block)
			.then(() => console.log('edit successful'))
			.catch(error => console.log('edit failed: ', error));
	}
}

function textIconClicked(block) {
	const { isReceivingTexts } = block;
	d3.select(this).select('rect')
		.attr('fill', isReceivingTexts ? 'rgb(150, 150, 150)' : 'rgb(15, 114, 255)');
	if (isReceivingTexts) {
		block.isTextRepeating = false;
		d3.select('#repeat-text-icon')
				.attr('display', 'none')
			.select('rect')
				.attr('fill', 'rgb(150, 150, 150)');
	} else {
		d3.select('#repeat-text-icon').attr('display', 'block');
	}

	block.isReceivingTexts = !isReceivingTexts;
	updateColorClass(d3.select(block.rect));

	if (Mode.get() === 'edit') {
		timeBlockService.edit(block)
			.then(() => console.log('edit successful'))
			.catch(error => console.log('edit failed: ', error));
	}
}

function repeatCallIconClicked(block) {
	const { isCallRepeating } = block;
	d3.select(this).select('rect')
		.attr('fill', isCallRepeating ? 'rgb(150, 150, 150)' : 'rgb(11, 239, 65)');

	block.isCallRepeating = !isCallRepeating;

	if (Mode.get() === 'edit') {
		timeBlockService.edit(block)
			.then(() => console.log('edit successful'))
			.catch(error => console.log('edit failed: ', error));
	}
}

function repeatTextIconClicked(block) {
	const { isTextRepeating } = block;
	d3.select(this).select('rect')
		.attr('fill', isTextRepeating ? 'rgb(150, 150, 150)' : 'rgb(15, 114, 255)');

	block.isTextRepeating = !isTextRepeating;

	if (Mode.get() === 'edit') {
		timeBlockService.edit(block)
			.then(() => console.log('edit successful'))
			.catch(error => console.log('edit failed: ', error));
	}
}

function noteIconClicked(block) {
	document.getElementById('note').value = block.comment || '';

	d3.select('.modal-container')
			.style('display', 'flex')
		.select('#block-note-modal')
			.style('display', 'inline-block');
}

function deleteIconClicked(block) {
	const deleteBlock = () => {
		const tempMode = Mode.get();
		closeOverlayIconClicked();
		Mode.set(tempMode);
		if (Mode.get() === 'edit')
			timeBlockService.remove(block)
				.then(setWeeklyData)
				.then(() => Mode.set(''));
		else { // mode === 'creating'
			d3.select('.time-block-new').transition().duration(750)
				.style('opacity', 0)
				.remove();
			Mode.set('');
		}
	};
	confirmModal.show(deleteBlock);
}

function copyIconClicked(block) {
	const isPressed = d3.select(this).classed('pressed');
	d3.select(this).classed('pressed', !isPressed).selectAll('*').classed('pressed', !isPressed);
	if (isPressed) {
		toolbar.removeCopyModeButtons();
		copyMode.setCopyMode(false);
	}
	else
		copyMode.showDaySelectionSquares(block.dayIndex);
}

function saveNoteClicked(event) {
	event.preventDefault();
	const note = document.getElementById('note').value.trim();

	if (Mode.get() === 'edit') {
		const newBlock = d3.select('[data-selected]').datum().clone();
		newBlock.comment = note;

		timeBlockService.edit(newBlock)
			.then(cancelNoteClicked)
			.then(() => setWeeklyData())
			.then(() => showBlockOverlay(newBlock, true))
			.catch(error => console.log(error));
	} else { // mode === 'creating'
		const block = d3.select('[data-selected]').datum();
		block.comment = note;
		cancelNoteClicked();
		showBlockOverlay(block, true);
	}
}

function saveIconClicked(block) {
	timeBlockService.add(block)
		.then(blockWithID => {
			const newBlockRect = d3.select('.time-block-new');
			blockWithID.rect = newBlockRect.node();
			newBlockRect.datum(blockWithID).classed('time-block-new', false);
		})
		.then(closeOverlayIconClicked)
}

function cancelNoteClicked(event) {
	if (event && event.preventDefault)
		event.preventDefault();

	d3.select('.modal-container')
			.style('display', 'none')
		.select('#block-note-modal')
			.style('display', 'none');
}

function timeClick(block) {
	document.getElementById('startTime').value = zPad(block.startHour)+':'+zPad(block.startMinute);
	document.getElementById('endTime').value = zPad(block.endHour)+':'+zPad(block.endMinute);

	d3.select('.modal-container')
			.style('display', 'flex')
		.select('#block-time-modal')
			.style('display', 'inline-block');
}

function saveTimeClick(event) {
	const blockRect = d3.select('.time-block[data-selected]');
	Mode.set(Mode.get().split(' ').pop());

	// extract time data from form
	const startHour = document.getElementById('startTime').value.slice(0, 2);
	const startMinute = document.getElementById('startTime').value.slice(3);
	const endHour = document.getElementById('endTime').value.slice(0, 2);
	const endMinute = document.getElementById('endTime').value.slice(3);

	if (Mode.get() === 'edit') {
		// clock block and adjust times with form data
		const newBlock = blockRect.datum().clone().setMoments(moment({ hour: startHour, minute: startMinute }), moment({ hour: endHour, minute: endMinute }));
		newBlock.rect = blockRect.node();

		// send block edit request
		timeBlockService.edit(newBlock)
			.then(cancelTimeClick)
			.then(() => setWeeklyData())
			.then(() => showBlockOverlay(newBlock, true))
			.catch(error => console.log(error));
	} else { // mode === 'creating'
		const block = blockRect.datum().setMoments(moment({ hour: startHour, minute: startMinute }), moment({ hour: endHour, minute: endMinute }));
		cancelTimeClick();
		showBlockOverlay(block, true);
	}

	event.preventDefault();
}

function cancelTimeClick(event) {
	if (event && event.preventDefault)
		event.preventDefault();

	d3.select('.modal-container')
			.style('display', 'none')
		.select('#block-time-modal')
			.style('display', 'none');

	if (Mode.get().includes('dragging')) {
		Mode.set(Mode.get().split(' ').pop());
		const block = d3.select('.time-block[data-selected]').datum();
		if (Mode.get() === 'edit') {
			setWeeklyData().then(() => showBlockOverlay(block, true));
		} else {
			const scale = getDayScale(block.dayIndex);
			d3.select(block.rect).transition().duration(450).ease(d3.easeSin)
				.attr('y', block => scale(block.startTime))
				.attr('height', block => scale(block.endTime) - scale(block.startTime))
				.on('end', block => showBlockOverlay(block, true))
		}
	}
}

/** Enables 'creating' mode and Creates a new 30-min time block rect at the location clicked. */
function emptySpaceMouseDown() {
	if (Mode.get() !== '')
		return;

	Mode.set('creating');

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
		.attr('width', dimensions.dayWidth)
		.attr('height', newRectHeight)
		.on('click', timeBlockClicked)
		.on('mouseover', timeBlockEnter)
		.on('mouseout', timeBlockLeave)
		.call(d3.drag()
			.on('drag', timeBlockDragged)
			.on('end', timeBlockDragEnded)
		);
}

function emptySpaceMouseMove() {
	const snapTo = getSnapTo(this);
	const lineText = `${snapTo.hours12}:${zPad(snapTo.minutes)} ${snapTo.meridiem}`;

	if (Mode.get() === 'creating') {

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
	else if (Mode.get() === '') {
		Hover.showTopLine(snapTo.y, snapTo.x, snapTo.y - 10, lineText);
	}
}

/** Create time block from new rect data and show add block modal using the new block. */
function emptySpaceMouseOut() {
	if (Mode.get() === 'creating') {
		// Mode.set('');
		const snapTo = getSnapTo(this);
		const newBlockRect = d3.select('.time-block-new')
			.attr('data-selected', '')
			.attr('x', 0)
			.classed(timeBlockColorClass({}), true);
		const newRectTopY = newBlockRect.attr('y');
		const startTime = snapTo.scale.invert(newRectTopY);
		const newTimeBlock = new WeeklyTimeBlock({
			dayOfWeek: WeeklySchedule.days[snapTo.day],
			startHour: startTime.getHours(),
			startMinute: startTime.getMinutes(),
			endHour: snapTo.hours24,
			endMinute: snapTo.minutes
		});

		newTimeBlock.rect = newBlockRect.node();
		newBlockRect.datum(newTimeBlock);

		getSquareForDay(snapTo.day).node().appendChild(newBlockRect.node());
		showBlockOverlay(newTimeBlock, true);
	}

	// remove tracking lines and texts
	Hover.hideLines();
}

function fillBlockMouseOver(fillBlock) {
	if (Mode.get() === 'fill') {
		// disable animation and show rect fill
		fillBlock.animate = false;
		d3.select(this).interrupt();
		d3.select(this)
			.transition().duration(200)
			.attr('fill-opacity', 0.7);
	}
}

function fillBlockMouseOut(fillBlock) {
	if (Mode.get() === 'fill') {
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
	Mode.set('');

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