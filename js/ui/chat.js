// Khung trò chuyện (Phiên 15b): mở từ nút "Cộng đồng". Gửi qua LGT.room.say (lọc link/số điện thoại và giới hạn 80 ký tự ở engines/room.js
// và gas/Room.gs); nhận lời người khác qua sự kiện 'lgt:chat'. Mọi chữ hiển thị đều dùng textContent, không chèn HTML.
const MAX_LINES = 40;

export function initChat(hud, { toast }) {
  const box = document.createElement('section');
  box.className = 'ch-box'; box.hidden = true; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', 'Trò chuyện');
  box.innerHTML = `<header><h3>Trò chuyện trong chùa</h3><button type="button" class="ch-x" aria-label="Đóng">×</button></header>
    <ol class="ch-log" aria-live="polite"></ol>
    <form class="ch-form" autocomplete="off"><input class="ch-in" type="text" maxlength="80" placeholder="Viết lời chào…" enterkeyhint="send" aria-label="Lời nhắn"><button type="submit" class="ch-send">Gửi</button></form>
    <p class="ch-note">Lời nhắn hiện trên đầu bạn vài giây. Hãy nói lời hiền hòa; không đăng đường link hay số điện thoại.</p>`;
  hud.appendChild(box);
  const log = box.querySelector('.ch-log'), form = box.querySelector('.ch-form'), input = box.querySelector('.ch-in');

  function add(name, text, mine) {
    const li = document.createElement('li'); if (mine) li.className = 'me';
    const b = document.createElement('b'); b.textContent = name; const s = document.createElement('span'); s.textContent = text;
    li.append(b, s); log.appendChild(li);
    while (log.children.length > MAX_LINES) log.firstChild.remove();
    log.scrollTop = log.scrollHeight;
  }
  document.addEventListener('lgt:chat', (e) => { const d = e.detail || {}; add(String(d.name || 'Khách').slice(0, 20), String(d.text || '').slice(0, 80), !!d.mine); });

  const open = () => { box.hidden = false; setTimeout(() => input.focus({ preventScroll: true }), 30); };
  const close = () => { box.hidden = true; input.blur(); };
  box.querySelector('.ch-x').addEventListener('click', close);
  box.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.stopPropagation(); close(); } });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const v = input.value.trim(); if (!v) return;
    const room = window.LGT && window.LGT.room;
    if (!room) { toast('Chưa kết nối được phòng trò chuyện.', 3000); return; }
    const sent = room.say(v);
    if (!sent) toast('Lời nhắn chưa gửi được: đừng kèm đường link hay số điện thoại nhé.', 4200); else input.value = '';
  });
  return { open, close, toggle: () => (box.hidden ? open() : close()), get isOpen() { return !box.hidden; } };
}
