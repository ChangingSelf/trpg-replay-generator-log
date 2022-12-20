import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as outputUtils from '../utils/OutputUtils';
import { loadSettings } from '../utils/utils';
import { RegexUtils } from '../utils/RegexUtils';

let outputChannel = outputUtils.OutputUtils.getInstance();

/**
 * 节点对象
 */
export class AudioNode extends vscode.TreeItem {
    constructor(
        public name:string,
        public collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.None,
    ){
        super(name, collapsibleState);
        this.iconPath = vscode.ThemeIcon.File;
    }
}
/**
 * 数据提供者
 */
export class AudioNodeProvider implements vscode.TreeDataProvider<AudioNode>{
    
    private _onDidChangeTreeData: vscode.EventEmitter<AudioNode | undefined | null | void> = new vscode.EventEmitter<AudioNode | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<AudioNode | undefined | null | void> = this._onDidChangeTreeData.event;
    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    insertAudio(node:AudioNode) {
		let editor = vscode.window.activeTextEditor;
        if(!editor) {return;}
        let doc = editor.document;
        let position = editor.selection.start;
        let content = `{${node.name}}`;
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

    //和背景那边的代码基本一致
    addNodeToMediaFile(){
        let settings = loadSettings();
        let mediaDefFilePath = settings.mediaObjDefine;
        vscode.window.showOpenDialog({
            "canSelectFiles":true,
            "canSelectMany":true,
            "defaultUri":vscode.Uri.file(mediaDefFilePath),
            "filters":{
                '音频': ['wav']
            },
            "title":"选择你要添加的音效（可多选）"
        }).then((uris)=>{
            if(!uris){
                return;
            }
            // console.log(uris);
            let mediaData = fs.readFileSync(mediaDefFilePath,{encoding:'utf8', flag:'r'});
            let lines = mediaData.split("\n");

            //读取已有的媒体
            let mediaNameSet = new Set();
            for(let line of lines){
                let medium = RegexUtils.parseMediaLine(line);
                if(medium && medium.mediaType === "Audio"){
                    mediaNameSet.add(medium.mediaName);
                }
            }
            //加入新的媒体
            outputChannel.show();
            outputChannel.appendLine(`正在导入...`);
            let dupList = [];
            let illegalList = [];
            let appendLines = [];
            for(let uri of uris){
                let filePath = uri.fsPath;
                let mediumName = path.basename(filePath,path.extname(filePath));
                if(!RegexUtils.isMediumNameLegal(mediumName)){
                    //名称不合法
                    illegalList.push({name:mediumName,filePath:filePath});
                    continue;
                }
                if(mediaNameSet.has(mediumName)){
                    //存在重名
                    dupList.push({name:mediumName,filePath:filePath});
                    continue;
                }
                appendLines.push(`${mediumName} = Audio(filepath='${filePath}',label_color='Lavender')`);
                outputChannel.appendLine(`[${mediumName}](${filePath})`);
            }
            if(illegalList.length > 0){
                outputChannel.appendLine(`\n因为名称非法而未新增的媒体：`);
                for(let medium of illegalList){
                    outputChannel.appendLine(`[${medium.name}](${medium.filePath})`);
                }
            }
            if(dupList.length > 0){
                outputChannel.appendLine(`\n因为与现有媒体重名而未新增的媒体：`);
                for(let medium of dupList){
                    outputChannel.appendLine(`[${medium.name}](${medium.filePath})`);
                }
            }
            if(appendLines.length > 0){
                fs.appendFileSync(mediaDefFilePath,"\n\n# vscode插件导入的背景媒体\n" + appendLines.join("\n"));
                outputChannel.appendLine(`\n导入完成，新增${appendLines.length}个新媒体，具体信息见上方`);
            }else{
                outputChannel.appendLine(`\n没有导入任何媒体`);
            }
            this.refresh();
        });
    }

    getTreeItem(element: AudioNode): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }
    getChildren(element?: AudioNode | undefined): vscode.ProviderResult<AudioNode[]> {
        let children:AudioNode[] = [];
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
                if(medium && medium.mediaType === "Audio"){
                    children.push(new AudioNode(medium.mediaName));
                }
            }
        }else{
            //无子节点
        }
        return children;
    }

}