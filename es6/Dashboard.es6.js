'use strict';
import 'babel-polyfill';
import { zPad, to12Hours } from './utils.es6.js';
var moment = require('moment');

window.onload = init();

function init() {
	history.pushState({}, '', '/dashboard');
	d3.json('/schedule/weekly', createSVG);
	document.getElementById('texts-button').onclick = textsToggled;
	document.getElementById('texts-repeat-button').onclick = textsRepeatToggled;
	document.getElementById('calls-button').onclick = callsToggled;
	document.getElementById('calls-repeat-button').onclick = callsRepeatToggled;
	document.getElementById('close-modal').onclick = closeModal;
	d3.select('#modal-buttons > input[type="button"]').node().onclick = closeModal;
	d3.select('#modal-buttons > input[type="submit"]').node().onclick = editTimeBlock;
	if (window.innerWidth < 576)
		d3.select('#comment').attr('cols', '18');
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

	// svg element w/background
	svg.attr('width', svgWidth).attr('height', svgHeight);
	svg.append('rect')
		.attr('class', 'background')
		.attr('x', 0)
		.attr('y', 30)
		.attr('width', svgWidth)
		.attr('height', dayHeight);

	// group data by day of week
	const nestedData = d3.nest()
		.key(block => block.dayOfWeek)
		.entries(response.data);

	// create an svg group for each day column (including title)
	const dayG = svg.selectAll('g.day')
			.data(nestedData)
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
				})
				.on('click', showBlockDetail);
	});

	// create each day square border
	daySquareG.append('rect')
		.attr('class', 'day')
		.attr('x', 0)
		.attr('y', 0)
		.attr('width', dayWidth)
		.attr('height', dayHeight);
}

/** Loads and displays the time block parameter's data in a modal dialog */
function showBlockDetail(block) {
	// reset button states
	textsToggled.call(document.getElementById('texts-button'), undefined, false);
	callsToggled.call(document.getElementById('calls-button'), undefined, false);

	// fill input fields with time block data
	const [startHour12, startMeridiem] = to12Hours(block.startHour);
	const [endHour12, endMeridiem] = to12Hours(block.endHour);
	d3.select('#startHour').property('value', zPad(startHour12));
	d3.select('#startMinute').property('value', zPad(block.startMinute));
	d3.select('#startMeridiem').property('value', startMeridiem)
	d3.select('#endHour').property('value', zPad(endHour12));
	d3.select('#endMinute').property('value', zPad(block.endMinute));
	d3.select('#endMeridiem').property('value', endMeridiem)
	d3.select('#textRepeatDuration').property('value', block.repeatTextDuration);
	d3.select('#callRepeatDuration').property('value', block.repeatCallDuration);
	d3.select('#comment').property('value', block.comment);

	// set texts button states
	if (block.isReceivingTexts) {
		document.getElementById('texts-button').click();
		if (block.isTextRepeating)
			document.getElementById('texts-repeat-button').click();
	}

	// set calls button states
	if (block.isReceivingCalls) {
		document.getElementById('calls-button').click();
		if (block.isCallRepeating)
			document.getElementById('calls-repeat-button').click();
	}

	// center and display the modal dialog
	const modal = d3.select('.block-detail-modal').style('display', 'inline');
	setTimeout(() => {
		const modalDomRect = modal.node().getBoundingClientRect();
		const modalTop = window.innerHeight > modalDomRect.height ? (window.innerHeight/2 - modalDomRect.height/2) : 0;
		const modalLeft = window.innerWidth/2 - modalDomRect.width/2;
		modal
			.style('left', `${modalLeft}px`)
			.style('top', `${modalTop}px`);
	}, 0);
}

function editTimeBlock(event) {
	// TODO: implement this
	event.preventDefault();
}

function timeBlockColorClass(timeBlock) {
	if (timeBlock.isReceivingTexts) {
		return timeBlock.isReceivingCalls ? 'text-and-call' : 'text-only';
	} else {
		return timeBlock.isReceivingCalls ? 'call-only' : 'no-text-or-call';
	}
}

function textsToggled(event, isButtonPressed = !d3.select(this).classed('pressed')) {
	// highlight texts button
	d3.select(this).classed('pressed', isButtonPressed);

	// reset texts-repeat btn
	const txtRptBtn = d3.select('#texts-repeat-button').classed('active', isButtonPressed).node();
	textsRepeatToggled.call(txtRptBtn, event, false);

	// reset repeat duration group
	d3.select('#texts-repeat-duration-group').classed('responsive-invis', isButtonPressed);
}

function textsRepeatToggled(event, isButtonPressed = !d3.select(this).classed('pressed')) {
	// highlight texts-repeat button
	d3.select(this).classed('pressed', isButtonPressed);

	// show/enable repeat-duration field
	d3.select('#texts-repeat-duration-group').classed('active', isButtonPressed);

	// responsive invis & disable input for duration group
	d3.select('#texts-repeat-duration-group').classed('responsive-invis', !isButtonPressed);
	d3.select('#textRepeatDuration').property('disabled', !isButtonPressed);
}

function callsToggled(event, isButtonPressed = !d3.select(this).classed('pressed')) {
	// highlight calls button
	d3.select(this).classed('pressed', isButtonPressed);

	// reset calls-repeat button
	const calRptBtn = d3.select('#calls-repeat-button').classed('active', isButtonPressed).node();
	callsRepeatToggled.call(calRptBtn, event, false);

	// reset repeat duration group
	d3.select('#calls-repeat-duration').classed('responsive-invis', isButtonPressed);
}

function callsRepeatToggled(event, isButtonPressed = !d3.select(this).classed('pressed')) {
	// highlight calls-repeat button
	d3.select(this).classed('pressed', isButtonPressed);

	// show/enable repeat-duration field
	d3.select('#calls-repeat-duration-group').classed('active', isButtonPressed);

	// responsive invis & disable input for duration group
	d3.select('#calls-repeat-duration-group').classed('responsive-invis', !isButtonPressed);
	d3.select('#callRepeatDuration').property('disabled', !isButtonPressed);
}

function closeModal() {
	d3.select('.block-detail-modal').style('display', 'none');
}