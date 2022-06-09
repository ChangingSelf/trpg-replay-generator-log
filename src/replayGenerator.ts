import * as vscode from 'vscode';
import * as path from 'path';
import * as utils from './utils';




/**
 * 播放视频
 */
export function playVideo(){
    let s = utils.loadSettings();

    //运行
    let terminal = vscode.window.createTerminal("回声工坊运行终端");
    let rplGenCorePathDir = path.dirname(s["rplGenCorePath"]);
    
    
    terminal.sendText(`cd ${rplGenCorePathDir}`);
    terminal.sendText(`${s["rplGenCorePath"]} --Modules replay_generator --LogFile ${s["logFile"]} --MediaObjDefine ${s["mediaObjDefine"]} --CharacterTable ${s["characterTable"]} --FramePerSecond ${s["framePerSecond"]} --Width ${s["width"]} --Height ${s["height"]} --Zorder ${s["zorder"]} --OutputPath ${s["outputPath"]} ${s["fixScreenZoom"]?"--FixScreenZoom":""}`+s["synthesisAnyway"]?` --SynthesisAnyway --AccessKey ${s["accessKey"]} --AccessKeySecret ${s["accessKeySecret"]} --Appkey ${s["appkey"]} --Azurekey ${s["azurekey"]} --ServRegion ${s["servRegion"]}`:"");
    terminal.show();
}

/**
 * 导出视频
 */
export function exportVideo(){

    let s = utils.loadSettings();

    //运行
    let terminal = vscode.window.createTerminal("回声工坊运行终端");
    let rplGenCorePathDir = path.dirname(s["rplGenCorePath"]);
    
    
    terminal.sendText(`cd ${rplGenCorePathDir}`);
    terminal.sendText(`${s["rplGenCorePath"]} --Modules replay_generator --LogFile ${s["logFile"]} --MediaObjDefine ${s["mediaObjDefine"]} --CharacterTable ${s["characterTable"]} --FramePerSecond ${s["framePerSecond"]} --Width ${s["width"]} --Height ${s["height"]} --Zorder ${s["zorder"]} --OutputPath ${s["outputPath"]} --Quality ${s["quality"]} ${s["fixScreenZoom"]?"--FixScreenZoom":""} --ExportVideo ` + 
    
    s["synthesisAnyway"]?` --SynthesisAnyway --AccessKey ${s["accessKey"]} --AccessKeySecret ${s["accessKeySecret"]} --Appkey ${s["appkey"]} --Azurekey ${s["azurekey"]} --ServRegion ${s["servRegion"]}`:"");
    terminal.show();
}

/**
 * 合成语音
 */
export function synthesizedSpeech(){

    let s = utils.loadSettings();

    //运行
    let terminal = vscode.window.createTerminal("回声工坊运行终端");
    let rplGenCorePathDir = path.dirname(s["rplGenCorePath"]);
    
    
    terminal.sendText(`cd ${rplGenCorePathDir}`);
    terminal.sendText(`${s["rplGenCorePath"]} --Modules speech_synthesizer --LogFile ${s["logFile"]} --MediaObjDefine ${s["mediaObjDefine"]} --CharacterTable ${s["characterTable"]} --OutputPath ${s["outputPath"]} --AccessKey ${s["accessKey"]} --AccessKeySecret ${s["accessKeySecret"]} --Appkey ${s["appkey"]} --Azurekey ${s["azurekey"]} --ServRegion ${s["servRegion"]}`);
    terminal.show();
}

/**
 * 导出XML，需要timeline文件
 */
 export function exportXML(){

    let s = utils.loadSettings();

    //运行
    let terminal = vscode.window.createTerminal("回声工坊运行终端");
    let rplGenCorePathDir = path.dirname(s["rplGenCorePath"]);
    
    
    terminal.sendText(`cd ${rplGenCorePathDir}`);
    terminal.sendText(`${s["rplGenCorePath"]} --Modules export_xml --TimeLine ${s["timeLine"]} --LogFile ${s["logFile"]} --MediaObjDefine ${s["mediaObjDefine"]} --OutputPath ${s["outputPath"]} --FramePerSecond ${s["framePerSecond"]} --Width ${s["width"]} --Height ${s["height"]} --Zorder ${s["zorder"]}`);
    terminal.show();
}
