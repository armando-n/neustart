<?php
class WeeklyTimeBlocksDB {

	/** Adds the specified WeeklyTimeBlock object to the database, and sets the ID
	 * of the given time block object to the ID assigned to the block in the database. */
	public static function add(WeeklyTimeBlock $timeBlock): void {
		$returnBlockID = -1;

		if (!($timeBlock instanceof WeeklyTimeBlock))
			throw new InvalidArgumentException('Error: Not valid WeeklyTimeBlock object');

		try {
			$db = Database::getDB();
			$stmt = $db->prepare(
				'insert into WeeklyContactProfiles_TimeBlocks (
					blockID,
					dayOfWeek,
					startHour,
					startMinute,
					endHour,
					endMinute,
					isReceivingTexts,
					isReceivingCalls,
					isTextRepeating,
					isCallRepeating,
					repeatTextDuration,
					repeatCallDuration,
					comment,
					profileID
				) values (
					:blockID,
					:dayOfWeek,
					:startHour,
					:startMinute,
					:endHour,
					:endMinute,
					:isReceivingTexts,
					:isReceivingCalls,
					:isTextRepeating,
					:isCallRepeating,
					:repeatTextDuration,
					:repeatCallDuration,
					:comment,
					:profileID
				)'
			);
			$stmt->execute(array(
				':blockID' => $timeBlock->getBlockID(),
				':dayOfWeek' => $timeBlock->getDayOfWeek(),
				':startHour' => $timeBlock->getStartHour(),
				':startMinute' => $timeBlock->getStartMinute(),
				':endHour' => $timeBlock->getEndHour(),
				':endMinute' => $timeBlock->getEndMinute(),
				':isReceivingTexts' => $timeBlock->isReceivingTexts(),
				':isReceivingCalls' => $timeBlock->isReceivingCalls(),
				':isTextRepeating' => $timeBlock->isTextRepeating(),
				':isCallRepeating' => $timeBlock->isCallRepeating(),
				':repeatTextDuration' => $timeBlock->getRepeatTextDuration(),
				':repeatCallDuration' => $timeBlock->getRepeatCallDuration(),
				':comment' => $timeBlock->getComment(),
				':profileID' => $timeBlock->getProfileID()
			));
			$returnBlockID = $db->lastInsertId('blockID');

		} catch (PDOException $e) {
			$timeBlock->setError('weeklyTimeBlocksDB', 'ADD_BLOCK_FAILED');
		} catch (RuntimeException $e) {
			$timeBlock->setError('database', 'DB_CONFIG_NOT_FOUND');
		}

		if ($returnBlockID !== -1)
			$timeBlock->setBlockID($returnBlockID);
		else
			$timeBlock->setError('weeklyTimeBlocksDB', 'ADD_BLOCK_FAILED');
	}

	/** Returns an array of WeeklyTimeBlock objects for the weekly contact profile with the given ID. */
	public static function getAllByProfile($profileID): ?array {
		$allWeeklyTimeBlocks = array();

		try {
			$db = Database::getDB();
			$stmt = $db->prepare(
				'select *
				from WeeklyContactProfiles_TimeBlocks join WeeklyContactProfiles using (profileID)
				where profileID = :profileID
				order by dayOfWeek, startHour, startMinute'
			);
			$stmt->execute(array(':profileID' => $profileID));

			foreach ($stmt as $row) {
				$timeBlock = new WeeklyTimeBlock($row);
				if (!is_object($timeBlock) || !empty($timeBlock->getErrors()))
					throw new PDOException('Failed to create valid weekly time block');

				$allWeeklyTimeBlocks[] = $timeBlock;
			}

		} catch (PDOException $e) {
			echo $e->getMessage();
		} catch (RuntimeException $e) {
			echo $e->getMessage();
		}

		return $allWeeklyTimeBlocks;
	}

	/** Returns an array of WeeklyTimeBlock objects for the active profile of the specified user. */
	public static function getAllActiveByUser($userID): ?array {
		$allActiveWeeklyBlocks = array();

		try {
			$db = Database::getDB();
			$stmt = $db->prepare(
				'select *
				from Users join (
					WeeklyContactProfiles join WeeklyContactProfiles_TimeBlocks using (profileID)
				) using (userID)
				where userID = :userID and isProfileActive = true
				order by dayOfWeek, startHour, startMinute'
			);
			$stmt->execute(array(':userID' => $userID));

			$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
			foreach ($rows as $row) {
				$timeBlock = new WeeklyTimeBlock($row);
				if (!is_object($timeBlock) || !empty($timeBlock->getErrors()))
					throw new PDOException('Failed to create valid weekly time block');
				$allActiveWeeklyBlocks[] = $timeBlock;
			}

		} catch (PDOException $e) {
			echo $e->getMessage();
		} catch (RuntimeException $e) {
			echo $e->getMessage();
		}
		
		return $allActiveWeeklyBlocks;
	}

	/** Retrieves the weekly time block from the database with the given blockID. */
	public static function get($blockID): ?WeeklyTimeBlock {
		$timeBlock = null;

		try {
			$db = Database::getDB();
			$stmt = $db->prepare("select * from WeeklyContactProfiles_TimeBlocks where blockID = :blockID");
			$stmt->execute(array(":blockID" => $blockID));

			$row = $stmt->fetch(PDO::FETCH_ASSOC);
			if ($row !== false)
				$timeBlock = new WeeklyTimeBlock($row);

		} catch (PDOException $e) {
			echo $e->getMessage();
		} catch (RuntimeException $e) {
			echo $e->getMessage();
		}

		return $timeBlock;
	}

	/** Updates any editable fields of the given weekly time block. */
    public static function edit(WeeklyTimeBlock $timeBlock) {
		try {
			$db = Database::getDB();
			$stmt = $db->prepare(
				'update WeeklyContactProfiles_TimeBlocks set
					dayOfWeek = :dayOfWeek,
					startHour = :startHour,
					startMinute = :startMinute,
					endHour = :endHour,
					endMinute = :endMinute,
					isReceivingTexts = :isReceivingTexts,
					isReceivingCalls = :isReceivingCalls,
					isTextRepeating = :isTextRepeating,
					isCallRepeating = :isCallRepeating,
					repeatTextDuration = :repeatTextDuration,
					repeatCallDuration = :repeatCallDuration,
					comment = :comment
				where blockID = :blockID'
			);
			$stmt->execute(array(
				':dayOfWeek' => $timeBlock->getDayOfWeek(),
				':startHour' => $timeBlock->getStartHour(),
				':startMinute' => $timeBlock->getStartMinute(),
				':endHour' => $timeBlock->getEndHour(),
				':endMinute' => $timeBlock->getEndMinute(),
				':isReceivingTexts' => $timeBlock->isReceivingTexts(),
				':isReceivingCalls' => $timeBlock->isReceivingCalls(),
				':isTextRepeating' => $timeBlock->isTextRepeating(),
				':isCallRepeating' => $timeBlock->isCallRepeating(),
				':repeatTextDuration' => $timeBlock->getRepeatTextDuration(),
				':repeatCallDuration' => $timeBlock->getRepeatCallDuration(),
				':comment' => $timeBlock->getComment(),
				':blockID' => $timeBlock->getBlockID()
			));
		} catch (PDOException $e) {
			 $timeBlock->setError('weeklyTimeBlocksDB', 'EDIT_BLOCK_FAILED');
		} catch (RuntimeException $e) {
			 $timeBlock->setError('database', 'DB_CONFIG_NOT_FOUND');
		}
  }

  /** Deletes the weekly time block with the given block ID.
	* Returns true on success, or false otherwise. */
	public static function delete($blockID) {
		try {
			$db = Database::getDB();
			$stmt = $db->prepare( "delete from WeeklyContactProfiles_TimeBlocks where blockID = :blockID" );
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