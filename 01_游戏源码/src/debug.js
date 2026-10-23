/* ===== 调试面板 v2:Tab + 中文标签 + hover 高亮 + 顶部大按钮 ===== */
(function(){
  // ==================== 1. CSS ====================
  const css = document.createElement("style");
  css.textContent = [
    '#debugPanel{position:fixed;right:0;top:0;width:308px;height:100vh;box-sizing:border-box;',
    '  background:linear-gradient(180deg,rgba(8,30,46,.98) 0%,rgba(4,20,32,.98) 100%);',
    '  border-left:2px solid #2a5c7e;z-index:15;color:#cfeeff;font-size:11px;line-height:1.5;',
    '  overflow:hidden;display:none;flex-direction:column}',
    '#debugPanel.open{display:flex}',
    '#debugPanel *{box-sizing:border-box}',
    /* 头部 */
    '#dbgHead{flex:0 0 auto;display:flex;align-items:center;justify-content:space-between;',
    '  padding:9px 12px;background:rgba(6,24,38,.98);border-bottom:1px solid #2a5c7e}',
    '#dbgHead .ttl{font-size:13px;color:#7fe7ff;font-weight:bold;letter-spacing:1px}',
    '#dbgFold{background:#1a3850;border:1px solid #2a5c7e;color:#7fe7ff;border-radius:4px;',
    '  padding:2px 9px;font-size:12px;cursor:pointer;line-height:1}',
    '#debugPanel.folded{height:auto}',
    '#debugPanel.folded > *:not(#dbgHead){display:none!important}',
    /* 顶部快捷按钮排 */
    '#dbgQuickBar{flex:0 0 auto;display:grid;grid-template-columns:1fr 1fr;gap:6px;padding:8px 10px;',
    '  background:rgba(10,32,48,.7);border-bottom:1px solid #22506e}',
    '#dbgQuickBar .qbtn{background:#1a4568;color:#eaf6ff;border:1px solid #2a6e9e;border-radius:6px;',
    '  padding:9px 6px;font-size:11px;font-weight:bold;cursor:pointer;transition:all .12s;',
    '  display:flex;align-items:center;justify-content:center;gap:4px;user-select:none}',
    '#dbgQuickBar .qbtn:hover{background:#256a9c;border-color:#3f8fc8}',
    '#dbgQuickBar .qbtn.on{background:#2a7a3f;border-color:#4fcf70;color:#fff;box-shadow:0 0 8px rgba(79,207,112,.35)}',
    '#dbgQuickBar .qbtn.purple{background:#5b3c9e;border-color:#8560d0}',
    '#dbgQuickBar .qbtn.purple:hover{background:#7551bd}',
    '#dbgQuickBar .qbtn.green{background:#1e7a4a;border-color:#3fb075}',
    '#dbgQuickBar .qbtn.green:hover{background:#2fa066}',
    /* Tab 栏 */
    '#dbgTabs{flex:0 0 auto;display:flex;flex-wrap:wrap;background:rgba(6,24,38,.98);',
    '  border-bottom:1px solid #2a5c7e;padding:2px 4px}',
    '#dbgTabs .tab{flex:1 1 auto;text-align:center;padding:7px 4px;font-size:11px;color:#7fb8d4;cursor:pointer;',
    '  border-radius:4px 4px 0 0;user-select:none;white-space:nowrap;transition:all .12s;min-width:64px}',
    '#dbgTabs .tab:hover{color:#cfeeff;background:rgba(30,80,120,.3)}',
    '#dbgTabs .tab.active{color:#ffd966;border-bottom-color:#ffd966;background:rgba(80,60,20,.3)}',
    /* Tab 内容区 */
    '#dbgBody{flex:1 1 auto;overflow-y:auto;overflow-x:hidden;padding:8px 12px 12px}',
    '#dbgBody::-webkit-scrollbar{width:7px}',
    '#dbgBody::-webkit-scrollbar-thumb{background:#2a5c7e;border-radius:4px}',
    '#dbgBody .tab-pane{display:none}',
    '#dbgBody .tab-pane.active{display:block}',
    /* 组标题 */
    '#dbgBody h4{font-size:11px;color:#7fe7ff;margin:10px 0 6px;padding:4px 8px;',
    '  background:linear-gradient(90deg,rgba(20,60,90,.6) 0%,rgba(20,60,90,0) 100%);',
    '  border-left:3px solid #7fe7ff;letter-spacing:.5px}',
    '#dbgBody h4:first-child{margin-top:2px}',
    /* 行 */
    '#dbgBody .row{display:flex;align-items:center;gap:6px;margin-bottom:5px;padding:1px 2px;border-radius:3px;transition:background .12s}',
    '#dbgBody .row.hl{background:rgba(80,60,20,.35)}',
    '#dbgBody .row label{flex:0 0 78px;font-size:10.5px;color:#a8dbf0;cursor:default}',
    '#dbgBody .row input[type=range]{flex:1;margin:0;min-width:0;height:16px;accent-color:#ffd966}',
    '#dbgBody .row input[type=number]{flex:0 0 54px;width:54px;text-align:right;background:#0a2a3e;',
    '  color:#ffd966;border:1px solid #2a5c7e;border-radius:4px;font-size:10px;',
    '  font-family:monospace;padding:2px 3px}',
    '#dbgBody .row input[type=number]:focus{border-color:#ffd966;outline:none}',
    '#dbgBody .row select{background:#0a2a3e;color:#cfeeff;border:1px solid #2a5c7e;',
    '  border-radius:4px;font-size:10px;padding:2px;flex:1;min-width:0}',
    '#dbgBody .row input[type=color]{flex:1;height:22px;background:#0a2a3e;border:1px solid #2a5c7e;border-radius:4px;cursor:pointer}',
    '#dbgBody .row .btn{background:#234;color:#9fd2e8;border:1px solid #2a5c7e;border-radius:4px;',
    '  padding:3px 6px;font-size:10px;cursor:pointer;flex:1}',
    '#dbgBody .row .btn:hover{background:#2c5074;color:#cfeeff}',
    '#dbgBody .btn-row{display:flex;gap:5px;margin:6px 0}',
    '#dbgBody .btn-row button{flex:1;background:#235;color:#eaf6ff;border:1px solid #2a5c7e;',
    '  border-radius:4px;padding:5px;font-size:10.5px;cursor:pointer}',
    '#dbgBody .btn-row button:hover{background:#2c5074}',
    '#dbgBody .btn-row .danger{background:#5a2828;border-color:#8a3030;color:#fff}',
    '#dbgBody .btn-row .success{background:#2a5a3a;border-color:#3fa060;color:#fff}',
    '#dbgBody .hint{font-size:10px;color:#7fb8d4;padding:4px 6px;margin:4px 0;',
    '  background:rgba(0,0,0,.2);border-left:2px solid #7fb8d4;line-height:1.4;border-radius:3px}',
    /* 图片替换网格 */
    '#imgList .img-group{margin-bottom:10px}',
    '#imgList .img-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}',
    '#imgList .img-cell{background:rgba(10,32,48,.6);border:1px solid #22506e;border-radius:5px;',
    '  padding:4px;cursor:pointer;text-align:center;transition:all .12s;position:relative}',
    '#imgList .img-cell:hover{background:#1a4568;border-color:#3f8fc8;transform:translateY(-1px)}',
    '#imgList .img-cell.replaced{border-color:#4fcf70;box-shadow:0 0 4px rgba(79,207,112,.4)}',
    '#imgList .img-cell .thumb{width:100%;height:44px;background:#000;border-radius:3px;',
    '  background-size:contain;background-repeat:no-repeat;background-position:center;',
    '  display:flex;align-items:center;justify-content:center;font-size:20px;color:#4a6b80}',
    '#imgList .img-cell .lbl{font-size:9px;color:#cfeeff;margin-top:3px;',
    '  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;line-height:1.2}',
    '#imgList .img-cell .stat{position:absolute;top:2px;right:3px;font-size:10px}',
    /* 底部工具区 */
    '#dbgFoot{flex:0 0 auto;padding:8px 10px;background:rgba(6,24,38,.98);border-top:1px solid #2a5c7e}',
    '#dbgFoot .btn-row{display:flex;gap:6px;margin-bottom:4px}',
    '#dbgFoot button{flex:1;background:#1e5fa8;color:#fff;border:none;border-radius:4px;',
    '  padding:6px;font-size:10.5px;cursor:pointer;font-weight:bold}',
    '#dbgFoot button.reset{background:#5a2828}',
    '#dbgFoot #saverStatus{font-size:10px;color:#7fb8d4;line-height:1.3;margin-top:3px}'
  ].join('\n');
  document.head.appendChild(css);

  // ==================== 2. DOM ====================
  // 构造帮助函数,让 HTML 短一点
  const sliderRow = (id, label, min, max, step, val, hl) => `<div class="row"${hl?` data-hl="${hl}"`:''}><label>${label}</label>`
    +`<input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${val}"><span id="${id}v" style="display:none">${val}</span></div>`;
  const buttonRow = (id, label, hl) => `<div class="row"${hl?` data-hl="${hl}"`:''}><label>${label}</label>`
    +`<button id="${id}" class="btn">未开启</button></div>`;
  const colorRow = (id, label) => `<div class="row"><label>${label}</label>`
    +`<input type="color" id="${id}"></div>`;
  const selectRow = (id, label, options) => `<div class="row"><label>${label}</label>`
    +`<select id="${id}">${options}</select></div>`;

  const panelHtml = `
  <div id="debugPanel">
    <div id="dbgHead">
      <span class="ttl">🐟 调试面板</span>
      <button id="dbgFold">▾</button>
    </div>
    <div id="dbgQuickBar">
      <button id="scEditTgl" class="qbtn">⛰ 场景编辑</button>
      <button id="uiEditTgl" class="qbtn">🎨 UI 编辑</button>
      <button id="dbgLinkFile" class="qbtn purple">📁 关联源码</button>
      <button id="dbgExportHtml" class="qbtn green">📦 导出 H5</button>
    </div>
    <div id="dbgTabs">
      <div class="tab active" data-tab="visual">🌊 视觉</div>
      <div class="tab" data-tab="camera">🎥 镜头</div>
      <div class="tab" data-tab="game">🎮 数值</div>
      <div class="tab" data-tab="boat">🚤 船</div>
      <div class="tab" data-tab="scene">⛰ 场景</div>
      <div class="tab" data-tab="ui">🎨 UI</div>
      <div class="tab" data-tab="text">📝 文字</div>
      <div class="tab" data-tab="loading">⏳ 加载</div>
      <div class="tab" data-tab="images">🖼 图片</div>
    </div>
    <div id="dbgBody">
      <!-- ========= 视觉 ========= -->
      <div class="tab-pane active" data-pane="visual">
        <div class="hint">波浪、水下背景、海面过渡带的视觉参数。</div>
        <h4>🌊 波浪</h4>
        ${sliderRow('wvW','宽度',200,1400,20,540,'wave')}
        ${sliderRow('wvH','高度倍数',0.3,3.0,0.05,1.0,'wave')}
        ${sliderRow('wvY','纵向偏移',-1.5,0.5,0.02,-0.32,'wave')}
        ${sliderRow('wvS','动画速度',0,120,2,24,'wave')}
        <h4>🌌 水下背景</h4>
        ${sliderRow('bwT','起始 Y',100,600,5,215,'waterbg')}
        ${sliderRow('bwH','高度',500,2500,20,1500,'waterbg')}
        ${sliderRow('bwA','不透明度',0,1,0.05,1.0,'waterbg')}
        <h4>🌫 海面过渡带</h4>
        ${sliderRow('trC','中心 Y',-150,300,1,38,'transition')}
        ${sliderRow('trU','上宽',0,200,1,52,'transition')}
        ${sliderRow('trD','下宽',0,300,1,52,'transition')}
        ${sliderRow('trA','不透明度',0,1,0.02,0.42,'transition')}
        ${sliderRow('trH','色相',0,360,2,200,'transition')}
        ${sliderRow('trS','饱和',0,100,1,35,'transition')}
        ${sliderRow('trL','亮度',0,100,1,60,'transition')}
        <div class="row"><label>贴图切换</label><button id="trImgTgl" class="btn">未加载</button></div>
      </div>
      <!-- ========= 镜头 ========= -->
      <div class="tab-pane" data-pane="camera">
        <div class="hint">镜头缩放:船景(准备阶段)与水下(钓鱼)分开。Y 锚点 0=顶 1=底。</div>
        <h4>🎥 缩放</h4>
        ${sliderRow('zmB','船景缩放',1.0,2.5,0.05,1.65)}
        ${sliderRow('zmF','水下缩放',1.0,2.0,0.05,1.35)}
        <h4>📐 纵向锚点</h4>
        ${sliderRow('zmBY','船景 Y',0,1,0.02,0.4)}
        ${sliderRow('zmFY','水下 Y',0,1,0.02,0.4)}
      </div>
      <!-- ========= 游戏数值 ========= -->
      <div class="tab-pane" data-pane="game">
        <div class="hint">经济数值 · 鱼血 · 鱼线长度 · 海王参数。</div>
        <h4>💰 经济 / 位置</h4>
        ${sliderRow('gmCoin','金币爆撒数量',0.4,3,0.1,1)}
        ${sliderRow('gmBoat','船整体 X 偏移',-200,200,1,0)}
        ${sliderRow('gmRodX','鱼竿尖 X',0,1,0.002,0.946,'rodtip')}
        ${sliderRow('gmRodY','鱼竿尖 Y',0,1,0.002,0.697,'rodtip')}
        <h4>🐟 鱼类血量</h4>
        ${sliderRow('gmHpS','小鱼',1,30,1,1)}
        ${sliderRow('gmHpM','中鱼',1,30,1,2)}
        ${sliderRow('gmHpL','大鱼',1,40,1,3)}
        <h4>🎣 鱼线长度</h4>
        ${sliderRow('gmL0','铜钩',500,8000,50,2000)}
        ${sliderRow('gmL1','银钩',500,8000,50,2800)}
        ${sliderRow('gmL2','金钩',500,8000,50,3800)}
        ${sliderRow('gmL3','钻石钩',500,8000,50,5200)}
        <h4>👑 海王</h4>
        ${sliderRow('gmBossC','出现金币门槛',100,3000,50,700)}
        ${sliderRow('gmBossS','移动速度',40,400,5,150)}
        ${sliderRow('gmBossR','碰撞半径',40,300,5,130)}
      </div>
      <!-- ========= 船分层 ========= -->
      <div class="tab-pane" data-pane="boat">
        <div class="hint">船身/渔夫/鱼竿三部分独立布局。数值都是相对船宽/高的比例。</div>
        <div class="row" data-hl="boat"><label>示意点</label><button id="btMark" class="btn">关闭</button></div>
        <h4>⚓ 船体</h4>
        ${sliderRow('btBW','船宽',120,460,1,253,'boat')}
        ${sliderRow('btWF','船身吃水线',0.4,1.2,0.01,0.86,'boat')}
        <h4>🧑 渔夫</h4>
        ${sliderRow('btFS','人物大小',0.1,0.6,0.01,0.26,'fisher')}
        ${sliderRow('btFX','人 X',0,1,0.01,0.6,'fisher')}
        ${sliderRow('btFY','人脚底 Y',0,1.2,0.01,0.96,'fisher')}
        <h4>🎣 鱼竿</h4>
        ${sliderRow('btRS','鱼竿大小',0.2,1.2,0.01,0.64,'rod')}
        ${sliderRow('btRX','手持 X',0,1.2,0.01,0.72,'rod')}
        ${sliderRow('btRY','手持 Y',0,1.2,0.01,0.62,'rod')}
        ${sliderRow('btTX','竿尖 X(图上)',0,1,0.01,0.86,'rod')}
        ${sliderRow('btTY','竿尖 Y(图上)',0,1,0.01,0.08,'rod')}
        <h4>🎣 竿尖(渔夫图内比例)</h4>
        <div class="hint">鱼竿已合成进渔夫序列帧;竿尖=图内 0~1 比例位置,鱼线从这里射出。</div>
        ${sliderRow('btTipX','竿尖 X',0,1,0.005,0.88,'rodtip')}
        ${sliderRow('btTipY','竿尖 Y',0,1,0.005,0.08,'rodtip')}
        ${sliderRow('btHndX','手 X(可选)',0,1,0.005,0.65)}
        ${sliderRow('btHndY','手 Y(可选)',0,1,0.005,0.45)}
        <h4>🧑 渔夫动画状态机</h4>
        <div class="hint">上传精灵条到「🖼 图片」tab 的「渔夫状态机」组。大小走上面的「人物大小」。</div>
        ${selectRow('faState','预览状态','<option value="auto">🎮 自动(跟游戏)</option><option value="idle">💤 待机</option><option value="cast">🎯 开始钓鱼</option><option value="fishing">🎣 钓鱼中</option><option value="reel">🐟 收鱼</option>')}
        <div class="hint">精灵图 = 列(cols)×行(rows) 网格,按"从左到右、从上到下"顺序读。总帧数留 0 = 自动 cols×rows。</div>
        <h4>💤 待机(fisher_idle)</h4>
        ${sliderRow('faIdleC','列 cols',1,32,1,6)}
        ${sliderRow('faIdleR','行 rows',1,16,1,1)}
        ${sliderRow('faIdleN','总帧数(0=自动)',0,256,1,0)}
        ${sliderRow('faIdleF','帧率(fps)',1,30,1,8)}
        <h4>🎯 开始钓鱼(fisher_cast)</h4>
        ${sliderRow('faCastC','列 cols',1,32,1,5)}
        ${sliderRow('faCastR','行 rows',1,16,1,1)}
        ${sliderRow('faCastN','总帧数(0=自动)',0,256,1,0)}
        ${sliderRow('faCastF','帧率(fps)',1,30,1,14)}
        <h4>🎣 钓鱼中(fisher_fishing)</h4>
        ${sliderRow('faFishC','列 cols',1,32,1,6)}
        ${sliderRow('faFishR','行 rows',1,16,1,1)}
        ${sliderRow('faFishN','总帧数(0=自动)',0,256,1,0)}
        ${sliderRow('faFishF','帧率(fps)',1,30,1,10)}
        <h4>🐟 收鱼(fisher_reel)</h4>
        ${sliderRow('faReelC','列 cols',1,32,1,5)}
        ${sliderRow('faReelR','行 rows',1,16,1,1)}
        ${sliderRow('faReelN','总帧数(0=自动)',0,256,1,0)}
        ${sliderRow('faReelF','帧率(fps)',1,30,1,14)}
        <h4>🎯 竿尖逐帧标注</h4>
        <div class="hint">开启后:选状态 → 在画布上直接点竿尖位置,自动跳下一帧。标完的帧鱼线起点即时生效;没标的帧回退固定比例。</div>
        <div class="row"><label>标注模式</label><button id="tipMarkTgl" class="btn">关闭</button></div>
        ${selectRow('tipState','状态','<option value="idle">💤 待机</option><option value="cast">🎯 开始钓鱼</option><option value="fishing">🎣 钓鱼中</option><option value="reel">🐟 收鱼</option>')}
        ${sliderRow('tipFrame','当前帧',0,31,1,0)}
        <div class="row"><label>已标帧数</label><span id="tipCount" style="flex:1;color:#ffd966;font-family:monospace;font-size:10px">-</span></div>
        <div class="btn-row"><button id="tipClear" class="danger">🗑 清空该状态标注</button></div>
      </div>
      <!-- ========= 场景编辑 ========= -->
      <div class="tab-pane" data-pane="scene">
        <div class="hint">礁石/沉船布局。开启"⛰ 场景编辑"后画布可直接拖动。</div>
        ${selectRow('scSel','选中项','')}
        <div class="row"><label>状态</label><span id="scSelv" style="flex:1;color:#ffd966;font-family:monospace;font-size:10px">-</span></div>
        ${selectRow('scKey','图片类型','<option value="rock">rock</option><option value="rock_b">rock_b</option><option value="rock_c">rock_c</option><option value="rock_d">rock_d</option><option value="rock_e">rock_e</option><option value="rock_f">rock_f</option><option value="wreck">wreck</option>')}
        ${sliderRow('scX','X 坐标',-300,1200,1,0)}
        ${sliderRow('scY','Y 坐标',200,2400,1,0)}
        ${sliderRow('scW','宽度',40,700,2,200)}
        <div class="btn-row">
          <button id="scFlip">↔ 翻转</button>
          <button id="scAdd" class="success">＋ 添加</button>
          <button id="scDel" class="danger">🗑 删除</button>
        </div>
      </div>
      <!-- ========= UI/弹窗 ========= -->
      <div class="tab-pane" data-pane="ui">
        <div class="hint">按钮/HUD/弹窗坐标。开启"🎨 UI 编辑"后画布可拖动/角柄缩放。</div>
        ${selectRow('uiPage','弹窗页面','<option value="main">主界面</option><option value="upgrade">升级面板</option><option value="cta">CTA 终卡</option><option value="goal">目标弹窗</option><option value="settle">结算弹窗</option>')}
        ${selectRow('uiSel','选中元素','')}
        ${sliderRow('uiX','X 坐标',-400,560,1,0)}
        ${sliderRow('uiY','Y 坐标',-400,980,1,0)}
        ${sliderRow('uiW','宽',20,540,1,96)}
        ${sliderRow('uiH','高',0,900,1,0)}
      </div>
      <!-- ========= 加载界面 ========= -->
      <div class="tab-pane" data-pane="loading">
        <div class="hint">点击本 tab 时,画面强制显示加载界面预览(进度锁定 50%);切到其他 tab 恢复游戏。</div>
        <h4>🪧 标题木牌</h4>
        ${sliderRow('ldTY','Y 坐标',-80,300,1,28)}
        ${sliderRow('ldTW','宽度',180,520,1,350)}
        ${sliderRow('ldTH','高度',100,320,1,220)}
        <h4>🪵 木码头</h4>
        ${sliderRow('ldPX','X 坐标',-400,300,1,-112)}
        ${sliderRow('ldPY','Y 坐标',180,760,1,430)}
        ${sliderRow('ldPW','宽度',220,900,1,570)}
        <h4>🐱 猫咪</h4>
        ${sliderRow('ldCX','X 坐标',-100,500,1,130)}
        ${sliderRow('ldCY','Y 坐标',100,700,1,330)}
        ${sliderRow('ldCS','尺寸',100,500,1,280)}
        <h4>📊 进度条</h4>
        ${sliderRow('ldBX','X 坐标',0,480,1,65)}
        ${sliderRow('ldBY','Y 坐标',500,920,1,755)}
        ${sliderRow('ldBW','宽度',120,520,1,410)}
        ${sliderRow('ldBH','高度',28,100,1,58)}
        ${sliderRow('ldMY','状态文字 Y',600,940,1,842)}
        ${sliderRow('ldTipY','提示文字 Y',650,950,1,892)}
      </div>
      <!-- ========= 图片替换 ========= -->
      <div class="tab-pane" data-pane="images">
        <div class="hint">点某张图 → 选本地文件即时替换。仅本次会话有效,刷新后恢复。缩略图上有 ✅ = 已加载。</div>
        <div class="btn-row">
          <button id="imgReloadAll">↻ 恢复默认</button>
        </div>
        <div id="imgList"></div>
      </div>
      <!-- ========= 文字 ========= -->
      <div class="tab-pane" data-pane="text">
        <div class="hint">所有程序绘制文字的样式。选一个文字项后调下方参数。</div>
        ${selectRow('txSel','选择文字项','')}
        ${sliderRow('txSize','字号',8,48,1,18)}
        ${sliderRow('txDX','位移 X',-120,120,1,0)}
        ${sliderRow('txDY','位移 Y',-120,120,1,0)}
        ${sliderRow('txSW','描边粗',0,10,0.5,0)}
        ${colorRow('txFill','填充色')}
        ${colorRow('txStroke','描边色')}
      </div>
    </div>
    <div id="dbgFoot">
      <div class="btn-row">
        <button id="dbgExport">📋 复制参数</button>
        <button id="dbgReset" class="reset">↺ 重置</button>
      </div>
      <div id="saverStatus">检测 saver…</div>
    </div>
  </div>`;
  const holder = document.createElement("div"); holder.innerHTML = panelHtml;
  while(holder.firstChild) document.body.appendChild(holder.firstChild);

  // ==================== 3. Tab 切换 ====================
  const tabs = document.querySelectorAll("#dbgTabs .tab");
  const panes = document.querySelectorAll("#dbgBody .tab-pane");
  tabs.forEach(t=>t.addEventListener("click",()=>{
    tabs.forEach(x=>x.classList.remove("active"));
    panes.forEach(x=>x.classList.remove("active"));
    t.classList.add("active");
    document.querySelector(`#dbgBody [data-pane="${t.dataset.tab}"]`)?.classList.add("active");
    // 切 tab 时也重置高亮
    window.__DBG_HL=null;
  }));

  // ==================== 4. Hover 高亮系统 ====================
  // 拖/聚焦某滑块 → 记录 target → drawDebugHighlights 在画布上画对应位置
  window.__DBG_HL = null;
  const setHl=(name)=>{ window.__DBG_HL={name, t:performance.now()+2000}; };
  const clearHl=()=>{ window.__DBG_HL=null; };
  document.querySelectorAll("#dbgBody .row[data-hl]").forEach(row=>{
    const name=row.dataset.hl;
    row.addEventListener("mouseenter",()=>{ row.classList.add("hl"); setHl(name); });
    row.addEventListener("mouseleave",()=>{ row.classList.remove("hl"); });
    // 也在获得焦点时高亮(键盘可达)
    row.querySelectorAll("input,button,select").forEach(inp=>{
      inp.addEventListener("focus",()=>{ row.classList.add("hl"); setHl(name); });
      inp.addEventListener("blur",()=>{ row.classList.remove("hl"); });
      inp.addEventListener("input",()=>{ setHl(name); }); // 拖滑块时刷新时间
    });
  });
  // 挂 hook 到画布最后画一层高亮
  window.drawDebugHighlights=function(){
    const hl=window.__DBG_HL; if(!hl) return;
    if(performance.now()>hl.t){ window.__DBG_HL=null; return; }
    const ctx=window.ctx; if(!ctx) return;
    const flash=(Math.sin(performance.now()/120)*0.5+0.5)*0.3+0.5;
    ctx.save();
    ctx.strokeStyle=`rgba(255,217,102,${flash})`; ctx.fillStyle=`rgba(255,217,102,0.14)`;
    ctx.lineWidth=3; ctx.setLineDash([8,4]);
    const drawBox=(x,y,w,h)=>{ ctx.fillRect(x,y,w,h); ctx.strokeRect(x,y,w,h); };
    const drawDot=(x,y,r=12)=>{ ctx.beginPath(); ctx.arc(x,y,r,0,7); ctx.fill(); ctx.stroke(); };
    // 依据 hl.name 定位
    if(hl.name==="wave"){ drawBox(0,190,VW,60); ctx.fillStyle="#ffd966"; ctx.font="bold 12px sans-serif"; ctx.fillText("波浪层",8,208); }
    else if(hl.name==="waterbg"){
      const c=window.WATER_BG_CFG||{top:215,height:1500};
      // 画在世界坐标 → 屏幕坐标转换
      const sy=(c.top-camY)*curZoom; drawBox(0,sy,VW,Math.min(VH-sy,c.height*curZoom)); }
    else if(hl.name==="transition"){
      const c=window.WAVE_TRANS_CFG||{yCenter:38,hUp:52,hDown:52};
      const sy=((205+c.yCenter)-camY)*curZoom; drawBox(0,sy-c.hUp*curZoom,VW,(c.hUp+c.hDown)*curZoom); }
    else if(hl.name==="rodtip"){
      if(typeof rodTipX==="number"){ const sx=(rodTipX-camX)*curZoom, sy=(rodTipY-camY)*curZoom; drawDot(sx,sy,14); } }
    else if(hl.name==="boat"){
      // 船身框:以 rodTipX 附近为中心
      const B=window.BOAT_CFG||{}, bw=(B.boatW||253)*curZoom, bh=bw*0.6;
      const cx=(rodTipX?(rodTipX-camX)*curZoom:VW/2), cy=(WATER_Y-camY)*curZoom;
      drawBox(cx-bw/2,cy-bh*0.4,bw,bh); }
    else if(hl.name==="fisher"){
      const B=window.BOAT_CFG||{}, bw=(B.boatW||253)*curZoom;
      const cx=(rodTipX?(rodTipX-camX)*curZoom:VW/2)-bw*(0.5-(B.fX||0.6));
      const cy=(WATER_Y-camY)*curZoom-bw*0.4+bw*0.6*(B.fY||0.96);
      const sz=(B.fisherScale||0.26)*bw; drawBox(cx-sz*0.4,cy-sz*1.8,sz*0.8,sz*1.8); }
    else if(hl.name==="rod"){
      const B=window.BOAT_CFG||{}, bw=(B.boatW||253)*curZoom;
      const cx=(rodTipX?(rodTipX-camX)*curZoom:VW/2)-bw*(0.5-(B.rX||0.72));
      const cy=(WATER_Y-camY)*curZoom-bw*0.4+bw*0.6*(B.rY||0.62);
      const sz=(B.rodScale||0.64)*bw; drawBox(cx-sz*0.1,cy-sz*1.5,sz*0.2,sz*1.5); }
    ctx.setLineDash([]); ctx.restore();
  };

  // ==================== 5. 以下是原有 debug.js 逻辑,保持不变 ====================
{
  const STG_KEY="seaking_debug_cfg_v1";
  try{
    const saved=JSON.parse(localStorage.getItem(STG_KEY)||"{}");
    if(saved.WAVE_CFG)Object.assign(WAVE_CFG,saved.WAVE_CFG);
    if(saved.WATER_BG_CFG)Object.assign(WATER_BG_CFG,saved.WATER_BG_CFG);
    if(saved.ZOOM_CFG)Object.assign(ZOOM_CFG,saved.ZOOM_CFG);
    if(saved.WAVE_TRANS_CFG&&window.WAVE_TRANS_CFG){
      const s=saved.WAVE_TRANS_CFG;
      if(s.yTop!=null&&s.yBot!=null&&s.yCenter==null){
        const yT=+s.yTop, yB=+s.yBot;
        s.yCenter=Math.round((yT+yB)/2);
        s.hUp=Math.max(0,Math.round((yB-yT)/2));
        s.hDown=Math.max(0,Math.round((yB-yT)/2));
        delete s.yTop; delete s.yBot;
      }
      Object.assign(WAVE_TRANS_CFG,s);
    }
    if(Array.isArray(saved.SCENERY_CFG)&&window.SCENERY_CFG){
      window.SCENERY_CFG.length=0;
      for(const it of saved.SCENERY_CFG) window.SCENERY_CFG.push(it);
    }
    if(saved.GAME_CFG&&window.GAME_CFG){
      const g=saved.GAME_CFG;
      if(g.coinScale!=null)GAME_CFG.coinScale=g.coinScale;
      if(g.boatDX!=null)GAME_CFG.boatDX=g.boatDX;
      if(g.rodTipFx!=null)GAME_CFG.rodTipFx=g.rodTipFx;
      if(g.rodTipFy!=null)GAME_CFG.rodTipFy=g.rodTipFy;
      if(g.bossCoins!=null)GAME_CFG.bossCoins=g.bossCoins;
      if(g.bossSpd!=null)GAME_CFG.bossSpd=g.bossSpd;
      if(g.bossR!=null)GAME_CFG.bossR=g.bossR;
      if(g.fishHp)Object.assign(GAME_CFG.fishHp,g.fishHp);
      // 大鱼 HP 硬上限 3:旧 localStorage 里可能残留 5/6(设计返工前的老默认),
      // 之前用一次性标记迁移不牢靠 —— localStorage 里的旧值没被写回,重启后又被 Object.assign 覆盖回来。
      // 直接每次加载都硬钳到 ≤3,并把矫正后的值回写 localStorage 让 debug 面板拿到一致状态。
      if(GAME_CFG.fishHp.l>3){
        GAME_CFG.fishHp.l=3;
        try{
          const cur=JSON.parse(localStorage.getItem(STG_KEY)||"{}");
          if(cur.GAME_CFG&&cur.GAME_CFG.fishHp){ cur.GAME_CFG.fishHp.l=3; localStorage.setItem(STG_KEY,JSON.stringify(cur)); }
        }catch(e){}
      }
      if(Array.isArray(g.lineDist))for(let i=0;i<g.lineDist.length&&i<GAME_CFG.lineDist.length;i++)GAME_CFG.lineDist[i]=g.lineDist[i];
      if(window.applyFishHp)window.applyFishHp();
    }
    if(saved.BOAT_CFG&&window.BOAT_CFG){ Object.assign(window.BOAT_CFG,saved.BOAT_CFG); }
    if(saved.TEXT_CFG&&window.TEXT_CFG){ for(const k in saved.TEXT_CFG){ if(window.TEXT_CFG[k]) Object.assign(window.TEXT_CFG[k],saved.TEXT_CFG[k]); } }
    // 一次性迁移:coin 数字从「金黄+dx16」→「白+dx6」(旧 localStorage 恢复后强制覆盖成新默认)
    if(window.TEXT_CFG&&window.TEXT_CFG.coin){
      const c=window.TEXT_CFG.coin;
      if(c.fill==="#ffd966"){ c.fill="#ffffff"; }
      if(c.dx===16){ c.dx=6; }
    }
    // 一次性迁移:upLv 字号 14→28→37 递增,只要遇到旧值就升到 37
    if(window.TEXT_CFG&&window.TEXT_CFG.upLv){
      const c=window.TEXT_CFG.upLv;
      if(c.size===14||c.size===28) c.size=37;
    }
    if(saved.UI_CFG&&window.UI_CFG){
      for(const k in saved.UI_CFG){ if(UI_CFG[k]) Object.assign(UI_CFG[k],saved.UI_CFG[k]); }
      if(window.applyUiLayout)window.applyUiLayout();
    }
    if(saved.PANEL_CFG&&window.PANEL_CFG){
      for(const k in saved.PANEL_CFG){ if(PANEL_CFG[k]) Object.assign(PANEL_CFG[k],saved.PANEL_CFG[k]); }
      if(window.applyPanelLayout)window.applyPanelLayout();
    }
    if(saved.PANEL_UI&&window.PANEL_UI){ Object.assign(window.PANEL_UI,saved.PANEL_UI); }
    if(saved.FISHER_ANIM&&window.FISHER_ANIM){
      for(const st in saved.FISHER_ANIM){ if(window.FISHER_ANIM[st]) Object.assign(window.FISHER_ANIM[st], saved.FISHER_ANIM[st]); }
    }
    if(saved.FISHER_TIP&&window.FISHER_TIP){
      for(const st in saved.FISHER_TIP){ window.FISHER_TIP[st]=saved.FISHER_TIP[st]; }
    }
    if(saved.LOADING_UI&&window.LOADING_UI) Object.assign(window.LOADING_UI, saved.LOADING_UI);
  }catch(e){}
  let fileHandle=null;
  const idbReady=new Promise((res,rej)=>{
    const r=indexedDB.open("seakingDebug",1);
    r.onupgradeneeded=()=>r.result.createObjectStore("kv");
    r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);
  }).catch(()=>null);
  const idbGet=async k=>{const db=await idbReady;if(!db)return null;
    return new Promise(res=>{const op=db.transaction("kv","readonly").objectStore("kv").get(k);
      op.onsuccess=()=>res(op.result);op.onerror=()=>res(null);});};
  const idbPut=async(k,v)=>{const db=await idbReady;if(!db)return;
    db.transaction("kv","readwrite").objectStore("kv").put(v,k);};

  const buildCfgBlock=()=>{
    const f=(n)=>(Number.isInteger(n)?n:parseFloat(n));
    return "/*<<DEBUG_CFG_START>>*/\n"+
      "window.WAVE_CFG={\n"+
      "  width:"+f(WAVE_CFG.width)+",\n"+
      "  heightScale:"+f(WAVE_CFG.heightScale)+",\n"+
      "  yOffset:"+f(WAVE_CFG.yOffset)+",\n"+
      "  speed:"+f(WAVE_CFG.speed)+"\n"+
      "};\n"+
      "window.WATER_BG_CFG={\n"+
      "  top:"+f(WATER_BG_CFG.top)+",\n"+
      "  height:"+f(WATER_BG_CFG.height)+",\n"+
      "  alpha:"+f(WATER_BG_CFG.alpha)+"\n"+
      "};\n"+
      "window.ZOOM_CFG={\n"+
      "  boat:"+f(ZOOM_CFG.boat)+",\n"+
      "  fish:"+f(ZOOM_CFG.fish)+",\n"+
      "  boatY:"+f(ZOOM_CFG.boatY)+",\n"+
      "  fishY:"+f(ZOOM_CFG.fishY)+"\n"+
      "};\n"+
      "window.WAVE_TRANS_CFG={\n"+
      "  yCenter:"+f(WAVE_TRANS_CFG.yCenter)+",\n"+
      "  hUp:"+f(WAVE_TRANS_CFG.hUp)+",\n"+
      "  hDown:"+f(WAVE_TRANS_CFG.hDown)+",\n"+
      "  alpha:"+f(WAVE_TRANS_CFG.alpha)+",\n"+
      "  hue:"+f(WAVE_TRANS_CFG.hue)+",\n"+
      "  sat:"+f(WAVE_TRANS_CFG.sat)+",\n"+
      "  light:"+f(WAVE_TRANS_CFG.light)+",\n"+
      "  imageKey:"+JSON.stringify(WAVE_TRANS_CFG.imageKey)+"\n"+
      "};\n"+
      "window.SCENERY_CFG="+(window.SCENERY_CFG
        ? "[\n"+window.SCENERY_CFG.map(it=>"  "+JSON.stringify(it)).join(",\n")+"\n]"
        : "[]"
      )+";\n"+
      "window.GAME_CFG="+(window.GAME_CFG?JSON.stringify(window.GAME_CFG):"{}")+";\n"+
      "window.BOAT_CFG="+(window.BOAT_CFG?JSON.stringify(window.BOAT_CFG):"{}")+";\n"+
      "window.TEXT_CFG="+(window.TEXT_CFG?JSON.stringify(window.TEXT_CFG):"{}")+";\n"+
      "window.UI_CFG="+(window.UI_CFG?JSON.stringify(window.UI_CFG):"{}")+";\n"+
      "window.PANEL_CFG="+(window.PANEL_CFG?JSON.stringify(window.PANEL_CFG):"{}")+";\n"+
      "window.PANEL_UI="+(window.PANEL_UI?JSON.stringify(window.PANEL_UI):"{}")+";\n"+
      "window.FISHER_ANIM="+(window.FISHER_ANIM?JSON.stringify(window.FISHER_ANIM):"{}")+";\n"+
      "window.FISHER_TIP="+(window.FISHER_TIP?JSON.stringify(window.FISHER_TIP):"{}")+";\n"+
      "/*<<DEBUG_CFG_END>>*/";
  };
  const writeToSource=async()=>{
    if(!fileHandle)return false;
    try{
      const perm=await fileHandle.queryPermission({mode:"readwrite"});
      if(perm!=="granted"){
        if((await fileHandle.requestPermission({mode:"readwrite"}))!=="granted")return false;
      }
      const file=await fileHandle.getFile();
      let src=await file.text();
      const newBlock=buildCfgBlock();
      const re=/\/\*<<DEBUG_CFG_START>>\*\/[\s\S]*?\/\*<<DEBUG_CFG_END>>\*\//;
      if(!re.test(src))return false;
      src=src.replace(re,newBlock);
      const w=await fileHandle.createWritable();
      await w.write(src);await w.close();
      return true;
    }catch(e){console.warn("[FS] write failed",e);return false;}
  };

  let savePending=null;
  const saveCfg=()=>{
    try{
      localStorage.setItem(STG_KEY,JSON.stringify({WAVE_CFG,WATER_BG_CFG,ZOOM_CFG,WAVE_TRANS_CFG:window.WAVE_TRANS_CFG,SCENERY_CFG:window.SCENERY_CFG,GAME_CFG:window.GAME_CFG,BOAT_CFG:window.BOAT_CFG,TEXT_CFG:window.TEXT_CFG,UI_CFG:window.UI_CFG,PANEL_CFG:window.PANEL_CFG,PANEL_UI:window.PANEL_UI,FISHER_ANIM:window.FISHER_ANIM,FISHER_TIP:window.FISHER_TIP,LOADING_UI:window.LOADING_UI}));
    }catch(e){}
    if(savePending)clearTimeout(savePending);
    savePending=setTimeout(writeToSource,250);
  };

  const panel=$("debugPanel");
  const noDebug=/[?&]nodebug/.test(location.search);
  if(!noDebug)panel.classList.add("open");

  $("dbgFold").onclick=()=>{
    const folded=panel.classList.toggle("folded");
    $("dbgFold").textContent=folded?"▸":"▾";
  };

  // 通用绑定
  const bindRange=(id,target,key,vid,fmt,after)=>{
    const el=$(id), span=$(vid);
    if(!el)return;
    el.value=target[key];
    if(span)span.textContent=fmt?fmt(target[key]):target[key];
    el.oninput=()=>{
      const v=parseFloat(el.value);
      target[key]=v;
      if(span)span.textContent=fmt?fmt(v):v;
      if(after)after(v);
      saveCfg();
    };
  };
  bindRange("wvW",WAVE_CFG,"width","wvWv");
  bindRange("wvH",WAVE_CFG,"heightScale","wvHv",v=>v.toFixed(2));
  bindRange("wvY",WAVE_CFG,"yOffset","wvYv",v=>v.toFixed(2));
  bindRange("wvS",WAVE_CFG,"speed","wvSv");
  bindRange("bwT",WATER_BG_CFG,"top","bwTv");
  bindRange("bwH",WATER_BG_CFG,"height","bwHv");
  bindRange("bwA",WATER_BG_CFG,"alpha","bwAv",v=>v.toFixed(2));
  bindRange("zmB",ZOOM_CFG,"boat","zmBv",v=>v.toFixed(2));
  bindRange("zmF",ZOOM_CFG,"fish","zmFv",v=>v.toFixed(2));
  bindRange("zmBY",ZOOM_CFG,"boatY","zmBYv",v=>v.toFixed(2));
  bindRange("zmFY",ZOOM_CFG,"fishY","zmFYv",v=>v.toFixed(2));
  if(window.WAVE_TRANS_CFG){
    bindRange("trC",WAVE_TRANS_CFG,"yCenter","trCv");
    bindRange("trU",WAVE_TRANS_CFG,"hUp","trUv");
    bindRange("trD",WAVE_TRANS_CFG,"hDown","trDv");
    bindRange("trA",WAVE_TRANS_CFG,"alpha","trAv",v=>v.toFixed(2));
    bindRange("trH",WAVE_TRANS_CFG,"hue","trHv");
    bindRange("trS",WAVE_TRANS_CFG,"sat","trSv");
    bindRange("trL",WAVE_TRANS_CFG,"light","trLv");
    const trBtn=$("trImgTgl");
    const updateTrBtn=()=>{
      const k=WAVE_TRANS_CFG.imageKey;
      const loaded=k&&window.IMG&&IMG[k];
      if(loaded){trBtn.textContent="🖼 用图: "+k;trBtn.style.color="#7fffaa";}
      else if(k){trBtn.textContent="⚠ "+k+" 未加载(用渐变)";trBtn.style.color="#ffaa66";}
      else{trBtn.textContent="渐变模式(无图)";trBtn.style.color="#9fd2e8";}
    };
    trBtn.onclick=()=>{
      WAVE_TRANS_CFG.imageKey = WAVE_TRANS_CFG.imageKey ? null : "wave_transition";
      updateTrBtn();
      saveCfg();
    };
    updateTrBtn();
    setTimeout(updateTrBtn,800);
  }

  if(window.GAME_CFG){
    const G=window.GAME_CFG;
    const syncHp=()=>{ if(window.applyFishHp)window.applyFishHp(); };
    bindRange("gmCoin",G,"coinScale","gmCoinv",v=>v.toFixed(1));
    bindRange("gmBoat",G,"boatDX","gmBoatv");
    bindRange("gmRodX",G,"rodTipFx","gmRodXv",v=>v.toFixed(3));
    bindRange("gmRodY",G,"rodTipFy","gmRodYv",v=>v.toFixed(3));
    bindRange("gmHpS",G.fishHp,"s","gmHpSv",null,syncHp);
    bindRange("gmHpM",G.fishHp,"m","gmHpMv",null,syncHp);
    bindRange("gmHpL",G.fishHp,"l","gmHpLv",null,syncHp);
    bindRange("gmL0",G.lineDist,0,"gmL0v");
    bindRange("gmL1",G.lineDist,1,"gmL1v");
    bindRange("gmL2",G.lineDist,2,"gmL2v");
    bindRange("gmL3",G.lineDist,3,"gmL3v");
    bindRange("gmBossC",G,"bossCoins","gmBossCv");
    bindRange("gmBossS",G,"bossSpd","gmBossSv");
    bindRange("gmBossR",G,"bossR","gmBossRv");
  }

  // 加载界面参数(LOADING_UI)
  if(window.LOADING_UI){
    const L=window.LOADING_UI;
    bindRange("ldTY",L,"titleY","ldTYv");
    bindRange("ldTW",L,"titleW","ldTWv");
    bindRange("ldTH",L,"titleH","ldTHv");
    bindRange("ldPX",L,"pierX","ldPXv");
    bindRange("ldPY",L,"pierY","ldPYv");
    bindRange("ldPW",L,"pierW","ldPWv");
    bindRange("ldCX",L,"catX","ldCXv");
    bindRange("ldCY",L,"catY","ldCYv");
    bindRange("ldCS",L,"catSize","ldCSv");
    bindRange("ldBX",L,"barX","ldBXv");
    bindRange("ldBY",L,"barY","ldBYv");
    bindRange("ldBW",L,"barW","ldBWv");
    bindRange("ldBH",L,"barH","ldBHv");
    bindRange("ldMY",L,"messageY","ldMYv");
    bindRange("ldTipY",L,"tipY","ldTipYv");
  }
  // 加载 tab 激活 → 打开预览(进度锁 50%);切走 → 关闭
  document.querySelectorAll("#dbgTabs .tab").forEach(t=>{
    t.addEventListener("click",()=>{ window.__loadingPreview = (t.dataset.tab==="loading"); });
  });

  if(window.BOAT_CFG){
    const Bc=window.BOAT_CFG, f2=v=>v.toFixed(2);
    bindRange("btBW",Bc,"boatW","btBWv");
    bindRange("btWF",Bc,"waterFrac","btWFv",f2);
    const $bm=$("btMark");
    if($bm){ const upd=()=>{ $bm.textContent=window.BOAT_MARK?"🟢 开(竿尖/手)":"关闭"; $bm.style.color=window.BOAT_MARK?"#7fffaa":"#9fd2e8"; };
      $bm.onclick=()=>{ window.BOAT_MARK=!window.BOAT_MARK; upd(); }; upd(); }
    bindRange("btFS",Bc,"fisherScale","btFSv",f2);
    bindRange("btFX",Bc,"fX","btFXv",f2);
    bindRange("btFY",Bc,"fY","btFYv",f2);
    bindRange("btRS",Bc,"rodScale","btRSv",f2);
    bindRange("btRX",Bc,"rX","btRXv",f2);
    bindRange("btRY",Bc,"rY","btRYv",f2);
    bindRange("btTX",Bc,"rodTipFx","btTXv",f2);
    bindRange("btTY",Bc,"rodTipFy","btTYv",f2);
    // 渔夫合成图的竿尖/手 内比例(仅在 fisher 序列帧模式下用)
    if(Bc.fisherTipFx==null) Bc.fisherTipFx=0.88;
    if(Bc.fisherTipFy==null) Bc.fisherTipFy=0.08;
    if(Bc.fisherHandFx==null) Bc.fisherHandFx=0.65;
    if(Bc.fisherHandFy==null) Bc.fisherHandFy=0.45;
    bindRange("btTipX",Bc,"fisherTipFx","btTipXv",f2);
    bindRange("btTipY",Bc,"fisherTipFy","btTipYv",f2);
    bindRange("btHndX",Bc,"fisherHandFx","btHndXv",f2);
    bindRange("btHndY",Bc,"fisherHandFy","btHndYv",f2);
  }

  // ===== 渔夫动画状态机 =====
  if(window.FISHER_ANIM){
    const A=window.FISHER_ANIM;
    let faRebuild=null; // 改行列/帧数 → 防抖重切逐帧 canvas 缓存
    const bindCF=(id,st,field)=>{
      const el=$(id); if(!el)return;
      el.value=A[st][field];
      el.oninput=()=>{
        A[st][field]=parseFloat(el.value)|0;
        if(field==="cols"&&A[st].cols<1)A[st].cols=1;
        if(field==="rows"&&A[st].rows<1)A[st].rows=1;
        saveCfg();
        if(typeof warmFisherFrames==="function"){
          if(faRebuild)clearTimeout(faRebuild);
          faRebuild=setTimeout(warmFisherFrames,300);
        }
      };
    };
    bindCF("faIdleC","idle","cols");   bindCF("faIdleR","idle","rows"); bindCF("faIdleN","idle","frames"); bindCF("faIdleF","idle","fps");
    bindCF("faCastC","cast","cols");   bindCF("faCastR","cast","rows"); bindCF("faCastN","cast","frames"); bindCF("faCastF","cast","fps");
    bindCF("faFishC","fishing","cols");bindCF("faFishR","fishing","rows"); bindCF("faFishN","fishing","frames"); bindCF("faFishF","fishing","fps");
    bindCF("faReelC","reel","cols");   bindCF("faReelR","reel","rows"); bindCF("faReelN","reel","frames"); bindCF("faReelF","reel","fps");
    // 预览状态:选中非 auto 时锁定 fisherFsm.state 不让游戏自动切
    const $fs=$("faState");
    if($fs){
      $fs.onchange=()=>{
        const v=$fs.value;
        if(v==="auto"){ window.FISHER_PREVIEW=null; }
        else{
          window.FISHER_PREVIEW=v;
          if(typeof fisherFsm!=="undefined"){ fisherFsm.state=v; fisherFsm.t=0; }
        }
      };
    }

    // —— 竿尖逐帧标注 ——
    if(window.FISHER_TIP){
      const $tgl=$("tipMarkTgl"), $st=$("tipState"), $fr=$("tipFrame"), $cnt=$("tipCount"), $clr=$("tipClear");
      const curState=()=>(($st&&$st.value)||"idle");
      const updCnt=()=>{
        if(!$cnt)return;
        const tab=window.FISHER_TIP[curState()]||[];
        const n=tab.filter(Boolean).length;
        const ed=window.FISHER_TIP_EDIT;
        $cnt.textContent=n+" 帧已标"+(ed?(" · 第 "+ed.frame+" 帧 "+(tab[ed.frame]?"✅":"⬜")):"");
      };
      const setEd=(on)=>{
        window.FISHER_TIP_EDIT = on?{state:curState(), frame:parseInt(($fr&&$fr.value)||"0",10)||0}:null;
        if($tgl){ $tgl.textContent=on?"🟢 点画布标竿尖":"关闭"; $tgl.style.color=on?"#7fffaa":"#9fd2e8"; }
        updCnt();
      };
      if($tgl) $tgl.onclick=()=>setEd(!window.FISHER_TIP_EDIT);
      if($st) $st.onchange=()=>{
        if(window.FISHER_TIP_EDIT){
          window.FISHER_TIP_EDIT.state=curState();
          window.FISHER_TIP_EDIT.frame=0;
          if($fr){ $fr.value=0; }
        }
        updCnt();
      };
      if($fr) $fr.addEventListener("input",()=>{ if(window.FISHER_TIP_EDIT) window.FISHER_TIP_EDIT.frame=parseInt($fr.value,10)||0; updCnt(); });
      // 画布点击 → 记录挂点(capture 阶段拦截,不透传给游戏操控)
      const cvsEl=document.getElementById("game");
      cvsEl.addEventListener("pointerdown",(e)=>{
        const ed=window.FISHER_TIP_EDIT; if(!ed) return;
        const R=window.__FISHER_RECT; if(!R) return;
        e.stopPropagation(); e.preventDefault();
        const rc=cvsEl.getBoundingClientRect();
        const wx=(e.clientX-rc.left)/rc.width*(VW/curZoom)+camX;
        const wy=(e.clientY-rc.top)/rc.height*(VH/curZoom)+camY;
        const fx=Math.max(0,Math.min(1,(wx-R.L)/R.w));
        const fy=Math.max(0,Math.min(1,(wy-R.T)/R.h));
        const tab=window.FISHER_TIP[ed.state]||(window.FISHER_TIP[ed.state]=[]);
        tab[ed.frame]={fx:Math.round(fx*1000)/1000, fy:Math.round(fy*1000)/1000};
        ed.frame++;                          // 自动跳下一帧,连续点完整个状态
        if($fr){ $fr.value=ed.frame; }
        updCnt(); saveCfg();
      },true);
      if($clr) $clr.onclick=()=>{
        if(confirm("清空「"+curState()+"」状态的所有竿尖标注?")){
          window.FISHER_TIP[curState()]=[];
          updCnt(); saveCfg();
        }
      };
      // 画布 overlay:渔夫框 + 当前帧挂点十字(screen 空间,世界坐标换算)
      window.drawTipMarkOverlay=function(){
        const ed=window.FISHER_TIP_EDIT; if(!ed) return;
        const R=window.__FISHER_RECT; if(!R) return;
        const sx=w=>(w-camX)*curZoom, sy=h=>(h-camY)*curZoom;
        ctx.save();
        ctx.strokeStyle="rgba(127,231,255,.9)"; ctx.lineWidth=1.5; ctx.setLineDash([6,4]);
        ctx.strokeRect(sx(R.L),sy(R.T),R.w*curZoom,R.h*curZoom);
        ctx.setLineDash([]);
        const tab=window.FISHER_TIP[ed.state]||[], tp=tab[ed.frame];
        if(tp){
          const px=sx(R.L+R.w*tp.fx), py=sy(R.T+R.h*tp.fy);
          ctx.strokeStyle="#ffd966"; ctx.lineWidth=2;
          ctx.beginPath(); ctx.moveTo(px-10,py); ctx.lineTo(px+10,py); ctx.moveTo(px,py-10); ctx.lineTo(px,py+10); ctx.stroke();
          ctx.beginPath(); ctx.arc(px,py,5,0,7); ctx.stroke();
        }
        ctx.font="bold 13px sans-serif"; ctx.fillStyle="#ffd966"; ctx.textAlign="left";
        ctx.fillText("标注: "+ed.state+" 第 "+ed.frame+" 帧"+(tp?" ✅":" — 点竿尖位置"), sx(R.L), sy(R.T)-8);
        ctx.restore();
      };
      updCnt();
    }
  }

  if(window.TEXT_CFG){
    const T2=window.TEXT_CFG, keys=Object.keys(T2); let tsel=keys[0];
    const $ts=$("txSel"),$tsz=$("txSize"),$tszv=$("txSizev"),$tdx=$("txDX"),$tdxv=$("txDXv"),
          $tdy=$("txDY"),$tdyv=$("txDYv"),$tsw=$("txSW"),$tswv=$("txSWv"),$tf=$("txFill"),$tst=$("txStroke");
    $ts.innerHTML=keys.map(k=>`<option value="${k}">${k}</option>`).join("");
    const hx=(v,d)=>(typeof v==="string"&&/^#[0-9a-fA-F]{6}$/.test(v))?v:d;
    const syncTx=()=>{ const c=T2[tsel]; if(!c)return;
      $tsz.value=c.size||18; if($tszv)$tszv.textContent=c.size||18;
      $tdx.value=c.dx||0; if($tdxv)$tdxv.textContent=c.dx||0;
      $tdy.value=c.dy||0; if($tdyv)$tdyv.textContent=c.dy||0;
      $tsw.value=c.sw||0; if($tswv)$tswv.textContent=c.sw||0;
      $tf.value=hx(c.fill,"#ffffff"); $tst.value=hx(c.stroke,"#000000"); };
    syncTx();
    $ts.onchange=()=>{ tsel=$ts.value; syncTx(); };
    const bindT=(input,span,field,num)=>{ input.oninput=()=>{ const c=T2[tsel]; if(!c)return;
      c[field]=num?parseFloat(input.value):input.value; if(span)span.textContent=c[field]; saveCfg(); }; };
    bindT($tsz,$tszv,"size",true); bindT($tdx,$tdxv,"dx",true); bindT($tdy,$tdyv,"dy",true);
    bindT($tsw,$tswv,"sw",true); bindT($tf,null,"fill",false); bindT($tst,null,"stroke",false);
  }

  if(window.SCENERY_CFG){
    const SC = window.SCENERY_CFG;
    let selIdx = 0;
    const $sel  = $("scSel"), $selv = $("scSelv");
    const $key  = $("scKey");
    const $x = $("scX"), $y = $("scY"), $w = $("scW");
    const $xv = $("scXv"), $yv = $("scYv"), $wv = $("scWv");
    const $flip = $("scFlip"), $add = $("scAdd"), $del = $("scDel");
    const $editTgl = $("scEditTgl");

    const labelOf = (it,i)=> `[${i}] ${it.key} @(${Math.round(it.x)},${Math.round(it.y)})`;
    const rebuildList = ()=>{
      $sel.innerHTML = SC.map((it,i)=>`<option value="${i}">${labelOf(it,i)}</option>`).join("");
      if(selIdx>=SC.length) selIdx=Math.max(0,SC.length-1);
      $sel.value = String(selIdx);
      syncControlsFromItem();
    };
    const syncControlsFromItem = ()=>{
      const it = SC[selIdx];
      if(!it){$selv.textContent="-";return;}
      $selv.textContent = `flip:${it.flip>0?"→":"←"}`;
      $key.value = it.key;
      $x.value = it.x; if($xv)$xv.textContent = Math.round(it.x);
      $y.value = it.y; if($yv)$yv.textContent = Math.round(it.y);
      $w.value = it.w; if($wv)$wv.textContent = Math.round(it.w);
    };
    rebuildList();

    $sel.onchange = ()=>{ selIdx = +$sel.value; syncControlsFromItem(); };
    $key.onchange = ()=>{
      const it = SC[selIdx]; if(!it)return;
      it.key = $key.value;
      $sel.options[selIdx].textContent = labelOf(it, selIdx);
      saveCfg();
    };
    const liveSliderUpdate = (input, span, field, isInt)=>{
      input.oninput = ()=>{
        const it = SC[selIdx]; if(!it)return;
        const v = parseFloat(input.value);
        it[field] = isInt ? Math.round(v) : v;
        if(span)span.textContent = Math.round(v);
        $sel.options[selIdx].textContent = labelOf(it, selIdx);
        saveCfg();
      };
    };
    liveSliderUpdate($x, $xv, "x", true);
    liveSliderUpdate($y, $yv, "y", true);
    liveSliderUpdate($w, $wv, "w", true);
    $flip.onclick = ()=>{
      const it = SC[selIdx]; if(!it)return;
      it.flip = -it.flip || -1;
      $selv.textContent = `flip:${it.flip>0?"→":"←"}`;
      saveCfg();
    };
    $add.onclick = ()=>{
      const it = SC[selIdx] || {key:"rock",x:400,y:1000,w:300,flip:1};
      SC.push({key:it.key, x:it.x+40, y:it.y+40, w:it.w, flip:it.flip});
      selIdx = SC.length-1;
      rebuildList(); saveCfg();
    };
    $del.onclick = ()=>{
      if(SC.length<=1){alert("至少保留一项");return;}
      if(!confirm("删除选中项?"))return;
      SC.splice(selIdx,1);
      selIdx = Math.max(0, selIdx-1);
      rebuildList(); saveCfg();
    };

    const setEditMode = (on)=>{
      window.SCENERY_EDIT_MODE = on;
      $editTgl.classList.toggle("on",on);
      $editTgl.textContent = on ? "🟢 场景编辑中" : "⛰ 场景编辑";
      if(on){
        const fitZoom = Math.min(VW/WORLD_W, VH/WORLD_H);
        curZoom = tarZoom = fitZoom;
        camX = (WORLD_W - VW/fitZoom)/2;
        camY = 0;
        const reel=document.getElementById("reelBtn"); if(reel)reel._oldDisplay=reel.style.display, reel.style.display="none";
        const up=document.getElementById("upgradeBtn"); if(up)up.classList.remove("show");
        // 自动切到场景 tab
        document.querySelector('#dbgTabs [data-tab="scene"]')?.click();
      }else{
        tarZoom = (phase==="fishing"||phase==="boss") ? ZOOM_FISH : ZOOM_BOAT;
      }
    };
    setEditMode(false);
    $editTgl.onclick = ()=> setEditMode(!window.SCENERY_EDIT_MODE);

    const cvs = document.getElementById("game");
    const evt2world = (e)=>{
      const r = cvs.getBoundingClientRect();
      const p = e.touches ? e.touches[0] : e;
      return {
        x: (p.clientX-r.left)/r.width  * (VW/curZoom) + camX,
        y: (p.clientY-r.top )/r.height * (VH/curZoom) + camY
      };
    };
    const imgAspect = (key)=>{
      const img = (window.IMG||{})[key];
      return img ? img.height/img.width : 1;
    };
    const hitTest = (wx,wy)=>{
      for(let i=SC.length-1;i>=0;i--){
        const it = SC[i];
        const h = it.w * imgAspect(it.key);
        if(wx>=it.x && wx<=it.x+it.w && wy>=it.y && wy<=it.y+h) return i;
      }
      return -1;
    };

    let dragOff = null;
    cvs.addEventListener("pointerdown", (e)=>{
      if(!window.SCENERY_EDIT_MODE) return;
      const w = evt2world(e);
      const i = hitTest(w.x, w.y);
      if(i<0){ dragOff = null; return; }
      selIdx = i;
      const it = SC[i];
      dragOff = {dx: w.x - it.x, dy: w.y - it.y};
      $sel.value = String(i);
      syncControlsFromItem();
      e.stopPropagation();
    }, true);

    addEventListener("pointermove", (e)=>{
      if(!window.SCENERY_EDIT_MODE || !dragOff) return;
      const w = evt2world(e);
      const it = SC[selIdx]; if(!it) return;
      it.x = Math.round(w.x - dragOff.dx);
      it.y = Math.round(w.y - dragOff.dy);
      $x.value = it.x; if($xv)$xv.textContent = it.x;
      $y.value = it.y; if($yv)$yv.textContent = it.y;
      $sel.options[selIdx].textContent = labelOf(it, selIdx);
    });
    addEventListener("pointerup", ()=>{
      if(dragOff){ dragOff = null; saveCfg(); }
    });

    window.drawSceneryEditOverlay = function(){
      if(!window.SCENERY_EDIT_MODE) return;
      ctx.save();
      ctx.lineWidth = 1.5/curZoom;
      ctx.setLineDash([6/curZoom, 4/curZoom]);
      for(let i=0;i<SC.length;i++){
        const it = SC[i];
        const h = it.w * imgAspect(it.key);
        const sel = i===selIdx;
        ctx.strokeStyle = sel ? "rgba(255,217,102,0.9)" : "rgba(127,231,255,0.5)";
        ctx.strokeRect(it.x, it.y, it.w, h);
        if(sel){
          ctx.setLineDash([]);
          ctx.fillStyle = "rgba(255,217,102,0.18)";
          ctx.fillRect(it.x, it.y, it.w, h);
          ctx.setLineDash([6/curZoom, 4/curZoom]);
        }
      }
      ctx.restore();
    };
  }

  if(window.UI_CFG || window.PANEL_UI){
    const U=window.UI_CFG||{}, P=window.PANEL_UI||{};
    const $uiSel=$("uiSel"),$uiTgl=$("uiEditTgl"),$uiPage=$("uiPage");
    const $ux=$("uiX"),$uy=$("uiY"),$uw=$("uiW"),$uh=$("uiH");
    const $uxv=$("uiXv"),$uyv=$("uiYv"),$uwv=$("uiWv"),$uhv=$("uiHv");
    let page="main", sel=0, drag=null;
    const pagePanel={main:null,upgrade:"upgrade",cta:"cta",goal:"goal",settle:"settle"};
    const setCur=(n)=>{ if(window.__setCurPanel)window.__setCurPanel(n); };
    const ptBox=c=>({x:(c.x||0)-30,y:(c.y||0)-16,w:60,h:32});
    const box=o=>({x:o.x,y:o.y,w:o.w,h:o.h});
    const setBox=(o,r)=>{o.x=Math.round(r.x);o.y=Math.round(r.y);o.w=Math.round(r.w);o.h=Math.round(r.h);};

    function items(){
      const it=[]; const push=(label,rect,apply)=>it.push({label,rect,apply});
      if(page==="main"){
        for(const id in U){ const c=U[id];
          push(id, ()=>{ const b=(window.uiBox&&window.uiBox(id))||{w:c.w,h:c.h}; const h=b.h>0?b.h:(c.h||48);
              if(c.follow){ const sx=(window.hook?(hook.x-camX)*curZoom:VW/2)+(c.x||0), sy=(window.hook?(hook.y-camY)*curZoom:VH/2)+(c.y||0); return {x:sx-c.w/2,y:sy-h/2,w:c.w,h}; }
              return {x:c.x,y:c.y,w:c.w,h}; },
            r=>{ if(c.follow){ const ax=(window.hook?(hook.x-camX)*curZoom:VW/2), ay=(window.hook?(hook.y-camY)*curZoom:VH/2);
                c.x=Math.round(r.x+r.w/2-ax); c.y=Math.round(r.y+r.h/2-ay); c.w=Math.round(r.w); }
              else { c.x=Math.round(r.x); c.y=Math.round(r.y); c.w=Math.round(r.w); if(!(c.img&&window.IMG&&IMG[c.img])) c.h=Math.round(r.h); } });
        }
      } else if(page==="upgrade" && P.upCard){
        const rr=i=>({x:P.upRowX,y:P.upRows[i],w:P.upRowW,h:P.upRowH});
        push("upCard",()=>box(P.upCard),r=>setBox(P.upCard,r));
        push("upClose",()=>box(P.upClose),r=>setBox(P.upClose,r));
        push("upCoins",()=>ptBox(P.upCoins),r=>{P.upCoins.x=Math.round(r.x+r.w/2);P.upCoins.y=Math.round(r.y+r.h/2);});
        push("行1(共用宽高)",()=>rr(0),r=>{P.upRowX=Math.round(r.x);P.upRows[0]=Math.round(r.y);P.upRowW=Math.round(r.w);P.upRowH=Math.round(r.h);});
        push("行2(共用宽高)",()=>rr(1),r=>{P.upRowX=Math.round(r.x);P.upRows[1]=Math.round(r.y);P.upRowW=Math.round(r.w);P.upRowH=Math.round(r.h);});
        const rel=(key,label)=>push(label,()=>({x:P.upRowX+P[key].dx,y:P.upRows[0]+P[key].dy,w:P[key].w,h:P[key].h}),
          r=>{P[key].dx=Math.round(r.x-P.upRowX);P[key].dy=Math.round(r.y-P.upRows[0]);P[key].w=Math.round(r.w);P[key].h=Math.round(r.h);});
        rel("upIco","图标(模板)"); rel("upName","道具名(模板)"); rel("upPips","进度点(模板)"); rel("upBuy","买钮(模板)");
        push("等级文字(模板)",()=>({x:P.upRowX+P.upLv.dx,y:P.upRows[0]+P.upLv.dy,w:64,h:22}),r=>{P.upLv.dx=Math.round(r.x-P.upRowX);P.upLv.dy=Math.round(r.y-P.upRows[0]);});
        // 升级价格(金币+数字)— 相对买钮中心的偏移(dx=横向,dy=纵向,-16=按钮上方)
        push("升级价格(模板)",
          ()=>{
            const cx=P.upRowX+P.upBuy.dx+P.upBuy.w/2+((P.upPrice&&P.upPrice.dx)||0);
            const cy=P.upRows[0]+P.upBuy.dy+((P.upPrice&&P.upPrice.dy)||-16);
            return {x:cx-40,y:cy-14,w:80,h:28};
          },
          r=>{
            const cx=r.x+r.w/2, cy=r.y+r.h/2;
            if(!P.upPrice) P.upPrice={dx:0,dy:0,w:0,h:0};
            P.upPrice.dx=Math.round(cx-(P.upRowX+P.upBuy.dx+P.upBuy.w/2));
            P.upPrice.dy=Math.round(cy-(P.upRows[0]+P.upBuy.dy));
          });
        push("upGoFish",()=>box(P.upGoFish),r=>setBox(P.upGoFish,r));
      } else if(page==="cta" && P.ctaCard){
        push("ctaCard",()=>box(P.ctaCard),r=>setBox(P.ctaCard,r));
        push("ctaBtn",()=>box(P.ctaBtn),r=>setBox(P.ctaBtn,r));
      } else if(page==="goal" && P.goalCard){
        push("goalCard",()=>box(P.goalCard),r=>setBox(P.goalCard,r));
        push("goalBtn",()=>box(P.goalBtn),r=>setBox(P.goalBtn,r));
      } else if(page==="settle" && P.setCard){
        push("setCard",()=>box(P.setCard),r=>setBox(P.setCard,r));
        push("setCoin",()=>ptBox(P.setCoin),r=>{P.setCoin.x=Math.round(r.x+r.w/2);P.setCoin.y=Math.round(r.y+r.h/2);});
        push("setBalance",()=>ptBox(P.setBalance),r=>{P.setBalance.x=Math.round(r.x+r.w/2);P.setBalance.y=Math.round(r.y+r.h/2);});
        push("setBtnUp",()=>box(P.setBtnUp),r=>setBox(P.setBtnUp,r));
        push("setBtnFish",()=>box(P.setBtnFish),r=>setBox(P.setBtnFish,r));
      }
      return it;
    }
    function refreshSel(){ const list=items();
      $uiSel.innerHTML=list.map((o,i)=>`<option value="${i}">${o.label}</option>`).join("");
      if(sel>=list.length)sel=0; $uiSel.value=sel; syncCtl(); }
    function syncCtl(){ const o=items()[sel]; if(!o)return; const r=o.rect();
      $ux.value=Math.round(r.x);if($uxv)$uxv.textContent=Math.round(r.x);
      $uy.value=Math.round(r.y);if($uyv)$uyv.textContent=Math.round(r.y);
      $uw.value=Math.round(r.w);if($uwv)$uwv.textContent=Math.round(r.w);
      $uh.value=Math.round(r.h);if($uhv)$uhv.textContent=Math.round(r.h); }
    $uiSel.onchange=()=>{ sel=+$uiSel.value; syncCtl(); };
    $uiPage.onchange=()=>{ page=$uiPage.value; sel=0; if(window.UI_EDIT_MODE)setCur(pagePanel[page]); refreshSel(); };
    const bind=(input,span,field)=>{ input.oninput=()=>{ const o=items()[sel]; if(!o)return; const r=o.rect();
      r[field]=Math.round(parseFloat(input.value)); if(span)span.textContent=r[field]; o.apply(r);
      if(window.applyUiLayout)window.applyUiLayout(); saveCfg(); }; };
    bind($ux,$uxv,"x");bind($uy,$uyv,"y");bind($uw,$uwv,"w");bind($uh,$uhv,"h");

    const setEdit=on=>{ window.UI_EDIT_MODE=on;
      $uiTgl.classList.toggle("on",on);
      $uiTgl.textContent=on?"🟢 UI 编辑中":"🎨 UI 编辑";
      setCur(on?pagePanel[page]:null); refreshSel();
      if(on) document.querySelector('#dbgTabs [data-tab="ui"]')?.click();
    };
    setEdit(false);
    $uiTgl.onclick=()=>setEdit(!window.UI_EDIT_MODE);

    const cvs2=document.getElementById("game");
    const evt2c=e=>{ const r=cvs2.getBoundingClientRect(),q=e.touches?e.touches[0]:e;
      return {x:(q.clientX-r.left)/r.width*VW,y:(q.clientY-r.top)/r.height*VH}; };
    cvs2.addEventListener("pointerdown",e=>{ if(!window.UI_EDIT_MODE)return;
      const pt=evt2c(e), list=items();
      if(list[sel]){ const r=list[sel].rect();
        if(Math.abs(pt.x-(r.x+r.w))<16&&Math.abs(pt.y-(r.y+r.h))<16){ drag={mode:"size",x0:pt.x,y0:pt.y,r0:r,asp:r.w/Math.max(1,r.h)}; e.stopPropagation(); return; } }
      let best=-1,ba=1e18;
      list.forEach((o,i)=>{ const r=o.rect(); if(pt.x>=r.x&&pt.x<=r.x+r.w&&pt.y>=r.y&&pt.y<=r.y+r.h){ const a=r.w*r.h; if(a<ba){ba=a;best=i;} } });
      if(best<0){ drag=null; return; }
      sel=best; $uiSel.value=best; syncCtl();
      drag={mode:"move",x0:pt.x,y0:pt.y,r0:list[best].rect()};
      e.stopPropagation();
    },true);
    addEventListener("pointermove",e=>{ if(!window.UI_EDIT_MODE||!drag)return;
      const pt=evt2c(e), o=items()[sel], r0=drag.r0; if(!o)return;
      if(drag.mode==="move"){ o.apply({x:r0.x+(pt.x-drag.x0),y:r0.y+(pt.y-drag.y0),w:r0.w,h:r0.h}); }
      else{ const w=Math.max(8,r0.w+(pt.x-drag.x0)); o.apply({x:r0.x,y:r0.y,w,h:Math.max(8,Math.round(w/drag.asp))}); }
      if(window.applyUiLayout)window.applyUiLayout(); syncCtl();
    });
    addEventListener("pointerup",()=>{ if(drag){ drag=null; saveCfg(); } });

    window.drawUiEditOverlay=function(){ if(!window.UI_EDIT_MODE)return;
      const list=items(); ctx.save(); ctx.font="bold 10px sans-serif"; ctx.textAlign="left";
      list.forEach((o,i)=>{ const r=o.rect(), on=i===sel;
        ctx.setLineDash([5,3]); ctx.lineWidth=on?2.5:1.5;
        ctx.strokeStyle=on?"rgba(255,217,102,.95)":"rgba(127,231,255,.55)"; ctx.strokeRect(r.x,r.y,r.w,r.h);
        if(on){ ctx.setLineDash([]); ctx.fillStyle="rgba(255,217,102,.16)"; ctx.fillRect(r.x,r.y,r.w,r.h);
          ctx.fillStyle="#ffd966"; ctx.fillRect(r.x+r.w-9,r.y+r.h-9,12,12); }
        ctx.fillStyle=on?"#ffd966":"rgba(170,230,255,.85)"; ctx.fillText(o.label,r.x+2,r.y-2);
      }); ctx.restore();
    };
  }

  $("dbgExport").onclick=()=>{
    const code="window.WAVE_CFG="+JSON.stringify(WAVE_CFG,null,2)+";\n"
              +"window.WATER_BG_CFG="+JSON.stringify(WATER_BG_CFG,null,2)+";\n"
              +"window.ZOOM_CFG="+JSON.stringify(ZOOM_CFG,null,2)+";\n"
              +"window.WAVE_TRANS_CFG="+JSON.stringify(window.WAVE_TRANS_CFG,null,2)+";\n"
              +"window.SCENERY_CFG="+JSON.stringify(window.SCENERY_CFG,null,2)+";\n"
              +"window.GAME_CFG="+JSON.stringify(window.GAME_CFG,null,2)+";\n"
              +"window.BOAT_CFG="+JSON.stringify(window.BOAT_CFG,null,2)+";\n"
              +"window.TEXT_CFG="+JSON.stringify(window.TEXT_CFG,null,2)+";\n"
              +"window.UI_CFG="+JSON.stringify(window.UI_CFG,null,2)+";\n"
              +"window.PANEL_CFG="+JSON.stringify(window.PANEL_CFG,null,2)+";\n"
              +"window.PANEL_UI="+JSON.stringify(window.PANEL_UI,null,2)+";\n"
              +"window.FISHER_ANIM="+JSON.stringify(window.FISHER_ANIM,null,2)+";\n"
              +"window.FISHER_TIP="+JSON.stringify(window.FISHER_TIP,null,2)+";";
    console.log("%c【调试参数已导出】","color:#7fe7ff;font-weight:bold;font-size:13px");
    console.log(code);
    try{navigator.clipboard.writeText(code).then(()=>{
      alert("✅ 当前参数已复制到剪贴板!");
    },()=>{alert("配置已输出到控制台(F12 → Console),手动复制。");});}catch(e){alert("配置已输出到控制台(F12)");}
  };
  $("dbgReset").onclick=()=>{
    if(confirm("重置所有调试参数到默认值?"))
      {localStorage.removeItem(STG_KEY);location.reload();}
  };

  // 每个滑块加数字输入框
  (function addNumberInputs(){
    const panel=document.getElementById("debugPanel"); if(!panel) return;
    const r3=v=>{ const n=+v; return Math.abs(n)>=100?Math.round(n):Math.round(n*1000)/1000; };
    panel.querySelectorAll(".row input[type=range]").forEach(rng=>{
      if(rng._num) return; rng._num=true;
      rng.step="any";
      const num=document.createElement("input");
      num.type="number"; num.value=r3(rng.value);
      if(rng.min!=="")num.min=rng.min; if(rng.max!=="")num.max=rng.max; num.step="any";
      rng.parentNode.appendChild(num);
      const push=()=>{ const v=parseFloat(num.value); if(isNaN(v))return; rng.value=v; rng.dispatchEvent(new Event("input")); };
      num.addEventListener("input",push); num.addEventListener("change",push);
      rng.addEventListener("input",()=>{ if(document.activeElement!==num) num.value=r3(rng.value); });
    });
  })();

  // ==================== 图片替换 ====================
  // 所有可替换图片按分类列出,点击 cell → 选本地文件 → 立即替换 window.IMG[key]
  const imgReplacer=(function buildImageReplacer(){
    const $list=$("imgList"); if(!$list) return {};
    const GROUPS=[
      {title:"🌊 背景 / 水面",         keys:["bg_surface","bg_water","wave","wave_transition"]},
      {title:"⛰ 礁石 / 沉船",           keys:["rock","rock_b","rock_c","rock_d","rock_e","rock_f","wreck"]},
      {title:"🚤 船 / 角色",            keys:["boat","fisher","rod"]},
      {title:"🧑 渔夫状态机(精灵条)",   keys:["fisher_idle","fisher_cast","fisher_fishing","fisher_reel"]},
      {title:"🐟 鱼 / 海王",            keys:["fish_s","fish_m","fish_l","seaking"]},
      {title:"🎣 鱼钩 / 鱼线",          keys:["hook_cu","hook_ag","hook_au","hook_dia","line_tex","ui_finger"]},
      {title:"💰 金币 / 通用",          keys:["coin"]},
      {title:"🎨 UI 按钮",              keys:["ui_cast","ui_reel","ui_upgrade","ui_download","ui_close","ui_upbtn"]},
      {title:"🎨 UI HUD",               keys:["ui_coin","ui_goal","ui_line","ui_line_fill","ui_bosshp","ui_tut"]},
      {title:"🎨 UI 面板皮肤",          keys:["ui_card","ui_card_gear","ui_btn","ui_btn_blue","ui_uprow","ui_pip","ui_pip_on"]},
      {title:"🎨 UI 图标",              keys:["ui_ico_line","ui_ico_atk"]},
      {title:"🧵 鱼线图标(4 级)",       keys:["ui_ico_line_lv1","ui_ico_line_lv2","ui_ico_line_lv3","ui_ico_line_lv4"]},
      {title:"🪝 鱼钩图标(4 级)",       keys:["ui_ico_hook_lv1","ui_ico_hook_lv2","ui_ico_hook_lv3","ui_ico_hook_lv4"]},
      {title:"🎨 UI 文字图",            keys:["ui_txt_goal","ui_txt_settle","ui_txt_gear","ui_txt_cta","ui_txt_line","ui_txt_hook"]}
    ];
    const replaced={}; // {key: dataURL} — 记录已替换的,用于视觉标记

    // override 图对象缓存(每个 key 只 new Image() 一次,后续复用同一个引用)
    const overrideImgs={}; // {key: HTMLImageElement}
    const applyImage=(key,url,fromRestore)=>{
      const im=new Image();
      im.onload=()=>{
        if(typeof IMG!=="undefined") IMG[key]=im;
        overrideImgs[key]=im;
        if(typeof predecodeImage==="function") predecodeImage(im); // 提前解码,避免首次 drawImage 掉帧
        if(key.indexOf("fisher_")===0&&typeof warmFisherFrames==="function") setTimeout(warmFisherFrames,50); // 精灵条按真实绘制路径预热
        if(key==="line_tex"&&typeof clearLineTexPattern==="function") clearLineTexPattern(); // 换纹理重建 pattern
        if(window.clearGrayImageCache) window.clearGrayImageCache(key); // 换图后灰度缓存重建
        if(key.indexOf("fish_")===0&&window.clearFishGlowCache) window.clearFishGlowCache(); // 换鱼图后发光贴图重建
        if(typeof ROCK_MASK!=="undefined" && key in ROCK_MASK) delete ROCK_MASK[key];
        // 同步到 ASSET_INLINE,让「导出 H5」能带上新图
        if(typeof ASSET_LIST!=="undefined" && ASSET_LIST[key] && window.ASSET_INLINE){
          window.ASSET_INLINE[ASSET_LIST[key]]=url;
        }
        replaced[key]=true;
        const cell=document.querySelector(`.img-cell[data-key="${key}"]`);
        if(cell){
          cell.classList.add("replaced");
          const th=cell.querySelector(".thumb"); if(th){th.style.backgroundImage=`url("${url}")`; th.textContent="";}
          const st=cell.querySelector(".stat"); if(st) st.textContent="✅";
        }
        if(!fromRestore){
          idbPut("img_"+key,url);
          idbGet("img_keys").then(k=>{
            const s=new Set(Array.isArray(k)?k:[]);
            s.add(key);
            idbPut("img_keys",[...s]);
          });
        }
      };
      im.onerror=()=>{ if(!fromRestore) alert("加载失败,请确认是有效的 PNG/JPG"); else console.warn("[imgReplacer] restore load failed:",key); };
      im.src=url;
    };
    // 抢占默认图 late-load:只在 2s / 4.5s 各查一次,复用已 new 的 Image 引用,不再重复 new。
    const stampOverrides=()=>{
      const recheck=()=>{
        for(const k in overrideImgs){
          const im=overrideImgs[k];
          if(im && im.complete && im.naturalWidth>0 && typeof IMG!=="undefined" && IMG[k]!==im){
            IMG[k]=im;
            if(typeof ROCK_MASK!=="undefined" && k in ROCK_MASK) delete ROCK_MASK[k];
          }
        }
      };
      setTimeout(recheck,2000);
      setTimeout(recheck,4500);
    };

    const buildCell=(key)=>{
      const cell=document.createElement("div");
      cell.className="img-cell"; cell.dataset.key=key;
      // 初始占位:不做 canvas + toDataURL;refreshAll 会用 img.src 填 background-image
      cell.innerHTML=`
        <div class="thumb">❔</div>
        <div class="lbl">${key}</div>
        <div class="stat">❌</div>`;
      cell.onclick=()=>{
        const inp=document.createElement("input");
        inp.type="file"; inp.accept="image/png,image/jpeg,image/webp,image/gif";
        inp.onchange=()=>{
          const f=inp.files[0]; if(!f) return;
          const r=new FileReader();
          r.onload=()=>applyImage(key,r.result);
          r.readAsDataURL(f);
        };
        inp.click();
      };
      return cell;
    };

    // 构建 UI
    $list.innerHTML="";
    for(const g of GROUPS){
      const box=document.createElement("div"); box.className="img-group";
      const h=document.createElement("h4"); h.textContent=g.title; box.appendChild(h);
      const grid=document.createElement("div"); grid.className="img-grid";
      for(const k of g.keys) grid.appendChild(buildCell(k));
      box.appendChild(grid); $list.appendChild(box);
    }

    // 恢复按钮:清空 IndexedDB 里所有 override + 刷页面
    $("imgReloadAll").onclick=async()=>{
      if(!confirm("清空所有已上传图片(IndexedDB)并恢复默认?"))return;
      try{
        const keys=await idbGet("img_keys");
        if(Array.isArray(keys)) for(const k of keys) await idbPut("img_"+k, null);
        await idbPut("img_keys",[]);
      }catch(e){}
      location.reload();
    };
    // 启动时:从 IndexedDB 读所有已保存的 override,并重新应用
    (async()=>{
      try{
        const keys=await idbGet("img_keys");
        if(!Array.isArray(keys)||keys.length===0)return;
        for(const k of keys){
          const url=await idbGet("img_"+k);
          if(url) applyImage(k, url, true);   // fromRestore=true,不再写库
        }
        stampOverrides();  // 抢占定时补,防止 game.js 默认图 late-load 覆盖
      }catch(e){console.warn("[imgReplacer] restore failed",e);}
    })();

    // 刷新所有(未被用户替换过的)缩略图 — 供延迟/切 tab 时调用
    // 直接用 img.src 作为 background-image(避免 toDataURL 的 canvas 污染问题)
    const refreshAll=()=>{
      const IMGref=(typeof IMG!=="undefined"?IMG:{});
      let ok=0,total=0;
      document.querySelectorAll(".img-cell").forEach(cell=>{
        total++;
        if(cell.classList.contains("replaced")){ ok++; return; }
        const key=cell.dataset.key, img=IMGref[key];
        if(img&&img.complete&&img.naturalWidth>0){
          const th=cell.querySelector(".thumb");
          if(th){ th.style.backgroundImage=`url("${img.src}")`; th.textContent=""; }
          const st=cell.querySelector(".stat"); if(st) st.textContent="✅";
          ok++;
        }
      });
      // 有图片还没就绪 → 隔一会儿再试
      if(ok<total) setTimeout(refreshAll,600);
    };
    // 页面初期图还没加载 → 多次尝试;之后由 tab 点击时再刷
    setTimeout(refreshAll,500);
    setTimeout(refreshAll,1500);
    setTimeout(refreshAll,3500);
    return {refreshAll};
  })();

  // 点「🖼 图片」tab 时也刷新一次(此时图肯定都加载完了)
  document.querySelector('#dbgTabs [data-tab="images"]')?.addEventListener("click",()=>{
    if(imgReplacer&&imgReplacer.refreshAll) imgReplacer.refreshAll();
  });

  // 一键导出 H5
  $("dbgExportHtml").onclick=async()=>{
    const btn=$("dbgExportHtml"); const origTxt=btn.textContent;
    btn.disabled=true; btn.textContent="📦 打包中…";
    try{
      // 优先从服务器现拉源码(反映当前 game.js 最新改动);拉不到再回退 __EXPORT_SRC__ 快照
      let E=window.__EXPORT_SRC__;
      try{
        const [html,css,js]=await Promise.all([
          fetch("index.html").then(r=>r.text()),
          fetch("src/style.css").then(r=>r.text()),
          fetch("src/game.js").then(r=>r.text())
        ]);
        if(html&&css&&js) E={html,css,js};
      }catch(e){ /* file:// 或跨源时拉不到 → 用旧快照 */ }
      if(!E||!E.html||!E.css||!E.js)
        throw new Error("源码不可用,先跑一次 `python build_standalone.py`");
      if(!window.ASSET_INLINE)
        throw new Error("ASSET_INLINE 缺失,先跑一次 `python gen_assets_b64.py`");

      // 导出前把超大图降采样(iOS Safari 对 >16.7MP 位图 drawImage 会静默失败/极慢,
      // 20+MP 的渔夫精灵条是 iOS 上 1FPS/画面错乱的根因)。桌面 Chrome 缩图毫无压力,
      // 让 iOS 永远见不到大图。>2MP 的缩到 ≤2MP,webp 0.92 保透明。
      btn.textContent="📦 压缩大图中…";
      async function shrinkAssetInline(srcMap){
        const MAX=2e6, TARGET=2e6;
        const out={};
        for(const name in srcMap){
          const uri=srcMap[name];
          try{
            const im=new Image();
            await new Promise((res,rej)=>{ im.onload=res; im.onerror=rej; im.src=uri; });
            const area=im.naturalWidth*im.naturalHeight;
            if(area>MAX){
              const s=Math.sqrt(TARGET/area);
              const w=Math.max(1,Math.floor(im.naturalWidth*s)), h=Math.max(1,Math.floor(im.naturalHeight*s));
              const c=document.createElement("canvas"); c.width=w; c.height=h;
              const cc=c.getContext("2d");
              cc.imageSmoothingQuality="high";
              cc.drawImage(im,0,0,w,h);
              out[name]=c.toDataURL("image/webp",0.92);
              console.log("[导出] 降采样",name,im.naturalWidth+"x"+im.naturalHeight,"→",w+"x"+h);
              continue;
            }
          }catch(e){}
          out[name]=uri;
        }
        return out;
      }
      const AI=await shrinkAssetInline(window.ASSET_INLINE);
      btn.textContent="📦 打包中…";

      const tagOpen="<scr"+"ipt>", tagClose="</scr"+"ipt>";
      const ov="window.WAVE_CFG=Object.assign({},window.WAVE_CFG,"+JSON.stringify(WAVE_CFG)+");\n"
              +"window.WATER_BG_CFG=Object.assign({},window.WATER_BG_CFG,"+JSON.stringify(WATER_BG_CFG)+");\n"
              +"window.ZOOM_CFG=Object.assign({},window.ZOOM_CFG,"+JSON.stringify(ZOOM_CFG)+");\n"
              +(window.WAVE_TRANS_CFG?"window.WAVE_TRANS_CFG=Object.assign({},window.WAVE_TRANS_CFG,"+JSON.stringify(WAVE_TRANS_CFG)+");\n":"")
              +(window.SCENERY_CFG?"window.SCENERY_CFG="+JSON.stringify(window.SCENERY_CFG)+";\n":"")
              +(window.GAME_CFG?"(function(g){if(!window.GAME_CFG)return;window.GAME_CFG.coinScale=g.coinScale;window.GAME_CFG.boatDX=g.boatDX;window.GAME_CFG.rodTipFx=g.rodTipFx;window.GAME_CFG.rodTipFy=g.rodTipFy;if(g.bossCoins!=null)window.GAME_CFG.bossCoins=g.bossCoins;if(g.bossSpd!=null)window.GAME_CFG.bossSpd=g.bossSpd;if(g.bossR!=null)window.GAME_CFG.bossR=g.bossR;Object.assign(window.GAME_CFG.fishHp,g.fishHp);for(var i=0;i<g.lineDist.length;i++)window.GAME_CFG.lineDist[i]=g.lineDist[i];if(window.applyFishHp)window.applyFishHp();})("+JSON.stringify(window.GAME_CFG)+");":"")
              +(window.BOAT_CFG?"if(window.BOAT_CFG)Object.assign(window.BOAT_CFG,"+JSON.stringify(window.BOAT_CFG)+");":"")
              +(window.TEXT_CFG?"if(window.TEXT_CFG){var _t="+JSON.stringify(window.TEXT_CFG)+";for(var k in _t){if(window.TEXT_CFG[k])Object.assign(window.TEXT_CFG[k],_t[k]);}}":"")
              +(window.UI_CFG?"window.UI_CFG="+JSON.stringify(window.UI_CFG)+";if(window.applyUiLayout)window.applyUiLayout();":"")
              +(window.PANEL_CFG?"window.PANEL_CFG="+JSON.stringify(window.PANEL_CFG)+";if(window.applyPanelLayout)window.applyPanelLayout();":"")
              +(window.PANEL_UI?"if(window.PANEL_UI)Object.assign(window.PANEL_UI,"+JSON.stringify(window.PANEL_UI)+");":"")
              +(window.FISHER_ANIM?"if(window.FISHER_ANIM){var _fa="+JSON.stringify(window.FISHER_ANIM)+";for(var k in _fa){if(window.FISHER_ANIM[k])Object.assign(window.FISHER_ANIM[k],_fa[k]);}}":"")
              +(window.FISHER_TIP?"window.FISHER_TIP="+JSON.stringify(window.FISHER_TIP)+";":"")
              +(window.LOADING_UI?"if(window.LOADING_UI)Object.assign(window.LOADING_UI,"+JSON.stringify(window.LOADING_UI)+");":"");

      let html=E.html;
      // 兼容 src="./src/xxx.js?v=2" 之类的版本号后缀:文件名后允许 ?query
      html=html.replace(/<link[^>]+href="[.\/]*src\/style\.css(?:\?[^"]*)?"[^>]*\/?>/,"<style>\n"+E.css+"\n</style>");
      html=html.replace(/<script[^>]+src="[.\/]*src\/assets_b64\.js(?:\?[^"]*)?"[^>]*><\/script>/,
                        tagOpen
                        +"window.ASSET_INLINE="+JSON.stringify(AI)+";"
                        +(window.AUDIO_INLINE?"window.AUDIO_INLINE="+JSON.stringify(window.AUDIO_INLINE)+";":"")
                        +tagClose);
      html=html.replace(/\s*<script[^>]+src="[.\/]*src\/_export_src\.js(?:\?[^"]*)?"[^>]*><\/script>/,"");
      html=html.replace(/<script[^>]+src="[.\/]*src\/game\.js(?:\?[^"]*)?"[^>]*><\/script>/,
                        tagOpen+"\n"+E.js+"\n"+tagClose+"\n"+tagOpen+ov+tagClose);
      html=html.replace(/\s*<script[^>]+src="[.\/]*src\/debug\.js(?:\?[^"]*)?"[^>]*><\/script>/g,"");

      if(html.indexOf("ASSET_INLINE")<0 || html.indexOf("WAVE_CFG")<0)
        throw new Error("内联失败,先跑 build_standalone.py");

      const out=new Blob([html],{type:"text/html;charset=utf-8"});
      const a=document.createElement("a");
      a.href=URL.createObjectURL(out);
      a.download="seaking_release.html";
      document.body.appendChild(a);a.click();document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
      const sizeMB=(out.size/1024/1024).toFixed(2);
      alert("✅ 已下载 seaking_release.html("+sizeMB+" MB)");
    }catch(e){
      console.error(e);
      alert("❌ 导出失败:"+e.message);
    }finally{
      btn.disabled=false; btn.textContent=origTxt;
    }
  };

  $("dbgLinkFile").textContent="📁 关联源码";
  const updateLinkStatus=()=>{
    const s=$("saverStatus");
    if(fileHandle){s.innerHTML="✅ 已关联 "+fileHandle.name+" · 自动写回";s.style.color="#7fffaa";}
    else if(!window.showOpenFilePicker){s.innerHTML="⚠ 需 Chrome/Edge 支持 File System API";s.style.color="#ffaa66";}
    else{s.innerHTML="点「📁 关联源码」→ 选 src/game.js,滑块变动会自动写回";s.style.color="#7fb8d4";}
  };
  $("dbgLinkFile").onclick=async()=>{
    if(!window.showOpenFilePicker){alert("此浏览器不支持 File System Access API,请用 Chrome/Edge 86+");return;}
    try{
      const [h]=await window.showOpenFilePicker({
        types:[{description:"JS",accept:{"text/javascript":[".js"]}}],
        excludeAcceptAllOption:false
      });
      if((await h.requestPermission({mode:"readwrite"}))!=="granted"){alert("未授权读写权限");return;}
      fileHandle=h;
      idbPut("gameHandle",h);
      updateLinkStatus();
      await writeToSource();
    }catch(e){if(e.name!=="AbortError")console.warn(e);}
  };
  (async()=>{
    const h=await idbGet("gameHandle");
    if(h){
      const perm=await h.queryPermission({mode:"readwrite"});
      if(perm==="granted"){fileHandle=h;}
      else if(perm==="prompt"){
        $("saverStatus").innerHTML="🔒 上次关联 "+h.name+",点按钮重授权";
        $("saverStatus").style.color="#ffd966";
        $("dbgLinkFile").textContent="🔒 恢复关联";
        const origClick=$("dbgLinkFile").onclick;
        $("dbgLinkFile").onclick=async()=>{
          if((await h.requestPermission({mode:"readwrite"}))==="granted"){
            fileHandle=h;updateLinkStatus();await writeToSource();
          }else{origClick();}
        };
        return;
      }
    }
    updateLinkStatus();
  })();
}
})();
