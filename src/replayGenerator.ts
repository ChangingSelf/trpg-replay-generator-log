import * as vscode from 'vscode';
import * as path from 'path';
import * as utils from './utils/utils';
import * as terminalUtils from './utils/TerminalUtils';


let terminal = terminalUtils.TerminalUtils.getInstance();

/**
 * 播放视频
 */
export function playVideo(){
    let s = utils.loadSettings();

    //运行
    let rplGenCorePathDir = path.dirname(s["rplGenCorePath"]);
    
    let cmd = `${s["rplGenCorePath"]} --Modules replay_generator --LogFile ${s["logFile"]} --MediaObjDefine ${s["mediaObjDefine"]} --CharacterTable ${s["characterTable"]} --FramePerSecond ${s["framePerSecond"]} --Width ${s["width"]} --Height ${s["height"]} --Zorder ${s["zorder"]} --OutputPath ${s["outputPath"]} ${/^true$/i.test(s["fixScreenZoom"])?"--FixScreenZoom":""}`;

    let synthesis = /^true$/i.test(s["synthesisAnyway"])?` --SynthesisAnyway --AccessKey ${s["accessKey"]} --AccessKeySecret ${s["accessKeySecret"]} --Appkey ${s["appkey"]} --Azurekey ${s["azurekey"]} --ServRegion ${s["servRegion"]}`:"";

    cmd += synthesis;
    
    terminal.sendText(`cd ${rplGenCorePathDir}`);
    terminal.sendText(cmd);
    terminal.show();
}

/**
 * 导出视频
 */
export function exportVideo(){

    let s = utils.loadSettings();

    //运行
    let rplGenCorePathDir = path.dirname(s["rplGenCorePath"]);


    let cmd = `${s["rplGenCorePath"]} --Modules replay_generator --LogFile ${s["logFile"]} --MediaObjDefine ${s["mediaObjDefine"]} --CharacterTable ${s["characterTable"]} --FramePerSecond ${s["framePerSecond"]} --Width ${s["width"]} --Height ${s["height"]} --Zorder ${s["zorder"]} --OutputPath ${s["outputPath"]} --Quality ${s["quality"]} ${/^true$/i.test(s["fixScreenZoom"])?"--FixScreenZoom":""} --ExportVideo `;
    
    let synthesis = /^true$/i.test(s["synthesisAnyway"])?(` --SynthesisAnyway --AccessKey ${s["accessKey"]} --AccessKeySecret ${s["accessKeySecret"]} --Appkey ${s["appkey"]} --Azurekey ${s["azurekey"]} --ServRegion ${s["servRegion"]}`):"";

    cmd += synthesis;
    
    terminal.sendText(`cd ${rplGenCorePathDir}`);
    terminal.sendText(cmd);
    terminal.show();
}

/**
 * 合成语音
 */
export function synthesizedSpeech(){

    let s = utils.loadSettings();

    //运行
    
    let rplGenCorePathDir = path.dirname(s["rplGenCorePath"]);
    
    
    terminal.sendText(`cd ${rplGenCorePathDir}`);
    terminal.sendText(`${s["rplGenCorePath"]} --Modules speech_synthesizer --LogFile ${s["logFile"]} --MediaObjDefine ${s["mediaObjDefine"]} --CharacterTable ${s["characterTable"]} --OutputPath ${s["outputPath"]} --AccessKey ${s["accessKey"]} --AccessKeySecret ${s["accessKeySecret"]} --Appkey ${s["appkey"]} --Azurekey ${s["azurekey"]} --ServRegion ${s["servRegion"]}`);
    terminal.show();
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

}

/**
 * 导出XML，需要timeline文件
 */
 export function exportXML(){

    let s = utils.loadSettings();

    //运行
    
    let rplGenCorePathDir = path.dirname(s["rplGenCorePath"]);
    
    
    terminal.sendText(`cd ${rplGenCorePathDir}`);
    terminal.sendText(`${s["rplGenCorePath"]} --Modules export_xml --TimeLine ${s["timeLine"]} --LogFile ${s["logFile"]} --MediaObjDefine ${s["mediaObjDefine"]} --OutputPath ${s["outputPath"]} --FramePerSecond ${s["framePerSecond"]} --Width ${s["width"]} --Height ${s["height"]} --Zorder ${s["zorder"]}`);
    terminal.show();
}
