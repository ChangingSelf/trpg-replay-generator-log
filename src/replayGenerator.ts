import * as vscode from 'vscode';
import * as path from 'path';



export function playVideo(){
    let configuration = vscode.workspace.getConfiguration();
    const rplGenCorePath = configuration.get('trpg-replay-generator-log.RplGenCorePath') as string;

    //优先以当前打开的文件为log文件
    let logFile = configuration.get('trpg-replay-generator-log.LogFilePath') as string;
    let editor = vscode.window.activeTextEditor;
    if(editor){//
        logFile = editor.document.uri.fsPath;
    }


    let mediaObjDefine = configuration.get('trpg-replay-generator-log.MediaObjDefineFilePath') as string;
    let characterTable = configuration.get('trpg-replay-generator-log.CharacterTableFilePath') as string;
    let framePerSecond = configuration.get('trpg-replay-generator-log.FramePerSecond') as number;
    let width = configuration.get('trpg-replay-generator-log.WindowWidth') as number;
    let height = configuration.get('trpg-replay-generator-log.WindowHeight') as number;
    let zorder = configuration.get('trpg-replay-generator-log.Zorder') as string;


    let outputPath = configuration.get('trpg-replay-generator-log.OutputPath') as string;


    let fixScreenZoom = configuration.get('trpg-replay-generator-log.FixScreenZoom') as boolean;

    

    //运行
    let terminal = vscode.window.createTerminal("回声工坊运行终端");
    let RplGenCorePathDir = path.dirname(rplGenCorePath);
    terminal.show();
    terminal.sendText(`cd ${RplGenCorePathDir}`)
    terminal.sendText(`${rplGenCorePath} --Modules replay_generator --LogFile ${logFile} --MediaObjDefine ${mediaObjDefine} --CharacterTable ${characterTable} --FramePerSecond ${framePerSecond} --Width ${width} --Height ${height} --Zorder ${zorder} --OutputPath ${outputPath} ${fixScreenZoom?"--FixScreenZoom":""}`);
}