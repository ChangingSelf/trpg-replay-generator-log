import * as vscode from 'vscode';
/**
 * 保证全局只有一个OutputChannel
 */
 export class OutputUtils{
    private static instance:OutputUtils;
    private outputChannel:vscode.OutputChannel;
    public name:string;
    private constructor(){
        this.outputChannel = vscode.window.createOutputChannel("回声工坊");
        this.name = this.outputChannel.name;
    };
    /**
     * getInstance
     */
    public static getInstance() {
        if(!this.instance) {
            this.instance = new OutputUtils();
        }
        return this.instance;
    }

    /**
     * show
     */
    public show(flag:boolean=true) {
        if(flag) {this.outputChannel.show();}
    }

    /**
     * hide
     */
    public hide(flag:boolean=true) {
        if(flag) {this.outputChannel.hide();}
    }

    /**
     * append
     */
    public append(value:string,flag:boolean=true) {
        if(flag){
            this.outputChannel.append(value);
        }
    }

    /**
     * appendLine
     */
    public appendLine(value:string,flag:boolean=true) {
        if(flag){
            this.outputChannel.appendLine(value);
        }
    }

    /**
     * clear
     */
    public clear() {
        this.outputChannel.clear();
    }
    /**
     * replace
     */
    public replace(value:string) {
        this.outputChannel.replace(value);
    }

    
};