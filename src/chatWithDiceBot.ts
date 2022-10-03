const axios = require('axios');
import * as vscode from 'vscode';
import * as outputUtils from './utils/OutputUtils';
import {settings} from './settings';


const url = settings.url;
let outputChannel = outputUtils.OutputUtils.getInstance();

export function chatWithDiceBot(){
    vscode.window.showInputBox({ 
        placeHolder:`你好，我是伊可，有什么能帮到你的吗？如果没有回应说明我还不会，可以在交流群求助`, 
        prompt:'可能无法查看图片，可以把同样的输入词发到交流群来查看图片'
    }).then(inputText=>{

        if(!inputText){
            vscode.window.showInformationMessage("你什么也没有说");
            return;
        }

        let message = inputText ?? "";
        outputChannel.appendLine(`${new Date().toLocaleTimeString()} [User]:\n${message}\n`);

        axios.post(url, {
            "message":message,
            "user_id":"0"
          }
          ).then((response: any)=>{
            // //console.log(response);
            response.data.forEach((line: { message: any; }) => {
                outputChannel.appendLine(`${new Date().toLocaleTimeString()} [Exception]:\n${line?.message}\n`);
            });
            
            outputChannel.show();
          })
          .catch((error: any)=>{
            // //console.log(error);
            vscode.window.showErrorMessage(`DiceBot出现错误：${error.message}`);
          });
    });
    


}