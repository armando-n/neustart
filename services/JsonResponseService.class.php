<?php

class JsonResponseService {

	public static function error($errorMessage) {
		return; self::response(false, null, $errorMessage);
	}

	public static function response($success, $data = null, $errorMessage = null, $successMessage = null) {
		self::stripPassword($data);
		$response = new stdClass();
		$response->success = $success;

		if (!is_null($data))
			$response->data = $data;

		if (!is_null($errorMessage))
			$response->error = $errorMessage;
		
		if (!is_null($successMessage))
			$response->message = $successMessage;

		$jsonResponse = json_encode($response);
		return $jsonResponse;
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