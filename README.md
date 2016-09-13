# webpack-basic-sourcemap
Parses module start-lines from bundle, then modifies error stack-traces to show calculated original file-lines.

## Usage
1) Run `npm install --save webpack-basic-sourcemap`.  
2) Add the following to your `webpack.config` file:  
```
var WebpackBasicSourcemap = require("webpack-basic-sourcemap");
// ...
// module.exports = {
// ...
	plugins: [
		new WebpackBasicSourcemap(),
// ...
//};
```
3) Add the following to your JS start file:  
```
// general polyfills
Object.defineProperty(Object.prototype, "Props", {enumerable: false, get: function() {
	var result = [];
	var i = 0;
	for (var propName in this)
		result.push({index: i++, name: propName, value: this[propName]});
	return result;
};
Object.defineProperty(Array.prototype, "Last", {enumerable: false, value: function(matchFunc = null) {
	if (matchFunc) {
        for (var i = this.length - 1; i >= 0; i--)
            if (matchFunc.call(this[i], this[i]))
                return this[i];
        return null;
    }
    return this[this.length - 1];
}});

// gets the source stack-trace of the error (i.e. the stack-trace as it would be without the js-files being bundled into one)
Object.defineProperty(Error.prototype, "Stack", {enumerable: false, get: function() {
	var rawStack = this.stack;
	var oldLines = rawStack.split("\n");
	var newLines = oldLines.Select(oldLine=> {
		let lineParts = oldLine.match(/^(.+?)\((.+?)\.js:([0-9]+)(?::([0-9]+))?\)$/);
		if (lineParts == null) return oldLine;

		let [, beforeText, bundlePath, rawLine, rawColumn] = lineParts;
		let bundleName = bundlePath.substr(bundlePath.lastIndexOfAny("/", "\\") + 1);
		//let bundle_modStartLinesInBundle = GetBundleInfo(bundleName).moduleFileStartLines_props_sortedByStartLine;
		let bundle_modStartLinesInBundle = g["ModuleFileStartLines_" + bundleName];

		let {name: moduleFilePath, value: moduleStartLine} = bundle_modStartLinesInBundle.Props.Last(a=>a.value <= rawLine);
		let moduleFileName = moduleFilePath.substr(moduleFilePath.lastIndexOfAny("/", "\\") + 1);
		let sourceLine = rawLine - moduleStartLine;
		return `${beforeText}(${bundleName}.js:${rawLine}${rawColumn ? ":" + rawColumn : ""})${""
				} (${moduleFileName}:${sourceLine}${rawColumn ? ":" + rawColumn : ""})`;
	});
	return newLines.join("\n");
}});
```
4) Whenever you need the source stack-trace of an error, just call:
```
error.Stack
```