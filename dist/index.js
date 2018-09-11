"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var ts = require("typescript");
var fs = require("fs");
var path = require("path");
var tsquery_1 = require("@phenomnomnominal/tsquery");
var prettier = require("prettier");
var jsdiff = require("diff");
var colors = require("colors/safe");
var glob = require("glob");
var util_1 = require("util");
var lodash_1 = require("lodash");
var dotprop = require("dot-prop");
var prettifyCode = function (code) {
    return prettier.format(code, {
        tabWidth: 4,
        semi: false,
        singleQuote: true,
        trailingComma: 'es5',
        parser: 'typescript',
    });
};
var SourceCodeList = /** @class */ (function () {
    function SourceCodeList(list) {
        this.list = list;
    }
    Object.defineProperty(SourceCodeList.prototype, "source", {
        get: function () {
            return this.list
                .map(function (s, idx) { return idx + ": '" + s.source + "'"; })
                .join('\n----\n');
        },
        enumerable: true,
        configurable: true
    });
    SourceCodeList.prototype.summarize = function (match) {
        if (!this.list)
            return [];
        return this.list.map(function (l) { return l.summarize(match); });
    };
    SourceCodeList.prototype.logDiff = function () {
        if (!this.list)
            return;
        this.list.forEach(function (l) { return l.logDiff(); });
    };
    SourceCodeList.prototype.match = function (selector) {
        if (!this.list)
            return false;
        return this.list.map(function (l) { return l.match(selector); }).filter(function (l) { return !!l; }).length > 0;
    };
    SourceCodeList.prototype.modifyParent = function (options) {
        if (!this.list)
            return;
        this.list.forEach(function (l) { return l.modifyParent(options); });
    };
    SourceCodeList.prototype.query = function (selector) {
        var results = [];
        this.list.forEach(function (l) {
            results = results.concat(l.query(selector));
        });
        return results;
    };
    SourceCodeList.prototype.stringify = function () {
        if (!this.list)
            return '';
        return this.list.map(function (l) { return l.stringify(); }).join('-----\n');
    };
    return SourceCodeList;
}());
var SourceCode = /** @class */ (function () {
    function SourceCode(source, type) {
        this.getLinesSimple = function (val, type) {
            var result = [];
            var lines = val.split('\n');
            for (var i = 0; i < lines.length; i++) {
                var v = lines[i];
                if (!v && type !== 'unchanged')
                    continue;
                result.push(v);
            }
            return result;
        };
        this.getLines = function (val, type, getNumber) {
            if (getNumber === void 0) { getNumber = null; }
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
                    // if (type == 'add') v = colors.green(v)
                    // if (type == 'remove') v = colors.red(v)
                    result.push({
                        value: v,
                        type: type,
                        index: getNumber ? getNumber() : -1,
                    });
                }
            }
            return result;
        };
        this.type = type;
        if (typeof source == 'string') {
            this.source = source;
            this.ast = ts.createSourceFile('', source, ts.ScriptTarget.Latest, true, type == 'tsx' ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
        }
        else {
            this.ast = source;
        }
        this.printer = ts.createPrinter({
            newLine: ts.NewLineKind.LineFeed,
            removeComments: false,
        });
        this.result = ts.createSourceFile('Output!', '', ts.ScriptTarget.Latest, false, ts.ScriptKind.TS);
    }
    SourceCode.query = function (node, selector) {
        return tsquery_1.tsquery.query(node, selector);
    };
    SourceCode.match = function (node, selector) {
        var result = tsquery_1.tsquery.query(node, selector);
        return !!result && result.length > 0;
    };
    SourceCode.identifier = function (id) {
        return SourceCode.extractFirst("Identifier[text=\"" + id + "\"]", "\n                import { " + id + " } from \"_\"\n            ");
    };
    SourceCode.logSummaries = function (files, options) {
        if (options === void 0) { options = null; }
        for (var _i = 0, files_1 = files; _i < files_1.length; _i++) {
            var file = files_1[_i];
            var path_1 = file.path, summary = file.summary;
            console.log(colors.black('\n' + path_1));
            console.log(summary.join('\n-----\n'));
        }
        if (options && options.variations) {
            var variations = lodash_1.uniq(lodash_1.flatten(files.map(function (f) { return f.exactText; })));
            console.log("\n\n" + variations.length + " Variations\n");
            console.log(variations.join('\n-----\n'));
        }
        console.log("\n\nFound " + files.reduce(function (t, f) { return t + f.summary.length; }, 0) + " matches across " + files.length + " files.");
    };
    SourceCode.arrowFunction = function (func) {
        return SourceCode.extractFirst("ArrowFunction", func);
    };
    SourceCode.fromAst = function (ast, type) {
        if (type === void 0) { type = 'ts'; }
        var c = new SourceCode('', type);
        c.ast = ast;
        return c;
    };
    SourceCode.extractFirst = function (selector, source) {
        return SourceCode.extract(selector, source)[0];
    };
    SourceCode.extract = function (selector, source) {
        return tsquery_1.tsquery(source, selector);
    };
    SourceCode.fromFile = function (filename) {
        var source = fs.readFileSync(filename, 'utf8');
        var result = new SourceCode(source, filename.match(/\.tsx$/) ? 'tsx' : 'ts');
        result.fullPath = filename;
        result.filename = path.basename(filename);
        return result;
    };
    SourceCode.searchFiles = function (root, options) {
        if (options === void 0) { options = null; }
        return __awaiter(this, void 0, void 0, function () {
            var files, result, _loop_1, _i, files_2, file;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, new Promise(function (resolve, reject) {
                            glob('**/*.ts?(x)', {
                                cwd: root,
                                ignore: ['**/node_modules/**/*'],
                            }, function (er, files) {
                                if (er) {
                                    reject(er);
                                    return;
                                }
                                resolve(files.map(function (f) { return ({
                                    path: path.join(root, f),
                                }); }));
                            });
                        })];
                    case 1:
                        files = _a.sent();
                        if (options && options.selector) {
                            result = [];
                            _loop_1 = function (file) {
                                try {
                                    var code_1 = SourceCode.fromFile(file.path);
                                    var r = code_1.query(options.selector);
                                    if (!!r && r.length > 0) {
                                        file.code = code_1;
                                        try {
                                            file.summary = r.map(function (m) { return code_1.summarize(m); });
                                            file.exactText = r.map(function (m) { return code_1.SC(m).stringify(); });
                                        }
                                        catch (e) { }
                                        result.push(file);
                                    }
                                }
                                catch (e) { }
                            };
                            for (_i = 0, files_2 = files; _i < files_2.length; _i++) {
                                file = files_2[_i];
                                _loop_1(file);
                            }
                            return [2 /*return*/, result];
                        }
                        return [2 /*return*/, files];
                }
            });
        });
    };
    SourceCode.prototype.pushToList = function (input) {
        var _this = this;
        var node = this.query(input.node)[0];
        if (!!node) {
            dotprop.set(node, input.listProperty, dotprop.get(node, input.listProperty).concat(input.items.map(function (i) { return _this.createNode(i.type, i.source); })));
        }
    };
    SourceCode.prototype.createNode = function (selector, source) {
        var _this = this;
        var node = SourceCode.extractFirst(selector, source);
        var literals = [
            'StringLiteral',
            'TemplateHead',
            'TemplateTail',
            'TemplateMiddle',
            'NumericLiteral',
            'NoSubstitutionTemplateLiteral',
        ];
        for (var _i = 0, literals_1 = literals; _i < literals_1.length; _i++) {
            var t = literals_1[_i];
            SourceCode.query(node, t).forEach(function (s) {
                _this.addLiteral(s, source);
            });
        }
        return node;
    };
    SourceCode.prototype.addLiteral = function (node, originalSource) {
        var value = originalSource.slice(node.pos, node.end);
        var newStart = this.ast.text.length;
        var newEnd = newStart + value.length;
        node.pos = newStart;
        node.end = newEnd;
        this.ast.text += value;
    };
    SourceCode.prototype.SC = function (input) {
        if (typeof input == 'string') {
            input = this.query(input);
        }
        if (util_1.isArray(input) && input.length > 1) {
            var items = [];
            for (var _i = 0, input_1 = input; _i < input_1.length; _i++) {
                var item = input_1[_i];
                var s = new SourceCode(item, this.type);
                s.source = this.source.slice(item.pos, item.end);
                if (this.document) {
                    s.document = this.document;
                }
                else {
                    s.document = this.ast;
                }
                items.push(s);
            }
            return new SourceCodeList(items);
        }
        var ast;
        if (util_1.isArray(input)) {
            ast = input[0];
        }
        else {
            ast = input;
        }
        var result = new SourceCode(ast, this.type);
        result.source = this.source.slice(ast.pos, ast.end);
        if (this.document) {
            result.document = this.document;
        }
        else {
            result.document = this.ast;
        }
        return result;
    };
    SourceCode.prototype.imports = function (identifier) {
        return this.match("ImportSpecifier[name.text=" + identifier + "]");
    };
    SourceCode.prototype.summarize = function (match) {
        var _this = this;
        if (typeof match == 'string') {
            var matches = this.query(match);
            if (matches && matches.length > 0) {
                return matches.map(function (m) { return _this.summarize(m); });
            }
            else {
                return [];
            }
        }
        if (util_1.isArray(match)) {
            return match.map(function (m) { return _this.summarize(m); });
        }
        var start = match.pos;
        var end = match.end;
        var context = 3;
        var contextStart, contextEnd;
        var matchedBefore = 0;
        for (var i = start; i >= 0; i--) {
            if (this.source[i] == '\n') {
                matchedBefore += 1;
            }
            if (matchedBefore == context + 1) {
                contextStart = i + 1;
                break;
            }
            if (i - 1 < 0) {
                contextStart = 0;
                break;
            }
        }
        var matchedAfter = 0;
        for (var i = end; i < this.source.length; i++) {
            if (this.source[i] == '\n') {
                matchedAfter += 1;
            }
            if (matchedAfter == context + 1) {
                contextEnd = i - 1;
                break;
            }
            if (i + 1 > this.source.length) {
                contextEnd = this.source.length - 1;
                break;
            }
        }
        var result = colors.dim(this.source.slice(contextStart, start));
        result += colors.green(this.source.slice(start, end));
        result += colors.dim(this.source.slice(end, contextEnd));
        return result;
    };
    SourceCode.prototype.match = function (selector) {
        var r = tsquery_1.tsquery.query(this.ast, selector);
        return !!r && r.length > 0;
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
        var _this = this;
        var result = '';
        if (this.filename) {
            result = this.printer.printFile(this.ast);
        }
        else {
            result = this.printer.printNode(ts.EmitHint.Unspecified, this.ast, this.document);
        }
        var diff = jsdiff.diffLines(this.source, result);
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
            var diff = jsdiff.diffLines(this.source, output);
            var allLines_1 = [];
            diff.forEach(function (d) {
                if (!d.added && !d.removed) {
                    allLines_1 = allLines_1.concat(_this.getLinesSimple(d.value, 'unchanged'));
                }
                if (d.added) {
                    var adds = _this.getLinesSimple(d.value, 'add');
                    allLines_1 = allLines_1.concat(adds);
                }
                if (d.removed && d.value === '\n') {
                    var removes = _this.getLinesSimple(d.value, 'remove');
                    allLines_1 = allLines_1.concat(removes);
                }
            });
            output = allLines_1.join('\n');
            return output;
        }
        catch (e) {
            console.log("Couldn't prettify " + this.fullPath);
            console.log(e);
            return output;
        }
    };
    SourceCode.prototype.saveChanges = function () {
        if (this.fullPath) {
            this.writeToFile(this.fullPath);
        }
    };
    SourceCode.prototype.writeToFile = function (file) {
        var code = this.stringify();
        fs.writeFileSync(file, code, 'utf8');
    };
    SourceCode.prototype.logDiff = function () {
        var _this = this;
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
            if (!lines[0])
                return;
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
        diff.forEach(function (d) {
            if (!d.added && !d.removed) {
                allLines = allLines.concat(_this.getLines(d.value, 'unchanged', getNumber));
            }
            if (d.added) {
                var adds = _this.getLines(d.value, 'add', getNumber);
                allLines = allLines.concat(adds);
                saveRange(adds);
            }
            if (d.removed && d.value !== '\n') {
                var removes = _this.getLines(d.value, 'remove', getNumber);
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
        var context = 3;
        for (var _i = 0, ranges_1 = ranges; _i < ranges_1.length; _i++) {
            var r = ranges_1[_i];
            console.log(colors.cyan("\n@@ " + this.fullPath.replace(path.resolve('./'), '.') + "\n"));
            var before = allLines.slice(r.start - context < 0 ? 0 : r.start - context, r.start);
            console.log(before.map(function (v) { return colors.black(v.value); }).join('\n'));
            var content = allLines.slice(r.start, r.end + 1);
            console.log(content
                .map(function (v) {
                return v.type == 'add'
                    ? colors.green(v.value)
                    : colors.red(v.value);
            })
                .join('\n'));
            var after = allLines.slice(r.end + 1, r.end + context + 1);
            console.log(after.map(function (v) { return colors.black(v.value); }).join('\n'));
        }
    };
    return SourceCode;
}());
exports.SourceCode = SourceCode;
