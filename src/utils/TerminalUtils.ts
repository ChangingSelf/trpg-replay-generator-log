import * as vscode from 'vscode';
/**
 * 保证全局只有一个Terminal
 */
 export class TerminalUtils{
    private static instance:TerminalUtils;
    private terminal:vscode.Terminal;
    public name:string;
    private constructor(){
        this.terminal = vscode.window.createTerminal("回声工坊");
        this.name = this.terminal.name;
    };
    /**
     * getInstance
     */
    public static getInstance() {
        if(!this.instance) {
            this.instance = new TerminalUtils();
        }
        return this.instance;
    }

    /**
     * sendText
     */
    public sendText(value:string,addNewLine?: boolean | undefined) {
        this.terminal.sendText(value,addNewLine);
    }

    /**
     * show
     */
    public show() {
        this.terminal.show();
    }
    dispose() {
		this.terminal?.dispose();
	}

}