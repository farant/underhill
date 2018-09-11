import * as ts from 'typescript';
declare type MatchedFile = {
    path: string;
    summary?: string[];
    code?: SourceCode;
    exactText?: string[];
};
interface ISourceCode {
    source: string;
    summarize(match: any[] | string | any): any;
    logDiff(): void;
    match(selector: string): boolean;
    modifyParent(options: {
        selector: string;
        action: (result: any) => void;
    }): void;
    stringify(): string;
    logDiff(): void;
    query(selector: string): any[];
}
export declare class SourceCode implements ISourceCode {
    ast: ts.SourceFile;
    source: string;
    private printer;
    private result;
    fullPath: string;
    filename: string;
    document: ts.SourceFile;
    type: 'ts' | 'tsx';
    constructor(source: any, type: 'ts' | 'tsx');
    static query(node: any, selector: string): any[];
    static match(node: any, selector: string): boolean;
    static identifier(id: string): import("@phenomnomnominal/tsquery/dist/src/tsquery-types").TSQueryNode<ts.Node>;
    static logSummaries(files: MatchedFile[], options?: {
        variations: boolean;
    }): void;
    static arrowFunction(func: string): import("@phenomnomnominal/tsquery/dist/src/tsquery-types").TSQueryNode<ts.Node>;
    static fromAst(ast: any, type?: 'ts' | 'tsx'): SourceCode;
    static extractFirst(selector: string, source: string): import("@phenomnomnominal/tsquery/dist/src/tsquery-types").TSQueryNode<ts.Node>;
    static extract(selector: string, source: string): import("@phenomnomnominal/tsquery/dist/src/tsquery-types").TSQueryNode<ts.Node>[];
    static fromFile(filename: string): SourceCode;
    static searchFiles(root: string, options?: {
        selector?: string;
    }): Promise<MatchedFile[]>;
    pushToList(input: {
        node: string;
        listProperty: string;
        items: {
            type: string;
            source: string;
        }[];
    }): void;
    createNode(selector: string, source: string): import("@phenomnomnominal/tsquery/dist/src/tsquery-types").TSQueryNode<ts.Node>;
    addLiteral(node: any, originalSource: string): void;
    SC(input: any): ISourceCode;
    imports(identifier: string): boolean;
    summarize(match: any[] | string | any): any;
    match(selector: string): boolean;
    query(selector: string): any[];
    modify(options: {
        selector: string;
        action: (result: any[]) => void;
    }): void;
    modifyParent(options: {
        selector: string;
        action: (result: any) => void;
    }): void;
    stringify(): string;
    saveChanges(): void;
    writeToFile(file: any): void;
    private getLinesSimple;
    private getLines;
    logDiff(): void;
}
export {};
