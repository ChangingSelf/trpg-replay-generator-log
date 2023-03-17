import * as vscode from 'vscode';
import { estimateDuration } from '../rglCount';
import { RegexUtils } from '../utils/RegexUtils';
import { loadMedia, loadSettings } from '../utils/utils';


let dialogLineRegex = /^\[(([^,\.\(\)]*?)(\((\d+)\))?(\.([^,\.\(\)]*?))?)(,([^,\.\(\)]*?)(\((\d+)\))?(\.([^,\.\(\)]*?))?)?(,([^,\.\(\)]*?)(\((\d+)\))?(\.([^,\.\(\)]*?))?)?\](<.*?>)?:(.*?)(<.*?>)?(\{.*?(;(.*?))?\})?$/m;

let configLineRegex = /^<set:(.*?)>:((<(.*?)(=(\d+))?>)|(.*?))$/m;

let backgroundLineRegex = /^<background>((<(.*?)(=(\d+))?>):(.*?))$/m;

let hpLineRegex = /^<hitpoint>:\((.*?),(.*?),(.*?),(.*?)\)$/m;
let diceLineRegex = /^<dice>:(\((.*?),(.*?),(.*?),(.*?)\),?){1,4}$/mg;
let commentLineRegex = /(^#.*?$)/m;

let wordRegex = /(^\[.*?\].*?$)|(^<.*?$)]/mg;

const configNameDict = {
	"am_method_default":"立绘的默认切换方法"
	,"am_dur_default":"立绘的默认切换时间"

	,"bb_method_default":"气泡的默认切换方法"
	,"bb_dur_default":"气泡的默认切换时间"
	
	,"bg_method_default":"背景的默认展示方法"
	,"bg_dur_default":"背景的默认展示时间"
	
	,"tx_method_default":"文本的默认展示方法"
	,"tx_dur_default":"文本的默认展示时间"
	
	,"speech_speed":"语速"
	,"asterisk_pause":"星标音频的间隔时间"
	,"secondary_alpha":"次要立绘的透明度"
	,"BGM":"背景音乐"
	,"formula":"切换效果的曲线函数"

};

const methodDict = {
	alpha:{
		replace:"瞬间出现"
		,delay:"延后出现"
		,black:"淡入淡出"
	}
	,animation:{
		static:"静止"
		,leap:"跳起"
		,pass:"通过"
		,circular:"圆周运动"
	}
	,angle:{
		up:"上"
		,down:"下"
		,left:"左"
		,right:"右"
	}
	,distance:{
		major:"长距离"
		,minor:"短距离"
		,entire:"全屏"
	}
	,obj:{
		both:"双端"
		,in:"仅切入"
		,out:"仅切出"
	}
	//背景切换方式
	,background:{
		cross:"交叉溶解"
		,black:"黑场"
		,white:"白场"
		,replace:"瞬间替换"
		,delay:"延后替换"
		,push:"推入"
		,cover:"覆盖"
	}
	//文本切换方式
	,text:{
		all:"一次性展示所有文本"
		,w2w:"逐字展示文本"
		,l2l:"逐行展示文本"
	}
	//函数
	,formula:{
		linear:"线性"
		,quadratic:"二次"
		,quadraticR:"二次反向"
		,sigmoid:"S型"
		,sincurve:"正弦"
		,left:"左锋"
		,right:"右峰"
	}
};


export class HoverProvider implements vscode.HoverProvider{
	provideHover(document: vscode.TextDocument, position: vscode.Position) {
		let settings = loadSettings();
		if(!settings.enableHover) {return null;}
		
		let line = document.lineAt(position.line).text;

		let mdStr = new vscode.MarkdownString();
		
		//根据行的类型显示相应的悬停提示
		if(settings.enableDialogLineHover && dialogLineRegex.test(line)){
			//console.log(line.match(dialogLineRegex));
			let dialogLine = line.match(dialogLineRegex) as RegExpMatchArray;
			let pcList = [
				{"name":dialogLine[2],"alpha":dialogLine[4],"subtype":dialogLine[6]}
				,{"name":dialogLine[8],"alpha":dialogLine[10],"subtype":dialogLine[12]}
				,{"name":dialogLine[14],"alpha":dialogLine[16],"subtype":dialogLine[18]}
			];
			let switchEffect = dialogLine[19];
			let content = dialogLine[20];
			let textEffect = dialogLine[21];
			let soundEffect = dialogLine[22];

			let pcCount = 0;
			let pcStr = "";
			pcList.forEach((pc,i)=>{
				if(pc.name) {
					pcCount++;
					if(i!==0) {pcStr += ",";}
					pcStr += pc.name;
				}
			});
			
			

			
			let isManualNewLine = /#/m.test(content);//是否手动换行
			let processedLines:string[] = [];
			if(isManualNewLine){
				//手动换行
				let lines = content.split("#");
				lines.forEach(line=>{
					processedLines.push(`[${line.length}]\t\t${line.replace("^","")}`);
				});
			}else{
				//自动换行
				let lineLenMax = settings.lineLength;
				let len = content.length;
				while(content.length > lineLenMax){
					let line = content.substring(0,lineLenMax);
					processedLines.push(`[${line.length}]\t\t${line}`);
					content = content.substring(lineLenMax,len);
				}
				processedLines.push(`[${content.length}]\t\t${content}`);
			}
			

			
			mdStr.appendMarkdown(
				`「${pcStr}」${isManualNewLine?"(手动换行模式)":""}\n\n${processedLines.join("\n\n")}`
			);
		}else if(settings.enableConfigLineHover && configLineRegex.test(line)){
			let configLine = line.match(configLineRegex) as RegExpMatchArray;
			//console.log(configLine);
			let configName = configLine[1];
			let configValue = configLine[2];
			let configMethod = configLine[4];
			let configTime = configLine[6];
			switch (configName) {
				case "am_dur_default":case "bb_dur_default":case "bg_dur_default":case "tx_dur_default":case "asterisk_pause":
					mdStr.appendMarkdown(`将【${configNameDict[configName]}】设置为【${configValue}】帧`);
					break;
				case "am_method_default":case "bb_method_default":
					let animationMethods = configMethod.split("_");
					let alpha = methodDict.alpha.replace;
					let animation = methodDict.animation.static;
					let angle = methodDict.angle.up;
					let distance = methodDict.distance.major;
					let obj = methodDict.obj.both;
					animationMethods.forEach(x=>{
						if(Object.keys(methodDict.alpha).includes(x)){ alpha = methodDict.alpha[x as keyof typeof methodDict.alpha]; }
						else if(Object.keys(methodDict.animation).includes(x)){ animation = methodDict.animation[x as keyof typeof methodDict.animation]; }
						else if(Object.keys(methodDict.angle).includes(x)){ angle = methodDict.angle[x as keyof typeof methodDict.angle]; }
						else if(Object.keys(methodDict.distance).includes(x)){ distance = methodDict.distance[x as keyof typeof methodDict.distance]; }
						else if(Object.keys(methodDict.obj).includes(x)){ obj = methodDict.obj[x as keyof typeof methodDict.obj]; }
						else{
							angle = x.match(/^DG(\d+)$/m)?.at(1) ?? angle;
							distance = x.match(/^(\d+)$/m)?.at(1) ?? distance;
						}
					});
					mdStr.appendMarkdown(`将 【${configNameDict[configName]}】 设置为${configTime?"(时间为【"+configTime+"】帧）":""}：\n\n【透明度变化】${alpha}\n\n【切换动态】${animation}\n\n【切入角度】${angle}\n\n【运动尺度】${distance}\n\n【应用对象】${obj}`);

					break;
				case "bg_method_default":
					mdStr.appendMarkdown(`将【${configNameDict[configName]}】设置为【${methodDict.background[configMethod as keyof typeof methodDict.background]}】${configTime?"(时间为【"+configTime+"】帧）":""}`);
					break;
				case "tx_method_default":
					mdStr.appendMarkdown(`将【${configNameDict[configName]}】设置为【${methodDict.text[configMethod as keyof typeof methodDict.text]}】${configTime?"(时间为【"+configTime+"】帧）":""}`);
					break;
				case "speech_speed":
					mdStr.appendMarkdown(`将【${configNameDict[configName]}】设置为【${configValue}】 words / min`);
					break;
				case "secondary_alpha":
					mdStr.appendMarkdown(`将【${configNameDict[configName]}】设置为【${configValue}】%`);
					break;
				case "BGM":
					mdStr.appendMarkdown(`将【${configNameDict[configName]}】设置为【${configValue}】`);
					break;
				case "formula":
					if(/lambda/.test(configValue)){
						mdStr.appendMarkdown(`将【${configNameDict[configName]}】设置为【lambda函数】，既然会写这个函数，那么它的含义应该不必我解析了吧【doge】`);
					}else{
						mdStr.appendMarkdown(`将【${configNameDict[configName]}】设置为【${methodDict.formula[configValue as keyof typeof methodDict.formula]}】`);
					}
					break;
				default:
					break;
			}
			
		}else if(settings.enableBackgroundLineHover && backgroundLineRegex.test(line)){
			let backgroundLine = line.match(backgroundLineRegex) as RegExpMatchArray;
			// //console.log(backgroundLine);
			let method = backgroundLine[3];
			let time = backgroundLine[5];
			let background = backgroundLine[6];

			let mediaObjDefine = settings.mediaObjDefine;
			let media = loadMedia(mediaObjDefine);
			let medium = media.find(x => x.mediaName === background);
			let backgroundPath = RegexUtils.getFilePathInPara(medium?.mediaPara ?? "") ?? "";

			mdStr.appendMarkdown(`以【${methodDict.background[method as keyof typeof methodDict.background]}】的方式将背景替换为【${background}】${time?"，替换时间为【"+time+"】帧":""}\n\n![](file:///${backgroundPath}|width=500)`);
		}else if(settings.enableAnimationLineHover && hpLineRegex.test(line)){
			let hpLine = line.match(hpLineRegex) as RegExpMatchArray;
			//console.log(hpLine);
			let desc = hpLine[1];
			let hpMax = hpLine[2];
			let before = hpLine[3];
			let after = hpLine[4];
			mdStr.appendMarkdown(`${desc}\n\n${before} / ${hpMax} ${"◼".repeat(parseInt(before))}${"◻".repeat(parseInt(hpMax) - parseInt(before))}\n\n↓\n\n ${after} / ${hpMax} ${"◼".repeat(parseInt(after))}${"◻".repeat(parseInt(hpMax) - parseInt(after))}`);
		}else if(settings.enableAnimationLineHover && diceLineRegex.test(line)){
			let diceLine = (line.match(diceLineRegex) as RegExpMatchArray)[0];
			
			let diceList = diceLine.split(":")[1].slice(1,-1).split("),(");
			//console.log(diceList);
			diceList.forEach((x,i)=>{
				let dice = x.split(",");
				//console.log(dice);
				let desc = dice[0];
				let faceNum = dice[1];
				let checkValue = dice[2];
				let randomValue = dice[3];
				if(i!==0){
					mdStr.appendText("\n");
				}
				mdStr.appendText(`【1d${faceNum}=${randomValue}${checkValue!=="NA"?"/"+checkValue:""}】${desc}`);
				
			});
		}

		//添加时间预估
		let text = document.getText(new vscode.Range(new vscode.Position(0, 0), new vscode.Position(position.line, Number.MAX_VALUE)));
		let totalSeconds = estimateDuration(text, false);
		let minute = Math.trunc(totalSeconds/60);
		let second = Math.trunc(totalSeconds % 60);
		let totalSeconds2 = estimateDuration(document.getText(), false);
		let minute2 = Math.trunc(totalSeconds2/60);
		let second2 = Math.trunc(totalSeconds2 % 60);
		mdStr.appendText(`\n[进度条]${minute}:${second}/${minute2}:${second2}(${(totalSeconds/totalSeconds2*100).toFixed(2)}%)\n`);

		return new vscode.Hover(mdStr);
	}
}

