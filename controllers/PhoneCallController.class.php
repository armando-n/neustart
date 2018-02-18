<?php
require_once('vendor'.DIRECTORY_SEPARATOR.'autoload.php');
use Twilio\Rest\Client;
use Twilio\Twiml;

class PhoneCallController extends Controller {

	public static function run() {

		if (!isset($_SESSION) || !isset($_SESSION['base'])) {
			?><p>Error: session data not found.</p><?php
			return;
		}

		switch ($_SESSION['action']) {
			case 'receive': PhoneCallController::sendDefaultReply(); break;
			case 'contested': PhoneCallController::makeContestedCalls(); break;
			case 'playContestedMessage': PhoneCallController::playContestedMessage(); break;
			default: PhoneCallController::redirect('home', 'danger', 'Error: Unrecognized action requested');
		}
	}

	private static function playContestedMessage() {
		PhoneCallContestedView::show();
	}

	private static function sendDefaultReply() {
		$people = array(getenv('MY_PHONE') => "Armando Navarro");

		if (!$name = $people[$_POST['From']])
			$name = "dawg";

		header("content-type: text/xml");
		echo "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n";
		?>
		<Response>
			<Say>What up, <?=$name?>? I want you to know that I ain't trippin.</Say>
		</Response>
		<?php
	}

	private static function makeContestedCalls() {
		$_SESSION['contested'] = "a contested mob";
		if (count($_SESSION['arguments']) > 0 && trim($_SESSION['arguments'][0]) !== '')
			$_SESSION['contested'] = $_SESSION['arguments'][0]; 

		$client = new Client(getenv('TWILIO_SID'), getenv('TWILIO_TOKEN'));
		$call = $client->account->calls->create(
			getenv('MY_PHONE'),	 // to
			getenv('TWILIO_PHONE'), // from
			array("url" => "http://".$_SERVER['HTTP_HOST'].'/'.$_SESSION['base'].'call/playContestedMessage/'.$_SESSION['contested'])
		);

		echo "Started call";
	}

}
?>