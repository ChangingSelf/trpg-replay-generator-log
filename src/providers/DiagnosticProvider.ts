import * as vscode from 'vscode';
import * as path from 'path';
import { loadCharacters, loadSettings } from '../utils/utils';
import * as fs from 'fs';
import { RegexUtils } from '../utils/RegexUtils';

export function onChange(event:vscode.TextDocumentChangeEvent,collection:vscode.DiagnosticCollection){
    let document = event.document;
    let diagnostics: vscode.Diagnostic[] = diagnose(document);

    if (document) {
        collection.set(document.uri, diagnostics);
    } else {
        collection.clear();
    }

}

function diagnose(doc:vscode.TextDocument):vscode.Diagnostic[]{
    if(!doc){
        return [];
    }
    let diagnostics: vscode.Diagnostic[] = [];
    
    //读取角色配置文件
    let settings = loadSettings();
    let filePath = settings.characterTable;
    let pcMap = loadCharacters(filePath);

    //逐行检查
    for(let i=0;i<doc.lineCount;++i){
        let line = doc.lineAt(i).text;
        //对话行
        let r = RegexUtils.parseDialogueLine(line);
        let curCol = 1;//当前检查到的列
        if(r){
            for(let character of r.characterList){
                let nextCol = curCol + character.name.length;
                let offsetOfSubtype = character.subtype==='default'?0:(character.subtype.length+1);
                let offsetOfAlpha = isNaN(character.alpha)?0:(character.alpha.toString().length+2);
                if(!pcMap.has(character.name)){
                    //如果角色名字不存在，则标红
                    diagnostics.push(
                        {
                            range:new vscode.Range(i,curCol,i,nextCol)
                            ,message:`角色「${character.name}」未在角色配置表中定义，请检查角色配置表：${filePath}`
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
                            ,message:`角色「${character.name}」的差分「${character.subtype}」未在角色配置表中定义，请检查角色配置表：${filePath}`
                            ,severity:vscode.DiagnosticSeverity.Error
                        }                           
                    );
                    curCol = nextCol;
                }else{
                    curCol = nextCol + offsetOfSubtype + offsetOfAlpha + 1;
                }
            }
        }
        
    }


    return diagnostics;
}