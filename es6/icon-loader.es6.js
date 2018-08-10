import 'babel-polyfill';

const IconLoader = {

	callIconPromise: fetchIcon('images/phone.svg'),
	textIconPromise: fetchIcon('images/text-message.svg'),
	forbiddenIconPromise: fetchIcon('images/forbidden.svg'),
	repeatIconPromise: fetchIcon('images/repeat.svg'),
	closeIconPromise: fetchIcon('images/close.svg'),
	saveIconPromise: fetchIcon('images/save.svg'),
	noteIconPromise: fetchIcon('images/note.svg'),
	deleteIconPromise: fetchIcon('images/delete.svg'),
	copyIconPromise: fetchIcon('images/copy.svg'),
	moveIconPromise: fetchIcon('images/move.svg'),
	moveVerticalIconPromise: fetchIcon('images/move-vertical.svg'),

	/** Appends a new call icon to the element passed as an argument (e.g. a <g> element). */
	createCallIcon(parentElement) {
		createIcon(this.callIconPromise, parentElement, 100, 100, 16, 16, 'white', false, 2, 2);
	},

	/** Appends a new text icon to the element passed as an argument (e.g. a <g> element). */
	createTextIcon(parentElement) {
		createIcon(this.textIconPromise, parentElement, 24, 24, 16, 16, 'white', false, 2, 3);
	},

	createNoteIcon(parentElement, width = 16, height = 16, color = 'white', insertBefore = false, offsetX = 2, offsetY = 2) {
		createIcon(this.noteIconPromise, parentElement, 64, 64, width, height, null, insertBefore, offsetX, offsetY);
	},

	/** Appends a new forbidden icon to the element passed as an argument (e.g. a <g> element). */
	createForbiddenIcon(parentElement, width, height, color = 'black', insertBefore = false, offsetX = 0, offsetY = 0) {
		createIcon(this.forbiddenIconPromise, parentElement, 36, 36, width, height, color, insertBefore, offsetX, offsetY);
	},

	/** Appends a new repeate icon to the element passed as an argument (e.g. a <g> element). */
	createRepeatIcon(parentElement) {
		createIcon(this.repeatIconPromise, parentElement, 100, 100, 16, 16, 'white', false, 2, 2);
	},

	/** Appends a new close icon to the element passed as an argument (e.g. a <g> element). */
	createCloseIcon(parentElement, color = null) {
		createIcon(this.closeIconPromise, parentElement, 100, 100, 6, 6, null, false, 2, 2);
	},

	/** Appends a new call icon to the element passed as an argument (e.g. a <g> element). */
	createSaveIcon(parentElement, width = 12, height = 12, color = 'white', insertBefore = false, offsetX, offsetY) {
		createIcon(this.saveIconPromise, parentElement, 100, 100, width, height, color, insertBefore, offsetX, offsetY, 0, -952.36218);
	},

	createDeleteIcon(parentElement, width = 14, height = 14, color = null, insertBefore = false, offsetX = 3, offsetY = 3) {
		createIcon(this.deleteIconPromise, parentElement, 100, 100, width, height, color, insertBefore, offsetX, offsetY);
	},

	createCopyIcon(parentElement) {
		createIcon(this.copyIconPromise, parentElement, undefined, undefined, 14, 14, null, false, 3, 3);
	},

	createMoveIcon(parentElement) {
		createIcon(this.moveIconPromise, parentElement, 100, 100, 22, 22, 'rgba(30, 30, 30, 0.9)', undefined, undefined, undefined, undefined, undefined, 'rgb(44, 125, 255)');
	},

	createMoveVerticalIcon(parentElement) {
		createIcon(this.moveVerticalIconPromise, parentElement, 100, 100, 18, 18, 'rgba(30, 30, 30, 0.9)', undefined, undefined, undefined, undefined, undefined, 'rgb(44, 125, 255)')
	},

	createMoveVerticalAlternateIcon(parentElement) {
		d3.select(parentElement).append('svg')
				.attr('preserveAspectRatio', 'xMidYMax meet')
				.attr('viewBox', '0 0 40 100')
				.attr('width', 10)
				.attr('height', 20)
			.append('path')
				.attr('d', 'M 20,0 L 40,30 32,30 32,70 40,70 20,100 0,70 8,70 8,30 0,30 Z')
				.style('fill', 'rgba(0, 0, 0, 0.85)')
				.style('stroke', 'rgb(44, 125, 255)')
				.style('stroke-width', 4)
	},

	createResizeVerticalIcon(parentElement) {
		d3.select(parentElement).append('svg')
				.attr('preserveAspectRatio', 'xMidYMax meet')
				.attr('viewBox', '0 0 100 100')
				.attr('width', 10)
				.attr('height', 20)
			.append('path')
				.attr('d', 'M 20,0 L 40,30 32,30 32,70 40,70 20,100 0,70 8,70 8,30 0,30 Z')
				.style('fill', 'rgba(0, 0, 0, 0.85)')
				.style('stroke', 'rgb(44, 125, 255)')
				.style('stroke-width', 4)
				.style('cursor', 'ns-resize');
	},

	deleteIcon(parentElement) {
		d3.select(parentElement).select('svg').selectAll('*').remove();
		d3.select(parentElement).select('svg').remove();
	}
}

function fetchIcon(url) {
	return new Promise((resolve, reject) =>
		d3.html(url, svgData => resolve(svgData))
	)
}

/** Appends a new icon to the element passed as an argument (e.g. a <g> element). */
function createIcon(iconPromise, parentElement, viewboxWidth = 100, viewboxHeight = 100, width = 16, height = 16, color = 'white', insertBefore = false, offsetX = 0, offsetY = 0, translateX = null, translateY = null, strokeColor = null) {
	iconPromise.then(svgData => {

		// create wrapper <svg> as first child of parentElement
		if (insertBefore) {
			parentElement.insertBefore(document.createElementNS('http://www.w3.org/2000/svg', 'svg'), parentElement.firstChild);
		}

		// create wrapper <svg> as last child of parentElement
		else {
			d3.select(parentElement).append('svg');
		}

		// wrapper <svg> attributes
		const parentSvg = d3.select(parentElement).select('svg')
			.attr('width', width)
			.attr('height', height)
			.attr('preserveAspectRatio', 'xMidYMax meet')
			.attr('viewBox', `0 0 ${viewboxWidth} ${viewboxWidth}`);

		// set icon offset
		if (parentElement instanceof SVGElement) {
			parentSvg.attr('x', offsetX).attr('y', offsetY);
		} else {
			d3.select(parentElement).select('svg')
				.style('position', 'relative')
				.style('left', offsetX)
				.style('top', offsetY);
		}

		// wrapper <g>
		const parentG = parentSvg.append('g');

		// copy polygons/paths to wrapper <g>
		d3.select(svgData).selectAll('polygon, path').each(function () {
			parentG.node().appendChild(this.cloneNode(true));
		});

		// apply color
		parentSvg.selectAll('polygon').style('fill', 'black');
		if (color)
			parentSvg.selectAll('path').style('fill', color);
		if (strokeColor)
			parentSvg.selectAll('path').style('stroke', strokeColor).style('stroke-width', 2);

		if (translateX || translateY)
			parentG.attr('transform', `translate(${translateX}, ${translateY})`);
	})
}

export default IconLoader;