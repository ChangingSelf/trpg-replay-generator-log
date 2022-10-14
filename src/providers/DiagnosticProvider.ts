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
        if(dialogueLine){
            for(let character of dialogueLine.characterList){
                let nextCol = curCol + character.name.length;
                let offsetOfSubtype = character.subtype==='default'?0:(character.subtype.length+1);
                let offsetOfAlpha = isNaN(character.alpha)?0:(character.alpha.toString().length+2);
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