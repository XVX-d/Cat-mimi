# 猫与鱼

一款以码头钓鱼、猫咪陪伴、鱼类图鉴和小屋养成为核心的 HTML5 休闲小游戏。

## 本地运行

在项目目录启动静态服务器：

```powershell
python -m http.server 8765 --bind 127.0.0.1
```

然后访问 `http://127.0.0.1:8765/index.html?nodebug`。

## 目录

- `src/`：游戏逻辑、系统、配置、存档和平台适配代码
- `assets/`：游戏运行素材
- `art_source/`：可继续编辑的美术源文件
- `tools/`：辅助工具
- `index.html`：开发入口
- `build_standalone.py`：单文件版本构建脚本
- `主界面部件编辑器.html`：全局 UI 布局编辑器（首页、钓鱼、图鉴、室内）。v0.41 已移除旧家具编辑器和海域选择、背包页面。

## 构建

```powershell
python build_standalone.py
```

构建生成的单文件版本默认不提交到源码仓库。
构建包超过4.5 MB预算时脚本会给出警告；当前阶段不以包体预算阻断构建。

## 数据规则

- `src/config/fishCatalogConfig.js` 是30种鱼的唯一内容目录；图鉴、地图鱼池、收藏奖励和存档均使用 `fish_01`～`fish_30`。
- 鱼获在收线时直接结算为金币，不进入道具背包，也不再经过小铺出售。
- `src/config/balanceConfig.js` 是鱼价、掉率、渔具、鱼篓、家具、房屋、猫咪、地图奖励与海王奖励的唯一数值源。
- 存档 v4 会迁移旧鱼类记录和旧鱼篓价值，持久化首次游玩里程碑与海域目标领取状态，确保一次性奖励不会重复发放。
- `src/assets_b64.js` 与 `src/_export_src.js` 是构建生成文件，不提交；运行 `python build_standalone.py` 可重新生成。

## 验证

```powershell
node tools/verify_phase1.mjs
node tools/verify_phase2.mjs
node tools/verify_phase3.mjs
node tools/verify_phase4.mjs
node tools/verify_phase5.mjs
node tools/verify_phase6.mjs
node tools/verify_no_portal.mjs
```

这些检查覆盖鱼类目录、地图解锁、地图目标、旧存档迁移、直接结算规则、首次游玩闭环、核心钓鱼手感、经济成长模拟、房屋与猫咪收益、局外帧率预算、移动端热区、素材加载策略、存档备份恢复和生命周期安全。

v0.3 已移除水下传送门与关联的海王追逐玩法。新增检查覆盖原入口位置通行和普通收线流程；构建后运行 `node tools/verify_no_portal.mjs --release`，同时验证试玩包不含已移除的运行模块和专用素材。
