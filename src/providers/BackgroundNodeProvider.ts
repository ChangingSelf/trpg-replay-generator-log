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
export class BackgroundNode extends vscode.TreeItem {
    constructor(
        public name:string,
        public para:string,
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

    previewNode(node: BackgroundNode) {
        //读取参数中的文件路径
        let filepath = RegexUtils.getFilePathInPara(node.para);
        if(!filepath){
            return;
        }

		vscode.commands.executeCommand('vscode.open',vscode.Uri.file(filepath)).then(success=>{},reason=>{
            vscode.window.showErrorMessage(reason);
        });
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

    addNodeToMediaFile(){
        let settings = loadSettings();
        let mediaDefFilePath = settings.mediaObjDefine;
        vscode.window.showOpenDialog({
            "canSelectFiles":true,
            "canSelectMany":true,
            "defaultUri":vscode.Uri.file(mediaDefFilePath),
            "filters":{
                '图片': ['png', 'jpg','jpeg','bmp']
            },
            "title":"选择你要添加的背景图片（可多选）"
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
                if(medium && medium.mediaType === "Background"){
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
                appendLines.push(`${mediumName} = Background(filepath='${filePath}',pos=(0,0),label_color='Lavender')`);
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
                    children.push(new BackgroundNode(medium.mediaName,medium.mediaPara));
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