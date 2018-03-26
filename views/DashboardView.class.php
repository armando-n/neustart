<?php
class DashboardView {

	public static function show() {
		DashboardView::showBody();
	}

	public static function showBody() {
		?>
<!doctype html>
<html lang="en">
<head>
	<meta charset="utf-8">
	<title>Neustart | Dashboard</title>
	<script src="https://d3js.org/d3.v4.min.js"></script>
	<link rel="stylesheet" href="/css/Dashboard.css" type="text/css" />
</head>
<body>

	<div class="svg-wrapper">
		<svg id="svg"></svg>
	</div>

	<div class="block-detail-modal">
		<span id="close-modal" class="close-button">x</span>
		<div class="modal-title">
			Edit Time Block
		</div>
		<form action="/time-block/details">
			<fieldset>
				<div class="input-group">
					<span class="time-label">Start</span>
					<input id="startHour" type="text" name="startHour" class="number" size="2" autofocus="autofocus" required="required" maxlength="2" pattern="^([0]?[1-9]|[1][0-2])$" title="Enter a valid hour (1-12)" />
					<span class="time-colon">:</span>
					<input id="startMinute" type="text" name="startMinute" class="number" size="2" required="required" maxlength="2" pattern="^([0-5]\d)$" title="Enter a valid minute (0-59)" />
					<select id="startMeridiem" name="startMeridiem">
						<option selected="selected">am</option>
						<option>pm</option>
					</select>
				</div>
				<div class="input-group">
					<span class="time-label">End</span>
					<input id="endHour" type="text" name="endHour" class="number" size="2" autofocus="autofocus" required="required" maxlength="2" pattern="^([0]?[1-9]|[1][0-2])$" title="Enter a valid hour (1-12)" />
					<span class="time-colon">:</span>
					<input id="endMinute" type="text" name="endMinute" class="number" size="2" required="required" maxlength="2" pattern="^([0-5]\d)$" title="Enter a valid minute (0-59)" />
					<select id="endMeridiem" name="endMeridiem">
						<option selected="selected">am</option>
						<option>pm</option>
					</select>
				</div>
			</fieldset>
			<fieldset>
				<legend>I'd like to receive...</legend>
				<div id="text-settings" class="input-group">
					<span id="texts-button" class="toggle-button">Texts</span>
					<span id="texts-repeat-button" class="toggle-button">Repeat</span>
					<span id="texts-repeat-duration-group">for <input type="text" id="textRepeatDuration" name="textRepeatDuration" class="number" size="2" maxlength="2" pattern="^\d\d?$" title="Enter a number from 0-99" /> mins</span>
				</div>
				<div id="call-settings" class="input-group">
					<span id="calls-button" class="toggle-button">Calls</span>
					<span id="calls-repeat-button" class="toggle-button">Repeat</span>
					<span id="calls-repeat-duration-group">for <input type="text" id="callRepeatDuration" name="callRepeatDuration" class="number" size="2" maxlength="2" pattern="^\d\d?$" title="Enter a number from 0-99" /> mins</span>
				</div>
			</fieldset>
			<fieldset>
				<legend>Comment</legend>
				<textarea id="comment" name="comment" cols="21" rows="3"></textarea>
			</fieldset>
			<fieldset>
				<div id="modal-buttons">
					<input type="submit" value="Save" />
					<input type="button" value="Cancel" />
				</div>
			</fieldset>
		</form>
	</div>

	<script src="/dist/js/Dashboard.js"></script>
</body>
</html>
<?php
	}
}

?>