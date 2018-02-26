<?php
class WeeklyScheduleView {

	/** Returns a JSON response containing all active weekly
	 * time blocks for the active profile of the current user. */
	public static function show() {
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

		// output json response
		echo JsonResponseService::response(true, $activeWeeklyTimeBlocks, null, 'Active weekly time blocks found.');
	}

}
?>