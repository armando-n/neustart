<?php
class VerificationCodesDB {

	/** Adds the given VerificationCode object to the database, and sets the
	 * ID of the given code object on sucess. */
	public static function add(VerificationCode $verificationCode) {
		$codeID = -1;

		try {
			$db = Database::getDB();

			// drop any running verification code events for the user
			$stmt = $db->prepare(
				"drop event if exists ver_code_" . $verificationCode->getUserID()
			);
			$stmt->execute();

			// delete any existing verification codes for the user
			$stmt = $db->prepare('delete from VerificationCodes where userID = :userID');
			$stmt->execute(array(':userID' => $verificationCode->getUserID()));

			// store new verification code
			$stmt = $db->prepare(
				'insert into VerificationCodes (code, userID)
					values (:code, :userID)'
			);
			$stmt->execute(array(
				':code' => $verificationCode->getCode(),
				':userID' => $verificationCode->getUserID()
			));
			$codeID = $db->lastInsertId("codeID");

			// create one-time event to auto-delete verification code after some time
			$stmt = $db->prepare(
				'create event ver_code_' . $verificationCode->getUserID() . ' ' .
				'on schedule at CURRENT_TIMESTAMP + interval 10 minute ' .
				'do delete from VerificationCodes where userID = :userID;'
			);
			$stmt->execute(array(':userID' => $verificationCode->getUserID()));

		} catch (PDOException $e) {
			echo $e->getMessage();
		} catch (RuntimeException $e) {
			echo $e->getMessage();
		}

		if ($codeID !== -1)
			$verificationCode->setCodeID($codeID);
		else
			$verificationCode->setError('verificationCodesDB', 'CODE_ADD_FAILED');
	}

	/** Returns a VerificationCode object for the user with the given ID. */
	public static function get($userID) {
		$verificationCode = null;
		try {
			$db = Database::getDB();
			$stmt = $db->prepare(
				"select *
				from Users join VerificationCodes using (userID)
				where Users.userID = :userID"
			);
			$stmt->execute(array(":userID" => $userID));

			$row = $stmt->fetch(PDO::FETCH_ASSOC);
			if ($row !== false)
				$verificationCode = new VerificationCode($row);

		} catch (PDOException $e) {
			echo $e->getMessage();
		} catch (RuntimeException $e) {
			echo $e->getMessage();
		}

		return $verificationCode;
	}

	/** Deletes any verification codes for the user with the given ID */
	public static function clear($userID) {
		try {
			$db = Database::getDB();
			$stmt = $db->prepare(
				"delete from VerificationCodes
				where userID = :userID"
			);
			$stmt->execute(array(":userID" => $userID));

		} catch (PDOException $e) {
			echo $e->getMessage();
		} catch (RuntimeException $e) {
			echo $e->getMessage();
		}
	}
}
?>