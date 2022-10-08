import * as vscode from 'vscode';
import * as fs from 'fs';
import { loadSettings } from '../utils/utils';
import { RegexUtils } from '../utils/RegexUtils';

/**
 * 节点对象
 */
export class OutlineNode extends vscode.TreeItem {
    constructor(
        public name:string,
        public lineNum:number,
        public collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.None,
    ){
        super(name,collapsibleState);
    }
}
/**
 * 数据提供者
 */
export class OutlineNodeProvider implements vscode.TreeDataProvider<OutlineNode>{
	static jump(node: OutlineNode) {
        let lineNum = node.lineNum;//目标行号
		vscode.commands.executeCommand('revealLine',{
            "lineNumber":lineNum,
            "at":"top"
        });
	}
    
    private _onDidChangeTreeData: vscode.EventEmitter<OutlineNode | undefined | null | void> = new vscode.EventEmitter<OutlineNode | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<OutlineNode | undefined | null | void> = this._onDidChangeTreeData.event;
    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: OutlineNode): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }
    getChildren(element?: OutlineNode | undefined): vscode.ProviderResult<OutlineNode[]> {
        let children:OutlineNode[] = [];
        if(!element) {
            //如果是根节点
            let editor = vscode.window.activeTextEditor;
            if(!editor) {return [];}
            
            let text = editor.document.getText();

            let lines = text.split("\n");
            let lineNum = 0;
            for(let line of lines){
                let r = RegexUtils.parseBackgroundLine(line);
                if(r){
                    children.push(new OutlineNode(r.background,lineNum));
                }
                lineNum++;
            }
           
        }else{
            //无子节点
        }
        return children;
    }
    getParent?(element: OutlineNode): vscode.ProviderResult<OutlineNode> {
        throw new Error('Method not implemented.');
    }
    resolveTreeItem?(item: vscode.TreeItem, element: OutlineNode, token: vscode.CancellationToken): vscode.ProviderResult<vscode.TreeItem> {
        throw new Error('Method not implemented.');
    }

}