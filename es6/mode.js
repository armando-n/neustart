import 'babel-polyfill'

let mode = '';
document.getElementById('debug-mode').innerText = "mode: ''";

const Mode = {
	set(newMode) {
		mode = newMode;
		document.getElementById('debug-mode').innerText = `mode: ${newMode || "''"}`;
	},
	get() {
		return mode;
	}
}

export default Mode;