import * as vscode from 'vscode';
import { loadCharacters, loadSettings } from '../utils/utils';
/**
 * 节点对象
 */
export class CharacterNode extends vscode.TreeItem {
    constructor(
        public name:string,
        public parentName:string = "",
        public subtypes:CharacterNode[] = [],
        public collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.None,
        public isExist:boolean = false //指示是否已在log文件中出现
    ){
        let displayName = isExist ? `*${name}`:name;
        super(displayName,collapsibleState);
    }
}
/**
 * 数据提供者
 */
export class CharacterNodeProvider implements vscode.TreeDataProvider<CharacterNode>{
    
    private _onDidChangeTreeData: vscode.EventEmitter<CharacterNode | undefined | null | void> = new vscode.EventEmitter<CharacterNode | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<CharacterNode | undefined | null | void> = this._onDidChangeTreeData.event;
    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    insertCharacter(node:CharacterNode) {
		let editor = vscode.window.activeTextEditor;
        if(!editor) {return;}
        let doc = editor.document;
        let position = editor.selection.start;
        let content = `[${node.parentName===""?node.name:(node.parentName+(node.name==="default"?"":"."+node.name))}]:`;
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

    getTreeItem(element: CharacterNode): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }
    getChildren(element?: CharacterNode | undefined): vscode.ProviderResult<CharacterNode[]> {
        let children:CharacterNode[] = [];
        if(!element) {
            
            //如果是根节点，则查找rgl文件中所有角色
            let editor = vscode.window.activeTextEditor;
            if(!editor) {return [];}
            
            let text = editor.document.getText();

            //匹配角色
            let reg = /^\[([^,\.\(\)]*?(\(\d+\))?(\.[^,\.\(\)]*?)?)(,[^,\.\(\)]*?(\(\d+\))?(\.[^,\.\(\)]*?)?)?(,[^,\.\(\)]*?(\(\d+\))?(\.[^,\.\(\)]*?)?)?\]/mg;
            let result = text.match(reg);
            let dialogLine = result ?? [];

            //统计角色
            let charactersWithSubtype:Set<string> = new Set();
            for (let i = 0; i < dialogLine.length; i++) {
                //对于每一个对话行
                let element = dialogLine[i];
                element = element.replace("[","");
                element = element.replace("]","");
                let cList = element.split(',');//得到含有差分名和透明度的这一行出现的角色的列表

                for (let j = 0; j < cList?.length??0; j++) {
                    //对这一行的每一个角色
                    let character = cList[j];
                    character = character.replace(/(\(\d+\))/,"");//删除透明度括号
                    // let subtypeLine = character.split(".");
                    // //console.log(subtypeLine);
                    charactersWithSubtype.add(character);
                }

            }

            //将没有差分的行设置为default差分
            let subtypeLines:string[][] = [];
            charactersWithSubtype.forEach(characterWithSubtype => {
                let subtypeLine = characterWithSubtype.split(".");
                if(subtypeLine.length === 1){
                    subtypeLine.push("default");
                }
                subtypeLines.push(subtypeLine);
            });

            //TODO：重构优化上面获取角色差分的代码
            let charactersSet = new Set();
            subtypeLines.forEach(l=>{
                let pcName = l[0];
                let subtype = l[1];
                if(!charactersSet.has(pcName)){
                    children.push(new CharacterNode(pcName,"",[new CharacterNode(subtype)],vscode.TreeItemCollapsibleState.Collapsed,true));
                    charactersSet.add(pcName);
                }else{
                    let pc = children.find(value=>value.name === pcName);
                    if(pc){
                        pc.subtypes.push(new CharacterNode(subtype,pcName,[],vscode.TreeItemCollapsibleState.None,true));
                    }
                }
            });



            //从角色配置表中读取角色
            let settings = loadSettings();
            let characterFilePath = settings.characterTable;
            let pcMap = loadCharacters(characterFilePath);
            for(let item of pcMap.entries()){
                let pcName = item[0];
                let subtypes = item[1];
                if(children.some(x => x.name === pcName)){
                    //如果已经加入了，就跳过该角色
                    continue;
                }

                let subtypeList:CharacterNode[] = [];
                for(let subtype of subtypes){
                    subtypeList.push(new CharacterNode(subtype,pcName));
                }

                let child = new CharacterNode(
                    pcName,
                    "",
                    subtypeList,
                    subtypeList.length>0?vscode.TreeItemCollapsibleState.Collapsed:vscode.TreeItemCollapsibleState.None
                );
                
                children.push(child);
            }


        }else{
            children = children.concat(element.subtypes);
        }
        return children;
    }
    getParent?(element: CharacterNode): vscode.ProviderResult<CharacterNode> {
        throw new Error('Method not implemented.');
    }
    resolveTreeItem?(item: vscode.TreeItem, element: CharacterNode, token: vscode.CancellationToken): vscode.ProviderResult<vscode.TreeItem> {
        throw new Error('Method not implemented.');
    }

}