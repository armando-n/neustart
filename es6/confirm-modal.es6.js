import 'babel-polyfill';
import IconLoader from './icon-loader.es6';

let confirmedAction;
let deniedAction;

init();

function init() {
	const confirmButton = document.getElementById('confirm');
	const denyButton = document.getElementById('deny');

	confirmButton.onclick = yesClicked;
	denyButton.onclick = noClicked;

	IconLoader.createDeleteIcon(confirmButton, 12, 12, 'rgba(255, 0, 0, 0.75)', true, -7, 1);
	IconLoader.createForbiddenIcon(denyButton, 10, 10, 'rgba(255, 255, 255, 0.75)', true, -6, 0);

	// Array.from(confirmButton.getElementsByTagName('rect')).forEach(rect => rect.classList.add('delete'));
}

export function show(actionOnConfirm = ()=>{}, actionOnDeny = ()=>{}) {
	if (typeof actionOnConfirm !== 'function' || typeof actionOnDeny !== 'function')
		throw new Error('Invalid arguments passed to ConfirmModal.show');

		confirmedAction = actionOnConfirm;
		deniedAction = actionOnDeny;

		const modalContainer = getModalContainer();
		modalContainer.style.display = 'flex';

		const modal = getModal();
		modal.style.display = 'block';

	// // timeout necessary to obtain correct dimensions
	// setTimeout(() => {
	// 	const modalDomRect = modal.getBoundingClientRect();
	// 	const modalTop = window.innerHeight > modalDomRect.height ? (window.innerHeight/2 - modalDomRect.height/2) : 0;
	// 	const modalLeft = window.innerWidth/2 - modalDomRect.width/2;
	// 	modal.style.top = `${modalTop}px`;
	// 	modal.style.left = `${modalLeft}px`;
	// 	modal.style.opacity = '1.0';
	// }, 0);
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
	getModalContainer().style.display = 'none';
	getModal().style.display = 'none';
}

function getModalContainer() {
	return document.querySelector('.modal-container');
}

function getModal() {
	return document.getElementById('confirm-modal');
}