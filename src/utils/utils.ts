import * as vscode from 'vscode';
import * as outputUtils from './OutputUtils';

/**
 * 读取当前文件内的配置，未定义的配置从vscode的设置中读取
 */
export function loadSettings(){
    let configuration = vscode.workspace.getConfiguration();
    let outputChannel = outputUtils.OutputUtils.getInstance();
    // outputChannel.show();
    const settings = {
        "mediaObjDefine":`${configuration.get('trpg-replay-generator-log.path.MediaObjDefineFilePath') as string}`
        ,"characterTable":`${configuration.get('trpg-replay-generator-log.path.CharacterTableFilePath') as string}`
        ,"framePerSecond":`${configuration.get('trpg-replay-generator-log.video.FramePerSecond') as number}`
        ,"width":`${configuration.get('trpg-replay-generator-log.video.WindowWidth') as number}`
        ,"height":`${configuration.get('trpg-replay-generator-log.video.WindowHeight') as number}`
        ,"zorder":`${configuration.get('trpg-replay-generator-log.video.Zorder') as string}`
        ,"outputPath":`${configuration.get('trpg-replay-generator-log.path.OutputPath') as string}`
        ,"fixScreenZoom":`${configuration.get('trpg-replay-generator-log.flag.FixScreenZoom') as boolean}`
        ,"logFile":`${configuration.get('trpg-replay-generator-log.path.LogFilePath') as string}`
        ,"rplGenCorePath":`${configuration.get('trpg-replay-generator-log.path.RplGenCorePath') as string}`
        ,"quality":`${configuration.get('trpg-replay-generator-log.video.Quality') as number}`
        
        ,"accessKey":`${configuration.get('trpg-replay-generator-log.key.aliyun.AccessKey') as string}`
        ,"accessKeySecret":`${configuration.get('trpg-replay-generator-log.key.aliyun.AccessKeySecret') as string}`
        ,"appkey":`${configuration.get('trpg-replay-generator-log.key.aliyun.Appkey') as string}`
        ,"azurekey":`${configuration.get('trpg-replay-generator-log.key.Azure.Azurekey') as string}`
        ,"servRegion":`${configuration.get('trpg-replay-generator-log.key.Azure.ServRegion') as string}`
        
        ,"synthesisAnyway":`${configuration.get('trpg-replay-generator-log.flag.SynthesisAnyway') as boolean}`
        ,"exportXML":`${configuration.get('trpg-replay-generator-log.flag.ExportXML') as boolean}`
        
        
        ,"timeLine":`${configuration.get('trpg-replay-generator-log.path.TimeLine') as string}`
    };

    let editor = vscode.window.activeTextEditor;
    if(editor){
        settings["logFile"] = editor.document.uri.fsPath;
        let text = editor.document.getText();

        //识别文件中的配置
        let reg = /^#! (.*)$/im;
        let result = text.match(reg);
        if(result) {
            settings["rplGenCorePath"] = result[1];
            outputChannel.appendLine(`[rplGenCorePath] ${settings["rplGenCorePath"]}`);
        }else{
            outputChannel.appendLine(`[rplGenCorePath](default) ${settings["rplGenCorePath"]}`);
        }

        reg = /^#(md|MediaDefinition) (.*)$/im;
        result = text.match(reg);
        if(result){
            settings["mediaObjDefine"] = result[2];
            outputChannel.appendLine(`[mediaObjDefine] ${settings["mediaObjDefine"]}`);
        }else{
            outputChannel.appendLine(`[mediaObjDefine](default) ${settings["mediaObjDefine"]}`);
        }
        
        reg = /^#(ct|CharacterTable) (.*)$/im;
        result = text.match(reg);
        if(result){
            settings["characterTable"] = result[2];
            outputChannel.appendLine(`[characterTable] ${settings["characterTable"]}`);
        }else{
            outputChannel.appendLine(`[characterTable](default) ${settings["characterTable"]}`);
        }
        
        reg = /^#(op|Output) (.*)$/im;
        result = text.match(reg);
        if(result){
            settings["outputPath"] = result[2];
            outputChannel.appendLine(`[outputPath] ${settings["outputPath"]}`);
        }else{
            outputChannel.appendLine(`[outputPath](default) ${settings["outputPath"]}`);
        }
        outputChannel.appendLine("配置读取完毕");
        outputChannel.appendLine("（如果需要查看控制台显示的信息，点击旁边的“终端”或者“TERMINAL”选项卡），或者使用“ctrl+`(反引号，tab上面那个按键)”");
        vscode.window.showInformationMessage("配置读取完毕，如需查看，可点击旁边的“输出”或者“OUTPUT”选项卡，或者使用“ctrl+shift+U”","打开输出面板").then(s=>{
            outputChannel.show();
        });
    }

    return settings;
}

