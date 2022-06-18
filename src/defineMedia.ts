import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as outputUtils from './utils/OutputUtils';
import { match } from 'assert';

let occupiedVariableName = [
    "Animation","Audio","Audio_type","BGM","BGM_clips","Background","Bubble","BuiltInAnimation","E","Exception","H","Image","ImageDraw","ImageFont","ImageTk","Is_NTSC","MediaError","NA","Na","Nan","None","PR_center_arg","ParserError","RE_asterisk","RE_background","RE_characor","RE_dialogue","RE_dice","RE_hitpoint","RE_mediadef_args","RE_modify","RE_parse_mediadef","RE_setting","RE_sound","RE_vaildname","SOUEFF","StrokeText","Text","UF_cut_str","VOICE","W","Window","__annotations__","__builtins__","__cached__","__doc__","__file__","__loader__","__name__","__package__","__spec__","__warningregistry__","alpha_range","am_dur_default","am_method_default","am_methods","ap","argparse","args","asterisk_pause","audio_clip_tplt","audio_track_tplt","audio_tracks","available_Text","bb_dur_default","bb_method_default","begin","begin_time","bg_dur_default","bg_method_default","black","break_point","browse_file","bubble_clip_list","bubble_this","bulitin_media","channel_list","char_tab","charactor_table","choose_color","clip_index","clip_list","clip_tplt","cmap","colorchooser","concat_xy","crf","ct","cut_str","detail_info","drop","edtion","end","event","exit_status","exportVideo","exportXML","ffmpeg","file_index","filedialog","finish_rate","fixscreen","font","formula","formula_available","forward","fps_clock","frame_rate","get_audio_length","get_background_arg","get_dialogue_arg","get_l2l","get_seting_arg","glob","i","image_canvas","item","key","label_pos_show_text","layer","left","linear","main","main_Track","main_output","media","media_list","media_obj","messagebox","mixer","n","normalized","note_text","np","obj_name","object_define_text","obyte","occupied_variable_name","ofile","open_Edit_windows","open_Main_windows","open_Media_def_window","open_PosSelect","os","outanime_index","output_engine","output_path","outtext_index","parse_timeline","parse_timeline_bubble","parser","path","pause_SE","pd","project_tplt","pydub","pygame","python3","quadratic","quadraticR","re","reformat_path","render","render_arg","render_timeline","resize_screen","right","s","screen","screen_resized","screen_size","show_detail_info","sigmoid","speech_speed","split_xy","stdin_log","stdin_name","stdin_text","stop","stop_SE","synthfirst","sys","system_terminated","temp","temp_AU","text","text_clip_list","text_this","this_Track","this_frame","time","timeline","timer","tk","tr","track_items","track_tplt","tracks","ttk","tx_dur_default","tx_method_default","used_time","used_variable_name","values","video_tracks","voice","voice_lib","webbrowser","white","window","zorder"
]

function islegal(name:string){
    return /^[a-zA-Z_\u4E00-\u9FA5][\u4E00-\u9FA5\w]*$/m.test(name) && !occupiedVariableName.includes(name)
}

let outputChannel = outputUtils.OutputUtils.getInstance();

function defineMediaInFolder(mediaType:string,folder:fs.Dirent,parent:string,mediaFile:string,prefix:string,level:number){
    let folderPath = path.join(parent,folder.name);//获取当前文件夹路径
    let files = fs.readdirSync(folderPath,{withFileTypes:true});//读取当前文件夹内文件列表
    let media = files.filter(x=>x.isFile());
    let secondaryDirs = files.filter(x=>x.isDirectory());
    fs.appendFileSync(mediaFile,`\n\n${"#".repeat(level)} ${prefix?prefix+"_":""}${folder.name}\n`)
    
    //对于普通媒体文件，直接进行媒体定义
    media.forEach(medium=>{
        let mediumItem:string = "";
        let filePath = path.join(folderPath,medium.name);
        filePath = filePath.replace(/\\/g,"/")
        let mediumName = `${prefix && level!=1?prefix+"_":""}${level!=1?folder.name+"_":""}${medium.name.substring(0,medium.name.indexOf('.'))}`;//TODO:进行合法性检验
        if(!islegal(mediumName) && !islegal(prefix + mediumName)) {
            console.log(`"${mediumName}"不是合法的媒体变量名`);
            outputChannel.appendLine(`错误：[${mediumName}]不是合法的媒体变量名，已跳过`);
            return;
        }else if(islegal(prefix + mediumName)){
            mediumName = prefix + mediumName;
        }
        switch(mediaType){
            case "Bubble":
                mediumItem = `${mediumName} = Bubble(filepath='${filePath}',Main_Text=Text(),Header_Text=None,pos=(0,0),mt_pos=(0,0),ht_pos=(0,0),align='left',line_distance=1.5,label_color='Lavender')`;
                break;
            case "Background":
                mediumItem = `${mediumName} = Background(filepath='${filePath}',pos=(0,0),label_color='Lavender')`;
                break;
            case "Animation":
                mediumItem = `${mediumName} = Animation(filepath='${filePath}',pos=(0,0),tick=1,loop=True,label_color='Lavender')`;
                break;
            case "BGM":
                mediumItem = `${mediumName} = BGM(filepath='${filePath}',volume=100,loop=True,label_color='Lavender')`;
                break;
            case "Audio":
                mediumItem = `${mediumName} = Audio(filepath='${filePath}',label_color='Lavender')`;
                break;
            case "StrokeText":
                mediumItem = `${mediumName} = StrokeText(fontfile='${filePath}',fontsize=40,color=(0,0,0,255),line_limit=20,edge_color=(255,255,255,255),label_color='Lavender')`;
                break;
            case "Text":
                mediumItem = `${mediumName} = Text(fontfile='${filePath}',fontsize=40,color=(0,0,0,255),line_limit=20,label_color='Lavender')`;
                break;
        }
        fs.appendFileSync(mediaFile,`${mediumItem}\n`);
        outputChannel.appendLine(`已添加${mediaType}媒体[${mediumName}]`);
    });

    //对下一级目录进行媒体定义
    if(level != 1) prefix += `_${folder.name}`;

    secondaryDirs.forEach(x=>defineMediaInFolder(mediaType,x,folderPath,mediaFile,prefix,level+1));
}



export function defineMedia(){

    const MEDIA_DEFINE_FILENAME = "media.txt";

    
    vscode.window.showInputBox({ 
        placeHolder:'输入媒体素材所在的文件夹的路径', // 在输入框内的提示信息
        prompt:'这个路径下不要有数字开头命名的文件夹，否则会跳过'
    }).then(inputText1 =>{
        vscode.window.showInputBox({
            placeHolder:`输入媒体定义文件的路径（含文件名），默认为“./${MEDIA_DEFINE_FILENAME}”`, // 在输入框内的提示信息
            prompt:`例：F:/replay/${MEDIA_DEFINE_FILENAME}`
        }).then(inputText2=>{
            try {
                let root:string = inputText1 ? inputText1 as string:"";
                // vscode.window.showInformationMessage(path);
                let outputFile = inputText2?inputText2 as string:MEDIA_DEFINE_FILENAME;
    
                //读取文件夹下的文件列表
                let folders =  fs.readdirSync(root,{withFileTypes:true});
    
                let mediaTypes = ["Bubble","Background","Animation","BGM","Audio","Text","StrokeText"]
                folders = folders.filter(x=>(x.isDirectory() && mediaTypes.includes(x.name)));//筛选出媒体文件夹
    
                //创建媒体定义文件
                let mediaFile = path.join(root,outputFile);
                fs.writeFileSync(mediaFile,"");
                
                //遍历根目录下每一个媒体文件夹
                folders.forEach(folder=>defineMediaInFolder(folder.name,folder,root,mediaFile,"",1));
                vscode.window.showInformationMessage(`媒体定义文件已输出为：${mediaFile}`);
                outputChannel.show();
    
                //打开媒体定义文件
                // 获取TextDocument对象
                vscode.workspace.openTextDocument(mediaFile)
                .then(doc => {
                    // 在VSCode编辑窗口展示读取到的文本
                    vscode.window.showTextDocument(doc);
                }, err => {
                    console.log(`Open ${mediaFile} error, ${err}.`);
                }).then(undefined, err => {
                    console.log(`Open ${mediaFile} error, ${err}.`);
                });
                
            } catch (error) {
                let err:Error = error as Error;
                vscode.window.showErrorMessage(`[${err.name}]${err.message}`);
            }
        })
    })
    
    
    

   
}

/**
 * 将媒体定义文件的文本转换为Object
 */
export function mediaDef2Obj(text:string){
    let mediumLineRegex = /^(\S*)\s*=\s*(\S*?)\((.*?)\)$/gm;
    let mediumRegex = /^(\S*)\s*=\s*(\S*?)\((.*?)\)$/m;
    let mediaList = text.match(mediumLineRegex) ?? [];

    let result:any = [];
    mediaList.forEach(medium=>{
        let mediumElement = medium.match(mediumRegex) ?? [];

        let mediumParameter = mediumElement[3];

        let paraList = mediumParameter.match(/(.*?)=((\(.*?,.*?\))|(.*?))(,|$)/gm) ?? [];

        let mediumParameters:any = {};
        paraList.forEach(parameter=>{
            let resultList = parameter.match(/(.*?)=((\(.*?,.*?\))|(.*?))(,|$)/m) ?? [];
            mediumParameters[resultList[1]] = resultList[2];
        });


        result.push({
            "mediumName" : mediumElement[1],
            "mediumType" : mediumElement[2],
            "mediumParameters" : mediumParameters
        });
    });


    
    return result;
}