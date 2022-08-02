# trpg-replay-generator-log README

这是一个辅助扩展，用于跑团replay视频制作程序“回声工坊”的log文件的语法高亮，并且根据该软件的文档添加了一些代码片段

[软件“回声工坊”的介绍视频](https://www.bilibili.com/video/BV1GY4y1H7wK/)

[软件“回声工坊”的Github仓库](https://github.com/DanDDXuanX/TRPG-Replay-Generator)

## 使用方法

详细使用方法可见视频：[【回声工坊】插件：跑团replay视频制作程序的vscode辅助扩展，让效率再上一层楼！](https://www.bilibili.com/video/BV1Xv4y1u7RC/)

或者带有动画演示的图文教程：[插件TRGL帮助文档（详细介绍版）](https://www.wolai.com/oPvjzFX3gQDZjV5JLAxpuR)

- 安装该扩展之后在弹窗中使用该扩展提供的“rgl theme”（不用自带主题的话可能高亮起来怪怪的，当然，可以切换其他主题，同样有语法高亮）
- 将要高亮的文件的扩展名改为.rgl，txt文件是不会高亮的

## 支持的代码片段

- 内建动画行：支持 `<dice>`和 `<hitpoint>`的快速输入。例如：输入dice4可以快速输入含有4组参数的骰子行，输入hp可以快速输入生命值行
- 设置行：输入set可以在弹出的列表中选择需要输入的设置
- 背景行：输入background + 切换方式的名称或者bg+切换方式开头字母就可以快速输入背景行。例如 `bgr`或 `background replace`为 `<background><replace=0>:背景媒体`
- 音效框：输入audio可以快速输入音效框，即 `{音效;*时间}`
- 便于复制使用的常用正则表达式片段：触发词前缀是regex。分别是“将跑团记录着色器得到的尖括号替换为方括号与冒号”，“批量给对话行末尾添加待处理星标“{*}”。”，“给某个特定角色对话行末尾加特定音效。”（现在推荐直接使用对应的命令 `TRGL: Replace Angle Brackets`、`TRGL: Add Asterisk Marks`、`TRGL: Add Sound Effects In Batches`、 ）
- `fold mark`:快速输入折叠标记
- `current directory`:快速输入当前文档所在目录，便于进行局部配置
- `quickly configurate`:快速在本文件中配置与本文件同目录下的媒体定义文件media.txt和角色配置表characters.tsv

## 代码折叠

- 在想要折叠的起始行和末尾行分别加上 `#s`和 `#e`的注释，即可对中间的内容进行折叠
- 可以嵌套，而且这两个边界标记后面可以加注释，例如 `#s 这是折叠的起始行，意思是start`，`#e 这是折叠的末尾行，意思是end`。

## 悬停提示

鼠标移动到rgl文件的各个元素并悬停时，会出现相应的说明文字。可以在设置中关闭。

可以使用`#ll 50`或者`#lineLength 50`将每行字数限制设定为50，这里的数字可以改成其他整数

## 配置

点击左下角的齿轮图标或者使用 `ctrl+,`快捷键可以打开设置面板，在搜索框中搜索本插件名称（或者在旁边的“Extensions”一栏中找这一项），里面有着相关配置。

以下配置可以写在rgl文件中作为局部配置，存在多条配置时，会使用第一个。

- 若不存在局部配置，则使用全局配置。
- `#md`和 `#MediaDefinition`两种写法都可以，且**不区分大小写**。
- 优先使用当前文件作为log文件，若未打开文件，则使用全局配置的log文件路径。

```rgl
#! RplGenCore.exe
#md 媒体定义文件路径
#MediaDefinition 媒体定义文件路径
#ct 角色配置表路径
#CharacterTable 角色配置表路径
#op 输出路径
#Output 输出路径
#tl 导出XML时的时间轴文件的路径
#TimeLine 导出XML时的时间轴文件的路径
#ll 悬停提示的每行限制字数
#LineLength 悬停提示的每行限制字数
```

## 命令

命令的使用方法是：ctrl+shift+p唤出命令面板，输入命令名字，enter键确认

打开命令面板的其他方式：
- 右键菜单中“命令面板”选项
- 菜单栏【帮助】>【显示所有命令】

### `TRGL: Open Document`

可以快速打开配置的回声工坊软件路径下的`README.md`文件，方便查看回声工坊的文档

### `TRGL: Count`

可以统计对话行和骰子行的行数，并将rgl文件中提到的所有角色和背景不重复地列出，方便填写角色配置表和定义背景媒体，同时可以估算生成的视频的时间。

只统计选中部分的内容（行号为相对行号），当未选中任何文本时，统计整个文件

### `TRGL: Check Dialog Line Length`

找出超出指定字数的对话行

### `TRGL: Replace Angle Brackets`

将[QQ跑团记录着色器](https://logpainter.kokona.tech/)得到的尖括号替换为方括号与冒号

### `TRGL: Add Asterisk Marks`

批量给对话行末尾添加待处理星标“{*}”

### `TRGL: Add Sound Effects In Batches`

为指定角色批量添加指定音效

### `TRGL: Adjust Sound Effects Time In Batches`

批量调整合成语音的时间，输入角色名以及时间差，就可以给合成的语音框后的时间批量加上这个时间差，用于调整微软音源的音频空白问题

### `TRGL: Define Character`

根据已有的log文件自动生成tsv角色配置表

### `TRGL: Define Media`

根据指定路径内的媒体素材生成媒体定义文件。

例子：把所有的素材分类放在 `F:/demo`路径下，它的目录结构（所有目录都是可选的）是：

- demo
  - Animation
    - KP
      - 差分1.png
      - 差分2.png
    - PC1
      - 微笑.png
      - 哭泣.png
    - PC2
      - 愤怒.png
      - 悲伤.png
    - NPC1.png
    - NPC2.png
  - Audio
    - 掷骰音效.wav
    - 掷骰成功音效.wav
    - 掷骰失败音效.wav
  - Background
    - 图书馆
      - 一楼
      - 二楼
    - 研究所
      - 门口
      - 研究室
  - BGM
    - 懒得编了.ogg
    - 就当这里有很多BGM吧.ogg
  - Bubble
    - bubble1.png
    - bubble2.png
  - Text
    - 字体文件1.otf
  - StrokeText
    - 字体文件2.otf

输入命令后，会弹出一个输入框，让你输入媒体素材所在的文件夹的路径，本例子中是：“F:/demo”。

接着会弹出第二个输入框，让你输入媒体定义文件的路径（含文件名），你可以直接按下回车键使用默认值“./media.txt”，即，在“F:/demo”目录下生成一个“media.txt”文件。

接下来会扫描“F:/demo”文件夹，若存在特定媒体文件夹，就根据这个文件夹内的媒体文件生成对应的条目。

每一个媒体文件夹都是可选的，例如“F:/demo”可以只有“Background”文件夹，这时候只会处理这个文件夹。

媒体文件夹内可以嵌套多层文件夹，例如：

- Animation
  - PC1
    - 微笑.png
    - 哭泣.png
  - NPC1.png
  - NPC2.png

生成的媒体名字将会是：PC1_微笑，PC1_哭泣，NPC1，NPC2

更深层的嵌套以此类推，一般用不到，这里也不举例了。

由于文件夹名有可能作为媒体名前缀，所以请不要用奇怪的符号命名文件夹。

**当媒体文件名不合法时，会直接跳过该文件。**(但如果加上前缀就合法，还是会处理该文件，所以看到文件里面有奇怪前缀的文件名可能是这种情况)

该命令生成的媒体定义文件使用的都是默认值，气泡和立绘的位置仍然需要手动去回声工坊的图形界面调整。

用回声工坊的图形界面编辑器打开时，会报出一些“解析错误”，但是不用理，那是由于它不支持解析其中的注释行和空白行，在图形界面编辑器中保存一次就好了。

当然，如果大家都不喜欢自动生成的注释，我下个版本会取消保留注释。

### `TRGL: Play Video `

现在可以在vscode里面用“TRGL: Play Video”命令播放当前rgl文件了，只要你在设置内（ctrl+逗号，调出设置面板，找到“回声工坊插件设置”）配置好各种参数。

最重要的是配置好回声工坊的RplGenCore.exe文件所在路径。

若勾选“先执行语音合成”选项，则会先合成语音。

### `TRGL: Export Video`

导出mp4视频。

若勾选“先执行语音合成”选项，则会先合成语音。

若勾选“导出XML”选项，则不导出mp4，而是导出XML。

### `TRGL: Synthesized Speech`

单独语音合成。需要配置好语音合成key。

### `TRGL: Export XML`

用之前生成好的timeline文件重新导出XML文件，需要填写配置中的timeline路径
