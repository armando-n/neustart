<?php
class TransientTimeBlock extends TimeBlock implements JsonSerializable {

	private $startTime;
	private $endTime;
	private $userID;

	public function __construct($formInput = null) {
		$this->formInput = $formInput;
		Messages::reset();
		$this->initialize();
	}

	public function getStartTime() {
		return $this->startTime;
	}

	public function getEndTime() {
		return $this->endTime;
	}

	public function getUserID() {
		return $this->userID;
	}

	public function setUserID() {
		$this->formInput['userID'] = $userID;
		$this->validateUserID();
	}

	public function getParameters() {
		$parentParams = parent::getParameters();
		$thisParams = array(
			'startTime' => $this->startTime,
			'endTime' => $this->endTime,
			'userID' => $this->userID
		);

		return array_merge($parentParams, $thisParams);
	}

	public function __toString() {
		return
			parent::__toString() . "\n" .
			'Start time: [' . $this->startTime . "]\n" .
			'End time: [' . $this->endTime . "]\n" .
			'User ID: [' . $this->userID . ']';
	}

	protected function initialize() {
		$this->errorCount = 0;
		$this->errors = array();
		parent::	initialize();

		if (is_null($this->formInput)) {
			$this->startTime = '';
			$this->endTime = '';
			$this->userID = '';
		}
		else {
			$this->validateStartTime();
			$this->validateEndTime();
			$this->validateUserID();
		}
	}

	private function validateStartTime() {
		$this->startTime = $this->validateDateAndTime('startTime', true);
	}

	private function validateEndTime() {
		$this->endTime = $this->validateDateAndTime('endTime', true);
		if ($this->startTime > $this->endTime)
			$this->setError('endTime', 'End time cannot come before start time.');
	}

	private function validateUserID() {
		$this->userID = $this->validateNumber('userID');
	}

	public function jsonSerialize() {
		$object = $this->serializeParent();

		$object->startTime = $this->startTime;
		$object->endTime = $this->endTime;
		$object->userID = $this->userID;

		return $object;
	}

}

?>