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
		d3.selectAll('rect.time-block').interrupt();
		svgService.showMessage('');
		d3.selectAll('rect.day-select').remove();
		d3.select('rect.time-block[data-selected]').attr('data-selected', null);
		d3.selectAll('rect.time-block.no-hover').classed('no-hover', false);
		d3.selectAll('rect.time-block.copy').remove();
		d3.selectAll('g.day-square > .copy-tooltip').each(function() {
			d3.select(this).selectAll('*').remove();
			d3.select(this).remove();
		});
		d3.select('g.aboveground-canvas').raise();

		// bind original time block data to the time block rects of each day
		const blockRects = d3.selectAll('g.day-square')
			.filter(day => day.originalData)
			.selectAll('rect.time-block')
			.data(day => day.originalData, block => block.blockID);

		// remove properties created during copy mode
		d3.selectAll('g.day').each(day => {
			delete day.animate;
			delete day.selected;
			delete day.copyWithOverwrite;
			delete day.copyNoOverwrite;
			delete day.originalData;
		});

		svgService.updateScheduleView(blockRects);
	}
}

/** Creates selection rects above each day that animate on hover. */
export function showDaySelectionSquares(...excludeDayIndexes) {
	if (!d3.select('rect.day-select').empty())
		return;

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
	const daysToCopyTo = [];
	d3.selectAll('g.day')
		.filter(day => day.selected)
		.each(function(day) {
			d3.select(this).select('rect.time-block.copy').style('opacity', null);
			const checkbox = d3.select(this).select('.tooltip-checkbox');
			const overwrite = !checkbox.empty() && checkbox.node().hasAttribute('data-selected');
			daysToCopyTo.push({ index: day.index, overwrite });
		});

	// perform the copy
	const blockToCopy = d3.select('.time-block[data-selected]').datum();
	timeBlockService.copy(blockToCopy, daysToCopyTo)
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
		const day = tooltipG.node().parentNode.datum();

		if (overwriteAll)
			checkOverwriteBox(copyRect, checkbox, checkmark, day);
		else
			uncheckOverwriteBox(copyRect, checkbox, checkmark, day);
	});
}

/** Determines which time blocks in the active schedule conflict with
 * the time block represented by the rect svg argument, if any. */
function getConflictingBlocks(timeBlockRect) {
	const schedule = timeBlockService.getActiveWeeklySchedule();
	const {startMoment, endMoment} = svgService.getRectBoundaryMoments(timeBlockRect);
	return schedule.getConflictingBlocks(startMoment, endMoment);
}

// --------------------------- Event Handlers --------------------------- \\

function daySelectSquareClicked(targetDay) {
	if (!targetDay.selected) {
		targetDay.selected = true;
		targetDay.animate = false;
		const dimensions = svgService.getDimensions();

		d3.select(this).attr('fill-opacity', 0.1);

		// create new rect on top of selected time block
		const sourceBlockRect = d3.select('rect.time-block[data-selected]');
		const sourceBlock = sourceBlockRect.datum();
		const targetDaySquare = d3.select(this.parentNode);
		const daysAway = sourceBlock.dayIndex - targetDay.index;
		const copyRectNode = sourceBlockRect.node().cloneNode(true);
		d3.select(copyRectNode).datum({ dayIndex: targetDay.index });
		d3.select(copyRectNode)
			.classed('copy', true)
			.attr('data-selected', null)
			.attr('x', daysAway * dimensions.dayWidth);

		// add new rect to target day square and animate it to move to that day
		targetDaySquare.node().appendChild(copyRectNode);

		// store both copy results in target day datum, as well as a backup of the pre-copy days' blocks
		targetDay.copyWithOverwrite = timeBlockService.getActiveWeeklySchedule().copyBlockToDay(sourceBlock, targetDay.index, true);
		targetDay.copyNoOverwrite = timeBlockService.getActiveWeeklySchedule().copyBlockToDay(sourceBlock, targetDay.index, false);
		targetDay.originalData = targetDay.values;

		// remove the new copy block, since we'll deal with this one ourselves
		const newBlockWithOverwrite = targetDay.copyWithOverwrite.createdBlocks.pop();
		const newBlockNoOverwrite = targetDay.copyNoOverwrite.createdBlocks.pop();

		// use w/overwrite results by default
		const { schedule } = targetDay.copyWithOverwrite;
		d3.select(copyRectNode).datum(newBlockWithOverwrite);

		// bind time block data to the time block rects of the target day
		const blockRects = d3.selectAll('g.day-square')
			.filter(day => day.index === targetDay.index)
			.selectAll('rect.time-block')
			.data(schedule.daysWithTimeBlocks[targetDay.index].values, block => block.blockID);

		// ceate/update/delete time block rects
		svgService.updateScheduleView(blockRects)
			.then(() => {
				d3.select(copyRectNode).transition().duration(1250).ease(d3.easeCubic)
					.attr('x', 0)
					.on('end', function () {
						targetDay.copyWithOverwrite.createdBlocks.push(newBlockWithOverwrite);
						if (newBlockNoOverwrite)
							targetDay.copyNoOverwrite.createdBlocks.push(newBlockNoOverwrite);
						showOverwriteCheckbox.call(this);
					});
			});

	} else {
		// remove copy rect and tooltip for the clicked day
		targetDay.selected = false;
		delete targetDay.copyWithOverwrite;
		delete targetDay.copyNoOverwrite;
		const blockRects = d3.selectAll('g.day-square')
			.filter(day => day.index === targetDay.index)
			.selectAll('rect.time-block')
			.data(targetDay.originalData, block => block.blockID);
		delete targetDay.originalData;
		svgService.updateScheduleView(blockRects)
			.then(() => d3.select(this).transition().duration(500).ease(d3.easeSin)
				.attr('fill-opacity', 0.6)
			)

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
	d3.select('.aboveground-canvas').raise();
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
	const copyRectNode = d3.select(this.parentNode).select('.copy').node();
	const targetDay = d3.select(this.parentNode).datum();
	const isChecked = checkbox.node().hasAttribute('data-selected');

	// set checkbox status and show/hide the check mark
	checkbox.attr('data-selected', isChecked ? null : '');
	checkmark.transition().duration(200).ease(d3.easeLinear)
		.attr('stroke-dashoffset', isChecked ? checkmark.node().getTotalLength() : 0);

	// modify and animate time block rects to copy results

	// bind time block data to the time block rects of the target day
	const { schedule, createdBlocks } = isChecked ? targetDay.copyNoOverwrite : targetDay.copyWithOverwrite;
	const targetDayBlockRects = d3.selectAll('g.day-square')
		.filter(day => day.index === targetDay.index)
		.selectAll('rect.time-block')
		.data(schedule.daysWithTimeBlocks[targetDay.index].values, block => block.blockID);
		// TODO something not workin here

	if (createdBlocks.length - 1 >= 0)
		d3.select(copyRectNode).datum(createdBlocks[createdBlocks.length - 1]);

	// ceate/update/delete time block rects
	svgService.updateScheduleView(targetDayBlockRects);
}

/** Triggers when a new copy rect has finished moving to its target day (on animation end). */
function showOverwriteCheckbox() {
	const copyRect = d3.select(this).raise();
	const conflictBlocks = getConflictingBlocks(copyRect);
	if (conflictBlocks.length === 0)
		return;

	const paddingV = 2.5;
	const paddingH = 5;

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
		.attr('data-selected', '')
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
		.attr('stroke-dashoffset', 0);
}