"use strict";
/* ================================================================
   猫与鱼 · EconomySystem
   ----------------------------------------------------------------
   金币逻辑的无状态服务。通过 adapter 读写宿主余额，因此可以：
   - 先桥接现有 game.js 的 coins 变量；
   - 后续桥接 SaveData；
   - 不把新的全局运行时状态塞入 game.js。
   本模块不定义鱼价值、升级价格或任何 UI 表现。
   ================================================================ */
(function (root) {
  const game = root.CatFishGame || (root.CatFishGame = {});

  function toAmount(value) {
    if (typeof value !== "number" || !Number.isFinite(value)) return 0;
    return Math.max(0, Math.floor(value));
  }

  function validateAdapter(adapter) {
    if (!adapter || typeof adapter.getBalance !== "function" || typeof adapter.setBalance !== "function") {
      throw new Error("EconomySystem requires getBalance() and setBalance() adapter methods.");
    }
  }

  function createWallet(adapter) {
    validateAdapter(adapter);

    function getBalance() {
      return toAmount(adapter.getBalance());
    }

    function setBalance(value, reason) {
      const previous = getBalance();
      const next = toAmount(value);
      adapter.setBalance(next);
      if (typeof adapter.onBalanceChanged === "function" && previous !== next) {
        adapter.onBalanceChanged({
          type: "set",
          reason: reason || "unspecified",
          previous: previous,
          balance: next,
          delta: next - previous
        });
      }
      return next;
    }

    function add(amount, reason) {
      const delta = toAmount(amount);
      const previous = getBalance();
      const balance = setBalance(previous + delta, reason || "reward");
      return { ok: true, amount: delta, balance: balance };
    }

    function canAfford(amount) {
      return getBalance() >= toAmount(amount);
    }

    function spend(amount, reason) {
      const cost = toAmount(amount);
      const previous = getBalance();
      if (previous < cost) {
        return { ok: false, amount: cost, balance: previous };
      }
      const balance = setBalance(previous - cost, reason || "purchase");
      return { ok: true, amount: cost, balance: balance };
    }

    // 供 SaveData 接入使用。只读取或写入 player.coins，其他进度字段不碰。
    function hydrate(save) {
      const coins = save && save.player ? save.player.coins : 0;
      return setBalance(coins, "save_load");
    }

    function writeToSave(save) {
      if (!save || !save.player) {
        throw new Error("EconomySystem.writeToSave requires SaveData.player.");
      }
      save.player.coins = getBalance();
      return save;
    }

    return Object.freeze({
      getBalance: getBalance,
      setBalance: setBalance,
      add: add,
      canAfford: canAfford,
      spend: spend,
      hydrate: hydrate,
      writeToSave: writeToSave
    });
  }

  game.EconomySystem = Object.freeze({
    createWallet: createWallet,
    normalizeAmount: toAmount
  });
})(window);
