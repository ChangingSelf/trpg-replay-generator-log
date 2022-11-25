import * as vscode from 'vscode';
import * as fs from 'fs';
import { loadCharacters, loadMedia, loadSettings } from '../utils/utils';
import { RegexUtils } from '../utils/RegexUtils';


export class CompletionItemProvider implements vscode.CompletionItemProvider {
    provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext): vscode.ProviderResult<vscode.CompletionItem[] | vscode.CompletionList<vscode.CompletionItem>> {
        let range = document.getWordRangeAtPosition(position.translate(0,-1),/[^,.\n\[\]\(\)]+/);
        if(!range && context.triggerCharacter !== '[' && context.triggerCharacter !== ','){
            //如果找不到单词
            return [];
        }
        let pcName = document.getText(range);
        let prefix = document.getText(new vscode.Range(new vscode.Position(position.line,0),position));//触发位置这一行前头的内容
        let result:vscode.CompletionItem[] = [];
        //读取配置
        let settings = loadSettings();
        let characterFilePath = settings.characterTable;
        let pcMap = loadCharacters(characterFilePath);
        let hasCharacterPath = characterFilePath !== "";

        let mediaFilePath = settings.mediaObjDefine;
        let mediaList = loadMedia(mediaFilePath);
        let backgroundList = mediaList.filter(x=>x.mediaType==="Background");
        let audioList = mediaList.filter(x=>x.mediaType==="Audio");
        let hasMediaPath = mediaFilePath !== "";

        switch (context.triggerCharacter) {
            case "."://角色差分补全
                if(hasCharacterPath && pcMap.has(pcName)){
                    let subtypes = pcMap.get(pcName) ?? new Set();
                    subtypes.forEach(subtype=>{
                        result.push({label:subtype,insertText:subtype});
                    });
                }
                break;
            case ":"://背景补全
                if(!/^<background>/m.test(prefix)){
                    //如果不是背景行，则不补全
                    return [];
                }
                if(hasMediaPath){
                    backgroundList.forEach(medium=>{
                        result.push({label:medium.mediaName,insertText:medium.mediaName});
                    });
                }
                break;
            case "{"://音效补全
                if(hasMediaPath){
                    audioList.forEach(medium=>{
                        result.push({label:medium.mediaName,insertText:medium.mediaName});
                    });
                }
                break;
            case "["://角色名补全
                if(hasCharacterPath && !range){//只有在行开头时才补全
                    for(let name of pcMap.keys()){                    
                        result.push({label:name,insertText:name});
                    }
                }
                break;
            case ","://多角色输入补全
                if(hasCharacterPath && range && /^\[[^\]]+,/m.test(prefix)){//只有不在行开头时才补全，且触发点必须在框内
                    for(let name of pcMap.keys()){                    
                        result.push({label:name,insertText:name});
                    }
                }
                break;
            default:
                break;
        }
        

        return result;
    }
}