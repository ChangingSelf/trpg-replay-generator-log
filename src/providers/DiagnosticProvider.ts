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
    let isCheckCharacter = characterFilePath !== "";

    let mediaFilePath = settings.mediaObjDefine;
    let mediaList = loadMedia(mediaFilePath);
    let backgroundList = mediaList.filter(x=>x.mediaType==="Background");
    let audioList = mediaList.filter(x=>x.mediaType==="Audio");
    let isCheckMedia = mediaFilePath !== "";

    //逐行检查
    for(let lineNum=0;lineNum<doc.lineCount;++lineNum){
        let line = doc.lineAt(lineNum).text;
        //对话行
        let dialogueLine = RegexUtils.parseDialogueLine(line);
        if(dialogueLine){
            let curCol = 1;//当前检查到的列
            let contentStartCol = 2;//对话行内容开始的列，算上了末尾的英文冒号
            //检查角色，在这部分代码中计算好了contentStartCol的值
            if(isCheckCharacter){
                for(let character of dialogueLine.characterList){
                    let nextCol = curCol + character.name.length;
                    let offsetOfSubtype = character.subtype==='default'?0:(character.subtype.length+1);
                    let offsetOfAlpha = isNaN(character.alpha)?0:(character.alpha.toString().length+2);
    
                    contentStartCol += character.name.length + offsetOfSubtype + offsetOfAlpha + 1;
    
                    if(!pcMap.has(character.name)){
                        //如果角色名字不存在，则标红
                        diagnostics.push(
                            {
                                range:new vscode.Range(lineNum,curCol,lineNum,nextCol)
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
                                range:new vscode.Range(lineNum,curCol,lineNum,nextCol)
                                ,message:`角色「${character.name}」的差分「${character.subtype}」未在角色配置表中定义，请检查角色配置表：${characterFilePath}`
                                ,severity:vscode.DiagnosticSeverity.Error
                            }
                        );
                        curCol = nextCol;
                    }else{
                        curCol = nextCol + offsetOfSubtype + offsetOfAlpha + 1;
                    }
                }
            }else{
                for(let character of dialogueLine.characterList){
                    let offsetOfSubtype = character.subtype==='default'?0:(character.subtype.length+1);
                    let offsetOfAlpha = isNaN(character.alpha)?0:(character.alpha.toString().length+2);
    
                    contentStartCol += character.name.length + offsetOfSubtype + offsetOfAlpha + 1;
                }
            }
            
            contentStartCol += dialogueLine.toggleEffect.length;

            //检查总行长
            if(dialogueLine.content.length > settings.totalLength){
                diagnostics.push(
                    {
                        range:new vscode.Range(lineNum,contentStartCol,lineNum,contentStartCol + dialogueLine.content.length)
                        ,message:`对话文本的总长度(${dialogueLine.content.length})超过了你设置的总长度(${settings.totalLength})，可能导致文字超出对话气泡。在插件设置中可关闭该提示`
                        ,severity:vscode.DiagnosticSeverity.Warning
                    }
                );
            }
            let singleLines = dialogueLine.content.split('#');
            let singleLineStartCol = contentStartCol;
            if(singleLines.length > 1){
                let index = 1;
                for(let singleLine of singleLines){
                    if(singleLine.length > settings.lineLength){
                        diagnostics.push(
                            {
                                range:new vscode.Range(lineNum,singleLineStartCol,lineNum,singleLineStartCol + singleLine.length)
                                ,message:`对话文本的第${index}行的长度(${singleLine.length})超过了你设置的单行长度(${settings.lineLength})，可能导致文字超出对话气泡。在插件设置中可关闭该提示`
                                ,severity:vscode.DiagnosticSeverity.Warning
                            }
                        );
                    }
                    singleLineStartCol += singleLine.length + 1;//算上井号
                    ++index;
                }
            }
            
            //检查多音字
            for(let polyphone of settings.polyphoneList){
                let index = dialogueLine.content.indexOf(polyphone);
                if(index !== -1){
                    //找到了多音字
                    let polyphoneSeverity = settings.polyphoneSeverity;
                    if(polyphoneSeverity === "None"){
                        continue;
                    }
                    let severity:vscode.DiagnosticSeverity = vscode.DiagnosticSeverity[polyphoneSeverity as keyof typeof vscode.DiagnosticSeverity];
                    diagnostics.push(
                        {
                            range:new vscode.Range(lineNum,contentStartCol+index,lineNum,contentStartCol+index+1)
                            ,message:`「${polyphone}」是一个多音字，可能会在语音合成时与你的预期不一致`
                            ,severity:severity
                            ,code:"polyphone"
                        }
                    );
                }
            }

            //检查音效框
            let seStartCol = contentStartCol + dialogueLine.content.length + dialogueLine.toggleEffect.length +dialogueLine.textEffect.length;
            
            for(let se of dialogueLine.soundEffectBoxes){
                let seLen = se.toString().length;
                //检查待合成星标
                if(se.isPending){
                    if(se.file){
                        //{file_or_obj;*}

                    }else{
                        //{*speech_text},{*}
                        //指定文本只能包含`，。：？！“”`等中文符号
                        let regexP = /\p{P}/u;
                        let regexPLegal = /[，。：？！“”]/;
                        
                        for(let i=0;i<se.text.length;++i){
                            if(regexP.test(se.text[i]) && !regexPLegal.test(se.text[i])){
                                //如果是标点符号且不在表内
                                diagnostics.push({
                                    range:new vscode.Range(lineNum,seStartCol+2+i,lineNum,seStartCol+3+i)
                                    ,message:`合成语音的指定文本只能包含，。：？！“”等中文符号，符号「${se.text[i]}」不能出现，需要删除`
                                    ,severity:vscode.DiagnosticSeverity.Error
                                });
                            }
                        }
                    }
                }


                //检查音效文件或对象
                if(se.file){
                    //如果是文件路径，则检查是否存在
                    if(!fs.existsSync(se.file)){
                        diagnostics.push(
                            {
                                range:new vscode.Range(lineNum,seStartCol+1,lineNum,seStartCol+se.file.length+3)
                                ,message:`指定的音效文件并不存在：${se.file}`
                                ,severity:vscode.DiagnosticSeverity.Error
                            }
                        );
                    }else{
                        //文件存在，则检查扩展名
                        if(path.extname(se.file) !== ".wav"){
                            diagnostics.push(
                                {
                                    range:new vscode.Range(lineNum,seStartCol+1,lineNum,seStartCol+se.file.length+3)
                                    ,message:`你使用的是${path.extname(se.file)}文件，并非.wav文件，请先进行格式转换`
                                    ,severity:vscode.DiagnosticSeverity.Error
                                }
                            );
                        }
                    }
                }else if(isCheckMedia && se.obj){
                    if(audioList.findIndex(x=>x.mediaName===se.obj)===-1 && se.obj !== "NA"){
                        //找不到该音效
                        diagnostics.push({
                            range:new vscode.Range(lineNum,seStartCol+1,lineNum,seStartCol+se.obj.length+1)
                            ,message:`找不到音效媒体「${se.obj}」，请检查媒体定义文件：${mediaFilePath}`
                            ,severity:vscode.DiagnosticSeverity.Error
                        });
                    }
                }

                seStartCol += se.toString().length;
            }
            

            continue;
        }

        //背景行
        if(isCheckMedia){
            let backgroundLine = RegexUtils.parseBackgroundLine(line);
            if(backgroundLine && backgroundLine.background !== "black" && backgroundLine.background !== "white"){
                //如果不存在此背景媒体，则标红
                if(backgroundList.findIndex(x=>x.mediaName===backgroundLine?.background) === -1){
                    let startCol = "<background>:".length + (backgroundLine.switchMethod?.length ?? 0);
                    let endCol = startCol + backgroundLine.background.length;
                    diagnostics.push(
                        {
                            range:new vscode.Range(lineNum,startCol,lineNum,endCol)
                            ,message:`背景「${backgroundLine.background}」未在媒体定义文件中定义，请检查媒体定义文件：${mediaFilePath}`
                            ,severity:vscode.DiagnosticSeverity.Error
                        }                           
                    );
                }
                continue;
            }
        }

        //骰子行
        let diceLine = RegexUtils.parseDiceLine(line);
        if(diceLine){
            let curCol = "<dice>".length;
            for(let dice of diceLine){
                if(!dice.title) {continue;}
                let curDiceRange = new vscode.Range(lineNum,curCol+1,lineNum,curCol + dice.toString().length+1)
                if(dice.random > dice.face){
                    //出目大于骰面数
                    diagnostics.push(
                        {
                            range:curDiceRange
                            ,message:`骰子出目${dice.random}大于骰子面数${dice.face}`
                            ,severity:vscode.DiagnosticSeverity.Error
                        }                           
                    );
                }

                //当前列更新
                curCol += dice.toString().length + 1;//1是前面的逗号或者冒号的长度
            }
        }
    }


    return diagnostics;
}