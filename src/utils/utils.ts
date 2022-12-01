import * as vscode from 'vscode';
import * as outputUtils from './OutputUtils';
import * as fs from 'fs';
import * as xlsx from "node-xlsx";
import { RegexUtils } from './RegexUtils';
import { Character } from './entities';
import path = require('path');

function parseBoolean(str:string){
    return /^true$/i.test(str);
}

/**
 * 这是用于测试的命令，没有实际功能
 */
export function testCommand(){
    vscode.window.showInformationMessage("这是用于测试的命令，没有实际功能");
    vscode.window.withProgress({
        // 进度显示类型, Notification(右下角通知和进度) | Window(状态栏转圈) | SourceControl(源代码控制栏图标和进度)
        location: vscode.ProgressLocation.Notification,
        title: "获取网络资源", // 标题
        cancellable: true // 显示取消按钮
    }, (progress, token) => {

        // 取消按钮回调
        token.onCancellationRequested(() => {
            vscode.window.showInformationMessage("取消成功");
        });

        // 进度0%, 无文本
        progress.report({ increment: 0 });

        // 修改进度条到10%, 增加文本
        setTimeout(() => {
            progress.report({ increment: 10, message: "发送请求中.." });
        }, 1000);

        setTimeout(() => {
            progress.report({ increment: 30, message: "请求发送成功..." });
        }, 2000);

        setTimeout(() => {
            progress.report({ increment: 50, message: "请求已到达..." });
        }, 3000);

        // 4秒后关闭
        return new Promise<void>(resolve => {
            vscode.window.showInformationMessage("执行");
            setTimeout(resolve, 10000);
        });
    });
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

        //错误诊断
        ,"lineLength":configuration.get('trpg-replay-generator-log.diagnostic.LineLength') as number
        ,"totalLength":configuration.get('trpg-replay-generator-log.diagnostic.TotalLength') as number
        ,"polyphoneList":configuration.get('trpg-replay-generator-log.diagnostic.PolyphoneList') as string
        ,"polyphoneSeverity":configuration.get('trpg-replay-generator-log.diagnostic.PolyphoneSeverity') as string
        //Treeview
        ,"parseOutlineByComment":parseBoolean(configuration.get('trpg-replay-generator-log.treeview.parseOutlineByComment') as string)

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
            outputChannel.appendLine(`[rplGenCorePath] ${settings["rplGenCorePath"]}`,isShowInfo);
        }else{
            outputChannel.appendLine(`[rplGenCorePath](default) ${settings["rplGenCorePath"]}`,isShowInfo);
        }

        reg = /^#(md|MediaDefinition) (.*)$/im;
        result = text.match(reg);
        if(result){
            settings["mediaObjDefine"] = result[2];
            outputChannel.appendLine(`[mediaObjDefine] ${settings["mediaObjDefine"]}`,isShowInfo);
        }else{
            outputChannel.appendLine(`[mediaObjDefine](default) ${settings["mediaObjDefine"]}`,isShowInfo);
        }
        
        reg = /^#(ct|CharacterTable) (.*)$/im;
        result = text.match(reg);
        if(result){
            settings["characterTable"] = result[2];
            outputChannel.appendLine(`[characterTable] ${settings["characterTable"]}`,isShowInfo);
        }else{
            outputChannel.appendLine(`[characterTable](default) ${settings["characterTable"]}`,isShowInfo);
        }
        
        reg = /^#(op|Output) (.*)$/im;
        result = text.match(reg);
        if(result){
            settings["outputPath"] = result[2];
            outputChannel.appendLine(`[outputPath] ${settings["outputPath"]}`,isShowInfo);
        }else{
            outputChannel.appendLine(`[outputPath](default) ${settings["outputPath"]}`,isShowInfo);
        }
        
        reg = /^#(tl|Timeline) (.*)$/im;
        result = text.match(reg);
        if(result){
            settings["outputPath"] = result[2];
            outputChannel.appendLine(`[Timeline] ${settings["timeLine"]}`,isShowInfo);
        }else{
            outputChannel.appendLine(`[Timeline](default) ${settings["timeLine"]}`,isShowInfo);
        }

        //单行长度
        reg = /^#(ll|LineLength) (.*)$/im;
        result = text.match(reg);
        if(result){
            settings["lineLength"] = parseInt(result[2]);
            if(settings.lineLength < 0 ){
                settings.lineLength = Number.POSITIVE_INFINITY;
            }
            outputChannel.appendLine(`[LineLength] ${settings["lineLength"]}`,isShowInfo);
        }else{
            if(settings.lineLength < 0 ){
                settings.lineLength = Number.POSITIVE_INFINITY;
            }
            outputChannel.appendLine(`[LineLength](default) ${settings["lineLength"]}`,isShowInfo);
        }
        //总长度
        reg = /^#(tl|TotalLength) (.*)$/im;
        result = text.match(reg);
        if(result){
            settings.totalLength = parseInt(result[2]);
            if(settings.totalLength < 0 ){
                settings.totalLength = Number.POSITIVE_INFINITY;
            }
            outputChannel.appendLine(`[TotalLength] ${settings.totalLength}`,isShowInfo);
        }else{
            if(settings.totalLength < 0 ){
                settings.totalLength = Number.POSITIVE_INFINITY;
            }
            outputChannel.appendLine(`[TotalLength](default) ${settings.totalLength}`,isShowInfo);
        }

        outputChannel.appendLine("配置读取完毕",isShowInfo);
        outputChannel.appendLine("（如果需要查看控制台显示的信息，点击旁边的“终端”或者“TERMINAL”选项卡），或者使用“ctrl+`(反引号，tab上面那个按键)”",isShowInfo);
        
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

/**
 * 读取角色配置表中的角色
 */
export function loadCharacters(filePath:string){
    let pcMap = new Map<string,Set<string>>();


    if(path.extname(filePath) === ".xlsx"){
        let sheets = xlsx.parse(filePath);
        let data:unknown[] = [];
        if(sheets.length === 1){
            //如果只有一个表，那就读这个表
            data = sheets[0].data;
        }else if(sheets.length > 1){
            //如果有多个表，优先读取名为“角色配置”的表
            let sheet = sheets.find(x=>x.name === "角色配置");
            if(sheet){
                //如果找到了，就用那张
                data = sheet.data;
            }else{
                //否则使用第一张表
                data = sheets[0].data;
            }
        }
        data = data.slice(1,data.length);//去掉表头
        for(let line of data){
            if(!Array.isArray(line)){
                continue;
            }
            let name = line[0];
            let subtype = line[1];
            if(pcMap.has(name)){
                //如果已经有这个角色则将差分加入进去
                pcMap.get(name)?.add(subtype);
            }else{
                pcMap.set(name,new Set<string>([subtype]));
            }
        }
    }
    else if(path.extname(filePath) === ".tsv"){
        let text = "";
        try {
        text = fs.readFileSync(filePath,{encoding:'utf8', flag:'r'});
        } catch (error) {
            console.log(error);
        }
        
        if(text === ""){
            return pcMap;
        }
        let lines = text.split("\n");
        for(let line of lines){
            let lineSplit = line.split("\t");
            let name = lineSplit[0];
            let subtype = lineSplit[1];
            if(pcMap.has(name)){
                //如果已经有这个角色则将差分加入进去
                pcMap.get(name)?.add(subtype);
            }else{
                pcMap.set(name,new Set<string>([subtype]));
            }
        }
    }
    return pcMap;
}

/**
 * 读取媒体定义文件
 */
 export function loadMedia(filePath:string){

    let text = "";
    try {
       text = fs.readFileSync(filePath,{encoding:'utf8', flag:'r'});
    } catch (error) {
        console.log(error);
    }
    
    let mediaList:{
        mediaName: string;
        mediaType: string;
        mediaPara: string;
    }[] = [];
    if(text === ""){
        return mediaList;
    }

    let lines = text.split("\n");
    
    for(let line of lines){
        let medium = RegexUtils.parseMediaLine(line);
        if(medium){
            mediaList.push(medium);
        }
    }
    return mediaList;
}