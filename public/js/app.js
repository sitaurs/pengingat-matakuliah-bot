/* ═══════════════════════════════════════ */
/*   BOTTY ADMIN — FRONTEND SPA   */
/* ═══════════════════════════════════════ */

const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const DAYS1 = ['', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

// ── State ──
let token = localStorage.getItem('bot_token') || '';
let currentPage = 'dashboard';
let cachedCourses = [];
let cachedTargets = [];
let cachedEntries = [];
let activeDay = new Date().getDay(); // 0=Sun
if (activeDay === 0 || activeDay > 5) activeDay = 1; // default Monday

// ── API Helper ──
async function api(path, opts = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['X-Admin-Token'] = token;
  const res = await fetch('/api' + path, { ...opts, headers });
  if (res.status === 401) { logout(); throw new Error('Unauthorized'); }
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

// ── Toast ──
function toast(msg, type = 'info') {
  const c = document.getElementById('toast-container');
  if (!c) return;
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.textContent = msg;
  c.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, 3500);
}

// ── Login / Logout ──
function showLogin() {
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('app').style.display = 'none';
}

function showApp() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app').style.display = 'flex';
  navigate('dashboard');
}

function logout() {
  token = '';
  localStorage.removeItem('bot_token');
  showLogin();
}

async function handleLogin(e) {
  e.preventDefault();
  const user = document.getElementById('login-user').value;
  const pass = document.getElementById('login-pass').value;
  const errEl = document.getElementById('login-error');
  errEl.textContent = '';
  errEl.style.display = 'none';
  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: user, password: pass })
    });
    if (res.ok) {
      token = btoa(user + ':' + pass);
      localStorage.setItem('bot_token', token);
      showApp();
      toast('Login berhasil!', 'success');
    } else {
      errEl.textContent = 'Username atau password salah';
      errEl.style.display = 'block';
    }
  } catch {
    errEl.textContent = 'Gagal terhubung ke server';
    errEl.style.display = 'block';
  }
}

// ── Navigation ──
function navigate(page) {
  currentPage = page;
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const pageEl = document.getElementById('page-' + page);
  if (pageEl) pageEl.classList.add('active');
  const navEl = document.querySelector(`[data-page="${page}"]`);
  if (navEl) navEl.classList.add('active');
  const titleEl = document.getElementById('page-title');
  if (titleEl) titleEl.textContent = getPageTitle(page);
  loadPageData(page);
}

function getPageTitle(page) {
  const t = { dashboard:'Dashboard', jadwal:'Jadwal Kuliah', courses:'Mata Kuliah', groups:'Grup Chat', notes:'Notes', holidays:'Libur', reminders:'Reminders' };
  return t[page] || 'Dashboard';
}

// ── Page Data Loaders ──
async function loadPageData(page) {
  try {
    switch (page) {
      case 'dashboard': await loadDashboard(); break;
      case 'jadwal': await loadJadwal(); break;
      case 'courses': await loadCourses(); break;
      case 'groups': await loadGroups(); break;
      case 'notes': await loadNotes(); break;
      case 'holidays': await loadHolidays(); break;
      case 'reminders': await loadReminders(); break;
    }
  } catch (err) {
    console.error('loadPageData error:', err);
    toast('Gagal memuat data: ' + err.message, 'error');
  }
}

// ══════════════════════════════
//  DASHBOARD
// ══════════════════════════════
async function loadDashboard() {
  const data = await api('/dashboard');

  // Stats — match HTML IDs exactly
  setText('stat-courses', data.courses ?? 0);
  setText('stat-entries', data.scheduleEntries ?? 0);
  setText('stat-groups', data.chatTargets ?? 0);
  setText('stat-pending', data.pendingReminders ?? 0);

  // Reminder bars — update existing elements instead of rebuilding
  const pending = data.pendingReminders || 0;
  const sent = data.sentReminders || 0;
  const failed = data.failedReminders || 0;
  const total = pending + sent + failed || 1;
  setBar('bar-pending', 'bar-pending-val', pending, total);
  setBar('bar-sent', 'bar-sent-val', sent, total);
  setBar('bar-failed', 'bar-failed-val', failed, total);

  // GoWA status badge
  const badge = document.getElementById('bot-status');
  if (badge) {
    if (data.gowaConnected) {
      badge.className = 'badge badge-success';
      badge.innerHTML = '<i class="fas fa-circle"></i> Online';
    } else {
      badge.className = 'badge badge-danger';
      badge.innerHTML = '<i class="fas fa-circle"></i> Offline';
    }
  }

  // Load upcoming reminders
  loadUpcomingReminders();
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function setBar(barId, valId, count, total) {
  const bar = document.getElementById(barId);
  const val = document.getElementById(valId);
  if (bar) bar.style.width = Math.round((count / total) * 100) + '%';
  if (val) val.textContent = count;
}

function refreshDashboard() { loadDashboard(); toast('Refreshed!', 'info'); }

async function loadUpcomingReminders() {
  try {
    const data = await api('/reminders/upcoming');
    const container = document.getElementById('upcoming-reminders');
    if (!container) return;
    if (!data || data.length === 0) {
      container.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-dim)"><i class="fas fa-check-circle"></i> Tidak ada reminder mendatang</div>';
      return;
    }
    container.innerHTML = data.map((r, i) => {
      const dt = new Date(r.scheduledAt);
      const dateStr = dt.toLocaleDateString('id-ID', { weekday:'short', day:'numeric', month:'short' });
      const timeStr = dt.toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit', hour12:false });
      const typeIcon = r.eventType === 'PRE_CLASS' ? '⏰' : r.eventType === 'CLASS_START' ? '🔔' : '📢';
      const typeLabel = r.eventType === 'PRE_CLASS' ? 'Pre-Class' : r.eventType === 'CLASS_START' ? 'Class Start' : r.eventType;
      const typeBadgeColor = r.eventType === 'PRE_CLASS' ? 'rgba(255,165,0,0.2);color:#ffa500' : 'rgba(0,245,255,0.2);color:#00f5ff';
      return `<div class="upcoming-reminder-item" onclick='previewReminderMessage(${JSON.stringify(r.messagePreview).replace(/'/g, "&#39;")})'>
        <div style="display:flex;align-items:center;gap:12px;flex:1;min-width:0">
          <span style="font-size:20px;flex-shrink:0">${typeIcon}</span>
          <div style="min-width:0;flex:1">
            <div style="font-weight:600;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(r.courseName)}</div>
            <div style="font-size:12px;color:var(--text-dim);display:flex;gap:8px;flex-wrap:wrap">
              <span>📅 ${dateStr}</span>
              <span>🕐 ${timeStr}</span>
              <span>📍 ${esc(r.location)}</span>
            </div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:8px;flex-shrink:0">
          <span style="font-size:11px;padding:2px 8px;border-radius:8px;background:${typeBadgeColor}">${typeLabel}</span>
          <span style="font-size:11px;color:var(--text-dim)">${esc(r.chatTargetLabel)}</span>
          <i class="fas fa-eye" style="color:var(--accent);font-size:12px"></i>
        </div>
      </div>`;
    }).join('');
  } catch (e) {
    const container = document.getElementById('upcoming-reminders');
    if (container) container.innerHTML = '<div style="text-align:center;padding:20px;color:var(--pink)"><i class="fas fa-exclamation-triangle"></i> Gagal memuat reminder</div>';
  }
}

function previewReminderMessage(message) {
  const formatted = message
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*([^*]+)\*/g, '<strong>$1</strong>')
    .replace(/_([^_]+)_/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code style="background:rgba(0,245,255,0.1);padding:1px 4px;border-radius:3px">$1</code>')
    .replace(/\n/g, '<br>');
  const body = `<div style="background:#0b141a;border-radius:12px;padding:16px 14px;font-family:'Segoe UI',sans-serif;font-size:13.5px;line-height:1.6;color:#e9edef;max-height:50vh;overflow-y:auto;white-space:pre-line;border:1px solid rgba(0,245,255,0.15)">
    <div style="margin-bottom:8px"><span style="background:#00a884;color:#fff;font-size:10px;padding:2px 8px;border-radius:4px">📱 WhatsApp Preview</span></div>
    ${formatted}
  </div>`;
  document.getElementById('modal-title').textContent = '📱 Preview Pesan Reminder';
  document.getElementById('modal-body').innerHTML = body + `
    <div style="display:flex;gap:8px;margin-top:16px;justify-content:flex-end">
      <button class="btn btn-outline" onclick="closeModal()">Tutup</button>
    </div>`;
  document.getElementById('modal-overlay').style.display = 'flex';
}

async function testGoWA() {
  try {
    const data = await api('/health');
    toast(data.gowaConnected ? 'GoWA terhubung!' : 'GoWA tidak terhubung', data.gowaConnected ? 'success' : 'error');
  } catch (e) { toast('Gagal cek: ' + e.message, 'error'); }
}

// ══════════════════════════════
//  JADWAL / SCHEDULE
// ══════════════════════════════
async function loadJadwal() {
  cachedEntries = await api('/schedule-entries');
  // Wire up existing tab buttons in HTML
  document.querySelectorAll('.tabs .tab[data-day]').forEach(btn => {
    const day = parseInt(btn.dataset.day);
    btn.classList.toggle('active', day === activeDay);
    btn.onclick = () => {
      activeDay = day;
      document.querySelectorAll('.tabs .tab[data-day]').forEach(t => t.classList.toggle('active', parseInt(t.dataset.day) === day));
      renderSchedule();
    };
  });
  renderSchedule();
}

function renderSchedule() {
  const container = document.getElementById('schedule-list');
  if (!container) return;
  const filtered = cachedEntries.filter(e => e.dayOfWeek === activeDay).sort((a, b) => a.startTime.localeCompare(b.startTime));
  if (!filtered.length) {
    container.innerHTML = '<div class="empty-state"><i class="fas fa-calendar-day"></i><p>Tidak ada jadwal hari ' + DAYS1[activeDay] + '</p></div>';
    return;
  }
  container.innerHTML = filtered.map(e => `
    <div class="schedule-item">
      <div class="schedule-time">${e.startTime} — ${e.endTime}</div>
      <div class="schedule-info">
        <div class="schedule-name">${esc(e.course?.name || 'N/A')}</div>
        <div class="schedule-detail">
          <span><i class="fas fa-map-marker-alt"></i> ${esc(e.locationOverride || e.course?.locationDefault || '-')}</span>
          <span><i class="fas fa-chalkboard-teacher"></i> ${esc(e.course?.lecturerName || '-')}</span>
        </div>
      </div>
      <div class="schedule-actions">
        <button class="btn btn-ghost btn-sm" onclick="editScheduleEntry(${e.id})"><i class="fas fa-edit"></i></button>
        <button class="btn btn-ghost btn-sm" onclick="deleteScheduleEntry(${e.id})"><i class="fas fa-trash"></i></button>
      </div>
    </div>`).join('');
}

async function editScheduleEntry(id) {
  await ensureCourses();
  const e = cachedEntries.find(x => x.id === id);
  if (!e) return;
  const dayOpts = [1,2,3,4,5].map(d => `<option value="${d}" ${d===e.dayOfWeek?'selected':''}>${DAYS1[d]}</option>`).join('');
  const courseOpts = cachedCourses.map(c => `<option value="${c.id}" ${c.id===e.courseId?'selected':''}>${esc(c.name)}</option>`).join('');
  openModal('Edit Jadwal', `
    <div class="form-group"><label>Hari</label><select class="form-input" id="f-day">${dayOpts}</select></div>
    <div class="form-group"><label>Mata Kuliah</label><select class="form-input" id="f-course">${courseOpts}</select></div>
    <div class="form-group"><label>Jam Mulai</label><input class="form-input" id="f-start" value="${e.startTime}"></div>
    <div class="form-group"><label>Jam Selesai</label><input class="form-input" id="f-end" value="${e.endTime}"></div>
    <div class="form-group"><label>Ruangan</label><input class="form-input" id="f-loc" value="${e.locationOverride || e.course?.locationDefault || ''}" placeholder="${e.course?.locationDefault || 'Ruangan'}"></div>`,
    async () => {
      await api('/schedule-entries/' + id, { method: 'PUT', body: JSON.stringify({
        dayOfWeek: +gv('f-day'), courseId: +gv('f-course'), startTime: gv('f-start'), endTime: gv('f-end'), locationOverride: gv('f-loc') || null
      })});
      toast('Jadwal diperbarui!', 'success');
      loadJadwal();
    }
  );
}

async function deleteScheduleEntry(id) {
  if (!confirm('Hapus jadwal ini?')) return;
  try {
    await api('/schedule-entries/' + id, { method: 'DELETE' });
    toast('Jadwal dihapus', 'success');
    loadJadwal();
  } catch (e) { toast('Gagal hapus: ' + e.message, 'error'); }
}

// ══════════════════════════════
//  COURSES
// ══════════════════════════════
async function loadCourses() {
  cachedCourses = await api('/courses');
  const container = document.getElementById('courses-list');
  if (!container) return;
  if (!cachedCourses.length) { container.innerHTML = '<div class="empty-state"><i class="fas fa-book"></i><p>Belum ada mata kuliah</p></div>'; return; }
  container.innerHTML = cachedCourses.map(c => `
    <div class="data-row">
      <div class="main-info">
        <h4>${esc(c.name)}</h4>
        <p><i class="fas fa-user"></i> ${esc(c.lecturerName)} ${c.lecturerWa ? '&bull; <i class="fab fa-whatsapp"></i> ' + esc(c.lecturerWa) : ''}</p>
      </div>
      <div class="row-actions">
        <button class="btn btn-ghost btn-sm" onclick="editCourse(${c.id})"><i class="fas fa-edit"></i></button>
        <button class="btn btn-ghost btn-sm" onclick="deleteCourse(${c.id})"><i class="fas fa-trash"></i></button>
      </div>
    </div>`).join('');
}

async function editCourse(id) {
  const c = cachedCourses.find(x => x.id === id);
  if (!c) return;
  openModal('Edit Mata Kuliah', `
    <div class="form-group"><label>Nama</label><input class="form-input" id="f-name" value="${esc(c.name)}"></div>
    <div class="form-group"><label>Dosen</label><input class="form-input" id="f-lecturer" value="${esc(c.lecturerName)}"></div>
    <div class="form-group"><label>No WA Dosen</label><input class="form-input" id="f-wa" value="${esc(c.lecturerWa||'')}"></div>
    <div class="form-group"><label>Kode Dosen</label><input class="form-input" id="f-code" value="${esc(c.lecturerCode||'')}"></div>
    <div class="form-group"><label>Lokasi Default</label><input class="form-input" id="f-defloc" value="${esc(c.locationDefault||'')}"></div>`,
    async () => {
      await api('/courses/' + id, { method: 'PUT', body: JSON.stringify({
        name: gv('f-name'), lecturerName: gv('f-lecturer'), lecturerWa: gv('f-wa') || null, lecturerCode: gv('f-code') || null, locationDefault: gv('f-defloc') || null
      })});
      toast('Mata kuliah diperbarui!', 'success');
      loadCourses();
    }
  );
}

async function deleteCourse(id) {
  if (!confirm('Hapus mata kuliah ini?')) return;
  try {
    await api('/courses/' + id, { method: 'DELETE' });
    toast('Mata kuliah dihapus', 'success');
    loadCourses();
  } catch (e) { toast('Gagal hapus: ' + e.message, 'error'); }
}

// ══════════════════════════════
//  GROUPS
// ══════════════════════════════
async function loadGroups() {
  cachedTargets = await api('/chat-targets');
  const container = document.getElementById('groups-list');
  if (!container) return;
  if (!cachedTargets.length) { container.innerHTML = '<div class="empty-state"><i class="fas fa-users"></i><p>Belum ada grup</p></div>'; return; }
  container.innerHTML = cachedTargets.map(g => `
    <div class="data-row">
      <div class="main-info">
        <h4>${esc(g.label)}</h4>
        <p style="font-family:monospace;font-size:12px">${esc(g.chatId)}</p>
      </div>
      <span class="row-badge ${g.enabled ? 'active' : 'inactive'}">${g.enabled ? 'Aktif' : 'Nonaktif'}</span>
      <div class="row-actions">
        <button class="btn btn-ghost btn-sm" onclick="toggleGroup(${g.id},${!g.enabled})"><i class="fas fa-${g.enabled?'pause':'play'}"></i></button>
        <button class="btn btn-ghost btn-sm" onclick="editGroup(${g.id})"><i class="fas fa-edit"></i></button>
        <button class="btn btn-ghost btn-sm" onclick="deleteGroup(${g.id})"><i class="fas fa-trash"></i></button>
      </div>
    </div>`).join('');
}

async function editGroup(id) {
  const g = cachedTargets.find(x => x.id === id);
  if (!g) return;
  openModal('Edit Grup', `
    <div class="form-group"><label>Chat ID</label><input class="form-input" id="f-chatid" value="${esc(g.chatId)}"></div>
    <div class="form-group"><label>Label</label><input class="form-input" id="f-label" value="${esc(g.label)}"></div>
    <div class="form-group"><label>Reminder Offset (menit)</label><input class="form-input" type="number" id="f-offset" value="${g.reminderOffset}"></div>
    <div class="form-group"><label class="form-check"><input type="checkbox" id="f-en" ${g.enabled?'checked':''}> Aktifkan</label></div>`,
    async () => {
      await api('/chat-targets/' + id, { method: 'PUT', body: JSON.stringify({
        chatId: gv('f-chatid'), label: gv('f-label'), reminderOffset: +gv('f-offset'), enabled: document.getElementById('f-en').checked
      })});
      toast('Grup diperbarui!', 'success');
      loadGroups();
    }
  );
}

async function toggleGroup(id, enabled) {
  await api('/chat-targets/' + id, { method: 'PUT', body: JSON.stringify({ enabled }) });
  toast(enabled ? 'Grup diaktifkan' : 'Grup dinonaktifkan', 'success');
  loadGroups();
}

async function deleteGroup(id) {
  if (!confirm('Hapus grup ini?')) return;
  try {
    await api('/chat-targets/' + id, { method: 'DELETE' });
    toast('Grup dihapus', 'success');
    loadGroups();
  } catch (e) { toast('Gagal hapus grup: ' + e.message, 'error'); }
}

// ══════════════════════════════
//  NOTES
// ══════════════════════════════
async function loadNotes() {
  const data = await api('/notes');
  const container = document.getElementById('notes-list');
  if (!container) return;
  if (!data.length) { container.innerHTML = '<div class="empty-state"><i class="fas fa-sticky-note"></i><p>Belum ada catatan</p></div>'; return; }
  container.innerHTML = data.map(n => `
    <div class="data-row">
      <div class="main-info">
        <h4>${esc(n.course?.name || 'Course #' + n.courseId)}</h4>
        <p style="white-space:pre-wrap">${esc(n.text)}</p>
      </div>
      <div class="row-actions">
        <button class="btn btn-ghost btn-sm" onclick="editNote(${n.id})"><i class="fas fa-edit"></i></button>
        <button class="btn btn-ghost btn-sm" onclick="deleteNote(${n.id})"><i class="fas fa-trash"></i></button>
      </div>
    </div>`).join('');
}

async function editNote(id) {
  const notes = await api('/notes');
  const n = notes.find(x => x.id === id);
  if (!n) return;
  await ensureCourses();
  const opts = cachedCourses.map(c => `<option value="${c.id}" ${c.id===n.courseId?'selected':''}>${esc(c.name)}</option>`).join('');
  openModal('Edit Catatan', `
    <div class="form-group"><label>Mata Kuliah</label><select class="form-input" id="f-course">${opts}</select></div>
    <div class="form-group"><label>Catatan</label><textarea class="form-input" id="f-text" rows="4">${esc(n.text)}</textarea></div>`,
    async () => {
      await api('/notes/' + id, { method: 'PUT', body: JSON.stringify({ courseId: +gv('f-course'), text: gv('f-text') })});
      toast('Catatan diperbarui!', 'success');
      loadNotes();
    }
  );
}

async function deleteNote(id) {
  if (!confirm('Hapus catatan ini?')) return;
  try {
    await api('/notes/' + id, { method: 'DELETE' });
    toast('Catatan dihapus', 'success');
    loadNotes();
  } catch (e) { toast('Gagal hapus: ' + e.message, 'error'); }
}

// ══════════════════════════════
//  HOLIDAYS
// ══════════════════════════════
async function loadHolidays() {
  const data = await api('/holidays');
  const container = document.getElementById('holidays-list');
  if (!container) return;
  if (!data.length) { container.innerHTML = '<div class="empty-state"><i class="fas fa-umbrella-beach"></i><p>Belum ada hari libur</p></div>'; return; }
  container.innerHTML = data.map(h => `
    <div class="data-row">
      <div class="main-info">
        <h4>${esc(h.reason)}</h4>
        <p><i class="fas fa-calendar"></i> ${formatDate(h.date)}</p>
      </div>
      <span class="row-badge ${h.enabled ? 'active' : 'inactive'}">${h.enabled ? 'Aktif' : 'Nonaktif'}</span>
      <div class="row-actions">
        <button class="btn btn-ghost btn-sm" onclick="editHoliday(${h.id})"><i class="fas fa-edit"></i></button>
        <button class="btn btn-ghost btn-sm" onclick="deleteHoliday(${h.id})"><i class="fas fa-trash"></i></button>
      </div>
    </div>`).join('');
}

async function editHoliday(id) {
  const holidays = await api('/holidays');
  const h = holidays.find(x => x.id === id);
  if (!h) return;
  openModal('Edit Hari Libur', `
    <div class="form-group"><label>Tanggal</label><input class="form-input" type="date" id="f-date" value="${h.date}"></div>
    <div class="form-group"><label>Keterangan</label><input class="form-input" id="f-reason" value="${esc(h.reason)}"></div>
    <div class="form-group"><label class="form-check"><input type="checkbox" id="f-en" ${h.enabled?'checked':''}> Aktifkan</label></div>`,
    async () => {
      await api('/holidays/' + id, { method: 'PUT', body: JSON.stringify({
        date: gv('f-date'), reason: gv('f-reason'), enabled: document.getElementById('f-en').checked
      })});
      toast('Hari libur diperbarui!', 'success');
      loadHolidays();
    }
  );
}

async function deleteHoliday(id) {
  if (!confirm('Hapus hari libur ini?')) return;
  try {
    await api('/holidays/' + id, { method: 'DELETE' });
    toast('Hari libur dihapus', 'success');
    loadHolidays();
  } catch (e) { toast('Gagal hapus: ' + e.message, 'error'); }
}

// ══════════════════════════════
//  REMINDERS
// ══════════════════════════════
async function loadReminders() {
  const filterEl = document.getElementById('reminder-filter');
  const status = filterEl ? filterEl.value : '';
  let url = '/reminders';
  if (status) url += '?status=' + status;
  const data = await api(url);
  const container = document.getElementById('reminders-list');
  if (!container) return;
  if (!data.length) { container.innerHTML = '<div class="empty-state"><i class="fas fa-bell-slash"></i><p>Tidak ada reminder</p></div>'; return; }
  container.innerHTML = data.map(r => `
    <div class="data-row">
      <div class="main-info">
        <h4>${esc(r.eventType)} — ${esc(r.chatTarget?.label || String(r.chatTargetId))}</h4>
        <p>${r.message ? esc(r.message.substring(0, 100)) + '...' : 'No message'}</p>
        <p style="font-size:11px;color:var(--text-dimmer)">Scheduled: ${formatDateTime(r.scheduledAt)} ${r.sentAt ? '&bull; Sent: ' + formatDateTime(r.sentAt) : ''}</p>
      </div>
      <span class="row-badge ${r.status.toLowerCase()}">${r.status}</span>
    </div>`).join('');
}

async function rebuildQueue() {
  try {
    const result = await api('/reminders/rebuild', { method: 'POST' });
    toast('Queue rebuilt! (' + (result.count || 0) + ' entries)', 'success');
    if (currentPage === 'reminders') loadReminders();
    if (currentPage === 'dashboard') loadDashboard();
  } catch (e) { toast('Gagal rebuild: ' + e.message, 'error'); }
}

async function clearOldReminders() {
  if (!confirm('Hapus reminder lama (SENT/FAILED)?')) return;
  try {
    await api('/reminders/clear-old', { method: 'DELETE' });
    toast('Reminder lama dihapus', 'success');
    if (currentPage === 'reminders') loadReminders();
    if (currentPage === 'dashboard') loadDashboard();
  } catch (e) { toast('Gagal: ' + e.message, 'error'); }
}

// ══════════════════════════════
//  showModal — bridges HTML onclick="showModal('type')"
// ══════════════════════════════
async function showModal(type) {
  switch (type) {
    case 'entry': {
      await ensureCourses();
      const dayOpts = [1,2,3,4,5].map(d => `<option value="${d}">${DAYS1[d]}</option>`).join('');
      const courseOpts = cachedCourses.map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join('');
      openModal('Tambah Jadwal', `
        <div class="form-group"><label>Hari</label><select class="form-input" id="f-day">${dayOpts}</select></div>
        <div class="form-group"><label>Mata Kuliah</label><select class="form-input" id="f-course">${courseOpts}</select></div>
        <div class="form-group"><label>Jam Mulai (HH:mm)</label><input class="form-input" id="f-start" placeholder="07:00"></div>
        <div class="form-group"><label>Jam Selesai (HH:mm)</label><input class="form-input" id="f-end" placeholder="09:30"></div>
        <div class="form-group"><label>Ruangan (opsional)</label><input class="form-input" id="f-loc" placeholder="R.AH.3.38"></div>`,
        async () => {
          await api('/schedule-entries', { method: 'POST', body: JSON.stringify({
            dayOfWeek: +gv('f-day'), courseId: +gv('f-course'), startTime: gv('f-start'), endTime: gv('f-end'), locationOverride: gv('f-loc') || null
          })});
          toast('Jadwal ditambahkan!', 'success');
          loadJadwal();
        }
      );
      break;
    }
    case 'course': {
      openModal('Tambah Mata Kuliah', `
        <div class="form-group"><label>Nama</label><input class="form-input" id="f-name" placeholder="Workshop Elektronika"></div>
        <div class="form-group"><label>Dosen</label><input class="form-input" id="f-lecturer" placeholder="Dr. Budi S.T., M.T."></div>
        <div class="form-group"><label>No WA Dosen</label><input class="form-input" id="f-wa" placeholder="+628xxx"></div>
        <div class="form-group"><label>Kode Dosen</label><input class="form-input" id="f-code" placeholder="LDM"></div>
        <div class="form-group"><label>Lokasi Default</label><input class="form-input" id="f-defloc" placeholder="R.AH.3.38"></div>`,
        async () => {
          await api('/courses', { method: 'POST', body: JSON.stringify({
            name: gv('f-name'), lecturerName: gv('f-lecturer'), lecturerWa: gv('f-wa') || null, lecturerCode: gv('f-code') || null, locationDefault: gv('f-defloc') || null
          })});
          toast('Mata kuliah ditambahkan!', 'success');
          loadCourses();
        }
      );
      break;
    }
    case 'group': {
      // Fetch groups from GoWA API
      openModal('Tambah Grup', `<div class="form-group" style="text-align:center"><i class="fas fa-spinner fa-spin"></i> Mengambil daftar grup dari WhatsApp...</div>`, null);
      try {
        const waGroups = await api('/gowa/groups');
        if (!waGroups.length) {
          document.getElementById('modal-body').innerHTML = `
            <div class="empty-state"><i class="fab fa-whatsapp"></i><p>Tidak ada grup ditemukan dari WhatsApp</p></div>
            <div class="form-group"><label>Atau input manual — Chat ID</label><input class="form-input" id="f-chatid" placeholder="120363xxx@g.us"></div>
            <div class="form-group"><label>Label</label><input class="form-input" id="f-label" placeholder="Kelas TT-4B"></div>
            <div class="form-group"><label>Reminder Offset (menit)</label><input class="form-input" type="number" id="f-offset" value="15"></div>
            <div class="form-group"><label class="form-check"><input type="checkbox" id="f-en" checked> Aktifkan</label></div>
            <div style="display:flex;gap:8px;margin-top:20px;justify-content:flex-end">
              <button class="btn btn-outline" onclick="closeModal()">Batal</button>
              <button class="btn btn-primary" onclick="saveGroupManual()"><i class="fas fa-check"></i> Simpan</button>
            </div>`;
        } else {
          // Filter out already-added groups
          const existing = cachedTargets.map(t => t.chatId);
          const available = waGroups.filter(g => !existing.includes(g.jid));
          const opts = available.map(g => `<option value="${esc(g.jid)}" data-name="${esc(g.name)}">${esc(g.name)}</option>`).join('');
          const allOpts = waGroups.map(g => {
            const added = existing.includes(g.jid);
            return `<option value="${esc(g.jid)}" data-name="${esc(g.name)}" ${added ? 'disabled' : ''}>${esc(g.name)}${added ? ' (sudah ditambahkan)' : ''}</option>`;
          }).join('');
          openModal('Tambah Grup dari WhatsApp', `
            <div class="form-group">
              <label>Pilih Grup WhatsApp <span style="font-size:11px;color:var(--text-dimmer)">(${waGroups.length} grup)</span></label>
              <select class="form-input" id="f-wa-group" onchange="onWaGroupSelect()" style="font-size:14px">
                <option value="">— Pilih grup —</option>
                ${allOpts}
              </select>
            </div>
            <div class="form-group"><label>Label</label><input class="form-input" id="f-label" placeholder="Otomatis dari nama grup"></div>
            <div class="form-group"><label>Reminder Offset (menit)</label><input class="form-input" type="number" id="f-offset" value="15"></div>
            <div class="form-group"><label class="form-check"><input type="checkbox" id="f-en" checked> Aktifkan</label></div>`,
            async () => {
              const sel = document.getElementById('f-wa-group');
              const chatId = sel.value;
              if (!chatId) { toast('Pilih grup dulu!', 'error'); throw new Error('No group selected'); }
              const label = gv('f-label') || sel.options[sel.selectedIndex].dataset.name || chatId;
              await api('/chat-targets', { method: 'POST', body: JSON.stringify({
                chatId, label, reminderOffset: +gv('f-offset'), enabled: document.getElementById('f-en').checked
              })});
              toast('Grup ditambahkan!', 'success');
              loadGroups();
            }
          );
        }
      } catch (e) {
        toast('Gagal ambil daftar grup: ' + e.message, 'error');
        closeModal();
      }
      break;
    }
    case 'note': {
      await ensureCourses();
      const opts = cachedCourses.map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join('');
      openModal('Tambah Catatan', `
        <div class="form-group"><label>Mata Kuliah</label><select class="form-input" id="f-course">${opts}</select></div>
        <div class="form-group"><label>Catatan</label><textarea class="form-input" id="f-text" rows="4" placeholder="Tulis catatan..."></textarea></div>`,
        async () => {
          await api('/notes', { method: 'POST', body: JSON.stringify({ courseId: +gv('f-course'), text: gv('f-text') })});
          toast('Catatan ditambahkan!', 'success');
          loadNotes();
        }
      );
      break;
    }
    case 'holiday': {
      openModal('Tambah Hari Libur', `
        <div class="form-group"><label>Tanggal</label><input class="form-input" type="date" id="f-date"></div>
        <div class="form-group"><label>Keterangan</label><input class="form-input" id="f-reason" placeholder="UTS Semester Genap"></div>`,
        async () => {
          await api('/holidays', { method: 'POST', body: JSON.stringify({ date: gv('f-date'), reason: gv('f-reason') })});
          toast('Hari libur ditambahkan!', 'success');
          loadHolidays();
        }
      );
      break;
    }
  }
}

// ══════════════════════════════
//  MODAL SYSTEM
// ══════════════════════════════
let modalCallback = null;

function openModal(title, bodyHTML, onSave) {
  modalCallback = onSave;
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').innerHTML = bodyHTML + `
    <div style="display:flex;gap:8px;margin-top:20px;justify-content:flex-end">
      <button class="btn btn-outline" onclick="closeModal()">Batal</button>
      <button class="btn btn-primary" onclick="saveModal()"><i class="fas fa-check"></i> Simpan</button>
    </div>`;
  document.getElementById('modal-overlay').style.display = 'flex';
}

function closeModal() {
  document.getElementById('modal-overlay').style.display = 'none';
  modalCallback = null;
}

async function saveModal() {
  if (modalCallback) {
    try { await modalCallback(); closeModal(); }
    catch (e) { toast('Error: ' + e.message, 'error'); }
  }
}

// ══════════════════════════════
//  UTILITIES
// ══════════════════════════════
function gv(id) { return (document.getElementById(id)?.value || '').trim(); }
function esc(s) { if (!s) return ''; const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

// When user picks a WA group from dropdown, auto-fill label
function onWaGroupSelect() {
  const sel = document.getElementById('f-wa-group');
  if (!sel) return;
  const opt = sel.options[sel.selectedIndex];
  const label = document.getElementById('f-label');
  if (label && opt && opt.dataset.name) label.value = opt.dataset.name;
}

// Fallback manual group save (when GoWA returns empty)
async function saveGroupManual() {
  try {
    await api('/chat-targets', { method: 'POST', body: JSON.stringify({
      chatId: gv('f-chatid'), label: gv('f-label'), reminderOffset: +gv('f-offset'), enabled: document.getElementById('f-en')?.checked ?? true
    })});
    toast('Grup ditambahkan!', 'success');
    closeModal();
    loadGroups();
  } catch (e) { toast('Error: ' + e.message, 'error'); }
}

async function ensureCourses() { if (!cachedCourses.length) cachedCourses = await api('/courses'); }

function formatDate(d) {
  if (!d) return '-';
  try {
    const parts = d.split('-');
    const date = new Date(+parts[0], +parts[1] - 1, +parts[2]);
    return date.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  } catch { return d; }
}

function formatDateTime(d) {
  if (!d) return '-';
  try {
    const date = new Date(d);
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' +
           date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' });
  } catch { return d; }
}

// ── Clock ──
function updateClock() {
  const now = new Date();
  const wib = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Asia/Jakarta' });
  const day = DAYS[now.getDay()];
  const el = document.getElementById('clock');
  if (el) el.textContent = `${day}, ${wib} WIB`;
}

// ── Particle Animation ──
function initParticles() {
  const canvas = document.getElementById('particles-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let w, h;
  const particles = [];
  const COUNT = 60;

  function resize() { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; }

  class P {
    constructor() { this.reset(); }
    reset() {
      this.x = Math.random() * w; this.y = Math.random() * h;
      this.vx = (Math.random() - 0.5) * 0.3; this.vy = (Math.random() - 0.5) * 0.3;
      this.r = Math.random() * 2 + 0.5; this.o = Math.random() * 0.3 + 0.1;
      this.c = ['0,245,255','180,78,255','255,110,180'][Math.floor(Math.random()*3)];
    }
    update() { this.x += this.vx; this.y += this.vy; if (this.x < 0||this.x > w) this.vx *= -1; if (this.y < 0||this.y > h) this.vy *= -1; }
    draw() { ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, Math.PI*2); ctx.fillStyle = `rgba(${this.c},${this.o})`; ctx.fill(); }
  }

  resize(); window.addEventListener('resize', resize);
  for (let i = 0; i < COUNT; i++) particles.push(new P());

  function loop() {
    ctx.clearRect(0, 0, w, h);
    for (let i = 0; i < particles.length; i++) {
      particles[i].update(); particles[i].draw();
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x, dy = particles[i].y - particles[j].y;
        const d = Math.sqrt(dx*dx + dy*dy);
        if (d < 150) { ctx.beginPath(); ctx.moveTo(particles[i].x, particles[i].y); ctx.lineTo(particles[j].x, particles[j].y); ctx.strokeStyle = `rgba(0,245,255,${0.05*(1-d/150)})`; ctx.stroke(); }
      }
    }
    requestAnimationFrame(loop);
  }
  loop();
}

// ── Sidebar toggle (mobile) ──
function toggleSidebar() {
  document.querySelector('.sidebar')?.classList.toggle('open');
}

// ══════════════════════════════
//  INIT
// ══════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  initParticles();
  setInterval(updateClock, 1000);
  updateClock();

  // Login form
  document.getElementById('login-form').addEventListener('submit', handleLogin);

  // Nav items
  document.querySelectorAll('.nav-item').forEach(el => {
    el.addEventListener('click', () => {
      navigate(el.dataset.page);
      document.querySelector('.sidebar')?.classList.remove('open');
    });
  });

  // Close modal on overlay click
  document.getElementById('modal-overlay')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal();
  });

  // Check if already logged in (validate token against protected endpoint)
  if (token) {
    api('/dashboard').then(() => showApp()).catch(() => { token = ''; localStorage.removeItem('bot_token'); showLogin(); });
  } else {
    showLogin();
  }
});
