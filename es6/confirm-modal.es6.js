import 'babel-polyfill';

window.addEventListener('load', init);

let confirmedAction;
let deniedAction;

function init() {
	document.getElementById('yes').onclick = yesClicked;
	document.getElementById('no').onclick = noClicked;
}

export function show(actionOnConfirm = ()=>{}, actionOnDeny = ()=>{}) {
if (typeof actionOnConfirm !== 'function' || typeof actionOnDeny !== 'function')
	throw new Error('Invalid arguments passed to ConfirmModal.show');

	confirmedAction = actionOnConfirm;
	deniedAction = actionOnDeny;

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

function noClicked() {
	close();
	deniedAction();
}

function close() {
	getModal().style.display = 'none';
}

function getModal() {
	return document.getElementById('confirm-modal');
}