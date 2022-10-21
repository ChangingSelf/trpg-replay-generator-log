import * as vscode from 'vscode';
import * as path from 'path';
import { loadCharacters, loadMedia, loadSettings } from '../utils/utils';
import * as fs from 'fs';
import { RegexUtils } from '../utils/RegexUtils';

export function onChange(document:vscode.TextDocument | undefined,collection:vscode.DiagnosticCollection){
    let diagnostics: vscode.Diagnostic[] = diagnose(document);

    if (document) {
        collection.set(document.uri, diagnostics);
    } else {
        collection.clear();
    }

}

function diagnose(doc:vscode.TextDocument | undefined):vscode.Diagnostic[]{
    if(!doc){
        return [];
    }
    let diagnostics: vscode.Diagnostic[] = [];
    
    //读取角色配置文件和媒体定义文件
    let settings = loadSettings();
    let characterFilePath = settings.characterTable;
    let pcMap = loadCharacters(characterFilePath);

    let mediaFilePath = settings.mediaObjDefine;
    let mediaList = loadMedia(mediaFilePath);
    let backgroundList = mediaList.filter(x=>x.mediaType==="Background");

    //逐行检查
    for(let i=0;i<doc.lineCount;++i){
        let line = doc.lineAt(i).text;
        //对话行
        let dialogueLine = RegexUtils.parseDialogueLine(line);
        let curCol = 1;//当前检查到的列
        let contentStartCol = 2;//对话行内容开始的列，算上了末尾的英文冒号
        if(dialogueLine){
            //检查角色
            for(let character of dialogueLine.characterList){
                let nextCol = curCol + character.name.length;
                let offsetOfSubtype = character.subtype==='default'?0:(character.subtype.length+1);
                let offsetOfAlpha = isNaN(character.alpha)?0:(character.alpha.toString().length+2);

                contentStartCol += character.name.length + offsetOfSubtype + offsetOfAlpha + 1;

                if(!pcMap.has(character.name)){
                    //如果角色名字不存在，则标红
                    diagnostics.push(
                        {
                            range:new vscode.Range(i,curCol,i,nextCol)
                            ,message:`角色「${character.name}」未在角色配置表中定义，请检查角色配置表：${characterFilePath}`
                            ,severity:vscode.DiagnosticSeverity.Error
                        }
                    );
                    curCol = nextCol + offsetOfSubtype + offsetOfAlpha + 1;
                }else if(character.subtype!=='default' && !pcMap.get(character.name)?.has(character.subtype)){
                    curCol += character.name.length + offsetOfAlpha + 1;
                    nextCol += offsetOfSubtype;
                    //如果差分不存在，则标红
                    diagnostics.push(
                        {
                            range:new vscode.Range(i,curCol,i,nextCol)
                            ,message:`角色「${character.name}」的差分「${character.subtype}」未在角色配置表中定义，请检查角色配置表：${characterFilePath}`
                            ,severity:vscode.DiagnosticSeverity.Error
                        }
                    );
                    curCol = nextCol;
                }else{
                    curCol = nextCol + offsetOfSubtype + offsetOfAlpha + 1;
                }
            }
            //检查总行长
            if(dialogueLine.content.length > settings.totalLength){
                diagnostics.push(
                    {
                        range:new vscode.Range(i,contentStartCol,i,contentStartCol + dialogueLine.content.length)
                        ,message:`对话文本的总长度(${dialogueLine.content.length})超过了你设置的总长度(${settings.totalLength})，可能导致文字超出对话气泡。在插件设置中可关闭该提示`
                        ,severity:vscode.DiagnosticSeverity.Warning
                    }
                );
            }
            let singleLines = dialogueLine.content.split('#');
            if(singleLines.length > 1){
                let index = 1;
                for(let singleLine of singleLines){
                    if(singleLine.length > settings.lineLength){
                        diagnostics.push(
                            {
                                range:new vscode.Range(i,contentStartCol,i,contentStartCol + singleLine.length)
                                ,message:`对话文本的第${index}行的长度(${singleLine.length})超过了你设置的单行长度(${settings.lineLength})，可能导致文字超出对话气泡。在插件设置中可关闭该提示`
                                ,severity:vscode.DiagnosticSeverity.Warning
                            }
                        );
                    }
                    contentStartCol += singleLine.length + 1;//算上井号
                    ++index;
                }
            }
            
        }

        //背景行
        let backgroundLine = RegexUtils.parseBackgroundLine(line);
        if(backgroundLine && backgroundLine.background !== "black" && backgroundLine.background !== "white"){
            //如果不存在此背景媒体，则标红
            if(backgroundList.findIndex(x=>x.mediaName===backgroundLine?.background) === -1){
                let startCol = "<background>:".length + (backgroundLine.switchMethod?.length ?? 0);
                let endCol = startCol + backgroundLine.background.length;
                diagnostics.push(
                    {
                        range:new vscode.Range(i,startCol,i,endCol)
                        ,message:`背景「${backgroundLine.background}」未在媒体定义文件中定义，请检查媒体定义文件：${mediaFilePath}`
                        ,severity:vscode.DiagnosticSeverity.Error
                    }                           
                );
            }
        }
        //BGM行
    }


    return diagnostics;
}