<?php
class DashboardView {

	public static function show() {
		$_SESSION['styles'][] = 'Dashboard.css';
		$_SESSION['scripts'][] = 'polyfils.js';
		$_SESSION['localScripts'][] = 'd3/build/d3.js';
		$_SESSION['localScripts'][] = 'moment/moment.js';
		$_SESSION['scripts'][] = 'Dashboard.js';
		HeaderView::show("Dashboard");
		DashboardView::showBody();
		FooterView::show();
	}

	public static function showBody() {
		if (isset($_SESSION['user'])) {
			$userName = $_SESSION['user']->getUserName() . ', ';
			$mainName = $_SESSION['user']->getMainName();
		} else {
			$userName = '';
			$mainName = 'unknown';
		}
		?>
<div class="container-fluid">
	<section class="row justify-content-center">
		<div class="col">
			<p>You're logged in, <?=$userName?>! Your main's name is <?=$mainName?>.</p>
			<div>
				<svg id="svg"></svg>
			</div>
		</div>
	</section>
</div>
<?php
	}
}

?>