<?php
class UsersController extends Controller {

	public static function run() {

		if (!isset($_SESSION) || !isset($_SESSION['base'])) {
			?>Error: session data not found.<?php
			return;
		}

		if (!isset($_SESSION['action'])) {
			self::redirect('home', 'danger', 'Error: Unrecognized command');
			return;
		}

		$isGetRequest = $_SERVER['REQUEST_METHOD'] === 'GET';
		$isPostRequest = $_SERVER['REQUEST_METHOD'] === 'POST';
		$response = null;

		switch ($_SESSION['action']) {
			case 'signup':
				if     ($isGetRequest)  self::showSignupView();
				elseif ($isPostRequest) self::signup();
				break;
			case 'login':
				if     ($isGetRequest)  self::showLoginView();
				elseif ($isPostRequest) self::login();
				break;
			case 'logout': self::logout(); break;
			case 'verify':
				if     ($isGetRequest)  self::showVerificationView();
				elseif ($isPostRequest) self::verify();
				break;
			case 'exists': $response = self::userExists(); break;
			default:
				self::redirect('home', 'danger', 'Error: Unrecognized action requested');
		}

		if (!is_null($response))
			echo $response;
	}

	private static function showSignupView() {
		if (isset($_SESSION['user'])) {
			$user = $_SESSION['user'];
			if (!$user->isPhoneVerified()) {
				if ($user->isVerified()) { // unverified number, verified user: show verification view, perhaps w/message allowing them to skip phone number verification
					self::alertMessage('info', 'You are a verified user. However, your phone number is still unverified.');
					$flags = array('autosend', 'showSkipButton');
					self::setSessionFlags($flags);
					VerificationView::show();
					self::unsetSessionFlags($flags);
				} else { // unverified number, unverified user: show signup view
					VerificationView::show();
				}
			} else {
				if ($user->isVerified()) { // verified number, verified user: show dashboard
					DashboardView::show();
				} else { // verified number, unverified user: show wait-for-armando-to-verify-you view (dashboard w/if?)
					$flags = array('unverifiedPhone');
					self::setSessionFlags($flags);
					self::alertMessage('warning', "Your phone number is verified. However, this site is for private use, so your account must be manually verified. Contact support. If you don't know who that is, then this site isn't for you.");
					DashboardView::show();
					self::unsetSessionFlags($flags);
				}
			}
		} else { // user is not logged in. display the signup form.
			SignupView::show();
		}
	}

	private static function showVerificationView() {
		if (isset($_SESSION['user'])) {
			$user = $_SESSION['user'];
			if (!$user->isPhoneVerified()) {
				VerificationView::show();
			} else {
				self::alertMessage('warning', "Your phone number is verified. However, this site is for private use, so your account must be manually verified. Contact support. If you don't know who that is, then this site isn't for you.");
				DashboardView::show();
			}
		} else { // user is not logged in. display the login form.
			LoginView::show();
		}
	}

	private static function showLoginView() {
		if (isset($_SESSION['user'])) {
			$user = $_SESSION['user'];
			if (!$user->isPhoneVerified()) {
				VerificationView::show();
			} else {
				self::alertMessage('warning', "Your phone number is verified. However, this site is for private use, so your account must be manually verified. Contact support. If you don't know who that is, then this site isn't for you.");
				DashboardView::show();
			}
		} else { // user is not logged in. display the login form.
			LoginView::show();
		}
	}

	private static function login() {
		if (!isset($_POST) || !isset($_POST['userName']) || !isset($_POST['password'])) {
			self::alertMessage('danger', 'Error: Login data not found. Try again.');
			LoginView::show();
			return;
		}
		$user = UsersDB::getUserByName($_POST['userName']);

		// user name not found or wrong password
		if (is_null($user) || !$user->verifyPassword($_POST['password'])) {
			self::alertMessage('danger', 'Login failed. User name or password incorrect.');
			$_SESSION['userName'] = $_POST['userName'];
			LoginView::show();
			unset($_SESSION['userName']);
			return;
		}

		// login successful
		$_SESSION['user'] = $user;
		self::clearPostData();
		self::alertMessage('success', 'Welcome back, ' . $user->getUserName() . '!');
		DashboardView::show();
	}

	private static function logout() {
		// end session (but keep base)
		$base = $_SESSION['base'];
		$dbName = $_SESSION['dbName'];
		$configFile = $_SESSION['configFile'];
		session_destroy();
		session_regenerate_id(true);

		// start new session
		session_start();
		$_SESSION['base'] = $base;
		$_SESSION['dbName'] = $dbName;
		$_SESSION['configFile'] = $configFile;
		$_SESSION['styles'] = array();
		$_SESSION['scripts'] = array();
		$_SESSION['libraries'] = array();
		self::redirect('home', 'success', 'You have been successfully logged out');
	}

	/** Validates POST data and creates a new user if the given user name is available.
	 * On success, a verification code is sent via text message to the given phone number, and
	 * the phone number verification page is displayed. On failure, the signup view is displayed. */
	private static function signup() {
		$user = new User($_POST);
		$_SESSION['badUser'] = new User($user->getParameters()); // used by view to temporarily store signup form input
		$_SESSION['badUser']->setErrors($user->getErrors());
		$_SESSION['badUser']->clearPassword();

		// check for validation errors
		if ($user->getErrorCount() > 0) {
			self::alertMessage('danger', 'One or more fields contained errors. Check below for details. Make any needed corrections and try again.');
			SignupView::show();
			return;
		}

		// make sure user name is not already taken
		if (UsersDB::userExists($user->getUserName())) {
			self::alertMessage('danger', 'User name already exists. You must choose another.');
			SignupView::show();
			return;
		}

		// make sure main character name is not already taken
		if (UsersDB::mainExists($user->getMainName())) {
			self::alertMessage('danger', 'The main character name is already associated with another user.');
			SignupView::show();
			return;
		}

		// user name available. send add request to database and check for success
		UsersDB::addUser($user);
		if ($user->getErrorCount() > 0) {
			self::alertMessage('danger', 'Failed to add user to database. Contact support.');
			SignupView::show();
			return;
		}

		// user is valid and should be logged in at this point
		unset($_SESSION['badUser']);
		$_SESSION['user'] = $user;

		// create a random verification code, text it to the user's phone, and display verification page
		TextMessageController::sendVerificationCode();
		VerificationView::show();
	}

	/** Verifies that the code given in POST data matches the code stored for the
	 * current user. On success, the user's phone number is marked as verified, and
	 * the dashboard view is displayed. */
	private static function verify() {
		// create code object for the given code we will be verifying
		if (!isset($_SESSION['user'])) {
			self::alertMessage('danger', 'Unable to find session user data. Try logging out and logging in again.');
			VerificationView::show();
			return;
		}
		$userID = $_POST['userID'] = $_SESSION['user']->getUserID();
		$code = new VerificationCode($_POST);

		// load and validate expected code from database
		$codeInDatabase = VerificationCodesDB::get($userID);
		if (is_null($codeInDatabase)) {
			self::alertMessage('danger', 'No active verification code found. Your code may have expired. Click "Resend Code" to send a new code to your phone.');
			VerificationView::show();
			return;
		}

		// compare given/expected codes
		if ($code->getCode() !== $codeInDatabase->getCode()) {
			self::alertMessage('danger', 'The code you entered is incorrect. Please check your code and try again.');
			VerificationView::show();
			return;
		}

		// verification successful. mark phone number as verified
		$user = UsersDB::getUser($userID);
		$user->setIsPhoneVerified(true);
		UsersDB::edit($user);
		$_SESSION['user'] = $user;

		// clean up and show dashboard
		VerificationCodesDB::clear($userID);
		DashboardView::show();
	}

	/** Returns a json response of true if the user with the user name given in
	 * GET data exists in the database, or false otherwise. The response is
	 * returned as json. */
	private static function userExists() {
		if (!isset($_GET) || !isset($_GET['userName']))
			return self::jsonError('User name missing from request.');

		// make sure user name is not already taken
		if (UsersDB::userExists($_GET['userName']))
			return self::jsonResponse(true, true, null, 'User name already exists.');

		return self::jsonResponse(true, false, null, 'User name does not exist.');
	}
}
?>