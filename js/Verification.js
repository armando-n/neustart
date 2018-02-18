(function() {

	$(document).ready(function() {
		history.pushState({}, "", "/user/verify");
		const button = $('#resend-code-btn');
		const userData = button.data('userData');

		$('#resend-code-btn').click(function() {
			$.ajax({
				url: '/text/verification',
				data: { userData: userData },
				dataType: 'json',
				method: 'post',
				async: false,
				success: function(result) {
					if (!result.success) {
						// TODO display error message
						returnValue = false;
					}
				},
				error: function() {
					console.log('Failed to receive response from server for user name check.');
					// TODO display error message
					returnValue = false;
				}
			});

			button.text('Code sent');
			setTimeout(function() {
				button.text('Resend code');
			}, 4000);
		});
	});

})();