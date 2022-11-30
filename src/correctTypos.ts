import * as vscode from 'vscode';
import { loadSettings } from './utils/utils';
import * as crypto from 'crypto';
import { Base64 }  from 'js-base64';
import axios from 'axios';

/**
 * 文本纠错
 * 调用阿里云API
 */
export function correctTypos(){
    let settings = loadSettings();
    let accessKey = settings.accessKey;
    let accessKeySecret = settings.accessKeySecret;
    if(!accessKey || !accessKeySecret){
        vscode.window.showErrorMessage("你没有配置好阿里云accessKey或accessKeySecret")
        return;//如果没填这俩，就不用继续了
    }
    let text = "我今天吃苹果，明天吃香姣.现在似乎是2012.12.17日晚上7点，之所以是似乎，是因为你已经研究你热爱得神秘学长达3天之久了，若不是放在一旁的手机能显示时间，你完全没意识到自己已经3天2夜没合过眼了，你的胃部已经向你发起了警告，它确实需要吃些什么。";
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
    
    console.log(stringToSign);

    //计算签名
    accessKeySecret += "&";
    let signarture = crypto.createHmac("sha1",accessKeySecret).update(stringToSign).digest("base64");

    //将签名添加进去
    let param2 = 
    {...param,"Signature":signarture};
    
    param2.Text = text;
    param2.Timestamp = timestamp;
    
    console.log(param2);

    axios.get("https://alinlp.cn-hangzhou.aliyuncs.com/",{
        params:param2
    }).then((response: any)=>{
        console.log(response);
        
      })
      .catch((error: any)=>{
        console.log(error);
        vscode.window.showErrorMessage(error.message);
      });
}

function getTypos(accessKey:string,accessKeySecret:string,text:string){
    

}