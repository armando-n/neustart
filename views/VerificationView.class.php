<?php
/** Displays a form to verify the user's phone number.  */
class VerificationView {

	public static function show() {
		$_SESSION['scripts'][] = 'Verification.js';
		HeaderView::show();
		self::showBody();
	}

	public static function showBody() {
		$user = $_SESSION['user'];
		$user->clearPassword();
		$userJson = htmlspecialchars(json_encode($user), ENT_QUOTES, 'UTF-8');
		$showSkip = isset($_SESSION['showSkipButton']) ? '' : ' d-none';
		?>
<div class="container">
	<section id="verification-section" class="row justify-content-center mt-3">
		<div class="col-sm-auto">

			<div class="card p-4">
				<h3 class="card-title text-center">Verify Phone Number</h3>
				<div class="text-muted text-center"><?=$user->getPhonePretty()?></div>
				<div class="card-body">

					<form action="/user/verify" method="post">
						<div><label for="verificationCode" class="d-none">Code</label></div>
						<div class="input-group">
							<input type="text" id="code" name="code" value="" class="form-control" aria-describedby="codeHelp" size="25" autofocus="autofocus" required="required" maxlength="20" />
							<div class="input-group-append">
								<button id="submit-btn" type="submit" class="btn btn-primary">OK</button>
							</div>
						</div>
						<div><span id="codeHelp" class="form-text text-muted">Enter the code sent to your phone</span></div>
					</form>

					<div class="row mt-4">
						<div class="col">
							<button id="resend-code-btn" data-user-data="<?=$userJson?>" type="button" class="btn btn-outline-secondary btn-block">Resend Code</button>
						</div>
					</div>

					<div class="row mt-4<?=$showSkip?>">
						<div class="col">
							<button type="button" class="btn btn-outline-secondary btn-block">Skip</button>
						</div>
					</div>

				</div>
			</div>

		</div>
	</section>
</div>
<?php
	}
}

?>