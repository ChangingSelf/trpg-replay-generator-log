import * as vscode from 'vscode';
import * as fs from 'fs';
import { loadSettings } from '../utils/utils';
import { RegexUtils } from '../utils/RegexUtils';

/**
 * 节点对象
 */
export class BackgroundNode extends vscode.TreeItem {
    constructor(
        public name:string,
        public collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.None,
    ){
        super(name,collapsibleState);
    }
}
/**
 * 数据提供者
 */
export class BackgroundNodeProvider implements vscode.TreeDataProvider<BackgroundNode>{
    
    private _onDidChangeTreeData: vscode.EventEmitter<BackgroundNode | undefined | null | void> = new vscode.EventEmitter<BackgroundNode | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<BackgroundNode | undefined | null | void> = this._onDidChangeTreeData.event;
    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    insertBackground(node:BackgroundNode) {
		let editor = vscode.window.activeTextEditor;
        if(!editor) {return;}
        let doc = editor.document;
        let position = editor.selection.start;
        let content = `<background>:${node.name}`;
        editor.edit(editorEdit => {
            editorEdit.insert(position,content);
        }).then(isSuccess => {
            if (isSuccess) {
                // vscode.window.showInformationMessage("插入成功！");
            } else {
                vscode.window.showErrorMessage("插入失败！");
            }
        }, err => {
            console.error("Edit error, " + err);
            vscode.window.showErrorMessage(err);
        });
	}

    getTreeItem(element: BackgroundNode): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }
    getChildren(element?: BackgroundNode | undefined): vscode.ProviderResult<BackgroundNode[]> {
        let children:BackgroundNode[] = [];
        if(!element) {
            //如果是根节点，则查找媒体定义文件中所有背景
            let editor = vscode.window.activeTextEditor;
            if(!editor) {return [];}
            
            let text = editor.document.getText();
            //读取媒体定义文件
            let settings = loadSettings();
            let path = settings.mediaObjDefine;
            let mediaData = fs.readFileSync(path,{encoding:'utf8', flag:'r'});
            let lines = mediaData.split("\n");
            for(let line of lines){
                let medium = RegexUtils.parseMediaLine(line);
                if(medium && medium.mediaType === "Background"){
                    children.push(new BackgroundNode(medium.mediaName));
                }
            }
        }else{
            //无子节点
        }
        return children;
    }
    getParent?(element: BackgroundNode): vscode.ProviderResult<BackgroundNode> {
        throw new Error('Method not implemented.');
    }
    resolveTreeItem?(item: vscode.TreeItem, element: BackgroundNode, token: vscode.CancellationToken): vscode.ProviderResult<vscode.TreeItem> {
        throw new Error('Method not implemented.');
    }

}