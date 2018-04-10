import 'babel-polyfill';

/** Make a GET request using the given url (and data, if present). */
function get(url, data = {}) {
	return request (url, data, { method: 'GET' });
}

/** Make a POST request using the given url (and data, if present). */
function post(url, data = {}) {
	return request (url, data, { method: 'POST' });
}

/** Make a PUT request using the given url (and data, if present). */
function put(url, data = {}) {
	return request(url, data, { method: 'PUT' });
}

/** Make a DELETE request using the given url (and data, if present). */
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