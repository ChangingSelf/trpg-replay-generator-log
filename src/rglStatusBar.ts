import * as vscode from 'vscode';
import * as rglCount from './rglCount';

export class rglStatusBar {

  // 定义一个状态栏的属性
  private statusBar : vscode.StatusBarItem | undefined;

  constructor() {

    //当编辑器中的选择更改时触发的事件
    vscode.window.onDidChangeTextEditorSelection(this.updateRglStatus,this);

    //当活动编辑器发生更改时将触发的事件
    vscode.window.onDidChangeActiveTextEditor(this.updateRglStatus, this);

    this.updateRglStatus();
  }

  public updateRglStatus(){
    if(!this.statusBar) {
      this.statusBar  = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
      this.statusBar.command = "trpg-replay-generator-log.count";
    }
    //获取当前编辑器
    let editor = vscode.window.activeTextEditor;
    if(!editor) {
      this.statusBar.hide();
      return;
    }
    //获取当前文档
    let doc = editor.document;

    if(doc.languageId === 'rgl') {
      let result = rglCount.rglCount(false);
      if(!result) {this.statusBar.hide();}
      
      let totalSeconds = result?.totalSeconds ?? 0;
      let dialogLineCount = result?.dialogLineCount;
      let minute = Math.trunc(totalSeconds/60);
      let second = Math.trunc(totalSeconds%60);

      let pcDataMap = result?.pcDataMap ?? new Map();
      let backgroundSet = result?.backgroundSet ?? new Set();

      this.statusBar.text = `对话行行数：${dialogLineCount}，预计视频时长：${minute}分${second}秒，角色数：${pcDataMap.size}，背景数：${backgroundSet.size}`;
      this.statusBar.show();
    } else {
      this.statusBar.hide();
    }

  }
  dispose() {
		this.statusBar?.dispose();
	}
} 
