import 'babel-polyfill';
import { zPad } from './utils.es6.js';
import * as timeBlockService from './timeblock-service.es6.js';
import WeeklyTimeBlock from './weekly-timeblock-model.es6.js';
import Mode from './mode';

window.addEventListener('load', init);

let successAction;
let cancelAction;

function init() {
	// bind event handlers
	document.getElementById('texts-button').onclick = textsToggled;
	document.getElementById('texts-repeat-button').onclick = textsRepeatToggled;
	document.getElementById('calls-button').onclick = callsToggled;
	document.getElementById('calls-repeat-button').onclick = callsRepeatToggled;
	document.getElementById('close-modal').onclick = cancelClicked;
	// document.querySelector('#modal-buttons > input[type="button"]').onclick = cancelClicked;
	// document.querySelector('#modal-buttons > input[type="submit"]').onclick = submitClicked;
	document.querySelectorAll('input[type="number"]').forEach(input =>
		input.onfocus = (event) => event.target.select()
	);
}

/** Loads and displays the time block parameter's data in a modal dialog */
export function show(block, addOrEdit = 'edit', onSubmitSuccess, onCancel) {
	Mode.set(addOrEdit);
	successAction = onSubmitSuccess;
	cancelAction = onCancel;
	document.querySelector('#block-detail-modal .modal-title')
		.textContent = addOrEdit === 'edit' ? 'Edit Time Block' : 'Add Time Block';

	// reset button states
	textsToggled.call(document.getElementById('texts-button'), undefined, false);
	callsToggled.call(document.getElementById('calls-button'), undefined, false);

	// fill input fields with time block data
	document.getElementById('startTime').value = zPad(block.startHour)+':'+zPad(block.startMinute);
	document.getElementById('endTime').value = zPad(block.endHour)+':'+zPad(block.endMinute);
	document.getElementById('repeatTextDuration').value = block.repeatTextDuration;
	document.getElementById('repeatCallDuration').value = block.repeatCallDuration;
	document.getElementById('note').value = block.comment || '';
	document.getElementById('blockID').value = block.blockID || '';
	document.getElementById('dayOfWeek').value = block.dayOfWeek;

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

function getFormTimeBlock() {
	// collect form data
	const startHour = document.getElementById('startTime').value.slice(0, 2);
	const startMinute = document.getElementById('startTime').value.slice(3);
	const endHour = document.getElementById('endTime').value.slice(0, 2);
	const endMinute = document.getElementById('endTime').value.slice(3);

	return new WeeklyTimeBlock({
		startHour, startMinute, endHour, endMinute,
		blockID: document.getElementById('blockID').value,
		dayOfWeek: document.getElementById('dayOfWeek').value,
		isReceivingTexts: document.getElementById('texts-button').classList.contains('pressed'),
		isReceivingCalls: document.getElementById('calls-button').classList.contains('pressed'),
		isTextRepeating: document.getElementById('texts-repeat-button').classList.contains('pressed'),
		isCallRepeating: document.getElementById('calls-repeat-button').classList.contains('pressed'),
		repeatTextDuration: document.getElementById('repeatTextDuration').value.trim(),
		repeatCallDuration: document.getElementById('repeatCallDuration').value.trim(),
		comment: document.getElementById('comment').value.trim()
	});
}

function isModalOpen() {
	return window.getComputedStyle(getModal()).getPropertyValue('display')  !== 'none';
}

function getModal() {
	return document.getElementById('block-detail-modal');
}

// --------------------------- Event Handlers --------------------------- \\

function submitClicked(event) {
	event.preventDefault();
	const timeBlock = getFormTimeBlock();
	if (Mode.get() === 'edit')
		timeBlockService.edit(timeBlock).then(() => {
			closeModal();
			successAction();
		}).catch(error => console.log(error));
	else // mode === 'add'
		timeBlockService.add(timeBlock).then(newTimeBlock => {
			closeModal();
			successAction();
		}).catch(error => console.log(error));
}

function cancelClicked(event) {
	event.preventDefault();
	closeModal();
	if (cancelAction)
		cancelAction();
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
	d3.select('#repeatTextDuration').property('disabled', !isButtonPressed);
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
	d3.select('#repeatCallDuration').property('disabled', !isButtonPressed);
}

function closeModal() {
	getModal().style.display = 'none';
}