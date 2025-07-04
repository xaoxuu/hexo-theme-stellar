async function loadVote(el) {
  const id = el.dataset.id;
  const api = el.dataset.api;
  if (!id || !api) return;

  try {
    const res = await fetch(`${api}/info?id=${encodeURIComponent(id)}`).then(r => r.json());
    const up = el.querySelector('.up');
    const down = el.querySelector('.down');
    if (up) up.textContent = res.votes?.up ?? 0;
    if (down) down.textContent = res.votes?.down ?? 0;
  } catch (e) {
    console.warn(`[vote] 加载失败: id=${id}`, e);
  }
}

async function submitVote(el, value) {
  if (!el?.dataset) return;

  const id = el.dataset.id;
  const api = el.dataset.api;
  if (!id || !api) return;

  try {
    await fetch(`${api}/update?id=${encodeURIComponent(id)}&value=${encodeURIComponent(value)}`, {
      method: 'POST'
    });
    await loadVote(el);
  } catch (e) {
    console.warn(`[vote] 提交失败: id=${id}`, e);
  }
}

function initVotes() {
  document.querySelectorAll('.ds-vote').forEach(el => {
    const { id, api } = el.dataset;
    if (!id || !api) return;

    loadVote(el);
    el.querySelector('.vote-up')?.addEventListener('click', () => submitVote(el, 'up'));
    el.querySelector('.vote-down')?.addEventListener('click', () => submitVote(el, 'down'));
  });
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', initVotes);
} else {
  initVotes();
}