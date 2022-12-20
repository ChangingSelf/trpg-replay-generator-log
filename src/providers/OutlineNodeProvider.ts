import * as vscode from 'vscode';
import * as fs from 'fs';
import { loadSettings } from '../utils/utils';
import { RegexUtils } from '../utils/RegexUtils';
import { utils } from 'mocha';

/**
 * 节点对象
 */
export class OutlineNode extends vscode.TreeItem {
    
    constructor(
        public name:string,
        public lineNum:number,
        public children:OutlineNode[] = [],
        public collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.None,
    ){
        super(name,collapsibleState);
        this.tooltip = name;
        this.command = {
            "title": "跳转大纲节点",
            "command": "trpg-replay-generator-log.jumpToOutlineNode",
            "arguments":[this]
        };
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
            let settings = loadSettings();
            //如果是根节点
            let editor = vscode.window.activeTextEditor;
            if(!editor) {return [];}
            
            let text = editor.document.getText();

            let lines = text.split("\n");
            let lineNum = 0;
            if(settings.parseOutlineByComment){
                //使用折叠标记作为大纲节点
                let stack:OutlineNode[] = [];
                for(let line of lines){
                    //遇到开始折叠的标记
                    let r = /^#s(.+)/m.exec(line);
                    if(r){
                        let node = new OutlineNode(r[1],lineNum);
                        if(stack.length >= 1){
                            //若栈内存在上层节点，则将本层节点作为上层节点的孩子
                            stack[stack.length-1].children.push(node);
                            stack[stack.length-1].collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
                        }else{
                            //否则作为根节点
                            children.push(node);
                            stack.push(node);
                        }  
                    }
                    //遇到结束折叠的标记
                    let isEnd = /^#e.*/m.test(line);
                    if(isEnd){
                        stack.pop();
                    }

                    lineNum++;
                }
            }else{
                //使用背景行作为大纲节点
                for(let line of lines){
                    let r = RegexUtils.parseBackgroundLine(line);
                    if(r){
                        children.push(new OutlineNode(r.background,lineNum));
                    }
                    lineNum++;
                }
            }
        }else{
            //子节点
            children = children.concat(element.children);//注意：concat不是在原数组上修改
        }
        return children;
    }
}