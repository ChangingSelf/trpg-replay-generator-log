# 「回声工坊辅助插件」的帮助文档

这是文字视频（例如TRPG replay、视觉小说）制作软件「回声工坊」的辅助扩展，围绕整理剧本文件（跑团Log文件）提供了很多便利功能

- [软件“回声工坊”的介绍视频](https://www.bilibili.com/video/BV1GY4y1H7wK/)
- [软件“回声工坊”的Github仓库](https://github.com/DanDDXuanX/TRPG-Replay-Generator)
- [本扩展的简单介绍视频](https://www.bilibili.com/video/BV1Xv4y1u7RC/)
- [本扩展的图文帮助文档](https://www.wolai.com/oPvjzFX3gQDZjV5JLAxpuR)
- [本扩展的最新开发进展](https://www.wolai.com/544d41yz3DEFyqSy2YquHW)

## 基础功能使用方法

1. 去官网安装[vscode](https://code.visualstudio.com/)（不过你大概率是在vscode里面看到这句话，所以是一句废话）。**注意，这玩意儿是免费的，不要下载到收费的盗版软件。**
2. **将要高亮的剧本文件的扩展名改为.rgl，txt文件是不会高亮的。**
3. 安装该扩展之后，在弹窗中使用该扩展提供的“RGL Dark Theme”或者“RGL Light Theme”主题。不用自带主题的话可能高亮起来怪怪的。当然，可以切换其他主题，同样有语法高亮。
4. 开始润色你的剧本文件吧！不用考虑“那么多功能全部看完好麻烦”，你需要用到的时候再去看也行。

Tips：
- rgl文件的右键菜单集成了一些常用命令

## 高级功能使用方法

1. 按照下文的方法进行本扩展的设置，一般来说，“文件路径”那一栏设置最好都给设置好
2. 按照下文列出的功能去试试吧

### 全局配置与局部配置

点击左下角的齿轮图标或者使用 `ctrl+,`快捷键可以打开设置面板，在搜索框中搜索本插件名称（或者在旁边的“Extensions”一栏中找这一项），里面有着相关配置。

以下配置可以写在rgl文件中作为局部配置，存在多条配置时，会使用第一个。

- 若不存在局部配置，则使用全局配置。
- `#md`和 `#MediaDefinition`两种写法都可以，且**不区分大小写**。
- 优先使用当前文件作为log文件，若未打开文件，则使用全局配置的log文件路径。
- 代码片段 `current directory`:快速输入当前文档所在目录，便于进行局部配置
- 代码片段 `quickly configurate`:快速在本文件中配置与本文件同目录下的媒体定义文件media.txt和角色配置表characters.tsv

```
#! RplGenCore.exe
#md 媒体定义文件路径
#MediaDefinition 媒体定义文件路径

#ct 角色配置表路径
#CharacterTable 角色配置表路径

#op 输出路径
#Output 输出路径

#tl 导出XML时的时间轴文件的路径
#TimeLine 导出XML时的时间轴文件的路径

#ll 悬停提示和代码诊断的每行限制字数
#LineLength 悬停提示的每行限制字数

#tl 代码诊断所使用的对话行内容总字数
#TotalLength 代码诊断所使用的对话行内容总字数
```

## 本扩展提供的功能

### 语法高亮与颜色主题

- `RGL Dark Theme`：暗色主题
- `RGL Light Theme`：亮色主题

### 支持的代码片段

| 代码片段                | 说明                                                                                                                                                                                                                                                                                                                                         |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 内建动画行              | 支持 `<dice>`和 `<hitpoint>`的快速输入。例如：输入dice4可以快速输入含有4组参数的骰子行，输入hp可以快速输入生命值行                                                                                                                                                                                                                       |
| 设置行                  | 输入set可以在弹出的列表中选择需要输入的设置                                                                                                                                                                                                                                                                                                  |
| 背景行                  | 输入background + 切换方式的名称或者bg+切换方式开头字母就可以快速输入背景行。例如 `bgr`或 `background replace`为 `<background><replace=0>:背景媒体`                                                                                                                                                                                     |
| 音效框                  | 输入audio可以快速输入音效框，即 `{音效;*时间}`                                                                                                                                                                                                                                                                                             |
| 正则表达式片段          | 便于复制使用的常用正则表达式片段，触发词前缀是regex。分别是“将跑团记录着色器得到的尖括号替换为方括号与冒号”，“批量给对话行末尾添加待处理星标“{*}”。”，“给某个特定角色对话行末尾加特定音效。”（现在推荐直接使用对应的命令 `TRGL: Replace Angle Brackets`、`TRGL: Add Asterisk Marks`、`TRGL: Add Sound Effects In Batches`、 ） |
| `fold mark`           | 快速输入折叠标记                                                                                                                                                                                                                                                                                                                             |
| `current directory`   | 快速输入当前文档所在目录，便于进行局部配置                                                                                                                                                                                                                                                                                                   |
| `quickly configurate` | 快速在本文件中配置与本文件同目录下的媒体定义文件media.txt和角色配置表characters.tsv                                                                                                                                                                                                                                                          |
| `animation`           | 常驻立绘行                                                                                                                                                                                                                                                                                                                                   |
| `clear`               | 聊天窗内容清除行                                                                                                                                                                                                                                                                                                                             |
| `set FreePos`         | 设置自由位置                                                                                                                                                                                                                                                                                                                                 |

### 折叠标记

- 在想要折叠的起始行和末尾行分别加上 `#s`和 `#e`的注释，即可对中间的内容进行折叠
- 可以嵌套，而且这两个边界标记后面可以加注释，例如 `#s 这是折叠的起始行，意思是start`，`#e 这是折叠的末尾行，意思是end`。
- **媒体定义文件**支持按照媒体类型折叠以及折叠标记折叠（#s开头和#e结尾，使用方式同上）

### 悬停提示

鼠标移动到rgl文件的各个元素并悬停时，会出现相应的说明文字。可以在设置中关闭。

可以使用 `#ll 50`或者 `#lineLength 50`将单行字数限制设定为50，这里的数字可以改成其他整数，设置为负数将被视作正无穷

### 自动补全

- **角色差分**：你在角色名后输入“.”即可自动补全角色差分，只要你正确配置了角色配置表（支持tsv和xlsx格式）
- **角色名**：输入对话框的名字框时触发，多个角色时也支持
- **背景行**：在 `<background>`后输入英文冒号触发
- **音效**：输入左花括号 `{`触发
- **立绘媒体**：常驻立绘行(`<animation>`)自动补全立绘
- **气泡媒体**：常驻气泡行(`<bubble>`)自动补全气泡
- **聊天窗媒体**：聊天窗内容清除行(`<clear>`)自动补全聊天窗

### 代码诊断及快速修复

- 当角色或者差分未在角色配置表中定义的时候，报错
- 当背景行使用的背景未在媒体定义文件中定义时，报错
- 当对话行单行字数或者总字数超出用户设置的上限时，警告（可将对应字数设置为负数以关闭此功能）
- 自动检测多音字并标注，以防止语音合成不合预期，可在设置中调整多音字表和提示等级，并提供“在行尾添加合成指定文本的语音的标志便于修改”的快速修复

代码诊断新增音效框相关：

- 检查语音合成指定文本只能包含`，。：？！“”`等中文符号
- 检查音效框的文件路径是否正确
- 检查音效框使用的是否为wav文件
- 检查音效媒体是否在媒体定义文件中已经定义

### 状态栏

可以在状态栏里看到预估视频时长等统计信息，点击状态栏可以使用

### 侧边栏

点击侧边栏回声工坊图标即可打开回声工坊资源管理器

|视图|说明|
|---|---|
|大纲|会将背景行视作跳转节点。侧边栏大纲可以使用折叠标记作为大纲节点，可嵌套（折叠标记正确闭合才会得到正确大纲），在【设置】->【侧边栏】中可以找到相应设置，默认使用背景行作为大纲节点|
|角色管理|可以通过侧边栏查看当前rgl文件有哪些角色差分（带*号）以及角色配置表里面有哪些角色差分，点击按钮手动刷新，可插入到剧本文件中|
|背景|会读取已配置的媒体定义文件得到可用背景媒体，点击可插入到剧本文件中|
|音效|会读取已配置的媒体定义文件得到可用音效媒体，点击可插入到剧本文件中|

### 命令

命令的使用方法是：ctrl+shift+p唤出命令面板，输入命令名字，enter键确认

打开命令面板的其他方式：

- 右键菜单中“命令面板”选项
- 菜单栏【帮助】>【显示所有命令】

#### `TRGL: Open Document`

可以快速打开配置的回声工坊软件路径下的 `README.md`文件，方便查看回声工坊的文档

#### `TRGL: Chat With DiceBot`

可以询问答疑骰郎伊可（Exception）问题

#### `TRGL: Correct Typos`

调用阿里云key进行文本纠错的功能，详细使用方法见：https://www.wolai.com/yxchangingself/D5svMQ4DWThCzUyauUbSb

对于已经配置好语音合成的用户来说，你需要做的就一件事：[开通文本纠错服务](https://help.aliyun.com/document_detail/179148.html)，key都是用以前的

#### `TRGL: Count`

可以统计对话行和骰子行的行数，并将rgl文件中提到的所有角色和背景不重复地列出，方便填写角色配置表和定义背景媒体，同时可以估算生成的视频的时间。

只统计选中部分的内容（行号为相对行号），当未选中任何文本时，统计整个文件

#### `TRGL: Check Dialog Line Length`

找出超出指定字数的对话行

#### `TRGL: Replace Angle Brackets`

将[QQ跑团记录着色器](https://logpainter.kokona.tech/)得到的尖括号替换为方括号与冒号

#### `TRGL: Add Asterisk Marks`

**（已经弃用，请使用`TRGL: Edit Audio Box`命令代替）**

批量给对话行末尾添加待处理星标“{*}”，拥有多个选项

- 给全部对话行添加待处理星标
- 只给无音效框的行添加待处理星标
- 去掉纯标点符号行的待处理星标
- 把某个角色已经合成的语音框替换为待合成星标以便重新合成
- 把某个角色已经合成的语音框删除。可以先添加全部{*}，再删除某个特定角色的语音框，实现只给某个角色不添加星标

#### `TRGL: Add Sound Effects In Batches`

**（已经弃用，请使用`TRGL: Edit Audio Box`命令代替）**

为指定角色批量添加指定音效

#### `TRGL: Edit Audio Box`

批量编辑音效框，拥有多个选项：

- 给全部对话行添加{*}
- 只给没有音效框的对话行行添加{*}
- 给指定角色添加指定音效(默认为{*})
- 给指定角色删除指定音效(默认为{*})
- 给指定角色删除文件路径音效
- 给指定角色删除所有音效
- 去掉纯标点符号行的{*}

#### `TRGL: Edit Content`

批量编辑对话行内容

- 注释掉场外交流行
- 注释掉指令行
- 给场外交流行的主角色添加「场外」差分
- 删除注释掉的对话行
- 左右引号顺序修正
- 单双引号修正
- 替换为直角引号
- 为RP内容分段

#### `TRGL: Adjust Sound Effects Time In Batches`

批量调整合成语音的时间，输入角色名以及时间差，就可以给合成的语音框后的时间批量加上这个时间差，用于调整微软音源的音频空白问题

#### `TRGL: Replace DiceMaid Line`

一键替换骰娘文本为骰子动画行

#### `TRGL: Migrate Log`

（已弃用，请使用`TRGL: Convert Log`命令代替）

有损、不可逆的回声工坊和活字引擎log格式互相转换，使用前请做好备份

#### `TRGL: Convert Log`

转换跑团Log格式，对当前文件使用，在旁边生成一个转换好的回声工坊log文件，目前支持：

- 猫爷TRPG => 回声工坊
- 菠萝文字团平台txt => 回声工坊
- 菠萝文字团平台json => 回声工坊
- QQ聊天记录 => 回声工坊
- 赵、溯洄系骰子的已染色记录 => 回声工坊
- 塔骰已染色记录 => 回声工坊
- 活字引擎 => 回声工坊
- 回声工坊 => 活字引擎

#### `TRGL: Define Character`

生成的角色配置表自动填充Name,Subtype,Animation三列，其余列为NA

该命令有如下选项：

- 从log文件生成，根据已有的log文件中出现的角色及其差分自动生成tsv角色配置表，Animation列会将Name和Subtype列用“_”相连接
- 从媒体定义文件生成，根据立绘媒体名生成角色配置文件的差分行，Name和Subtype列会根据Animation列进行拆分。例如“憧憬少_微笑”这个Animation媒体会被转换为“憧憬少”角色的“微笑”差分，对应的立绘就是“憧憬少_微笑”这个立绘媒体。

#### `TRGL: Define Media`

根据指定路径内的媒体素材生成媒体定义文件。

注意：必须把文件夹名字命名为对应的媒体名字，而且区分大小写

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

#### `TRGL: Play Video `

现在可以在vscode里面用“TRGL: Play Video”命令播放当前rgl文件了，只要你在设置内（ctrl+逗号，调出设置面板，找到“回声工坊插件设置”）配置好各种参数。

最重要的是配置好回声工坊的RplGenCore.exe文件所在路径。

若勾选“先执行语音合成”选项，则会先合成语音。

#### `TRGL: Export Video`

导出mp4视频。

若勾选“先执行语音合成”选项，则会先合成语音。

若勾选“导出XML”选项，则不导出mp4，而是导出XML。

#### `TRGL: Synthesized Speech`

单独语音合成。需要配置好语音合成key。

#### `TRGL: Export XML`

用之前生成好的timeline文件重新导出XML文件，需要填写配置中的timeline路径

#### `TRGL: Import Local Sound`

导入本地wav语音，以本地wav文件替换log文件中的待处理星标。

需要调用本地的ffprobe.exe，只要配置好回声工坊路径就可以自动找到

运行时就是没有进度条的，需要耐心等一下（等之后有时间了就修）

#### `TRGL: Copy Log`

以不同格式复制剧本文件，支持的复制格式：

- 软件「朗读女」的「多角色朗读」的格式：[角色名]说话内容。
- 无角色框的内容文本