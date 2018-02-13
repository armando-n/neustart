<?php
abstract class Controller {
	private static function redirect($control = '', $alertType = 'info', $message = null) {
		if (!is_null($message)) {
			$_SESSION['alertType'] = $alertType;
			$_SESSION['flash'] = $message;
		}
		if (!empty($control))
			$control = '/' . $control;
			
		header('Location: http://' . $_SERVER['HTTP_HOST'] . '/' . $_SESSION['base'] . $control);
	}
}
?>