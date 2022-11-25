import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as outputUtils from './utils/OutputUtils';
import { loadMedia } from './utils/utils';

let outputChannel = outputUtils.OutputUtils.getInstance();
export function defineCharacter(){
    let optFromLog = "从log文件中生成";
    let optFromMediaDef = "从媒体定义文件中生成";
    let optList:string[] = [optFromLog,optFromMediaDef];
    vscode.window.showQuickPick(optList,{
        placeHolder:"请选择生成模式"
    }).then(item=>{
        switch (item) {
            case optFromLog:
                defineCharacterFromLog();
                break;
            case optFromMediaDef:
                defineCharacterFromMediaDef();
                break;
        }
    });
}



function defineCharacterFromLog(){
    let editor = vscode.window.activeTextEditor;
	if(!editor) {
		vscode.window.showInformationMessage('请选中某个文件');
		return;
	}
	if(editor.document.languageId !== 'rgl'){
		vscode.window.showInformationMessage('请选中某个rgl文件');
		return;
	}
	let text = editor.document.getText();
    let root = path.dirname(editor.document.uri.fsPath);

	//匹配角色
	let reg = /^\[([^,\.\(\)]*?(\(\d+\))?(\.[^,\.\(\)]*?)?)(,[^,\.\(\)]*?(\(\d+\))?(\.[^,\.\(\)]*?)?)?(,[^,\.\(\)]*?(\(\d+\))?(\.[^,\.\(\)]*?)?)?\]/mg;
	let result = text.match(reg);
	let dialogLine = result ?? [];

    //统计角色
	let charactersWithSubtype:Set<string> = new Set();
	for (let i = 0; i < dialogLine.length; i++) {
        //对于每一个对话行
		let element = dialogLine[i];
		element = element.replace("[","");
		element = element.replace("]","");
		let cList = element.split(',');//得到含有差分名和透明度的这一行出现的角色的列表

		for (let j = 0; j < cList?.length??0; j++) {
            //对这一行的每一个角色
			let character = cList[j];
			character = character.replace(/(\(\d+\))/,"");//删除透明度括号
			// let subtypeLine = character.split(".");
            // //console.log(subtypeLine);
			charactersWithSubtype.add(character);
		}

	}

    //将没有差分的行设置为default差分
    let subtypeLines:string[][] = [];
    charactersWithSubtype.forEach(characterWithSubtype => {
        let subtypeLine = characterWithSubtype.split(".");
        if(subtypeLine.length === 1){
            subtypeLine.push("default");
        }
        subtypeLines.push(subtypeLine);
    });
    
    const CHARACTER_DEFINE_FILENAME = "characters.tsv";

    // vscode.window.showInputBox({ 
    //     placeHolder:`输入要将结果保存到的路径（含文件名），注意后缀是tsv，默认为“log文件所在目录/${CHARACTER_DEFINE_FILENAME}”`, 
    //     prompt:'将会保存为tsv格式，可以用Excel或者文本编辑器打开'
    // }).then(inputText=>{
    vscode.window.showSaveDialog({
        "defaultUri":vscode.Uri.file(path.join(root,CHARACTER_DEFINE_FILENAME)),
        "filters":{
            '角色配置表': ['tsv']
        },
        "title":"选择保存的路径"
    }).then((uri)=>{
        try {
            if(!uri) {return;}
            let outputFile = uri.fsPath;

            // outputFile = path.join(root,outputFile);
            fs.writeFileSync(outputFile,"Name	Subtype	Animation	Bubble	Voice	SpeechRate	PitchRate\n");
            outputChannel.appendLine("Name	Subtype	Animation	Bubble	Voice	SpeechRate	PitchRate\n");
            subtypeLines.forEach(l=>{
                fs.appendFileSync(outputFile,`${l[0]}\t${l[1]}\t${l[1]==="default"?l[0]:l[0]+"_"+l[1]}\tNA\tNA\tNA\tNA\n`);
                outputChannel.appendLine(`${l[0]}\t${l[1]}\t${l[1]==="default"?l[0]:l[0]+"_"+l[1]}\tNA\tNA\tNA\tNA`);
            });
            outputChannel.show();
            outputChannel.appendLine(`已生成角色配置文件：${outputFile}`);


            //打开生成的文件
            vscode.workspace.openTextDocument(outputFile)
                .then(doc => {
                    // 在VSCode编辑窗口展示读取到的文本
                    vscode.window.showTextDocument(doc);
                }, err => {
                    // //console.log(`Open ${outputFile} error, ${err}.`);
                }).then(undefined, err => {
                    // //console.log(`Open ${outputFile} error, ${err}.`);
                });
        } catch (error) {
            let err:Error = error as Error;
            vscode.window.showErrorMessage(`[${err.name}]${err.message}`);
        }
        
    });

	
}

function defineCharacterFromMediaDef(){
    vscode.window.showOpenDialog({
        "canSelectFiles":true,
        "canSelectMany":false,
        "title":"选择媒体定义文件"
    }).then((uris)=>{
        if(!uris) {return;}

        let mediaList = loadMedia(uris[0].fsPath);
        let animationList = mediaList.filter(x=>x.mediaType==="Animation");

        let subtypeLines: { name: string; subtype: string; animation: string; }[] = [];
        animationList.forEach(x=>{
            let nameSubList = x.mediaName.split("_");
            let subtype = "default";
            let name = x.mediaName;
            if(nameSubList.length !== 1){
                //用分隔符分隔
                subtype = nameSubList[nameSubList.length-1];//取最后一段作为差分名
                name = nameSubList.slice(0,nameSubList.length-1).join("_");//取前面部分作为角色名
            }
            
            
            let animation = x.mediaName;

            subtypeLines.push({
                name:name,
                subtype:subtype,
                animation:animation
            });
        });

        //生成文件
        vscode.window.showSaveDialog({
            "filters":{
                '角色配置表': ['tsv']
            },
            "title":"选择保存的路径"
        }).then((uri)=>{
            try {
                if(!uri) {return;}
                let outputFile = uri.fsPath;
    
                // outputFile = path.join(root,outputFile);
                fs.writeFileSync(outputFile,"Name	Subtype	Animation	Bubble	Voice	SpeechRate	PitchRate\n");
                outputChannel.appendLine("Name	Subtype	Animation	Bubble	Voice	SpeechRate	PitchRate\n");
                subtypeLines.forEach(l=>{
                    let content = `${l.name}\t${l.subtype}\t${l.animation}\tNA\tNA\tNA\tNA\n`;
                    fs.appendFileSync(outputFile,content);
                    outputChannel.appendLine(content);
                });
                outputChannel.show();
                outputChannel.appendLine(`已生成角色配置文件：${outputFile}`);
    
    
                //打开生成的文件
                vscode.workspace.openTextDocument(outputFile)
                    .then(doc => {
                        // 在VSCode编辑窗口展示读取到的文本
                        vscode.window.showTextDocument(doc);
                    }, err => {
                        // //console.log(`Open ${outputFile} error, ${err}.`);
                    }).then(undefined, err => {
                        // //console.log(`Open ${outputFile} error, ${err}.`);
                    });
            } catch (error) {
                let err:Error = error as Error;
                vscode.window.showErrorMessage(`[${err.name}]${err.message}`);
            }
            
        });
    });
}