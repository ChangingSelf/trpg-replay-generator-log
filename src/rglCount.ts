import * as vscode from 'vscode';
import * as outputUtils from './utils/OutputUtils';

let outputChannel = outputUtils.OutputUtils.getInstance();

//预估生成的视频的时长，单位：秒
export function estimateDuration(text:string){
	if(!text) return 0;
	const FRAME_PER_SECOND = 30;//每秒多少帧
	const DICE_ANIMATION_DUR = 5;//骰子动画时长，单位：秒
	const HP_ANIMATION_DUR = 4;//HP动画时长，单位：秒
	let speechSpeed = 220;//语速，初始值是：220，单位是 words/min。当对话行中没有指定星标音频的时候，语速将影响该小节的总时长，总时长 = 发言文本长度 / speech_speed。
	let asteriskPause = 20/FRAME_PER_SECOND;
	
	let textList = text.split("\n");
	// console.log(textList);

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
			// console.log(setterLine);
			speechSpeed = parseFloat(setterLine[1]);
			outputChannel.appendLine(`[设置][${index+1}]语速设置为${speechSpeed}word/min`);
			return;
		}
		//背景行
		setterLine = line.match(backgroundLineRegex);
		if(setterLine){
			// console.log(setterLine);
			let bgDelay = setterLine[2];
			if(!bgDelay) return;
			totalSeconds += parseFloat(bgDelay)/FRAME_PER_SECOND;
			outputChannel.appendLine(`[背景][${index+1}]背景延时：${parseFloat(bgDelay)/FRAME_PER_SECOND}秒`);
		}
		//骰子行
		setterLine = line.match(diceLineRegex);
		if(setterLine){
			totalSeconds += DICE_ANIMATION_DUR;
			outputChannel.appendLine(`[动画][${index+1}]骰子动画：${DICE_ANIMATION_DUR}秒`);
			return;
		}
		//HP动画行
		setterLine = line.match(hpLineRegex);
		if(setterLine){
			totalSeconds += HP_ANIMATION_DUR;
			outputChannel.appendLine(`[动画][${index+1}]血条动画：${HP_ANIMATION_DUR}秒`);
			return;
		}

		//对话行
		let dialogLine = line.match(dialogLineRegex);
		if(dialogLine){
			// console.log(dialogLine);
			if(dialogLine[6] && dialogLine[6][0]=="*"){
				//如果指定了时长
				let time = dialogLine[6];
				time = time.substring(1);
				totalSeconds += parseFloat(time) + asteriskPause;
				outputChannel.appendLine(`[对话][${index+1}](${(parseFloat(time) + asteriskPause).toFixed(2)}秒)|${dialogLine[0].slice(0,25)}……`)
			}else{
				//未指定时长则按照语速计算
				let dialog = dialogLine[2];
				totalSeconds += (dialog.length/speechSpeed)*60;
				outputChannel.appendLine(`[对话][${index+1}](${((dialog.length/speechSpeed)*60).toFixed(2)}秒)|${dialogLine[0].slice(0,25)}……`)
			}
			// totalSeconds += 10/FRAME_PER_SECOND;//默认气泡切换时间
		}
		
		// console.log(totalSeconds);
	});
	
	// console.log(speechSpeed);
	return totalSeconds;

}


//统计
export function rglCount(){
	outputChannel.clear();
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

	//计数
	let reg = /^\[([^,\.\(\)]*?(\(\d+\))?(\.[^,\.\(\)]*?)?)(,[^,\.\(\)]*?(\(\d+\))?(\.[^,\.\(\)]*?)?)?(,[^,\.\(\)]*?(\(\d+\))?(\.[^,\.\(\)]*?)?)?\]/mg;
	let result = text.match(reg);
	let dialogLine = result ?? [];
	let dialogLineCount = dialogLine.length;


	reg = /^<dice>/mg;
	let diceLine = text.match(reg);
	let diceLineCount = diceLine?.length??0;


	//统计背景
	reg = /^<background>(<.*?>)?:(.*)/mg;
	result = text.match(reg);
	// console.log(backgroundLine);

	let backgroundLine = result ?? [];

	let bg = new Set();
	for (let i = 0; i < backgroundLine.length; i++) {
		const background = backgroundLine[i];
		bg.add(background.split(":")[1]);
	}
	// console.log(bg);

	//统计角色
	let pc = new Set();
	for (let i = 0; i < dialogLine?.length??0; i++) {
		let element = dialogLine[i];
		element = element.replace("[","");
		element = element.replace("]","");
		let cList = element.split(',');

		// console.log(cList);
		for (let j = 0; j < cList?.length??0; j++) {
			let character = cList[j];
			// console.log("====");
			// console.log(character);
			character = character.replace(/(\(\d+\))/,"");
			character = character.replace(/(\..*)/,"");
			// console.log(character);
			pc.add(character)
		}

	}
	

	//预计时长

	let totalSeconds = estimateDuration(text);
	let minute = Math.trunc(totalSeconds/60);
	let second = Math.trunc(totalSeconds%60);
	
	vscode.window.showInformationMessage(`角色(${pc.size})：${[...pc].join(",")}`);
	vscode.window.showInformationMessage(`背景(${bg.size})：${[...bg].join(",")}`);
	vscode.window.showInformationMessage(`对话行行数：${dialogLineCount}，预计视频时长：${minute}分${second}秒`);
	
	outputChannel.appendLine(`角色(${pc.size})：${[...pc].join(",")}`);
	outputChannel.appendLine(`背景(${bg.size})：${[...bg].join(",")}`);
	outputChannel.appendLine(`对话行行数：${dialogLineCount}，预计视频时长：${minute}分${second}秒`);
	
	outputChannel.show();

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
