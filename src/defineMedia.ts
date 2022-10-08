import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as outputUtils from './utils/OutputUtils';
import { match } from 'assert';
import { RegexUtils } from './utils/RegexUtils';


function islegal(name:string){
    return RegexUtils.isMediumNameLegal(name);
}

let outputChannel = outputUtils.OutputUtils.getInstance();

function defineMediaInFolder(mediaType:string,folder:fs.Dirent,parent:string,mediaFile:string,prefix:string,level:number){
    let folderPath = path.join(parent,folder.name);//获取当前文件夹路径
    let files = fs.readdirSync(folderPath,{withFileTypes:true});//读取当前文件夹内文件列表
    let media = files.filter(x=>x.isFile());
    let secondaryDirs = files.filter(x=>x.isDirectory());
    fs.appendFileSync(mediaFile,`\n\n${"#".repeat(level)} ${prefix?prefix+"_":""}${folder.name}\n`)
    
    //对于普通媒体文件，直接进行媒体定义
    media.forEach(medium=>{
        let mediumItem:string = "";
        let filePath = path.join(folderPath,medium.name);
        filePath = filePath.replace(/\\/g,"/")
        let mediumName = `${prefix && level!=1?prefix+"_":""}${level!=1?folder.name+"_":""}${medium.name.substring(0,medium.name.indexOf('.'))}`;//TODO:进行合法性检验
        if(!islegal(mediumName) && !islegal(prefix + mediumName)) {
            // //console.log(`"${mediumName}"不是合法的媒体变量名`);
            outputChannel.appendLine(`错误：[${mediumName}]不是合法的媒体变量名，已跳过`);
            return;
        }else if(islegal(prefix + mediumName)){
            mediumName = prefix + mediumName;
        }
        switch(mediaType){
            case "Bubble":
                mediumItem = `${mediumName} = Bubble(filepath='${filePath}',Main_Text=Text(),Header_Text=None,pos=(0,0),mt_pos=(0,0),ht_pos=(0,0),align='left',line_distance=1.5,label_color='Lavender')`;
                break;
            case "Background":
                mediumItem = `${mediumName} = Background(filepath='${filePath}',pos=(0,0),label_color='Lavender')`;
                break;
            case "Animation":
                mediumItem = `${mediumName} = Animation(filepath='${filePath}',pos=(0,0),tick=1,loop=True,label_color='Lavender')`;
                break;
            case "BGM":
                mediumItem = `${mediumName} = BGM(filepath='${filePath}',volume=100,loop=True,label_color='Lavender')`;
                break;
            case "Audio":
                mediumItem = `${mediumName} = Audio(filepath='${filePath}',label_color='Lavender')`;
                break;
            case "StrokeText":
                mediumItem = `${mediumName} = StrokeText(fontfile='${filePath}',fontsize=40,color=(0,0,0,255),line_limit=20,edge_color=(255,255,255,255),label_color='Lavender')`;
                break;
            case "Text":
                mediumItem = `${mediumName} = Text(fontfile='${filePath}',fontsize=40,color=(0,0,0,255),line_limit=20,label_color='Lavender')`;
                break;
        }
        fs.appendFileSync(mediaFile,`${mediumItem}\n`);
        outputChannel.appendLine(`已添加${mediaType}媒体[${mediumName}]`);
    });

    //对下一级目录进行媒体定义
    if(level != 1) prefix += `_${folder.name}`;

    secondaryDirs.forEach(x=>defineMediaInFolder(mediaType,x,folderPath,mediaFile,prefix,level+1));
}



export function defineMedia(){

    const MEDIA_DEFINE_FILENAME = "media.txt";

    
    // vscode.window.showInputBox({ 
    //     placeHolder:'输入媒体素材所在的文件夹的路径', // 在输入框内的提示信息
    //     prompt:'这个路径下不要有数字开头命名的文件夹，否则会跳过'
    // }).then(inputText1 =>{
    let editor = vscode.window.activeTextEditor;
    let defaultUri = editor?vscode.Uri.file(path.join(path.dirname(editor.document.uri.fsPath),MEDIA_DEFINE_FILENAME)):undefined;
    vscode.window.showOpenDialog({
        "canSelectFolders":true,
        "canSelectMany":false,
        "defaultUri":defaultUri,
        "title":"选择媒体素材所在的文件夹"
    }).then((uris)=>{
        if(!uris) {return;}

        vscode.window.showSaveDialog({
            "defaultUri":defaultUri,
            "filters":{
                '媒体定义文件': ['txt']
            },
            "title":"选择保存的路径"
        }).then((saveUri)=>{

            try {
                
                if(!saveUri) {return;}
                let mediaFolderPath = uris[0].fsPath;

                //读取文件夹下的文件列表
                let folders =  fs.readdirSync(mediaFolderPath,{withFileTypes:true});

                let mediaTypes = ["Bubble","Background","Animation","BGM","Audio","Text","StrokeText"]
                folders = folders.filter(x=>(x.isDirectory() && mediaTypes.includes(x.name)));//筛选出媒体文件夹

                //创建媒体定义文件
                let mediaFile = saveUri.fsPath;
                fs.writeFileSync(mediaFile,"");
                
                //遍历根目录下每一个媒体文件夹
                folders.forEach(folder=>defineMediaInFolder(folder.name,folder,mediaFolderPath,mediaFile,"",1));
                vscode.window.showInformationMessage(`媒体定义文件已输出为：${mediaFile}`);
                outputChannel.show();

                //打开媒体定义文件
                // 获取TextDocument对象
                vscode.workspace.openTextDocument(mediaFile)
                .then(doc => {
                    // 在VSCode编辑窗口展示读取到的文本
                    vscode.window.showTextDocument(doc);
                }, err => {
                    // //console.log(`Open ${mediaFile} error, ${err}.`);
                }).then(undefined, err => {
                    // //console.log(`Open ${mediaFile} error, ${err}.`);
                });
                
            } catch (error) {
                let err:Error = error as Error;
                vscode.window.showErrorMessage(`[${err.name}]${err.message}`);
            }
        
        });
    
    
    });

   
}

/**
 * 将媒体定义文件的文本转换为Object
 */
export function mediaDef2Obj(text:string){
    let mediumLineRegex = /^(\S*)\s*=\s*(\S*?)\((.*?)\)$/gm;
    let mediumRegex = /^(\S*)\s*=\s*(\S*?)\((.*?)\)$/m;
    let mediaList = text.match(mediumLineRegex) ?? [];

    let result:any = [];
    mediaList.forEach(medium=>{
        let mediumElement = medium.match(mediumRegex) ?? [];

        let mediumParameter = mediumElement[3];

        let paraList = mediumParameter.match(/(.*?)=((\(.*?,.*?\))|(.*?))(,|$)/gm) ?? [];

        let mediumParameters:any = {};
        paraList.forEach(parameter=>{
            let resultList = parameter.match(/(.*?)=((\(.*?,.*?\))|(.*?))(,|$)/m) ?? [];
            mediumParameters[resultList[1]] = resultList[2];
        });


        result.push({
            "mediumName" : mediumElement[1],
            "mediumType" : mediumElement[2],
            "mediumParameters" : mediumParameters
        });
    });


    
    return result;
}