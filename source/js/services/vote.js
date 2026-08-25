function getVoteKey(id) {
  return `vote-${id}`;
}

function hasVoted(id) {
  return !!localStorage.getItem(getVoteKey(id));
}

function getVotedValue(id) {
  return localStorage.getItem(getVoteKey(id)); // 'up' 或 'down'
}

function storeVote(id, value) {
  localStorage.setItem(getVoteKey(id), value);
}

function removeVote(id) {
  localStorage.removeItem(getVoteKey(id));
}

function markVoted(el, value) {
  el.classList.add('voted');
  if (value === 'up') {
    el.querySelector('.vote-up')?.classList.add('active');
  } else if (value === 'down') {
    el.querySelector('.vote-down')?.classList.add('active');
  }
}

function revertVote(el, value) {
  const id = el.dataset.id;

  // 回退数值
  if (value === 'up') {
    const upEl = el.querySelector('.up');
    if (upEl) upEl.textContent = Math.max(0, parseInt(upEl.textContent || '1') - 1);
  } else if (value === 'down') {
    const downEl = el.querySelector('.down');
    if (downEl) downEl.textContent = Math.max(0, parseInt(downEl.textContent || '1') - 1);
  }

  // 回退样式和状态
  el.classList.remove('voted', 'active');
  el.querySelector('.vote-up')?.classList.remove('active');
  el.querySelector('.vote-down')?.classList.remove('active');
  removeVote(id);
}

async function loadVote(el) {
  const id = el.dataset.id;
  const api = el.dataset.api;
  if (!id || !api) return;

  try {
    const res = await fetch(`${api}/info?id=${encodeURIComponent(id)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    el.querySelector('.up').textContent = data.votes?.up ?? 0;
    el.querySelector('.down').textContent = data.votes?.down ?? 0;
  } catch (error) {
    void error;
  }
}

function submitVote(el, value) {
  const id = el.dataset.id;
  const api = el.dataset.api;
  if (!id || !api || hasVoted(id)) return;

  const upEl = el.querySelector('.up');
  const downEl = el.querySelector('.down');

  // 乐观更新
  if (value === 'up' && upEl) upEl.textContent = parseInt(upEl.textContent || '0') + 1;
  if (value === 'down' && downEl) downEl.textContent = parseInt(downEl.textContent || '0') + 1;

  storeVote(id, value);
  markVoted(el, value);

  // 后台同步
  fetch(`${api}/update?id=${encodeURIComponent(id)}&value=${encodeURIComponent(value)}`, {
    method: 'POST'
  }).then(response => {
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
  }).catch(() => {
    revertVote(el, value);
  });
}

function initVotes() {
  document.querySelectorAll('.ds-vote').forEach(el => {
    const { id, api } = el.dataset;
    if (!id || !api) return;

    loadVote(el);

    const votedValue = getVotedValue(id);
    if (votedValue) markVoted(el, votedValue);

    el.querySelector('.vote-up')?.addEventListener('click', () => {
      if (!el.classList.contains('active')) submitVote(el, 'up');
    });

    el.querySelector('.vote-down')?.addEventListener('click', () => {
      if (!el.classList.contains('active')) submitVote(el, 'down');
    });
  });
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', initVotes);
} else {
  initVotes();
}
