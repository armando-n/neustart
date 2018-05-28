<?php
class WeeklyScheduleView {

	/** Returns a JSON response containing all active weekly
	 * time blocks for the active profile of the current user.
	 * if $echoOutput is given and false, the array of active
	 * weekly time blocks is returned directly instead. */
	public static function show($echoOutput = true) {
		header("Content-Type: application/json; charset=UTF-8");

		// make sure user exists in session data
		if (!isset($_SESSION) || !isset($_SESSION['user'])) {
			echo JsonResponseService::error('Session data not found.');
			return;
		}
		$userID = $_SESSION['user']->getUserID();

		// retrieve time blocks from database
		$activeWeeklyTimeBlocks = WeeklyTimeBlocksDB::getAllActiveByUser($userID);
		if (empty($activeWeeklyTimeBlocks)) {
			echo JsonResponseService::response(true, null, null, 'No active profile found.');
			return;
		}

		// output or return json response
		$jsonResponse = JsonResponseService::response(true, $activeWeeklyTimeBlocks, null, 'Active weekly time blocks found.');
		if ($echoOutput)
			echo $jsonResponse;
		else
			return $activeWeeklyTimeBlocks;
	}

}
?>