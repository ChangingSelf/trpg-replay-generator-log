// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "trpg-replay-generator-log" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('trpg-replay-generator-log.helloWorld',function () {
		// The code you place here will be executed every time your command is executed
		
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from TRPG Replay Generator Log!');
	});

	let count = vscode.commands.registerCommand('trpg-replay-generator-log.count',()=>{
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
		let dialogLine = text.match(reg);
		let dialogLineCount = dialogLine?.length??0;
		

		reg = /^<dice>/mg;
		let diceLine = text.match(reg);
		let diceLineCount = diceLine?.length??0;


		//统计背景
		reg = /^<background>(<.*?>)?:(.*)/mg;
		let backgroundLine = text.match(reg);
		// console.log(backgroundLine);

		let bg = new Set();
		for (let i = 0; i < backgroundLine?.length??0; i++) {
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
		
		vscode.window.showInformationMessage(`角色(${pc.size})：${[...pc].join(",")}`);
		vscode.window.showInformationMessage(`背景(${bg.size})：${[...bg].join(",")}`);
		vscode.window.showInformationMessage(`对话行：${dialogLineCount}，骰子行：${diceLineCount}`);
		
	});



	context.subscriptions.push(disposable);
	context.subscriptions.push(count);
}

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
