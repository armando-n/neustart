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
	Array.from(document.getElementsByTagName('button'))
		.forEach(button =>
			button.addEventListener('click', toggleButton)
		);
}

function toggleButton() {
	// deselect other toolbar buttons
	Array.from(document.querySelectorAll('#toolbar-buttons > button')).forEach(button => {
		if (button !== this)
			button.classList.remove('pressed')
	});

	this.classList.toggle('pressed');
}

function fillClicked() {
	console.log('fill clicked');
}

function copyClicked() {
	console.log('copy clicked');
}

function deleteClicked() {
	console.log('delete clicked');
}

function splitClicked() {
	console.log('split clicked');
}

function addClicked() {
	console.log('add clicked');
}