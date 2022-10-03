import * as vscode from 'vscode';
import * as fs from 'fs';
import { loadSettings } from '../utils/utils';
import { RegexUtils } from '../utils/RegexUtils';


export class CompletionItemProvider implements vscode.CompletionItemProvider {
    provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext): vscode.ProviderResult<vscode.CompletionItem[] | vscode.CompletionList<vscode.CompletionItem>> {
        let range = document.getWordRangeAtPosition(position.translate(0,-1),/[^,.\n\[\]\(\)]+/);
        if(!range){
            //如果找不到单词
            return [];
        }
        let pcName = document.getText(range);
        let prefix = document.getText(new vscode.Range(new vscode.Position(position.line,0),position));
        let result:vscode.CompletionItem[] = [];
        let settings = loadSettings();
        let path = "";

        switch (context.triggerCharacter) {
            case "."://角色差分补全
                //读取角色配置文件
                path = settings.characterTable;
                let pcData = fs.readFileSync(path,{encoding:'utf8', flag:'r'});
                // //console.log(pcData);
                let lines = pcData.split("\n");
                for(let line of lines){
                    let lineSplit = line.split("\t");
                    let name = lineSplit[0];
                    let subtype = lineSplit[1];
                    if(name === pcName && subtype !== "default"){
                        result.push({label:subtype,insertText:subtype});
                    }
                }
                break;
            case ":"://背景补全，不知道为何不起作用，于是取消触发词避免多余消耗
                if(!/^<background>/m.test(prefix)){
                    //如果不是背景行，则不补全
                    return [];
                }
                path = settings.mediaObjDefine;
                let mediaData = fs.readFileSync(path,{encoding:'utf8', flag:'r'});
                lines = mediaData.split("\n");
                for(let line of lines){
                    let medium = RegexUtils.parseMediaLine(line);
                    if(medium && medium.mediaType === "Background"){
                        result.push({label:medium.mediaName,insertText:medium.mediaName});
                    }
                }
                break;
            case "{"://音效补全，不知道为何不起作用，于是取消触发词避免多余消耗
                path = settings.mediaObjDefine;
                mediaData = fs.readFileSync(path,{encoding:'utf8', flag:'r'});
                lines = mediaData.split("\n");
                for(let line of lines){
                    let medium = RegexUtils.parseMediaLine(line);
                    if(medium && medium.mediaType === "Audio"){
                        result.push({label:medium.mediaName,insertText:medium.mediaName});
                    }
                }
                break;
            default:
                break;
        }
        

        return result;
    }
}