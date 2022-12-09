import * as vscode from 'vscode';

export async function inputPC() {
    return await vscode.window.showInputBox({
        placeHolder: `请输入主角色(角色框第一个角色)名称，可含有差分名，例如"张安翔.惊恐，但不要含有不透明度的括号"`,
        prompt: `直接Enter则为全部角色`
    });
}

export async function inputAudioBox() {
    return await vscode.window.showInputBox({
        placeHolder: `请输入你要添加的整个音效框，例如"{键盘音效;30}"或者"{*}"，只输入单个音效框`,
        prompt: `直接Enter则为{*}`
    });
}
