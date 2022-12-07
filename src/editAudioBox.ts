import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { Character, DialogueLine, SoundEffectBox } from './utils/entities';
import { RegexUtils } from './utils/RegexUtils';


export function editAudioBox(){
    //获取文本
    let editor = vscode.window.activeTextEditor;
    if(!editor){
        vscode.window.showInformationMessage("请打开你要编辑的文件");
        return;
    }
    
    let doc = editor.document;
    let text = doc.getText();

    //编辑音效框
    let optReDo = "把指定角色已经合成的语音框替换为{*}以便重新合成";
    let optDel = "把指定角色已经合成的语音框删除";
    let optDelAll = "删除某个角色后的所有音效框";
    let optAdjustAsteriskAudioTime = "调整星标音频时长";

    let optList = [{
        label: "+ 给全部对话行添加{*}",
        description: '正则替换：/^(\[.*?\]:.*?)$/  =>  "$1{*}"',
        detail: '',
        converter:(text:string)=>text.replaceAll(/^(\[.*?\].*?)$/mg,"$1{*}")
    },{
        label: "+ 只给没有音效框的对话行行添加{*}",
        description: '正则替换：/^(\[.*?\][^\{\}]*?)$/  =>  "$1{*}"',
        detail: '只要存在音效框（花括号括起的内容）就不会加{*}',
        converter:(text:string)=>text.replaceAll(/^(\[.*?\][^\{\}]*?)$/mg,"$1{*}")
    },{
        label: "+ 给指定角色添加指定音效(默认为{*})",
        description: '逐句解析',
        detail: '未指定角色时匹配所有角色，未指定差分时匹配该角色所有差分',
        converter:addAudioBoxForPC
    },{
        label: "- 给指定角色删除指定音效(默认为{*})",
        description: '逐句解析',
        detail: '未指定角色时匹配所有角色，未指定差分时匹配该角色所有差分',
        converter:delAudioBoxForPC
    },{
        label: "- 去掉纯标点符号行的{*}",
        description: '逐句解析',
        detail: '以前用的正则替换：/^(\[.*?\](<.*>)?:\p{P}*)(<.*>)?(\{\*\})$/  =>  "$1"',
        converter:(text:string)=>forEachDialogueLine(text,l=>{
            if(/^\p{P}*$/mu.test(l.content)){
                return `${l.getCharactersString()}:${l.toggleEffect+l.content+l.textEffect+l.soundEffectBoxes.filter(x=>x.toString()!=="{*}").join("")}`;
            }else{
                return l.toString();
            }
        })
    }];

    vscode.window.showQuickPick(optList,{
        title:"选择需要进行的音效框操作",
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
            vscode.window.showInformationMessage("操作取消，文本未改变");
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
 * 对每个对话行执行操作
 * @param input 需要解析的文本
 * @param callback 处理解析到的对话行的函数
 * @returns 使用callback函数处理之后的文本
 */
 function forEachDialogueLine(input:string,callback:(dialogueLine:DialogueLine,lineNum?:number)=>string){
    let lines = input.split("\n");
    let output = "";
    let lineNum = 0;
    for(let line of lines){
        if(lineNum!==0){
            output += '\n';
        }
        let dialogueLine = RegexUtils.parseDialogueLine(line);
        if(dialogueLine){
            output += callback(dialogueLine,lineNum) ;
        }else{
            output += line;
        }
        ++lineNum;
    }
    return output;
}

async function inputPC(){
    return await vscode.window.showInputBox({
        placeHolder:`请输入主角色(角色框第一个角色)名称，可含有差分名，例如"张安翔.惊恐，但不要含有不透明度的括号"`,
        prompt:`直接Enter则为全部角色`
    });
}

async function inputAudioBox(){
    return await vscode.window.showInputBox({
        placeHolder:`请输入你要添加的整个音效框，例如"{键盘音效;30}"或者"{*}"，只输入单个音效框`,
        prompt:`直接Enter则为{*}`
    });
}

/**
 * 给特定角色添加音效框
 * @param input 输入文本
 * @returns 输出文本
 */
async function addAudioBoxForPC(input:string) {

    //输入
    let pc = await inputPC();
    if(pc === undefined){
        return input;
    }
    let audioBox = await inputAudioBox();
    if(audioBox === undefined){
        return input;
    }

    //检查音效框合法性
    let seBox = RegexUtils.parseSoundEffectBox(audioBox || "{*}");
    if(!seBox){
        vscode.window.showErrorMessage(`「${audioBox}」不是一个正确的音效框，你可能是写了多个音效框或者花括号未正确闭合`);
        return input;
    }
    
    //将新的音效框加入指定角色的对话行
    return forEachDialogueLine(input,l=>{
        if(pc !== ""){
            //目标为特定角色
            let pcData = pc!.split('.');
            let name = pcData[0];
            let subtype = pcData[1];
            if(!subtype){
                //无差分的情况只匹配名字
                if(l.characterList[0].name === name){
                    l.addSoundEffect(seBox);
                    return l.toString();
                }else{
                    return l.toString();
                }
            }else{
                //无差分的情况匹配名字和差分
                if(l.characterList[0].name === name && l.characterList[0].subtype === subtype){
                    l.addSoundEffect(seBox);
                    return l.toString();
                }else{
                    return l.toString();
                }
            }
        }else{
            //目标为所有角色
            l.addSoundEffect(seBox);
            return l.toString();
        }
    });
}
/**
 * 给特定角色删除音效框
 * @param input 输入文本
 * @returns 输出文本
 */
async function delAudioBoxForPC(input:string) {

    //输入
    let pc = await inputPC();
    if(pc === undefined){
        return input;
    }
    let audioBox = await inputAudioBox();
    if(audioBox === undefined){
        return input;
    }

    //检查音效框合法性
    let seBox = RegexUtils.parseSoundEffectBox(audioBox || "{*}");
    if(!seBox){
        vscode.window.showErrorMessage(`「${audioBox}」不是一个正确的音效框，你可能是写了多个音效框或者花括号未正确闭合`);
        return input;
    }
    
    //将新的音效框加入指定角色的对话行
    return forEachDialogueLine(input,l=>{
        if(pc !== ""){
            //目标为特定角色
            let pcData = pc!.split('.');
            let name = pcData[0];
            let subtype = pcData[1];
            if(!subtype){
                //无差分的情况只匹配名字
                if(l.characterList[0].name === name){
                    l.delSoundEffect(seBox);
                    return l.toString();
                }else{
                    return l.toString();
                }
            }else{
                //无差分的情况匹配名字和差分
                if(l.characterList[0].name === name && l.characterList[0].subtype === subtype){
                    l.delSoundEffect(seBox);
                    return l.toString();
                }else{
                    return l.toString();
                }
            }
        }else{
            //目标为所有角色
            l.delSoundEffect(seBox);
            return l.toString();
        }
    });
}