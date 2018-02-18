<?php
class LoginView {

	public static function show() {
		$_SESSION['styles'][] = 'Login.css';
		$_SESSION['scripts'][] = 'Login.js';
		HeaderView::show();
		LoginView::showBody();
	}

	public static function showBody() {
		$userName = $_SESSION['userName'] ?? '';
		?>

<div class="container-fluid">

	<section id="login-section" class="row justify-content-center mt-3">
		<div class="col-sm-auto">

			<div class="card p-4">
				<h3 class="card-title text-center">Log In</h3>
				<div class="card-body pb-0">

					<form action="/user/login" method="post">
						<div class="form-group">
							<label for="userName">User Name</label>
							<input type="text" id="login_userName" name="userName" value="<?=$userName?>" class="form-control" size="25" autofocus="autofocus" required="required" maxlength="20" />
						</div>

						<div class="form-group">
							<label for="password">Password</label>
							<input type="password" id="login_password" name="password" class="form-control" size="25" required="required" maxlength="255" />
						</div>

						<div class="row mt-4">
							<div class="col">
								<button type="submit" class="btn btn-primary btn-block">Submit</button>
							</div>
						</div>

						<div class="text-center mt-4">
							<a href="/user/signup">New user? Sign up!</a>
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