import * as vscode from 'vscode';
import { Character } from './entities';
import * as outputUtils from './utils/OutputUtils';
import { RegexUtils } from './utils/RegexUtils';

let outputChannel = outputUtils.OutputUtils.getInstance();

//预估生成的视频的时长，单位：秒
export function estimateDuration(text:string,flag:boolean=true){
	if(!text) return 0;
	const FRAME_PER_SECOND = 30;//每秒多少帧
	const DICE_ANIMATION_DUR = 5;//骰子动画时长，单位：秒
	const HP_ANIMATION_DUR = 4;//HP动画时长，单位：秒
	let speechSpeed = 220;//语速，初始值是：220，单位是 words/min。当对话行中没有指定星标音频的时候，语速将影响该小节的总时长，总时长 = 发言文本长度 / speech_speed。
	let asteriskPause = 20/FRAME_PER_SECOND;
	
	let textList = text.split("\n");
	// //console.log(textList);

	let totalSeconds = 0;
	let speechSpeedSetterLineRegex = /^<set:speech_speed>:(.*?)$/m;
	let backgroundLineRegex = /^<background>(<.*?=(.*?)>)?:(.*)$/m;
	let diceLineRegex = /^<dice>:(.*?)$/m;
	let hpLineRegex = /^<hitpoint>:(.*?)$/m;
	let dialogLineRegex = /^\[.*?\](<.*?>)?:(.*?)(<.*?>)?(\{.*?(;(.*?))?\})?$/m;
	textList?.forEach((line,index) => {
		//语速设置行
		let setterLine = line.match(speechSpeedSetterLineRegex);
		if(setterLine){
			// //console.log(setterLine);
			speechSpeed = parseFloat(setterLine[1]);
			outputChannel.appendLine(`[设置][${index+1}]语速设置为${speechSpeed}word/min`,flag);
			return;
		}
		//背景行
		setterLine = line.match(backgroundLineRegex);
		if(setterLine){
			// //console.log(setterLine);
			let bgDelay = setterLine[2];
			if(!bgDelay) return;
			totalSeconds += parseFloat(bgDelay)/FRAME_PER_SECOND;
			outputChannel.appendLine(`[背景][${index+1}]背景延时：${parseFloat(bgDelay)/FRAME_PER_SECOND}秒`,flag);
		}
		//骰子行
		setterLine = line.match(diceLineRegex);
		if(setterLine){
			totalSeconds += DICE_ANIMATION_DUR;
			outputChannel.appendLine(`[动画][${index+1}]骰子动画：${DICE_ANIMATION_DUR}秒`,flag);
			return;
		}
		//HP动画行
		setterLine = line.match(hpLineRegex);
		if(setterLine){
			totalSeconds += HP_ANIMATION_DUR;
			outputChannel.appendLine(`[动画][${index+1}]血条动画：${HP_ANIMATION_DUR}秒`,flag);
			return;
		}

		//对话行
		let dialogLine = line.match(dialogLineRegex);
		if(dialogLine){
			// //console.log(dialogLine);
			if(dialogLine[6] && dialogLine[6][0]=="*"){
				//如果指定了时长
				let time = dialogLine[6];
				time = time.substring(1);
				totalSeconds += parseFloat(time) + asteriskPause;
				outputChannel.appendLine(`[对话][${index+1}](${(parseFloat(time) + asteriskPause).toFixed(2)}秒)|${dialogLine[0].slice(0,25)}……`,flag);
			}else{
				//未指定时长则按照语速计算
				let dialog = dialogLine[2];
				totalSeconds += (dialog.length/speechSpeed)*60;
				outputChannel.appendLine(`[对话][${index+1}](${((dialog.length/speechSpeed)*60).toFixed(2)}秒)|${dialogLine[0].slice(0,25)}……`,flag);
			}
			// totalSeconds += 10/FRAME_PER_SECOND;//默认气泡切换时间
		}
		
		// //console.log(totalSeconds);
	});
	
	// //console.log(speechSpeed);
	return totalSeconds;

}

//统计函数
export function rglCount(flag:boolean=true){
	if(flag) {outputChannel.clear();}

	//获取文本
	let editor = vscode.window.activeTextEditor;
	if(!editor) {
		vscode.window.showInformationMessage('请选中某个文件');
		return;
	}
	if(editor.document.languageId !== 'rgl'){
		vscode.window.showInformationMessage('请选中某个rgl文件');
		return;
	}
	let text = editor.document.getText();
	let selectionText = editor.document.getText(editor.selection);
	if(selectionText) {text = selectionText;}
	

	//统计项
	let dialogLineCount = 0;//对话行行数
	let backgroundLineCount = 0;//背景行行数
	let diceLineCount = 0;//骰子行行数
	let hpLineCount = 0;//血条行行数
	let setterLineCount = 0;//设置行行数



	let pcDataMap:Map<string,{
		roleplayLen:number//总RP长度
		,count:number//出现次数
		,dialogLen:number//RP中的对话（双引号内文本）长度
	}> = new Map();//角色数据

	let asteriskMarkCount = 0;//待处理星标数目，用于和对话行比较来确定是否仍然存在待处理星标

	let backgroundSet = new Set();

	//开始统计
	let lines = text.split('\n');
	for(let line of lines){
		//对话行
		let dialogLine = RegexUtils.parseDialogueLine(line);
		if(dialogLine){
			++dialogLineCount;

			//统计角色数据
			let mainPC = dialogLine.characterList[0];
			let data = pcDataMap.get(mainPC.name) ?? {
				roleplayLen:0
				,count:0
				,dialogLen:0
			};

			pcDataMap.set(mainPC.name,{
				roleplayLen:data.roleplayLen + dialogLine.content.length
				,count:data.count + 1
				,dialogLen:data.dialogLen + (dialogLine.content.match(/“(.+?)”/g)?.join("").length ?? 0)
			});

			//统计待处理星标数目
			asteriskMarkCount += /\{\*\}/.test(dialogLine.soundEffect) ? 1 : 0;

			continue;
		}

		//背景行
		let backgroundLine = RegexUtils.parseBackgroundLine(line);
		if(backgroundLine){
			++backgroundLineCount;
			backgroundSet.add(backgroundLine.background);
			continue;
		}

		//设置行
		let setterLine = RegexUtils.parseSetterLine(line);
		if(setterLine){
			++setterLineCount;
			continue;
		}

		//骰子行
		let diceLine = RegexUtils.parseDiceLine(line);
		if(diceLine){
			++diceLineCount;
			continue;
		}

		
	}

	//衍生统计项
	let totalContentLen = 0;//内容总长度
	for(let item of pcDataMap.entries()){
		totalContentLen += item[1].roleplayLen;
	}

	//预估时长
	let totalSeconds = estimateDuration(text,flag);
	let minute = Math.trunc(totalSeconds/60);
	let second = Math.trunc(totalSeconds%60);
	
	if(flag){
		outputChannel.appendLine(`===`);
		outputChannel.appendLine(`各角色统计数据（一行多角色时只计算主角色）：`);
		outputChannel.appendLine(`角色名(出现次数)：文本总字数`);
		for(let item of pcDataMap.entries()){
			outputChannel.appendLine(`${item[0]}(${item[1].count})：${item[1].roleplayLen}`);
		}
		outputChannel.appendLine(`总共出现${pcDataMap.size}个角色，纯发言文本字数为${totalContentLen}`);

		outputChannel.appendLine(`===`);

		outputChannel.appendLine(`背景(${backgroundSet.size})：${[...backgroundSet].join(",")}`);
		outputChannel.appendLine(`对话行行数：${dialogLineCount}`);
		outputChannel.appendLine(`背景行行数：${backgroundLineCount}`);
		outputChannel.appendLine(`设置行行数：${setterLineCount}`);
		outputChannel.appendLine(`骰子行行数：${diceLineCount}`);
		outputChannel.appendLine(`预计视频时长：${minute}分${second}秒`);
		outputChannel.show();
	
	}
	
	

	return {
		dialogLineCount:dialogLineCount,
		backgroundLineCount:backgroundLineCount,
		setterLineCount:setterLineCount,
		diceLineCount:diceLineCount,
		totalSeconds:totalSeconds,
		pcDataMap:pcDataMap,
		backgroundSet:backgroundSet
	};
}

//检验每行字数是否超出指定值
export function checkDialogLineLength(){
	vscode.window.showInputBox({
		placeHolder:"请输入一个整数，代表每个对话行字数上限",
		prompt:"检查对话行的字数是否超出指定的字数"
	}).then(inputText=>{
		outputChannel.clear();
		let threshold = inputText ? parseInt(inputText):0;

		let editor = vscode.window.activeTextEditor;
		if(!editor) {
			vscode.window.showInformationMessage('请选中某个文件');
			return;
		}
		if(editor.document.languageId != 'rgl'){
			vscode.window.showInformationMessage('请选中某个rgl文件');
			return;
		}
		let text = editor.document.getText();
		let textList = text.split("\n");
		
		let reg = /^\[.*?\](<.*?>)?:(.*?)(<.*?>)?(\{.*?\})?$/m;
		outputChannel.appendLine(`字数超过${threshold}的行如下（方括号内为行号，圆括号内为那一行的字数）：`)
		let i = 0;
		textList?.forEach((line,index) => {
			let result = line.match(reg);
			let dialogLine:RegExpMatchArray = result ?? [];
			let dialog = dialogLine[2] ?? "";
			if(dialog.length > threshold){
				outputChannel.appendLine(`[${index+1}](${dialog.length})${dialog.slice(0,25)}……`);
				i++;
			}
		});
		outputChannel.appendLine(`总共${i}行超出字数限制`);
		outputChannel.show();
	});
}

