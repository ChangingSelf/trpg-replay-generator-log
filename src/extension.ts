// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as rglCount from './rglCount';
import * as defineMedia from './defineMedia';
import * as importLocalSound from './importLocalSound';
import * as regexReplace from './regexReplace';
import * as replayGenerator from './replayGenerator';
import * as defineCharacter from './defineCharacter';
import * as hoverProvider from './providers/HoverProvider';
import * as rglStatusBar from './rglStatusBar';
import * as diceBot from './chatWithDiceBot';
import * as utils from './utils/utils';
import * as path from 'path';
import * as fs from 'fs';
import { CharacterNodeProvider } from './providers/CharacterNodeProvider';
import { CompletionItemProvider } from './providers/CompletionItemProvider';

/**
 * 从某个HTML文件读取能被Webview加载的HTML内容
 * @param {*} context 上下文
 * @param {*} templatePath 相对于插件根目录的html文件相对路径
 */
 function getWebViewContent(context:vscode.ExtensionContext, templatePath:string) {
    const resourcePath = path.join(context.extensionPath, templatePath);
    const dirPath = path.dirname(resourcePath);
    let html = fs.readFileSync(resourcePath, 'utf-8');
    // vscode不支持直接加载本地资源，需要替换成其专有路径格式，这里只是简单的将样式和JS的路径替换
    html = html.replace(/(<link.+?href="|<script.+?src="|<img.+?src=")(.+?)"/g, (m, $1, $2) => {
        return $1 + vscode.Uri.file(path.resolve(dirPath, $2)).with({ scheme: 'vscode-resource' }).toString() + '"';
    });
    return html;
}


// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	let currentPanel:vscode.WebviewPanel | undefined = undefined;
	
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	//console.log('Congratulations, your extension "trpg-replay-generator-log" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json

	//状态栏
	rglStatusBar.rglStatusBar.updateRglStatus();
	context.subscriptions.push(rglStatusBar.rglStatusBar.getInstance());
	
	context.subscriptions.push(vscode.commands.registerCommand('trpg-replay-generator-log.testCommand',utils.testCommand));
	
	//统计rgl文件的数据
	context.subscriptions.push(vscode.commands.registerCommand('trpg-replay-generator-log.count',rglCount.rglCount));
	
	//与骰子机器人聊天
	context.subscriptions.push(vscode.commands.registerCommand('trpg-replay-generator-log.chatWithDiceBot',diceBot.chatWithDiceBot));
	
	//利用现有的素材文件夹生成媒体定义文件
	context.subscriptions.push(vscode.commands.registerCommand('trpg-replay-generator-log.defineMedia',defineMedia.defineMedia));
	//利用现有的日志文件生成角色配置文件
	context.subscriptions.push(vscode.commands.registerCommand('trpg-replay-generator-log.defineCharacter',defineCharacter.defineCharacter));

	//正则替换
	context.subscriptions.push(vscode.commands.registerCommand('trpg-replay-generator-log.replaceAngleBrackets',regexReplace.replaceAngleBrackets));
	context.subscriptions.push(vscode.commands.registerCommand('trpg-replay-generator-log.addAsteriskMarks',regexReplace.addAsteriskMarks));
	context.subscriptions.push(vscode.commands.registerCommand('trpg-replay-generator-log.addSoundEffectsInBatches',regexReplace.addSoundEffectsInBatches));
	context.subscriptions.push(vscode.commands.registerCommand('trpg-replay-generator-log.replaceDiceMaidLine',regexReplace.replaceDiceMaidLine));
	context.subscriptions.push(vscode.commands.registerCommand('trpg-replay-generator-log.migrateLog',regexReplace.migrateLog));
	
	//语音时间批量增减
	context.subscriptions.push(vscode.commands.registerCommand('trpg-replay-generator-log.adjustSoundEffectsTimeInBatches',regexReplace.adjustSoundEffectsTimeInBatches));
	
	//播放视频
	context.subscriptions.push(vscode.commands.registerCommand('trpg-replay-generator-log.playVideo',replayGenerator.playVideo));
	//导出视频
	context.subscriptions.push(vscode.commands.registerCommand('trpg-replay-generator-log.exportVideo',replayGenerator.exportVideo));
	//合成语音
	context.subscriptions.push(vscode.commands.registerCommand('trpg-replay-generator-log.synthesizedSpeech',replayGenerator.synthesizedSpeech));
	//导出XML
	context.subscriptions.push(vscode.commands.registerCommand('trpg-replay-generator-log.exportXML',replayGenerator.exportXML));
	
	//检查对话行长度
	context.subscriptions.push(vscode.commands.registerCommand('trpg-replay-generator-log.checkDialogLineLength',rglCount.checkDialogLineLength));
	
	//导入本地语音
	context.subscriptions.push(vscode.commands.registerCommand('trpg-replay-generator-log.importLocalSound',importLocalSound.importLocalSound));
	
	//快速打开readme
	context.subscriptions.push(vscode.commands.registerCommand('trpg-replay-generator-log.openDocument',()=>{
		let settings =  utils.loadSettings();
		vscode.workspace.openTextDocument(path.join(path.dirname(settings.rplGenCorePath),"README.md"))
		.then(doc => {
			// 在VSCode编辑窗口展示读取到的文本
			vscode.window.showTextDocument(doc);
		}, err => {
			vscode.window.showErrorMessage(`Open error, ${err}.`);
		}).then(undefined, err => {
			vscode.window.showErrorMessage(`Open error, ${err}.`);
		});
	}));
	

	//悬停提示
	context.subscriptions.push(vscode.languages.registerHoverProvider('rgl',new hoverProvider.HoverProvider()));

	//webview
	context.subscriptions.push(vscode.commands.registerCommand('trpg-replay-generator-log.openMediaView', function (uri) {
		// 创建webview
		if (currentPanel) {
			currentPanel.reveal(vscode.ViewColumn.One);
		} else {
			currentPanel = vscode.window.createWebviewPanel(
				'MediaView', // viewType
				"媒体定义视图", // 视图标题
				vscode.ViewColumn.One, // 显示在编辑器的哪个部位
				{
					enableScripts: true, // 启用JS，默认禁用
					retainContextWhenHidden: true, // webview被隐藏时保持状态，避免被重置
				}
			);
			currentPanel.webview.html = getWebViewContent(context,"web/mediaEditor.html");
			currentPanel.onDidDispose(
				() => {
				  currentPanel = undefined;
				},
				undefined,
				context.subscriptions
			  );
		}
		//将当前文件内容传给WebView
		let text = vscode.window.activeTextEditor?.document.getText() ?? "";
		let mediaListObj = defineMedia.mediaDef2Obj(text);
		//console.log(mediaListObj);
		currentPanel.webview.postMessage({
			data: mediaListObj,
			filePath:vscode.window.activeTextEditor?.document.uri.fsPath ?? ""
		});

	}));	
	
	let characterNodeProvider = new CharacterNodeProvider();
	//TreeView
	vscode.window.createTreeView('rglCharacter', {
		treeDataProvider: characterNodeProvider,
		showCollapseAll : true,
	  });
	context.subscriptions.push(vscode.commands.registerCommand('trpg-replay-generator-log.refreshTreeView', () =>characterNodeProvider.refresh()));

	//自动补全
	vscode.languages.registerCompletionItemProvider("rgl",new CompletionItemProvider,".");
}

// this method is called when your extension is deactivated
export function deactivate() {}
