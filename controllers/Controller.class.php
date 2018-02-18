<?php
abstract class Controller {
	protected static function redirect($control = '', $alertType = 'info', $message = null) {
		if (!is_null($message)) {
			$_SESSION['alertType'] = $alertType;
			$_SESSION['flash'] = $message;
		}
		if (!empty($control))
			$control = '/' . $control;

		header('Location: http://' . $_SERVER['HTTP_HOST'] . $control);
	}

	protected static function jsonError($errorMessage) {
		self::jsonResponse(false, null, $errorMessage);
	}

	protected static function jsonResponse($success, $data = null, $errorMessage = null, $successMessage = null) {
		self::stripPassword($data);
		$response = new stdClass();
		$response->success = $success;

		if (!is_null($data))
			$response->data = $data;

		if (!is_null($errorMessage))
			$response->error = $errorMessage;
		
		if (!is_null($successMessage))
			$response->message = $successMessage;

		return json_encode($response, JSON_PRETTY_PRINT);
	}

	protected static function alertMessage($alertType, $alertMessage) {
		$_SESSION['alertType'] = $alertType;
		$_SESSION['flash'] = $alertMessage;
	}

	protected static function setSessionFlags($flagsArray) {
		foreach ($flagsArray as $flag)
			$_SESSION[$flag] = true;
	}

	protected static function unsetSessionFlags($flagsArray) {
		foreach ($flagsArray as $flag)
			unset($_SESSION[$flag]);
	}

	protected static function clearPostData() {
		foreach ($_POST as $key => $value)
			unset($_POST[$key]);
	}

	private static function stripPassword($data) {
		if ($data instanceof User) {
			$data->clearPassword();
		} else if (is_array($data) && count($data) > 0 && $data[0] instanceof User) {
			foreach ($data as $user)
				$user->clearPassword();
		}
	}
}
?>