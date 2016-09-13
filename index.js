var path = require("path");
var fs = require("fs");
var ConcatSource = require("webpack-core/lib/ConcatSource");

var Log = console.log;

class WebpackBasicSourcemap {
	constructor(options) {
		//this.options = options;
	}
	apply(compiler) {
		var outputPath =
			(compiler.options.devServer && compiler.options.devServer.outputPath)
			|| (compiler.options.output && compiler.options.output.path)
			|| compiler.options.outputPath;
		//Log("Output path) " + outputPath);
		
		/*compiler.plugin("compilation", (compilation, params)=> {
			// add filename banner before each module's text
			compilation.plugin("optimize-chunk-assets", (chunks, callback)=> {
				chunks.forEach(chunk=> {
					chunk.files.forEach(file=> {
						compilation.assets[file] = new ConcatSource("\/** Filename: " + file.name + " **\/ ", compilation.assets[file]);
					});
				});
				callback();
			});
		});*/
			
		/*compiler.plugin("compilation", (compilation, params)=> {
			var compilation = stats.compilation;
			/*compiler.plugin("after-compile", compilation=> {
				for (let bundleFileName of this.options.bundleFileNames)
					this.AddBasicSourceMap(compilation, path.resolve(outputPath, bundleFileName));
			});*#/
			// add JSON object to end of bundle, that runs and tells the modules what line they each started at
			compilation.plugin("after-optimize-chunk-assets", chunks=> {
				/*for (let bundleFileName of this.options.bundleFileNames) {
					var chunk = chunks.find(a=>a.name == path.basename(bundleFileName, ".js"));
					this.AddBasicSourceMap(chunk.modules, path.resolve(outputPath, bundleFileName + ".js"));
				}*#/
				for (let chunk of chunks)
					this.AddBasicSourceMap(chunk.modules, path.resolve(outputPath, chunk.name + ".js"));
			});
		});*/
			
		compiler.plugin("done", stats=> {
			for (let chunk of stats.compilation.chunks)
				this.AddBasicSourceMap(chunk.modules, path.resolve(outputPath, chunk.name + ".js"));
		});
	}
	AddBasicSourceMap(modules, filePath) {
		var oldText = fs.readFileSync(filePath, {encoding: "utf8"});
		var lines = oldText.split("\n");
		
		var moduleStartLines = {};
		var hasOldBasicSourceMap = false;
		for (let [lineIndex, line] of lines.entries()) {
			var moduleIDMatch = line.match(/^\/\* ([0-9]+) \*\/$/);
			if (moduleIDMatch) {
				// offset by 4, since there's some boilerplate-code lines (3 for module-declaration comment, 1 for blank line just after)
				lineIndex += 4;
				
				var moduleID = moduleIDMatch[1];
				var module = modules.find(a=>a.id == moduleID);
				if (module) {
					var moduleFilePath = module.request ? module.request.substr(module.request.lastIndexOf(":") - 1) : "[no path (entry file)]";
					moduleFilePath = moduleFilePath.replace(/\\/g, "/"); // standardize output to use /
					//var moduleFileName = /([A-Za-z_]+)\.[A-Za-z]$/.exec(moduleFilePath)[1];
					moduleStartLines[moduleFilePath] = lineIndex;
				}
				else {
					Log(`Warning: Can't find module with ID: ${moduleID}`);
					moduleStartLines["unknownModule" + moduleID] = lineIndex;
				}
			}
			
			if (line.startsWith("window.ModuleFileStartLines_"))
				hasOldBasicSourceMap = true;
		}
		
		Log("Adding basic source-map to) " + filePath);
		
		var fileNameWithoutExtension = path.basename(filePath, ".js");
		var appendText = "\n\nwindow.ModuleFileStartLines_" + fileNameWithoutExtension + " = " + JSON.stringify(moduleStartLines);
		
		if (!hasOldBasicSourceMap) {
			/*//fs.appendFileSync(filePath, appendText, {encoding: "utf8"});
			// delay a bit (i.e. run after this stack completes), since otherwise our append doesn't apply (there must be a writeFile call after this area of code runs)
			setTimeout(()=>fs.appendFileSync(filePath, appendText, {encoding: "utf8"}), 0);*/
			
			var newText = oldText + appendText;
			fs.writeFileSync(filePath, newText, {encoding: "utf8"});
			// delay a bit (i.e. run after this stack completes), since otherwise our writeFile doesn't apply (there must be a writeFile call after this area of code runs)
			//setTimeout(()=>fs.writeFileSync(filePath, newText, {encoding: "utf8"}), 0);
		}
		else {
			var oldText_withoutBasicSourceMap = lines.slice(0, lines.length - 2).join("\n");
			var newText = oldText_withoutBasicSourceMap + appendText;
			fs.writeFileSync(filePath, newText, {encoding: "utf8"});
		}
	}
}

module.exports = WebpackBasicSourcemap;