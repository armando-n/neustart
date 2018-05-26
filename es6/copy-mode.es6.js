import 'babel-polyfill';
import * as svgService from './dashboard-svg-service.es6.js';
import * as timeBlockService from './timeblock-service.es6.js';
import * as toolbar from './toolbar.es6.js';

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

	// d3.select(this.parentNode).selectAll('.time-block:not(.selected)')
	// 	.classed('no-hover', true);
	
	d3.selectAll('g.day-square').each(function(day) {
		const daySquare = d3.select(this);

		if (excludeDayIndexes.indexOf(day.index) === -1) {
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
			// daySquare.selectAll('.time-block:not(.selected)').classed('no-hover', true);
		}
	});
}

export function completeCopyMode() {
	svgService.setMode('');

	// console.log('completeCopyMode data');
	// console.log(d3.selectAll('rect.time-block.copy').data());
	// d3.selectAll('rect.time-block.copy').data();

	const dayIndexesToCopyTo = [];
	d3.selectAll('g.day').each(function(day, index) {
		const copies = d3.select(this).select('rect.time-block.copy');
		if (!copies.empty())
			dayIndexesToCopyTo.push(index);
	});

	// TODO overwrite value needed

	setCopyMode(false);
}

export function setOverwriteAll(overwriteAll = true) {
	let boxesToClick;

	if (overwriteAll)
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

		if (!overwriteAll) {
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

function showOverwriteCheckbox() {
	if (svgService.getMode() !== 'copy')
		return;

	d3.select(this).raise();

	const conflictBlocks = getConflictingBlocks(this);
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

function animateStroke(datum) {
	if (datum.animate) {
		const darkColor = datum.selected ? '#5f1d32' : '#57aa57';
		const brightColor = datum.selected ? '#f185a8' : '#57e057';
		d3.select(this)
			.transition().duration(200).ease(d3.easeBack)
			// .attr('stroke-width', 1)
			.attr('stroke', darkColor)
			.transition().duration(200).ease(d3.easeBack)
			// .attr('stroke-width', 3)
			.attr('stroke', brightColor)
			.on('end', animateStroke);
	}
}

/** Determines which time blocks in the active schedule conflict with
 * the time block represented by the rect svg argument. */
function getConflictingBlocks(timeBlockRect) {
	const daySquare = d3.select(timeBlockRect.parentNode);
	const scale = daySquare.datum().scale;
	const schedule = timeBlockService.getActiveWeeklySchedule();
	const rectY = +d3.select(timeBlockRect).attr('y');
	const rectHeight = +d3.select(timeBlockRect).attr('height');
	const rectStartTime = scale.invert(rectY);
	const rectEndTime = scale.invert(rectY + rectHeight);

	return schedule.getConflictingBlocks(rectStartTime, rectEndTime);
}

// --------------------------- Event Handlers --------------------------- \\

function daySelectSquareClicked(day) {
	if (!day.selected) {
		day.selected = true;
		day.animate = false;
		// d3.select(this).attr('fill', '#57aa57');
		const dimensions = svgService.getDimensions();

		// create new rect on top of selected time block
		const rectToCopy = d3.select('rect.time-block.selected');
		const sourceDayIndex = rectToCopy.datum().dayIndex;
		const sourceDaySquare = d3.select(rectToCopy.node().parentNode);
		const targetDaySquare = d3.select(this.parentNode);
		const targetDayIndex = day.index;
		const daysAway = sourceDayIndex - targetDayIndex;
		const copyRect = rectToCopy.node().cloneNode(true);
		d3.select(copyRect).datum({ index: targetDayIndex, scale: svgService.getDayScale(targetDayIndex) });
		d3.select(copyRect)
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
	animateStroke.call(this, day);
}

function daySelectSquareMouseOut(day) {
	day.animate = false;
	const strokeColor = day.selected ? '#57e057' : 'black';
	const strokeWidth = day.selected ? 3 : 1;
	d3.select(this).interrupt();
	d3.select(this)
		.attr('stroke-width', strokeWidth)
		.attr('stroke', strokeColor);
}

function overwriteCheckboxClicked() {
	const tooltipG = d3.select(this);
	const checkbox = tooltipG.select('.tooltip-checkbox');
	const checkmark = tooltipG.select('.tooltip-checkmark');
	const copyRect = d3.select(this.parentNode).select('.copy').node();
	const conflictBlocks = getConflictingBlocks(copyRect);
	
	if (checkbox.node().hasAttribute('data-selected')) {
		// uncheck the checkbox
		checkbox.attr('data-selected', null);
		checkmark
			.transition().duration(200).ease(d3.easeLinear)
			.attr('stroke-dashoffset', checkmark.node().getTotalLength());

		// move overlapping time blocks into the foreground
		bringBlockRectsToFront(conflictBlocks);

		tooltipG.raise();
		
	} else {
		// check the checkbox
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
}