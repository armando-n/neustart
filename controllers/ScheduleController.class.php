<?php
class ScheduleController extends Controller {

	public static function run() {

		if (!isset($_SESSION) || !isset($_SESSION['user'])) {
			echo self::jsonError('Session data not found.');
			return;
		}

		$isGetRequest = $_SERVER['REQUEST_METHOD'] === 'GET';
		$isPostRequest = $_SERVER['REQUEST_METHOD'] === 'POST';
		$response = null;

		switch ($_SESSION['action']) {
			case 'weekly':
				if     ($isGetRequest)  WeeklyScheduleView::show();
				elseif ($isPostRequest) self::jsonWeeklySchedule();
				break;
			case 'login':
				if     ($isGetRequest)  self::jsonWeeklySchedule();
				elseif ($isPostRequest) self::jsonWeeklySchedule();
				break;
			case 'logout': self::jsonWeeklySchedule(); break;
			case 'verify':
				if     ($isGetRequest)  self::jsonWeeklySchedule();
				elseif ($isPostRequest) self::jsonWeeklySchedule();
				break;
			case 'exists': $response = self::jsonWeeklySchedule(); break;
			default:
				self::redirect('home', 'danger', 'Error: Unrecognized action requested');
		}

		if (!is_null($response))
			echo $response;
	}

	private static function jsonWeeklySchedule() {
		echo "You shouldn't be here.";
	}
}
?>