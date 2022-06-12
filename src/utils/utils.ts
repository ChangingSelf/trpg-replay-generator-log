import * as vscode from 'vscode';
import * as outputUtils from './OutputUtils';

function parseBoolean(str:string){
    return /^true$/i.test(str);
}


/**
 * 读取当前文件内的配置，未定义的配置从vscode的设置中读取
 */
export function loadSettings(isShowInfo:boolean=false){
    let configuration = vscode.workspace.getConfiguration();
    let outputChannel = outputUtils.OutputUtils.getInstance();
    // outputChannel.show();
    const settings = {
        //路径
        "rplGenCorePath":configuration.get('trpg-replay-generator-log.path.RplGenCorePath') as string
        ,"mediaObjDefine":configuration.get('trpg-replay-generator-log.path.MediaObjDefineFilePath') as string
        ,"characterTable":configuration.get('trpg-replay-generator-log.path.CharacterTableFilePath') as string
        ,"logFile":configuration.get('trpg-replay-generator-log.path.LogFilePath') as string
        ,"outputPath":configuration.get('trpg-replay-generator-log.path.OutputPath') as string
        ,"timeLine":configuration.get('trpg-replay-generator-log.path.TimeLine') as string

        //视频选项
        ,"framePerSecond":parseInt(configuration.get('trpg-replay-generator-log.video.FramePerSecond') as string)
        ,"width":parseInt(configuration.get('trpg-replay-generator-log.video.WindowWidth') as string)
        ,"height":parseInt(configuration.get('trpg-replay-generator-log.video.WindowHeight') as string)
        ,"zorder":configuration.get('trpg-replay-generator-log.video.Zorder') as string
        ,"fixScreenZoom":parseBoolean(configuration.get('trpg-replay-generator-log.flag.FixScreenZoom') as string)
        ,"quality":parseInt(configuration.get('trpg-replay-generator-log.video.Quality') as string)
        
        //语音合成
        ,"accessKey":configuration.get('trpg-replay-generator-log.key.aliyun.AccessKey') as string
        ,"accessKeySecret":configuration.get('trpg-replay-generator-log.key.aliyun.AccessKeySecret') as string
        ,"appkey":configuration.get('trpg-replay-generator-log.key.aliyun.Appkey') as string
        ,"azurekey":configuration.get('trpg-replay-generator-log.key.Azure.Azurekey') as string
        ,"servRegion":configuration.get('trpg-replay-generator-log.key.Azure.ServRegion') as string
        
        //标志
        ,"synthesisAnyway":parseBoolean(configuration.get('trpg-replay-generator-log.flag.SynthesisAnyway') as string)
        ,"exportXML":parseBoolean(configuration.get('trpg-replay-generator-log.flag.ExportXML') as string)
        
        
        // 悬停提示开关
        ,"enableHover": parseBoolean(configuration.get('trpg-replay-generator-log.hover.Enable') as string)
        ,"enableDialogLineHover":parseBoolean(configuration.get('trpg-replay-generator-log.hover.EnableDialogLine') as string)
        ,"enableConfigLineHover":parseBoolean(configuration.get('trpg-replay-generator-log.hover.EnableConfigLine') as string)
        ,"enableBackgroundLineHover":parseBoolean(configuration.get('trpg-replay-generator-log.hover.EnableBackgroundLine') as string)
        ,"enableAnimationLineHover":parseBoolean(configuration.get('trpg-replay-generator-log.hover.EnableAnimationLine') as string)
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
        
        reg = /^#(tl|Timeline) (.*)$/im;
        result = text.match(reg);
        if(result){
            settings["outputPath"] = result[2];
            outputChannel.appendLine(`[Timeline] ${settings["timeLine"]}`);
        }else{
            outputChannel.appendLine(`[Timeline](default) ${settings["timeLine"]}`);
        }


        outputChannel.appendLine("配置读取完毕");
        outputChannel.appendLine("（如果需要查看控制台显示的信息，点击旁边的“终端”或者“TERMINAL”选项卡），或者使用“ctrl+`(反引号，tab上面那个按键)”");
        if(isShowInfo){
            vscode.window.showInformationMessage("配置读取完毕，如需查看，可点击旁边的“输出”或者“OUTPUT”选项卡，或者使用“ctrl+shift+U”","打开输出面板").then(s=>{
                if(s === "打开输出面板") {
                    outputChannel.show();
                }
            });
        } 
    }

    return settings;
}

