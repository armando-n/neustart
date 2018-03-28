<?php
class SignupView {

	public static function show() {
		$_SESSION['scripts'][] = 'signup.js';
		HeaderView::show();
		SignupView::showBody();
	}

	public static function showBody() {
		$userSet = isset($_SESSION) && isset($_SESSION['badUser']);
		if ($userSet)
			$user = $_SESSION['badUser'];
		?>

<div class="container-fluid">

	<section id="signup-section" class="row justify-content-center mt-3">
		<div class="col-sm-auto">

			<div class="card p-4">
				<h3 class="card-title text-center">Sign up</h3>
				<div class="card-body">
					<form action="/user/signup" method="post" class="needs-validation" novalidate>
						<div class="form-group mb-2">
							<label for="userName">User Name</label>
							<input type="text" id="userName" name="userName" value="<?=$userSet ? $user ->getUserName() : ''?>" class="form-control" aria-describedby="userNameHelp" size="25" autofocus="autofocus" required="required" maxlength="20" />
							<span id="userNameHelp" class="form-text"><?=$userSet ? $user->getErrors()['userName'] ?? '' : ''?></span>
						</div>

						<div class="form-group">
							<label for="mainName">Main Character's Name</label>
							<input type="text" id="signup_mainName" name="mainName" value="<?=$userSet ? $user->getMainName() : ''?>" class="form-control" aria-describedby="mainNameHelp" size="25" required="required" maxlength="25" />
							<span id="mainNameHelp" class="form-text"><?=$userSet ? $user->getErrors()['mainName'] ?? '' : ''?></span>
						</div>

						<div class="form-group">
							<label for="phone">Phone #</label>
							<input type="tel" id="signup_phone" name="phone" value="<?=$userSet ? $user->getPhone() : '' ?>" class="form-control" aria-describedby="phoneHelp" size="15" required="required" maxlength="15" placeholder="xxx-xxx-xxxx" pattern="^(\+\d\s*[-\/\.]?)?(\((\d{3})\)|(\d{3}))\s*[-\/\.]?\s*(\d{3})\s*[-\/\.]?\s*(\d{4})\s*(([xX]|[eE][xX][tT])\.?\s*(\d+))*$" title="xxx-xxx-xxx or +x xxx-xxx-xxxx"/>
							<span id="phoneHelp" class="form-text"><?=$userSet ? $user->getErrors()['phone'] ?? '' : ''?></span>
						</div>

						<div class="form-group">
							<label for="password1">Password</label>
							<input type="password" id="password1" name="password1" class="form-control" aria-describedby="password1Help" size="25" required="required" minlength="4" maxlength="255" />
							<span id="password1Help" class="form-text"><?=$userSet ? $user->getErrors()['password'] ?? '' : ''?></span>
						</div>

						<div class="form-group">
							<label for="password2">Confirm Password</label>
							<input type="password" id="password2" name="password2" class="form-control" aria-describedby="password2Help" size="25" required="required" minlength="4" maxlength="255" />
							<span id="password2Help" class="form-text"><?=$userSet ? $user->getErrors()['password'] ?? '' : ''?></span>
						</div>

						<div class="row justify-content-between">
							<div class="col pr-0 mr-1 mt-3">
								<button type="submit" class="btn btn-primary btn-block">Submit</button>
							</div>
							<div class="col pl-0 ml-1 mt-3">
								<a href="/user/login" class="btn btn-secondary btn-block">Cancel</a>
							</div>
						</div>
					</form>
				</div>
			</div>
		</div>
	</section>

</div>
<?php
	}
}

?>