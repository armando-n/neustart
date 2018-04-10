<?php
class WeeklyTimeBlocksController extends Controller {

	public static function run() {

		if (!isset($_SESSION) || !isset($_SESSION['user'])) {
			echo self::jsonError('Session data not found.');
			return;
		}

		$isGetRequest = $_SERVER['REQUEST_METHOD'] === 'GET';
		$isPutRequest = $_SERVER['REQUEST_METHOD'] === 'PUT';
		$isPostRequest = $_SERVER['REQUEST_METHOD'] === 'POST';
		$isDeleteRequest = $_SERVER['REQUEST_METHOD'] === 'DELETE';
		$response = null;

		if ($isPostRequest) $response = self::add();
		else if ($isPutRequest) $response = self::edit();
		else if ($isDeleteRequest) $response = self::delete();

		if (!is_null($response))
			echo $response;
	}

	/** Stores a new time block created from POST data. Returns a json response
	 * indicating sucess or failure. The new time block is also returned
	 * in the json, with it's automatically assigned ID included. This will be
	 * needed in future requests to access the new time block. */
	private static function add() {
		$_POST = json_decode(file_get_contents('php://input'), true);

		if (!isset($_POST))
			return self::jsonError('Cannot add weekly time block: missing post data');

		if (!isset($_POST['profileID']))
			$_POST['profileID'] = WeeklyContactProfilesDB::getActiveProfileID($_SESSION['user']->getUserID());

		$timeBlock = new WeeklyTimeBlock($_POST);
		if ($timeBlock->getErrorCount() > 0)
			return self::jsonError('Time block validation error durating add');

		WeeklyTimeBlocksDB::add($timeBlock);
		if ($timeBlock->getErrorCount() > 0)
			return self::jsonError('Failed to store time block in database');

		return self::jsonResponse(true, $timeBlock);
	}

	/** Edits the time block in the database using PUT data. The blockID in the PUT data is
	 * used to determine which time block to edit. Returns a json response indicating sucess or
	 * failure. */
	private static function edit() {
		// make sure url contains a time block ID number
		if (!isset($_SESSION['resourceID']))
			return self::jsonError('Cannot delete weekly time block: missing blockID');
		if (!is_numeric($_SESSION['resourceID']))
			return self::jsonError('Cannot delete weekly time block: blockID is not a valid number');

		$_PUT = json_decode(file_get_contents('php://input'), true);

		if (!isset($_PUT))
			return self::jsonError('Cannot edit weekly time block: missing post data');
		$_PUT['blockID'] = $_SESSION['resourceID'];

		$timeBlock = new WeeklyTimeBlock($_PUT);
		if ($timeBlock->getErrorCount() > 0)
			return self::jsonError('Time block validation error during edit');

		WeeklyTimeBlocksDB::edit($timeBlock);
		if ($timeBlock->getErrorCount() > 0)
			return self::jsonError('Failed to edit time block in database');

		return self::jsonResponse(true);
	}

	/** Deletes the time block with the given ID specified in the DELETE request url.
	 * Returns a json response indicating success or failure. */
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