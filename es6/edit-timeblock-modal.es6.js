import 'babel-polyfill';
import { zPad } from './utils.es6.js';
import * as timeBlockService from './timeblock-service.es6.js';

window.addEventListener('load', init);

function init() {
	// bind event handlers
	document.getElementById('texts-button').onclick = textsToggled;
	document.getElementById('texts-repeat-button').onclick = textsRepeatToggled;
	document.getElementById('calls-button').onclick = callsToggled;
	document.getElementById('calls-repeat-button').onclick = callsRepeatToggled;
	document.getElementById('close-modal').onclick = closeModal;
	document.querySelector('#modal-buttons > input[type="button"]').onclick = closeModal;
	document.querySelector('#modal-buttons > input[type="submit"]').onclick = timeBlockService.edit;
	document.querySelectorAll('input[type="number"]').forEach(input =>
		input.onfocus = (event) => event.target.select()
	);

	if (window.innerWidth < 576)
		document.getElementById('comment').cols = 18;
}

/** Loads and displays the time block parameter's data in a modal dialog */
export function show(block) {

	// reset button states
	textsToggled.call(document.getElementById('texts-button'), undefined, false);
	callsToggled.call(document.getElementById('calls-button'), undefined, false);

	// fill input fields with time block data
	document.getElementById('startTime').value = zPad(block.startHour)+':'+zPad(block.startMinute);
	document.getElementById('endTime').value = zPad(block.endHour)+':'+zPad(block.endMinute);
	document.getElementById('textRepeatDuration').value = block.repeatTextDuration;
	document.getElementById('callRepeatDuration').value = block.repeatCallDuration;
	document.getElementById('comment').value = block.comment;

	// set 'texts' button states
	if (block.isReceivingTexts) {
		document.getElementById('texts-button').click();
		if (block.isTextRepeating)
			document.getElementById('texts-repeat-button').click();
	}

	// set 'calls' button states
	if (block.isReceivingCalls) {
		document.getElementById('calls-button').click();
		if (block.isCallRepeating)
			document.getElementById('calls-repeat-button').click();
	}

	// center and display the modal dialog
	if (!isModalOpen()) {
		const modal = d3.select(getModal())
			.style('opacity', 0.0)
			.style('display', 'inline-block');
		setTimeout(() => {
			const modalDomRect = modal.node().getBoundingClientRect();
			const modalTop = window.innerHeight > modalDomRect.height ? (window.innerHeight/2 - modalDomRect.height/2) : 0;
			const modalLeft = window.innerWidth/2 - modalDomRect.width/2;
			modal
				.style('left', `${modalLeft}px`)
				.style('top', `${modalTop}px`)
				.transition()
				.delay(200)
				.duration(250)
				.style('opacity', 1.0);
		}, 0);
	}
}

function isModalOpen() {
	return window.getComputedStyle(getModal()).getPropertyValue('display')  !== 'none';
}

function getModal() {
	return document.getElementById('block-detail-modal');
}

// --------------------------- Event Handlers --------------------------- \\

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
	getModal().style.display = 'none';
}