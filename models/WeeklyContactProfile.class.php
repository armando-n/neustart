<?php
class WeeklyContactProfile extends ModelObject implements JsonSerializable {

	private $profileID;
	private $name;
	private $customMessage;
	private $isProfileActive;
	private $userID;

	public function __construct($formInput = null) {
		$this->formInput = $formInput;
		Messages::reset();
		$this->initialize();
	}

	public function getProfileID() {
		return $this->profileID;
	}

	public function setProfileID($id) {
		$this->profileID = $id;
	}

	public function getName() {
		return $this->name;
	}

	public function getCustomMessage() {
		return $this->customMessage;
	}

	public function setCustomMessage($customMessage) {
		$this->formInput['customMessage'] = $customMessage;
		$this->validateCustomMessage();
	}

	public function isProfileActive() {
		return $this->isProfileActive;
	}

	public function getUserID() {
		return $this->userID;
	}

	public function setUserID() {
		$this->formInput['userID'] = $userID;
		$this->validateUserID();
	}

	public function getParameters() {
		return array(
			'profileID' => $this->profileID,
			'name' => $this->name,
			'customMessage' => $this->customMessage,
			'isProfileActive' => $this->isProfileActive,
			'userID' => $this->userID
		);
	}

	public function __toString() {
		return
			'Profile ID: [' . $this->profileID . "]\n" .
			'Name: [' . $this->name . "]\n" .
			'Custom message?: [' . $this->customMessage . "]\n" .
			'Is profile active??: [' . $this->isProfileActive . "]\n" .
			'User ID: [' . $this->userID . ']';
	}

	protected function initialize() {
		$this->errorCount = 0;
		$this->errors = array();

		if (is_null($this->formInput)) {
			$this->profileID = '';
			$this->name = '';
			$this->customMessage = '';
			$this->isProfileActive = '';
			$this->userID = '';
		}
		else {
			$this->validateProfileID();
			$this->validateName();
			$this->validateCustomMessage();
			$this->validateIsProfileActive();
			$this->validateUserID();
		}
	}

	private function validateProfileID() {
		$this->profileID = $this->validateNumber('profileID');
	}

	private function validateName() {
		$this->name = $this->validateName('name', true);
	}

	private function validateCustomMessage() {
		$this->customMessage = $this->validateString('customMessage', '/^[\s\w\-\.\'&,\+\?\(\)\$\*\|!]+$/'
			, 'Custom message can only contain letters, numbers, basic punctuation, dashes, and underscores.');
	}

	private function validateIsProfileActive() {
		$this->isProfileActive = $this->validateBoolean('isProfileActive');
	}

	private function validateUserID() {
		$this->userID = $this->validateNumber('userID');
	}

	public function jsonSerialize() {
		$object = new stdClass();
		$object->profileID = $this->profileID;
		$object->name = $this->name;
		$object->customMessage = $this->customMessage;
		$object->isProfileActive = $this->isProfileActive;
		$object->userID = $this->userID;

		return $object;
	}

}

?>