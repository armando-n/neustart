<?php
class UsersDB {

	/** Adds the specified User object to the database, and sets the ID of the
	 * given user object to the ID assigned to the user in the database. */
	public static function addUser(User $user) {
		$returnUserID = -1;

		if (!($user instanceof User))
			throw new InvalidArgumentException('Error: Not valid User object');

		try {
			$db = Database::getDB();
			$stmt = $db->prepare(
				'insert into Users (userName, password, mainName, phone, isAdministrator)
					values (:userName, :password, :mainName, :phone, :isAdministrator)');
			$stmt->execute(array(
				':userName' => $user->getUserName(),
				':password' => $user->getPassword(),
				':mainName' => $user->getMainName(),
				':phone' => $user->getPhone(),
				':isAdministrator' => $user->isAdministrator()
			));
			$returnUserID = $db->lastInsertId('userID');

		} catch (PDOException $e) {
			$user->setError('usersDB', 'ADD_USER_FAILED');
		} catch (RuntimeException $e) {
			$user->setError('database', 'DB_CONFIG_NOT_FOUND');
		}

		if ($returnUserID !== -1)
			$user->setUserID($returnUserID);
		else
			$user->setError('usersDB', 'ADD_USER_FAILED');
	}

	/** Returns an array of User objects for all users in the database */
	public static function getAllUsers() {
		$allUsers = array();

		try {
			$db = Database::getDB();
			$stmt = $db->prepare('select * from Users');
			$stmt->execute();

			foreach ($stmt as $row) {
				$user = new User($row);
				if (!is_object($user) || !empty($user->getErrors()))
					throw new PDOException('Failed to create valid user');

				$allUsers[] = $user;
			}

		} catch (PDOException $e) {
			echo $e->getMessage();
		} catch (RuntimeException $e) {
			echo $e->getMessage();
		}

		return $allUsers;
	}

	/** Returns a User object whose $type field has value
	 * $value, or null if no matching user is found */
	private static function getUserBy($type, $value): ?User {
		$allowed = array('userID', 'userName', 'mainName');
		$user = null;

		try {
			if (!in_array($type, $allowed))
				throw new PDOException("$type not allowed search criterion for User");

			$db = Database::getDB();
			$stmt = $db->prepare("select * from Users where ($type = :$type)");
			$stmt->execute(array(":$type" => $value));

			$row = $stmt->fetch(PDO::FETCH_ASSOC);
			if ($row !== false)
				$user = new User($row);

		} catch (PDOException $e) {
			echo $e->getMessage();
		} catch (RuntimeException $e) {
			echo $e->getMessage();
		}

		return $user;
	}

	/** Retrieves the user from the database with the given userID. */
	public static function getUser($userID): ?User {
		return self::getUserBy('userID', $userID);
	}

	/** Retrieves the user from the database with the given user name. */
	public static function getUserByName($userName): ?User {
		return self::getUserBy('userName', $userName);
	}

	/** Retrieves the user from the database whose main character has the given name. */
	public static function getUserByMainName($mainName): ?User {
		return self::getUserBy('mainName', $mainName);
	}

	/** Returns true if a user with the given user name exists
	 * in the database, or false otherwise. */
	public static function userExists($userName) {
		$user = self::getUserByName($userName);
		return !is_null($user);
	}

	/** Returns true if a user with the given main character
	 * name exists in the database, or false otherwise. */
	public static function mainExists($mainName) {
		$user = self::getUserByMainName($mainName);
		return !is_null($user);
	}

	public static function getAllUsersSortedByDateCreated($order) {
		$allowedOrders = array('asc', 'desc');
		$allUsers = array();

		try {
			if (!in_array($order, $allowedOrders))
				throw new Exception("$order is not an allowed order");

			$db = Database::getDB();
			$stmt = $db->prepare("select * from Users order by dateCreated $order");
			$stmt->execute();

			foreach ($stmt as $row) {
				$user = new User($row);
				if (!is_object($user) || !empty($user->getErrors()))
					throw new PDOException('Failed to create valid user');

				$allUsers[] = $user;
			}

		} catch (PDOException $e) {
			echo $e->getMessage();
		} catch (RuntimeException $e) {
			echo $e->getMessage();
		}

		return $allUsers;
	}

	// returns an array of User objects created since the specified date string
	public static function getUsersCreatedSince($dateString, $dbName = null, $configFile = null) {
		return UsersDB::getUsersByDate($dateString, 'after', $dbName, $configFile);
	}

	// returns an array of User objects created by the specified date string
	public static function getUsersCreatedBy($dateString, $dbName = null, $configFile = null) {
		return UsersDB::getUsersByDate($dateString, 'before', $dbName, $configFile);
	}

	private static function getUsersByDate($dateString, $direction, $dbName = null, $configFile = null) {
		$allowedDirections = array('before', 'after');
		$users = array();

		try {
			if (!in_array($direction, $allowedDirections))
				throw new PDOException("$direction is not an allowed direction");
			$operator = ($direction === 'before') ? '<=' : '>=';

			$datetime = new DateTime($dateString);
			$db = Database::getDB($dbName, $configFile);
			$stmt = $db->prepare("select * from Users where dateCreated $operator :date");
			$stmt->execute(array(':date' => $datetime->format('Y-m-d')));

			$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
			if ($rows !== false)
				foreach ($rows as $row)
					$users[] = new User($row);

		} catch (PDOException $e) {
			echo $e->getMessage();
		} catch (RuntimeException $e) {
			echo $e->getMessage();
		} catch (Exception $e) {
			if (stripos($e->getMessage(), 'Failed to parse') !== false)
				throw new Exception("Invalid date: $dateString");
			else
				throw $e;
		}

		return $users;
	}

	/** Updates any editable fields of the given $user. */
    public static function edit(User $user) {
		try {
			$db = Database::getDB();
			$stmt = $db->prepare(
				'update Users set
					userName = :userName,
					password = :password,
					mainName = :mainName,
					phone = :phone,
					isVerified = :isVerified,
					isPhoneVerified = :isPhoneVerified,
					isAdministrator = :isAdministrator
				where userID = :userID'
			);
			$stmt->execute(array(
				':userName' => $user->getUserName(),
				':password' => $user->getPassword(),
				':mainName' => $user->getMainName(),
				':phone' => $user->getPhone(),
				':isVerified' => $user->isVerified(),
				':isPhoneVerified' => $user->isPhoneVerified(),
				':isAdministrator' => $user->isAdministrator(),
				':userID' => $user->getUserID()
			));
		} catch (PDOException $e) {
			 $newUser->setError('usersDB', 'EDIT_USER_FAILED');
		} catch (RuntimeException $e) {
			 $newUser->setError('database', 'DB_CONFIG_NOT_FOUND');
		}
  }

  /** Deletes the user with the given user ID.
	* Returns true on success, or false otherwise. */
	public static function deleteUser($userID) {
		try {
			$db = Database::getDB();
			$stmt = $db->prepare( "delete from Users where userID = :userID" );
			$stmt->execute(array(":userID" => $userID));

		} catch (PDOException $e) {
			return false;
		} catch (RuntimeException $e) {
			return false;
		}

		return true;
	}

}
?>