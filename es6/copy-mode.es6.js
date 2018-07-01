import 'babel-polyfill';
import * as svgService from './dashboard-svg-service.es6.js';
import * as timeBlockService from './timeblock-service.es6.js';
import * as toolbar from './toolbar.es6.js';

/** Enables or disables copy mode. */
export function setCopyMode(enable = true) {
	svgService.setMode(enable ? 'copy' : '');

	if (enable) {
		svgService.showMessage('Select a time block to copy');
	} else {
		svgService.showMessage('');
		d3.selectAll('rect.day-select').remove();
		d3.select('rect.time-block.selected').classed('selected', false);
		d3.selectAll('rect.time-block.no-hover').classed('no-hover', false);
		d3.selectAll('g.day').each(datum => datum.selected = false);
		d3.selectAll('rect.time-block.copy').remove();
		d3.selectAll('g.day-square > .copy-tooltip').each(function() {
			d3.select(this).selectAll('*').remove();
			d3.select(this).remove();
		});
		d3.selectAll('rect[data-conflict-block]').attr('data-conflict-block', null);
	}
}

/** Creates selection rects above each day that animate on hover. */
export function showDaySelectionSquares(...excludeDayIndexes) {
	const dimensions = svgService.getDimensions();
	toolbar.showPasteButtons();
	svgService.showMessage('Select days to paste to');

	d3.selectAll('g.day-square').each(function(day) {
		const daySquare = d3.select(this);

		if (excludeDayIndexes.indexOf(day.index) === -1) {
			// create day selection square
			daySquare.append('rect')
				.attr('class', 'day-select')
				.attr('x', 0)
				.attr('y', 0)
				.attr('width', dimensions.dayWidth)
				.attr('height', dimensions.dayHeight)
				.attr('stroke', 'black')
				.attr('stroke-width', 1)
				.attr('fill', '#eeeeee')
				.attr('fill-opacity', 0.6)
				.style('cursor', 'pointer')
				.on('mouseover', daySelectSquareMouseOver)
				.on('mouseout', daySelectSquareMouseOut)
				.on('click', daySelectSquareClicked);
		} else {
			daySquare.selectAll('.time-block').classed('no-hover', true);
		}
	});
}

export function completeCopyMode() {
	svgService.setMode('');

	// determine which days are selected for copying, as well as their overwrite flags
	const blockToCopy = d3.select('.time-block.selected').datum();
	const daysToCopyTo = [];
	d3.selectAll('g.day').each(function(day) {
		const copies = d3.select(this).select('rect.time-block.copy').style('opacity', null);
		const checkbox = d3.select(this).select('.tooltip-checkbox');
		const overwrite = !checkbox.empty() && checkbox.node().hasAttribute('data-selected');
		if (!copies.empty())
			daysToCopyTo.push({ index: day.index, overwrite });
	});

	// perform the copy
	timeBlockService.copy(blockToCopy, daysToCopyTo)
		// .then(() => svgService.setWeeklyData())
		.then(schedule => {
			svgService.setWeeklyData().then(() => {
				timeBlockService.mergeIdenticalAdjacentBlocks(schedule, daysToCopyTo.map(day => day.index))
					.then(() => svgService.setWeeklyData());
			})
		})
		.catch(error => console.log(error));

	// reset toolbar and mode
	toolbar.removeCopyModeButtons();
	setCopyMode(false);
}

/** Checks or unchecks all copy overwrite checkboxes and moves conflicting time block
 * rects to the background or foreground if overwriteAll is true or false, respectively. */
export function setOverwriteAll(overwriteAll = true) {
	let boxesToClick;

	if (overwriteAll)
		boxesToClick = Array.from(document.querySelectorAll('.copy-tooltip .tooltip-checkbox:not([data-selected])'));
	else
		boxesToClick = Array.from(document.querySelectorAll('.copy-tooltip .tooltip-checkbox[data-selected]'));

	boxesToClick.forEach(checkboxNode => {
		// select the various parts of the checkbox
		const checkbox = d3.select(checkboxNode);
		const checkmark = d3.select(checkboxNode.parentNode).select('.tooltip-checkmark');
		const tooltipG = d3.select(checkboxNode.parentNode.parentNode);
		const copyRect = d3.select(tooltipG.node().parentNode).select('.time-block.copy').node();

		if (overwriteAll)
			checkOverwriteBox(copyRect, checkbox, checkmark);
		else
			uncheckOverwriteBox(copyRect, checkbox, checkmark, tooltipG);
	});
}

/** Checks the given svg checkbox and moves into the background any
 * time block rects that conflict with the given copyRect. */
function checkOverwriteBox(copyRect, checkbox, checkmark) {
	// check the checkbox
	checkbox.attr('data-selected', '');
	checkmark.transition().duration(200).ease(d3.easeLinear)
		.attr('stroke-dashoffset', 0);

	// move overlapping time blocks into the background
	d3.select(copyRect)
		.raise()
		.transition().duration(200).ease(d3.easeLinear)
		.style('opacity', 1.0);
	d3.select(copyRect.parentNode).select('rect.day-select').raise();
	const tooltipG = d3.select(checkbox.node().parentNode.parentNode);
	tooltipG.raise();

	// const conflictBlocks = getConflictingBlocks(copyRect);
	// conflictBlocks.forEach(block =>
	// 	d3.select(block.rect)
	// 		.transition().duration(500).ease(d3.easeLinear)
	// 		.style('opacity', 0.0)
	// 		.on('end', function() {
	// 			d3.select(this)
	// 				.classed('no-hover', false)
	// 				.lower()
	// 				.style('opacity', null);
	// 		})
	// );
}

/** Unchecks the given svg checkbox and moves into the foreground any
 * time block rects that conflict with the given copyRect. */
function uncheckOverwriteBox(copyRect, checkbox, checkmark, tooltipG) {
	// uncheck the checkbox
	checkbox.attr('data-selected', null);
	checkmark.transition().duration(200).ease(d3.easeLinear)
		.attr('stroke-dashoffset', checkmark.node().getTotalLength());

	// move overlapping time blocks into the foreground
	d3.select(copyRect)
		.transition().duration(200).ease(d3.easeLinear)
		// .style('opacity', 0.0)
		.on('end', function() { d3.select(this).lower(); });
	// bringBlockRectsToFront(getConflictingBlocks(copyRect));

	// tooltipG.raise();
}

/** Raises the rects represented by the given time blocks into the foreground. */
function bringBlockRectsToFront(timeBlocks) {
	timeBlocks.forEach(block =>
		d3.select(block.rect)
			.attr('data-conflict-block', '')
			.classed('no-hover', true)
			.style('opacity', 0.0)
			.raise()
			.transition().duration(500).ease(d3.easeLinear)
			.style('opacity', 0.65)
	);
}

/** Determines which time blocks in the active schedule conflict with
 * the time block represented by the rect svg argument, if any. */
function getConflictingBlocks(timeBlockRect) {
	const schedule = timeBlockService.getActiveWeeklySchedule();
	const {startMoment, endMoment} = svgService.getRectBoundaryMoments(timeBlockRect);
	return schedule.getConflictingBlocks(startMoment, endMoment);
}

// --------------------------- Event Handlers --------------------------- \\

function daySelectSquareClicked(day) {
	if (!day.selected) {
		day.selected = true;
		day.animate = false;
		const dimensions = svgService.getDimensions();

		d3.select(this).attr('fill-opacity', 0.1);

		// create new rect on top of selected time block
		const rectToCopy = d3.select('rect.time-block.selected');
		const sourceDayIndex = rectToCopy.datum().dayIndex;
		const sourceDaySquare = d3.select(rectToCopy.node().parentNode);
		const targetDaySquare = d3.select(this.parentNode);
		const targetDayIndex = day.index;
		const daysAway = sourceDayIndex - targetDayIndex;
		const copyRect = rectToCopy.node().cloneNode(true);
		d3.select(copyRect).datum({ dayIndex: targetDayIndex });
		d3.select(copyRect)
			.classed('selected', false)
			.classed('copy', true)
			.attr('x', daysAway * dimensions.dayWidth);

		// add new rect to target day square and animate it to move to that day
		targetDaySquare.node().appendChild(copyRect);
		d3.select(copyRect)
			.transition().duration(1250).ease(d3.easeCubic)
			.attr('x', 0)
			.on('end', showOverwriteCheckbox);

	} else {
		// remove copy rect and tooltip for the clicked day
		day.selected = false;

		d3.select(this).attr('fill-opacity', 0.6);
		
		const daySquare = d3.select(this.parentNode);
		daySquare.select('rect.copy')
			.transition().duration(750).ease(d3.easeCubic)
			.style('opacity', 0.0)
			.remove();
		daySquare.select('g.copy-tooltip')
			.transition().duration(750).ease(d3.easeCubic)
			.style('opacity', 0.0)
			.remove();
	}
}

function daySelectSquareMouseOver(day) {
	day.animate = true;
	const strokeColor = day.selected ? '#f185a8' : '#57e057';

	d3.select(this.parentNode.parentNode).raise();
	d3.select(this)
		.attr('stroke', strokeColor)
		.attr('stroke-width', 3);

	// repeatedly animates day select square
	const animateStroke = day => {
		const darkColor = day.selected ? '#5f1d32' : '#57aa57';
		const brightColor = day.selected ? '#f185a8' : '#57e057';

		if (day.animate) {
			d3.select(this)         // this is a day selection square
				.transition().duration(200).ease(d3.easeBack)
				.attr('stroke', darkColor)
				.transition().duration(200).ease(d3.easeBack)
				.attr('stroke', brightColor)
				.on('end', animateStroke);
		} else {
			d3.select(this)
				.attr('stroke', 'black')
				.attr('stroke-width', 1);
		}
	}

	animateStroke(day);
}

function daySelectSquareMouseOut(day) {
	day.animate = false;
	d3.select(this).interrupt();
	d3.select(this)
		.attr('stroke-width', 1)
		.attr('stroke', 'black');
}

function overwriteCheckboxClicked() {
	const tooltipG = d3.select(this);
	const checkbox = tooltipG.select('.tooltip-checkbox');
	const checkmark = tooltipG.select('.tooltip-checkmark');
	const copyRect = d3.select(this.parentNode).select('.copy').node();
	
	if (checkbox.node().hasAttribute('data-selected')) {
		uncheckOverwriteBox(copyRect, checkbox, checkmark, tooltipG);
	} else {
		checkOverwriteBox(copyRect, checkbox, checkmark);
	}
}

/** Triggers when a new copy rect has finished moving to its target day (on animation end). */
function showOverwriteCheckbox() {
	if (svgService.getMode() !== 'copy')
		return;

	const copyRect = d3.select(this).raise();
	const conflictBlocks = getConflictingBlocks(copyRect);
	if (conflictBlocks.length === 0)
		return;

	const paddingV = 2.5;
	const paddingH = 5;

	// bring conflicting blocks to the front to show where they overlap the copy block
	bringBlockRectsToFront(conflictBlocks);

	// create overwrite checkbox for each copied block (appended to day square)
	const tooltipG = d3.select(this.parentNode).append('g')
		.attr('class', 'copy-tooltip')
		.style('cursor', 'pointer');
	const tooltipBorder = tooltipG.append('rect');
	const overwriteText = tooltipG.append('text');
	const checkboxG = tooltipG.append('g');
	const checkbox = checkboxG.append('rect');
	const checkmark = checkboxG.append('path');
	tooltipG.on('click', overwriteCheckboxClicked);

	// text
	overwriteText
		.attr('class', 'tooltip-text')
		.style('font-size', '0.75rem')
		.attr('text-anchor', 'middle')
		.text('Overwrite');
	let textBBox = overwriteText.node().getBBox();
	overwriteText
		.style('opacity', 0.0)
		.attr('x', svgService.getDimensions().dayWidth/2)
		.attr('y', +d3.select(this).attr('y') + textBBox.height + paddingV*2);
	overwriteText.transition().duration(350).ease(d3.easeSin)
		.style('opacity', 1.0)
		.attr('y', +d3.select(this).attr('y') - paddingV*4);

	// border
	textBBox = overwriteText.node().getBBox();
	tooltipBorder
		.attr('class', 'tooltip-border')
		.style('opacity', 0.0)
		.attr('x', textBBox.x - paddingH - 16)
		.attr('y', textBBox.y - paddingV)
		.attr('width', textBBox.width + paddingH*2 + 16)
		.attr('height', textBBox.height + paddingV*2);
	tooltipBorder
		.transition().duration(350).ease(d3.easeSin)
		.style('opacity', 1.0)
		.attr('y', textBBox.y - paddingV*7 - textBBox.height);

	// checkbox
	const checkboxX = textBBox.x - 16;
	const checkboxYStart = +d3.select(this).attr('y') + textBBox.height + paddingV*2 - 10.5;
	const checkboxYEnd = +d3.select(this).attr('y') - paddingV*4 - 10.5;
	checkbox
		.attr('class', 'tooltip-checkbox')
		.attr('x', 0)
		.attr('y', 0)
		.attr('width', 12.5).attr('height', 12.5)
		.attr('fill', '#4286f4')
		.attr('rx', 2).attr('ry', 2)
		.attr('stroke', '#2d4468')
		.attr('stroke-width', 1);
	checkboxG
		.style('opacity', 0.0)
		.attr('transform', `translate(${checkboxX}, ${checkboxYStart})`);
	checkboxG.transition().duration(350).ease(d3.easeSin)
		.style('opacity', 1.0)
		.attr('transform', `translate(${checkboxX}, ${checkboxYEnd})`);
	checkmark
		.attr('class', 'tooltip-checkmark')
		.attr('d', 'M 2.5 4.5 L 6.25 8 L 13.5 -1')
		.attr('stroke', 'black')
		.attr('stroke-width', 2)
		.attr('fill', 'none');
	const checkmarkLength = checkmark.node().getTotalLength();
	checkmark
		.attr('stroke-dasharray', `${checkmarkLength} ${checkmarkLength}`)
		.attr('stroke-dashoffset', checkmarkLength);
}