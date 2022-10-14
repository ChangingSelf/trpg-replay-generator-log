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