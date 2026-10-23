"use strict";
/* 可由调试编辑器修改的地图表现配置；不与地图解锁和钓鱼数值耦合。 */
(function (root) {
  root.MAP_THEME_CFG = root.MAP_THEME_CFG || {
    tide_dock: { color: "#1c9bd1", opacity: 0.00, label: "潮汐码头" },
  };
  // 编辑器可在运行时覆盖鱼池；空数组表示回退至 MapConfig 的默认鱼池。
  root.MAP_FISH_POOL_CFG = root.MAP_FISH_POOL_CFG || {};
})(window);
