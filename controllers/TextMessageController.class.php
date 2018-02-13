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
			case 'receive': TextMessageController::sendDefaultReply(); break;
			case 'send': TextMessageController::sendMessage(); break;
			default: TextMessageController::redirect('home', 'danger', 'Error: Unrecognized action requested');
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

    private static function sendMessage() {
    	if (!isset($_SESSION['arguments']) || count($_SESSION['arguments']) < 1 || trim($_SESSION['arguments'][0]) === '')
    		return;

    	$textBody = $_SESSION['arguments'][0];
    	$sid = getenv('TWILIO_SID');
    	$testSid = getenv('TWILIO_TEST_SID');
    	$token = getenv('TWILIO_TOKEN');
    	$testToken = getenv('TWILIO_TEST_TOKEN');
    	$twilioPhone = getenv('TWILIO_PHONE');
    	$myPhone = getenv('MY_PHONE');

    	$client = new Client($sid, $token);
    	$client->messages->create(
    		$myPhone,
    		array(
    			'from' => $twilioPhone,
    			'body' => $textBody
    		)
    	);
    }

}
?>