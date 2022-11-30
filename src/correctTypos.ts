import * as vscode from 'vscode';
import { loadSettings } from './utils/utils';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import { RegexUtils } from './utils/RegexUtils';
import { OutputUtils } from './utils/OutputUtils';

let outputChannel = OutputUtils.getInstance();
let CONTENT_MAX_SIZE = 128;//API最大能够接受的字符数

/**
 * 文本纠错
 * 调用阿里云API
 */
export async function correctTypos(){
    let settings = loadSettings();
    let accessKey = settings.accessKey;
    let accessKeySecret = settings.accessKeySecret;
    if(!accessKey || !accessKeySecret){
        vscode.window.showErrorMessage("你没有配置好阿里云accessKey或accessKeySecret");
        return;//如果没填这俩，就不用继续了
    }

    // //test
    // let result = await getTypos(accessKey,accessKeySecret,"我今天吃平果");
    // console.log(result?.data);
    // console.log(result?.data.Data);
    // console.log(JSON.parse(result?.data.Data));
    // console.log(JSON.parse(result?.data.Data).result.target);

    // return;


    let doc = vscode.window.activeTextEditor?.document;
    if(!doc){
        vscode.window.showErrorMessage("未选中任何文件");
        return;
    }

    let text = doc.getText();
    let lines = text.split('\n');

    //新文件名称
    let newFileName = path.join(path.dirname(doc.fileName),`CorrectedLog_${new Date().getTime()}.rgl`);

    outputChannel.clear();
    outputChannel.show();
    let lineNum = 0;
    for(let line of lines){
        let dialogueLine = RegexUtils.parseDialogueLine(line);
        if(dialogueLine){
            //是对话行，则进行纠错后写入新文件
            let content = dialogueLine.content;
            
            /**
                 * {“result”:{ “edits”:[ { “confidence”:0.8385, “pos”:11, “src”:”姣”, “tgt”:”蕉”, “type”:”SpellingError” } ], “source”:”我今天吃苹果，明天吃香姣”, “target”:”我今天吃苹果，明天吃香蕉” },”success”:true}
                 */
            let response = await getTypos(accessKey,accessKeySecret,content);
            if(!response){
                outputChannel.appendLine(`[${lineNum+1}/${line.length} = ${(lineNum/line.length*100).toFixed(2)}5]:字数(${content.length})超过上限(${CONTENT_MAX_SIZE})，当前版本暂不考虑处理。已跳过。`);
                fs.appendFileSync(newFileName,line + "\n");
                continue;
            }

            outputChannel.appendLine(`[${lineNum+1}/${lines.length} = ${(lineNum/lines.length*100).toFixed(2)}%]:${response?.data.Data}\n`);
            if(response?.status === 200){
                let result = JSON.parse(response?.data.Data).result;

                fs.appendFileSync(newFileName,line.replace(result.source,result.target) + "\n");
            }else{
                vscode.window.showErrorMessage(`处理第${lineNum+1}行时出现错误，请查看输出面板中对应信息`);
                outputChannel.appendLine(`\ncode:${response?.status}\nmsg:${response?.statusText}`);
                console.log(response);
                return;
            }
        }else{
            //不是对话行，则直接写入新文件
            fs.appendFileSync(newFileName,line + "\n");
        }
        ++lineNum;
    }

    //打开两者的对比框
    vscode.commands.executeCommand("vscode.diff",doc.uri,vscode.Uri.file(newFileName),"修改前后对比");
    outputChannel.show();
    vscode.window.showInformationMessage(`修改完成，输出文件为${newFileName}`);
}

async function getTypos(accessKey:string,accessKeySecret:string,text:string){
    
    if(!accessKey || !accessKeySecret || text.length > CONTENT_MAX_SIZE){
        //超出字数的就先简单跳过吧
        return null;
    }

    let timestamp = new Date().toISOString();

    let param = {
        //公共参数
        "Format":"json",
        "Version":"2020-06-29",
        "AccessKeyId":accessKey,
        "SignatureMethod":"HMAC-SHA1",
        "Timestamp":encodeURIComponent(timestamp),
        "SignatureVersion":"1.0",
        "SignatureNonce":crypto.randomUUID(),
        //文本纠错参数
        "Text":encodeURIComponent(text),
        "Action":"GetEcChGeneral",//文本纠错服务标识
        "ServiceCode":"alinlp"
    };
    //对参数按照key进行排序
    let paramKeys = Object.keys(param).sort();

    //转换为url参数
    let paramStr = "";
    for(let paramKey of paramKeys){
        paramStr += `${paramKey}=${param[paramKey as keyof typeof param]}&`;
    }
    paramStr = paramStr.slice(0,paramStr.length-1);//去掉最后一个＆符号

    // console.log(paramStr);

    //进行Url编码
    paramStr = encodeURIComponent(paramStr);

    // console.log(paramStr);

    //拼接头
    let stringToSign = "GET&%2F&" + paramStr;
    
    // console.log(stringToSign);

    //计算签名
    accessKeySecret += "&";
    let signarture = crypto.createHmac("sha1",accessKeySecret).update(stringToSign).digest("base64");

    //将签名添加进去
    let param2 = 
    {...param,"Signature":signarture};
    
    param2.Text = text;
    param2.Timestamp = timestamp;
    
    
    return await axios.get("https://alinlp.cn-hangzhou.aliyuncs.com/",{
        params:param2
    });
}