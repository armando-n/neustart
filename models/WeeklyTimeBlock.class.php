<?php
class WeeklyTimeBlock extends TimeBlock implements JsonSerializable {

	private $dayOfWeek;
	private $startHour;
	private $startMinute;
	private $endHour;
	private $endMinute;
	private $profileID;

	public function __construct($formInput = null) {
		$this->formInput = $formInput;
		Messages::reset();
		$this->initialize();
	}

	public function getDayOfWeek() {
		return $this->dayOfWeek;
	}

	public function getStartHour() {
		return $this->startHour;
	}

	public function getStartMinute() {
		return $this->startMinute;
	}

	public function getEndHour() {
		return $this->endHour;
	}

	public function getEndMinute() {
		return $this->endMinute;
	}

	public function getProfileID() {
		return $this->profileID;
	}

	public function setProfileID() {
		$this->formInput['profileID'] = $profileID;
		$this->validateProfileID();
	}

	public function getParameters() {
		$parentParams = parent::getParameters();
		$thisParams = array(
			'dayOfWeek' => $this->dayOfWeek,
			'startHour' => $this->startHour,
			'startMinute' => $this->startMinute,
			'endHour' => $this->endHour,
			'endMinute' => $this->endMinute,
			'profileID' => $this->profileID
		);

		return array_merge($parentParams, $thisParams);
	}

	public function __toString() {
		return
			parent::__toString() . "\n" .
			'Day of week: [' . $this->dayOfWeek . "]\n" .
			'Start hour: [' . $this->startHour . "]\n" .
			'Start minute: [' . $this->startMinute . "]\n" .
			'End hour: [' . $this->endHour . "]\n" .
			'End minute: [' . $this->endMinute . "]\n" .
			'User ID: [' . $this->profileID . ']';
	}

	protected function initialize() {
		$this->errorCount = 0;
		$this->errors = array();
		parent::	initialize();

		if (is_null($this->formInput)) {
			$this->startHour = '';
			$this->startMinute = '';
			$this->endHour = '';
			$this->endMinute = '';
			$this->profileID = '';
		}
		else {
			$this->validateDayOfWeek();
			$this->validateStartHour();
			$this->validateStartMinute();
			$this->validateEndHour();
			$this->validateEndMinute();
			$this->validateProfileID();
		}
	}

	private function validateDayOfWeek() {
		$allowedValues = array('sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday');
		$this->dayOfWeek = $this->validateEnum('dayOfWeek', $allowedValues, true);
	}

	private function validateStartHour() {
		$this->startHour = $this->validateNumber('startHour', true, 0, 24);
	}

	private function validateStartMinute() {
		$this->startMinute = $this->validateNumber('startMinute', true, 0, 59);
	}

	private function validateEndHour() {
		$this->endHour = $this->validateNumber('endHour', true, 0, 24);
		if ($this->startHour > $this->endHour)
			$this->setError('endHour', 'End hour cannot come before start hour.');
	}

	private function validateEndMinute() {
		$this->endMinute = $this->validateNumber('endMinute', true, 0, 59);
		if ($this->startHour == $this->endHour && $this->startMinute > $this->endMinute)
			$this->setError('endMinute', 'End minute cannot come before start minute within the same hour.');
	}

	private function validateProfileID() {
		$this->profileID = $this->validateNumber('profileID');
	}

	public function jsonSerialize() {
		$object = $this->serializeParent();

		$object->dayOfWeek = $this->dayOfWeek;
		$object->startHour = $this->startHour;
		$object->startMinute = $this->startMinute;
		$object->endHour = $this->endHour;
		$object->endMinute = $this->endMinute;
		$object->profileID = $this->profileID;

		return $object;
	}

}

?>