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

		if ($isPostRequest) $response = self::determineAction();
		else if ($isPutRequest) $response = self::edit();
		else if ($isDeleteRequest) $response = self::delete();

		if (!is_null($response))
			echo $response;
	}

	private static function determineAction() {
		$_POST = json_decode(file_get_contents('php://input'), true);

		if (!isset($_POST))
			return self::jsonError('Unable to determine time block action: missing post data');

		if (is_array($_POST))
			return self::executeMixedOperations();

		return self::add();
	}

	/** Stores a new time block created from POST data. Returns a json response
	 * indicating sucess or failure. The new time block is also returned
	 * in the json, with it's automatically assigned ID included. This will be
	 * needed in future requests to access the new time block. */
	private static function add($args = NULL) {
		if (is_null($args))
			$args = $_POST;
		
		if (!isset($args['profileID']))
			$args['profileID'] = WeeklyContactProfilesDB::getActiveProfileID($_SESSION['user']->getUserID());

		$timeBlock = new WeeklyTimeBlock($args);
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
	private static function edit($args = NULL) {
		// make sure url contains a time block ID number
		// if (!isset($_SESSION['resourceID']))
		// 	return self::jsonError('Cannot edit weekly time block: missing blockID');
		// if (!is_numeric($_SESSION['resourceID']))
		// 	return self::jsonError('Cannot edit weekly time block: blockID is not a valid number');

		if (is_null($args))
			$args = json_decode(file_get_contents('php://input'), true);

		if (!isset($args))
			return self::jsonError('Cannot edit weekly time block: missing post data');
		// $_PUT['blockID'] = $_SESSION['resourceID'];

		$timeBlock = new WeeklyTimeBlock($args);
		if ($timeBlock->getErrorCount() > 0)
			return self::jsonError('Time block validation error during edit');

		WeeklyTimeBlocksDB::edit($timeBlock);
		if ($timeBlock->getErrorCount() > 0)
			return self::jsonError('Failed to edit time block in database');

		return self::jsonResponse(true);
	}

	/** Deletes the time block with the given ID specified in the DELETE request url.
	 * Returns a json response indicating success or failure. */
	private static function delete($blockID = NULL) {
		if (is_null($blockID))
			$blockID = $_SESSION['resourceID'];
		if (!isset($blockID))
			return self::jsonError('Cannot delete weekly time block: missing blockID');
		if (!is_numeric($blockID))
			return self::jsonError('Cannot delete weekly time block: blockID is not a valid number');

		// $blockID = $_SESSION['resourceID'];
		$success = WeeklyTimeBlocksDB::delete($blockID);
		if (!$success)
			return self::jsonError('An error occurred while attempting to delete weekly time block');

		return self::jsonResponse(true);
	}

	private static function executeMixedOperations() {
		foreach ($_POST as $operation) {
			switch ($operation['method']) {
				case 'POST': self::add($operation['body']); break;
				case 'GET': self::get($operation['body']); break;
				case 'PUT': self::edit($operation['body']); break;
				case 'DELETE': self::delete($operation['body']); break;
			}
		}
	}
}
?>