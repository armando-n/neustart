import 'babel-polyfill';
import * as editModal from './edit-timeblock-modal.es6.js';
import * as timeBlockService from './timeblock-service.es6.js';
import * as confirmModal from './confirm-modal.es6.js';
import * as toolbar from './toolbar.es6.js';
import { WeeklySchedule } from './weekly-schedule-model.es6.js';
import { toNum } from './utils.es6.js';

let mode = '';

export function createSvg(weeklySchedule) {
	const svg = d3.select('#svg');
	const dimensions = getDimensions();

	// save a reference to schedule
	timeBlockService.setActiveWeeklySchedule(weeklySchedule);

	// svg element w/background
	svg.attr('width', dimensions.svgWidth).attr('height', dimensions.svgHeight);
	svg.append('rect')
		.attr('class', 'background')
		.attr('x', 0)
		.attr('y', 30)
		.attr('width', dimensions.svgWidth)
		.attr('height', dimensions.dayHeight);

	// bind data and draw day squares and time blocks for each day of the week
	setWeeklyData(weeklySchedule);

	// create titles for each day
	svg.selectAll('g.day').append('text')
		.attr('class', 'day-title')
		.attr('x', dimensions.dayWidth / 2)
		.attr('y', 20)
		.attr('text-anchor', 'middle')
		.text(day => day.key);

	// create each day square border
	svg.selectAll('g.day-square').append('rect')
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

/** Binds the weekly data, overriding previous data, then redraws the SVG elements. */
function setWeeklyData(weeklySchedule) {  //dayIndex, dayHeight, dayWidth) {
	if (!(weeklySchedule instanceof WeeklySchedule))
		throw new Error('Invalid argument in SvgService.createSvg');

	// bind day data and create a svg groups for each day column and day square
	const dimensions = getDimensions();
	d3.select('#svg')
			.selectAll('g.day')
			.data(weeklySchedule.daysWithTimeBlocks)
			.enter()
		.append('g')
			.attr('class', 'day')
			.attr('transform', (day, index) => `translate(${index*dimensions.dayWidth}, 0)`)
		.append('g')
			.attr('class', 'day-square')
			.attr('transform', 'translate(0, 30)');

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
					.attr('y', block => {
						const blockStartTime = moment({hour: block.startHour, minute: block.startMinute}).day(dayIndex).toDate();
						return yScale(blockStartTime);
					})
					.attr('rx', 8)
					.attr('ry', 8)
					.attr('width', dimensions.dayWidth)
					.attr('height', block => {
						const blockStartTime = moment({hour: block.startHour, minute: block.startMinute}).day(dayIndex).toDate();
						const blockEndTime = moment({hour: block.endHour, minute: block.endMinute}).day(dayIndex).toDate();
						const rectStart = yScale(blockStartTime);
						const rectEnd = yScale(blockEndTime);
						return rectEnd - rectStart;
					})
					.on('click', timeBlockClicked);

			blockRects.exit()
				.transition()
				.delay(200)
				.duration(1250)
				.style('opacity', 0.0)
				.remove();
		});
}

function getDimensions() {
	const colPadding = 15;
	const marginTop = 39;
	const marginLeft = 30;
	const clientWidth = window.innerWidth;
	const clientHeight = window.innerHeight;
	const svgWidth = clientWidth - colPadding*2;
	const dayWidth = svgWidth / 7;
	const svgHeight = dayWidth + marginTop;
	const dayHeight = dayWidth;
	const graphWidth = svgWidth - marginLeft;
	const graphHeight = dayHeight;

	return {
		colPadding,
		marginTop,
		marginLeft,
		clientWidth,
		clientHeight,
		svgWidth,
		dayWidth,
		svgHeight,
		dayHeight,
		graphWidth,
		graphHeight,
	}
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
		case 'delete':
			confirmModal.show(() => {
				const newSchedule = timeBlockService.remove(timeBlock);
				setWeeklyData(newSchedule);
				setDeleteMode(false);
				toolbar.clearButtons();
			});
			break;
		default: editModal.show(timeBlock);
	}
}