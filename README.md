# webpack-basic-sourcemap
Parses module start-lines in bundle, embeds the info into the JS, then adds an \<Error\>.Stack getter which calculates the original files/lines.

It's an alternative to regular source-maps, for when you need the source stack-traces in the JS code itself, and synchronously.

## Notes

##### Transpilers should retain line-breaks

If you're using a transpiler in Webpack, you need to make sure it's set to retain the line-breaks of the original files.

For Babel, this means creating a `.babelrc` file with:
```
	"retainLines":true
```

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
	var newLines = oldLines.map(oldLine=> {
		let lineParts = oldLine.match(/^(.+?)\((.+?)\.js:([0-9]+)(?::([0-9]+))?\)$/);
		if (lineParts == null) return oldLine;

		let [, beforeText, bundlePath, rawLine, rawColumn] = lineParts;
		let bundleName = bundlePath.substr(bundlePath.lastIndexOfAny("/", "\\") + 1);
		//let bundle_modStartLinesInBundle = GetBundleInfo(bundleName).moduleFileStartLines_props_sortedByStartLine;
		let bundle_modStartLinesInBundle = window["ModuleFileStartLines_" + bundleName];

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

## Alternatives
If you don't need the source stack-trace synchronously, you can use a library that calculates source stack-traces from regular source-maps: (though this takes longer)
* https://github.com/stacktracejs/stacktrace.js