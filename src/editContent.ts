import * as vscode from 'vscode';
import { forEachDialogueLine, forEachDialogueLineContent } from './utils/converter';
import { RegexUtils } from './utils/RegexUtils';

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
        label: "# 对对话行的内容进行自定义正则替换",
        description: '自己输入正则表达式及其替换内容',
        detail: '正则替换将会逐行作用于(且仅作用于)对话行的内容上，无视音效框、角色框等内容',
        converter:async (input:string)=>{
            let searchStr = await vscode.window.showInputBox({placeHolder:"输入用于匹配的正则表达式，用到的flag有「gmu」"});
            if(searchStr === undefined) {return input;}
            else{
                //预处理
                searchStr = searchStr.replaceAll(/\\/g,"\\");
                let replaceStr = await vscode.window.showInputBox({placeHolder:"$&代表取匹配内容，$1、$2等代表取分组内容"});
                if(replaceStr === undefined) {return input;}
                else{
                    let regex = new RegExp(searchStr as string,"gmu");
                    return forEachDialogueLineContent(input,(content)=>content.replaceAll(regex,replaceStr as string));
                }
            }
        }
    },{
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
        converter:(input:string)=>forEachDialogueLineContent(input,correctQuotesOrder)
    },{
        label: "# 单双引号修正",
        description: '逐句解析',
        detail: '让双引号内部只出现单引号。注意：需要左右引号次序正确才行',
        converter:(input:string)=>forEachDialogueLineContent(input,correctSingleQuotes)
    },{
        label: "# 替换为直角引号",
        description: '逐句简单替换',
        detail: '“双引号”对应「单层直角引号」，‘单引号’对应『双层直角引号』',
        converter:(input:string)=>forEachDialogueLineContent(input,(content)=>content.replaceAll("“","「").replaceAll("”","」").replaceAll("‘","『").replaceAll("’","』"))
    },{
        label: "# 为RP内容分段",
        description: '逐句解析',
        detail: '将形似「“xxx”角色说，“xxx”」的内容分段',
        converter:(input:string)=>sliceRolePlay(input)
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
export function correctSingleQuotes(input:string){
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

/**
 * 将角色扮演分段
 * @param input 输入文本
 */
export async function sliceRolePlay(input:string){

    let kpName = await vscode.window.showInputBox({
        "prompt":"输入非对话部分设置的角色名（可带差分）",
        "placeHolder":"输入非对话部分设置的角色名（可带差分），直接回车代表不修改非对话部分的角色名"
    });
    if(kpName === undefined){
        return input;
    }

    let lines = input.split("\n");
    let output = "";
    let lineNum = 0;
    let lastLine = undefined;
    for (let line of lines) {
        if (lineNum !== 0) {
            output += '\n';
        }
        let dialogueLine = RegexUtils.parseDialogueLine(line);
        if (dialogueLine) {
            let resultList = dialogueLine.content.match(/(“.*?”)|(「.*」)|((?<=(”))[^“”「」]+(?=“))|((?<=(”))[^“”「」]+)|([^“”「」]+(?=“))/g);
            if(resultList){
                let segments:{isSpeech:boolean,content:string}[] = [];
                
                for(let segment of resultList){
                    if(!/(“.*?”)|(「.*」)/.test(segment)){
                        //非引号内的内容，则合并到前一个非对话部分
                        if(segments.length > 0 && !segments[segments.length-1].isSpeech){
                            segments[segments.length-1].content += segment;
                        }else{
                            segments.push({isSpeech:false,content:segment});
                        }
                    }else{
                        //是引号内容，则判断是否非对话
                        if(/(“[^\p{P}]*?”)|(「[^\p{P}]*」)/u.test(segment)){
                            //无标点符号，则为非对话内容，附加到前一个非对话部分
                            if(segments.length > 0 && !segments[segments.length-1].isSpeech){
                                segments[segments.length-1].content += segment;
                            }else{
                                segments.push({isSpeech:false,content:segment});
                            }
                        }else{
                            //存在标点符号，则为对话内容
                            segments.push({isSpeech:true,content:segment});
                        }
                    }
                }
                let isFirst = true;
                for(let segment of segments){
                    let pcBox = dialogueLine.getCharactersString();
                    if(!segment.isSpeech){
                        //非发言部分改旁白
                        pcBox = kpName!==""?`[${kpName}]`:pcBox;
                    }
                    if(!isFirst){
                        output += '\n';
                    }
                    output += `${pcBox}:${dialogueLine.toggleEffect}${segment.content}${dialogueLine.textEffect}`;
                    isFirst = false;
                }
            }else{
                output += line;
            }
        } else {
            output += line;
        }
        ++lineNum;
    }
    return output;
}