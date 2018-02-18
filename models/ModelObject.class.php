<?php
abstract class ModelObject {
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
		// $this->errors[$errorName] = trim(Messages::getError($errorValue));
		$this->errors[$errorName] = trim($errorValue);
		$this->errorCount++;
	}

	public function getErrorCount() {
		return $this->errorCount;
	}

	public function getErrors() {
		return $this->errors;
	}

	public function setErrors($errors) {
		$this->errors = $errors;
	}

	protected function validateName($fieldName, $isRequired = false, $maxLength = 50) {
		$name = $this->extractForm($this->formInput, $fieldName);
		if ($isRequired && empty($name)) {
			$this->setError($fieldName, 'Name is required.');
			return;
		}

		if (strlen($name) > $maxLength) {
			$this->setError($fieldName, "The name is too long. It must be no more than $maxLength characters long.");
			return;
		}

		$options = array('options' => array('regexp' => "/^[a-zA-Z '-]+$/"));
		if (!filter_var($name, FILTER_VALIDATE_REGEXP, $options)) {
			$this->setError($fieldName, 'Name contains invalid characters. Only letters, spaces, apostrophes, and dashes are permitted.');
			return;
		}

		return $name;
	}

	protected function validateNumber($fieldName, $isRequired = false) {
		$number = $this->extractForm($this->formInput, $fieldName);
		if ($isRequired && empty($number)) {
			$this->setError($fieldName, 'This field is required. Enter a valid number.');
			return;
		}

		if (!empty($number) && !is_numeric($number)) {
			$this->setError($fieldName, 'This field expects numbers only. Enter a valid number.');
			return;
		}

		return $number;
	}

	protected function validatePhoneNumber($fieldName, $isRequired = false) {
		$phoneNumber = $this->extractForm($this->formInput, $fieldName);

		if ($isRequired && empty($phoneNumber)) {
			$this->setError($fieldName, 'Phone number is required.');
			return;
		}

		if (strlen($phoneNumber) > 17) {
			$this->setError($fieldName, 'Phone number is too long. It must be no more than 17 characters long.');
			return;
		}

		$options = array('options' => array('regexp' => "/^(\+\d\s*[-\/\.]?)?(\((\d{3})\)|(\d{3}))\s*[-\/\.]?\s*(\d{3})\s*[-\/\.]?\s*(\d{4})\s*(([xX]|[eE][xX][tT])\.?\s*(\d+))*$/"));
		if (!filter_var($phoneNumber, FILTER_VALIDATE_REGEXP, $options)) {
			$this->setError($fieldName, 'Phone number invalid or not recognized. Enter a number in the form ###-###-####');
			return;
		}

		return $this->formatPhoneNumber($phoneNumber);
	}

	protected function validateDateAndTime($fieldName, $isRequired = false) {
		$dateAndTime = $this->extractForm($this->formInput, $fieldName);

		if ($isRequired && empty($dateAndTime)) {
			$this->setError($fieldName, 'Date is required.');
			return;
		}

		if (empty($dateAndTime))
			return;

		list($date, $time) = preg_split("/ /", $dateAndTime);

		if (empty($date)) {
			$this->setError($fieldName, 'Date is required.');
			return;
		}

		if (empty($time)) {
			$this->setError($fieldName, 'Time is required.');
			return;
		}

		$options = array('options' => array('regexp' => "/^((\d{4}[\/-]\d\d[\/-]\d\d)|(\d\d[\/-]\d\d[\/-]\d{4}))$/"));
		if (!filter_var($date, FILTER_VALIDATE_REGEXP, $options)) {
			$this->setError($fieldName, 'Invalid date. Date must be of the form YYYY-MM-DD');
			return;
		}

		$options = array('options' => array('regexp' => "/^(([0-1]?[0-9])|([2][0-3])):([0-5]?[0-9])(:([0-5]?[0-9]))?( ((am|pm)|(AM|PM)))?$/"));
		if (!filter_var($time, FILTER_VALIDATE_REGEXP, $options)) {
			$this->setError($fieldName, 'Invalid time. Time must be of the form HH:MM:SS or HH:MM:SS AM (or PM)');
			return;
		}

		try { $dt = new DateTime($date . ' ' . $time); }
		catch (Exception $e) {
			$this->setError($fieldName, 'Date/time passed validation, but failed to create DateTime object. This is a coding error. Contact support.');
			return;
		}

		return $dt;
	}

	protected function validateBoolean($fieldName) {
		$value = $this->extractForm($this->formInput, $fieldName);
		return !empty($value);
	}

	protected function formatPhoneNumber($phoneNumber) {
		$formattedNumber = '';
		foreach (str_split($phoneNumber) as $char) {
			if (is_numeric($char))
				$formattedNumber .= $char;
		}

		if (strlen($formattedNumber) === 10)
			$formattedNumber = '+1' . $formattedNumber;
		else if (strlen($formattedNumber) === 11)
			$formattedNumber = '+' . $formattedNumber;

		return $formattedNumber;
	}

	protected function prettifyPhoneNumber($formattedPhoneNumber) {
		$prettifiedNumber = '';
		for ($i = 0; $i < strlen($formattedPhoneNumber); $i++) {
			if ($i === 2)
				$prettifiedNumber .= ' (';
			else if ($i === 5)
				$prettifiedNumber .= ') ';
			else if ($i === 8)
				$prettifiedNumber .= '-';
			$prettifiedNumber .= $formattedPhoneNumber[$i];
		}
		return $prettifiedNumber;
	}

	abstract public function getParameters();

	abstract public function __toString();

	abstract protected function initialize();
}
?>