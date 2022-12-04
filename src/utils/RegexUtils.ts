/**
 * 正则表达式模块
 * 因为需要用到正则表达式匹配剧本文件元素的地方越来越多，所以将其抽取出来
 */

import { Character, DialogueLine, Dice, SoundEffectBox } from "./entities";

export class RegexUtils{
    static regexDialogueLine = /^\[(([^,\.\(\)]*?)(\((\d+)\))?(\.([^,\.\(\)]*?))?)(,(([^,\.\(\)]*?)(\((\d+)\))?(\.([^,\.\(\)]*?))?))?(,(([^,\.\(\)]*?)(\((\d+)\))?(\.([^,\.\(\)]*?))?))?\](<.*?>)?:(.*?)(<.*?>)?(\{.*?\})?$/m;
    static regexPlaceobj = /'^<(background|animation|bubble)>(<[\w\=]+>)?:(.+)$'/mg;
    static regexBubble = /'(\w+)\("([^\\"]*)","([^\\"]*)",?(<(\w+)=?(\d+)?>)?\)'/mg;
    static regexSetting = /^<set:(.+)>:(.+)$/m;
    static regexCharacor = /'([\w\ ]+)(\(\d*\))?(\.\w+)?'/mg;
    static regexModify = /'<(\w+)(=\d+)?>'/mg;

    static regexSoundEffectBoxG = /\{(([^'"]*?)|"([^']*?)"|'([^"]*?)')(;(\*)?([^\*]*?))?\}/mg;
    static regexSoundEffectBox = /\{(([^'"]*?)|"([^']*?)"|'([^"]*?)')(;(\*)?([^\*]*?))?\}/m;

    static regexAsterisk = /'(\{([^\{\}]*?[;])?\*([\w\ \.\,，。：？！“”]*)?\})'/mg;
    static regexHitpoint = /'<hitpoint>:\((.+?),(\d+),(\d+),(\d+)\)'/mg;
    static regexDice = /^<dice>:\((.+?),(.+?),(.+?),(.+?)\)(,\((.+?),(.+?),(.+?),(.+?)\))?(,\((.+?),(.+?),(.+?),(.+?)\))?(,\((.+?),(.+?),(.+?),(.+?)\))?$/mg;
    static regexBackgroundLine = /^<background>(<[\w\=]+>)?:(.+)$/m;

    static regexMediaLine = /^([^#].*?)\s*=\s*(.+?)\((.+)\)$/m;

    static regexFilePathInPara = /(filepath|fontfile)\s*=\s*['"](.+?)['"]/;

    static isDialogueLine(text:string):boolean{
        return RegexUtils.regexDialogueLine.test(text);
    }
    static parseDialogueLine(line:string){
        let r = this.regexDialogueLine.exec(line);
        try {
            if(r){
                let pcList = [
                    new Character(r[2],Number(r[4]),r[6]),
                    new Character(r[9],Number(r[11]),r[13]),
                    new Character(r[16],Number(r[18]),r[20])
                ];
                pcList = pcList.filter(x => x.name !== "");
                //音效框解析
                let soundEffect = r[24];
                //全局匹配时用targetString.match(rExp)而不是rExp.exec(targetString)，因为exec只返回第一个匹配
                //而match函数对全局匹配又只是返回匹配结果而没有获取其中的分组
                let seList = soundEffect.match(this.regexSoundEffectBoxG);
                let soundEffectBoxes:SoundEffectBox[] = [];
                if(seList){
                    //匹配到单个音效框之后，再获取分组
                    //为什么没办法一次性获取呢？很奇怪
                    for(let se of seList){
                        let rSE = this.regexSoundEffectBox.exec(se);
                        if(rSE){
                            let soundEffectBox = new SoundEffectBox();
                            if(rSE[2]){
                                if(rSE[2][0] === "*"){
                                    //{*speech_text}
                                    soundEffectBox.isPending = true;
                                    soundEffectBox.text = rSE[2].slice(1,rSE[2].length);
                                    // soundEffectBoxes.push(soundEffectBox);
                                }else{
                                    //{obj(;.*)?}
                                    soundEffectBox.obj = rSE[2];
                                }
                            }
                            //{"file"(;.*?)},{'file'(;.*?)}
                            if(rSE[3] || rSE[4]){
                                soundEffectBox.file = rSE[3]!==""?rSE[3]:(rSE[4]!==""?rSE[4]:"");
                            }

                            //判断时间是秒还是帧或是待处理
                            if(rSE[6]==="*"){
                                if(rSE[7] && !soundEffectBox.isPending){
                                    //{file_or_obj;*3.123}
                                    soundEffectBox.second = Number(rSE[7]);
                                }else{
                                    //{file_or_obj;*}
                                    soundEffectBox.isPending = true;
                                }
                            }else{
                                if(rSE[7] && !soundEffectBox.isPending){
                                    //{file_or_obj;30}
                                    soundEffectBox.frame = Number(rSE[7]);
                                }else{
                                    //{file_or_obj}
                                }
                            }
                            soundEffectBoxes.push(soundEffectBox);
                        }
                    }
                }

                return new DialogueLine(
                    pcList,r[21],r[22],r[23],r[24],soundEffectBoxes
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

    static isBackgroundLine(text:string):boolean{
        return RegexUtils.regexBackgroundLine.test(text);
    }

    static parseBackgroundLine(line:string){
        let r = this.regexBackgroundLine.exec(line);
        if(r){
            return {
                switchMethod:r[1],//<black=30>
                background:r[2]
            };
        }else{
            return null;
        }
    }

    static parseSetterLine(line:string){
        let r = this.regexSetting.exec(line);
        if(r){
            return {
                name:r[1],
                value:r[2]
            };
        }else{
            return null;
        }
    }

    static parseDiceLine(line:string){
        let r = this.regexDice.exec(line);
        if(r){
            return [
                new Dice(r[1],r[2],r[3],r[4]),
                new Dice(r[6],r[7],r[8],r[9]),
                new Dice(r[11],r[12],r[13],r[14]),
                new Dice(r[16],r[17],r[18],r[19]),
            ];
        }else{
            return null;
        }
    }

    static isMediumNameLegal(name:string):boolean{
        let occupiedVariableName = [
            "Animation","Audio","Audio_type","BGM","BGM_clips","Background","Bubble","BuiltInAnimation","E","Exception","H","Image","ImageDraw","ImageFont","ImageTk","Is_NTSC","MediaError","NA","Na","Nan","None","PR_center_arg","ParserError","RE_asterisk","RE_background","RE_characor","RE_dialogue","RE_dice","RE_hitpoint","RE_mediadef_args","RE_modify","RE_parse_mediadef","RE_setting","RE_sound","RE_vaildname","SOUEFF","StrokeText","Text","UF_cut_str","VOICE","W","Window","__annotations__","__builtins__","__cached__","__doc__","__file__","__loader__","__name__","__package__","__spec__","__warningregistry__","alpha_range","am_dur_default","am_method_default","am_methods","ap","argparse","args","asterisk_pause","audio_clip_tplt","audio_track_tplt","audio_tracks","available_Text","bb_dur_default","bb_method_default","begin","begin_time","bg_dur_default","bg_method_default","black","break_point","browse_file","bubble_clip_list","bubble_this","bulitin_media","channel_list","char_tab","charactor_table","choose_color","clip_index","clip_list","clip_tplt","cmap","colorchooser","concat_xy","crf","ct","cut_str","detail_info","drop","edtion","end","event","exit_status","exportVideo","exportXML","ffmpeg","file_index","filedialog","finish_rate","fixscreen","font","formula","formula_available","forward","fps_clock","frame_rate","get_audio_length","get_background_arg","get_dialogue_arg","get_l2l","get_seting_arg","glob","i","image_canvas","item","key","label_pos_show_text","layer","left","linear","main","main_Track","main_output","media","media_list","media_obj","messagebox","mixer","n","normalized","note_text","np","obj_name","object_define_text","obyte","occupied_variable_name","ofile","open_Edit_windows","open_Main_windows","open_Media_def_window","open_PosSelect","os","outanime_index","output_engine","output_path","outtext_index","parse_timeline","parse_timeline_bubble","parser","path","pause_SE","pd","project_tplt","pydub","pygame","python3","quadratic","quadraticR","re","reformat_path","render","render_arg","render_timeline","resize_screen","right","s","screen","screen_resized","screen_size","show_detail_info","sigmoid","speech_speed","split_xy","stdin_log","stdin_name","stdin_text","stop","stop_SE","synthfirst","sys","system_terminated","temp","temp_AU","text","text_clip_list","text_this","this_Track","this_frame","time","timeline","timer","tk","tr","track_items","track_tplt","tracks","ttk","tx_dur_default","tx_method_default","used_time","used_variable_name","values","video_tracks","voice","voice_lib","webbrowser","white","window","zorder"
        ];
        
        return /^[a-zA-Z_\u4E00-\u9FA5][\u4E00-\u9FA5\w]*$/m.test(name) && !occupiedVariableName.includes(name);
    }

    static getFilePathInPara(para:string){
        let r = this.regexFilePathInPara.exec(para);
        if(r){
            return r[2];
        }else{
            return null;
        }
    }
}