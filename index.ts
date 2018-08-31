import * as ts from 'typescript'
import * as fs from 'fs'
import * as path from 'path'
import { tsquery } from '@phenomnomnominal/tsquery'
import * as prettier from 'prettier'
import * as jsdiff from 'diff'
import * as colors from 'colors/safe'
import * as glob from 'glob'
import { isArray } from 'util'

const prettifyCode = (code: string) =>
    prettier.format(code, {
        tabWidth: 4,
        semi: false,
        singleQuote: true,
        trailingComma: 'es5',
        parser: 'typescript',
    })

type MatchedFile = {
    path: string
    summary?: string[]
    code?: SourceCode
}

type Line = {
    value: string
    type: 'remove' | 'add' | 'unchanged'
    index?: number
}
type LineRange = {
    start: number
    end: number
}

interface ISourceCode {
    source: string
    summarize(match: any[] | string | any): any
    logDiff(): void
    match(selector: string): boolean
    modifyParent(options: {
        selector: string
        action: (result: any) => void
    }): void
    stringify(): string
    logDiff(): void
    query(selector: string): any[]
}

class SourceCodeList implements ISourceCode {
    list: SourceCode[]

    get source(): string {
        return this.list
            .map((s, idx) => `${idx}: '${s.source}'`)
            .join('\n----\n')
    }

    constructor(list: any[]) {
        this.list = list
    }

    public summarize(match: any[] | string | any): any {
        if (!this.list) return []

        return this.list.map(l => l.summarize(match))
    }

    public logDiff() {
        if (!this.list) return

        this.list.forEach(l => l.logDiff())
    }

    public match(selector: string): boolean {
        if (!this.list) return false

        return this.list.map(l => l.match(selector)).filter(l => !!l).length > 0
    }

    public modifyParent(options: {
        selector: string
        action: (result: any) => void
    }): void {
        if (!this.list) return

        this.list.forEach(l => l.modifyParent(options))
    }

    public query(selector: string): any[] {
        let results = []

        this.list.forEach(l => {
            results = results.concat(l.query(selector))
        })

        return results
    }

    public stringify(): string {
        if (!this.list) return ''

        return this.list.map(l => l.stringify()).join('-----\n')
    }
}

export class SourceCode implements ISourceCode {
    ast: ts.SourceFile
    source: string
    private printer: ts.Printer
    private result: ts.SourceFile
    fullPath: string
    filename: string
    document: ts.SourceFile
    type: 'ts' | 'tsx'

    constructor(source, type: 'ts' | 'tsx') {
        this.type = type
        if (typeof source == 'string') {
            this.source = source
            this.ast = ts.createSourceFile(
                '',
                source,
                ts.ScriptTarget.Latest,
                true,
                type == 'tsx' ? ts.ScriptKind.TSX : ts.ScriptKind.TS
            )
        } else {
            this.ast = source
        }

        this.printer = ts.createPrinter({
            newLine: ts.NewLineKind.LineFeed,
            removeComments: false,
        })

        this.result = ts.createSourceFile(
            'Output!',
            '',
            ts.ScriptTarget.Latest,
            false,
            ts.ScriptKind.TS
        )
    }

    static identifier(id: string) {
        return SourceCode.extractFirst(
            `Identifier[text="${id}"]`,
            `
                import { ${id} } from "_"
            `
        )
    }

    static arrowFunction(func: string) {
        return SourceCode.extractFirst(`ArrowFunction`, func)
    }

    static fromAst(ast) {
        let c = new SourceCode('', 'ts')
    }

    static extractFirst(selector: string, source: string) {
        return SourceCode.extract(selector, source)[0]
    }

    static extract(selector: string, source: string) {
        return tsquery(source, selector)
    }

    static fromFile(filename: string) {
        let source = fs.readFileSync(filename, 'utf8')
        let result = new SourceCode(
            source,
            filename.match(/\.tsx$/) ? 'tsx' : 'ts'
        )

        result.fullPath = filename
        result.filename = path.basename(filename)

        return result
    }

    static async searchFiles(
        root: string,
        options: {
            selector?: string
        } = null
    ): Promise<MatchedFile[]> {
        let files = await new Promise<MatchedFile[]>((resolve, reject) => {
            glob(
                '**/*.ts?(x)',
                {
                    cwd: root,
                    ignore: ['**/node_modules/**/*'],
                },
                (er, files) => {
                    if (er) {
                        reject(er)
                        return
                    }

                    resolve(
                        files.map(f => ({
                            path: path.join(root, f),
                        }))
                    )
                }
            )
        })

        if (options && options.selector) {
            let result: MatchedFile[] = []

            for (let file of files) {
                try {
                    let code = SourceCode.fromFile(file.path)
                    let r = code.query(options.selector)
                    if (!!r && r.length > 0) {
                        file.code = code
                        try {
                            file.summary = r.map(m => code.summarize(m))
                        } catch (e) {}

                        result.push(file)
                    }
                } catch (e) {}
            }

            return result
        }

        return files
    }

    public SC(input: any): ISourceCode {
        if (typeof input == 'string') {
            input = this.query(input)
        }

        if (isArray(input) && input.length > 1) {
            let items: SourceCode[] = []
            for (let item of input) {
                let s = new SourceCode(item, this.type)
                s.source = this.source.slice(item.pos, item.end)
                if (this.document) {
                    s.document = this.document
                } else {
                    s.document = this.ast
                }

                items.push(s)
            }

            return new SourceCodeList(items)
        }

        let ast
        if (isArray(input)) {
            ast = input[0]
        } else {
            ast = input
        }

        let result = new SourceCode(ast, this.type)
        result.source = this.source.slice(ast.pos, ast.end)
        if (this.document) {
            result.document = this.document
        } else {
            result.document = this.ast
        }

        return result
    }

    public summarize(match: any[] | string | any) {
        if (typeof match == 'string') {
            let matches = this.query(match)
            if (matches && matches.length > 0) {
                return matches.map(m => this.summarize(m))
            } else {
                return []
            }
        }

        if (isArray(match)) {
            return match.map(m => this.summarize(m))
        }

        let start = match.pos
        let end = match.end
        let context = 3
        let contextStart, contextEnd

        let matchedBefore = 0
        for (let i = start; i >= 0; i--) {
            if (this.source[i] == '\n') {
                matchedBefore += 1
            }

            if (matchedBefore == context + 1) {
                contextStart = i + 1
                break
            }

            if (i - 1 < 0) {
                contextStart = 0
                break
            }
        }

        let matchedAfter = 0
        for (let i = end; i < this.source.length; i++) {
            if (this.source[i] == '\n') {
                matchedAfter += 1
            }

            if (matchedAfter == context + 1) {
                contextEnd = i - 1
                break
            }

            if (i + 1 > this.source.length) {
                contextEnd = this.source.length - 1
                break
            }
        }

        let result = colors.dim(this.source.slice(contextStart, start))
        result += colors.green(this.source.slice(start, end))
        result += colors.dim(this.source.slice(end, contextEnd))

        return result
    }

    public match(selector: string): boolean {
        let r = tsquery.query(this.ast, selector)

        return !!r && r.length > 0
    }

    public query(selector: string): any[] {
        return tsquery.query(this.ast, selector)
    }

    public modify(options: {
        selector: string
        action: (result: any[]) => void
    }): void {
        let result = this.query(options.selector)
        try {
            options.action(result)
        } catch (e) {
            console.log('Error: ', e)
        }
    }

    public modifyParent(options: {
        selector: string
        action: (result: any) => void
    }): void {
        let result = this.query(options.selector)
        try {
            options.action(result[0].parent)
        } catch (e) {
            console.log('Error: ', e)
        }
    }

    public stringify() {
        let result: string = ''
        if (this.filename) {
            result = this.printer.printFile(this.ast)
        } else {
            result = this.printer.printNode(
                ts.EmitHint.Unspecified,
                this.ast,
                this.document
            )
        }

        var diff = jsdiff.diffLines(this.source, result)

        var output = ''
        diff.forEach(function(part) {
            if (part.removed) {
                if (part.value == '\n') output += part.value
                return
            }

            output += part.value
        })

        try {
            output = prettifyCode(output)
            return output
        } catch (e) {
            return output
        }
    }

    public saveChanges() {
        if (this.fullPath) {
            this.writeToFile(this.fullPath)
        }
    }

    public writeToFile(file) {
        let code = this.stringify()

        fs.writeFileSync(file, code, 'utf8')
    }

    public logDiff() {
        var one = this.source
        var other = this.stringify()

        var diff = jsdiff.diffLines(one, other)

        let allLines: Line[] = []
        let lineCounter = 0

        const getNumber = () => {
            let result = lineCounter
            lineCounter++
            return result
        }

        let ranges: LineRange[] = []

        const saveRange = (lines: Line[]) => {
            if (lines.length == 1) {
                ranges.push({
                    start: lines[0].index,
                    end: lines[0].index,
                })
            } else {
                ranges.push({
                    start: lines[0].index,
                    end: lines[lines.length - 1].index,
                })
            }
        }

        const getLines = (
            val: string,
            type: 'unchanged' | 'add' | 'remove'
        ): Line[] => {
            let spacer = type == 'add' ? '+' : type == 'remove' ? '-' : ' '

            let result: Line[] = []
            let lines = val.split('\n')
            for (let i = 0; i < lines.length; i++) {
                let v = lines[i]
                if (!v && type == 'unchanged') {
                    v = '  '
                }

                if (!v) continue

                if (i == lines.length - 1 && v.match(/^\s*$/)) {
                    continue
                } else {
                    v = `${spacer}${spacer} ${v}`
                    // if (type == 'add') v = colors.green(v)
                    // if (type == 'remove') v = colors.red(v)

                    result.push({
                        value: v,
                        type,
                        index: getNumber(),
                    })
                }
            }

            return result
        }

        diff.forEach(d => {
            if (!d.added && !d.removed) {
                allLines = allLines.concat(getLines(d.value, 'unchanged'))
            }

            if (d.added) {
                let adds = getLines(d.value, 'add')
                allLines = allLines.concat(adds)
                saveRange(adds)
            }

            if (d.removed && d.value !== '\n') {
                let removes = getLines(d.value, 'remove')
                allLines = allLines.concat(removes)
                saveRange(removes)
            }
        })

        let fragments: Line[][] = []

        ranges = ranges.reduce((consolidated, next) => {
            if (consolidated.length == 0) {
                consolidated.push(next)
            } else {
                if (
                    consolidated[consolidated.length - 1].end + 1 ==
                    next.start
                ) {
                    consolidated[consolidated.length - 1].end = next.end
                } else {
                    consolidated.push(next)
                }
            }

            return consolidated
        }, [])

        let context = 3
        for (let r of ranges) {
            console.log(
                colors.cyan(
                    `\n@@ ${this.fullPath.replace(path.resolve('./'), '.')}\n`
                )
            )
            let before = allLines.slice(
                r.start - context < 0 ? 0 : r.start - context,
                r.start
            )
            console.log(before.map(v => colors.black(v.value)).join('\n'))

            let content = allLines.slice(r.start, r.end + 1)
            console.log(
                content
                    .map(
                        v =>
                            v.type == 'add'
                                ? colors.green(v.value)
                                : colors.red(v.value)
                    )
                    .join('\n')
            )

            let after = allLines.slice(r.end + 1, r.end + context + 1)
            console.log(after.map(v => colors.black(v.value)).join('\n'))
        }
    }
}
