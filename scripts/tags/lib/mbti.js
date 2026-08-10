/**
 * mbti.js v1 | https://github.com/xaoxuu/hexo-theme-stellar/
 *
 * {% mbti INTJ-T 93-72-78-83-51 [url:https://...] [image:src] %}
 *
 * - type: 人格类型代码（如 INTJ-T / INTJ，大小写均可），决定标题与配色
 * - scores: 五个百分比，用 - 分隔，顺序固定为 energy-mind-nature-tactics-identity
 * - url: 档案链接（可选，url:https://...），支持完整 URL 或纯档案 ID
 * - image: 标题上方横幅图片地址（可选）
 */

'use strict';

var TYPE_ROLES = {
  INTJ: 'analyst',
  INTP: 'analyst',
  ENTJ: 'analyst',
  ENTP: 'analyst',
  INFJ: 'diplomat',
  INFP: 'diplomat',
  ENFJ: 'diplomat',
  ENFP: 'diplomat',
  ISTJ: 'sentinel',
  ISFJ: 'sentinel',
  ESTJ: 'sentinel',
  ESFJ: 'sentinel',
  ISTP: 'explorer',
  ISFP: 'explorer',
  ESTP: 'explorer',
  ESFP: 'explorer'
};

var ROLE_COLORS = {
  analyst: 'purple',
  diplomat: 'green',
  sentinel: 'blue',
  explorer: 'yellow'
};

var TRAIT_KEYS = ['energy', 'mind', 'nature', 'tactics', 'identity'];

var TRAIT_COLORS = {
  energy: '#2196f3',
  mind: '#FFBD2B',
  nature: '#3DC550',
  tactics: '#9c27b0',
  identity: '#F44336'
};

// 根据类型代码推导每个维度的偏向侧（trait 侧）：E/I、N/S、T/F、J/P、A/T
function getTraitSides(typeCode) {
  var code = typeCode.replace('-', '');
  var sides = {};
  sides.energy = code.charAt(0) === 'E' ? 'left' : 'right';
  sides.mind = code.charAt(1) === 'N' ? 'left' : 'right';
  sides.nature = code.charAt(2) === 'T' ? 'left' : 'right';
  sides.tactics = code.charAt(3) === 'J' ? 'left' : 'right';
  if (code.charAt(4) === 'A') {
    sides.identity = 'left';
  } else if (code.charAt(4) === 'T') {
    sides.identity = 'right';
  } else {
    sides.identity = 'left';
    console.warn('[mbti] identity variant missing, default to Assertive (-A): ' + typeCode);
  }
  return sides;
}

function clamp(value) {
  value = parseInt(value, 10);
  if (isNaN(value)) {
    value = 0;
  }
  return Math.max(0, Math.min(100, value));
}

function alphaHex(hex, alpha) {
  var r = parseInt(hex.slice(1, 3), 16);
  var g = parseInt(hex.slice(3, 5), 16);
  var b = parseInt(hex.slice(5, 7), 16);
  return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
}

module.exports = ctx => function(args) {
  args = ctx.args.map(args, ['image', 'url'], ['type', 'scores']);

  var typeCode = String(args.type || '').trim().toUpperCase();
  if (!typeCode) {
    console.error('[mbti] missing personality type');
    return '';
  }
  var typeMatch = typeCode.match(/^([A-Z]{4})/);
  var typeKey = typeMatch ? typeMatch[1] : null;
  var role = typeKey ? TYPE_ROLES[typeKey] : null;
  if (!role) {
    console.warn('[mbti] unknown personality type: ' + typeCode);
  }
  var themeColor = role ? ROLE_COLORS[role] : '';

  var __ = (this && typeof this.__ === 'function') ? this.__ : ctx.theme.i18n.__(ctx.config.language);
  var typeName = typeKey ? __('tag_plugins.mbti.types.' + typeKey) : '';
  if (!typeName || typeName.indexOf('tag_plugins.mbti.types.') === 0) {
    typeName = typeCode;
  }

  var scoreParts = String(args.scores || '').split('-');
  var pcts = [];
  for (var i = 0; i < TRAIT_KEYS.length; i++) {
    pcts.push(clamp(scoreParts[i]));
  }

  var url = args.url ? String(args.url).trim() : '';
  if (url && !/^https?:\/\//i.test(url)) {
    url = 'https://www.16personalities.com/ch/' + encodeURIComponent('档案') + '/' + url;
  }
  if (url) {
    url = url.replace(/"/g, '&quot;');
  }

  var image = args.image ? String(args.image).trim() : '';
  if (image) {
    image = image.replace(/"/g, '&quot;');
  }

  var traitSides = getTraitSides(typeCode);

  var el = '<div class="tag-plugin colorful note mbti"';
  if (themeColor) {
    el += ' color="' + themeColor + '"';
  }
  el += '>';
  if (image) {
    el += '<img class="mbti-image" src="' + image + '" alt="" />';
  }
  var title = __('tag_plugins.mbti.title', typeCode, typeName);
  el += '<div class="mbti-title">';
  if (url) {
    el += '<a class="mbti-title-link" href="' + url + '" target="_blank" rel="external nofollow noopener noreferrer">' + title + '</a>';
  } else {
    el += '<span class="mbti-title-text">' + title + '</span>';
  }
  el += '</div>';
  el += '<div class="mbti-body">';
  el += '<div class="mbti-traits">';
  for (var j = 0; j < TRAIT_KEYS.length; j++) {
    var key = TRAIT_KEYS[j];
    var left = __('tag_plugins.mbti.traits.' + key + '.left');
    var right = __('tag_plugins.mbti.traits.' + key + '.right');
    var pct = pcts[j];
    // 官网规则：trait 在左端时 reverse=true，圆点位置 = reverse ? 100-pct : pct，高亮侧由圆点位置决定
    var reverse = traitSides[key] === 'left';
    var position = reverse ? 100 - pct : pct;
    var activeSide = position <= 50 ? 'left' : 'right';
    // 填充从主导侧（trait 侧）开始：trait 在右时 fill 右对齐
    var reversed = traitSides[key] === 'right' ? ' reversed' : '';
    el += '<div class="mbti-trait' + reversed + '" style="--theme:' + TRAIT_COLORS[key] + '; --theme-a30:' + alphaHex(TRAIT_COLORS[key], 0.3) + '">';
    el += '<div class="mbti-labels">';
    el += '<span class="mbti-label left' + (activeSide === 'left' ? ' active' : '') + '">' + left + (activeSide === 'left' ? ' <span class="pct">' + pct + '%</span>' : '') + '</span>';
    el += '<span class="mbti-label right' + (activeSide === 'right' ? ' active' : '') + '">' + (activeSide === 'right' ? '<span class="pct">' + pct + '%</span> ' : '') + right + '</span>';
    el += '</div>';
    // fill 从主导侧端点延伸到圆点位置（宽度与圆点互补），保证填充末端与圆点对齐
    el += '<div class="mbti-progress"><div class="fill" style="width:' + (100 - pct) + '%"></div><span class="mbti-dot" style="left:' + position + '%"></span></div>';
    el += '</div>';
  }
  el += '</div>';
  el += '</div>';
  el += '</div>';
  return el;
};
