"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ts = require("typescript");
var fs = require("fs");
var path = require("path");
var tsquery_1 = require("@phenomnomnominal/tsquery");
var prettier = require("prettier");
var jsdiff = require("diff");
var colors = require("colors/safe");
var prettifyCode = function (code) {
    return prettier.format(code, {
        tabWidth: 4,
        semi: false,
        singleQuote: true,
        trailingComma: 'es5',
        parser: 'typescript',
    });
};
var SourceCode = /** @class */ (function () {
    function SourceCode(source) {
        this.source = source;
        this.ast = ts.createSourceFile('', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
        this.printer = ts.createPrinter({
            newLine: ts.NewLineKind.LineFeed,
            removeComments: false,
        });
        this.result = ts.createSourceFile('Output!', '', ts.ScriptTarget.Latest, false, ts.ScriptKind.TS);
    }
    SourceCode.fromFile = function (filename) {
        var source = fs.readFileSync(filename, 'utf8');
        var result = new SourceCode(source);
        result.fullPath = filename;
        result.filename = path.basename(filename);
        return result;
    };
    SourceCode.extractFirst = function (selector, source) {
        return SourceCode.extract(selector, source)[0];
    };
    SourceCode.extract = function (selector, source) {
        return tsquery_1.tsquery(source, selector);
    };
    SourceCode.prototype.query = function (selector) {
        return tsquery_1.tsquery.query(this.ast, selector);
    };
    SourceCode.prototype.modify = function (options) {
        var result = this.query(options.selector);
        try {
            options.action(result);
        }
        catch (e) {
            console.log('Error: ', e);
        }
    };
    SourceCode.prototype.modifyParent = function (options) {
        var result = this.query(options.selector);
        try {
            options.action(result[0].parent);
        }
        catch (e) {
            console.log('Error: ', e);
        }
    };
    SourceCode.prototype.stringify = function () {
        var result = this.printer.printFile(this.ast);
        var diff = jsdiff.diffChars(this.source, result);
        var output = '';
        diff.forEach(function (part) {
            if (part.removed) {
                if (part.value == '\n')
                    output += part.value;
                return;
            }
            output += part.value;
        });
        try {
            output = prettifyCode(output);
            return output;
        }
        catch (e) {
            return output;
        }
    };
    SourceCode.prototype.writeToFile = function (file) {
        var code = this.stringify();
        fs.writeFileSync(file, code, 'utf8');
    };
    SourceCode.prototype.logDiff = function () {
        var one = this.source;
        var other = this.stringify();
        var diff = jsdiff.diffLines(one, other);
        var allLines = [];
        var lineCounter = 0;
        var getNumber = function () {
            var result = lineCounter;
            lineCounter++;
            return result;
        };
        var ranges = [];
        var saveRange = function (lines) {
            if (lines.length == 1) {
                ranges.push({
                    start: lines[0].index,
                    end: lines[0].index,
                });
            }
            else {
                ranges.push({
                    start: lines[0].index,
                    end: lines[lines.length - 1].index,
                });
            }
        };
        var getLines = function (val, type) {
            var spacer = type == 'add' ? '+' : type == 'remove' ? '-' : ' ';
            var result = [];
            var lines = val.split('\n');
            for (var i = 0; i < lines.length; i++) {
                var v = lines[i];
                if (!v && type == 'unchanged') {
                    v = '  ';
                }
                if (!v)
                    continue;
                if (i == lines.length - 1 && v.match(/^\s*$/)) {
                    continue;
                }
                else {
                    v = "" + spacer + spacer + " " + v;
                    if (type == 'add')
                        v = colors.green(v);
                    if (type == 'remove')
                        v = colors.red(v);
                    result.push({
                        value: v,
                        type: type,
                        index: getNumber(),
                    });
                }
            }
            return result;
        };
        diff.forEach(function (d) {
            if (!d.added && !d.removed) {
                allLines = allLines.concat(getLines(d.value, 'unchanged'));
            }
            if (d.added) {
                var adds = getLines(d.value, 'add');
                allLines = allLines.concat(adds);
                saveRange(adds);
            }
            if (d.removed && d.value !== '\n') {
                var removes = getLines(d.value, 'remove');
                allLines = allLines.concat(removes);
                saveRange(removes);
            }
        });
        var fragments = [];
        ranges = ranges.reduce(function (consolidated, next) {
            if (consolidated.length == 0) {
                consolidated.push(next);
            }
            else {
                if (consolidated[consolidated.length - 1].end + 1 ==
                    next.start) {
                    consolidated[consolidated.length - 1].end = next.end;
                }
                else {
                    consolidated.push(next);
                }
            }
            return consolidated;
        }, []);
        console.log(ranges);
        var context = 3;
        for (var _i = 0, ranges_1 = ranges; _i < ranges_1.length; _i++) {
            var r = ranges_1[_i];
            console.log(colors.cyan("\n@@ " + this.fullPath.replace(__dirname, '.') + "\n"));
            var before = allLines.slice(r.start - context < 0 ? 0 : r.start - context, r.start);
            console.log(before.map(function (v) { return v.value; }).join('\n'));
            var content = allLines.slice(r.start, r.end + 1);
            console.log(content.map(function (v) { return v.value; }).join('\n'));
            var after = allLines.slice(r.end + 1, r.end + context + 1);
            console.log(after.map(function (v) { return v.value; }).join('\n'));
        }
    };
    return SourceCode;
}());
exports.SourceCode = SourceCode;
