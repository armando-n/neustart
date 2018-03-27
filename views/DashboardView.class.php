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
	<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
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
					<label for="startTime" class="time-label">Start</label>
					<input id="startTime" type="time" name="startTime" size="8" autofocus="autofocus" required="required" maxlength="12" pattern="^([0]?[1-9]|[1][0-2])$" title="Enter a valid time (HH:MM XM)" />
				</div>
				<div class="input-group">
					<label for="endTime" class="time-label">End</label>
					<input id="endTime" type="time" name="endTime" size="8" autofocus="autofocus" required="required" maxlength="12" pattern="^([0]?[1-9]|[1][0-2])$" title="Enter a valid time (HH:MM XM)" />
				</div>
			</fieldset>
			<fieldset>
				<legend>I'd like to receive...</legend>
				<div id="text-settings" class="input-group">
					<span id="texts-button" class="toggle-button">Texts</span>
					<span id="texts-repeat-button" class="toggle-button">Repeat</span>
					<span id="texts-repeat-duration-group">for <input type="number" id="textRepeatDuration" name="textRepeatDuration" class="number" min="0" inputmode="numeric" size="2" maxlength="2" pattern="[0-9]*" title="Enter a number from 0-99" /> mins</span>
				</div>
				<div id="call-settings" class="input-group">
					<span id="calls-button" class="toggle-button">Calls</span>
					<span id="calls-repeat-button" class="toggle-button">Repeat</span>
					<span id="calls-repeat-duration-group">for <input type="number" id="callRepeatDuration" name="callRepeatDuration" class="number" min="0" inputmode="numeric" size="2" maxlength="2" pattern="[0-9]*" title="Enter a number from 0-99" /> mins</span>
				</div>
			</fieldset>
			<fieldset>
				<legend>Comment</legend>
				<textarea id="comment" name="comment" cols="18" rows="3"></textarea>
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