import 'babel-polyfill';

function get(url, data = {}) {
	return request (url, data, { method: 'GET' });
}

function post(url, data = {}) {
	return request (url, data, { method: 'POST' });
}

function put(url, data = {}) {
	return request(url, data, { method: 'PUT' });
}

function remove(url, data = {}) {
	return request(url, data, { method: 'DELETE' });
}

function request(url, data = {}, requestInit = {}) {
	Object.assign(requestInit, {
		body: JSON.stringify(data),
		headers: new Headers({
			'Content-Type': 'application/json',
			'Accept': 'application/json'
		}),
		credentials: 'same-origin'
	});

	return fetch(url, requestInit)
		.then(rawResponse => rawResponse.json())
		.then(response => {
			if (!response.success)
				throw new Error(response.error);
			return response.data;
		});
}

export default { get, post, put, remove };