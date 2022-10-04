/**
 * 正则表达式模块
 * 因为需要用到正则表达式匹配剧本文件元素的地方越来越多，所以将其抽取出来
 */

export class RegexUtils{
    static regexDialogue = /^\[(([^,\.\(\)]*?)(\((\d+)\))?(\.([^,\.\(\)]*?))?)(,(([^,\.\(\)]*?)(\((\d+)\))?(\.([^,\.\(\)]*?))?))?(,(([^,\.\(\)]*?)(\((\d+)\))?(\.([^,\.\(\)]*?))?))?\](<.*?>)?:(.*?)(<.*?>)?(\{.*?\})?$/m;
    static regexPlaceobj = /'^<(background|animation|bubble)>(<[\w\=]+>)?:(.+)$'/mg;
    static regexBubble = /'(\w+)\("([^\\"]*)","([^\\"]*)",?(<(\w+)=?(\d+)?>)?\)'/mg;
    static regexSetting = /'^<set:([\w\ \.]+)>:(.+)$'/mg;
    static regexCharacor = /'([\w\ ]+)(\(\d*\))?(\.\w+)?'/mg;
    static regexModify = /'<(\w+)(=\d+)?>'/mg;
    static regexSound = /'({.+?})'/mg;
    static regexAsterisk = /'(\{([^\{\}]*?[;])?\*([\w\ \.\,，。：？！“”]*)?\})'/mg;
    static regexHitpoint = /'<hitpoint>:\((.+?),(\d+),(\d+),(\d+)\)'/mg;
    static regexDice = /'\((.+?),(\d+),([\d]+|NA),(\d+)\)'/mg;

    static regexMediaLine = /^[^#](.*?)\s*=\s*(.+?)\((.+)\)$/m;

    static isDialogueLine(text:string):boolean{
        return RegexUtils.regexDialogue.test(text);
    }
    static parseDialogueLine(text:string){
        let r = RegexUtils.regexDialogue.exec(text);
        try {
            if(r){
                let pcList = [
                    new Character(r[2],Number(r[4]),r[6]),
                    new Character(r[9],Number(r[11]),r[13]),
                    new Character(r[16],Number(r[18]),r[20])
                ];
                pcList = pcList.filter(x => x.name !== "");
                return new DialogueLine(
                    pcList,r[21],r[22],r[23],r[24]
                );
            }
        } catch (error) {
            console.log(error);
        }
        return null;
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
    constructor(
        public characterList:Character[] = [],
        public toggleEffect:string = "",
        public content:string = "",
        public textEffect:string = "",
        public soundEffect:string = ""
    ){

    }
    
}

export class Character{
    constructor(public name:string = '',public alpha:number = -1,public subtype:string = 'default'){

    }
}