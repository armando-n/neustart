<?php
try {
// if (ob_get_contents() === false)
//     ob_start();
include_once("includer.php");
if (!isset($_SESSION)) {
    session_start();
    $_SESSION['styles'] = array();
    $_SESSION['scripts'] = array();
    $_SESSION['libraries'] = array();
    $_SESSION['dbName'] = 'neustart';
    $_SESSION['configFile'] = 'myConfig.ini';
}

$_SESSION['base'] = '';

// parse the request URL
$url = parse_url($_SERVER["REQUEST_URI"], PHP_URL_PATH); // e.g. /dhma/home or /dhma/signup_show
$urlParts = preg_split("/\//", $url, null, PREG_SPLIT_NO_EMPTY);
$urlPartsLength = count($urlParts);

// determine control, if any
if ($urlPartsLength > 1) {
	$control = $urlParts[0];
	if ( ($hashPos = strrpos($control, '#')) !== false)
		$control = substr($control, 0, $hashPos);
	$_SESSION['control'] = $control;
} else {
	$control = "none";
	unset($_SESSION['control']);
}

// $_SESSION['base'] = $urlParts[0];

// determine action, if any
if ($urlPartsLength > 1) {
	$action = $urlParts[1];
	$_SESSION['action'] = $action;
} else
	unset($_SESSION['control']);

// process any arguments
$arguments = array();
if ($urlPartsLength > 2) {
	for ($i = 2; $i < $urlPartsLength; $i++)
		$arguments[] = $controlParts[$i];
	$_SESSION['arguments'] = $arguments;
} else {
	unset($_SESSION['arguments']);
}

// run the requested controller
switch ($control) {
	case 'admin' : AdministratorController::run(); break;
	case "login" : LoginController::run(); break;
	case "logout" : LoginController::run(); break;
	case "profile" : ProfileController::run(); break;
	case "signup" : SignupController::run(); break;
	case "measurements" : MeasurementsController::run(); break;
	case 'measurementsOptions' : MeasurementsOptionsController::run(); break;
	case "members_show" :
	case "users" :
	case "members" : UsersController::run(); break;
	case "faq" : FaqView::show(); break;
	case "demo" : DemoController::run(); break;
    case "home":
    default:
        $_SESSION['styles'] = array('HomeStyles.css');
        HomeView::show();
}

//ob_end_flush();
} catch (Exception $e) {
    $_SESSION['flash'] = 'Unable to complete request: An unexpected error occured.';
    HomeView::show();
}
?>