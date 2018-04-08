<?php
include_once("includer.php");

main();

function main() {
	try {
	// if (ob_get_contents() === false)
	//     ob_start();\

	initSession();

	parseUrl();

	loadRequestedController();

	//ob_end_flush();
	} catch (Exception $e) {
		$_SESSION['flash'] = 'Unable to complete request: An unexpected error occured.';
		HomeView::show();
	}
}

function initSession() {
	if (!isset($_SESSION)) {
		session_start();
		$_SESSION['styles'] = array();
		$_SESSION['scripts'] = array();
		$_SESSION['localScripts'] = array();
		$_SESSION['remoteLibraries'] = array();
		$_SESSION['dbName'] = 'neustart';
		$_SESSION['configFile'] = 'myConfig.ini';
	}
	$_SESSION['base'] = '';
}

function parseUrl() {
	// break up the url
	$url = parse_url($_SERVER["REQUEST_URI"], PHP_URL_PATH); // e.g. /dhma/home or /dhma/signup_show
	$urlParts = preg_split("/\//", $url, null, PREG_SPLIT_NO_EMPTY);
	$urlPartsLength = count($urlParts);

	// determine control, if any
	if ($urlPartsLength > 0) {
		$control = $urlParts[0];
		if ( ($hashPos = strrpos($control, '#')) !== false)
			$control = substr($control, 0, $hashPos);
			$_SESSION['control'] = $control;
	} else
		unset($_SESSION['control']);

	// determine action, if any
	if ($urlPartsLength > 1) {
		$action = $urlParts[1];
		$_SESSION['action'] = $_SESSION['resourceID'] = $action;
	} else
		$_SESSION['action'] = '';

	// process any arguments
	$_SESSION['arguments'] = array();
	if ($urlPartsLength > 2) {
		for ($i = 2; $i < $urlPartsLength; $i++)
			$_SESSION['arguments'][] = $urlParts[$i];
	}
}

function loadRequestedController() {
	switch ($_SESSION['control'] ?? '') {
		case 'user': UsersController::run(); break;
		case 'dashboard': DashboardView::show(); break;
		case 'text': TextMessageController::run(); break;
		case 'call': PhoneCallController::run(); break;
		case 'schedule': ScheduleController::run(); break;
		case 'weeklytimeblocks': WeeklyTimeBlocksController::run(); break;
		case "home":
		default:
			$_SESSION['styles'] = array('HomeStyles.css');
			HomeView::show();
	}
}

?>