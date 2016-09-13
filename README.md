# webpack-basic-sourcemap
Parses module start-lines from bundle, then modifies error stack-traces to show calculated original file-lines.

## Usage
1) Run `npm install --save webpack-basic-sourcemap`.  
2) Add the following to your `webpack.config` file:  
```
var WebpackBasicSourcemap = require("./node_modules_CustomExternal/webpack-basic-sourcemap");
// ...
// module.exports = {
// ...
	plugins: [
		new WebpackBasicSourcemap(),
// ...
//};
```
3) Add the following to a JS file in your project:  
```
TODO
```