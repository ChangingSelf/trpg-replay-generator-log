/**
 * 以不同的格式复制剧本
 */
import * as vscode from 'vscode';
import { RegexUtils } from './utils/RegexUtils';
export function copyLog(){
    let optLangdunv = "使用软件「朗读女」的「多角色朗读」的格式：[角色名]说话内容";
    let optPureScript = "复制无角色框的内容文本";
    let optList:string[] = [optLangdunv,optPureScript];



    
    let editor = vscode.window.activeTextEditor;
    if(!editor) {
        vscode.window.showErrorMessage(`请打开要操作的文件`);
        return;
    }
    let doc = editor.document;
    let text = doc.getText();
    let selectionText = editor.document.getText(editor.selection);
	if(selectionText) {text = selectionText;}

    vscode.window.showQuickPick(optList,{
        placeHolder:"请选择复制格式"
    }).then(item=>{
        switch (item) {
            case optLangdunv:
                copyLogForLangdunv(text);
                break;
            case optPureScript:
                copyLogPureScript(text);
                break;

            default:
                break;
        }
    });
}

export function copyLogForLangdunv(text:string){
    let lines = text.split("\n");
    let copyText = "";
    let copyLineNum = 0;
    for(let line of lines){
        let dialogLine = RegexUtils.parseDialogueLine(line);
        if(dialogLine){
            if(copyText !== ""){
                copyText += "\n";
            }
            copyText += `[${dialogLine.characterList[0].name}]${dialogLine.content}`.replace(/#/g,"").replace(/\^/g,"");
            ++copyLineNum;
        }
    }
    vscode.env.clipboard.writeText(copyText);
    vscode.window.showInformationMessage(`已复制${copyLineNum}行内容`);
}

export function copyLogPureScript(text:string){
    let lines = text.split("\n");
    let copyText = "";
    let copyLineNum = 0;
    for(let line of lines){
        let dialogLine = RegexUtils.parseDialogueLine(line);
        if(dialogLine){
            if(copyText !== ""){
                copyText += "\n";
            }
            copyText += dialogLine.content.replace(/#/g,"").replace(/\^/g,"");
            ++copyLineNum;
        }
    }
    vscode.env.clipboard.writeText(copyText);
    vscode.window.showInformationMessage(`已复制${copyLineNum}行内容`);
}