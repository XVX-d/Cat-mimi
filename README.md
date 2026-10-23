# Meow & Reel 猫与鱼

HTML5休闲钓鱼游戏源码。当前CrazyGames版本v0.53，包含用户选定的新背景音乐；微信运行时代码保留，微信既有发布版为v0.44。

这是源码导出，不是全量磁盘备份。未包含私人配置、软著材料、AI开发说明PDF、独立金币修改器、历史试玩包、版本快照和额外美术源稿。运行所需assets完整保留。未附开源许可证，不代表允许第三方自由使用代码或素材。

## 安装与构建

需要Python 3.10或以上、Pillow。以下命令在01_游戏源码目录运行：

```powershell
python -m pip install -r requirements.txt
python build_standalone.py
$env:CRAZY_SDK='1'
$env:CRAZY_30FPS='1'
$env:CRAZY_LOAD_FIX='1'
$env:CRAZY_HOME_TYPE='1'
$env:CRAZY_NEW_MUSIC='1'
python tools/build_crazygames_optimized.py
```

第一步构建会重新生成已排除的assets_b64.js、_export_src.js及单文件HTML，是CrazyGames构建的前置步骤。

最终上传包位于04_试玩版本/v0.53-crazygames/Meow-Reel-v0.53-CrazyGames.zip。
新背景音乐位于01_游戏源码/assets/audio_crazygames/Music_Loop_v053.mp3，通过CRAZY_NEW_MUSIC启用；普通源码入口保留原音乐。

## 预览最新CrazyGames版

构建后进入04_试玩版本/v0.53-crazygames/web，运行：

```powershell
python -m http.server 8765 --bind 127.0.0.1
```

浏览器访问http://127.0.0.1:8765/index.html。SDK本地初始化需要网络，首次点击后播放声音。发布前还需完成平台QA，不保证审核通过。

## 七个项目分区

01_游戏源码含源码、运行素材和工具；02_美术源文件只保留占位；03_编辑器配置保存配置；04_试玩版本和05_版本备份由工具生成；06_项目说明含版本与提交记录；07_项目工具含项目启动工具。

## 上传GitHub

先解压本包，把README.md、.gitignore及七个分区放在仓库根目录。建议用GitHub Desktop提交和推送整个文件夹；只上传ZIP会把它当附件存放，不能直接浏览源码。
建议先建Private仓库；公开前自行确认图片、音乐、字体及其他素材的公开分发权。不要提交.env、私人微信配置、凭据或身份材料。不要把自动生成的大文件强制加入Git。
游戏发行ZIP适合放到GitHub Release附件，不必纳入源码历史。此包未替用户初始化Git或执行上传。
