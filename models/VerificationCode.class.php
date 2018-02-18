<?php
class VerificationCode extends ModelObject implements JsonSerializable {

	private $codeID;
	private $code;
	private $userID;
	private $sent;

	public function __construct($formInput = null) {
		$this->formInput = $formInput;
		Messages::reset();
		$this->initialize();
	}

	private function generateCode() {
		$verificationCode = '';
		for ($i = 0; $i < 6; $i++) {
			$verificationCode .= random_int(0, 9);
		}
		return $verificationCode;
	}

	public function getCodeID() {
		return $this->codeID;
	}

	public function setCodeID($codeID) {
		$this->codeID = $codeID;
	}

	public function getCode() {
		return $this->code;
	}

	public function getUserID() {
		return $this->userID;
	}

	public function getSent() {
		return $this->sent;
	}

	public function getParameters() {
		$paramArray = array(
			"codeID" => $this->codeID,
			"code" => $this->code,
			"userID" => $this->userID,
			"sent" => $this->sent
		);
		return $paramArray;
	}

	public function __toString() {
		$sent = is_object($this->sent) ? $this->sent->format("Y-m-d h:i:s a") : '';
		$str =
			"Code ID: [" . $this->codeID . "]\n" .
			"Code: [" . $this->code . "]\n" .
			"User ID: [" . $this->userID . "]\n" .
			"Sent: [" . $sent . "]";
		return $str;
	}

	protected function initialize() {
		$this->errorCount = 0;
		$this->errors = array();

		if (is_null($this->formInput)) {
			$this->codeID = "";
			$this->code = "";
			$this->userID = "";
			$this->sent = "";
		}
		else {
			if (!isset($this->formInput['code']))
				$this->formInput['code'] = $this->generateCode();

			$this->validateCodeID();
			$this->validateCode();
			$this->validateUserID();
			$this->validateSent();
		}
	}

	private function validateCodeID() {
		$this->codeID = $this->validateNumber('codeID');
	}

	private function validateCode() {
		$this->code = $this->validateNumber('code', true);
	}

	private function validateUserID() {
		$this->userID = $this->validateNumber('userID', true);
	}

	private function validateSent() {
		$this->sent = $this->validateDateAndTime('sent');
	}

	public function jsonSerialize() {
		$object = new stdClass();
		$object->codeID = $this->codeID;
		$object->code = $this->code;
		$object->userID = $this->userID;
		$object->sent = $this->sent;

		return $object;
	}

}

?>