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
                console.log("Edit successed");
                let len = doc.getText().length;
                console.log(len); 
                if(isShowMsg) {vscode.window.showInformationMessage("执行成功！");}
            } else {
                console.log("Edit failed");
                if(isShowMsg) {vscode.window.showErrorMessage("执行失败！");}
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
                console.log("Edit successed");
                let len = doc.getText().length;
                console.log(len); 
                if(isShowMsg) {vscode.window.showInformationMessage("执行成功！");}
            } else {
                console.log("Edit failed");
                if(isShowMsg) {vscode.window.showErrorMessage("执行失败！");}
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

function pushToRegexList(regexList:[{searchValue:string | RegExp,replaceValue:string}],searchValue:string | RegExp,replaceValue:string){
    regexList.push({
        searchValue:searchValue,
        replaceValue:replaceValue
    });
}

export function replaceAngleBrackets(){
    regexReplace(/<(.*?)>/g,"[$1]:");
}

export function addAsteriskMarks(){
    let optAll = "给全部对话行添加待处理星标";
    let optNotAE = "只给无音效框的行添加待处理星标";
    let optNotPurePunctuation = "去掉纯标点符号行的待处理星标";
    let optReDo = "把某个角色已经合成的语音框替换为待合成星标以便重新合成";
    let optList:string[] = [optAll,optNotAE,optNotPurePunctuation,optReDo];
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
                    prompt:"输入方括号内的内容"
                }).then(inputText1=>{
                    if(!inputText1) {vscode.window.showErrorMessage("请输入角色名称");}
                    regexReplace(new RegExp(`^(\\[${inputText1}.*\\]:.+)\\{.+\\*[\\d\\.]+\\}`,"gm"),"$1{*}");
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
                console.log(lines);
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
                    return `[${pc}]:${content}\{${soundEffects};*${time}\}`;
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
                    regexReplace(new RegExp(`^\\[${characterName}\\]:(.*)[:：]\\s*[Dd](\\d*)\\s*=\\s*(\\d*)\\/(\\d*).*$`,"gm"),
                    "<dice>:($1,$2,$4,$3)\n#$&");
                    break;
                case optDoubleQuote:
                    regexReplace(new RegExp(`^\\[${characterName}\\]:.*["“](.*)["”].*[:：]\\s*[Dd](\\d*)\\s*=\\s*(\\d*)\\/(\\d*).*$`,"gm"),
                    "<dice>:($1,$2,$4,$3)\n#$&");
                    break;
            }
        });
    });

    
}

/**
 * 迁移log文件
 * 目前支持活字引擎和回声工坊剧本文件互相转换
 */
export function migrateLog(){
    let optYes = "我已备份好";
    vscode.window.showWarningMessage("由于活字引擎和回声工坊的功能不完全重合，因此转换不可逆，请提前备份当前log文件",optYes,"取消")
    .then(selection=>{
        if(selection !== optYes){
            return;
        }

        //开始转换
        let optGenerater2Engine = "回声工坊 => 活字引擎";
        let optEngine2Generater = "活字引擎 => 回声工坊";
        let optList:string[] = [optGenerater2Engine,optEngine2Generater];
        vscode.window.showQuickPick(optList,{
            placeHolder:"请选择转换方向"
        }).then(item=>{
            switch (item) {
                case optGenerater2Engine:
                    convertGenerater2Engine();
                    break;
                case optEngine2Generater:
                    convertEngine2Generater();
                    break;
                default:
                    break;
            }
        });
    });
}

function convertGenerater2Engine(){
    // vscode.window.showInformationMessage("回声工坊 => 活字引擎");
    let regexList: [{ searchValue: string | RegExp; replaceValue: string; }]=[{
        searchValue:"",
        replaceValue:""
    }];

    //其余行
    pushToRegexList(regexList,/^(<set:.+)$/gm,"//$1");
    pushToRegexList(regexList,/^(<hitpoint>:.+)$/gm,"//$1");

    //转换对话行
    pushToRegexList(regexList,/^\[(.+?)(\.(.+))?(,.+)?\]:(.+?)(\{.+\})?$/gm,"<$1（$3）>$5");
    pushToRegexList(regexList,/^<(.+?)（）>/gm,"<$1>");

    //转换背景行
    pushToRegexList(regexList,/^<background>(<.+>)?:(.+)$/gm,"【背景】$2");

    //BGM
    pushToRegexList(regexList,/^<set:BGM>:(.+)$/gm,"【BGM】$1");
    pushToRegexList(regexList,/^<set:BGM>:stop$/gm,"【停止BGM】");

    //骰子
    pushToRegexList(regexList,/^<dice>:\((.+?),(.+?),(.+?),(.+?)\)(,\((.+?),(.+?),(.+?),(.+?)\))?(,\((.+?),(.+?),(.+?),(.+?)\))?(,\((.+?),(.+?),(.+?),(.+?)\))?$/gm,"【骰子】（$1）D$2=$4/$3；（$6）D$7=$9/$8；（$11）D$12=$14/$13；（$16）D$17=$19/$18");
    pushToRegexList(regexList,/；（）D=\//gm,"");
    pushToRegexList(regexList,"/NA","");

    //注释
    pushToRegexList(regexList,/^#(.+)$/gm,"//$1");



    regexReplaceInBatch(regexList);

}

function convertEngine2Generater(){
    // vscode.window.showInformationMessage("活字引擎 => 回声工坊 目前还未完成");
    let regexList: [{ searchValue: string | RegExp; replaceValue: string; }]=[{
        searchValue:"",
        replaceValue:""
    }];

    //转换对话行
    pushToRegexList(regexList,/^<(.+?)(（(.+)）)?>(.+)(\n【读作】(.+))?/gm,"[$1.$3]:$4{*$6}");
    pushToRegexList(regexList,/^\[(.+)\.\]:/gm,"[$1]:");

    //转换背景行
    pushToRegexList(regexList,/^【背景】(.+)$/gm,"<background>:$1");
    //BGM
    pushToRegexList(regexList,/^【BGM】(.+)$/gm,"<set:BGM>:$1");
    pushToRegexList(regexList,/^【停止BGM】(.+)?$/gm,"<set:BGM>:stop");

    
    //骰子
    pushToRegexList(regexList,/^【骰子】（(.+?)）D(\d+)=(\d+)(\/(\d+))?(；（(.+?)）D(\d+)=(\d+)(\/(\d+))?)?(；（(.+?)）D(\d+)=(\d+)(\/(\d+))?)?(；（(.+?)）D(\d+)=(\d+)(\/(\d+))?)?$/gm,"<dice>:($1,$2,$5,$3),($7,$8,$11,$9),($13,$14,$17,$15),($19,$20,$23,$21)");
    pushToRegexList(regexList,/,\(,,,\)/gm,"");
    pushToRegexList(regexList,/\((.+?),(\d+?),,(\d+?)\)/gm,"($1,$2,NA,$3)");

    //注释
    pushToRegexList(regexList,/^\/\/(.+)$/gm,"#$1");

    //其余行
    pushToRegexList(regexList,/(^【.+$)/gm,"#$1");

    regexReplaceInBatch(regexList);
}