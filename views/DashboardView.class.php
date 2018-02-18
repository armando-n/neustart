<?php
class DashboardView {

	public static function show() {
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
<section class="row">
	<div class="col-sm-8 col-sm-offset-2 col-md-6 col-md-offset-3">
		<p>You're logged in, <?=$userName?>! Your main's name is <?=$mainName?>.</p>
	</div>
</section>
<?php
	}
}

?>