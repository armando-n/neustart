<?php
abstract class AbstractModelObject {
	protected $errors;
	protected $errorCount;
	protected $formInput;

	protected function extractForm($formInput, $valueName) {
		$value = "";
		if (isset($formInput[$valueName])) {
			$value = trim($formInput[$valueName]);
			$value = stripslashes($value);
			$value = htmlspecialchars($value);
		}
		return $value;
	}

	public function getError($errorName) {
		if (isset($this->errors[$errorName]))
			return $this->errors[$errorName];

		return "";
	}

	public function setError($errorName, $errorValue) {
		$this->errors[$errorName] = trim(Messages::getError($errorValue));
		$this->errorCount++;
	}

	public function getErrorCount() {
		return $this->errorCount;
	}

	public function getErrors() {
		return $this->errors;
	}

	protected function validateName($fieldName, $isRequired = false) {
		$name = $this->extractForm($this->formInput, $fieldName);
		if ($isRequired && empty($name)) {
			$this->setError($fieldName, "NAME_EMPTY");
			return;
		}

		if (strlen($name) > 50) {
			$this->setError($fieldName, "NAME_TOO_LONG");
			return;
		}

		$options = array("options" => array("regexp" => "/^[a-zA-Z '-]+$/"));
		if (!filter_var($name, FILTER_VALIDATE_REGEXP, $options)) {
			$this->setError($fieldName, "NAME_HAS_INVALID_CHARS");
			return;
		}

		return $name;
	}

	protected function validateNumber($fieldName, $isRequired = false) {
		$number = $this->extractForm($this->formInput, $fieldName);
		if (empty($this->userID)) {
			$this->setError($fieldName, "NUMBER_EMPTY");
			return;
		}

		if (!is_numeric($this->userID)) {
			$this->setError($fieldName, "NUMBER_NAN");
			return;
		}

		return $number;
	}

	protected function validateDateAndTime($fieldName, $isRequired = false) {
		$dateAndTime = $this->extractForm($this->formInput, $fieldName);

		if ($isRequired && empty($dateAndTime)) {
			$this->setError($fieldName, "DATE_AND_TIME_EMPTY");
			return;
		}

		list($date, $time) = preg_split("/ /", $dateAndTime);

		if (empty($date)) {
			$this->setError($fieldName, "DATE_EMPTY");
			return;
		}

		if (empty($time)) {
			$this->setError($fieldName, "TIME_EMPTY");
			return;
		}

		$options = array("options" => array("regexp" => "/^((\d{4}[\/-]\d\d[\/-]\d\d)|(\d\d[\/-]\d\d[\/-]\d{4}))$/"));
		if (!filter_var($date, FILTER_VALIDATE_REGEXP, $options)) {
			$this->setError("dateAndTime", "DATE_HAS_INVALID_CHARS");
			return;
		}

		$options = array("options" => array("regexp" => "/^(([0-1]?[0-9])|([2][0-3])):([0-5]?[0-9])(:([0-5]?[0-9]))?( ((am|pm)|(AM|PM)))?$/"));
		if (!filter_var($time, FILTER_VALIDATE_REGEXP, $options)) {
			$this->setError("dateAndTime", "TIME_HAS_INVALID_CHARS");
			return;
		}

		try { $dt = new DateTime($date . ' ' . $time); }
		catch (Exception $e) {
			$this->setError("dateAndTime", "DATE_AND_TIME_INVALID");
			return;
		}

		return $dt;
	}

	protected function validateBoolean($fieldName) {
		$value = $this->extractForm($this->formInput, $fieldName);
		return !empty($value);
	}

	abstract public function getParameters();

	abstract public function __toString();

	abstract protected function initialize();
}
?>