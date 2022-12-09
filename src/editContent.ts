import * as vscode from 'vscode';
import { forEachDialogueLine } from './utils/converter';

/**
 * 命令：批量编辑对话行内容
 * @returns void
 */
export function editContent(){
    //获取文本
    let editor = vscode.window.activeTextEditor;
    if(!editor){
        vscode.window.showInformationMessage("请打开你要编辑的文件");
        return;
    }
    
    let doc = editor.document;
    let text = doc.getText();

    let optList = [{
        label: "# 注释掉场外交流行",
        description: '正则替换：/^(\[.+\]:\s*[\(（].*)$/  =>  "# $1"',
        detail: '以左圆括号开头的行视作场外交流',
        converter:(input:string)=>input.replaceAll(/^(\[.+\]:\s*[\(（].*)$/mg,"# $1")
    },{
        label: "# 注释掉指令行",
        description: '正则替换：/^(\[.+\]:\s*[.。].*)$/  =>  "# $1"',
        detail: '以中文或者英文句号开头的行视作指令行',
        converter:(input:string)=>input.replaceAll(/^(\[.+\]:\s*[.。].*)$/mg,"# $1")
    },{
        label: "+ 给场外交流行的主角色添加「场外」差分",
        description: '逐行解析',
        detail: '例如「[kp,pc]:（你确定吗）」变成「[kp.场外,pc]:（你确定吗）」，若主角色已有差分则不会覆盖',
        converter:(input:string)=>forEachDialogueLine(input,l=>{
            if((l.content.trim().startsWith("(") || l.content.trim().startsWith("（")) && l.characterList[0].subtype === "default"){
                l.characterList[0].subtype="场外";
            }
            return l.toString();
        })
    },{
        label: "- 删除注释掉的对话行",
        description: '正则替换：/^#\s*\[.*\]:.*$/  =>  ""',
        detail: '',
        converter:(input:string)=>input.replaceAll(/^#\s*\[.*\]:.*$/mg,"")
    },{
        label: "# 左右引号顺序修正",
        description: '逐句解析',
        detail: '英转中、调整次序(左右引号应当依次出现)',
        converter:(input:string)=>forEachDialogueLine(input,l=>{
            l.content = correctQuotesOrder(l.content);
            return l.toString();
        })
    },{
        label: "# 单双引号修正",
        description: '逐句解析',
        detail: '让双引号内部只出现单引号。注意：需要左右引号次序正确才行',
        converter:(input:string)=>forEachDialogueLine(input,l=>{
            l.content = correctSingleQuotes(l.content);
            return l.toString();
        })
    },{
        label: "# 替换为直角引号",
        description: '逐句正则替换：',
        detail: '“双引号”对应「单层直角引号」，‘单引号’对应『双层直角引号』',
        converter:(input:string)=>forEachDialogueLine(input,l=>{
            l.content = correctSingleQuotes(l.content);
            return l.toString();
        })
    }];

    vscode.window.showQuickPick(optList,{
        title:"选择需要进行的操作",
        placeHolder:"将在原文件上修改，侧边栏的「资源管理器」的「时间线」视图能找到自动保存的上一个版本"
    }).then(async value => {
        if(!value){
            return;
        }

        //调用对应的转换函数
        let item = optList.find(x=>x.label===value.label);
        let newText = await item?.converter(text) ?? text;

        //如果新旧文本一致，就认为没有操作成功，不进行替换
        if(newText === text){
            vscode.window.showInformationMessage("操作取消或者操作前后无差别，文本未改变");
            return;
        }

        //写回文件
        editor!.edit(editorEdit => {
            let start = new vscode.Position(0,0);
            let end = start.translate(doc.lineCount,doc.getText().length);
            let allSelection = new vscode.Range(start,end);
            editorEdit.replace(allSelection,newText); 
        }).then(isSuccess => {
            if (isSuccess) {
                vscode.window.showInformationMessage(`已完成操作。如果你已经保存文件无法撤销，可以从侧边栏的“资源管理器”的“时间线”视图找到vscode为你保存的上一个版本`);

            } else {
                vscode.window.showErrorMessage("编辑失败！");
            }
        }, err => {
            console.error(err);
            vscode.window.showErrorMessage(err);
        });
    });
}

/**
 * 中文引号顺序修正
 * @param input 输入文本
 * @returns 修正好的文本
 */
export function correctQuotesOrder(input:string){
    let isLeft = false;//标记当前是否该使用左引号

    //调整双引号
    let output = input.replace(/["“”]/g,(m)=>{
        isLeft = !isLeft;//引号反向
        return isLeft ? "“" : "”";
    });

    //调整单引号
    output = output.replace(/['‘’]/g,(m)=>{
        isLeft = !isLeft;//引号反向
        return isLeft ? "‘" : "’";
    });

    return output;
}
/**
 * 中文引号单双修正
 * 
 * @param input 输入文本
 * @returns 修正好的文本
 */
function correctSingleQuotes(input: string){
    //先调整引号次序
    // let output = correctQuotesOrder(input);//先调整左右次序之后得到的引号是正确配对的，没法调整

    let stack:string[] = [];

    let isInDouble = false;//指示是否在双引号内部
    return input.replace(/[“”‘’]/g,(m)=>{
        if(m === "“"){
            if(isInDouble){
                stack.push("‘");
                return "‘";//修正
            }else{
                isInDouble = true;
                stack.push("“");
                return m;//进入双引号内部
            }
        }else if(m === "”"){
            if(isInDouble){
                let top = stack.pop();
                if(top === "‘"){
                    return "’";//修正
                }else{
                    isInDouble = false;
                    return m;//离开双引号
                }
            }else{
                return m;//修正引号顺序之后不会出现这种情况
            }
        }else{
            return m;//单引号就不管了
        }
    });
}
