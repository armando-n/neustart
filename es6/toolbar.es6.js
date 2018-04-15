import 'babel-polyfill';
import * as svgService from './dashboard-svg-service.es6.js';

window.addEventListener('load', init);

function init() {
	// event handlers
	document.getElementById('toolbar-fill').addEventListener('click', fillClicked);
	document.getElementById('toolbar-copy').addEventListener('click', copyClicked);
	document.getElementById('toolbar-delete').addEventListener('click', deleteClicked);
	document.getElementById('toolbar-split').addEventListener('click', splitClicked);
	document.getElementById('toolbar-add').addEventListener('click', addClicked);
	Array.from(document.querySelectorAll('#toolbar-buttons button'))
		.forEach(button => {
			if (button.textContent !== 'Fill' && button.textContent !== 'Copy')
				button.addEventListener('click', toggleButton)
		});
}

export function clearButtons() {
	Array.from(document.querySelectorAll('#toolbar-buttons button'))
		.forEach(button => button.classList.remove('pressed'));
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
	if (enableCopy)
		this.classList.add('pressed');
	else
		this.classList.remove('pressed');
	svgService.setCopyMode(enableCopy);
}

function deleteClicked() {
	const enableDelete = !this.classList.contains('pressed');
	svgService.setDeleteMode(enableDelete);
}

function splitClicked() {
	console.log('split clicked');
}

function addClicked() {
	console.log('add clicked');
}