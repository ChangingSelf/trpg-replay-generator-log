import * as vscode from 'vscode';
import { RegexUtils } from '../utils/RegexUtils';

export class CodeActionProvider implements vscode.CodeActionProvider<vscode.CodeAction> {
    provideCodeActions(document: vscode.TextDocument, range: vscode.Range | vscode.Selection, context: vscode.CodeActionContext, token: vscode.CancellationToken): vscode.ProviderResult<(vscode.CodeAction | vscode.Command)[]> {
        let result:(vscode.CodeAction | vscode.Command)[] = [];

        let edit = new vscode.WorkspaceEdit();

        for(let diagnostic of context.diagnostics){
            switch(diagnostic.code){
                case "polyphone":
                    let lineNum = diagnostic.range.start.line;
                    let lineContent = document.lineAt(lineNum).text;
                    let dialogLine = RegexUtils.parseDialogueLine(lineContent);
                    if(!dialogLine){
                        continue;
                    }

                    edit.replace(document.uri,document.lineAt(lineNum).range,`${lineContent}{*${dialogLine.content}}`);
                    result.push({
                        title: '在行尾添加合成指定文本的语音的标志便于修改'
                        ,diagnostics: [diagnostic]
                        ,edit:edit
                        ,kind:vscode.CodeActionKind.QuickFix
                        ,isPreferred:true
                    });
                    break;
                
            }
        }
        return result;
    }
    
}