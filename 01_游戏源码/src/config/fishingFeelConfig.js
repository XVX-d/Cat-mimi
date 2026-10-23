"use strict";
/* 核心钓鱼手感配置：只管理操作和反馈，不承载经济或成长数值。 */
(function (root) {
  const game = root.CatFishGame || (root.CatFishGame = {});
  const values = Object.freeze({
    hookSpeed: 120,
    turnRate: 9,
    reverseTurnRate: 13,
    joystickRadius: 78,
    joystickDeadZone: 7,
    joystickRecentreDistance: 1.55,
    lineWarningRatio: 0.30,
    lineCriticalRatio: 0.12,
    hitShake: 0.10,
    catchShake: 0.18,
    bossShake: 0.70
  });

  function clamp01(value) { return Math.max(0, Math.min(1, Number(value) || 0)); }

  function steering(dx, dy) {
    const distance = Math.hypot(dx, dy);
    if (distance <= values.joystickDeadZone) return { x: 0, y: 0, strength: 0 };
    const raw = clamp01((distance - values.joystickDeadZone) /
      (values.joystickRadius - values.joystickDeadZone));
    const strength = raw * raw * (3 - 2 * raw);
    return { x: dx / distance * strength, y: dy / distance * strength, strength: strength };
  }

  function lineState(ratio) {
    const value = clamp01(ratio);
    if (value <= values.lineCriticalRatio) return "critical";
    if (value <= values.lineWarningRatio) return "warning";
    return "safe";
  }

  game.FishingFeelConfig = Object.freeze({ values: values, steering: steering, lineState: lineState });
})(window);
