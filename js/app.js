(function () {
  "use strict";

  const API_BASE = "";
  const EBB_INTERVALS = [1, 2, 4, 7, 15, 30, 60];
  const RETENTION = [100, 58, 44, 36, 33, 28, 25, 21];
  const RETENTION_DAYS = [0, 1, 2, 4, 7, 15, 30, 60];
  const WEEK = ["日", "一", "二", "三", "四", "五", "六"];

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  function toDateStr(d) {
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  function parseDate(str) {
    const [y, m, d] = str.split("-").map(Number);
    return new Date(y, m - 1, d);
  }

  function addDays(dateStr, days) {
    const d = parseDate(dateStr);
    d.setDate(d.getDate() + days);
    return toDateStr(d);
  }

  function todayStr() {
    return toDateStr(new Date());
  }

  function uid(prefix) {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  }

  function esc(value) {
    if (value === null || value === undefined) return "";
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  let state = null;
  let currentUser = null;
  let saveTimer = null;
  let currentView = "dashboard";
  let currentKnowledgeSubject = "all";
  let currentQuestionImage = "";

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));

  async function apiFetch(url, options) {
    const opts = options || {};
    opts.headers = Object.assign({}, opts.headers || {});
    if (opts.body && typeof opts.body === "string") {
      opts.headers["Content-Type"] = "application/json";
    }
    const response = await fetch(`${API_BASE}${url}`, opts);
    if (response.status === 401) {
      window.location.href = "/login";
      throw new Error("登录已过期，请重新登录。");
    }
    const text = await response.text();
    let data;
    try {
      data = text ? JSON.parse(text) : null;
    } catch (err) {
      data = { message: text };
    }
    if (!response.ok) {
      throw new Error((data && (data.message || data.error)) || "请求失败，请稍后重试。");
    }
    return data;
  }

  async function ensureAuthenticated() {
    currentUser = await apiFetch("/api/me");
  }

  async function loadInitialState() {
    const result = await apiFetch("/api/state");
    if (result && result.data && Array.isArray(result.data.subjects) && Array.isArray(result.data.knowledgePoints)) {
      return result.data;
    }
    const seed = window.TXK_SEED();
    await saveStateNow(seed);
    return seed;
  }

  async function saveStateNow(data) {
    await fetch(`${API_BASE}/api/state`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data }),
      keepalive: true,
    });
  }

  function persist() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      saveStateNow(state).catch((err) => {
        console.error("保存失败", err);
        toast("保存失败：网络或服务器异常，请稍后重试。", true);
      });
    }, 250);
  }

  function getSubject(id) {
    return state.subjects.find((s) => s.id === id) || state.subjects[0];
  }

  function getKp(id) {
    return state.knowledgePoints.find((k) => k.id === id);
  }

  function kpNames(ids) {
    return (ids || [])
      .map((id) => getKp(id))
      .filter(Boolean)
      .map((k) => k.name);
  }

  function reviewedToday(q) {
    return (q.reviews || []).some((r) => r.date === todayStr());
  }

  function isDue(q) {
    return q.nextReviewAt && q.nextReviewAt <= todayStr();
  }

  function remainingDue() {
    return state.questions.filter((q) => isDue(q) && !reviewedToday(q));
  }

  function allDue() {
    return state.questions
      .filter((q) => isDue(q) || reviewedToday(q))
      .sort((a, b) => {
        const aDone = reviewedToday(a) ? 1 : 0;
        const bDone = reviewedToday(b) ? 1 : 0;
        if (aDone !== bDone) return aDone - bDone;
        return (a.nextReviewAt || "").localeCompare(b.nextReviewAt || "");
      });
  }

  function masteryOf(q) {
    if (q.rep >= 3) return "mastered";
    if (q.rep >= 1) return "learning";
    return "weak";
  }

  function masteryLabel(mastery) {
    return { weak: "薄弱", learning: "学习中", mastered: "已掌握" }[mastery] || "未复习";
  }

  function masteryBadge(mastery) {
    const cls = { weak: "badge-red", learning: "badge-amber", mastered: "badge-green" }[mastery];
    return `<span class="badge ${cls}">${masteryLabel(mastery)}</span>`;
  }

  function stars(n) {
    return "★".repeat(Number(n) || 1) + "☆".repeat(5 - (Number(n) || 1));
  }

  function dayLabel(dateStr) {
    const d = parseDate(dateStr);
    return `${d.getMonth() + 1}月${d.getDate()}日 · 周${WEEK[d.getDay()]}`;
  }

  function daysUntil(dateStr) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = parseDate(dateStr);
    target.setHours(0, 0, 0, 0);
    return Math.ceil((target - today) / 86400000);
  }

  function toast(message, isError) {
    const el = $("#toast");
    el.textContent = message;
    if (isError) el.style.background = "#b91c1c";
    else el.style.background = "#101828";
    el.classList.add("show");
    clearTimeout(el._timer);
    el._timer = setTimeout(() => el.classList.remove("show"), 2600);
  }

  function topWeakKps(limit) {
    const counts = {};
    state.questions.forEach((q) => {
      (q.kpIds || []).forEach((id) => {
        counts[id] = counts[id] || { kp: getKp(id), questions: [] };
        if (counts[id].kp) counts[id].questions.push(q);
      });
    });
    return Object.values(counts)
      .filter((item) => item.kp)
      .map((item) => ({ kp: item.kp, count: item.questions.length, questions: item.questions }))
      .sort((a, b) => b.count - a.count || b.kp.name.localeCompare(a.kp.name))
      .slice(0, limit || 5);
  }

  function activityDates() {
    const dates = new Set();
    state.questions.forEach((q) => {
      (q.reviews || []).forEach((r) => dates.add(r.date));
    });
    state.tasks.forEach((t) => {
      if (t.completed) dates.add(t.date);
    });
    return dates;
  }

  function computeStreak() {
    const active = activityDates();
    let cursor = todayStr();
    if (!active.has(cursor)) cursor = addDays(cursor, -1);
    let streak = 0;
    while (active.has(cursor)) {
      streak += 1;
      cursor = addDays(cursor, -1);
    }
    return streak;
  }

  function populateSubjectSelects() {
    const selectors = ["#filterSubject", "#questionSubject", "#taskSubject", "#knowledgeSubject"];
    selectors.forEach((sel) => {
      const el = $(sel);
      if (!el) return;
      const current = el.value;
      el.innerHTML = "";
      if (sel === "#filterSubject") {
        el.insertAdjacentHTML("beforeend", `<option value="all">全部学科</option>`);
      }
      state.subjects.forEach((s) => {
        el.insertAdjacentHTML(
          "beforeend",
          `<option value="${esc(s.id)}">${esc(s.name)}</option>`
        );
      });
      if (current && [...el.options].some((o) => o.value === current)) el.value = current;
    });
  }

  function populateKpSelect(select, subjectId, selectedIds) {
    if (!select) return;
    select.innerHTML = "";
    const list = state.knowledgePoints.filter((k) => !subjectId || k.subjectId === subjectId);
    list.forEach((k) => {
      const subject = getSubject(k.subjectId);
      const option = document.createElement("option");
      option.value = k.id;
      option.textContent = `${subject.name} · ${k.name}`;
      if ((selectedIds || []).includes(k.id)) option.selected = true;
      select.appendChild(option);
    });
  }

  function showView(view) {
    currentView = view;
    $$(".nav-item").forEach((btn) => btn.classList.toggle("active", btn.dataset.view === view));
    $$(".view").forEach((section) => section.classList.remove("active"));
    const target = $(`#view-${view}`);
    if (target) target.classList.add("active");
    const titles = {
      dashboard: "学习总览",
      plan: "每日计划",
      review: "遗忘曲线复习",
      questions: "错题本",
      knowledge: "知识图谱",
      stats: "学情分析",
    };
    $("#pageTitle").textContent = titles[view] || "学习总览";
    $("#todayLabel").textContent = dayLabel(todayStr());
    renderCurrentView(view);
  }

  function renderCurrentView(view) {
    if (view === "dashboard") renderDashboard();
    if (view === "plan") renderPlan();
    if (view === "review") {
      renderReview();
      drawForgettingChart();
    }
    if (view === "questions") renderQuestions();
    if (view === "knowledge") renderKnowledge();
    if (view === "stats") renderStats();
  }

  function renderCountdown() {
    const days = daysUntil(state.profile.gaokaoDate);
    $("#countdownChip").textContent =
      days >= 0 ? `距离高考 ${days} 天` : "高考进行时，稳住心态！";
  }

  function renderDashboard() {
    const due = allDue();
    const dueDone = due.filter(reviewedToday).length;
    const dueRemaining = due.length - dueDone;
    $("#dueCount").textContent = dueRemaining;
    const duePct = due.length ? Math.round((dueDone / due.length) * 100) : 0;
    $("#heroRing").textContent = due.length ? `${dueDone}/${due.length}` : "0";

    const todayTasks = state.tasks.filter((t) => t.date === todayStr());
    const planTotal = due.length + todayTasks.length;
    const planDone = dueDone + todayTasks.filter((t) => t.completed).length;
    const planPct = planTotal ? Math.round((planDone / planTotal) * 100) : 0;
    const ring = $("#dailyProgressRing");
    ring.style.background = `conic-gradient(var(--primary) ${planPct * 3.6}deg, #eef1f7 0deg)`;
    ring.innerHTML = `<span>${planPct}%</span>`;
    $("#dailyProgressText").textContent = `${planDone} / ${planTotal} 项已完成`;

    const total = state.questions.length;
    const mastered = state.questions.filter((q) => masteryOf(q) === "mastered").length;
    $("#totalQuestions").textContent = total;
    $("#masteredCount").textContent = mastered;
    $("#streakDays").textContent = computeStreak();

    renderTodayTodo();
    renderWeakTop();
  }

  function renderTodayTodo() {
    const box = $("#todayTodoList");
    const items = [];
    allDue().forEach((q) => {
      const subject = getSubject(q.subjectId);
      const done = reviewedToday(q);
      items.push({
        id: q.id,
        type: "review",
        title: `复习：${subject.name} · ${esc(q.question.slice(0, 34))}`,
        sub: `遗忘曲线复习点 · ${done ? "已完成" : "待完成"}`,
        done,
        action: "review",
      });
    });
    state.tasks
      .filter((t) => t.date === todayStr())
      .forEach((t) => {
        const subject = getSubject(t.subjectId);
        items.push({
          id: t.id,
          type: "task",
          title: t.title,
          sub: `${subject.name} · ${t.duration} 分钟`,
          done: t.completed,
          action: "toggle",
        });
      });

    if (!items.length) {
      box.innerHTML = `<div class="empty-state"><span class="empty-icon">🎉</span>今天还没有安排，去添加学习任务吧。</div>`;
      return;
    }

    box.innerHTML = items
      .map(
        (item) => `
        <div class="list-item" data-id="${esc(item.id)}" data-type="${item.type}" data-action="${item.action}">
          <div class="plan-check">${item.done ? "✓" : ""}</div>
          <div class="item-main">
            <div class="item-title">${esc(item.title)}</div>
            <div class="item-sub">${esc(item.sub)}</div>
          </div>
          ${item.done ? '<span class="badge badge-green">完成</span>' : '<span class="badge badge-blue">去处理</span>'}
        </div>`
      )
      .join("");
  }

  function renderWeakTop() {
    const box = $("#weakTopList");
    const weak = topWeakKps(5);
    if (!weak.length) {
      box.innerHTML = `<div class="empty-state"><span class="empty-icon">📈</span>暂无错题数据，录入错题后自动生成。</div>`;
      return;
    }
    box.innerHTML = weak
      .map((item) => {
        const subject = getSubject(item.kp.subjectId);
        return `
          <div class="list-item">
            <div class="badge" style="background:${subject.color}20;color:${subject.color}">${esc(subject.name)}</div>
            <div class="item-main">
              <div class="item-title">${esc(item.kp.name)}</div>
              <div class="item-sub">关联错题 ${item.count} 道</div>
            </div>
            <span class="badge badge-red">${item.count}</span>
          </div>`;
      })
      .join("");
  }

  function renderPlan() {
    const date = todayStr();
    $("#planDate").textContent = dayLabel(date);
    const due = allDue();
    const dueDone = due.filter(reviewedToday).length;
    const custom = state.tasks.filter((t) => t.date === date);
    const customDone = custom.filter((t) => t.completed).length;
    const total = due.length + custom.length;
    const done = dueDone + customDone;
    const duration = custom.reduce((sum, t) => sum + Number(t.duration || 0), 0) + due.length * 10;

    $("#planTotal").textContent = total;
    $("#planDone").textContent = done;
    $("#planDuration").textContent = duration;
    $("#planProgressBar").style.width = total ? `${(done / total) * 100}%` : "0%";

    const box = $("#planList");
    if (!total) {
      box.innerHTML = `<div class="empty-state"><span class="empty-icon">🗓️</span>今天还没有学习计划，可点击“生成建议计划”或手动添加。</div>`;
      return;
    }

    const items = [];
    due.forEach((q) => {
      const subject = getSubject(q.subjectId);
      const isDone = reviewedToday(q);
      items.push(`
        <div class="plan-item ${isDone ? "done" : ""}" data-action="review" data-id="${esc(q.id)}">
          <button class="plan-check" aria-label="去复习">${isDone ? "✓" : ""}</button>
          <div class="plan-main">
            <div class="plan-title">${esc(subject.name)} · 遗忘曲线复习</div>
            <div class="plan-sub">${esc(q.question.slice(0, 54))}</div>
          </div>
          <span class="badge ${isDone ? "badge-green" : "badge-blue"}">${isDone ? "已完成" : "约 10 分钟"}</span>
        </div>`);
    });
    custom.forEach((t) => {
      const subject = getSubject(t.subjectId);
      items.push(`
        <div class="plan-item ${t.completed ? "done" : ""}" data-action="toggle" data-id="${esc(t.id)}">
          <button class="plan-check" aria-label="切换完成">${t.completed ? "✓" : ""}</button>
          <div class="plan-main">
            <div class="plan-title">${esc(t.title)}</div>
            <div class="plan-sub">${esc(subject.name)} · ${esc(t.duration)} 分钟</div>
          </div>
          <button class="icon-btn" data-action="delete-task" data-id="${esc(t.id)}" aria-label="删除任务">×</button>
        </div>`);
    });
    box.innerHTML = items.join("");
  }

  function renderReview() {
    const due = allDue();
    const remaining = due.filter((q) => !reviewedToday(q));
    $("#reviewQueueStats").innerHTML = `
      <div class="queue-stat"><strong>${due.length}</strong>今日到期</div>
      <div class="queue-stat"><strong>${due.length - remaining.length}</strong>已完成</div>
      <div class="queue-stat"><strong>${remaining.length}</strong>待复习</div>`;
    const list = $("#reviewQueueList");
    if (!due.length) {
      list.innerHTML = `<div class="empty-state"><span class="empty-icon">🧠</span>今天没有到期的错题。</div>`;
    } else {
      list.innerHTML = due
        .map((q) => {
          const subject = getSubject(q.subjectId);
          const done = reviewedToday(q);
          return `
            <div class="list-item">
              <div class="badge" style="background:${subject.color}20;color:${subject.color}">${esc(subject.name)}</div>
              <div class="item-main">
                <div class="item-title">${esc(q.question.slice(0, 32))}</div>
                <div class="item-sub">${done ? "今日已复习" : `复习点：${esc(q.nextReviewAt)}`}</div>
              </div>
              ${done ? '<span class="badge badge-green">✓</span>' : '<span class="badge badge-amber">待复习</span>'}
            </div>`;
        })
        .join("");
    }

    const first = remaining[0];
    if (!first) {
      $("#reviewCard").classList.add("hidden");
    } else {
      $("#reviewCard").classList.remove("hidden");
      renderReviewQuestion(first, remaining.length, due.length);
    }
  }

  function renderReviewQuestion(q, remainingCount, totalCount) {
    const subject = getSubject(q.subjectId);
    const kps = kpNames(q.kpIds || []);
    $("#reviewProgressBar").style.width = `${((totalCount - remainingCount) / totalCount) * 100}%`;
    $("#reviewProgressText").textContent = `${totalCount - remainingCount + 1} / ${totalCount}`;
    $("#reviewQuestionArea").innerHTML = `
      <div class="q-meta" style="margin-bottom:12px">
        <span class="badge" style="background:${subject.color}20;color:${subject.color}">${esc(subject.name)}</span>
        <span>${stars(q.difficulty)}</span>
        ${kps.map((k) => `<span class="tag">${esc(k)}</span>`).join("")}
      </div>
      <div class="question-display">${esc(q.question)}${q.image ? `<br><img src="${esc(q.image)}" alt="错题图片">` : ""}</div>`;
    $("#reviewAnswerArea").classList.add("hidden");
    $("#reviewAnswerArea").innerHTML = `
      <div class="eyebrow" style="margin-bottom:8px">参考答案与解析</div>
      <div class="review-answer">${esc(q.answer || "（未填写答案）")}</div>
      ${q.analysis ? `<div class="muted" style="margin-bottom:4px">错误原因</div><div class="review-answer" style="border-color:#eab308;background:var(--amber-soft)">${esc(q.analysis)}</div>` : ""}`;
    $("#showAnswerBtn").classList.remove("hidden");
    $("#gradePanel").classList.add("hidden");
    $("#reviewActions").classList.remove("hidden");
    $("#reviewCard").dataset.questionId = q.id;
  }

  function gradeCurrentQuestion(score) {
    const id = $("#reviewCard").dataset.questionId;
    const q = state.questions.find((item) => item.id === id);
    if (!q) return;
    score = Number(score);
    q.reviews = q.reviews || [];
    q.reviews.push({ date: todayStr(), score });

    if (score <= 2) {
      q.rep = 0;
      q.interval = 1;
      q.ease = Math.max(1.3, Number(q.ease || 2.5) - 0.15);
    } else {
      q.rep = (q.rep || 0) + 1;
      if (score === 5) q.ease = Math.min(3, Number(q.ease || 2.5) + 0.12);
      else if (score === 4) q.ease = Math.min(3, Number(q.ease || 2.5) + 0.05);
      const idx = Math.max(0, Math.min(q.rep - 1, EBB_INTERVALS.length - 1));
      const factor = score === 5 ? 1.15 : score === 4 ? 1 : 0.85;
      q.interval = Math.max(1, Math.round(EBB_INTERVALS[idx] * factor));
    }
    q.nextReviewAt = addDays(todayStr(), q.interval);
    persist();
    renderReview();
    renderDashboard();
    const remaining = remainingDue();
    if (!remaining.length) {
      $("#reviewCard").classList.add("hidden");
      toast("今日复习全部完成，太棒了！🎉");
    } else {
      renderReviewQuestion(remaining[0], remaining.length, allDue().length);
      toast(`已记录，下次复习：${q.nextReviewAt}`);
    }
  }

  function drawForgettingChart() {
    const canvas = $("#forgettingChart");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = "100%";
    canvas.style.height = "auto";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const pad = { top: 22, right: 18, bottom: 34, left: 42 };
    const plotW = width - pad.left - pad.right;
    const plotH = height - pad.top - pad.bottom;
    const maxY = 100;

    ctx.font = "12px sans-serif";
    ctx.fillStyle = "#667085";
    ctx.strokeStyle = "#e6e9f2";
    ctx.lineWidth = 1;

    [0, 25, 50, 75, 100].forEach((val) => {
      const y = pad.top + plotH - (val / maxY) * plotH;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(width - pad.right, y);
      ctx.stroke();
      ctx.textAlign = "right";
      ctx.fillText(`${val}%`, pad.left - 8, y + 4);
    });

    const points = RETENTION.map((val, i) => ({
      x: pad.left + (i / (RETENTION.length - 1)) * plotW,
      y: pad.top + plotH - (val / maxY) * plotH,
      val,
      day: RETENTION_DAYS[i],
    }));

    const gradient = ctx.createLinearGradient(0, pad.top, 0, height - pad.bottom);
    gradient.addColorStop(0, "rgba(79,110,247,0.24)");
    gradient.addColorStop(1, "rgba(79,110,247,0.02)");
    ctx.beginPath();
    ctx.moveTo(points[0].x, pad.top + plotH);
    points.forEach((p) => ctx.lineTo(p.x, p.y));
    ctx.lineTo(points[points.length - 1].x, pad.top + plotH);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.beginPath();
    points.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    ctx.strokeStyle = "#4f6ef7";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    points.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#4f6ef7";
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(p.x, p.y, 1.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#667085";
      ctx.textAlign = "center";
      ctx.fillText(`第${p.day}天`, p.x, height - 8);
    });
  }

  function renderQuestions() {
    const subjectId = $("#filterSubject").value;
    const mastery = $("#filterMastery").value;
    const keyword = $("#searchInput").value.trim().toLowerCase();
    let list = state.questions.slice();
    if (subjectId !== "all") list = list.filter((q) => q.subjectId === subjectId);
    if (mastery !== "all") list = list.filter((q) => masteryOf(q) === mastery);
    if (keyword) {
      list = list.filter((q) => {
        const haystack = [
          q.question,
          q.answer,
          q.analysis,
          q.source,
          (q.tags || []).join(" "),
          kpNames(q.kpIds || []).join(" "),
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(keyword);
      });
    }
    list.sort((a, b) => (a.nextReviewAt || "").localeCompare(b.nextReviewAt || ""));

    const box = $("#questionList");
    if (!list.length) {
      box.innerHTML = `<div class="empty-state"><span class="empty-icon">✏️</span>暂无符合条件的错题，点击“录入错题”开始记录。</div>`;
      return;
    }
    box.innerHTML = list
      .map((q) => {
        const subject = getSubject(q.subjectId);
        const m = masteryOf(q);
        const kps = kpNames(q.kpIds || []);
        return `
          <article class="question-card">
            <div class="q-head">
              <span class="badge" style="background:${subject.color}20;color:${subject.color}">${esc(subject.name)}</span>
              ${masteryBadge(m)}
            </div>
            <div class="q-text">${esc(q.question)}</div>
            <div class="tag-row">
              ${kps.map((k) => `<span class="tag">${esc(k)}</span>`).join("")}
              ${(q.tags || []).map((t) => `<span class="tag">#${esc(t)}</span>`).join("")}
            </div>
            <div class="q-meta">
              <span>${stars(q.difficulty)}</span>
              <span>下次复习：${esc(q.nextReviewAt || "未设置")}</span>
            </div>
            <div class="q-actions">
              <button class="ghost-btn" data-action="edit-question" data-id="${esc(q.id)}">编辑</button>
              <button class="ghost-btn" data-action="review-question" data-id="${esc(q.id)}">立即复习</button>
              <button class="ghost-btn" data-action="delete-question" data-id="${esc(q.id)}">删除</button>
            </div>
          </article>`;
      })
      .join("");
  }

  function openQuestionModal(id) {
    const modal = $("#questionModal");
    const form = $("#questionForm");
    form.reset();
    $("#questionId").value = "";
    $("#questionDifficulty").value = "3";
    $("#questionSubject").value = state.subjects[0]?.id || "";
    populateKpSelect($("#questionKps"), $("#questionSubject").value, []);
    $("#imagePreview").classList.add("hidden");
    $("#imagePreview").innerHTML = "";
    $("#questionImage").value = "";
    currentQuestionImage = "";

    if (id) {
      const q = state.questions.find((item) => item.id === id);
      if (!q) return;
      $("#questionModalTitle").textContent = "编辑错题";
      $("#questionId").value = q.id;
      $("#questionSubject").value = q.subjectId;
      $("#questionDifficulty").value = String(q.difficulty || 3);
      $("#questionSource").value = q.source || "";
      $("#questionText").value = q.question || "";
      $("#questionAnswer").value = q.answer || "";
      $("#questionAnalysis").value = q.analysis || "";
      $("#questionTags").value = (q.tags || []).join(", ");
      populateKpSelect($("#questionKps"), q.subjectId, q.kpIds || []);
      currentQuestionImage = q.image || "";
      if (q.image) {
        $("#imagePreview").classList.remove("hidden");
        $("#imagePreview").innerHTML = `<img src="${esc(q.image)}" alt="已有错题图片">`;
      }
    } else {
      $("#questionModalTitle").textContent = "录入错题";
    }
    modal.classList.remove("hidden");
  }

  async function saveQuestion(e) {
    e.preventDefault();
    const id = $("#questionId").value;
    const file = $("#questionImage").files[0];
    let image = currentQuestionImage;
    if (file) {
      try {
        image = await compressImage(file);
      } catch (err) {
        toast("图片处理失败，请换一张图片。", true);
        return;
      }
    }
    const kpIds = Array.from($("#questionKps").selectedOptions).map((o) => o.value);
    const payload = {
      subjectId: $("#questionSubject").value,
      kpIds,
      question: $("#questionText").value.trim(),
      answer: $("#questionAnswer").value.trim(),
      analysis: $("#questionAnalysis").value.trim(),
      difficulty: Number($("#questionDifficulty").value),
      source: $("#questionSource").value.trim(),
      tags: $("#questionTags")
        .value.split(/[,，]/)
        .map((s) => s.trim())
        .filter(Boolean),
      image,
    };

    if (id) {
      const q = state.questions.find((item) => item.id === id);
      Object.assign(q, payload);
      toast("错题已更新");
    } else {
      const now = todayStr();
      state.questions.unshift({
        id: uid("q"),
        ...payload,
        createdAt: now,
        nextReviewAt: now,
        rep: 0,
        ease: 2.5,
        interval: 1,
        reviews: [],
      });
      toast("错题已保存，已加入今日遗忘曲线复习。");
    }
    persist();
    $("#questionModal").classList.add("hidden");
    renderQuestions();
    renderDashboard();
    renderReview();
  }

  function compressImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("read error"));
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error("image error"));
        img.onload = () => {
          const maxW = 1100;
          let w = img.naturalWidth;
          let h = img.naturalHeight;
          if (w > maxW) {
            h = Math.round((h * maxW) / w);
            w = maxW;
          }
          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          ctx.fillStyle = "#fff";
          ctx.fillRect(0, 0, w, h);
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL("image/jpeg", 0.74));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function deleteQuestion(id) {
    const q = state.questions.find((item) => item.id === id);
    if (!q) return;
    if (!window.confirm(`确定删除这道错题吗？\n\n${q.question.slice(0, 80)}`)) return;
    state.questions = state.questions.filter((item) => item.id !== id);
    persist();
    renderQuestions();
    renderDashboard();
    renderReview();
    toast("错题已删除");
  }

  function openKnowledgeModal(id) {
    const modal = $("#knowledgeModal");
    $("#knowledgeForm").reset();
    $("#knowledgeId").value = "";
    $("#knowledgeSubject").value = state.subjects[0]?.id || "";
    if (id) {
      const k = getKp(id);
      if (!k) return;
      $("#knowledgeId").value = k.id;
      $("#knowledgeSubject").value = k.subjectId;
      $("#knowledgeName").value = k.name;
      $("#knowledgeSummary").value = k.summary || "";
      $("#knowledgeExtension").value = k.extension || "";
      $("#knowledgeTips").value = k.tips || "";
      $("#knowledgeMistakes").value = k.commonMistakes || "";
    }
    modal.classList.remove("hidden");
  }

  function saveKnowledge(e) {
    e.preventDefault();
    const id = $("#knowledgeId").value;
    const payload = {
      subjectId: $("#knowledgeSubject").value,
      name: $("#knowledgeName").value.trim(),
      summary: $("#knowledgeSummary").value.trim(),
      extension: $("#knowledgeExtension").value.trim(),
      tips: $("#knowledgeTips").value.trim(),
      commonMistakes: $("#knowledgeMistakes").value.trim(),
    };
    if (id) {
      const k = getKp(id);
      Object.assign(k, payload);
      toast("知识点已更新");
    } else {
      state.knowledgePoints.push({ id: uid("kp"), ...payload });
      toast("知识点已添加");
    }
    persist();
    $("#knowledgeModal").classList.add("hidden");
    renderKnowledge();
  }

  function deleteKnowledge(id) {
    const k = getKp(id);
    if (!k) return;
    if (!window.confirm(`确定删除知识点“${k.name}”吗？关联错题不会删除，只会失去该标签。`)) return;
    state.knowledgePoints = state.knowledgePoints.filter((item) => item.id !== id);
    state.questions.forEach((q) => {
      q.kpIds = (q.kpIds || []).filter((kid) => kid !== id);
    });
    persist();
    renderKnowledge();
    renderQuestions();
    renderDashboard();
    toast("知识点已删除");
  }

  function renderKnowledge() {
    const tabs = $("#subjectTabs");
    tabs.innerHTML = `<button class="subject-tab ${currentKnowledgeSubject === "all" ? "active" : ""}" data-subject="all">全部</button>`;
    state.subjects.forEach((s) => {
      tabs.insertAdjacentHTML(
        "beforeend",
        `<button class="subject-tab ${currentKnowledgeSubject === s.id ? "active" : ""}" data-subject="${esc(s.id)}">${esc(s.name)}</button>`
      );
    });

    const list = state.knowledgePoints.filter(
      (k) => currentKnowledgeSubject === "all" || k.subjectId === currentKnowledgeSubject
    );
    const box = $("#knowledgeList");
    if (!list.length) {
      box.innerHTML = `<div class="empty-state"><span class="empty-icon">📖</span>该学科还没有知识点，点击“添加知识点”完善知识图谱。</div>`;
      return;
    }
    box.innerHTML = list
      .map((k) => {
        const subject = getSubject(k.subjectId);
        const related = state.questions.filter((q) => (q.kpIds || []).includes(k.id));
        return `
          <article class="knowledge-card">
            <div class="q-head">
              <span class="badge" style="background:${subject.color}20;color:${subject.color}">${esc(subject.name)}</span>
              <span class="badge badge-red">错题 ${related.length} 道</span>
            </div>
            <h3>${esc(k.name)}</h3>
            <div class="knowledge-block"><strong>知识总结</strong><p>${esc(k.summary)}</p></div>
            ${k.extension ? `<div class="knowledge-block"><strong>延伸拓展</strong><p>${esc(k.extension)}</p></div>` : ""}
            ${k.tips ? `<div class="knowledge-block"><strong>解题技巧</strong><p>${esc(k.tips)}</p></div>` : ""}
            ${k.commonMistakes ? `<div class="knowledge-block"><strong>常见错误</strong><p>${esc(k.commonMistakes)}</p></div>` : ""}
            <div class="q-actions">
              <button class="ghost-btn" data-action="edit-knowledge" data-id="${esc(k.id)}">编辑</button>
              <button class="ghost-btn" data-action="delete-knowledge" data-id="${esc(k.id)}">删除</button>
            </div>
          </article>`;
      })
      .join("");
  }

  function buildSummaryText() {
    const total = state.questions.length;
    const mastered = state.questions.filter((q) => masteryOf(q) === "mastered").length;
    const due = remainingDue().length;
    const weak = topWeakKps(6);
    const days = daysUntil(state.profile.gaokaoDate);
    const lines = [];
    lines.push("陶可馨 · 错题知识点总结");
    lines.push(`生成日期：${dayLabel(todayStr())}　距离高考：${days >= 0 ? days + " 天" : "已进入高考阶段"}`);
    lines.push("========================================");
    lines.push(`累计错题 ${total} 道，已掌握 ${mastered} 道，今日待复习 ${due} 道。`);
    lines.push("");
    lines.push("【薄弱知识点排行】");
    if (!weak.length) {
      lines.push("暂无错题数据，录入错题后会自动生成薄弱点分析。");
    } else {
      weak.forEach((item, i) => {
        const subject = getSubject(item.kp.subjectId);
        lines.push(`${i + 1}. [${subject.name}] ${item.kp.name}（错题 ${item.count} 道）`);
        if (item.kp.summary) lines.push(`   ▶ 知识总结：${item.kp.summary}`);
        if (item.kp.extension) lines.push(`   ▶ 延伸拓展：${item.kp.extension}`);
        if (item.kp.commonMistakes) lines.push(`   ▶ 常见错误：${item.kp.commonMistakes}`);
        if (item.kp.tips) lines.push(`   ▶ 解题技巧：${item.kp.tips}`);
        const titles = item.questions
          .slice(0, 4)
          .map((q, idx) => `错题${idx + 1}：${q.question.slice(0, 52)}`)
          .join("　");
        lines.push(`   ▶ 关联错题：${titles}`);
        lines.push("");
      });
    }
    lines.push("========================================");
    lines.push("复习建议：优先复习“薄弱知识点排行”中的错题，按遗忘曲线连续完成 3 次高质量回忆后，系统会自动拉长复习间隔。");
    return lines.join("\n");
  }

  function renderStats() {
    const subjectBox = $("#subjectDistribution");
    const counts = {};
    state.questions.forEach((q) => {
      counts[q.subjectId] = (counts[q.subjectId] || 0) + 1;
    });
    const subjectRows = state.subjects
      .map((s) => ({ subject: s, count: counts[s.id] || 0 }))
      .sort((a, b) => b.count - a.count);
    const maxSubject = Math.max(1, ...subjectRows.map((r) => r.count));
    subjectBox.innerHTML = subjectRows
      .map((row) => {
        const pct = Math.round((row.count / maxSubject) * 100);
        return `
          <div class="bar-row">
            <span>${esc(row.subject.name)}</span>
            <div class="bar-track"><div class="bar-fill" style="width:${pct}%;background:${row.subject.color}"></div></div>
            <span>${row.count}</span>
          </div>`;
      })
      .join("");

    const masteryCounts = { weak: 0, learning: 0, mastered: 0 };
    state.questions.forEach((q) => {
      masteryCounts[masteryOf(q)] += 1;
    });
    const maxMastery = Math.max(1, ...Object.values(masteryCounts));
    const masteryBox = $("#masteryDistribution");
    const masteryMeta = [
      { key: "weak", label: "薄弱", color: "#dc2626" },
      { key: "learning", label: "学习中", color: "#d97706" },
      { key: "mastered", label: "已掌握", color: "#16a34a" },
    ];
    masteryBox.innerHTML = masteryMeta
      .map((m) => {
        const count = masteryCounts[m.key];
        const pct = Math.round((count / maxMastery) * 100);
        return `
          <div class="bar-row">
            <span>${m.label}</span>
            <div class="bar-track"><div class="bar-fill" style="width:${pct}%;background:${m.color}"></div></div>
            <span>${count}</span>
          </div>`;
      })
      .join("");

    const trendBox = $("#reviewTrend");
    const days = [];
    for (let i = 13; i >= 0; i--) days.push(addDays(todayStr(), -i));
    const trend = days.map((date) => {
      const reviewCount = state.questions.reduce(
        (sum, q) => sum + (q.reviews || []).filter((r) => r.date === date).length,
        0
      );
      const taskCount = state.tasks.filter((t) => t.date === date && t.completed).length;
      return { date, count: reviewCount + taskCount };
    });
    const maxTrend = Math.max(1, ...trend.map((t) => t.count));
    trendBox.innerHTML = trend
      .map((item) => {
        const h = Math.round((item.count / maxTrend) * 120);
        return `
          <div class="trend-col" title="${esc(item.date)}：${item.count} 项">
            <div class="trend-bar-wrap"><div class="trend-bar" style="height:${Math.max(2, h)}px"></div></div>
            <span class="trend-label">${esc(item.date.slice(5))}</span>
          </div>`;
      })
      .join("");
  }

  function generateAutoPlan() {
    const today = todayStr();
    const existing = new Set(state.tasks.filter((t) => t.date === today).map((t) => t.title));
    let added = 0;

    const weak = topWeakKps(3);
    weak.forEach((item) => {
      const subject = getSubject(item.kp.subjectId);
      const title = `${subject.name} · 错题复盘「${item.kp.name}」`;
      if (!existing.has(title)) {
        state.tasks.push({
          id: uid("task"),
          date: today,
          subjectId: subject.id,
          title,
          duration: 20,
          type: "custom",
          completed: false,
        });
        added += 1;
      }
    });

    if (weak.length) {
      const topSubjectId = weak[0].kp.subjectId;
      const subject = getSubject(topSubjectId);
      const trainTitle = `${subject.name} · 薄弱专项限时训练`;
      if (!existing.has(trainTitle)) {
        state.tasks.push({
          id: uid("task"),
          date: today,
          subjectId: topSubjectId,
          title: trainTitle,
          duration: 40,
          type: "custom",
          completed: false,
        });
        added += 1;
      }
    }

    if (!added) {
      const defaults = [
        { subjectId: "math", title: "数学：基础题限时训练", duration: 40 },
        { subjectId: "english", title: "英语：阅读 2 篇 + 词汇复习", duration: 35 },
        { subjectId: "chinese", title: "语文：古诗文默写 10 句", duration: 20 },
      ];
      defaults.forEach((d) => {
        if (!existing.has(d.title)) {
          state.tasks.push({
            id: uid("task"),
            date: today,
            subjectId: d.subjectId,
            title: d.title,
            duration: d.duration,
            type: "custom",
            completed: false,
          });
          added += 1;
        }
      });
    }

    persist();
    renderPlan();
    renderDashboard();
    toast(added ? `已生成 ${added} 项今日学习任务` : "今日计划已经很完整啦");
  }

  function openTaskModal() {
    $("#taskForm").reset();
    $("#taskSubject").value = state.subjects[0]?.id || "";
    $("#taskDuration").value = 30;
    $("#taskModal").classList.remove("hidden");
  }

  function saveTask(e) {
    e.preventDefault();
    state.tasks.push({
      id: uid("task"),
      date: todayStr(),
      subjectId: $("#taskSubject").value,
      title: $("#taskTitle").value.trim(),
      duration: Number($("#taskDuration").value || 30),
      type: "custom",
      completed: false,
    });
    persist();
    $("#taskModal").classList.add("hidden");
    renderPlan();
    renderDashboard();
    toast("任务已添加");
  }

  function toggleTask(id) {
    const task = state.tasks.find((t) => t.id === id);
    if (!task) return;
    task.completed = !task.completed;
    persist();
    renderPlan();
    renderDashboard();
  }

  function deleteTask(id) {
    state.tasks = state.tasks.filter((t) => t.id !== id);
    persist();
    renderPlan();
    renderDashboard();
    toast("任务已删除");
  }

  function closeModal(id) {
    $(`#${id}`).classList.add("hidden");
  }

  function bindEvents() {
    $$(".nav-item").forEach((btn) => {
      btn.addEventListener("click", () => showView(btn.dataset.view));
    });

    $$("[data-goto]").forEach((btn) => {
      btn.addEventListener("click", () => showView(btn.dataset.goto));
    });

    $("#quickAddBtn").addEventListener("click", () => openQuestionModal());
    $("#startReviewBtn").addEventListener("click", () => showView("review"));
    $("#addQuestionBtn").addEventListener("click", () => openQuestionModal());
    $("#addTaskBtn").addEventListener("click", openTaskModal);
    $("#autoPlanBtn").addEventListener("click", generateAutoPlan);
    $("#reviewStartBtn").addEventListener("click", () => showView("review"));
    $("#addKnowledgeBtn").addEventListener("click", () => openKnowledgeModal());
    $("#generateSummaryBtn").addEventListener("click", () => {
      $("#summaryText").textContent = buildSummaryText();
      $("#summaryCard").classList.remove("hidden");
    });
    $("#closeSummaryBtn").addEventListener("click", () => $("#summaryCard").classList.add("hidden"));
    $("#copySummaryBtn").addEventListener("click", async () => {
      const text = $("#summaryText").textContent;
      try {
        await navigator.clipboard.writeText(text);
        toast("总结已复制");
      } catch (err) {
        const ta = document.createElement("textarea");
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
        toast("总结已复制");
      }
    });

    $("#questionSubject").addEventListener("change", () => {
      populateKpSelect($("#questionKps"), $("#questionSubject").value, []);
    });
    $("#questionForm").addEventListener("submit", saveQuestion);
    $("#knowledgeForm").addEventListener("submit", saveKnowledge);
    $("#taskForm").addEventListener("submit", saveTask);
    $("#questionImage").addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const preview = $("#imagePreview");
      preview.classList.remove("hidden");
      preview.innerHTML = `<img src="${URL.createObjectURL(file)}" alt="错题图片预览">`;
    });

    $("#showAnswerBtn").addEventListener("click", () => {
      $("#reviewAnswerArea").classList.remove("hidden");
      $("#showAnswerBtn").classList.add("hidden");
      $("#gradePanel").classList.remove("hidden");
    });

    $$(".grade-btn").forEach((btn) => {
      btn.addEventListener("click", () => gradeCurrentQuestion(btn.dataset.score));
    });

    $("#filterSubject").addEventListener("change", renderQuestions);
    $("#filterMastery").addEventListener("change", renderQuestions);
    $("#searchInput").addEventListener("input", renderQuestions);

    $("#subjectTabs").addEventListener("click", (e) => {
      const tab = e.target.closest(".subject-tab");
      if (!tab) return;
      currentKnowledgeSubject = tab.dataset.subject;
      renderKnowledge();
    });

    $("#resetBtn").addEventListener("click", () => {
      if (!window.confirm("确定恢复示例数据吗？你当前录入的内容会被覆盖。")) return;
      state = window.TXK_SEED();
      persist();
      renderAll();
      toast("已恢复示例数据");
    });

    $("#logoutBtn").addEventListener("click", async () => {
      try {
        await apiFetch("/api/logout", { method: "POST" });
      } catch (err) {
        // 即使请求失败也跳转到登录页。
      }
      window.location.href = "/login";
    });

    document.addEventListener("click", (e) => {
      const closeBtn = e.target.closest("[data-close-modal]");
      if (closeBtn) closeModal(closeBtn.dataset.closeModal);
      const backdrop = e.target.closest(".modal-backdrop");
      if (backdrop && e.target === backdrop) backdrop.classList.add("hidden");

      const action = e.target.closest("[data-action]");
      if (!action) return;
      const actionName = action.dataset.action;
      const id = action.dataset.id;
      if (actionName === "edit-question") openQuestionModal(id);
      if (actionName === "delete-question") deleteQuestion(id);
      if (actionName === "review-question") {
        showView("review");
        const q = state.questions.find((item) => item.id === id);
        if (q) {
          $("#reviewCard").classList.remove("hidden");
          renderReviewQuestion(q, 1, 1);
        }
      }
      if (actionName === "edit-knowledge") openKnowledgeModal(id);
      if (actionName === "delete-knowledge") deleteKnowledge(id);
      if (actionName === "toggle") toggleTask(id);
      if (actionName === "delete-task") deleteTask(id);
      if (actionName === "review") showView("review");
    });
  }

  function renderAll() {
    populateSubjectSelects();
    renderCurrentUser();
    renderCountdown();
    renderDashboard();
    renderPlan();
    renderReview();
    renderQuestions();
    renderKnowledge();
    renderStats();
    drawForgettingChart();
  }

  function renderCurrentUser() {
    if (currentUser) {
      $("#currentUserName").textContent = currentUser.username || "已登录";
    }
  }

  async function init() {
    try {
      await ensureAuthenticated();
      state = await loadInitialState();
    } catch (err) {
      console.warn("应用初始化失败", err);
      return;
    }
    populateSubjectSelects();
    bindEvents();
    renderAll();
    showView("dashboard");
  }

  window.addEventListener("beforeunload", () => {
    if (state) {
      fetch(`${API_BASE}/api/state`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: state }),
        keepalive: true,
      });
    }
  });

  init();
})();
