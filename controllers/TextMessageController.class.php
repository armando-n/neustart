<?php
require_once('vendor'.DIRECTORY_SEPARATOR.'autoload.php');
use Twilio\Rest\Client;
use Twilio\Twiml;

class TextMessageController extends Controller {

    public static function run() {

        if (!isset($_SESSION) || !isset($_SESSION['base'])) {
            ?><p>Error: session data not found.</p><?php
            return;
        }

		switch ($_SESSION['action']) {
			case 'receive': self::sendDefaultReply(); break;
			case 'send': self::sendMessage(); break;
			case 'verification': self::sendVerificationCode();
			default: self::redirect('home', 'danger', 'Error: Unrecognized action requested');
		}
    }

    private static function sendDefaultReply() {
		header("content-type: text/xml");
		$response = new Twiml();
		$response->message(
			"You don't say?"
		);

		print $response;
	}

	/** Sends a randomly generated verification code to the logged-in user's phone number. */
	public static function sendVerificationCode() {
		if (!isset($_SESSION['user']) && !isset($_POST['userData']))
			return;
		$user = isset($_POST['userData']) ? new User($_POST['userData']) : $_SESSION['user'];

		$verificationCode = new VerificationCode(array('userID' => $user->getUserID()));
		$message = 'Hi, ' . $user->getUserName() . '. Your verification code is ' . $verificationCode->getCode() . '.';
		self::sendMessage($user->getPhone(), $message);
		VerificationCodesDB::add($verificationCode);
	}

    public static function sendMessage($toNumber = null, $textBody = null) {
    	if (is_null($textBody)) {
    		if (!isset($_SESSION['arguments']) || count($_SESSION['arguments']) < 1 || trim($_SESSION['arguments'][0]) === '')
    			return;
    		$textBody = urldecode($_SESSION['arguments'][0]);
    	}

    	$sid = getenv('TWILIO_SID');
    	$testSid = getenv('TWILIO_TEST_SID');
    	$token = getenv('TWILIO_TOKEN');
    	$testToken = getenv('TWILIO_TEST_TOKEN');
    	$twilioPhone = getenv('TWILIO_PHONE');
    	$toNumber = is_null($toNumber) ? getenv('MY_PHONE') : $toNumber;

    	$client = new Client($sid, $token);
    	$client->messages->create(
    		$toNumber,
    		array(
    			'from' => $twilioPhone,
    			'body' => $textBody
    		)
    	);
    }

}
?>