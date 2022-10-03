import * as vscode from 'vscode';
import * as rglCount from './rglCount';

export class rglStatusBar {

  // 定义一个状态栏的属性
  private static instance : vscode.StatusBarItem;

  private constructor() {
    //当编辑器中的选择更改时触发的事件
    vscode.window.onDidChangeTextEditorSelection(rglStatusBar.updateRglStatus,this);

    //当活动编辑器发生更改时将触发的事件
    vscode.window.onDidChangeActiveTextEditor(rglStatusBar.updateRglStatus, this);

    rglStatusBar.updateRglStatus();
  }

  public static getInstance() {
    if(!this.instance) {
        this.instance = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
    }
    return this.instance;
  }


  public static updateRglStatus(){
    
    let statusBar = rglStatusBar.getInstance();
    
    //获取当前编辑器
    let editor = vscode.window.activeTextEditor;
    if(!editor) {
      statusBar.hide();
      return;
    }
    //获取当前文档
    let doc = editor.document;

    if(doc.languageId === 'rgl') {
      let result = rglCount.rglCount(false);
      if(!result) {statusBar.hide();}
      
      let totalSeconds = result?.totalSeconds ?? 0;
      let dialogLineCount = result?.dialogLineCount;
      let minute = Math.trunc(totalSeconds/60);
      let second = Math.trunc(totalSeconds%60);

      let pc = result?.pc ?? new Set();
      let bg = result?.bg ?? new Set();

      statusBar.text = `对话行行数：${dialogLineCount}，预计视频时长：${minute}分${second}秒，角色数：${pc.size}，背景数：${bg.size}`;
      statusBar.show();
    } else {
      statusBar.hide();
    }

  }
  dispose() {
		rglStatusBar.getInstance()?.dispose();
	}
} 
