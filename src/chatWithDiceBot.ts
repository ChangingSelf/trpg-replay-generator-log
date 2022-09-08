const axios = require('axios');
import * as vscode from 'vscode';
import * as outputUtils from './utils/OutputUtils';
import {settings} from './settings';


const url = settings.url;
const token = settings.token;
let outputChannel = outputUtils.OutputUtils.getInstance();

export function chatWithDiceBot(){
    vscode.window.showInputBox({ 
        placeHolder:`可以输入你的问题，如果没有回应说明没有触发关键词`, 
        prompt:'输入“##help”可以查看帮助'
    }).then(inputText=>{

        if(!inputText){
            vscode.window.showInformationMessage("你什么也没有说");
            return;
        }

        let message = inputText ?? "";
        outputChannel.appendLine(`${new Date().toLocaleTimeString()} [User]:\n${message}\n`);

        axios.post(url, {
            "message":message
          },{
            "headers":{
                "token":token
            }
          }).then((response: any)=>{
            console.log(response);
            response.data.forEach((line: { message: any; }) => {
                outputChannel.appendLine(`${new Date().toLocaleTimeString()} [DiceBot]:\n${line?.message}\n`);
            });
            
            outputChannel.show();
          })
          .catch((error: any)=>{
            console.log(error);
            vscode.window.showErrorMessage(`DiceBot出现错误：${error.message}`);
          });
    });
    


}