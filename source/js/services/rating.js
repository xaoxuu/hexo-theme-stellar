async function loadRating(el) {
  const id = el.dataset.id;
  const api = el.dataset.api;
  if (!id || !api) return;

  try {
    const res = await fetch(`${api}/info?id=${encodeURIComponent(id)}`).then(r => r.json());
    const rating = res.rating || {};

    // ✅ 只统计 key 是数字的评分项
    const validScores = Object.entries(rating).filter(([k]) => !isNaN(Number(k)));

    const total = validScores.reduce((sum, [k, c]) => sum + Number(k) * c, 0);
    const votes = validScores.reduce((sum, [, c]) => sum + c, 0);
    const avg = votes > 0 ? (total / votes).toFixed(2) : '0.00';

    let avgEl = el.querySelector('.avg');
    if (!avgEl) {
      avgEl = document.createElement('span');
      avgEl.className = 'avg';
      el.appendChild(avgEl);
    }
    avgEl.textContent = `(${avg})`;
  } catch (e) {
    console.warn(`[rating] 加载失败: id=${id}`, e);
  }
}

async function submitRating(el, value) {
  const id = el.dataset.id;
  const api = el.dataset.api;
  if (!id || !api) return;

  try {
    await fetch(`${api}/update?id=${encodeURIComponent(id)}&value=${value}`, {
      method: 'POST'
    });
    await loadRating(el);
  } catch (e) {
    console.warn(`[rating] 提交失败: id=${id}`, e);
  }
}

function initRatings() {
  document.querySelectorAll('.ds-rating').forEach(el => {
    const { id, api } = el.dataset;
    if (!id || !api) return;

    loadRating(el);

    el.querySelectorAll('.star')?.forEach(star => {
      const value = star.dataset.value;
      star.addEventListener('click', () => submitRating(el, value));
    });
  });
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', initRatings);
} else {
  initRatings();
}