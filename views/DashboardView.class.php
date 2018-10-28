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
	<!-- <script src="https://d3js.org/d3.v4.min.js"></script> -->
	<script src="/js/d3.v4.min.js"></script>
	<script src="/js/moment.min.js"></script>
	<!-- <script src="https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.22.0/moment.min.js"></script> -->
	<link href="https://fonts.googleapis.com/css?family=Copse|Crimson+Text|Kameron|Lato|Open+Sans|Roboto|Roboto+Condensed|Varela+Round" rel="stylesheet">
	<link rel="stylesheet" href="/css/dashboard.css" type="text/css" />
</head>
<body>

	<div id="top-section">
		<div id="toolbar">
			<div id="scroll-days-left-button"><</div>
			<div id="toolbar-buttons">
				<button id="toolbar-fill" class="toggle-button" type="button">Fill</button>
				<button id="toolbar-cancel" class="toggle-button" type="button">Cancel</button>
				<button id="toolbar-copy" class="toggle-button" type="button">Copy</button>
				<button id="toolbar-paste" class="toggle-button" type="button">Paste</button>
				<input id="copy-overwrite" type="checkbox">
				<label for="copy-overwrite">Overwrite all</label>
				<button id="toolbar-delete" class="toggle-button" type="button">Delete</button>
				<button id="toolbar-split" class="toggle-button" type="button">Split</button>
				<button id="toolbar-add" class="toggle-button" type="button">Add</button>
			</div>
			<div id="scroll-days-right-button">></div>
			<div id="debug-mode"></div>
		</div>

		<div id="messages-to-user"></div>

		<div class="svg-wrapper">
			<svg id="svg">
				<defs>
					<radialGradient id="radial-gradiant-new-rect" fx="5%" fy="5%" cx="35%" cy="25%" r="85%" spreadMethod="pad">
						<stop offset="0%" />
						<stop offset="100%" />
					</radialGradient>
					<radialGradient id="radial-gradiant-text-and-call" fx="5%" fy="5%" cx="35%" cy="25%" r="85%" spreadMethod="pad">
						<stop offset="0%" />
						<stop offset="100%" />
					</radialGradient>
					<radialGradient id="radial-gradiant-text-only" fx="5%" fy="5%" cx="35%" cy="25%" r="85%" spreadMethod="pad">
						<stop offset="0%" />
						<stop offset="100%" />
					</radialGradient>
					<radialGradient id="radial-gradiant-call-only" fx="5%" fy="5%" cx="35%" cy="25%" r="85%" spreadMethod="pad">
						<stop offset="0%" />
						<stop offset="100%" />
					</radialGradient>
				</defs>
			</svg>
		</div>
	</div>

	<div id="block-detail-modal">
		<span id="close-modal" class="close-button">x</span>
		<div class="modal-title"></div>
		<form id="timeblock-form" action="/time-block/details">
			<fieldset>
				<div class="input-group">
					<!-- <label for="startTime" class="time-label">Start</label> -->
					<!-- <input id="startTime" type="time" name="startTime" size="8" required="required" title="Enter a valid time (HH:MM XM)" /> -->
				</div>
				<div class="input-group">
					<!-- <label for="endTime" class="time-label">End</label> -->
					<!-- <input id="endTime" type="time" name="endTime" size="8" required="required" title="Enter a valid time (HH:MM XM)" /> -->
				</div>
			</fieldset>
			<fieldset>
				<legend>I'd like to receive...</legend>
				<div id="text-settings" class="input-group">
					<span id="texts-button" class="toggle-button">Texts</span>
					<span id="texts-repeat-button" class="toggle-button">Repeat</span>
					<span id="texts-repeat-duration-group">for <input type="number" id="repeatTextDuration" name="repeatTextDuration" class="number" min="0" inputmode="numeric" size="2" maxlength="2" pattern="[0-9]*" title="Enter a number from 0-99" /> mins</span>
				</div>
				<div id="call-settings" class="input-group">
					<span id="calls-button" class="toggle-button">Calls</span>
					<span id="calls-repeat-button" class="toggle-button">Repeat</span>
					<span id="calls-repeat-duration-group">for <input type="number" id="repeatCallDuration" name="repeatCallDuration" class="number" min="0" inputmode="numeric" size="2" maxlength="2" pattern="[0-9]*" title="Enter a number from 0-99" /> mins</span>
				</div>
			</fieldset>
			<fieldset>
				<!-- <legend>Comment</legend>
				<textarea id="comment" name="comment" cols="18" rows="3"></textarea>
				<input id="blockID" type="hidden" name="blockID" />
				<input id="dayOfWeek" type="hidden" name="dayOfWeek" /> -->
			</fieldset>
			<fieldset>
				<!-- <div id="modal-buttons">
					<input type="submit" value="Save" />
					<input type="button" value="Cancel" />
				</div> -->
			</fieldset>
		</form>
	</div>

	<div class="modal-container">

		<div id="block-time-modal" class="modal">
			<form id="block-time-form" action="/time-block/details">
				<fieldset>
					<div class="input-group">
						<label for="startTime" class="time-label">From</label>
						<input id="startTime" type="time" name="startTime" size="8" required="required" title="Enter a valid time (HH:MM XM)" />
					</div>
					<div class="input-group">
						<label for="endTime" class="time-label">To</label>
						<input id="endTime" type="time" name="endTime" size="8" required="required" title="Enter a valid time (HH:MM XM)" />
					</div>
				</fieldset>
				<div class="modal-buttons">
					<button type="submit" class="push-button">Save</button>
					<button type="button" class="push-button secondary">Cancel</button>
				</div>
			</form>
		</div>

		<div id="block-note-modal" class="modal">
			<form id="block-note-form" action="/">
				<fieldset>
					<div>
						<label for="note">Note</label>
						<textarea id="note" name="comment" cols="25" rows="5"></textarea>
					</div>
				</fieldset>
				<div class="modal-buttons">
					<button type="submit" class="push-button">Save</button>
					<button type="button" class="push-button secondary">Cancel</button>
				</div>
			</form>
		</div>

		<div id="confirm-modal" class="modal">
			<div class="modal-message">You sure? Delete?</div>
			<div class="modal-buttons">
				<button id="confirm" type="button" class="push-button">Yes</button>
				<button id="deny" type="button" class="push-button secondary">No</button>
			</div>
		</div>

	</div>

	<script src="/dist/js/dashboard.js"></script>
</body>
</html>
<?php
	}
}

?>