<?php
class PhoneCallContestedView {

	public static function show() {
		$args = $_SESSION['arguments'];
		$someMob = count($args) > 0 ? urldecode($args[0]) : "A contested mob";
		header("content-type: text/xml");
		echo "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n";
		?>
		<Response>
		  <Say voice="alice">Neustart needs you! <?=$someMob?> must be slain! Come quick! The raid awaits your arrival!</Say>
		  <Play>https://demo.twilio.com/docs/classic.mp3</Play>
		</Response>
		<?php
	}

}
?>