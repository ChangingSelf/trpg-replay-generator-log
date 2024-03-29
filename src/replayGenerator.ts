import * as vscode from 'vscode';
import * as path from 'path';
import * as utils from './utils/utils';

function getTerminal() {
    return vscode.window.activeTerminal ?? vscode.window.createTerminal("回声工坊");
}


/**
 * 播放视频
 */
export function playVideo(){
    let s = utils.loadSettings(true);

    //运行
    let rplGenCorePathDir = path.dirname(s["rplGenCorePath"]);
    
    let cmd = `${s["rplGenCorePath"]} --Modules replay_generator --LogFile ${s["logFile"]} --MediaObjDefine ${s["mediaObjDefine"]} --CharacterTable ${s["characterTable"]} --FramePerSecond ${s["framePerSecond"]} --Width ${s["width"]} --Height ${s["height"]} --Zorder ${s["zorder"]} --OutputPath ${s["outputPath"]} ${s["fixScreenZoom"]?"--FixScreenZoom":""}`;

    let synthesis = s["synthesisAnyway"]?` --SynthesisAnyway --AccessKey ${s["accessKey"]} --AccessKeySecret ${s["accessKeySecret"]} --Appkey ${s["appkey"]} --Azurekey ${s["azurekey"]} --ServRegion ${s["servRegion"]}`:"";

    cmd += synthesis;
    
    let terminal = getTerminal();
    terminal.sendText(`cd ${rplGenCorePathDir}`);
    terminal.sendText(cmd);
    terminal.show();
}

/**
 * 导出视频
 */
export function exportVideo(){

    let s = utils.loadSettings(true);

    //运行
    let rplGenCorePathDir = path.dirname(s["rplGenCorePath"]);


    let cmd = `${s["rplGenCorePath"]} --Modules replay_generator --LogFile ${s["logFile"]} --MediaObjDefine ${s["mediaObjDefine"]} --CharacterTable ${s["characterTable"]} --FramePerSecond ${s["framePerSecond"]} --Width ${s["width"]} --Height ${s["height"]} --Zorder ${s["zorder"]} --OutputPath ${s["outputPath"]} --Quality ${s["quality"]} ${s["fixScreenZoom"]?"--FixScreenZoom":""} --ExportVideo `;
    
    let synthesis = s["synthesisAnyway"]?(` --SynthesisAnyway --AccessKey ${s["accessKey"]} --AccessKeySecret ${s["accessKeySecret"]} --Appkey ${s["appkey"]} --Azurekey ${s["azurekey"]} --ServRegion ${s["servRegion"]}`):"";

    cmd += synthesis;
    
    let terminal = getTerminal();
    terminal.sendText(`cd ${rplGenCorePathDir}`);
    terminal.sendText(cmd);
    terminal.show();
}

/**
 * 合成语音
 */
export async function synthesizedSpeech(){

    let s = utils.loadSettings(true);

    //运行
    
    let rplGenCorePathDir = path.dirname(s["rplGenCorePath"]);

    //弹框修改输出路径
    vscode.window.showInformationMessage("因为此操作输出文件较多，所以需要二次确认输出路径");
    let outputPath =  await vscode.window.showOpenDialog({
        "canSelectFolders":true,
        "defaultUri":vscode.Uri.file(s.outputPath),
        "title":"请确认输出路径",
        "openLabel":"确认输出路径",
    });
    if(outputPath === undefined){
        vscode.window.showInformationMessage("已取消操作");
        return;
    }else{
        s.outputPath = outputPath[0].fsPath;
        vscode.window.showInformationMessage(`输出路径已设置为${s.outputPath}`);
    }
    
    let terminal = getTerminal();
    terminal.sendText(`cd ${rplGenCorePathDir}`);
    terminal.sendText(`${s["rplGenCorePath"]} --Modules speech_synthesizer --LogFile ${s["logFile"]} --MediaObjDefine ${s["mediaObjDefine"]} --CharacterTable ${s["characterTable"]} --OutputPath ${s["outputPath"]} --AccessKey ${s["accessKey"]} --AccessKeySecret ${s["accessKeySecret"]} --Appkey ${s["appkey"]} --Azurekey ${s["azurekey"]} --ServRegion ${s["servRegion"]}`);
    terminal.show();

    /*不再需要了
    vscode.window.showInformationMessage(`合成程序结束后，点击按钮可以打开处理后的log（先点一下这个消息框避免它自动消失）`,"打开AsteriskMarkedLogFile.rgl").then(selection=>{
        vscode.workspace.openTextDocument(path.join(s["outputPath"],"AsteriskMarkedLogFile.rgl"))
        .then(doc => {
            vscode.window.showTextDocument(doc);
        }, err => {
            vscode.window.showErrorMessage(err);
        }).then(undefined, err => {
            vscode.window.showErrorMessage(err);
        });
    });
    */
}

/**
 * 导出XML，需要timeline文件
 */
 export async function exportXML(){

    let s = utils.loadSettings(true);

    //运行
    
    let rplGenCorePathDir = path.dirname(s["rplGenCorePath"]);

    //弹框修改输出路径
    vscode.window.showInformationMessage("因为此操作输出文件较多，所以需要二次确认输出路径");
    let outputPath =  await vscode.window.showOpenDialog({
        "canSelectFolders":true,
        "defaultUri":vscode.Uri.file(s.outputPath),
        "title":"请确认输出路径",
        "openLabel":"确认输出路径",
    });
    if(outputPath === undefined){
        vscode.window.showInformationMessage("已取消操作");
        return;
    }else{
        s.outputPath = outputPath[0].fsPath;
        vscode.window.showInformationMessage(`输出路径已设置为${s.outputPath}`);
    }
    
    let terminal = getTerminal();
    terminal.sendText(`cd ${rplGenCorePathDir}`);
    terminal.sendText(`${s["rplGenCorePath"]} --Modules export_xml --TimeLine ${s["timeLine"]} --LogFile ${s["logFile"]} --MediaObjDefine ${s["mediaObjDefine"]} --OutputPath ${s["outputPath"]} --FramePerSecond ${s["framePerSecond"]} --Width ${s["width"]} --Height ${s["height"]} --Zorder ${s["zorder"]}`);
    terminal.show();
}
