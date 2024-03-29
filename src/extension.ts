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
import * as DiagnosticProvider from './providers/DiagnosticProvider';
import * as path from 'path';
import * as fs from 'fs';
import { CharacterNode, CharacterNodeProvider } from './providers/CharacterNodeProvider';
import { CompletionItemProvider } from './providers/CompletionItemProvider';
import { BackgroundNode, BackgroundNodeProvider } from './providers/BackgroundNodeProvider';
import { AudioNode, AudioNodeProvider } from './providers/AudioNodeProvider';
import { OutlineNode, OutlineNodeProvider } from './providers/OutlineNodeProvider';
import { MediaFoldingRangeProvider } from './providers/FoldingRangeProvider';
import { CodeActionProvider } from './providers/CodeActionProvider';
import { correctTypos } from './correctTypos';
import { copyLog } from './copyLog';
import { convertLog } from './convertLog';
import { editAudioBox } from './editAudioBox';
import { editContent } from './editContent';

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

let diagnosticCollection: vscode.DiagnosticCollection;//诊断信息集合

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
	let statusBar = new rglStatusBar.rglStatusBar();
	statusBar.updateRglStatus();
	context.subscriptions.push(statusBar);
	
	context.subscriptions.push(vscode.commands.registerCommand('trpg-replay-generator-log.testCommand',utils.testCommand));
	
	//统计rgl文件的数据
	context.subscriptions.push(vscode.commands.registerCommand('trpg-replay-generator-log.count',rglCount.rglCount));

	//与骰子机器人聊天
	context.subscriptions.push(vscode.commands.registerCommand('trpg-replay-generator-log.chatWithDiceBot',diceBot.chatWithDiceBot));
	//文本纠错
	context.subscriptions.push(vscode.commands.registerCommand('trpg-replay-generator-log.correctTypos',correctTypos));
	
	//利用现有的素材文件夹生成媒体定义文件
	context.subscriptions.push(vscode.commands.registerCommand('trpg-replay-generator-log.defineMedia',defineMedia.defineMedia));
	//利用现有的日志文件生成角色配置文件
	context.subscriptions.push(vscode.commands.registerCommand('trpg-replay-generator-log.defineCharacter',defineCharacter.defineCharacter));

	//正则替换
	context.subscriptions.push(vscode.commands.registerCommand('trpg-replay-generator-log.replaceAngleBrackets',regexReplace.replaceAngleBrackets));
	context.subscriptions.push(vscode.commands.registerCommand('trpg-replay-generator-log.replaceDiceMaidLine',regexReplace.replaceDiceMaidLine));
	//编辑音效框
	context.subscriptions.push(vscode.commands.registerCommand('trpg-replay-generator-log.editAudioBox',editAudioBox));
	//编辑对话行文本内容
	context.subscriptions.push(vscode.commands.registerCommand('trpg-replay-generator-log.editContent', editContent));
	//插入和当前行同角色名的对话行
	context.subscriptions.push(vscode.commands.registerCommand('trpg-replay-generator-log.insertDialogueLine', () => {
		let editor = vscode.window.activeTextEditor;
		let document = editor?.document;
		if (!editor || !document) { return; }
		
		let range = document.lineAt(editor.selection.active.line).range;
		editor.edit(editorEdit => {
			let text = document?.getText(range) ?? "";
			let nameBox = /^(\[.*\]:).*$/m.exec(text)?.[1] ?? "";
			editorEdit.insert(editor!.selection.active, `\n${nameBox}`);
		});
	}));


	//转换Log格式
	context.subscriptions.push(vscode.commands.registerCommand('trpg-replay-generator-log.convertLog',convertLog));
	
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
	
	//按照不同格式复制
	context.subscriptions.push(vscode.commands.registerCommand('trpg-replay-generator-log.copyLog',copyLog));
	
	
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
	let backgroundNodeProvider = new BackgroundNodeProvider();
	let audioNodeProvider = new AudioNodeProvider();
	let outlineNodeProvider = new OutlineNodeProvider();
	//TreeView
	vscode.window.createTreeView('rglCharacter', {
		treeDataProvider: characterNodeProvider,
		showCollapseAll : true,
	});
	vscode.window.createTreeView('rglBackground', {
		treeDataProvider: backgroundNodeProvider,
		showCollapseAll : true,
	});
	vscode.window.createTreeView('rglAudio', {
		treeDataProvider: audioNodeProvider,
		showCollapseAll : true,
	});
	vscode.window.createTreeView('rglOutline', {
		treeDataProvider: outlineNodeProvider,
		showCollapseAll : true,
	});
	context.subscriptions.push(vscode.commands.registerCommand('trpg-replay-generator-log.refreshTreeView', 
	() =>{
		characterNodeProvider.refresh();
		backgroundNodeProvider.refresh();
		audioNodeProvider.refresh();
		outlineNodeProvider.refresh();
	}));
	context.subscriptions.push(vscode.commands.registerCommand('trpg-replay-generator-log.insertCharacter', (node:CharacterNode) =>{characterNodeProvider.insertCharacter(node);}));
	context.subscriptions.push(vscode.commands.registerCommand('trpg-replay-generator-log.insertCharacterWithoutBox', (node:CharacterNode) =>{characterNodeProvider.insertCharacter(node,false);}));
	context.subscriptions.push(vscode.commands.registerCommand('trpg-replay-generator-log.insertBackground', (node:BackgroundNode) =>{backgroundNodeProvider.insertBackground(node);}));
	context.subscriptions.push(vscode.commands.registerCommand('trpg-replay-generator-log.insertAudio', (node:AudioNode) =>{audioNodeProvider.insertAudio(node);}));
	context.subscriptions.push(vscode.commands.registerCommand('trpg-replay-generator-log.jumpToOutlineNode', (node:OutlineNode) =>{OutlineNodeProvider.jump(node);}));
	//添加节点
	context.subscriptions.push(vscode.commands.registerCommand('trpg-replay-generator-log.addBackgroundNode', (node:BackgroundNode) =>{backgroundNodeProvider.addNodeToMediaFile();}));
	context.subscriptions.push(vscode.commands.registerCommand('trpg-replay-generator-log.addAudioNode', (node:AudioNode) =>{audioNodeProvider.addNodeToMediaFile();}));
	//预览节点
	context.subscriptions.push(vscode.commands.registerCommand('trpg-replay-generator-log.previewBackgroundNode', (node:BackgroundNode) =>{backgroundNodeProvider.previewNode(node);}));

	

	//自动补全
	context.subscriptions.push(vscode.languages.registerCompletionItemProvider("rgl",new CompletionItemProvider,".",":","{","[",",","("));


	//折叠
	context.subscriptions.push(vscode.languages.registerFoldingRangeProvider("plaintext",new MediaFoldingRangeProvider));

	//诊断信息
	diagnosticCollection = vscode.languages.createDiagnosticCollection('rgl');
	context.subscriptions.push(diagnosticCollection);
	
	//错误修复
	context.subscriptions.push(vscode.languages.registerCodeActionsProvider("rgl",new CodeActionProvider));

	//文本编辑事件
	context.subscriptions.push(vscode.workspace.onDidChangeTextDocument((event)=>{
		outlineNodeProvider.refresh();
		DiagnosticProvider.onChange(event.document,diagnosticCollection);
	}));//注意：不能直接传入refresh函数，必须用另外的回调函数来调用
	context.subscriptions.push(vscode.window.onDidChangeTextEditorSelection((event)=>{
		outlineNodeProvider.refresh();
		let document = vscode.window.activeTextEditor?.document;
		DiagnosticProvider.onChange(document,diagnosticCollection);
	}));
	context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor((event)=>{
		outlineNodeProvider.refresh();
		let document = vscode.window.activeTextEditor?.document;
		DiagnosticProvider.onChange(document,diagnosticCollection);
	}));
}

// this method is called when your extension is deactivated
export function deactivate() {}
