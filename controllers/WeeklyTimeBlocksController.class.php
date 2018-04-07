<?php
class WeeklyTimeBlocksController extends Controller {

	public static function run() {

		if (!isset($_SESSION) || !isset($_SESSION['user'])) {
			echo self::jsonError('Session data not found.');
			return;
		}

		$isGetRequest = $_SERVER['REQUEST_METHOD'] === 'GET';
		$isPostRequest = $_SERVER['REQUEST_METHOD'] === 'POST';
		$isDeleteRequest = $_SERVER['REQUEST_METHOD'] === 'DELETE';
		$response = null;

		if ($isDeleteRequest) $response = self::delete();

		if (!is_null($response))
			echo $response;
	}

	private static function delete() {
		if (!isset($_SESSION['resourceID']))
			return self::jsonError('Cannot delete weekly time block: missing blockID');
		if (!is_numeric($_SESSION['resourceID']))
			return self::jsonError('Cannot delete weekly time block: blockID is not a valid number');

		$blockID = $_SESSION['resourceID'];
		$success = WeeklyTimeBlocksDB::delete($blockID);
		if (!$success)
			return self::jsonError('An error occurred while attempting to delete weekly time block');

		return self::jsonResponse(true);
	}
}
?>