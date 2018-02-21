<?php
class TransientTimeBlocksDB {

	/** Adds the specified TransientTimeBlock object to the database, and sets the ID
	 * of the given time block object to the ID assigned to the block in the database. */
	public static function add(TransientTimeBlock $timeBlock): void {
		$returnBlockID = -1;

		if (!($timeBlock instanceof TransientTimeBlock))
			throw new InvalidArgumentException('Error: Not valid TransientTimeBlock object');

		try {
			$db = Database::getDB();
			$stmt = $db->prepare(
				'insert into TransientContactTimeBlocks (
					blockID,
					starTime,
					endTime,
					isReceivingTexts,
					isReceivingCalls,
					isTextRepeating,
					isCallRepeating,
					repeatTextDuration,
					repeatCallDuration,
					comment,
					userID
				) values (
					:blockID,
					:starTime,
					:endTime,
					:isReceivingTexts,
					:isReceivingCalls,
					:isTextRepeating,
					:isCallRepeating,
					:repeatTextDuration,
					:repeatCallDuration,
					:comment,
					:userID
				)'
			);
			$stmt->execute(array(
				':blockID' => $timeBlock->getBlockID(),
				':starTime' => $timeBlock->getStartTime(),
				':endTime' => $timeBlock->getEndTime(),
				':isReceivingTexts' => $timeBlock->isReceivingTexts(),
				':isReceivingCalls' => $timeBlock->isReceivingCalls(),
				':isTextRepeating' => $timeBlock->isTextRepeating(),
				':isCallRepeating' => $timeBlock->isCallRepeating(),
				':repeatTextDuration' => $timeBlock->getRepeatTextDuration(),
				':repeatCallDuration' => $timeBlock->getRepeatCallDuration(),
				':comment' => $timeBlock->getComment(),
				':userID' => $timeBlock->getUserID()
			));
			$returnBlockID = $db->lastInsertId('blockID');

		} catch (PDOException $e) {
			$timeBlock->setError('transientTimeBlocksDB', 'ADD_BLOCK_FAILED');
		} catch (RuntimeException $e) {
			$timeBlock->setError('database', 'DB_CONFIG_NOT_FOUND');
		}

		if ($returnBlockID !== -1)
			$timeBlock->setBlockID($returnBlockID);
		else
			$timeBlock->setError('transientTimeBlocksDB', 'ADD_BLOCK_FAILED');
	}

	/** Returns an array of all TransientTimeBlock objects for the user with the given ID. */
	public static function getAllByUser($userID): ?array {
		$allTransientTimeBlocks = array();

		try {
			$db = Database::getDB();
			$stmt = $db->prepare(
				'select *
				from TransientContactTimeBlocks join Users using (userID)
				where userID = :userID'
			);
			$stmt->execute(array(':userID' => $userID));

			foreach ($stmt as $row) {
				$timeBlock = new TransientTimeBlock($row);
				if (!is_object($timeBlock) || !empty($timeBlock->getErrors()))
					throw new PDOException('Failed to create valid transient time block');

				$allTransientTimeBlocks[] = $timeBlock;
			}

		} catch (PDOException $e) {
			echo $e->getMessage();
		} catch (RuntimeException $e) {
			echo $e->getMessage();
		}

		return $allTransientTimeBlocks;
	}

	/** Retrieves the transient time block from the database with the given block ID. */
	public static function get($blockID): ?TransientTimeBlock {
		$timeBlock = null;

		try {
			$db = Database::getDB();
			$stmt = $db->prepare("select * from TransientContactTimeBlocks where blockID = :blockID");
			$stmt->execute(array(":blockID" => $blockID));

			$row = $stmt->fetch(PDO::FETCH_ASSOC);
			if ($row !== false)
				$timeBlock = new TransientTimeBlock($row);

		} catch (PDOException $e) {
			echo $e->getMessage();
		} catch (RuntimeException $e) {
			echo $e->getMessage();
		}

		return $timeBlock;
	}

	/** Updates any editable fields of the given transient time block. */
    public static function edit(TransientTimeBlock $timeBlock) {
		try {
			$db = Database::getDB();
			$stmt = $db->prepare(
				'update TransientContactTimeBlocks set
					startTime = :startTime,
					endTime = :endTime,
					isReceivingTexts = :isReceivingTexts,
					isReceivingCalls = :isReceivingCalls,
					isTextRepeating = :isTextRepeating,
					isCallRepeating = :isCallRepeating,
					repeatTextDuration = :repeatTextDuration,
					repeatCallDuration = :repeatCallDuration,
					comment = :comment,
					userID = :userID
				where blockID = :blockID'
			);
			$stmt->execute(array(
				':startTime' => $timeBlock->getStartTime(),
				':endTime' => $timeBlock->getEndTime(),
				':isReceivingTexts' => $timeBlock->isReceivingTexts(),
				':isReceivingCalls' => $timeBlock->isReceivingCalls(),
				':isTextRepeating' => $timeBlock->isTextRepeating(),
				':isCallRepeating' => $timeBlock->isCallRepeating(),
				':repeatTextDuration' => $timeBlock->getRepeatTextDuration(),
				':repeatCallDuration' => $timeBlock->getRepeatCallDuration(),
				':comment' => $timeBlock->getComment(),
				':userID' => $timeBlock->getUserID(),
				':blockID' => $timeBlock->getBlockID()
			));
		} catch (PDOException $e) {
			 $timeBlock->setError('transientTimeBlocksDB', 'EDIT_BLOCK_FAILED');
		} catch (RuntimeException $e) {
			 $timeBlock->setError('database', 'DB_CONFIG_NOT_FOUND');
		}
  }

  /** Deletes the transient time block with the given block ID.
	* Returns true on success, or false otherwise. */
	public static function delete($blockID) {
		try {
			$db = Database::getDB();
			$stmt = $db->prepare( "delete from TransientContactTimeBlocks where blockID = :blockID" );
			$stmt->execute(array(":blockID" => $blockID));

		} catch (PDOException $e) {
			return false;
		} catch (RuntimeException $e) {
			return false;
		}

		return true;
	}

}
?>