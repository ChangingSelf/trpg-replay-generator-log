import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

//猫爷TRPG
//(.*?) \d\d\d\d/\d\d/\d\d \d\d:\d\d:\d\d\n    (.+)
//

export function convertLog(){
    let editor = vscode.window.activeTextEditor;
    if(!editor){
        vscode.window.showInformationMessage("请打开你要转换的文件");
        return;
    }

    let doc = editor.document;
    let text = doc.getText();

    text = convertLogFromMaoYe(text);
    let newFileNamePath = path.join(path.dirname(doc.fileName),`${path.basename(doc.fileName,path.extname(doc.fileName))}_${new Date().getTime()}.rgl`);

    fs.writeFileSync(newFileNamePath,text);
    vscode.commands.executeCommand("vscode.open",vscode.Uri.file(newFileNamePath));
}

export function convertLogFromMaoYe(text:string){
    console.log(text);
    text = text.replace(new RegExp("(.*?) \\d\\d\\d\\d\\/\\d\\d\\/\\d\\d \\d\\d:\\d\\d:\\d\\d[\\n\\r]+    (.+)","gm"),"[$1]:$2");
    console.log(text);
    return text
    // .replace(/(.*?) \d\d\d\d\/\d\d\/\d\d \d\d:\d\d:\d\d\n    (.+)/gm,"[$1]:$2")
    .replace(/#/g,"")
    .replace(/<br>/g,"")//因为猫爷TRPG的Log常常在奇怪的地方加<br>，所以直接去掉
    .replace(/\(/g,"（")//英文括号转中文括号
    .replace(/\)/g,"）")//英文括号转中文括号
    .replace(/^\[骰子\]:(.*)[:：].*[Dd](\d*)\s*=\s*(\d*)\/(\d*).*$/gm,"# $&\n<dice>:($1,$2,$4,$3)")//骰子行转换
    .replace(/^\[骰子\]:(.*)[:：] .*\(\d+[Dd](\d+)\s*=\s*\d+\s*\)=\d+=(\d+).*$/gm,"# $&\n<dice>:($1,$2,NA,$3)")
    .replace(/^.+:button756.+$/mg,"# $&")//注释掉掷骰指令行
    .replace(/^\[.*\]:\..*$/mg,"# $&")//注释掉掷骰指令行
    .replace(/^\[.*\]:<img src=.*>$/mg,"# $&");//注释掉图片行
}