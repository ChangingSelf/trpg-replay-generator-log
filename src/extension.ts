// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as rglCount from './rglCount';
import * as defineMedia from './defineMedia';
import * as regexReplace from './regexReplace';
import * as replayGenerator from './replayGenerator';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "trpg-replay-generator-log" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json

	//统计rgl文件的数据
	context.subscriptions.push(vscode.commands.registerCommand('trpg-replay-generator-log.count',rglCount.rglCount));
	
	//利用现有的素材文件夹生成媒体定义文件
	context.subscriptions.push(vscode.commands.registerCommand('trpg-replay-generator-log.defineMedia',defineMedia.defineMedia));

	//正则替换
	context.subscriptions.push(vscode.commands.registerCommand('trpg-replay-generator-log.replaceAngleBrackets',regexReplace.replaceAngleBrackets));
	context.subscriptions.push(vscode.commands.registerCommand('trpg-replay-generator-log.addAsteriskMarks',regexReplace.addAsteriskMarks));
	context.subscriptions.push(vscode.commands.registerCommand('trpg-replay-generator-log.addSoundEffectsInBatches',regexReplace.addSoundEffectsInBatches));
	
	//播放视频
	context.subscriptions.push(vscode.commands.registerCommand('trpg-replay-generator-log.playVideo',replayGenerator.playVideo));
	
}

// this method is called when your extension is deactivated
export function deactivate() {}
