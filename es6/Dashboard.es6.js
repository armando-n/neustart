import 'babel-polyfill';
import * as svgService from './DashboardSvgService.es6.js';

window.addEventListener('load', init);

function init() {
	history.pushState({}, '', '/dashboard');

	// fetch weekly schedule data, then create schedule svg
	d3.json('/schedule/weekly', svgService.createSVG);
}