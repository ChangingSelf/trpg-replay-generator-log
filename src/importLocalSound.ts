import * as vscode from 'vscode';
import * as fs from 'fs';
import { RegexUtils } from './utils/RegexUtils';
import { loadSettings } from './utils/utils';
import * as path from 'path';
import { exec, execSync } from 'child_process';
import * as outputUtils from './utils/OutputUtils';
import { rglStatusBar } from './rglStatusBar';

let outputChannel = outputUtils.OutputUtils.getInstance();
let statusBar = rglStatusBar.getInstance();

function getAudioDuration(filePath:string):number {
    let settings = loadSettings();
    let ffPath = path.join(path.dirname(settings.rplGenCorePath),"ffprobe.exe");
    let stdout = execSync(`${ffPath} "${filePath}" -show_format -print_format json -hide_banner`);
    let jsonStr = stdout.toString();
    let result = JSON.parse(jsonStr);
    // outputChannel.appendLine("--");
    if(result){
        let duration = Number(result.format.duration);
        return Number(duration.toFixed(3));
    }
    return 0;
}


export function importLocalSound() {
    let settings = loadSettings();
    let ffPath = path.join(path.dirname(settings.rplGenCorePath),"ffprobe.exe");
    if(!fs.existsSync(ffPath)){
        vscode.window.showErrorMessage(`找不到${ffPath}，请先配置好回声工坊的路径`);
        return;
    }
    

    vscode.window.showOpenDialog({ 
        "canSelectFolders": true, 
        "title": "打开存放本地语音文件的文件夹"
    }).then(uris=>{
        //成功
        if(uris) {
            outputChannel.appendLine("开始进行语音导入");
            outputChannel.show();
            let targetPath = uris[0].fsPath;
            //读取文件夹下的文件列表
            let files =  fs.readdirSync(targetPath,{withFileTypes:true});
            files = files.filter(x=>(x.isFile() && /.*\.wav$/.test(x.name)));//获取其中的文件
            // console.log(files);
            if(files.length === 0 ){
                vscode.window.showErrorMessage("该目录下没有wav文件");
                return;
            }

            try {
                let editor = vscode.window.activeTextEditor as vscode.TextEditor;
                if(!editor) {
                    vscode.window.showErrorMessage(`请打开要操作的文件`);
                    return;
                }
                let doc = editor.document;
                let text = doc.getText();
                let lines = text.split("\n");
                let newLines:string[] = [];
                let i = 0;//目前轮到的wav文件

                /* 所有办法都试过了，就是没办法实时显示进度，TMD！浪费了4个小时
                vscode.window.withProgress({
                    // 进度显示类型, Notification(右下角通知和进度) | Window(状态栏转圈) | SourceControl(源代码控制栏图标和进度)
                    location: vscode.ProgressLocation.Notification,
                    title: "获取网络资源", // 标题
                    cancellable: true // 显示取消按钮
                }, async(progress, token) => {
            
                    // 取消按钮回调
                    token.onCancellationRequested(() => {
                        vscode.window.showInformationMessage("取消成功");
                    });
            
                    // 进度0%, 无文本
                    progress.report({ increment: 0 });

            
                    // 修改进度条到10%, 增加文本
                    setTimeout(() => {
                        
                    }, 1000);
            
                    setTimeout(() => {
                        progress.report({ increment: 30, message: "请求发送成功..." });
                    }, 2000);
            
                    setTimeout(() => {
                        progress.report({ increment: 50, message: "请求已到达..." });
                    }, 3000);

                    
                    for(let line of lines){
                        let dialogLine = RegexUtils.parseDialogueLine(line);
                        if(!dialogLine || !dialogLine.soundEffect.match(/\{\*\}/)){
                            newLines.push(line);//若不是含有待处理星标的对话行，不作处理
                            continue;
                        }
    
                        //开始导入语音
                        let curFilePath = vscode.Uri.joinPath(vscode.Uri.file(targetPath),files[i++].name).fsPath;
                        let msg = `[${i}/${files.length}=${(i/files.length*100).toFixed(0)}%]'${curFilePath}' -> ${line}`;
                        outputChannel.appendLine(msg);
                        // vscode.window.showInformationMessage(msg);
                        progress.report({ increment: 10,message:msg});
                        console.log(msg);
    
                        let duration = getAudioDuration(curFilePath);
                        
                        line = line.replace(/\{\*\}/,`{'${curFilePath}';*${duration}}`);
                        newLines.push(line);
                        if(i >= files.length){
                            //wav文件不够用了
                            vscode.window.showErrorMessage(`路径“${targetPath}”下的${i}个wav文件不够用，请检查数目之后重新进行替换。`);
                            return;
                        }
                    }
                    outputChannel.appendLine("开始进行替换");
                        
                    text = newLines.join("\n");
                    
                    
                    //进行替换
                    editor.edit(editorEdit => {
                        let start = new vscode.Position(0,0);
                        let end = start.translate(doc.lineCount,doc.getText().length);
                        let allSelection = new vscode.Range(start,end);
                        editorEdit.replace(allSelection,text); 
                    }).then(isSuccess => {
                        if (isSuccess) {
                            
                            vscode.window.showInformationMessage("导入成功！");
                            outputChannel.appendLine("完成语音导入");
                        } else {
                            vscode.window.showErrorMessage("导入失败！");
                        }
                    }, err => {
                        vscode.window.showErrorMessage(err);
                    });
                    return new Promise<void>(resolve => {
                        setTimeout(() => {
                            resolve();
                        }, 5000);
                    });
                });    
                */
               ///*
                for(let line of lines){
                    if(i >= files.length){
                        //wav文件不够用了
                        // vscode.window.showInformationMessage(`路径“${targetPath}”下的${i}个wav文件不够用`);
                        newLines.push(line);
                        continue;
                    }
                    let dialogLine = RegexUtils.parseDialogueLine(line);
                    if(!dialogLine || !dialogLine.soundEffect.match(/\{\*\}/)){
                        newLines.push(line);//若不是含有待处理星标的对话行，不作处理
                        continue;
                    }

                    //开始导入语音
                    let curFilePath = vscode.Uri.joinPath(vscode.Uri.file(targetPath),files[i++].name).fsPath;
                    let msg = `[${i}/${files.length}=${(i/files.length*100).toFixed(0)}%]'${curFilePath}' -> ${line}`;
                    outputChannel.appendLine(msg);
                    // vscode.window.showInformationMessage(msg);
                    console.log(msg);

                    let duration = getAudioDuration(curFilePath);
                    
                    line = line.replace(/\{\*\}/,`{'${curFilePath}';*${duration}}`);
                    newLines.push(line);
                    
                }
                outputChannel.appendLine("开始进行替换");
                    
                text = newLines.join("\n");
                
                
                //进行替换
                editor.edit(editorEdit => {
                    let start = new vscode.Position(0,0);
                    let end = start.translate(doc.lineCount,doc.getText().length);
                    let allSelection = new vscode.Range(start,end);
                    editorEdit.replace(allSelection,text); 
                }).then(isSuccess => {
                    if (isSuccess) {
                        
                        vscode.window.showInformationMessage("导入成功！");
                        outputChannel.appendLine("完成语音导入");
                    } else {
                        vscode.window.showErrorMessage("导入失败！");
                    }
                }, err => {
                    vscode.window.showErrorMessage(err);
                });
                //*/
            }catch(error){
                vscode.window.showErrorMessage(""+error);
            }
        }
    },reason=>{
        //失败
        vscode.window.showErrorMessage(`打开文件夹出错，错误原因：${reason}`);
    });
}