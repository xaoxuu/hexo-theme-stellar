'use strict';

// 阅读信息统计（#302）：中文字符按 1 字计，英文/数字按空格分词计词
function countWords(content) {
  const text = String(content || '').replace(/<[^>]*>/g, ' ');
  const cjk = (text.match(/[\u4e00-\u9fff]/g) || []).length;
  const latin = (text.replace(/[\u4e00-\u9fff]/g, ' ').match(/[A-Za-z0-9]+(?:[-'][A-Za-z0-9]+)*/g) || []).length;
  return cjk + latin;
}

// 混合阅读速度约 300 字/分钟，最少 1 分钟
function readingMinutes(content, speed = 300) {
  return Math.max(1, Math.ceil(countWords(content) / speed));
}

module.exports = { countWords, readingMinutes };
