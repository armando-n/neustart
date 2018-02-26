

(function() {

	function toNum(num) {
		if (typeof num === 'number')
			return num;
		return parseFloat(num, 10);
	}

	$(document).ready(function() {
		history.pushState({}, '', '/dashboard');
		d3.json('/schedule/weekly', createSVG);
	});

	function createSVG(error, response) {
		const svg = d3.select('#svg');
		// const width = toNum(svg.style('width'));
		const clientWidth = $(window).width();
		const clientHeight = $(window).height();
		const colPadding = 15;
		const svgWidth = clientWidth - colPadding*2;
		const dayWidth = svgWidth / 7;
		const dayHeight = dayWidth;
		const svgHeight = dayWidth + 30;
		// const svgHeight = 200;
		const marginLeft = 30;
		const graphWidth = svgWidth - marginLeft;
		const graphHeight = svgHeight;
		// const height = 600;

		// svg element w/border
		svg
			.attr('width', svgWidth)
			.attr('height', svgHeight);
		svg.append('rect')
			.attr('class', 'background')
			.attr('x', 0)
			.attr('y', 30)
			.attr('width', svgWidth)
			.attr('height', dayHeight);

		const nestedData = d3.nest()
			.key(function(d) { return d.dayOfWeek; })
			.entries(response.data);

		// create each day group
		const dayG = svg.selectAll('g.day')
				.data(nestedData)
				.enter()
			.append('g')
				.attr('class', 'day')
				.attr('transform', function(d, i) { return 'translate('+(i*dayWidth)+', 0)'; });

		// day titles
		dayG.append('text')
			.attr('class', 'day')
			.attr('x', dayWidth / 2)
			.attr('y', 20)
			.attr('text-anchor', 'middle')
			.text(function(d) { return d.key });

		const daySquareG = dayG.append('g')
			.attr('transform', 'translate(0, 30)');
		
		daySquareG.each(function(g, dayIndex) {

			// y-scale for the current day
			let domainStart = moment().day(dayIndex).startOf('day').toDate();
			let domainEnd = moment().day(dayIndex).endOf('day').toDate();
			let yScale = d3.scaleTime()
				.domain([domainStart, domainEnd])
				.range([0, dayHeight]);

			// create time block rects
			d3.select(this)
				.selectAll('rect.time-block')
					.data(function(g, i) { return g.values; })
					.enter()
				.append('rect')
					.attr('class', function(d) { return 'time-block '+timeBlockColorClass(d); })
					.attr('x', 0)
					.attr('y', function(d) {
						const blockStartTime = moment({hour: d.startHour, minute: d.startMinute}).day(dayIndex).toDate();
						return yScale(blockStartTime);
					})
					.attr('rx', 8)
					.attr('ry', 8)
					.attr('width', dayWidth)
					.attr('height', function(d) {
						const blockStartTime = moment({hour: d.startHour, minute: d.startMinute}).day(dayIndex).toDate();
						const blockEndTime = moment({hour: d.endHour, minute: d.endMinute}).day(dayIndex).toDate();
						const rectStart = yScale(blockStartTime);
						const rectEnd = yScale(blockEndTime);
						return rectEnd - rectStart;
					});
		});

		// create each day square
		daySquareG.append('rect')
			.attr('class', 'day')
			.attr('x', 0)
			.attr('y', 0)
			.attr('width', dayWidth)
			.attr('height', dayHeight);
	}

	function timeBlockColorClass(timeBlock) {
		if (timeBlock.isReceivingTexts) {
			if (timeBlock.isReceivingCalls) {
				return 'text-and-call';
			} else {
				return 'text-only';
			}
		} else {
			if (timeBlock.isReceivingCalls) {
				return 'call-only';
			} else {
				return 'no-text-or-call';
			}
		}
	}

})();