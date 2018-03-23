<?php
class DashboardView {

	public static function show() {
		DashboardView::showBody();
	}

	public static function showBody() {
		?>
<!doctype html>
<html lange="en">
<head>
	<meta charset="utf-8">
	<title>Neustart | Dashboard</title>
	<script src="https://d3js.org/d3.v4.min.js"></script>
	<script src="/dist/js/Dashboard.js"></script>
	<link rel="stylesheet" href="/css/Dashboard.css" type="text/css" />
</head>
<body>
	<div class="svg-wrapper">
		<svg id="svg"></svg>
	</div>
</body>
</html>
<?php
	}
}

?>