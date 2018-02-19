<?php
class TimeBlock extends ModelObject {

	protected $blockID;
	protected $isReceivingTexts;
	protected $isTextRepeating;
	protected $isReceivingCalls;
	protected $isCallRepeating;
	protected $repeatTextDuration;
	protected $repeatCallDuration;
	protected $comment;

	public function __construct($formInput = null) {
		$this->formInput = $formInput;
		Messages::reset();
		$this->initialize();
	}

	public function getBlockID() {
		return $this->blockID;
	}

	public function setBlockID($id) {
		$this->formInput['blockID'] = $blockID;
		$this->validateBlockID();
	}

	public function isReceivingTexts() {
		return $this->isReceivingTexts;
	}

	public function isReceivingCalls() {
		return $this->isReceivingCalls;
	}

	public function isTextRepeating() {
		return $this->isTextRepeating;
	}

	public function isCallRepeating() {
		return $this->isCallRepeating;
	}

	public function getRepeatTextDuration() {
		return $this->repeatTextDuration;
	}

	public function getRepeatCallDuration() {
		return $this->repeatCallDuration;
	}

	public function getComment() {
		return $this->comment;
	}

	public function setComment($comment) {
		$this->formInput['comment'] = $comment;
		$this->validateComment();
	}

	public function getParameters() {
		return array(
			'blockID' => $this->blockID,
			'isReceivingTexts' => $this->isReceivingTexts,
			'isReceivingCalls' => $this->isReceivingCalls,
			'isTextRepeating' => $this->isTextRepeating,
			'isCallRepeating' => $this->isCallRepeating,
			'repeatTextDuration' => $this->repeatTextDuration,
			'repeatCallDuration' => $this->repeatCallDuration,
			'comment' => $this->comment
		);
	}

	public function __toString() {
		return
			'Block ID: [' . $this->blockID . "]\n" .
			'Is receiving texts?: [' . $this->isReceivingTexts . "]\n" .
			'Is receiving calls?: [' . $this->isReceivingCalls . "]\n" .
			'Is text repeating?: [' . $this->isTextRepeating . "]\n" .
			'Is call repeating?: [' . $this->isCallRepeating . "]\n" .
			'Repeat text duration: [' . $this->repeatTextDuration . "]\n" .
			'Repeat call duration: [' . $this->repeatCallDuration . "]\n" .
			'Comment: [' . $this->comment . ']';
	}

	protected function initialize() {
		if (is_null($this->formInput)) {
			$this->blockID = '';
			$this->isReceivingTexts = '';
			$this->isReceivingCalls = '';
			$this->isTextRepeating = '';
			$this->isCallRepeating = '';
			$this->repeatTextDuration = '';
			$this->repeatCallDuration = '';
			$this->comment = '';
		}
		else {
			$this->validateBlockID();
			$this->validateIsReceivingTexts();
			$this->validateIsReceivingCalls();
			$this->validateIsTextRepeating();
			$this->validateIsCallRepeating();
			$this->validateRepeatCallDuration();
			$this->validateRepeatTextDuration();
			$this->validateComment();
		}
	}

	private function validateBlockID() {
		$this->blockID = $this->validateNumber('blockID');
	}

	private function validateIsReceivingTexts() {
		$this->isReceivingTexts = $this->validateBoolean('isReceivingTexts');
	}

	private function validateIsReceivingCalls() {
		$this->isReceivingCalls = $this->validateBoolean('isReceivingCalls');
	}

	private function validateIsTextRepeating() {
		$this->isTextRepeating = $this->validateBoolean('isTextRepeating');
	}

	private function validateIsCallRepeating() {
		$this->isCallRepeating = $this->validateBoolean('isCallRepeating');
	}

	private function validateRepeatTextDuration() {
		$this->repeatTextDuration = $this->validateNumber('repeatTextDuration');
	}

	private function validateRepeatCallDuration() {
		$this->repeatCallDuration = $this->validateNumber('repeatCallDuration');
	}

	private function validateComment() {
		$this->comment = $this->validateString('comment', '/^[\s\w\-\.\'&,\+\?\(\)\$\*\|!]+$/'
			, 'Comment can only contain letters, numbers, basic punctuation, dashes, and underscores.');
	}

	protected function serializeParent() {
		$object = new stdClass();
		$object->blockID = $this->blockID;
		$object->isReceivingTexts = $this->isReceivingTexts;
		$object->isReceivingCalls = $this->isReceivingCalls;
		$object->isTextRepeating = $this->isTextRepeating;
		$object->isCallRepeating = $this->isCallRepeating;
		$object->repeatTextDuration = $this->repeatTextDuration;
		$object->repeatCallDuration = $this->repeatCallDuration;
		$object->comment = $this->comment;

		return $object;
	}

}

?>