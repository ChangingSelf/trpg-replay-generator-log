import * as vscode from 'vscode';
/**
 * 节点对象
 */
class CharacterNode extends vscode.TreeItem {
    constructor(
        public name:string,
        public subtypes:CharacterNode[] = [],
        public collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.None,
    ){
        super(name,collapsibleState);
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
                let name = l[0];
                let subtype = l[1];
                if(!charactersSet.has(name)){
                    children.push(new CharacterNode(name,[new CharacterNode(subtype)],vscode.TreeItemCollapsibleState.Collapsed));
                    charactersSet.add(name);
                }else{
                    let pc = children.find(value=>value.name === name);
                    if(pc){
                        pc.subtypes.push(new CharacterNode(subtype));
                    }
                }
            });
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