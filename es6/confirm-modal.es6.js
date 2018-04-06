import 'babel-polyfill';

window.addEventListener('load', init);

let confirmedAction;

function init() {
	document.getElementById('yes').onclick = yesClicked;
	document.getElementById('no').onclick = close;
}

export function show(actionOnConfirm) {
	confirmedAction = actionOnConfirm;

	const modal = getModal();
	modal.style.opacity = '0.0';
	modal.style.display = 'inline-block';

	// timeout necessary to obtain correct dimensions
	setTimeout(() => {
		const modalDomRect = modal.getBoundingClientRect();
		const modalTop = window.innerHeight > modalDomRect.height ? (window.innerHeight/2 - modalDomRect.height/2) : 0;
		const modalLeft = window.innerWidth/2 - modalDomRect.width/2;
		modal.style.top = `${modalTop}px`;
		modal.style.left = `${modalLeft}px`;
		modal.style.opacity = '1.0';
	}, 0);
}

function yesClicked() {
	close();
	confirmedAction();
}

function close() {
	getModal().style.display = 'none';
}

function getModal() {
	return document.getElementById('confirm-modal');
}