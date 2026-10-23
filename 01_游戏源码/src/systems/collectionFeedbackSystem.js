"use strict";
/* 局内收藏反馈。只显示事件结果，不影响钓鱼状态或输入。 */
(function (root) {
  const game = root.CatFishGame || (root.CatFishGame = {});
  const events = game.GameEvents;
  const fishConfig = game.FishConfig;
  if (!events || !fishConfig) throw new Error("collectionFeedbackSystem.js dependencies missing.");
  let node = null;
  let timer = 0;

  function ensureNode() {
    if (node) return node;
    node = document.createElement("aside");
    node.id = "collectionFeedback";
    node.className = "collection-feedback hidden";
    document.body.appendChild(node);
    return node;
  }
  function show(title, detail, icon) {
    const target = ensureNode();
    root.clearTimeout(timer);
    target.innerHTML = '<span class="collection-icon">' + icon + '</span><div><b>' + title + '</b><small>' + detail + '</small></div>';
    target.classList.remove("hidden");
    timer = root.setTimeout(function () { target.classList.add("hidden"); }, 2600);
  }
  // v0.4: new fish use a book dot; skin unlocks remain silent.
  game.CollectionFeedbackSystem = Object.freeze({ show: show });
})(window);
