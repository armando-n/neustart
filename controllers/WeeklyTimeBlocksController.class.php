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

		if ($isPostRequest) $response = self::determinePostAction();
		else if ($isPutRequest) $response = self::edit();
		else if ($isDeleteRequest) $response = self::delete();

		if (!is_null($response))
			echo $response;
	}

	private static function determinePostAction() {
		$_POST = json_decode(file_get_contents('php://input'), true);
		if (!isset($_POST))
			return self::jsonError('Unable to determine time block action: missing post data');

		if (isset($_POST['dayOfWeek']))
			return self::add();

		return self::executeMixedOperations();
	}

	/** Stores a new time block created from POST data. Data can be manually
	 * passed in via the $args parameter. Returns a json response indicating
	 * success or failure. The new time block is also returned in the json,
	 * with it's automatically assigned ID included. This will be needed in
	 * future requests to access the new time block. */
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
	 * used to determine which time block to edit. Data can be manually passed in via the $args
	 * parameter. Returns a json response indicating success or failure. */
	private static function edit($args = NULL) {
		if (is_null($args))
			$args = json_decode(file_get_contents('php://input'), true);

		if (!isset($args))
			return self::jsonError('Unable to edit time block: missing PUT data');
		if (isset($_SESSION['resourceID']))
			$args['blockID'] = $_SESSION['resourceID'];
		if (!isset($args['blockID']))
			return self::jsonError('Cannot edit weekly time block: missing blockID');
		if (!is_numeric($args['blockID']))
			return self::jsonError('Cannot edit weekly time block: blockID is not a valid number');

		$timeBlock = new WeeklyTimeBlock($args);
		if ($timeBlock->getErrorCount() > 0)
			return self::jsonError('Time block validation error during edit');

		WeeklyTimeBlocksDB::edit($timeBlock);
		if ($timeBlock->getErrorCount() > 0)
			return self::jsonError('Failed to edit time block in database');

		return self::jsonResponse(true);
	}

	/** Deletes the time block with the given ID specified in the DELETE request url.
	 * The block to delete can be manually specified via the $blockID parameter.
	 * Returns a json response indicating success or failure. */
	private static function delete($blockID = NULL) {
		if (is_null($blockID))
			$blockID = $_SESSION['resourceID'];
		if (!isset($blockID))
			return self::jsonError('Cannot delete weekly time block: missing blockID');
		if (!is_numeric($blockID))
			return self::jsonError('Cannot delete weekly time block: blockID is not a valid number');

		$success = WeeklyTimeBlocksDB::delete($blockID);
		if (!$success)
			return self::jsonError('An error occurred while attempting to delete weekly time block');

		return self::jsonResponse(true);
	}

	/**   */
	private static function executeMixedOperations() {
		if (!isset($_POST) || !is_array($_POST) || count($_POST) <= 0)
			return self::jsonError('Cannot perform mixed operations: post data missing or invalid.');

		$nestedResponses = array();
		foreach ($_POST as $operation) {
			switch ($operation['method']) {
				case 'POST': $nestedResponses[] = json_decode(self::add($operation['body'])); break;
				case 'GET': $nestedResponses[] = json_decode(self::get($operation['body'])); break;
				case 'PUT': $nestedResponses[] = json_decode(self::edit($operation['body'])); break;
				case 'DELETE': $nestedResponses[] = json_decode(self::delete($operation['body'])); break;
			}
		}

		// create and return json response
		$responseData = new stdClass();
		$responseData->responses = $nestedResponses;
		$responseData->schedule = WeeklyScheduleView::show(false);
		$response = self::jsonResponse(true, $responseData, null, 'Copy completed. Check nested responses for any errors.');

		return $response;
	}
}
?>