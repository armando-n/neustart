import 'babel-polyfill';
import * as editModal from './edit-timeblock-modal.es6.js';
import { WeeklySchedule } from './weekly-schedule-model.es6.js';

var moment = require('moment');

export function createSvg(weeklySchedule) {

	if (!(weeklySchedule instanceof WeeklySchedule))
		throw new Error('Invalid argument in SvgService.createSvg');

	const svg = d3.select('#svg');
	const clientWidth = window.innerWidth;
	const clientHeight = window.innerHeight;
	const colPadding = 15;
	const svgWidth = clientWidth - colPadding*2;
	const dayWidth = svgWidth / 7;
	const dayHeight = dayWidth;
	const marginTop = 39;
	const marginLeft = 30;
	const svgHeight = dayWidth + marginTop;
	const graphWidth = svgWidth - marginLeft;
	const graphHeight = dayHeight;

	// svg element w/background
	svg.attr('width', svgWidth).attr('height', svgHeight);
	svg.append('rect')
		.attr('class', 'background')
		.attr('x', 0)
		.attr('y', 30)
		.attr('width', svgWidth)
		.attr('height', dayHeight);

	// create an svg group for each day column (including title)
	const dayG = svg.selectAll('g.day')
			.data(weeklySchedule.daysWithTimeBlocks)
			.enter()
		.append('g')
			.attr('class', 'day')
			.attr('transform', (day, index) => `translate(${index*dayWidth}, 0)`);

	// create titles for each day
	dayG.append('text')
		.attr('class', 'day-title')
		.attr('x', dayWidth / 2)
		.attr('y', 20)
		.attr('text-anchor', 'middle')
		.text(day => day.key);

	// create an svg group for the day square itself
	const daySquareG = dayG.append('g')
		.attr('transform', 'translate(0, 30)');

	daySquareG.each(function(g, dayIndex) {
		// y-scale for the current day
		let domainStart = moment().day(dayIndex).startOf('day').toDate();
		let domainEnd = moment().day(dayIndex).endOf('day').toDate();
		let yScale = d3.scaleTime()
			.domain([domainStart, domainEnd])
			.range([0, dayHeight]);

		// create time block rects
		d3.select(this)
			.selectAll('rect.time-block')
				.data(day => day.values) // values are time blocks
				.enter()
			.append('rect')
				.attr('class', block => 'time-block ' + timeBlockColorClass(block))
				.attr('x', 0)
				.attr('y', block => {
					const blockStartTime = moment({hour: block.startHour, minute: block.startMinute}).day(dayIndex).toDate();
					return yScale(blockStartTime);
				})
				.attr('rx', 8)
				.attr('ry', 8)
				.attr('width', dayWidth)
				.attr('height', block => {
					const blockStartTime = moment({hour: block.startHour, minute: block.startMinute}).day(dayIndex).toDate();
					const blockEndTime = moment({hour: block.endHour, minute: block.endMinute}).day(dayIndex).toDate();
					const rectStart = yScale(blockStartTime);
					const rectEnd = yScale(blockEndTime);
					return rectEnd - rectStart;
				})
				.on('click', editModal.show);
	});

	// create each day square border
	daySquareG.append('rect')
		.attr('class', 'day')
		.attr('x', 0)
		.attr('y', 0)
		.attr('width', dayWidth)
		.attr('height', dayHeight);
}

function timeBlockColorClass(timeBlock) {
	if (timeBlock.isReceivingTexts) {
		return timeBlock.isReceivingCalls ? 'text-and-call' : 'text-only';
	} else {
		return timeBlock.isReceivingCalls ? 'call-only' : 'no-text-or-call';
	}
}