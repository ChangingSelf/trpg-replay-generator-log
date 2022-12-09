import { DialogueLine, SoundEffectBox } from './entities';
import { RegexUtils } from './RegexUtils';


/**
 * 对每个对话行执行操作
 * @param input 需要解析的文本
 * @param callback 处理解析到的对话行的函数
 * @returns 使用callback函数处理之后的文本
 */
export function forEachDialogueLine(input: string, callback: (dialogueLine: DialogueLine) => string) {
    let lines = input.split("\n");
    let output = "";
    let lineNum = 0;
    for (let line of lines) {
        if (lineNum !== 0) {
            output += '\n';
        }
        let dialogueLine = RegexUtils.parseDialogueLine(line);
        if (dialogueLine) {
            output += callback(dialogueLine);
        } else {
            output += line;
        }
        ++lineNum;
    }
    return output;
}

/**
 * 对每个特定角色的对话行执行操作
 * @param input 需要解析的文本
 * @param pcStr 带有差分的角色名字符串
 * @param callback 处理解析到的对话行的函数，参数dialogueLine为匹配到的对话行对象
 * @returns 使用callback函数处理之后的文本
 */
export function forEachCharacter(input: string, pcStr: string | undefined, callback: (dialogueLine: DialogueLine, soundEffectBox?: SoundEffectBox) => void, soundEffectBox?: SoundEffectBox) {
    if (pcStr === undefined) {
        return input;
    }
    return forEachDialogueLine(input, l => {
        if (pcStr !== "") {
            //目标为特定角色
            let pcData = pcStr!.split('.');
            let name = pcData[0];
            let subtype = pcData[1];
            if (!subtype) {
                //无差分的情况只匹配名字
                if (l.characterList[0].name === name) {
                    callback(l, soundEffectBox);
                    return l.toString();
                } else {
                    return l.toString();
                }
            } else {
                //无差分的情况匹配名字和差分
                if (l.characterList[0].name === name && l.characterList[0].subtype === subtype) {
                    callback(l, soundEffectBox);
                    return l.toString();
                } else {
                    return l.toString();
                }
            }
        } else {
            //目标为所有角色
            callback(l, soundEffectBox);
            return l.toString();
        }
    });
}