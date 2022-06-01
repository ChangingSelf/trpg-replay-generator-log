# trpg-replay-generator-log README

这是一个辅助扩展，用于跑团replay视频制作程序“回声工坊”的log文件的语法高亮，并且根据该软件的文档添加了一些代码片段

[软件“回声工坊”的介绍视频](https://www.bilibili.com/video/BV1GY4y1H7wK/)

[软件“回声工坊”的Github仓库](https://github.com/DanDDXuanX/TRPG-Replay-Generator)

## 使用方法

详细使用方法可见视频：[适用于回声工坊的vscode扩展插件介绍](https://www.bilibili.com/video/BV1yt4y1p7xa/)

- 安装该扩展之后在弹窗中使用该扩展提供的“rgl theme”（不用自带主题的话可能高亮起来怪怪的，当然，可以切换其他主题，同样有语法高亮）
- 将要高亮的文件的扩展名改为.rgl，txt文件是不会高亮的

## 支持的代码片段

- 内建动画行：支持`<dice>`和`<hitpoint>`的快速输入。例如：输入dice4可以快速输入含有4组参数的骰子行，输入hp可以快速输入生命值行
- 设置行：输入set可以在弹出的列表中选择需要输入的设置
- 背景行：输入background + 切换方式的名称或者bg+切换方式开头字母就可以快速输入背景行。例如`bgr`或`background replace`为`<background><replace=0>:背景媒体`
- 音效框：输入audio可以快速输入音效框，即`{音效;*时间}`

## 代码折叠

- 在想要折叠的起始行和末尾行分别加上`#s`和`#e`的注释，即可对中间的内容进行折叠
- 可以嵌套，而且这两个边界标记后面可以加注释，例如`#s 这是折叠的起始行，意思是start`，`#e 这是折叠的末尾行，意思是end`。