const path = require('path');

module.exports = {
	entry: './es6/Dashboard.es6.js',
	output: {
		filename: 'js/Dashboard.js',
		path: path.resolve(__dirname, 'dist')
	},
	devtool: 'source-map',
	module: {
		rules: [
			{
				test: /\.js$/,
				exclude: /node_modules/,
				use: {
					loader: 'babel-loader',
					options: {
						presets: ['../node_modules/babel-preset-env']
					}
				}
			}
		]
	},
	resolve: {
		alias: {
			modules: './node_modules/'
		}
	}
};