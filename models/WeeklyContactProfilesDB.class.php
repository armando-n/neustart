<?php
class WeeklyContactProfilesDB {

	/** Adds the specified WeeklyContactProfile object to the database, and sets the ID
	 * of the given profile object to the ID assigned to the profile in the database. */
	public static function add(WeeklyContactProfile $profile): void {
		$returnProfileID = -1;

		if (!($profile instanceof WeeklyContactProfile))
			throw new InvalidArgumentException('Error: Not valid WeeklyContactProfile object');

		try {
			$db = Database::getDB();
			$stmt = $db->prepare(
				'insert into WeeklyContactProfiles (profileID, name, customMessage, isProfileActive, userID)
					values (:profileID, :name, :customMessage, :isProfileActive, :userID)');
			$stmt->execute(array(
				':profileID' => $profile->getProfileID(),
				':name' => $profile->getName(),
				':customMessage' => $profile->getCustomMessage(),
				':isProfileActive' => $profile->isProfileActive(),
				':userID' => $profile->getUserID()
			));
			$returnProfileID = $db->lastInsertId('profileID');

		} catch (PDOException $e) {
			$profile->setError('weeklyContactProfilesDB', 'ADD_PROFILE_FAILED');
		} catch (RuntimeException $e) {
			$profile->setError('database', 'DB_CONFIG_NOT_FOUND');
		}

		if ($returnProfileID !== -1)
			$profile->setProfileID($returnProfileID);
		else
			$profile->setError('weeklyContactProfilesDBDB', 'ADD_PROFILE_FAILED');
	}

	/** Returns an array of WeeklyContactProfile objects for all users in the database */
	public static function getAllForUser($userID): ?array {
		$allContactProfiles = array();

		try {
			$db = Database::getDB();
			$stmt = $db->prepare('select * from WeeklyContactProfiles join Users using (userID)');
			$stmt->execute();

			foreach ($stmt as $row) {
				$profile = new WeeklyContactProfile($row);
				if (!is_object($profile) || !empty($profile->getErrors()))
					throw new PDOException('Failed to create valid contact profile');

				$allContactProfiles[] = $profile;
			}

		} catch (PDOException $e) {
			echo $e->getMessage();
		} catch (RuntimeException $e) {
			echo $e->getMessage();
		}

		return $allContactProfiles;
	}

	/** Returns a WeeklyContactProfile object whose $type field
	 * has value $value, or null if no matching user is found */
	private static function getBy($type, $value): ?WeeklyContactProfile {
		$allowed = array('profileID', 'name');
		$profile = null;

		try {
			if (!in_array($type, $allowed))
				throw new PDOException("$type not allowed search criterion for WeeklyContactProfile");

			$db = Database::getDB();
			$stmt = $db->prepare("select * from WeeklyContactProfiles where ($type = :$type)");
			$stmt->execute(array(":$type" => $value));

			$row = $stmt->fetch(PDO::FETCH_ASSOC);
			if ($row !== false)
				$profile = new WeeklyContactProfile($row);

		} catch (PDOException $e) {
			echo $e->getMessage();
		} catch (RuntimeException $e) {
			echo $e->getMessage();
		}

		return $profile;
	}

	/** Retrieves the contact profile from the database with the given profileID. */
	public static function get($profileID): ?WeeklyContactProfile {
		return self::getBy('profileID', $profileID);
	}

	/** Retrieves the contact profile from the database with the given profile name. */
	public static function getByName($profileName): ?WeeklyContactProfile {
		return self::getBy('name', $profileName);
	}

	/** Updates any editable fields of the given profile. */
    public static function edit(WeeklyContactProfile $profile) {
		try {
			$db = Database::getDB();
			$stmt = $db->prepare(
				'update WeeklyContactProfiles set
					name = :name,
					customMessage = :customMessage,
					isProfileActive = :isProfileActive,
					userID = :userID
				where profileID = :profileID'
			);
			$stmt->execute(array(
				':name' => $profile->getName(),
				':customMessage' => $profile->getCustomMessage(),
				':isProfileActive' => $profile->isProfileActive(),
				':userID' => $profile->getUserID(),
				':profileID' => $profile->getProfileID()
			));
		} catch (PDOException $e) {
			 $profile->setError('weeklyContactProfilesDB', 'EDIT_PROFILE_FAILED');
		} catch (RuntimeException $e) {
			 $profile->setError('database', 'DB_CONFIG_NOT_FOUND');
		}
  }

  /** Deletes the contact profile with the given profile ID.
	* Returns true on success, or false otherwise. */
	public static function delete($profileID) {
		try {
			$db = Database::getDB();
			$stmt = $db->prepare( "delete from WeeklyContactProfiles where profileID = :profileID" );
			$stmt->execute(array(":profileID" => $profileID));

		} catch (PDOException $e) {
			return false;
		} catch (RuntimeException $e) {
			return false;
		}

		return true;
	}

}
?>