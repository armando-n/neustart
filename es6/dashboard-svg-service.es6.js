import 'babel-polyfill';
import * as editModal from './edit-timeblock-modal.es6.js';
import * as timeBlockService from './timeblock-service.es6.js';
import * as confirmModal from './confirm-modal.es6.js';
import * as toolbar from './toolbar.es6.js';
import { WeeklySchedule } from './weekly-schedule-model.es6.js';
import { toNum, to12Hours, zPad } from './utils.es6.js';

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
	const mouseTrackingG = canvas.append('g')
		.attr('class', 'tracking-empty')
		.attr('transform', `translate(0, ${dimensions.marginTop})`);

	// horizontal mouseover line and text for empty spaces
	const trackLine = mouseTrackingG.append('line')
		.attr('x1', 0).attr('y1', 0)
		.attr('x2', dimensions.canvasWidth).attr('y2', 0)
		.attr('display', 'none');
	const trackText = mouseTrackingG.append('text')
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
		.on('mousemove', function() {
			// determine the coordinates and y-scale time-value of the mouse pointer location
			const [mouseX, mouseY] = d3.mouse(this);
			const mouseTime = moment(scale.invert(mouseY));
			const [hours24, minutes] = [ mouseTime.hours(), mouseTime.minutes() ];
			const [snapToHours24, snapToMinutes] = findClosest30Mins(hours24, minutes);
			const [snapToHours12, meridiem] = to12Hours(snapToHours24);
			const snapToTime = moment().hours(snapToHours24).minutes(snapToMinutes).toDate();
			const snapToY = scale(snapToTime);
			const textX = (snapToHours24 < 3) ? mouseX - 10 : mouseX;
			const textY = (snapToHours24 < 3) ? snapToY + 20 : snapToY - 10;

			// move line/text to mouse pointer and display corresponding time-value
			trackLine.attr('y1', snapToY).attr('y2', snapToY);
			trackText.attr('x', textX).attr('y', textY);
			trackText.text(`${snapToHours12}:${zPad(snapToMinutes)} ${meridiem}`);
		})
		.on('mouseout', () => {
			trackLine.attr('display', 'none');
			trackText.attr('display', 'none');
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

/** Binds the weekly data, overriding previous data, then redraws the SVG elements. */
function setWeeklyData(weeklySchedule) {  //dayIndex, dayHeight, dayWidth) {
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
		default: editModal.show(timeBlock);
	}
}