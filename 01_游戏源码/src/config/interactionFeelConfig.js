"use strict";
/* 全局交互手感与移动端性能预算：避免阈值、延迟和帧率散落在各系统中。 */
(function(root){
  const game=root.CatFishGame||(root.CatFishGame={});
  game.InteractionFeelConfig=Object.freeze({
    swipe:Object.freeze({
      startDistance:12,
      directionRatio:1.25,
      commitDistance:128,
      flickDistance:68,
      flickVelocity:.70,
      transitionMs:280,
      reboundMs:230
    }),
    canvasButtonDelayMs:90,
    performance:Object.freeze({
      homeCanvasFps:20,
      coveredCanvasFps:8
    }),
    session:Object.freeze({
      resumeGuardMs:400,
      actionCooldownMs:350,
      checkpointMinIntervalMs:120
    }),
    mobile:Object.freeze({
      // 540px 虚拟画布在 360px 宽手机上缩放为 2/3：66 虚拟 px ≈ 44 实际 px。
      minTapTarget:66,
      minCaptionSize:12
    })
  });
})(window);
