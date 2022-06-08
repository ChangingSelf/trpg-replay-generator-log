import * as vscode from 'vscode';

function regexReplace(searchValue:string | RegExp,replaceValue:string){
    if(!vscode.window.activeTextEditor) {
        vscode.window.showErrorMessage(`请打开要操作的文件`);
        return;
    }
    try {
        let editor = vscode.window.activeTextEditor as vscode.TextEditor;
        let doc = editor.document;
        let text = doc.getText();

        //进行替换
        text = text.replace(searchValue,replaceValue);

        editor.edit(editorEdit => {
            let start = new vscode.Position(0,0);
            let end = start.translate(doc.lineCount,doc.getText().length);
            let allSelection = new vscode.Range(start,end);
            editorEdit.replace(allSelection,text)  
        }).then(isSuccess => {
            if (isSuccess) {
                console.log("Edit successed");
                let len = doc.getText().length;
                console.log(len); 
                vscode.window.showInformationMessage("执行成功！");
            } else {
                console.log("Edit failed");
                vscode.window.showErrorMessage("执行失败！");
            }
        }, err => {
            console.error("Edit error, " + err);
            vscode.window.showErrorMessage(err);
        });


    } catch (error) {
        let err:Error = error as Error;
        vscode.window.showErrorMessage(`[${err.name}]${err.message}`);
    }
    
}

export function replaceAngleBrackets(){
    regexReplace(/<(.*?)>/g,"[$1]:");
}

export function addAsteriskMarks(){
    regexReplace(/^(\[.*?\].*?)$/mg,"$1{*}");
}

export function addSoundEffectsInBatches(){
    vscode.window.showInputBox({
        placeHolder:"角色名称",
        prompt:"要为哪个角色批量添加音效？（默认为“骰娘”）"
    }).then(inputText1=>{
        vscode.window.showInputBox({
            placeHolder:"音效媒体名",
            prompt:`要为${inputText1??"骰娘"}批量添加什么音效呢？这是填写在花括号里的内容（默认为“掷骰音效”）`
        }).then(inputText2=>{
            let characterName = inputText1 || "骰娘";
            let soundEffects = inputText2 || "掷骰音效";
            regexReplace(new RegExp(`^(\\[${characterName}\\].*?)$`,"gm"),`\$1{${soundEffects}}`);
        });

    });
}