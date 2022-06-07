// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as rglCount from './rglCount.js';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "trpg-replay-generator-log" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('trpg-replay-generator-log.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from TRPG Replay Generator Log!');
	});
	context.subscriptions.push(disposable);

	//统计rgl文件的数据
	context.subscriptions.push(vscode.commands.registerCommand('trpg-replay-generator-log.count',rglCount.rglCount));
}

// this method is called when your extension is deactivated
export function deactivate() {}
