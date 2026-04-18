/* VFK v0.3 — Stabilized & Optimized */
const $ = s => document.querySelector(s), $$ = s => document.querySelectorAll(s);

// ====== INDEXEDDB WRAPPER ======
const DB = {
    name: 'VFK_StudyApp', version: 2, db: null,
    async init() {
        return new Promise((resolve, reject) => {
            const req = indexedDB.open(this.name, this.version);
            req.onupgradeneeded = e => {
                const db = e.target.result;
                if(!db.objectStoreNames.contains('state')) db.createObjectStore('state');
            };
            req.onsuccess = e => { this.db = e.target.result; resolve(); };
            req.onerror = e => reject(e);
        });
    },
    async get(key) {
        return new Promise((resolve) => {
            const tx = this.db.transaction('state', 'readonly');
            const req = tx.objectStore('state').get(key);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => resolve(null);
        });
    },
    async set(key, val) {
        return new Promise((resolve) => {
            const tx = this.db.transaction('state', 'readwrite');
            tx.objectStore('state').put(val, key);
            tx.oncomplete = () => resolve();
        });
    }
};

// ====== STATE MANAGEMENT ======
const State = {
    data: {
        courses: [], history: [], bookmarks: [],
        settings: { theme: 'dark', accent: 'red', autoplay: true, pomodoro: false, onboarded: false, pwaDismissed: false },
        lastWatched: null, streak: 0, lastStreakDate: null
    },
    async load() {
        await DB.init();
        const stored = await DB.get('app_data');
        if (stored) {
            this.data = { ...this.data, ...stored, settings: { ...this.data.settings, ...(stored.settings || {}) } };
        } else {
            // Migrate from localStorage
            try {
                const ls = localStorage.getItem('study_app_state');
                if (ls) {
                    const parsed = JSON.parse(ls);
                    this.data.courses = parsed.courses || [];
                    this.data.lastWatched = parsed.lastWatched || null;
                    this.data.settings = { ...this.data.settings, ...(parsed.settings || {}) };
                    await this.save();
                }
            } catch (e) {}
        }
    },
    async save() { await DB.set('app_data', this.data); },
    async update(fn) { fn(this.data); await this.save(); }
};

// ====== FETCHER (YOUTUBE PROXIES) ======
const Fetcher = {
    proxies: [u=>`https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`, u=>`https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`],
    extractPlaylistId(i){ const m = i.trim().match(/[?&]list=([a-zA-Z0-9_-]+)/); return m ? m[1] : (/^[a-zA-Z0-9_-]{10,}$/.test(i.trim()) ? i.trim() : null); },
    extractChannelId(i){ let m=i.trim().match(/youtube\.com\/channel\/([a-zA-Z0-9_-]+)/); if(m)return{type:'channel',id:m[1]}; m=i.match(/youtube\.com\/@([a-zA-Z0-9_.-]+)/); if(m)return{type:'handle',id:m[1]}; if(i.startsWith('@'))return{type:'handle',id:i.slice(1)}; return null; },
    async fetchPage(url){ for(const pf of this.proxies){ try{ const r=await fetch(pf(url),{signal:AbortSignal.timeout(15000)}); if(r.ok)return await r.text(); }catch(e){} } throw new Error('Network error'); },
    async fetchPlaylist(pid){ return this.parsePlaylist(await this.fetchPage(`https://www.youtube.com/playlist?list=${pid}`), pid); },
    async fetchChannel(info){ const url=info.type==='handle'?`https://www.youtube.com/@${info.id}/playlists`:`https://www.youtube.com/channel/${info.id}/playlists`; return this.parseChannel(await this.fetchPage(url)); },
    async fetchVideoInfo(vid){ try{ const h=await this.fetchPage(`https://www.youtube.com/watch?v=${vid}`); const m=h.match(/var\s+ytInitialData\s*=\s*(\{.*?\});/s); if(!m)return null; const d=JSON.parse(m[1]); const vs=d?.contents?.twoColumnWatchNextResults?.results?.results?.contents?.find(c=>c?.videoSecondaryInfoRenderer)?.videoSecondaryInfoRenderer; return {description: vs?.attributedDescription?.content || vs?.description?.runs?.map(r=>r.text).join('') || ''}; }catch{return null;} },
    parsePlaylist(html, pid){ const m=html.match(/var\s+ytInitialData\s*=\s*(\{.*?\});/s); if(!m)throw new Error('Parse failed'); const d=JSON.parse(m[1]); let title='Unknown', author='Unknown', videos=[]; try{ const h=d?.header?.playlistHeaderRenderer; if(h){title=h.title?.simpleText||title; author=h.ownerText?.runs?.[0]?.text||author;} const tabs=d?.contents?.twoColumnBrowseResultsRenderer?.tabs; if(tabs)for(const tab of tabs){ const cs=tab?.tabRenderer?.content?.sectionListRenderer?.contents; if(!cs)continue; for(const s of cs){ const items=s?.itemSectionRenderer?.contents?.[0]?.playlistVideoListRenderer?.contents; if(!items)continue; for(const it of items){ const v=it?.playlistVideoRenderer; if(v)videos.push({id:v.videoId, title:v.title?.runs?.[0]?.text||'Untitled', thumbnail:`https://i.ytimg.com/vi/${v.videoId}/mqdefault.jpg`}); } } } }catch(e){} if(!videos.length)throw new Error('No videos'); return {id:pid, title, author, thumbnail:`https://i.ytimg.com/vi/${videos[0].id}/hqdefault.jpg`, videos, watched:[], tags:[]}; },
    parseChannel(html){ const m=html.match(/var\s+ytInitialData\s*=\s*(\{.*?\});/s); if(!m)throw new Error('Parse failed'); const d=JSON.parse(m[1]); let pls=[], name='Unknown'; try{ const h=d?.header?.c4TabbedHeaderRenderer; if(h)name=h.title||name; const tabs=d?.contents?.twoColumnBrowseResultsRenderer?.tabs; if(tabs)for(const tab of tabs){ const cs=tab?.tabRenderer?.content?.sectionListRenderer?.contents; if(!cs)continue; for(const s of cs){ const items=s?.itemSectionRenderer?.contents?.[0]?.gridRenderer?.items; if(!items)continue; for(const it of items){ const pl=it?.gridPlaylistRenderer; if(pl)pls.push({id:pl.playlistId, title:pl.title?.runs?.[0]?.text||'Untitled', count:pl.videoCountShortText?.simpleText||'?'}); } } } }catch(e){} return {channelName:name, playlists:pls}; }
};

// ====== GLOBAL DOM ======
const DOM = {
    views: $$('.view'), navItems: $$('.nav-item'),
    fabAdd: $('#fab-add'), addModal: $('#add-course-modal'), addModalClose: $('#add-modal-close'),
    playlistInput: $('#playlist-url'), tagsInput: $('#course-tags-input'), btnImport: $('#btn-import'), importStatus: $('#import-status'), channelResults: $('#channel-results'),
    coursesGrid: $('#courses-grid'), emptyState: $('#empty-state'), tagFilters: $('#tag-filters'),
    resumeBanner: $('#resume-banner'), btnResume: $('#btn-resume'), resumeTitle: $('#resume-video-title'),
    detailTitle: $('#detail-course-title'), detailCount: $('#detail-video-count'), lecturesList: $('#lectures-list'),
    playerOverlay: $('#player-overlay'), btnClosePlayer: $('#btn-close-player'), playerTitle: $('#player-video-title'), playerCourse: $('#player-course-title'), btnFullscreen: $('#btn-fullscreen'), btnBookmarkPlayer: $('#btn-bookmark-player'),
    historyList: $('#history-list'), savedList: $('#saved-list'),
    streakBadge: $('#streak-badge'), streakCount: $('#streak-count'),
    themeToggle: $('#theme-toggle')
};

let currentView = 'view-my-courses', currentCourse = null, currentVideoIdx = 0, ytPlayer = null, isPlayerReady = false;
let activeTag = 'all', dragSrcEl = null, addMode = 'playlist';

// ====== UTILS ======
const escHtml = s => { const d=document.createElement('div'); d.textContent=s; return d.innerHTML; };
const formatTimeAgo = (ts) => {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if(mins < 1) return 'Just now';
    if(mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if(hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if(days < 7) return `${days}d ago`;
    return new Date(ts).toLocaleDateString();
};
const updateStreak = async () => {
    const today = new Date().toDateString();
    await State.update(s => {
        if(s.lastStreakDate !== today) {
            const yday = new Date(Date.now() - 86400000).toDateString();
            if(s.lastStreakDate === yday) s.streak++; else s.streak = 1;
            s.lastStreakDate = today;
        }
    });
    renderStreak();
};
const renderStreak = () => {
    if(State.data.streak > 0) { DOM.streakBadge.classList.remove('hidden'); DOM.streakCount.textContent = State.data.streak; }
    else DOM.streakBadge.classList.add('hidden');
};

// ====== NAVIGATION ======
const navigateTo = (viewId) => {
    currentView = viewId;
    DOM.views.forEach(v => { v.classList.remove('active'); v.classList.add('hidden'); });
    const t = $(`#${viewId}`); t.classList.remove('hidden'); void t.offsetWidth; t.classList.add('active');
    DOM.navItems.forEach(n => n.classList.toggle('active', n.dataset.target === viewId));
    if(viewId === 'view-my-courses') renderCourses();
    if(viewId === 'view-history') renderHistory();
    if(viewId === 'view-saved') renderSaved();
    if(viewId === 'view-stats') renderStats();
};
DOM.navItems.forEach(i => i.addEventListener('click', () => navigateTo(i.dataset.target)));
if($('#btn-go-add')) $('#btn-go-add').addEventListener('click', () => openAddModal());

// ====== ADD COURSE MODAL ======
const openAddModal = () => {
    DOM.addModal.classList.remove('hidden');
    DOM.channelResults.innerHTML = '';
    DOM.importStatus.textContent = '';
};
const closeAddModal = () => {
    DOM.addModal.classList.add('hidden');
    DOM.channelResults.innerHTML = '';
    DOM.importStatus.textContent = '';
};
DOM.fabAdd.addEventListener('click', openAddModal);
DOM.addModalClose.addEventListener('click', closeAddModal);
// Click backdrop to close — use mousedown for reliability, check not inside bottom-sheet
DOM.addModal.addEventListener('mousedown', e => {
    if(!e.target.closest('.bottom-sheet')) closeAddModal();
});

$$('.add-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        $$('.add-tab').forEach(t => t.classList.remove('active')); tab.classList.add('active');
        addMode = tab.dataset.addType;
        $('#add-label').textContent = addMode === 'channel' ? 'Paste YouTube Channel URL' : 'Paste YouTube Playlist URL';
        DOM.playlistInput.placeholder = addMode === 'channel' ? 'https://youtube.com/@channel' : 'https://youtube.com/playlist?list=...';
        $('#add-hint').textContent = addMode === 'channel' ? 'Supports @handle or /channel/' : 'Paste a full playlist URL or just the playlist ID';
        DOM.channelResults.innerHTML = ''; DOM.importStatus.textContent = '';
    });
});

DOM.btnImport.addEventListener('click', async () => {
    const input = DOM.playlistInput.value.trim(); const tagsStr = DOM.tagsInput.value.trim();
    if(!input) return showStatus('Please paste a URL', 'error');
    const tags = tagsStr ? tagsStr.split(',').map(t=>t.trim()).filter(t=>t) : [];
    showStatus('Fetching...', 'loading'); DOM.btnImport.disabled = true;
    try {
        if(addMode === 'channel') {
            const info = Fetcher.extractChannelId(input); if(!info) throw new Error('Invalid channel URL');
            const r = await Fetcher.fetchChannel(info); showStatus(`Found ${r.playlists.length} playlists`, 'success');
            renderChannelResults(r, tags);
        } else {
            const pid = Fetcher.extractPlaylistId(input); if(!pid) throw new Error('Invalid playlist URL');
            if(State.data.courses.some(c=>c.id===pid)) throw new Error('Already added!');
            const pl = await Fetcher.fetchPlaylist(pid); pl.tags = tags;
            await State.update(s => s.courses.unshift(pl)); // Add to top
            showStatus(`Added "${pl.title}"`, 'success');
            DOM.playlistInput.value = ''; DOM.tagsInput.value = '';
            setTimeout(() => { closeAddModal(); renderCourses(); }, 1000);
        }
    } catch(err) { showStatus(err.message, 'error'); }
    finally { DOM.btnImport.disabled = false; DOM.btnImport.innerHTML = "<i class='bx bx-import'></i> Import Course"; }
});

const showStatus = (m,t) => { DOM.importStatus.textContent=m; DOM.importStatus.className=`status-msg ${t}`; };
const renderChannelResults = (r, tags) => {
    DOM.channelResults.innerHTML = '<div style="margin-top:16px;"></div>';
    r.playlists.forEach(pl => {
        const d = document.createElement('div'); d.className = 'explore-card'; d.style.marginBottom='8px';
        d.innerHTML = `<div class="explore-avatar">${pl.title.charAt(0)}</div><div class="explore-info"><div class="explore-name">${escHtml(pl.title)}</div><div class="explore-desc">${pl.count} videos</div></div><button class="btn-primary btn-sm">+ Add</button>`;
        d.querySelector('button').addEventListener('click', async e => {
            const btn = e.target; btn.disabled = true; btn.textContent = '...';
            try {
                if(State.data.courses.some(c=>c.id===pl.id)) { btn.textContent = 'Exists'; return; }
                const full = await Fetcher.fetchPlaylist(pl.id); full.tags = tags;
                await State.update(s => s.courses.unshift(full));
                btn.textContent = '✓'; btn.style.background = 'var(--success)';
            } catch { btn.textContent = 'Err'; }
        });
        DOM.channelResults.appendChild(d);
    });
};

// ====== COURSES RENDER & DRAG-DROP ======
const renderCourses = () => {
    const courses = State.data.courses;
    DOM.coursesGrid.innerHTML = '';
    
    // Auto Resume
    const lw = State.data.lastWatched;
    if(lw) {
        const c = courses.find(c => c.id === lw.courseId);
        if(c && c.videos[lw.videoIndex]) {
            DOM.resumeBanner.classList.remove('hidden');
            DOM.resumeTitle.textContent = c.videos[lw.videoIndex].title;
            DOM.btnResume.onclick = () => { currentCourse = c; openPlayer(lw.videoIndex); };
        } else DOM.resumeBanner.classList.add('hidden');
    } else DOM.resumeBanner.classList.add('hidden');

    // Tags — build all HTML first, then attach listeners (avoids innerHTML wipe bug)
    const allTags = new Set();
    courses.forEach(c => (c.tags||[]).forEach(t => allTags.add(t)));
    if(allTags.size > 0) {
        DOM.tagFilters.classList.remove('hidden');
        let tagsHtml = `<button class="tag-chip ${activeTag==='all'?'active':''}" data-tag="all">All</button>`;
        [...allTags].forEach(t => {
            tagsHtml += `<button class="tag-chip ${activeTag===t?'active':''}" data-tag="${escHtml(t)}">${escHtml(t)}</button>`;
        });
        DOM.tagFilters.innerHTML = tagsHtml;
        DOM.tagFilters.querySelectorAll('.tag-chip').forEach(b => b.addEventListener('click', e => { activeTag = e.target.dataset.tag; renderCourses(); }));
    } else DOM.tagFilters.classList.add('hidden');

    const filtered = activeTag === 'all' ? courses : courses.filter(c => (c.tags||[]).includes(activeTag));
    if(!filtered.length) { DOM.emptyState.classList.remove('hidden'); return; }
    DOM.emptyState.classList.add('hidden');

    filtered.forEach((course, displayIndex) => {
        const watched = course.watched || [];
        const pct = course.videos.length ? Math.round((watched.length / course.videos.length) * 100) : 0;
        // SVG circle r=16 => circumference = 2*PI*16 ≈ 100.53
        const circumference = 2 * Math.PI * 16;
        const offset = circumference - (circumference * pct / 100);

        const card = document.createElement('div');
        card.className = 'course-card'; card.draggable = true; card.dataset.id = course.id;
        
        card.innerHTML = `
            <div class="course-card-delete-bg"><i class='bx bx-trash'></i></div>
            <div class="course-card-inner">
                <div class="course-thumb-wrap">
                    <img class="course-thumb" src="${course.thumbnail}" alt="" onerror="this.src='https://placehold.co/480x270/111/8b5cf6?text=Course'">
                    <div class="course-overlay-gradient"></div>
                    <div class="progress-ring-container">
                        <svg class="progress-ring" viewBox="0 0 36 36">
                            <circle class="bg" cx="18" cy="18" r="16"></circle>
                            <circle class="fg" cx="18" cy="18" r="16" style="stroke-dasharray:${circumference};stroke-dashoffset:${offset}"></circle>
                        </svg>
                        <div class="progress-ring-text">${pct}%</div>
                    </div>
                    <span class="course-video-count"><i class='bx bx-list-ul'></i> ${course.videos.length}</span>
                </div>
                <div class="course-info">
                    <div class="course-text">
                        ${(course.tags&&course.tags.length) ? `<div class="course-tags-display">${course.tags.map(escHtml).join(', ')}</div>` : ''}
                        <div class="course-title">${escHtml(course.title)}</div>
                        <div class="course-author">${escHtml(course.author)}</div>
                    </div>
                </div>
            </div>
        `;

        // Swipe to delete logic
        let startX = 0, currentX = 0; const inner = card.querySelector('.course-card-inner');
        inner.addEventListener('touchstart', e => { startX = e.touches[0].clientX; inner.style.transition = 'none'; }, {passive:true});
        inner.addEventListener('touchmove', e => {
            currentX = e.touches[0].clientX - startX;
            if(currentX < 0) inner.style.transform = `translateX(${Math.max(currentX, -80)}px)`;
        }, {passive:true});
        inner.addEventListener('touchend', () => {
            inner.style.transition = 'transform 0.3s';
            if(currentX < -50) { inner.style.transform = `translateX(-80px)`; setTimeout(()=>showDeleteModal(course), 300); }
            else { inner.style.transform = `translateX(0)`; }
            currentX = 0;
        });

        // Drag and drop logic
        card.addEventListener('dragstart', e => { dragSrcEl = card; e.dataTransfer.effectAllowed = 'move'; card.classList.add('dragging'); });
        card.addEventListener('dragover', e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; card.classList.add('drag-over'); });
        card.addEventListener('dragleave', () => card.classList.remove('drag-over'));
        card.addEventListener('drop', async e => {
            e.preventDefault(); card.classList.remove('drag-over');
            if (dragSrcEl !== card) {
                const srcId = dragSrcEl.dataset.id; const destId = card.dataset.id;
                await State.update(s => {
                    const cList = s.courses; const sIdx = cList.findIndex(c=>c.id===srcId); const dIdx = cList.findIndex(c=>c.id===destId);
                    const [removed] = cList.splice(sIdx, 1);
                    cList.splice(dIdx, 0, removed);
                });
                renderCourses();
            }
        });
        card.addEventListener('dragend', () => card.classList.remove('dragging'));

        card.addEventListener('click', e => { if(currentX === 0 && !e.target.closest('.course-card-delete-bg')) openCourseDetail(course); });
        DOM.coursesGrid.appendChild(card);
    });
};

// ====== DELETE COURSE ======
const showDeleteModal = (c) => {
    $('#delete-course-name').textContent = c.title; $('#delete-modal').classList.remove('hidden');
    $('#btn-confirm-delete').onclick = async () => {
        await State.update(s => {
            s.courses = s.courses.filter(x => x.id !== c.id);
            if(s.lastWatched?.courseId === c.id) s.lastWatched = null;
        });
        $('#delete-modal').classList.add('hidden'); renderCourses();
        if(currentView === 'view-course-detail') navigateTo('view-my-courses');
    };
};
$('#btn-cancel-delete').onclick = () => { $('#delete-modal').classList.add('hidden'); renderCourses(); };
$('#btn-delete-course').onclick = () => showDeleteModal(currentCourse);

// ====== COURSE DETAIL & LECTURES ======
const openCourseDetail = (course) => {
    currentCourse = course; DOM.detailTitle.textContent = course.title;
    const w = course.watched || []; DOM.detailCount.textContent = `${course.videos.length} videos · ${w.length} watched`;
    if($('#lecture-search')) $('#lecture-search').value = '';
    navigateTo('view-course-detail'); renderLectures();
};
$('#btn-back-courses').addEventListener('click', () => navigateTo('view-my-courses'));
$('#lecture-search').addEventListener('input', e => renderLectures(e.target.value.trim().toLowerCase()));

const isBookmarked = (vid) => State.data.bookmarks.includes(vid);
const toggleBookmark = async (vid) => {
    await State.update(s => {
        if(s.bookmarks.includes(vid)) s.bookmarks = s.bookmarks.filter(id => id !== vid);
        else s.bookmarks.push(vid);
    });
};

const renderLectures = (filter='') => {
    DOM.lecturesList.innerHTML = '';
    const lw = State.data.lastWatched; const course = State.data.courses.find(c=>c.id===currentCourse.id) || currentCourse;
    const watched = course.watched || [];

    course.videos.forEach((v, i) => {
        if(filter && !v.title.toLowerCase().includes(filter)) return;
        const active = lw && lw.courseId === course.id && lw.videoIndex === i;
        const isW = watched.includes(i); const isB = isBookmarked(v.id);
        
        const el = document.createElement('div'); el.className = 'lecture-swipe-container';
        el.innerHTML = `
            <div class="lecture-swipe-bg">
                <div class="bg-left"><i class='bx bx-star'></i> Save</div>
                <div class="bg-right">Watch <i class='bx bx-check-circle'></i></div>
            </div>
            <div class="lecture-item ${active?'active-lecture':''}">
                <span class="lecture-num">${i+1}</span>
                <div class="lecture-thumb-wrap">
                    <img class="lecture-thumb" src="${v.thumbnail}" onerror="this.src='https://placehold.co/120x68/111/8b5cf6'">
                    <div class="lecture-play-icon"><i class='bx bx-play'></i></div>
                </div>
                <div class="lecture-details">
                    <div class="lecture-title">${escHtml(v.title)}</div>
                    <div class="lecture-meta-icons">
                        ${isW ? '<i class="bx bx-check-circle watched-icon"></i>' : ''}
                        ${isB ? '<i class="bx bxs-star bookmark-icon"></i>' : ''}
                    </div>
                </div>
            </div>
        `;
        
        const item = el.querySelector('.lecture-item'); const bgL = el.querySelector('.bg-left'); const bgR = el.querySelector('.bg-right');
        let sX = 0, cX = 0;
        item.addEventListener('touchstart', e => { sX = e.touches[0].clientX; item.style.transition='none'; }, {passive:true});
        item.addEventListener('touchmove', e => {
            cX = e.touches[0].clientX - sX;
            item.style.transform = `translateX(${cX}px)`;
            if(cX > 0) { el.style.background = '#eab308'; bgL.style.opacity = Math.min(cX/50, 1); bgR.style.opacity=0; }
            else if(cX < 0) { el.style.background = 'var(--success)'; bgR.style.opacity = Math.min(-cX/50, 1); bgL.style.opacity=0; }
        }, {passive:true});
        item.addEventListener('touchend', async () => {
            item.style.transition = 'transform 0.3s';
            if(cX > 80) { await toggleBookmark(v.id); renderLectures(filter); } // Swipe Right -> Bookmark
            else if(cX < -80) { await markWatched(course.id, i); renderLectures(filter); checkCertificate(); } // Swipe Left -> Watch
            item.style.transform = `translateX(0)`; bgL.style.opacity=0; bgR.style.opacity=0; cX = 0;
        });

        item.addEventListener('click', e => { if(cX === 0) openPlayer(i); });
        DOM.lecturesList.appendChild(el);
    });
};

const markWatched = async (cId, vIdx) => {
    await State.update(s => {
        const c = s.courses.find(x => x.id === cId);
        if(!c) return;
        if(!Array.isArray(c.watched)) c.watched = [];
        if(!c.watched.includes(vIdx)) c.watched.push(vIdx);
    });
    await updateStreak();
};

const logHistory = async (course, video) => {
    await State.update(s => {
        s.history = s.history.filter(h => h.videoId !== video.id);
        s.history.unshift({ courseId: course.id, courseTitle: course.title, videoId: video.id, videoTitle: video.title, thumbnail: video.thumbnail, timestamp: Date.now() });
        if(s.history.length > 100) s.history.pop();
    });
};

// ====== PLAYER & YOUTUBE ======
const openPlayer = async (idx) => {
    if(!currentCourse || !currentCourse.videos[idx]) return;
    currentVideoIdx = idx; const v = currentCourse.videos[idx];
    DOM.playerTitle.textContent = v.title; DOM.playerCourse.textContent = currentCourse.title;
    $('#current-video-index').textContent = `${idx+1} / ${currentCourse.videos.length}`;
    DOM.playerOverlay.classList.remove('hidden');
    $('#btn-open-yt').href = `https://www.youtube.com/watch?v=${v.id}`; $('#btn-view-comments').href = `https://www.youtube.com/watch?v=${v.id}`;
    
    // Bookmark logic
    const bBtn = DOM.btnBookmarkPlayer.querySelector('i');
    if(isBookmarked(v.id)) { bBtn.className = 'bx bxs-star'; bBtn.style.color='#eab308'; } else { bBtn.className = 'bx bx-star'; bBtn.style.color=''; }
    DOM.btnBookmarkPlayer.onclick = async () => { await toggleBookmark(v.id); openPlayer(idx); };

    if(isPlayerReady && ytPlayer) ytPlayer.loadVideoById(v.id);
    await State.update(s => s.lastWatched = {courseId: currentCourse.id, videoIndex: idx});
    await logHistory(currentCourse, v);
    
    renderPlayerPlaylist();
    $('#video-description').classList.add('hidden'); $('#btn-toggle-desc').classList.remove('open'); $('#desc-text').textContent = 'Loading...';
    try { const info = await Fetcher.fetchVideoInfo(v.id); $('#desc-text').textContent = info?.description || 'No description available.'; } catch { $('#desc-text').textContent = 'Error loading.'; }
};

const renderPlayerPlaylist = () => {
    const list = $('#player-playlist-items'); list.innerHTML = '';
    currentCourse.videos.forEach((v,i) => {
        const el = document.createElement('div'); el.className = `mini-lecture ${i===currentVideoIdx?'now-playing':''}`;
        el.innerHTML = `<span class="mini-lecture-num">${i===currentVideoIdx?'▶':i+1}</span><span class="mini-lecture-title">${escHtml(v.title)}</span>`;
        el.addEventListener('click', () => openPlayer(i));
        list.appendChild(el);
    });
};

$('#btn-toggle-desc').addEventListener('click', e => { $('#video-description').classList.toggle('hidden'); e.currentTarget.classList.toggle('open'); });
DOM.btnClosePlayer.addEventListener('click', () => { 
    if(document.fullscreenElement) document.exitFullscreen();
    DOM.playerOverlay.classList.add('hidden'); if(ytPlayer?.pauseVideo) ytPlayer.pauseVideo(); 
    if(currentCourse && currentView === 'view-course-detail') renderLectures();
});
$('#btn-next-video').addEventListener('click', () => { if(currentCourse && currentVideoIdx < currentCourse.videos.length-1) openPlayer(currentVideoIdx+1); });
$('#btn-prev-video').addEventListener('click', () => { if(currentCourse && currentVideoIdx > 0) openPlayer(currentVideoIdx-1); });

$('#speed-btns').addEventListener('click', e => {
    const btn = e.target.closest('button'); if(!btn) return;
    const speed = parseFloat(btn.dataset.speed);
    if(ytPlayer && typeof ytPlayer.setPlaybackRate === 'function') ytPlayer.setPlaybackRate(speed);
    $$('#speed-btns button').forEach(b => b.classList.remove('active')); btn.classList.add('active');
});

// Fullscreen
DOM.btnFullscreen.addEventListener('click', () => {
    if (!document.fullscreenElement) DOM.playerOverlay.requestFullscreen().catch(err => alert(`Error: ${err.message}`));
    else document.exitFullscreen();
});

function onYouTubeIframeAPIReady() {
    ytPlayer = new YT.Player('youtube-player', {
        height: '100%', width: '100%',
        playerVars: {
            playsinline: 1,
            rel: 0,
            modestbranding: 1,
            enablejsapi: 1,
            fs: 1,
            widget_referrer: window.location.href
        },
        events: {
            onReady: () => { isPlayerReady = true; handleAutoResume(); },
            onStateChange: async (e) => {
                if(e.data === YT.PlayerState.ENDED) {
                    await markWatched(currentCourse.id, currentVideoIdx);
                    checkCertificate();
                    if(State.data.settings.autoplay && currentCourse && currentVideoIdx < currentCourse.videos.length-1) openPlayer(currentVideoIdx+1);
                }
            },
            onError: (e) => { console.error('YT Player Error:', e.data); }
        }
    });
}
const handleAutoResume = () => {
    const lw = State.data.lastWatched; if(!lw) return;
    const c = State.data.courses.find(c => c.id === lw.courseId); if(!c || !c.videos[lw.videoIndex]) return;
    currentCourse = c; setTimeout(() => { openCourseDetail(c); setTimeout(() => openPlayer(lw.videoIndex), 300); }, 600);
};

// ====== HISTORY & SAVED VIEWS ======
const renderHistory = () => {
    DOM.historyList.innerHTML = '';
    if(!State.data.history.length) { $('#history-empty').classList.remove('hidden'); return; }
    $('#history-empty').classList.add('hidden');
    State.data.history.forEach(h => {
        const el = document.createElement('div'); el.className = 'history-item';
        const timeAgo = formatTimeAgo(h.timestamp);
        el.innerHTML = `<div class="lecture-thumb-wrap" style="width:80px;height:45px"><img class="lecture-thumb" src="${h.thumbnail}" onerror="this.style.display='none'"></div><div class="history-item-info"><div class="history-video-title">${escHtml(h.videoTitle)}</div><div class="history-course-title">${escHtml(h.courseTitle)}</div><div class="history-time">${timeAgo}</div></div>`;
        el.addEventListener('click', () => {
            const c = State.data.courses.find(c=>c.id===h.courseId);
            if(!c) { alert('This course has been removed.'); return; }
            currentCourse = c;
            const idx = c.videos.findIndex(v=>v.id===h.videoId);
            if(idx !== -1) openPlayer(idx);
            else alert('This lecture is no longer available.');
        });
        DOM.historyList.appendChild(el);
    });
};

const renderSaved = () => {
    DOM.savedList.innerHTML = '';
    const bms = State.data.bookmarks;
    if(!bms.length) { $('#saved-empty').classList.remove('hidden'); return; }
    $('#saved-empty').classList.add('hidden');
    
    // Find videos across all courses
    const allVids = []; State.data.courses.forEach(c => c.videos.forEach((v,i) => allVids.push({...v, course: c, idx: i})));
    const savedVids = allVids.filter(v => bms.includes(v.id));
    
    savedVids.forEach(v => {
        const el = document.createElement('div'); el.className = 'history-item';
        el.innerHTML = `<div class="lecture-thumb-wrap" style="width:100px;height:56px"><img class="lecture-thumb" src="${v.thumbnail}"><div class="lecture-play-icon"><i class='bx bx-play'></i></div></div><div class="history-item-info"><div class="history-video-title">${escHtml(v.title)}</div><div class="history-course-title">${escHtml(v.course.title)}</div></div><button class="icon-btn" style="color:#eab308" title="Remove"><i class='bx bxs-star'></i></button>`;
        el.addEventListener('click', e => {
            if(e.target.closest('button')) { toggleBookmark(v.id).then(renderSaved); }
            else { currentCourse = v.course; openPlayer(v.idx); }
        });
        DOM.savedList.appendChild(el);
    });
};

// ====== STATS & CHARTS ======
const renderStats = () => {
    $('#stat-streak').textContent = State.data.streak;
    $('#stat-courses').textContent = State.data.courses.length;
    let totalW = 0; State.data.courses.forEach(c => totalW += (c.watched||[]).length);
    $('#stat-total-watched').textContent = totalW;

    // Weekly Chart (Simple simulation based on history timestamps)
    const chart = $('#weekly-chart'); const daysDiv = $('#weekly-days');
    chart.innerHTML = ''; daysDiv.innerHTML = '';
    const today = new Date(); const weekData = Array(7).fill(0); const dayLabels = [];
    for(let i=6; i>=0; i--) {
        const d = new Date(today); d.setDate(d.getDate() - i);
        dayLabels.push(d.toLocaleDateString('en-US', {weekday:'short'}));
        // Count history items matching this date
        const count = State.data.history.filter(h => new Date(h.timestamp).toDateString() === d.toDateString()).length;
        weekData[6-i] = count;
    }
    const maxVal = Math.max(...weekData, 5);
    weekData.forEach((val, i) => {
        const pct = (val / maxVal) * 100;
        chart.innerHTML += `<div class="chart-bar-wrap"><div class="chart-val">${val}</div><div class="chart-bar" style="height:${pct}%"></div></div>`;
        daysDiv.innerHTML += `<div class="day-label">${dayLabels[i]}</div>`;
    });

    // Course Progress List
    const clist = $('#stats-course-list'); clist.innerHTML = '';
    State.data.courses.forEach(c => {
        const w = (c.watched||[]).length; const t = c.videos.length; const p = t ? Math.round((w/t)*100) : 0;
        clist.innerHTML += `<div class="stat-course-item"><div class="stat-course-header"><span>${escHtml(c.title)}</span><span>${p}%</span></div><div class="stat-course-progress"><div class="stat-course-bar" style="width:${p}%"></div></div></div>`;
    });
};

// ====== CERTIFICATES ======
const checkCertificate = () => {
    if(!currentCourse) return;
    // Re-read fresh data from State to avoid stale watched array
    const fresh = State.data.courses.find(c => c.id === currentCourse.id);
    if(!fresh) return;
    const w = (fresh.watched||[]).length; const t = fresh.videos.length;
    if(w === t && t > 0) {
        const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#E31B23';
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 565" width="100%" height="100%">
            <rect width="100%" height="100%" fill="#fff" />
            <rect x="20" y="20" width="760" height="525" fill="none" stroke="${accentColor}" stroke-width="10" />
            <text x="400" y="120" font-family="Inter, sans-serif" font-size="40" font-weight="900" fill="#111" text-anchor="middle">CERTIFICATE OF COMPLETION</text>
            <text x="400" y="200" font-family="Inter, sans-serif" font-size="20" fill="#666" text-anchor="middle">This acknowledges that you have successfully completed</text>
            <text x="400" y="280" font-family="Inter, sans-serif" font-size="32" font-weight="800" fill="${accentColor}" text-anchor="middle">${escHtml(fresh.title)}</text>
            <text x="400" y="340" font-family="Inter, sans-serif" font-size="16" fill="#999" text-anchor="middle">${fresh.videos.length} lectures</text>
            <text x="400" y="420" font-family="Inter, sans-serif" font-size="16" fill="#666" text-anchor="middle">VFK Study App — ${new Date().toLocaleDateString()}</text>
            <circle cx="400" cy="490" r="30" fill="#eab308" />
            <path d="M390 485 L398 495 L415 475" fill="none" stroke="#fff" stroke-width="4" />
        </svg>`;
        $('#cert-svg-wrap').innerHTML = svg;
        $('#certificate-modal').classList.remove('hidden');
        $('#btn-download-cert').onclick = () => {
            const blob = new Blob([svg], {type: 'image/svg+xml'});
            const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
            a.download = `Certificate_${fresh.title.replace(/[^a-zA-Z0-9]/g,'_')}.svg`; a.click();
            URL.revokeObjectURL(a.href);
        };
        $('#btn-close-cert').onclick = () => $('#certificate-modal').classList.add('hidden');
    }
};

// ====== SHARE SYSTEM ======
$('#btn-share-course').addEventListener('click', () => {
    if(!currentCourse) return;
    // Generate URL using current origin + query param
    const url = new URL(window.location.href); url.searchParams.set('import', currentCourse.id);
    $('#share-url-input').value = url.toString();
    $('#share-modal').classList.remove('hidden');
});
$('#btn-copy-share').addEventListener('click', () => {
    navigator.clipboard.writeText($('#share-url-input').value);
    $('#btn-copy-share').innerHTML = '<i class="bx bx-check"></i> Copied';
    setTimeout(() => $('#btn-copy-share').innerHTML = '<i class="bx bx-copy"></i> Copy', 2000);
});
$('#btn-close-share').addEventListener('click', () => $('#share-modal').classList.add('hidden'));

// Handle auto-import on load
const handleUrlImport = () => {
    const params = new URLSearchParams(window.location.search);
    const importId = params.get('import');
    if(importId) {
        openAddModal();
        DOM.playlistInput.value = importId;
        setTimeout(() => DOM.btnImport.click(), 500);
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
    }
};

// ====== ONBOARDING & PWA ======
const initOnboarding = () => {
    if(State.data.settings.onboarded) return;
    const ob = $('#onboarding-overlay'); ob.classList.remove('hidden');
    let slide = 0; const slides = $$('.onboarding-slide'); const dots = $$('.ob-dot');
    const updateSlide = () => {
        slides.forEach((s,i) => s.classList.toggle('active', i===slide));
        dots.forEach((d,i) => d.classList.toggle('active', i===slide));
        $('#ob-next-label').textContent = slide === 2 ? 'Get Started' : 'Next';
    };
    $('#ob-next').onclick = async () => {
        if(slide < 2) { slide++; updateSlide(); }
        else { ob.classList.add('hidden'); await State.update(s => s.settings.onboarded = true); }
    };
    $('#ob-skip').onclick = async () => { ob.classList.add('hidden'); await State.update(s => s.settings.onboarded = true); };
};

let deferredPrompt;
window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault(); deferredPrompt = e;
    setTimeout(() => { if(!State.data.settings.pwaDismissed) $('#pwa-banner').classList.remove('hidden'); }, 3000);
});
$('#pwa-install').onclick = async () => {
    $('#pwa-banner').classList.add('hidden');
    if(deferredPrompt) { deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt = null; }
};
$('#pwa-dismiss').onclick = async () => { $('#pwa-banner').classList.add('hidden'); await State.update(s => s.settings.pwaDismissed = true); };

// ====== SETTINGS & THEME ======
const applyTheme = (t) => { document.documentElement.setAttribute('data-theme', t); DOM.themeToggle.innerHTML = t === 'dark' ? "<i class='bx bx-moon'></i>" : "<i class='bx bx-sun'></i>"; $('#setting-dark-mode').checked = t === 'dark'; };
const applyAccent = (a) => { document.documentElement.setAttribute('data-accent', a); $$('.swatch').forEach(s => s.classList.toggle('active', s.dataset.accent === a)); };

DOM.themeToggle.addEventListener('click', async () => { const t = State.data.settings.theme === 'dark' ? 'light' : 'dark'; await State.update(s => s.settings.theme = t); applyTheme(t); });
$('#setting-dark-mode').addEventListener('change', async e => { const t = e.target.checked ? 'dark' : 'light'; await State.update(s => s.settings.theme = t); applyTheme(t); });
$$('.swatch').forEach(s => s.addEventListener('click', async e => { const a = e.target.dataset.accent; await State.update(st => st.settings.accent = a); applyAccent(a); }));
$('#setting-autoplay').addEventListener('change', async e => await State.update(s => s.settings.autoplay = e.target.checked));
$('#setting-pomodoro').addEventListener('change', async e => { await State.update(s => s.settings.pomodoro = e.target.checked); togglePomodoro(e.target.checked); });

$('#btn-export').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(State.data, null, 2)], {type: 'application/json'});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `vfk_backup_${new Date().toISOString().slice(0,10)}.json`; a.click(); URL.revokeObjectURL(a.href);
});
$('#btn-import-file').addEventListener('change', e => {
    const f = e.target.files[0]; if(!f) return; const reader = new FileReader();
    reader.onload = async ev => {
        try { const d = JSON.parse(ev.target.result); if(!d.courses) throw new Error(); if(confirm('Replace all data with backup?')) { await DB.set('app_data', d); location.reload(); } } catch { alert('Invalid file'); }
    }; reader.readAsText(f);
});
$('#btn-clear-data').addEventListener('click', async () => { if(confirm('Clear ALL data permanently?')) { await DB.set('app_data', null); localStorage.removeItem('study_app_state'); location.reload(); } });

// ====== POMODORO ======
const Pomodoro = {
    FOCUS: 25*60, BREAK: 5*60, state: 'idle', mode: 'focus', remaining: 25*60, total: 25*60, interval: null,
    init() { $('#pomo-start').onclick=()=>this.toggle(); $('#pomo-reset').onclick=()=>this.reset(); $('#pomo-close').onclick=()=>$('#pomodoro-widget').classList.add('hidden'); },
    toggle() {
        if(this.state === 'running') { this.state = 'paused'; clearInterval(this.interval); $('#pomo-start').innerHTML = "<i class='bx bx-play'></i>"; }
        else { this.state = 'running'; $('#pomo-start').innerHTML = "<i class='bx bx-pause'></i>"; this.interval = setInterval(() => this.tick(), 1000); }
    },
    tick() {
        this.remaining--;
        if(this.remaining <= 0) {
            clearInterval(this.interval); this.state = 'idle'; this.beep();
            this.mode = this.mode === 'focus' ? 'break' : 'focus';
            this.remaining = this.mode === 'focus' ? this.FOCUS : this.BREAK; this.total = this.remaining;
            $('#pomo-mode').textContent = this.mode === 'focus' ? 'Focus' : 'Break';
            $('#pomo-time').className = `pomo-time ${this.mode==='break'?'break':''}`; $('#pomo-bar').className = `pomo-progress-bar ${this.mode==='break'?'break':''}`;
            $('#pomo-start').innerHTML = "<i class='bx bx-play'></i>";
        }
        this.render();
    },
    reset() { clearInterval(this.interval); this.state = 'idle'; this.mode = 'focus'; this.remaining = this.FOCUS; this.total = this.FOCUS; $('#pomo-mode').textContent = 'Focus'; $('#pomo-time').className = 'pomo-time'; $('#pomo-bar').className = 'pomo-progress-bar'; $('#pomo-start').innerHTML = "<i class='bx bx-play'></i>"; this.render(); },
    render() { const m = Math.floor(this.remaining/60), s = this.remaining%60; $('#pomo-time').textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`; $('#pomo-bar').style.width = ((this.total-this.remaining)/this.total*100)+'%'; },
    beep() { try{ const ctx = new(window.AudioContext||window.webkitAudioContext)(); const osc = ctx.createOscillator(); osc.connect(ctx.destination); osc.frequency.value = 800; osc.start(); osc.stop(ctx.currentTime + 0.5); }catch{} }
};
const togglePomodoro = (on) => { if(on) { $('#pomodoro-widget').classList.remove('hidden'); Pomodoro.reset(); } else $('#pomodoro-widget').classList.add('hidden'); };

// ====== KEYBOARD SHORTCUTS ======
document.addEventListener('keydown', async e => {
    if(e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if(!DOM.playerOverlay.classList.contains('hidden')) {
        if(e.code === 'Space') { e.preventDefault(); if(ytPlayer) { const s = ytPlayer.getPlayerState?.(); if(s === YT.PlayerState.PLAYING) ytPlayer.pauseVideo(); else ytPlayer.playVideo(); } }
        if(e.code === 'ArrowRight') { e.preventDefault(); $('#btn-next-video').click(); }
        if(e.code === 'ArrowLeft') { e.preventDefault(); $('#btn-prev-video').click(); }
        if(e.code === 'KeyF') { e.preventDefault(); DOM.btnFullscreen.click(); }
        if(e.code === 'KeyB') {
            e.preventDefault();
            if(currentCourse && currentCourse.videos[currentVideoIdx]) {
                await toggleBookmark(currentCourse.videos[currentVideoIdx].id);
                // Update bookmark icon in player header
                const bIcon = DOM.btnBookmarkPlayer.querySelector('i');
                const vid = currentCourse.videos[currentVideoIdx].id;
                if(isBookmarked(vid)) { bIcon.className = 'bx bxs-star'; bIcon.style.color = '#eab308'; }
                else { bIcon.className = 'bx bx-star'; bIcon.style.color = ''; }
            }
        }
    }
});

// ====== INIT ======
(async function initApp() {
    await State.load();
    const s = State.data.settings;
    applyTheme(s.theme); applyAccent(s.accent);
    $('#setting-autoplay').checked = s.autoplay; $('#setting-pomodoro').checked = s.pomodoro;
    if(s.pomodoro) $('#pomodoro-widget').classList.remove('hidden'); Pomodoro.init();
    
    renderCourses(); updateStreak();
    setTimeout(() => { const sp = $('#splash-screen'); if(sp) sp.style.opacity = '0'; setTimeout(()=>sp?.remove(), 500); }, 2000);
    
    initOnboarding(); handleUrlImport();

    // Register SW
    if('serviceWorker' in navigator) { window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(err=>console.log('SW reg failed', err))); }
})();
