<?php
class User extends AbstractModelObject implements JsonSerializable {

	private $userID;
	private $userName;
	private $mainName;
	private $password; // this is actually the hash of the password
	private $isVerified;
	private $isAdministrator;
	private $dateCreated;

	public function __construct($formInput = null) {
		$this->formInput = $formInput;
		Messages::reset();
		$this->initialize();
	}

	public function getUserID() {
		return $this->userID;
	}

	public function getUserName() {
		return $this->userName;
	}

	public function getMainName() {
		return $this->mainName;
	}

	public function getPassword() {
		return $this->password;
	}

	public function isVerified() {
		return $this->isVerified;
	}

	public function isAdministrator() {
		return $this->isAdministrator;
	}

	public function getDateCreated() {
		return $this->dateCreated;
	}

	public function verifyPassword($pass) {
		return password_verify($pass, $this->password);
	}

	public function getParameters() {
		$paramArray = array(
			"userID" => $this->userID,
			"userName" => $this->userName,
			"mainName" => $this->mainName,
			"password" => $this->password,
			"isVerified" => $this->isVerified,
			"isAdministrator" => $this->isAdministrator,
			"dateCreated" => $this->dateCreated
		);
		return $paramArray;
	}

	public function __toString() {
		$dateCreated = is_object($this->dateCreated) ? $this->dateCreated->format("Y-m-d h:i:s a") : '';
		$str =
			"User ID: [" . $this->userID . "]\n" .
			"User name: [" . $this->userName . "]\n" .
			"Main name: [" . $this->mainName . "]\n" .
			"Password: [" . $this->password . "]\n" .
			"Is verified?: [" . $this->isVerified . "]\n" .
			"Is administrator?: [" . $this->isAdministrator . "]\n" .
			"Date created: [" . $dateCreated . "]";
		return $str;
	}

	protected function initialize() {
		$this->errorCount = 0;
		$this->errors = array();

		if (is_null($this->formInput)) {
			$this->userID = "";
			$this->userName = "";
			$this->mainName = "";
			$this->password = "";
			$this->isVerified = "";
			$this->isAdministrator = "";
			$this->dateCreated = "";
		}
		else {
			$this->validateUserID();
			$this->validateUserName();
			$this->validateMainName();
			$this->validatePassword();
			$this->validateIsVerified();
			$this->validateIsAdministrator();
			$this->validateDateCreated();
		}
	}

	private function validateUserID() {
		$this->userID = $this->validateNumber('userID');
	}

	private function validateUserName() {
		$this->userName = $this->extractForm($this->formInput, "userName");
		if (empty($this->userName)) {
			$this->setError("userName", "USER_NAME_EMPTY");
			return;
		}

		if (strlen($this->userName) > 20) {
			$this->setError("userName", "USER_NAME_TOO_LONG");
			return;
		}

		$options = array("options" => array("regexp" => "/^[a-zA-Z0-9-]+$/"));
		if (!filter_var($this->userName, FILTER_VALIDATE_REGEXP, $options)) {
			$this->setError("userName", "USER_NAME_HAS_INVALID_CHARS");
			return;
		}
	}

	private function validateMainName() {
		$this->mainName = $this->validateName('mainName', true);
	}

	private function validatePassword() {
		$pass = $this->extractForm($this->formInput, "password");
		$pass1 = $this->extractForm($this->formInput, "password1");
		$pass2 = $this->extractForm($this->formInput, "password2");
		if (!empty($pass1) || !empty($pass2))
			self::validatePassword_Signup($pass1, $pass2);
		else
			$this->password = $pass;
	}

	private function validatePassword_Signup($pass1, $pass2) {
		if ($pass1 !== $pass2) {
			$this->setError('password', 'PASSWORDS_DO_NOT_MATCH');
			return;
		}

		if (strlen($pass1) == 0) {
			$this->setError('password', 'PASSWORD_EMPTY');
			return;
		}

		if (strlen($pass1) < 6) {
			$this->setError('password', 'PASSWORD_TOO_SHORT');
			return;
		}

		if (strlen($pass1) > 20) {
			$this->setError("password", "PASSWORD_TOO_LONG");
			return;
		}

		$this->password = password_hash($pass1, PASSWORD_DEFAULT);
	}

	private function validateIsVerified() {
		$this->isVerified = $this->validateBoolean('isVerified');
	}

	private function validateIsAdministrator() {
		$this->isAdministrator = $this->validateBoolean('isAdministrator');
	}

	private function validateDateCreated() {
		$this->dateCreated = $this->validateDateAndTime('dateCreated');
	}

	public function jsonSerialize() {
		$object = new stdClass();
		$object->userID = $this->userID;
		$object->userName = $this->userName;
		$object->mainName = $this->mainName;
		$object->isVerified = $this->isVerified;
		$object->isAdministrator = $this->isAdministrator;

		return $object;
	}

}

?>