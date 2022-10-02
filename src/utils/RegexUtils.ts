/**
 * 正则表达式模块
 * 因为需要用到正则表达式匹配剧本文件元素的地方越来越多，所以将其抽取出来
 */

export class RegexUtils{
    static regexDialogue = /^\[([^,\.\(\)]*?(\(\d+\))?(\.[^,\.\(\)]*?)?)(,[^,\.\(\)]*?(\(\d+\))?(\.[^,\.\(\)]*?)?)?(,[^,\.\(\)]*?(\(\d+\))?(\.[^,\.\(\)]*?)?)?\](<.*?>)?:(.*?)(<.*?>)?(\{.*?\})?$/m;
    static regexPlaceobj = /'^<(background|animation|bubble)>(<[\w\=]+>)?:(.+)$'/mg;
    static regexBubble = /'(\w+)\("([^\\"]*)","([^\\"]*)",?(<(\w+)=?(\d+)?>)?\)'/mg;
    static regexSetting = /'^<set:([\w\ \.]+)>:(.+)$'/mg;
    static regexCharacor = /'([\w\ ]+)(\(\d*\))?(\.\w+)?'/mg;
    static regexModify = /'<(\w+)(=\d+)?>'/mg;
    static regexSound = /'({.+?})'/mg;
    static regexAsterisk = /'(\{([^\{\}]*?[;])?\*([\w\ \.\,，。：？！“”]*)?\})'/mg;
    static regexHitpoint = /'<hitpoint>:\((.+?),(\d+),(\d+),(\d+)\)'/mg;
    static regexDice = /'\((.+?),(\d+),([\d]+|NA),(\d+)\)'/mg;

    static regexMediaLine = /^(.+?)\s*=\s*(.+?)\((.+)\)$/m;

    static isDialogueLine(text:string):boolean{
        return RegexUtils.regexDialogue.test(text);
    }
    static parseDialogueLine(text:string):DialogueLine{
        //TODO:
        let result = RegexUtils.regexDialogue.exec(text);
        console.log(result);
        return new DialogueLine();
    }

    static parseMediaLine(line:string){
        let result = this.regexMediaLine.exec(line);
        if(result){
            return {
                mediaName:result[1],
                mediaType:result[2],
                mediaPara:result[3]
            };
        }else{
            return null;
        }
    }
}

export class DialogueLine{
    characterList:Character[] = [];
    toggleEffect:string = "";
    content:string = "";
    textEffect:string = "";
    soundEffect:SoundEffect = new SoundEffect();
}

export class Character{
    name:string = "";//角色名
    subtype:string = 'default';//差分
}

export class SoundEffect{
    sound:string = "";
    time:string = "";
}