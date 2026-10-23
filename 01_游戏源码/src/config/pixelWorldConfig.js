"use strict";
/* v0.7 横向海域配置：增加贯穿浅水、中层和深水的卡通礁石障碍与远景层。 */
(function (root) {
  const game = root.CatFishGame || (root.CatFishGame = {});
  const cfg = Object.freeze({
    worldWidth: 6144,
    worldHeight: 3800,
    waterY: 205,
    seabedY: 3240,
    regions: Object.freeze([
      Object.freeze({ id: "catpaw_lagoon", min: 0, max: 1100, name: "猫爪泻湖" }),
      Object.freeze({ id: "coral_garden", min: 1100, max: 2200, name: "珊瑚花园" }),
      Object.freeze({ id: "sunken_ruins", min: 2200, max: 3200, name: "沉没遗迹" }),
      Object.freeze({ id: "open_blue", min: 3200, max: 4300, name: "开阔海域" }),
      Object.freeze({ id: "seaking_domain", min: 4300, max: 5200, name: "海王领域" }),
      Object.freeze({ id: "dark_frontier", min: 5200, max: 6145, name: "黑暗边境" })
    ]),
    structures: Object.freeze([
      /* 原海床地标：保留旧地图内容。 */
      Object.freeze({ key: "map_structure_0", x: 330, y: 3020, w: 360 }),
      Object.freeze({ key: "map_structure_7", x: 1180, y: 3060, w: 350 }),
      Object.freeze({ key: "map_structure_2", x: 2010, y: 2980, w: 370 }),
      Object.freeze({ key: "map_structure_3", x: 2870, y: 3040, w: 350 }),
      Object.freeze({ key: "map_structure_6", x: 3740, y: 2960, w: 410 }),
      Object.freeze({ key: "map_structure_4", x: 4630, y: 3010, w: 380 }),
      Object.freeze({ key: "map_structure_5", x: 5480, y: 3040, w: 400 }),
      /* 可碰撞礁石：都留有宽阔绕行通道，不形成横向封死的墙。 */
      Object.freeze({ key: "rock_d", x: 28, y: 710, w: 150, flip: 1, obstacle: true }),
      Object.freeze({ key: "rock_d", x: 706, y: 835, w: 150, flip: -1, obstacle: true }),
      Object.freeze({ key: "rock_b", x: 336, y: 1060, w: 170, flip: 1, obstacle: true }),
      Object.freeze({ key: "rock_e", x: -48, y: 1315, w: 380, flip: -1, obstacle: true }),
      Object.freeze({ key: "rock", x: 764, y: 1430, w: 360, flip: 1, obstacle: true }),
      Object.freeze({ key: "rock_f", x: 480, y: 1605, w: 130, flip: -1, obstacle: true }),
      Object.freeze({ key: "rock", x: 220, y: 1835, w: 290, flip: -1, obstacle: true }),
      Object.freeze({ key: "rock_e", x: 850, y: 2010, w: 350, flip: 1, obstacle: true }),
      Object.freeze({ key: "rock_b", x: 48, y: 2190, w: 170, flip: -1, obstacle: true }),
      Object.freeze({ key: "rock_c", x: 402, y: 2390, w: 210, flip: 1, obstacle: true }),
      Object.freeze({ key: "rock", x: -42, y: 2585, w: 360, flip: 1, obstacle: true }),
      Object.freeze({ key: "wreck", x: 738, y: 2770, w: 360, flip: -1, obstacle: true }),
      Object.freeze({ key: "rock_f", x: 318, y: 2925, w: 135, flip: 1, obstacle: true }),
      Object.freeze({ key: "rock_e", x: 1280, y: 910, w: 380, flip: 1, obstacle: true }),
      Object.freeze({ key: "rock_b", x: 1680, y: 1280, w: 170, flip: -1, obstacle: true }),
      Object.freeze({ key: "rock_d", x: 2020, y: 1660, w: 170, flip: 1, obstacle: true }),
      Object.freeze({ key: "rock", x: 2360, y: 2140, w: 340, flip: -1, obstacle: true }),
      Object.freeze({ key: "rock_c", x: 2780, y: 2570, w: 200, flip: 1, obstacle: true }),
      Object.freeze({ key: "rock", x: 3180, y: 1120, w: 330, flip: 1, obstacle: true }),
      Object.freeze({ key: "wreck", x: 3540, y: 1790, w: 360, flip: 1, obstacle: true }),
      Object.freeze({ key: "rock_e", x: 3980, y: 2430, w: 390, flip: -1, obstacle: true }),
      Object.freeze({ key: "rock_f", x: 4380, y: 850, w: 120, flip: -1, obstacle: true }),
      Object.freeze({ key: "rock_b", x: 4690, y: 1540, w: 160, flip: 1, obstacle: true }),
      Object.freeze({ key: "rock", x: 5050, y: 2230, w: 340, flip: 1, obstacle: true }),
      Object.freeze({ key: "rock_e", x: 5480, y: 2800, w: 380, flip: -1, obstacle: true }),
      Object.freeze({ key: "rock_d", x: 5840, y: 1350, w: 160, flip: -1, obstacle: true })
    ]),
    /* 远景礁石不参与碰撞，用低透明度形成前、中、后景层次。 */
    backdrops: Object.freeze([
      Object.freeze({ key: "rock_e", x: 470, y: 690, w: 300, flip: -1, alpha: .14 }),
      Object.freeze({ key: "rock_b", x: 80, y: 980, w: 125, flip: 1, alpha: .13 }),
      Object.freeze({ key: "rock_c", x: 620, y: 1260, w: 175, flip: 1, alpha: .12 }),
      Object.freeze({ key: "rock", x: 120, y: 1550, w: 255, flip: -1, alpha: .11 }),
      Object.freeze({ key: "rock_d", x: 660, y: 1930, w: 130, flip: 1, alpha: .10 }),
      Object.freeze({ key: "rock_e", x: 310, y: 2250, w: 260, flip: 1, alpha: .09 }),
      Object.freeze({ key: "rock_b", x: 100, y: 2780, w: 120, flip: -1, alpha: .08 }),
      Object.freeze({ key: "rock_c", x: 590, y: 2950, w: 170, flip: -1, alpha: .07 }),
      Object.freeze({ key: "rock", x: 1080, y: 720, w: 250, flip: 1, alpha: .12 }),
      Object.freeze({ key: "rock_e", x: 1510, y: 1900, w: 280, flip: -1, alpha: .09 }),
      Object.freeze({ key: "rock", x: 2140, y: 1120, w: 250, flip: 1, alpha: .11 }),
      Object.freeze({ key: "rock_c", x: 2930, y: 2050, w: 170, flip: 1, alpha: .09 }),
      Object.freeze({ key: "rock_e", x: 3700, y: 1280, w: 280, flip: 1, alpha: .10 }),
      Object.freeze({ key: "rock", x: 4480, y: 2440, w: 260, flip: -1, alpha: .08 }),
      Object.freeze({ key: "rock_c", x: 5260, y: 1660, w: 170, flip: -1, alpha: .09 })
    ])
  });
  game.PixelWorldConfig = cfg;
})(window);
