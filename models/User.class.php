<?php
class User extends ModelObject implements JsonSerializable {

	private $userID;
	private $userName;
	private $mainName;
	private $phone;
	private $password; // this is actually the hash of the password
	private $isVerified;
	private $isPhoneVerified;
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

	public function setUserID($id) {
		$this->userID = $id;
	}

	public function getUserName() {
		return $this->userName;
	}

	public function getMainName() {
		return $this->mainName;
	}

	public function getPhone() {
		return $this->phone;
	}

	public function getPhonePretty() {
		return $this->prettifyPhoneNumber($this->phone);
	}

	public function getPassword() {
		return $this->password;
	}

	public function clearPassword() {
		$this->password = '';
	}

	public function isVerified() {
		return $this->isVerified;
	}

	public function setIsVerified($isVerified) {
		$this->formInput['isVerified'] = $isVerified;
		$this->validateIsVerified();
	}

	public function isPhoneVerified() {
		return $this->isPhoneVerified;
	}

	public function setIsPhoneVerified($isPhoneVerified) {
		$this->formInput['isPhoneVerified'] = $isPhoneVerified;
		$this->validateIsPhoneVerified();
	}

	public function isAdministrator() {
		return $this->isAdministrator;
	}

	public function setIsAdministrator() {
		$this->formInput['isAdministrator'] = $isAdministrator;
		$this->validateIsAdministrator();
	}

	public function getDateCreated() {
		return $this->dateCreated;
	}

	public function verifyPassword($pass) {
		return password_verify($pass, $this->password);
	}

	public function getParameters() {
		$paramArray = array(
			'userID' => $this->userID,
			'userName' => $this->userName,
			'mainName' => $this->mainName,
			'phone' => $this->phone,
			'password' => $this->password,
			'isVerified' => $this->isVerified,
			'isPhoneVerified' => $this->isPhoneVerified,
			'isAdministrator' => $this->isAdministrator,
			'dateCreated' => $this->dateCreated
		);
		return $paramArray;
	}

	public function __toString() {
		$dateCreated = is_object($this->dateCreated) ? $this->dateCreated->format('Y-m-d h:i:s a') : '';
		$str =
			'User ID: [' . $this->userID . "]\n" .
			'User name: [' . $this->userName . "]\n" .
			'Main name: [' . $this->mainName . "]\n" .
			'Phone number: [' . $this->phone . "]\n" .
			'Password: [' . $this->password . "]\n" .
			'Is verified?: [' . $this->isVerified . "]\n" .
			'Is phone verified?: [' . $this->isPhoneVerified . "]\n" .
			'Is administrator?: [' . $this->isAdministrator . "]\n" .
			'Date created: [' . $dateCreated . ']';
		return $str;
	}

	protected function initialize() {
		$this->errorCount = 0;
		$this->errors = array();

		if (is_null($this->formInput)) {
			$this->userID = '';
			$this->userName = '';
			$this->mainName = '';
			$this->phone = '';
			$this->password = '';
			$this->isVerified = '';
			$this->isPhoneVerified = '';
			$this->isAdministrator = '';
			$this->dateCreated = '';
		}
		else {
			$this->validateUserID();
			$this->validateUserName();
			$this->validateMainName();
			$this->validatePhone();
			$this->validatePassword();
			$this->validateIsVerified();
			$this->validateIsPhoneVerified();
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
			$this->setError('userName', 'User name is required.');
			return;
		}

		if (strlen($this->userName) > 20) {
			$this->setError('userName', 'User name is too long. It must be no more than 20 characters long.');
			return;
		}

		$options = array('options' => array('regexp' => '/^[a-zA-Z0-9-]+$/'));
		if (!filter_var($this->userName, FILTER_VALIDATE_REGEXP, $options)) {
			$this->setError('userName', 'User name contains invalid characters. It must only contain letters, numbers, and dashes.');
			return;
		}
	}

	private function validateMainName() {
		$this->mainName = $this->validateName('mainName', true, 25);
	}

	private function validatePassword() {
		$pass = $this->extractForm($this->formInput, 'password');
		$pass1 = $this->extractForm($this->formInput, 'password1');
		$pass2 = $this->extractForm($this->formInput, 'password2');
		if (!empty($pass1) || !empty($pass2))
			self::validatePassword_Signup($pass1, $pass2);
		else
			$this->password = $pass;
	}

	private function validatePhone() {
		$this->phone = $this->validatePhoneNumber('phone');
	}

	private function validatePassword_Signup($pass1, $pass2) {
		if ($pass1 !== $pass2) {
			$this->setError('password', 'The passwords you entered do not match. Please try again.');
			return;
		}

		if (strlen($pass1) == 0) {
			$this->setError('password', 'This field is required.');
			return;
		}

		if (strlen($pass1) < 4) {
			$this->setError('password', 'Password is too short. It must be at least 4 characters long.');
			return;
		}

		if (strlen($pass1) > 255) {
			$this->setError('password', 'Password is too long. It must be no more than 255 characters long.');
			return;
		}

		$this->password = password_hash($pass1, PASSWORD_DEFAULT);
	}

	private function validateIsVerified() {
		$this->isVerified = $this->validateBoolean('isVerified');
	}

	private function validateIsPhoneVerified() {
		$this->isPhoneVerified = $this->validateBoolean('isPhoneVerified');
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
		$object->phone = $this->phone;
		$object->isVerified = $this->isVerified;
		$object->isPhoneVerified = $this->isPhoneVerified;
		$object->isAdministrator = $this->isAdministrator;
		$object->dateCreated = $this->dateCreated;

		return $object;
	}

}

?>