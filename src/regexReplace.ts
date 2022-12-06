import * as vscode from 'vscode';

function regexReplace(searchValue:string | RegExp,replaceValue:string,isShowMsg = true){
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
            editorEdit.replace(allSelection,text); 
        }).then(isSuccess => {
            if (isSuccess) {
                if(isShowMsg) {vscode.window.showInformationMessage(`已完成正则替换`);}
            } else {
                if(isShowMsg) {vscode.window.showErrorMessage("替换失败！");}
            }
        }, err => {
            console.error("Edit error, " + err);
            if(isShowMsg) {vscode.window.showErrorMessage(err);}
        });


    } catch (error) {
        let err:Error = error as Error;
        if(isShowMsg) {vscode.window.showErrorMessage(`[${err.name}]${err.message}`);}
    }
    
}

function regexReplaceInBatch(regexList:[{searchValue:string | RegExp,replaceValue:string}],isShowMsg = true){
    if(!vscode.window.activeTextEditor) {
        vscode.window.showErrorMessage(`请打开要操作的文件`);
        return;
    }
    
    try {
        let editor = vscode.window.activeTextEditor as vscode.TextEditor;
        let doc = editor.document;
        let text = doc.getText();

        //进行替换
        for(let item of regexList){
            text = text.replace(item.searchValue,item.replaceValue);
        }
        
        editor.edit(editorEdit => {
            let start = new vscode.Position(0,0);
            let end = start.translate(doc.lineCount,doc.getText().length);
            let allSelection = new vscode.Range(start,end);
            editorEdit.replace(allSelection,text); 
        }).then(isSuccess => {
            if (isSuccess) {
                //console.log("Edit successed");
                let len = doc.getText().length;
                //console.log(len); 
                if(isShowMsg) {vscode.window.showInformationMessage("已完成正则替换");}
            } else {
                //console.log("Edit failed");
                if(isShowMsg) {vscode.window.showErrorMessage("替换失败！");}
            }
        }, err => {
            console.error("Edit error, " + err);
            if(isShowMsg) {vscode.window.showErrorMessage(err);}
        });


    } catch (error) {
        let err:Error = error as Error;
        if(isShowMsg) {vscode.window.showErrorMessage(`[${err.name}]${err.message}`);}
    }
    
}

export function replaceAngleBrackets(){
    regexReplace(/<(.*?)>/g,"[$1]:");
}

export function addAsteriskMarks(){
    let optAll = "给全部对话行添加待处理星标";
    let optNotAE = "只给无音效框的行添加待处理星标";
    let optNotPurePunctuation = "去掉纯标点符号行的待处理星标";
    let optReDo = "把某个角色已经合成的语音框替换为待合成星标以便重新合成（目前是需要输入角色框内全部内容）";
    let optDel = "把某个角色已经合成的语音框删除（目前是需要输入角色框内全部内容）";
    let optDelAll = "删除某个角色后的所有音效框（会误伤普通音效，待优化）（目前是需要输入角色框内全部内容）";
    let optList:string[] = [optAll,optNotAE,optNotPurePunctuation,optReDo,optDel,optDelAll];
    vscode.window.showQuickPick(optList,{
        placeHolder:"请选择替换模式"
    }).then(item=>{
        switch (item) {
            case optAll:
                regexReplace(/^(\[.*?\].*?)$/mg,"$1{*}");
                break;
            case optNotAE:
                regexReplace(/^(\[.*?\][^\{\}]*?)$/mg,"$1{*}");
                break;
            case optNotPurePunctuation:
                //将纯符号的行的待处理星标去掉
                regexReplace(/^(\[.*?\]:([。]|[^a-zA-Z0-9\u2E80-\u9FFF])*)({\*})$/mg,"$1");
                break;
            case optReDo:
                vscode.window.showInputBox({
                    placeHolder:"角色名称，不输入则默认为全部角色",
                    prompt:"输入方括号内的全部内容，包括差分名和其他角色及差分"
                }).then(inputText1=>{
                    regexReplace(new RegExp(`^(\\[${inputText1}.*\\](<.+>)?:.+)\\{.+\\*[\\d\\.]+\\}`,"gm"),"$1{*}");
                });
                break;
            case optDel:
                vscode.window.showInputBox({
                    placeHolder:"角色名称，不输入则默认为全部角色",
                    prompt:"输入方括号内的全部内容，包括差分名和其他角色及差分"
                }).then(inputText1=>{
                    regexReplace(new RegExp(`^(\\[${inputText1}.*\\](<.+>)?:.+)\\{.+\\*[\\d\\.]+\\}`,"gm"),"$1");
                });
                break;
            case optDelAll:
                vscode.window.showInputBox({
                    placeHolder:"角色名称，不输入则默认为全部角色",
                    prompt:"输入方括号内的全部内容，包括差分名和其他角色及差分"
                }).then(inputText1=>{
                    regexReplace(new RegExp(`^(\\[${inputText1}.*\\](<.+>)?:.+)\\{.+}`,"gm"),"$1");
                });
                break;
            default:
                break;
        }
    });
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


export function adjustSoundEffectsTimeInBatches(){
    vscode.window.showInputBox({
        placeHolder:"角色名称",
        prompt:"要为哪个角色批量调整音效时间？（不输入直接Enter为全部）"
    }).then(inputText1=>{
        vscode.window.showInputBox({
            placeHolder:"增加的时间，单位：秒",
            prompt:`要为${inputText1??"全部角色"}的音效增加多少秒？（默认为0.5秒）`
        }).then(inputText2=>{
            let characterName = inputText1 ?? "";
            let deltaTime = parseFloat(inputText2 || "0.5");
            if(!vscode.window.activeTextEditor) {
                vscode.window.showErrorMessage(`请打开要操作的文件`);
                return;
            }
            try {
                let editor = vscode.window.activeTextEditor as vscode.TextEditor;
                let doc = editor.document;
                let text = doc.getText();
                let lines = text.split("\n");
                //console.log(lines);
                let regex = /^\[(.*?)\]:(.*?)\{(.*?);\*([\d.]*?)\}$/m;
                let processedLines = lines.map((line,index)=>{
                    let result = line.match(regex);
                    if(!result) {return line;}
                    let dialogLine = result as RegExpMatchArray;
                    let pc = dialogLine[1];
                    let content = dialogLine[2];
                    let soundEffects = dialogLine[3];
                    let time = parseFloat(dialogLine[4]) + deltaTime;
                    if(characterName && pc !== characterName) {return line;}
                    return `[${pc}]:${content}\{${soundEffects};*${time.toFixed(3)}\}`;
                });
                let processedText = processedLines.join("\n");
                regexReplace(text,processedText);
        
            } catch (error) {
                let err:Error = error as Error;
                vscode.window.showErrorMessage(`[${err.name}]${err.message}`);
            }
            


        });

    });
}

/**
 * 一键替换骰娘文本为骰子行
 */
export function replaceDiceMaidLine(){
    let optDefault = "[骰娘]:掷骰描述在最后一个中文或英文冒号前面：d100=1/50 被无视的骰娘个性化文本";
    let optDoubleQuote = "[骰娘]:掷骰描述在“中文或英文双引号里面”：d100=1/50 被无视的骰娘个性化文本";

    let optList:string[] = [optDefault,optDoubleQuote];

    vscode.window.showInputBox({
        placeHolder:"请输入你的骰娘角色名称",
        prompt:"默认为“骰娘”"
    }).then(inputText1=>{
        let characterName = inputText1 || "骰娘";
        vscode.window.showQuickPick(optList,{
            placeHolder:"请选择替换模式"
        }).then(item=>{
            switch (item) {
                case optDefault:default:
                    regexReplace(new RegExp(`^\\[${characterName}\\]:(.*)[:：].*[Dd](\\d*)\\s*=\\s*(\\d*)\\/(\\d*).*$`,"gm"),
                    "<dice>:($1,$2,$4,$3)\n#$&");
                    break;
                case optDoubleQuote:
                    regexReplace(new RegExp(`^\\[${characterName}\\]:.*["“](.*)["”].*[:：].*[Dd](\\d*)\\s*=\\s*(\\d*)\\/(\\d*).*$`,"gm"),
                    "<dice>:($1,$2,$4,$3)\n#$&");
                    break;
            }
        });
    });

    
}