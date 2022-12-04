export class DialogueLine{

    constructor(
        public characterList:Character[] = [],
        public toggleEffect:string = "",
        public content:string = "",
        public textEffect:string = "",
        public soundEffect:string = ""
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