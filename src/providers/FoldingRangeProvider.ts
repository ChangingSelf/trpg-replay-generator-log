import * as vscode from 'vscode';
import { RegexUtils } from '../utils/RegexUtils';

export class MediaFoldingRangeProvider implements vscode.FoldingRangeProvider{
    onDidChangeFoldingRanges?: vscode.Event<void> | undefined;
    provideFoldingRanges(document: vscode.TextDocument, context: vscode.FoldingContext, token: vscode.CancellationToken): vscode.ProviderResult<vscode.FoldingRange[]> {
        let lines = document.getText().split("\n");

        let rangeList:vscode.FoldingRange[] = [];

        let currentType = "";
        let lineNum = -1;
        let startLine = -1;
        let endLine = -1;
        let regionStartLine = -1;
        let regionEndLine = -1;

        for(let line of lines){
            ++lineNum;
            //折叠标记
            if(/^#s/.test(line)){
                regionStartLine = lineNum;
                continue;
            }else if(/^#e/.test(line)){
                regionEndLine = lineNum;
                rangeList.push({
                    start:regionStartLine,
                    end:regionEndLine,
                    kind:vscode.FoldingRangeKind.Region
                });
                continue;
            }


            //媒体行折叠
            let mediumLine = RegexUtils.parseMediaLine(line);
            if(!mediumLine){
                continue;
            }

            if(mediumLine?.mediaType !== currentType){
                //该行是新的媒体类型
                
                //结算旧行
                if(currentType !== ""){
                    endLine = lineNum - 1;
                    rangeList.push({
                        start:startLine,
                        end:endLine,
                        kind:vscode.FoldingRangeKind.Imports
                    });
                    currentType = mediumLine?.mediaType ?? "";
                }
                //标记新行
                currentType = mediumLine.mediaType;
                startLine = lineNum;
            }
        }
        if(currentType !== "" && startLine >= 0 && lineNum > 0){
            endLine = lineNum;
            rangeList.push({
                start:startLine,
                end:endLine,
                kind:vscode.FoldingRangeKind.Imports
            });
        }

        return rangeList;
    }
    
}