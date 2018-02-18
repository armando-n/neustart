(function() {

	$(document).ready(function() {
		$('.form-text').addClass('invalid-input');
		$('#userName').blur(checkUserName);
	});

	function checkUserName() {
		const input = $('#userName');
		const userName = input.val().trim();
		const help = $('#userNameHelp');

		if (userName.length === 0)
			return;
		
		validateInput(input, help, 'User name', null, 20, /^[a-zA-Z0-9-]+$/, 'only numbers/letters/dashes allowed.')
		if (!isValid(input))
			return;

		// show loading icon
		help.html('<img src="/images/icon_loading_small.gif" alt="loading icon" class="img-responsive" />');

		// send request to server to make sure user name is not already taken
		$.ajax({
			url: '/user/exists',
			data: $('#userName').serialize(),
			dataType: 'json',
			async: true,
			success: function(response) {
				if (response.success) { // unable to retreive user with specified user name. it must not exist.
					if (response.data === true)
						markInvalid(input, help, 'This user name is already taken. Please try another.');
					else
						markValid(input, help, false, 'User name available');
				} else
					markInvalid(input, help, 'An error occured while checking user name availability.');
			},
			error: function() {
				markInvalid(input, help, 'An error occured while checking user name availability.');
			}
		});
	}

	function validateInput(input, help, inputName, minLength, maxLength, regex, validForm) {
		const inputVal = input.val().trim();
		const isValidFormat = regex.test(inputVal);

		markValid(input, help);

		if (minLength && inputVal.length < minLength)
			return markInvalid(input, help, inputName+' must be at least '+minLength+' characters long.');

		if (maxLength && inputVal.length > maxLength)
			return markInvalid(input, help, inputName+' cannot be more than '+maxLength+' characters long.');

		if (!isValidFormat)
			return markInvalid(input, help, inputName+' invalid. It must be of the form: '+validForm);

		if (!isValid(input))
			return;

		// success
		markValid(input, help, '');
	}

	function markInvalid(input, help, message) {
		input.addClass('border border-danger');
		help.addClass('invalid-input').html(message);
	}

	function markValid(input, help, removeMessage = true, message) {
		input.removeClass('border border-danger');
		help.removeClass('invalid-input').addClass('valid-input');
		if (removeMessage)
			help.html('');
		else if (message)
			help.html(message);
	}

	function isValid(input) {
		return !input.hasClass('border-danger');
	}

})();