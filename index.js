var fs = require("fs");

class WebpackBasicSourcemap {
	constructor(options) {
	}
	apply(compiler) {
		// Setup callback for accessing a compilation:
		compiler.plugin("after-compile", function(compilation) {
			this.AddBasicSourceMap(compilation.compiler.outputPath + "/Libraries.js");
			this.AddBasicSourceMap(compilation.compiler.outputPath + "/Main.js");
		});
	}
	AddBasicSourceMap(filePath, storeAsVarName) {
		var oldText = fs.readFileSync(filePath);
		var lines = oldText.split("\n");
		var moduleStartLines = {};
		for (let [lineIndex, line] of lines.entries()) {
			var moduleIndexMatch = line.match(/^\/\* ([0-9]+) \*\/$/);
			if (moduleIndexMatch) {
				var moduleIndex = moduleIndexMatch[1];
				moduleStartLines[moduleIndex] = lineIndex;
			}
		}
		
		debugger;
		
		var appendText = "\n\nwindow." + storeAsVarName + " = " + JSON.stringify(moduleStartLines);
		fs.appendFileSync(filePath, appendText, {encoding: "utf8"});
	}
}

/*WebpackBasicSourcemap.prototype.apply = function(compiler) {
};*/

module.exports = WebpackBasicSourcemap;