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

export function showCopyButton() {
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
	if (enableCopy)
		this.classList.add('pressed');
	else {
		this.classList.remove('pressed');
		clearButtons();
	}

	copyMode.setCopyMode(enableCopy);
}

function copyOverwriteClicked() {
	let boxesToClick;

	if (this.checked)
		boxesToClick = Array.from(document.querySelectorAll('.copy-tooltip .tooltip-checkbox:not([data-selected])'));
	else
		boxesToClick = Array.from(document.querySelectorAll('.copy-tooltip .tooltip-checkbox[data-selected]'));

	boxesToClick.forEach(checkboxNode => {
		// select the various parts of the checkbox and day
		const checkbox = d3.select(checkboxNode);
		const checkmark = d3.select(checkboxNode.parentNode).select('.tooltip-checkmark');
		const tooltipG = d3.select(checkboxNode.parentNode.parentNode);
		const daySquare = d3.select(tooltipG.node().parentNode);
		const dayIndex = daySquare.datum().index;
		const copyRect = daySquare.select('.time-block.copy');
		const scale = daySquare.datum().scale;

		// determine which blocks conflict with copy, if any
		const rectY = +copyRect.attr('y');
		const rectHeight = +copyRect.attr('height');
		const rectStartTime = scale.invert(rectY);
		const rectEndTime = scale.invert(rectY + rectHeight);
		const conflictBlocks = timeBlockService.getActiveWeeklySchedule().getConflictingBlocks(rectStartTime, rectEndTime);

		if (!this.checked) {
			checkbox.attr('data-selected', null);
			checkmark
				.transition().duration(200).ease(d3.easeLinear)
				.attr('stroke-dashoffset', checkmark.node().getTotalLength());

			// move overlapping time blocks into the foreground
			conflictBlocks.forEach(block => {
				d3.select(block.rect)
					.classed('no-hover', true)
					.style('opacity', 0.0)
					.raise()
					.transition().duration(500).ease(d3.easeLinear)
					.style('opacity', 0.65);
				tooltipG.raise();
			});
			
		} else {
			checkbox.attr('data-selected', '');
			checkmark
				.transition().duration(200).ease(d3.easeLinear)
				.attr('stroke-dashoffset', 0);

			// move overlapping time blocks into the background
			conflictBlocks.forEach(block =>
				d3.select(block.rect)
					.transition().duration(500).ease(d3.easeLinear)
					.style('opacity', 0.0)
					.on('end', function() {
						d3.select(this)
							.classed('no-hover', false)
							.lower()
							.style('opacity', null);
					})
			)
		}
	});
	
}

function cancelClicked() {
	showCopyButton();
	copyMode.setCopyMode(false);
}

function pasteClicked() {
	svgService.completeCopyMode();
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