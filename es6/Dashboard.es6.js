
import 'babel-polyfill';
var moment = require('moment');

window.onload = init();

function init() {
	history.pushState({}, '', '/dashboard');
	d3.json('/schedule/weekly', createSVG);
}

function createSVG(error, response) {
	const svg = d3.select('#svg');
	const clientWidth = window.innerWidth;
	const clientHeight = window.innerHeight;
	const colPadding = 15;
	const svgWidth = clientWidth - colPadding*2;
	const dayWidth = svgWidth / 7;
	const dayHeight = dayWidth;
	const svgHeight = dayWidth + 30;
	const marginLeft = 30;
	const graphWidth = svgWidth - marginLeft;
	const graphHeight = svgHeight;

	// svg element w/border
	svg
		.attr('width', svgWidth)
		.attr('height', svgHeight);
	svg.append('rect')
		.attr('class', 'background')
		.attr('x', 0)
		.attr('y', 30)
		.attr('width', svgWidth)
		.attr('height', dayHeight);

	const nestedData = d3.nest()
		.key(block => block.dayOfWeek)
		.entries(response.data);

	// create each day group
	const dayG = svg.selectAll('g.day')
			.data(nestedData)
			.enter()
		.append('g')
			.attr('class', 'day')
			.attr('transform', (day, index) => 'translate('+(index*dayWidth)+', 0)');

	// day titles
	dayG.append('text')
		.attr('class', 'day')
		.attr('x', dayWidth / 2)
		.attr('y', 20)
		.attr('text-anchor', 'middle')
		.text(day => day.key);

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
				.attr('class', timeBlock => 'time-block ' + timeBlockColorClass(timeBlock))
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
				});
	});

	// create each day square
	daySquareG.append('rect')
		.attr('class', 'day')
		.attr('x', 0)
		.attr('y', 0)
		.attr('width', dayWidth)
		.attr('height', dayHeight);
}

function timeBlockColorClass(timeBlock) {
	if (timeBlock.isReceivingTexts) {
		if (timeBlock.isReceivingCalls) {
			return 'text-and-call';
		} else {
			return 'text-only';
		}
	} else {
		if (timeBlock.isReceivingCalls) {
			return 'call-only';
		} else {
			return 'no-text-or-call';
		}
	}
}