"use strict";
/* v0.7 场景层：远景负责层次，可碰撞礁石负责路线阻挡，不接触钓鱼数值。 */
(function (root) {
  const game = root.CatFishGame || (root.CatFishGame = {});
  const cfg = game.PixelWorldConfig;
  const aspectByKey = Object.freeze({
    rock: .858, rock_b: 1.354, rock_c: 1.015,
    rock_d: 1.619, rock_e: .773, rock_f: 1.913, wreck: .963
  });

  function itemHeight(item, image) {
    if (image && image.width) return item.w * image.height / image.width;
    return item.w * (aspectByKey[item.key] || .72);
  }

  function drawItem(ctx, image, item, alpha) {
    if (!image || !image.width) return;
    const h = itemHeight(item, image), top = item.y - h;
    ctx.save();
    ctx.globalAlpha = alpha == null ? 1 : alpha;
    if (item.flip < 0) {
      ctx.translate(item.x + item.w, top); ctx.scale(-1, 1);
      ctx.drawImage(image, 0, 0, item.w, h);
    } else ctx.drawImage(image, item.x, top, item.w, h);
    ctx.restore();
  }

  function repeatImage(ctx, image, y, height, worldWidth, mirror) {
    if (!image || !image.width) return;
    const width = height * image.width / image.height;
    const count = Math.ceil(worldWidth / width) + 1;
    for (let i = 0; i < count; i++) {
      const x = i * width;
      if (mirror && i % 2) {
        ctx.save(); ctx.translate(x + width, y); ctx.scale(-1, 1);
        ctx.drawImage(image, 0, 0, width, height); ctx.restore();
      } else ctx.drawImage(image, x, y, width, height);
    }
  }

  function drawSurface(ctx, images) {
    const image = images.map_pixel_surface;
    if (!image || !image.width) return false;
    const h = 700;
    repeatImage(ctx, image, cfg.waterY - h * .51, h, cfg.worldWidth, true);
    return true;
  }

  function drawUnderwater(ctx, images) {
    const depth = images.map_pixel_depth;
    if (depth && depth.width) {
      const tileW = 900, tileH = cfg.seabedY - cfg.waterY + 100;
      for (let x = 0, i = 0; x < cfg.worldWidth; x += tileW, i++) {
        if (i % 2) {
          ctx.save(); ctx.translate(x + tileW, cfg.waterY); ctx.scale(-1, 1);
          ctx.drawImage(depth, 0, 0, tileW, tileH); ctx.restore();
        } else ctx.drawImage(depth, x, cfg.waterY, tileW, tileH);
      }
    }
    const seabed = images.map_pixel_seabed;
    if (seabed && seabed.width) repeatImage(ctx, seabed, cfg.seabedY, 560, cfg.worldWidth, true);
    (cfg.backdrops || []).forEach(function (item) {
      drawItem(ctx, images[item.key], item, item.alpha);
    });
    cfg.structures.forEach(function (item) { drawItem(ctx, images[item.key], item); });
  }

  function solidAt(x, y) {
    for (const item of cfg.structures) {
      if (item.obstacle && game.ReefArtSystem) {
        const hit = game.ReefArtSystem.hit(item, x, y);
        if (hit !== null) { if (hit) return true; continue; }
      }
      const h = itemHeight(item);
      const side = item.obstacle ? .14 : .12;
      const solidHeight = item.obstacle ? .82 : .78;
      if (x >= item.x + item.w * side && x <= item.x + item.w * (1 - side) &&
          y >= item.y - h * solidHeight && y <= item.y) return true;
    }
    return y >= cfg.worldHeight - 28;
  }

  function regionAt(x) {
    return cfg.regions.find(function (region) { return x >= region.min && x < region.max; }) || cfg.regions[0];
  }

  game.PixelWorldSystem = Object.freeze({
    drawSurface: drawSurface,
    drawUnderwater: drawUnderwater,
    solidAt: solidAt,
    regionAt: regionAt
  });
})(window);
