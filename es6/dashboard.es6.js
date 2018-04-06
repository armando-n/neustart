import 'babel-polyfill';
import WeeklySchedule from './weekly-schedule-model.es6.js';
import * as svgService from './dashboard-svg-service.es6.js';

window.addEventListener('load', init);

function init() {
	history.pushState({}, '', '/dashboard');

	// fetch & process weekly schedule data, then create schedule svg
	d3.json('/schedule/weekly', (error, response) =>
		svgService.createSvg(new WeeklySchedule(response.data))
	);
}