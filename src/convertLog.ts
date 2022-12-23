import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

//命令
export function convertLog(){

    //获取文本
    let editor = vscode.window.activeTextEditor;
    if(!editor){
        vscode.window.showInformationMessage("请打开你要转换的文件");
        return;
    }
    
    let doc = editor.document;
    let text = doc.getText();


    //转换Log
    let optMaoYe = "猫爷TRPG => 回声工坊";
    let optBoLuoTxt = "菠萝txt => 回声工坊";
    let optBoLuoJson = "菠萝json => 回声工坊";
    let optQQ = "QQ聊天记录 => 回声工坊";
    let optPainted = "已染色记录 => 回声工坊";
    let optPaintedTaDice = "塔骰已染色记录 => 回声工坊";
    let optEngine2Generater = "活字引擎 => 回声工坊";
    let optGenerater2Engine = "回声工坊 => 活字引擎";
    vscode.window.showQuickPick([{
        label: optMaoYe,
        description: '猫爷TRPG：https://maoyetrpg.com/',
        detail: '并不是所有骰子都进行了转换；某些换行需要手动处理',
    }, {
        label: optBoLuoTxt,
        description: '菠萝：https://boluo.chat/',
        detail: '菠萝可导出多种格式，此选项处理的是txt格式。由于是行内骰子，不易解析，所以没有处理。建议导出到json格式来处理'
    }, {
        label: optBoLuoJson,
        description: '菠萝：https://boluo.chat/',
        detail: '菠萝可导出多种格式，此选项处理的是json格式。'
    }, {
        label: optQQ,
        description: 'QQ未处理的跑团记录',
        detail: '支持直接从聊天窗口复制、消息管理器导出的记录(还是不要两者混用了，混用有点bug)'
    }, {
        label: optPainted,
        description: '已经用染色器网站处理过的跑团记录',
        detail: '支持赵系(https://logpainter.trpgbot.com/)、溯洄系(https://logpainter.kokona.tech)染色器网站'
    }, {
        label: optPaintedTaDice,
        description: '已经用染色器网站处理过的跑团记录，塔骰专属',
        detail: '支持塔骰染色记录'
    }, {
        label: optEngine2Generater,
        description: '活字引擎3',
        detail: ''
    }, {
        label: optGenerater2Engine,
        description: '',
        detail: ''
    }],{
        title:"选择log转换模式",
        placeHolder:"将会在原文件旁边生成转换好的rgl文件"
    }).then(value => {
        if(!value){
            return;
        }
        switch(value?.label){
            case optMaoYe:
                text = convertLogFromMaoYe(text);
                break;
            case optBoLuoTxt:
                text = convertLogFromBoLuoTxt(text);
                break;
            case optBoLuoJson:
                text = convertLogFromBoLuoJson(text);
                break;
            case optQQ:
                text = convertLogFromQQ(text);
                break;
            case optPainted:
                text = convertLogFromPainted(text);
                break;
            case optPaintedTaDice:
                text = convertLogFromPaintedTaDice(text);
                break;
            case optEngine2Generater:
                text = convertEngine2Generater(text);
                break;
            case optGenerater2Engine:
                text = convertGenerater2Engine(text);
                break;
        }
        //写入文件
        let newFileNamePath = path.join(path.dirname(doc.fileName),`${path.basename(doc.fileName,path.extname(doc.fileName))}_${new Date().getTime()}.rgl`);

        fs.writeFileSync(newFileNamePath,text);
        vscode.commands.executeCommand("vscode.open",vscode.Uri.file(newFileNamePath));
    });
}

//猫爷TRPG
export function convertLogFromMaoYe(text:string){
    return text
    .replaceAll(/(.*?) \d\d\d\d\/\d\d\/\d\d \d\d:\d\d:\d\d[\n\r]+    (.*)/gm,"[$1]:$2")//注意回车换行符（\r\n）
    // .replaceAll(new RegExp("(.*?) \\d\\d\\d\\d\\/\\d\\d\\/\\d\\d \\d\\d:\\d\\d:\\d\\d[\\n\\r]+    (.+)","gm"),"[$1]:$2")//注意回车换行符（\r\n）
    .replaceAll(/#/g,"")
    .replaceAll(/<br>/g,"")//因为猫爷TRPG的Log常常在奇怪的地方加<br>，所以直接去掉
    .replaceAll(/\(/g,"（")//英文括号转中文括号
    .replaceAll(/\)/g,"）")//英文括号转中文括号
    .replaceAll(/^\[骰子\]:(.*)[:：].*[Dd](\d*)\s*=\s*(\d*)\/(\d*).*$/gm,"# $&\n<dice>:($1,$2,$4,$3)")//骰子行转换
    .replaceAll(/^\[骰子\]:(.*)[:：] .*\(\d+[Dd](\d+)\s*=\s*\d+\s*\)=\d+=(\d+).*$/gm,"# $&\n<dice>:($1,$2,NA,$3)")
    .replaceAll(/^.+:button756.+$/mg,"# $&")//注释掉掷骰指令行
    .replaceAll(/^\[.*\]:\..*$/mg,"# $&")//注释掉掷骰指令行
    .replaceAll(/^\[.*\]:<img src=.*>$/mg,"# $&");//注释掉图片行
}

//菠萝文字团平台txt格式
export function convertLogFromBoLuoTxt(text:string){
    return text
    .replaceAll(/\[\d\d\d\d-\d\d-\d\d \d\d:\d\d\] <(.+)>  ((.|\n)+?)(?=\[\d\d\d\d-\d\d-\d\d \d\d:\d\d\])/gm,"[$1]:$2")
    .replaceAll(/^\[\d\d\d\d-\d\d-\d\d \d\d:\d\d\]   \* (\S+) (.+)$/gm,"[$1.行动]:$2")//标记动作
    .replaceAll(/\$ \[附件\]\(.*\)/g,"\n# $&");//注释附件
}

//菠萝文字团平台json格式
export function convertLogFromBoLuoJson(text:string){
    try {
        let lines = JSON.parse(text);
        let content = "";
        for(let line of lines){
            if(line.isAction){
                content += `${line.entities.length > 1?"# ":""}[${line.name}.行动]:${line.entities[0].text.replaceAll("#","").replaceAll("\n","#")}\n`;
            }else{
                content += `${line.entities.length > 1?"# ":""}[${line.name}]:${line.text.replaceAll("#","").replaceAll("\n","#")}\n`;
            }
            if(line.entities.length > 1){
                //不止一条则说明有骰子
                let dices:string[] = [];
                for(let entity of line.entities){
                    if(entity.type === "Expr" && (entity.node.type === "Roll" || entity.node.type === "CocRoll")){
                        let node = entity.node;
                        dices.push(`(${line.text.replaceAll(/[\{\}]/g,"")},${node.face * node.counter},${node.targetValue?node.targetValue:"NA"},${node.value})`);
                    }
                }
                content += `<dice>:${dices.join(",")}\n`;
            }
        }
        return content;
    } catch (error) {
        vscode.window.showErrorMessage("解析json时出错，请确保你用的是json文件");
    }
    return text;
}

//QQ聊天记录
export function convertLogFromQQ(text:string){

    //直接复制的格式，日期和时间在昵称后面：昵称(QQ号)
    let regexCopy = /^(\S+?)\s+(\d\d\d\d\/\d\d\/\d\d? )?\d\d?:\d\d:\d\d( #\d+)?/m;
    //消息管理器导出的格式
    let regexExport = /^(\d\d\d\d-\d\d?-\d\d?.*\d\d?:\d\d:\d\d) (.+)(\([^\(\n]+\)|<[^\(\n]+>)/m;

    let lines = text.split('\n');
    let curPC = "";
    let newText = "";
    for(let line of lines){
        line = line.trim();
        if(line === "" || /^\[图片\]$/m.test(line)){
            continue;
        }
        let r:RegExpExecArray | null;
        if((r = regexCopy.exec(line)) && r[2]){//如果分组2没匹配到说明把时间当做PC名匹配了
            //匹配到，则说明切换角色了
            curPC = r[1].replaceAll("(","（").replaceAll(")","）").replaceAll("[","【").replaceAll("]","】");
        }else if(r = regexExport.exec(line)){
            curPC = r[2].replaceAll("(","（").replaceAll(")","）").replaceAll("[","【").replaceAll("]","】");
        }else{
            //全都未匹配上，说明是内容行
            let content = line.replaceAll("(","（").replaceAll(")","）").replaceAll("#","");
            if(content.startsWith(".") || content.startsWith("。")){
                newText += `\n# [${curPC}]:${content}`;//注释指令行
            }else{
                newText += `\n[${curPC}]:${content}`;
            }
        }
    }
    return newText;
}

//已经染色的记录
//赵，溯洄
export function convertLogFromPainted(text:string){
    //^((\d\d\d\d\/\d\d\/\d\d? )?\d\d?:\d\d:\d\d)?\s*<(.+)>\s*(.+)$
    return text
    .replaceAll(/^((\d\d\d\d\/\d\d\/\d\d? )?\d\d?:\d\d:\d\d)?\s*<(.+)>\s*(.+)$/gm,"[$3]:$4")
    .replaceAll(/#/g,"");
}

//塔骰
export function convertLogFromPaintedTaDice(text:string){

    //普通对话行
    let regexDialog = /^(<\d{4}-\d{2}-\d{2} \d+:\d+:\d+\.0>\s*)?\[(.*?)\]:\s*(.*)$/m;
    //场外行
    let regexOB = /^\(\[(.+)\]:\s*(.+)\)$/m;

    let lines = text.split('\n');
    let curPC = "";
    let newText = "";
    for(let line of lines){
        line = line.trim();
        if(line === ""){
            continue;
        }
        let r:RegExpExecArray | null;
        if(r = regexDialog.exec(line)){
            //匹配到，则说明切换角色了
            curPC = r[2].replaceAll("(","（").replaceAll(")","）").replaceAll("[","【").replaceAll("]","】");
            let content = r[3].replaceAll("(","（").replaceAll(")","）");
            if(content.startsWith("#")){
                newText += `\n[${curPC}.行动]:${content.replaceAll("#","")}`;
            }else{
                newText += `\n[${curPC}]:${content.replaceAll("#","")}`;
            }
        }else if(r = regexOB.exec(line)){
            curPC = r[1].replaceAll("(","（").replaceAll(")","）").replaceAll("[","【").replaceAll("]","】");
            let content = r[2].replaceAll("(","（").replaceAll(")","）").replaceAll("#","");
            newText += `\n[${curPC}.吐槽]:（${content}）`;
        }else{
            //未匹配上，说明是内容行
            let content = line.replaceAll("(","（").replaceAll(")","）").replaceAll("#","");
            if(line.startsWith("#")){
                //如果是动作行
                newText += `\n[${curPC}.行动]:${content}`;
            }else{
                newText += `\n[${curPC}]:${content}`;
            }
        }
    }
    return newText;
}


//活字引擎 => 回声工坊
function convertEngine2Generater(text:string){
    //转换对话行
    return text.replaceAll(/^<(.+?)(（(.+)）)?>(.+)(\n【读作】(.+))?/gm,"[$1.$3]:$4{*$6}")
    .replaceAll(/^\[(.+)\.\]:/gm,"[$1]:")

    //转换背景行
    .replaceAll(/^【背景】(.+)$/gm,"<background>:$1")
    //BGM
    .replaceAll(/^【BGM】(.+)$/gm,"<set:BGM>:$1")
    .replaceAll(/^【停止BGM】(.+)?$/gm,"<set:BGM>:stop")

    
    //骰子
    .replaceAll(/^【骰子】（(.+?)）D(\d+)=(\d+)(\/(\d+))?(；（(.+?)）D(\d+)=(\d+)(\/(\d+))?)?(；（(.+?)）D(\d+)=(\d+)(\/(\d+))?)?(；（(.+?)）D(\d+)=(\d+)(\/(\d+))?)?$/gm,"<dice>:($1,$2,$5,$3),($7,$8,$11,$9),($13,$14,$17,$15),($19,$20,$23,$21)")
    .replaceAll(/,\(,,,\)/gm,"")
    .replaceAll(/\((.+?),(\d+?),,(\d+?)\)/gm,"($1,$2,NA,$3)")

    //注释
    .replaceAll(/^\/\/(.+)$/gm,"#$1")

    //其余行
    .replaceAll(/(^【.+$)/gm,"#$1");
}

//回声工坊 => 活字引擎
function convertGenerater2Engine(text:string){

    //其余行
    return text.replaceAll(/^(<set:.+)$/gm,"//$1")
    .replaceAll(/^(<hitpoint>:.+)$/gm,"//$1")

    //转换对话行
    .replaceAll(/^\[(.+?)(\.(.+))?(,.+)?\]:(.+?)(\{.+\})?$/gm,"<$1（$3）>$5")
    .replaceAll(/^<(.+?)（）>/gm,"<$1>")

    //转换背景行
    .replaceAll(/^<background>(<.+>)?:(.+)$/gm,"【背景】$2")

    //BGM
    .replaceAll(/^<set:BGM>:(.+)$/gm,"【BGM】$1")
    .replaceAll(/^<set:BGM>:stop$/gm,"【停止BGM】")

    //骰子
    .replaceAll(/^<dice>:\((.+?),(.+?),(.+?),(.+?)\)(,\((.+?),(.+?),(.+?),(.+?)\))?(,\((.+?),(.+?),(.+?),(.+?)\))?(,\((.+?),(.+?),(.+?),(.+?)\))?$/gm,"【骰子】（$1）D$2=$4/$3；（$6）D$7=$9/$8；（$11）D$12=$14/$13；（$16）D$17=$19/$18")
    .replaceAll(/；（）D=\//gm,"")
    .replaceAll("/NA","")

    //注释
    .replaceAll(/^#(.+)$/gm,"//$1");
}