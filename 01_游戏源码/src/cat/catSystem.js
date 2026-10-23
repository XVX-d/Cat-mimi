"use strict";
/* ================================================================
   猫与鱼 · CatSystem（陪伴层）
   ----------------------------------------------------------------
   陪伴猫是独立情绪与视觉层，不控制钓鱼、不改变数值，也不替代渔夫。
   它只订阅 GameEvents，并由 game.js 在船体锚点处调用 draw()。
   ================================================================ */
(function (root) {
  const game = root.CatFishGame || (root.CatFishGame = {});
  const config = game.CatConfig;
  const events = game.GameEvents;

  if (!config || !events) {
    throw new Error("catSystem.js requires catConfig.js and gameEventBus.js first.");
  }

  const state = {
    base: "idle",
    transient: null,
    transientLeft: 0,
    time: 0,
    appearance: "default"
  };

  const priority = Object.freeze({
    excited: 1,
    sad: 2,
    happy: 3,
    upgrade: 4
  });

  function visibleState() {
    return state.transient || state.base;
  }

  function setBase(next) {
    state.base = next;
  }

  function play(next) {
    const duration = config.transientDuration[next] || 0;
    if (!duration) {
      setBase(next);
      return;
    }
    const current = state.transient;
    if (current && priority[current] > priority[next]) return;
    state.transient = next;
    state.transientLeft = duration;
  }

  function update(dt, context) {
    state.time += Math.max(0, dt || 0);
    if (state.transient) {
      state.transientLeft -= Math.max(0, dt || 0);
      if (state.transientLeft <= 0) {
        state.transient = null;
        state.transientLeft = 0;
      }
    }
    if (context && (context.hookState === "cast" || context.hookState === "swim")) {
      setBase("watch");
    } else {
      setBase("idle");
    }
  }

  function drawHeart(ctx, x, y, s) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = "#ff7893";
    ctx.beginPath();
    ctx.arc(-s * 0.25, -s * 0.12, s * 0.25, 0, Math.PI * 2);
    ctx.arc(s * 0.25, -s * 0.12, s * 0.25, 0, Math.PI * 2);
    ctx.lineTo(0, s * 0.52);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawCat(ctx, anchor) {
    if (!anchor || !anchor.size) return;
    const p = config.palette;
    const mode = visibleState();
    const s = anchor.size;
    const bob = Math.sin(state.time * 2.4) * s * 0.035;
    const excited = mode === "excited" || mode === "happy" || mode === "upgrade";
    const sad = mode === "sad";
    const watch = mode === "watch";

    ctx.save();
    ctx.translate(anchor.x, anchor.y + bob);
    if (excited) ctx.rotate(Math.sin(state.time * 14) * 0.05);
    if (sad) ctx.rotate(0.08);

    // 尾巴
    ctx.strokeStyle = p.outline;
    ctx.lineWidth = s * 0.16;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(s * 0.20, s * 0.18);
    const tailLift = excited ? -s * 0.45 : (sad ? s * 0.22 : -s * 0.18);
    ctx.bezierCurveTo(s * 0.62, s * 0.10, s * 0.68, tailLift, s * 0.43, tailLift);
    ctx.stroke();
    ctx.strokeStyle = p.fur;
    ctx.lineWidth = s * 0.10;
    ctx.stroke();

    // 身体与肚皮
    ctx.fillStyle = p.outline;
    ctx.beginPath();
    ctx.ellipse(0, s * 0.18, s * 0.40, s * 0.30, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = p.fur;
    ctx.beginPath();
    ctx.ellipse(0, s * 0.17, s * 0.34, s * 0.25, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = p.belly;
    ctx.beginPath();
    ctx.ellipse(-s * 0.03, s * 0.22, s * 0.17, s * 0.13, 0, 0, Math.PI * 2);
    ctx.fill();

    // 头和耳朵
    ctx.fillStyle = p.outline;
    ctx.beginPath();
    ctx.arc(-s * 0.04, -s * 0.17, s * 0.32, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-s * 0.28, -s * 0.36);
    ctx.lineTo(-s * 0.23, -s * 0.69);
    ctx.lineTo(-s * 0.02, -s * 0.43);
    ctx.closePath();
    ctx.moveTo(s * 0.13, -s * 0.43);
    ctx.lineTo(s * 0.23, -s * 0.69);
    ctx.lineTo(s * 0.34, -s * 0.30);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = p.fur;
    ctx.beginPath();
    ctx.arc(-s * 0.04, -s * 0.17, s * 0.27, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = p.earInner;
    ctx.beginPath();
    ctx.moveTo(-s * 0.22, -s * 0.42);
    ctx.lineTo(-s * 0.21, -s * 0.56);
    ctx.lineTo(-s * 0.09, -s * 0.39);
    ctx.closePath();
    ctx.moveTo(s * 0.14, -s * 0.40);
    ctx.lineTo(s * 0.22, -s * 0.56);
    ctx.lineTo(s * 0.28, -s * 0.29);
    ctx.closePath();
    ctx.fill();

    // 眼睛和嘴巴
    ctx.strokeStyle = p.eye;
    ctx.fillStyle = p.eye;
    ctx.lineWidth = Math.max(1, s * 0.045);
    if (sad) {
      ctx.beginPath();
      ctx.moveTo(-s * 0.17, -s * 0.18); ctx.lineTo(-s * 0.07, -s * 0.14);
      ctx.moveTo(s * 0.03, -s * 0.14); ctx.lineTo(s * 0.13, -s * 0.18);
      ctx.stroke();
    } else if (excited) {
      ctx.beginPath();
      ctx.arc(-s * 0.12, -s * 0.17, s * 0.045, 0, Math.PI * 2);
      ctx.arc(s * 0.08, -s * 0.17, s * 0.045, 0, Math.PI * 2);
      ctx.fill();
    } else {
      const eyeW = watch ? s * 0.036 : s * 0.028;
      ctx.beginPath();
      ctx.ellipse(-s * 0.12, -s * 0.17, eyeW, s * 0.055, 0, 0, Math.PI * 2);
      ctx.ellipse(s * 0.08, -s * 0.17, eyeW, s * 0.055, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "#f27683";
    ctx.beginPath();
    ctx.arc(-s * 0.02, -s * 0.08, s * 0.035, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = p.outline;
    ctx.lineWidth = Math.max(1, s * 0.035);
    ctx.beginPath();
    if (sad) {
      ctx.arc(-s * 0.02, s * 0.02, s * 0.08, Math.PI * 1.1, Math.PI * 1.9);
    } else {
      ctx.arc(-s * 0.02, -s * 0.02, s * 0.09, 0.2, Math.PI - 0.2);
    }
    ctx.stroke();

    // 前爪
    ctx.strokeStyle = p.outline;
    ctx.lineWidth = s * 0.07;
    ctx.lineCap = "round";
    const pawLift = excited ? -s * 0.17 : 0;
    ctx.beginPath();
    ctx.moveTo(-s * 0.17, s * 0.32); ctx.lineTo(-s * 0.18, s * (0.46 + pawLift / s));
    ctx.moveTo(s * 0.10, s * 0.32); ctx.lineTo(s * 0.12, s * (0.46 + pawLift / s));
    ctx.stroke();

    // 外观仅由图鉴中的特殊鱼解锁；这里仅做视觉呈现，不影响任何钓鱼数值。
    if (state.appearance === "moon_ribbon") {
      ctx.fillStyle = "#ef6f9d";
      ctx.beginPath();
      ctx.ellipse(-s * 0.27, -s * 0.39, s * 0.11, s * 0.07, -0.45, 0, Math.PI * 2);
      ctx.ellipse(-s * 0.09, -s * 0.43, s * 0.11, s * 0.07, 0.45, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffd7e4";
      ctx.beginPath(); ctx.arc(-s * 0.18, -s * 0.41, s * 0.05, 0, Math.PI * 2); ctx.fill();
    } else if (state.appearance === "shell_bell") {
      ctx.strokeStyle = "#39a7a4";
      ctx.lineWidth = s * 0.045;
      ctx.beginPath(); ctx.arc(-s * 0.03, s * 0.02, s * 0.24, 0.08, Math.PI - 0.08); ctx.stroke();
      ctx.fillStyle = "#ffd65a";
      ctx.beginPath(); ctx.arc(-s * 0.03, s * 0.12, s * 0.065, 0, Math.PI * 2); ctx.fill();
    } else if (state.appearance === "deepsea_scarf") {
      ctx.strokeStyle = "#2f7dc5";
      ctx.lineWidth = s * 0.075;
      ctx.beginPath();
      ctx.moveTo(-s * 0.27, s * 0.02); ctx.lineTo(s * 0.21, s * 0.04);
      ctx.stroke();
      ctx.fillStyle = "#2f7dc5";
      ctx.beginPath(); ctx.moveTo(s * 0.16, s * 0.04); ctx.lineTo(s * 0.31, s * 0.16); ctx.lineTo(s * 0.14, s * 0.15); ctx.closePath(); ctx.fill();
    } else if (state.appearance === "star_cape") {
      ctx.fillStyle = "rgba(58,67,156,.9)";
      ctx.beginPath(); ctx.moveTo(-s * 0.32, s * 0.05); ctx.lineTo(s * 0.35, s * 0.08); ctx.lineTo(s * 0.25, s * 0.42); ctx.lineTo(-s * 0.27, s * 0.37); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#ffe479";
      ctx.font = "bold " + Math.round(s * 0.16) + "px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("★", s * 0.13, s * 0.29);
    }

    if (mode === "happy" || mode === "upgrade") {
      drawHeart(ctx, s * 0.34, -s * 0.58, s * 0.22);
    } else if (mode === "excited") {
      ctx.fillStyle = p.accent;
      ctx.font = "bold " + Math.round(s * 0.62) + "px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("!", s * 0.31, -s * 0.50);
    } else if (watch) {
      ctx.fillStyle = p.accent;
      ctx.font = "bold " + Math.round(s * 0.42) + "px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("…", s * 0.28, -s * 0.48);
    }
    ctx.restore();
  }

  events.on(events.EVENTS.GAME_STARTED, function (payload) {
    state.appearance = payload && payload.cat && payload.cat.activeAppearance || "default";
    setBase("idle");
  });
  events.on(events.EVENTS.CAT_APPEARANCE_CHANGED, function (payload) { state.appearance = payload && payload.appearanceId || "default"; });
  events.on(events.EVENTS.FISHING_STARTED, function () { setBase("watch"); });
  events.on(events.EVENTS.FISH_CAUGHT, function () { play("excited"); });
  events.on(events.EVENTS.FISH_FIRST_DISCOVERED, function () { play("happy"); });
  events.on(events.EVENTS.ROUND_SETTLED, function (payload) {
    const catches = payload && payload.catches ? payload.catches : {};
    const count = Object.keys(catches).reduce(function (sum, key) { return sum + (catches[key] || 0); }, 0);
    play(count > 0 ? "happy" : "sad");
  });
  events.on(events.EVENTS.UPGRADE_PURCHASED, function () { play("upgrade"); });

  game.CatSystem = Object.freeze({
    update: update,
    draw: drawCat,
    getState: function () { return visibleState(); }
  });
})(window);
