import 'babel-polyfill';
import * as svgService from './dashboard-svg-service.es6.js';
import * as timeBlockService from './timeblock-service.es6.js';
import * as copyMode from './copy-mode.es6.js';

window.addEventListener('load', init);

function init() {
	// event handlers
	document.getElementById('toolbar-fill').addEventListener('click', fillClicked);
	document.getElementById('toolbar-copy').addEventListener('click', copyClicked);
	document.getElementById('copy-overwrite').addEventListener('change', copyOverwriteClicked)
	document.getElementById('toolbar-cancel').addEventListener('click', cancelClicked);
	document.getElementById('toolbar-paste').addEventListener('click', pasteClicked);
	document.getElementById('toolbar-delete').addEventListener('click', deleteClicked);
	document.getElementById('toolbar-split').addEventListener('click', splitClicked);
	document.getElementById('toolbar-add').addEventListener('click', addClicked);
}

export function clearButtons() {
	Array.from(document.querySelectorAll('#toolbar-buttons button'))
		.forEach(button => button.classList.remove('pressed'));
}

export function showPasteButtons() {
	hideAllButtons();
	document.getElementById('toolbar-copy').style.display = 'none';
	document.getElementById('toolbar-cancel').style.display = 'inline-block';
	document.getElementById('toolbar-paste').style.display = 'inline-block';
	document.getElementById('copy-overwrite').style.display = 'inline-block';
	document.querySelector('label[for="copy-overwrite"').style.display = 'inline-block';
}

export function removeCopyModeButtons() {
	showAllButtons();
	document.getElementById('toolbar-copy').classList.remove('pressed');
	document.getElementById('toolbar-cancel').style.display = 'none';
	document.getElementById('toolbar-paste').style.display = 'none';
	document.getElementById('copy-overwrite').style.display = 'none';
	document.querySelector('label[for="copy-overwrite"]').style.display = 'none';
}

function showAllButtons(...exceptions) {
	toggleAllButtonsDisplay(true, exceptions);
}

function hideAllButtons(...exceptions) {
	toggleAllButtonsDisplay(false, exceptions);
}

function toggleAllButtonsDisplay(show, ...exceptions) {
	Array.from(document.querySelectorAll('#toolbar-buttons button'))
		.forEach(button => {
			if (!exceptions.includes(button.id))
				button.style.display = show ? 'inline-block' : 'none';
		});
}

function toggleButton() {
	// deselect other toolbar buttons
	Array.from(document.querySelectorAll('#toolbar-buttons > button'))
		.forEach(button => {
			if (button !== this)
				button.classList.remove('pressed')
		});

	this.classList.toggle('pressed');
}

// --------------------------- Event Handlers --------------------------- \\

function fillClicked() {
	const enableFill = !this.classList.contains('pressed');
	if (enableFill)
		this.classList.add('pressed');
	else
		this.classList.remove('pressed');
	svgService.setFillMode(enableFill);
}

function copyClicked() {
	const enableCopy = !this.classList.contains('pressed');
	if (enableCopy) {
		hideAllButtons();
		document.getElementById('toolbar-copy').style.display = 'inline-block';
		document.getElementById('toolbar-cancel').style.display = 'inline-block';
		this.classList.add('pressed');
	}
	else {
		removeCopyModeButtons();
	}

	copyMode.setCopyMode(enableCopy);
}

function copyOverwriteClicked() {
    copyMode.setOverwriteAll(this.checked);
}

function cancelClicked() {
	removeCopyModeButtons();
	copyMode.setCopyMode(false);
}

function pasteClicked() {
	copyMode.completeCopyMode();
}

function deleteClicked() {
	const enableDelete = !this.classList.contains('pressed');
	if (enableDelete)
		this.classList.add('pressed');
	else
		this.classList.remove('pressed');
	svgService.setDeleteMode(enableDelete);
}

function splitClicked() {
	console.log('split clicked');
}

function addClicked() {
	console.log('add clicked');
}