import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export function editAudioBox(){
    //获取文本
    let editor = vscode.window.activeTextEditor;
    if(!editor){
        vscode.window.showInformationMessage("请打开你要编辑的文件");
        return;
    }
    
    let doc = editor.document;
    let text = doc.getText();


    //编辑音效框
    let optAddAsteriskMarksAll = "给全部对话行添加{*}";
    let optAddAsteriskMarks = "只给无音效框的行添加{*}";
    let optAddAudioInBatches = "给指定角色添加音效或者{*}";
    let optNotPurePunctuation = "去掉纯标点符号行的{*}";
    let optReDo = "把指定角色已经合成的语音框替换为{*}以便重新合成";
    let optDel = "把指定角色已经合成的语音框删除";
    let optDelAll = "删除某个角色后的所有音效框";
    let optAdjustAsteriskAudioTime = "调整星标音频时长";

    vscode.window.showQuickPick([{
        label: optAddAsteriskMarksAll,
        description: '猫爷TRPG：https://maoyetrpg.com/',
        detail: '并不是所有骰子都进行了转换；某些换行需要手动处理',
    }],{
        title:"选择log转换模式",
        placeHolder:"将会在原文件旁边生成转换好的rgl文件"
    }).then(value => {
        if(!value){
            return;
        }
        switch(value?.label){
            case optAddAsteriskMarksAll:
                
                break;
            
        }
        //写入文件
        let newFileNamePath = path.join(path.dirname(doc.fileName),`${path.basename(doc.fileName,path.extname(doc.fileName))}_${new Date().getTime()}.rgl`);

        fs.writeFileSync(newFileNamePath,text);
        vscode.commands.executeCommand("vscode.open",vscode.Uri.file(newFileNamePath));
    });
}

