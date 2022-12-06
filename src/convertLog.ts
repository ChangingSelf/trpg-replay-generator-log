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
        detail: '支持直接从聊天窗口复制、消息管理器导出的记录甚至两者混合'
    }]).then(value => {
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
    .replace(/(.*?) \d\d\d\d\/\d\d\/\d\d \d\d:\d\d:\d\d[\n\r]+    (.*)/gm,"[$1]:$2")//注意回车换行符（\r\n）
    // .replace(new RegExp("(.*?) \\d\\d\\d\\d\\/\\d\\d\\/\\d\\d \\d\\d:\\d\\d:\\d\\d[\\n\\r]+    (.+)","gm"),"[$1]:$2")//注意回车换行符（\r\n）
    .replace(/#/g,"")
    .replace(/<br>/g,"")//因为猫爷TRPG的Log常常在奇怪的地方加<br>，所以直接去掉
    .replace(/\(/g,"（")//英文括号转中文括号
    .replace(/\)/g,"）")//英文括号转中文括号
    .replace(/^\[骰子\]:(.*)[:：].*[Dd](\d*)\s*=\s*(\d*)\/(\d*).*$/gm,"# $&\n<dice>:($1,$2,$4,$3)")//骰子行转换
    .replace(/^\[骰子\]:(.*)[:：] .*\(\d+[Dd](\d+)\s*=\s*\d+\s*\)=\d+=(\d+).*$/gm,"# $&\n<dice>:($1,$2,NA,$3)")
    .replace(/^.+:button756.+$/mg,"# $&")//注释掉掷骰指令行
    .replace(/^\[.*\]:\..*$/mg,"# $&")//注释掉掷骰指令行
    .replace(/^\[.*\]:<img src=.*>$/mg,"# $&");//注释掉图片行
}

//菠萝文字团平台txt格式
export function convertLogFromBoLuoTxt(text:string){
    return text
    .replace(/\[\d\d\d\d-\d\d-\d\d \d\d:\d\d\] <(.+)>  ((.|\n)+?)(?=\[\d\d\d\d-\d\d-\d\d \d\d:\d\d\])/gm,"[$1]:$2")
    .replace(/^\[\d\d\d\d-\d\d-\d\d \d\d:\d\d\]   \* (\S+) (.+)$/gm,"[$1.me]:$2")//标记动作
    .replace(/\$ \[附件\]\(.*\)/g,"\n# $&");//注释附件
}

//菠萝文字团平台json格式
export function convertLogFromBoLuoJson(text:string){
    try {
        let lines = JSON.parse(text);
        let content = "";
        for(let line of lines){
            if(line.isAction){
                content += `${line.entities.length > 1?"# ":""}[${line.name}.me]:${line.entities[0].text.replace("#","").replace("\n","#")}\n`;
            }else{
                content += `${line.entities.length > 1?"# ":""}[${line.name}]:${line.text.replace("#","").replace("\n","#")}\n`;
            }
            if(line.entities.length > 1){
                //不止一条则说明有骰子
                let dices:string[] = [];
                for(let entity of line.entities){
                    if(entity.type === "Expr" && (entity.node.type === "Roll" || entity.node.type === "CocRoll")){
                        let node = entity.node;
                        dices.push(`(${line.text.replace(/[\{\}]/g,"")},${node.face * node.counter},${node.targetValue?node.targetValue:"NA"},${node.value})`);
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
    let regexExport = /^(\d\d\d\d-\d\d-\d\d? \d\d?:\d\d:\d\d) (.+)(\([^\(\n]+\)|<[^\(\n]+>)/m;

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
            curPC = r[1].replace("(","（").replace(")","）").replace("[","【").replace("]","】");
        }else if(r = regexExport.exec(line)){
            curPC = r[2].replace("(","（").replace(")","）").replace("[","【").replace("]","】");
        }else{
            //全都未匹配上，说明是内容行
            let content = line.replace("(","（").replace(")","）").replace("#","");
            if(content.startsWith(".") || content.startsWith("。")){
                newText += `\n# [${curPC}]:${content}`;//注释指令行
            }else{
                newText += `\n[${curPC}]:${content}`;
            }
        }
    }
    return newText;
}