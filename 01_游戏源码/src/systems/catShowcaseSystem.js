"use strict";
/* 猫的局外展示与外观选择；钓鱼陪伴状态仍由 CatSystem 负责。 */
(function (root) {
  const game = root.CatFishGame || (root.CatFishGame = {});
  function get(save) {
    game.CatCollectionSystem.ensure(save);
    const cat = save.cat || {};
    const item = game.CatAppearanceConfig.getById(cat.activeAppearance) || game.CatAppearanceConfig.getById("default");
    return { appearance: item };
  }
  function render(save) {
    const x = get(save), accessory = x.appearance.accessory || "";
    return '<button class="cat-showcase appearance-' + x.appearance.id + '" data-action="open-cat" aria-label="打开猫咪衣橱"><div class="cat-showcase-art"><span>' + accessory + '</span></div><div><b>' + x.appearance.name + '</b><em>选择猫咪外观</em></div></button>';
  }
  function select(save, id) { return game.CatCollectionSystem.select(save, id); }
  game.CatShowcaseSystem = Object.freeze({ get: get, render: render, select: select });
})(window);
