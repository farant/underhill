import * as ts from 'typescript';
export declare class SourceCode {
    private ast;
    private source;
    private printer;
    private result;
    fullPath: string;
    filename: string;
    static fromFile(filename: any): SourceCode;
    static extractFirst(selector: string, source: string): import("@phenomnomnominal/tsquery/dist/src/tsquery-types").TSQueryNode<ts.Node>;
    static extract(selector: string, source: string): import("@phenomnomnominal/tsquery/dist/src/tsquery-types").TSQueryNode<ts.Node>[];
    constructor(source: any);
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
    writeToFile(file: any): void;
    logDiff(): void;
}
