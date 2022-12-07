export class DialogueLine{

    constructor(
        public characterList:Character[] = [],
        public toggleEffect:string = "",
        public content:string = "",
        public textEffect:string = "",
        public soundEffect:string = "",
        public soundEffectBoxes:SoundEffectBox[] = []
    ){

    }
    
    /**
     * getContentStartCol
     */
    public getContentStartCol() {
        let contentStartCol = 2;//对话行内容开始的列，算上了末尾的英文冒号
        for(let character of this.characterList){
            let offsetOfSubtype = character.subtype==='default'?0:(character.subtype.length+1);
            let offsetOfAlpha = isNaN(character.alpha)?0:(character.alpha.toString().length+2);

            contentStartCol += character.name.length + offsetOfSubtype + offsetOfAlpha + 1;
        }
        contentStartCol += this.toggleEffect.length;
        return contentStartCol;
    }

    public addSoundEffect(soundEffectBox:SoundEffectBox|null){
        if(soundEffectBox === null){
            return;
        }
        this.soundEffectBoxes.push(soundEffectBox);
        this.soundEffect += soundEffectBox.toString();
    }

    public delSoundEffect(soundEffectBox:SoundEffectBox|null){
        if(soundEffectBox === null){
            return;
        }
        let newList:SoundEffectBox[] = [];
        let index = this.soundEffectBoxes.findIndex(x=>x.toString()===soundEffectBox.toString());
        if(index === -1){
            return;
        }
        this.soundEffectBoxes.splice(index,1);
        this.soundEffect = this.soundEffectBoxes.join("");
    }


    public getCharactersString(){
        return `[${this.characterList.map((pc)=>pc.toString()).join(",")}]`;
    }

    public toString(){
        return `${this.getCharactersString()}${this.toggleEffect}:${this.content}${this.textEffect}${this.soundEffect}`;
    }
}

export class Character{
    constructor(public name:string = '',public alpha:number = -1,public subtype:string = 'default'){

    }

    /**
     * toString
     */
    public toString() {
        let str = this.name;
        if(this.alpha !== -1 && !isNaN(this.alpha)){
            str += `(${this.alpha})`;
        }
        if(this.subtype !== "default"){
            str += `.${this.subtype}`;
        }
        return str;
    }
}

export class SoundEffectBox{
    constructor(
        public file:string = ""//wav文件路径，与obj最多只有一个会取值
        ,public obj:string = ""//媒体对象，与file最多只有一个会取值
        ,public second:number = -1//星标音频时间，单位为秒。负数代表未设置//{file_or_obj;*time}
        ,public frame:number = -1//音效延后播放帧数，单位为帧。负数代表未设置//{file_or_obj;frame}
        ,public isPending:boolean = false//是否待处理
        ,public text:string = ""//指定的待合成文本
    ){}

    public toString(){
        if(this.isPending){
            /**
            1. `{*}` ：待语音合成的标志，将本对话行的全部发言文本执行语音合成；
            2. `{*speech_text}` ：合成指定文本的语音的标志；指定文本只能包含`，。：？！“”`等中文符号；
            3. `{"./media/voice.wav";*}` ：当需要使用外部音频，而非语音合成时，可以读取音频文件持续时间，并填补到星标之后；这可以使小节的时长和音频时长同步。
             */
            if(this.file === ""){
                return `{*${this.text}}`;
            }else{
                return `{'${this.file}';*}`;
            }
        }
        let fileOrObj = this.file !== "" ? `'${this.file}'` : (this.obj !== "" ? this.obj : "NA");

        let time = "";
        if(this.second >= 0){
            time = `;*${this.second.toFixed(3)}`;
        }else if(this.frame >= 0){
            time = `;${this.frame.toFixed(0)}`;
        }else{
            time = "";
        }
        
        return `{${fileOrObj}${time}}`;
    }
}

export class Dice{
    public title:string="";
    public face:number=100;//骰子面数
    public check:number|null=null;//检定值
    public random:number=1;//骰子出目
    constructor(
        title:string,
        face:string,
        check:string,
        random:string
    ){
        this.title = title;
        this.face = Number.parseInt(face);
        if(check === "NA"){
            this.check = null;
        }else{
            this.check = Number.parseInt(check);
        }
        this.random = Number.parseInt(random);
    }

    public toString(){
        return `(${this.title},${this.face},${this.check ?? "NA"},${this.random})`;
    }
}