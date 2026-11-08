/* 币圈新手入门完全指南 · 交互逻辑（无依赖） */
(function () {
  "use strict";

  const DATA = window.SITE_DATA;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const mqMobile = window.matchMedia("(max-width: 900px)");

  document.documentElement.classList.add("js");

  /* ── 本地存储（失败时静默降级） ── */
  const store = {
    get(key, fallback) {
      try {
        const raw = localStorage.getItem("cg:" + key);
        return raw ? JSON.parse(raw) : fallback;
      } catch (e) {
        return fallback;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem("cg:" + key, JSON.stringify(value));
      } catch (e) {
        /* 隐私模式等情况下忽略 */
      }
    }
  };

  /* ── 提示 & 复制 ── */
  const toastEl = $("#toast");
  let toastTimer = 0;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (toastEl.hidden = true), 2200);
  }

  function legacyCopy(text) {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.cssText = "position:fixed;top:-1000px;opacity:0";
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, text.length);
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch (e) {
      ok = false;
    }
    ta.remove();
    return ok;
  }

  function copyText(text, okMsg) {
    const done = () => toast(okMsg || `已复制：${text}`);
    const fail = () => {
      if (legacyCopy(text)) done();
      else toast(`复制失败，请长按手动复制：${text}`);
    };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done, fail);
    } else {
      fail();
    }
  }

  /* ── 章节 ── */
  const sections = $$(".chapter");
  const chapters = sections.map((el, i) => ({
    id: el.id,
    el,
    index: i,
    short: el.dataset.short,
    stage: el.dataset.stage,
    minutes: el.dataset.minutes,
    no: i === 0 ? "0" : el.id === "codes" ? "🎁" : String(i)
  }));
  // 课号与时长由脚本统一生成，正文里不写死“第 N 课”
  chapters.forEach((c) => {
    const k = c.el.querySelector(".ch-head .kicker");
    if (k && !k.textContent.trim()) k.textContent = `第 ${c.no} 课 · 约 ${c.minutes} 分钟`;
  });
  const ALIASES = { stocks: "us" };
  const byId = Object.fromEntries(chapters.map((c) => [c.id, c]));
  let current = null;
  const HOME_TITLE = document.title;
  let readSet = new Set(store.get("read", []));

  $("#totalCount").textContent = chapters.length;

  function renderToc() {
    let html = "";
    let lastStage = "";
    chapters.forEach((c) => {
      if (c.stage !== lastStage) {
        html += `<p class="toc-stage${c.stage.startsWith("★") ? " star" : ""}">${esc(c.stage)}</p>`;
        lastStage = c.stage;
      }
      html += `<a class="toc-link" href="#${c.id}" data-toc="${c.id}"><span class="no">${c.no}</span><span>${esc(c.short)}</span><span class="done" aria-label="已读">✓</span></a>`;
    });
    $("#toc").innerHTML = html;
  }

  function renderRoadmap() {
    const stages = [];
    chapters.slice(1).forEach((c) => {
      let s = stages.find((x) => x.name === c.stage);
      if (!s) stages.push((s = { name: c.stage, items: [] }));
      s.items.push(c);
    });
    $("#roadmap").innerHTML = stages
      .map(
        (s) => `<div class="stage${s.name.startsWith("★") ? " star" : ""}"><p class="stage-title">${esc(s.name)}</p><div class="stage-items">${s.items
          .map((c) => `<a href="#${c.id}" data-road="${c.id}"><span>${c.id === "codes" ? "" : `第 ${c.no} 课 · `}${esc(c.short)}</span><small>${c.minutes} 分钟</small></a>`)
          .join("")}</div></div>`
      )
      .join("");
  }

  function refreshReadUi() {
    $$("[data-toc]").forEach((a) => a.classList.toggle("is-done", readSet.has(a.dataset.toc)));
    $$("[data-road]").forEach((a) => a.classList.toggle("is-done", readSet.has(a.dataset.road)));
    const n = chapters.filter((c) => readSet.has(c.id)).length;
    $("#doneCount").textContent = n;
    $("#doneBar").style.width = `${(n / chapters.length) * 100}%`;
  }

  function markRead(id) {
    if (readSet.has(id)) return;
    readSet.add(id);
    store.set("read", Array.from(readSet));
    refreshReadUi();
  }

  function renderPager(c) {
    const prev = chapters[c.index - 1];
    const next = chapters[c.index + 1];
    const label = (x) => (x.index === 0 ? "首页" : x.id === "codes" ? "邀请码汇总" : `第 ${x.no} 课`);
    $("#pager").innerHTML =
      (prev ? `<a class="prev" href="#${prev.id}"><small>← 上一课 · ${label(prev)}</small>${esc(prev.short)}</a>` : "") +
      (next ? `<a class="next" href="#${next.id}"><small>下一课 · ${label(next)} →</small>${esc(next.short)}</a>` : `<a class="next" href="#start"><small>全部学完 🎉</small>回到首页</a>`);
    $("#mPrev").disabled = !prev;
    $("#mNext").disabled = false;
    $("#mNext").textContent = next ? "下一课 ›" : "回首页";
    $("#mStep").textContent = `${c.index + 1} / ${chapters.length}`;
  }

  function show(id, anchorEl) {
    const c = byId[id] || chapters[0];
    const changed = current !== c;
    if (changed) {
      if (current) current.el.classList.remove("is-active");
      c.el.classList.add("is-active");
      current = c;
      $$("[data-toc]").forEach((a) => {
        if (a.dataset.toc === c.id) a.setAttribute("aria-current", "page");
        else a.removeAttribute("aria-current");
      });
      renderPager(c);
      document.title = c.index === 0 ? HOME_TITLE : `${c.short} · 币圈新手入门完全指南`;
      if (c.id === "quiz") quiz.init();
      if (c.id === "codes" || c.id === "start") markRead(c.id);
    }
    closeDrawer();
    if (anchorEl && anchorEl !== c.el) {
      requestAnimationFrame(() => anchorEl.scrollIntoView({ block: "start" }));
    } else if (changed) {
      window.scrollTo(0, 0);
    }
    if (changed) {
      $("#main").focus({ preventScroll: true });
      updateProgress();
    }
  }

  function route() {
    const hash = decodeURIComponent(location.hash.slice(1));
    if (!hash) return show("start");
    if (byId[hash]) return show(hash);
    if (ALIASES[hash]) return show(ALIASES[hash]);
    const el = document.getElementById(hash);
    const owner = el && el.closest(".chapter");
    if (owner) return show(owner.id, el);
    show("start");
  }

  function go(delta) {
    const target = chapters[current.index + delta];
    location.hash = target ? target.id : "start";
  }

  /* ── 阅读进度 & 已读判定 ── */
  const bar = $("#readBar");
  let ticking = false;
  function updateProgress() {
    ticking = false;
    const doc = document.documentElement;
    const max = doc.scrollHeight - window.innerHeight;
    const ratio = max > 0 ? Math.min(1, window.scrollY / max) : 1;
    bar.style.width = `${ratio * 100}%`;
    if (current && ratio > 0.92) markRead(current.id);
  }
  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(updateProgress);
      }
    },
    { passive: true }
  );

  /* ── 手机抽屉目录 ── */
  const sidebar = $("#sidebar");
  const scrim = $("#scrim");
  const menuBtn = $("#menuBtn");
  function openDrawer() {
    if (!mqMobile.matches) return;
    sidebar.classList.add("is-open");
    scrim.hidden = false;
    menuBtn.setAttribute("aria-expanded", "true");
    document.body.classList.add("no-scroll");
    const active = $('.toc-link[aria-current="page"]', sidebar);
    if (active) sidebar.scrollTop = active.offsetTop - sidebar.clientHeight / 2;
  }
  function closeDrawer() {
    if (!sidebar.classList.contains("is-open")) return;
    sidebar.classList.remove("is-open");
    scrim.hidden = true;
    menuBtn.setAttribute("aria-expanded", "false");
    document.body.classList.remove("no-scroll");
  }
  menuBtn.addEventListener("click", () => (sidebar.classList.contains("is-open") ? closeDrawer() : openDrawer()));
  scrim.addEventListener("click", closeDrawer);
  $("#mToc").addEventListener("click", openDrawer);
  $("#mPrev").addEventListener("click", () => go(-1));
  $("#mNext").addEventListener("click", () => go(1));
  mqMobile.addEventListener("change", () => closeDrawer());

  /* ── 邀请码 ── */
  const refs = DATA.referrals;
  const DOMAIN_BADGE = {
    official: '<span class="badge ok">✅ 官方主域名</span>',
    related: '<span class="badge warn">⚠️ 未能确认官方</span>',
    unverified: '<span class="badge warn">⚠️ 未能确认官方</span>',
    none: '<span class="badge info">ℹ️ 无链接</span>'
  };
  function refCard(r) {
    const verb = r.type === "U 卡" ? "申请" : "注册";
    let actions = "";
    if (r.officialLink) {
      actions += `<a class="btn primary" href="${esc(r.officialLink)}" target="_blank" rel="noopener">官方主站${verb} ↗</a>`;
      actions += `<a class="btn" href="${esc(r.link)}" target="_blank" rel="noopener">站长链接 ↗</a>`;
    } else if (r.link) {
      actions += `<a class="btn primary" href="${esc(r.link)}" target="_blank" rel="noopener">打开${verb}页 ↗</a>`;
    } else {
      actions += `<button class="btn" type="button" data-copy="${esc(r.code)}">无直达链接 · 复制后到 App 填写</button>`;
    }
    return `<article class="ref-card" data-ref-id="${r.id}">
      <div class="ref-top">
        <div><span class="tag">${esc(r.type)}</span><h3>${esc(r.name)}</h3><p>${esc(r.scene)}</p></div>
        <span class="ref-reward">${esc(r.reward)}</span>
      </div>
      <div class="ref-code"><span class="label">邀请码</span><span class="value">${esc(r.code)}</span><button class="btn primary" type="button" data-copy="${esc(r.code)}">复制</button></div>
      <div class="ref-actions">${actions}</div>
      <p class="ref-domain">${DOMAIN_BADGE[r.domainStatus] || ""}${esc(r.domainNote || "")} <a href="#links">核对说明</a></p>
      <p class="ref-risk">⚠️ ${esc(r.risk)}</p>
    </article>`;
  }
  $$("[data-ref]").forEach((slot) => {
    const ids = slot.dataset.ref === "all" ? refs.map((r) => r.id) : slot.dataset.ref.split(",");
    slot.className = "ref-grid";
    slot.innerHTML = ids
      .map((id) => refs.find((r) => r.id === id.trim()))
      .filter(Boolean)
      .map(refCard)
      .join("");
  });
  $$("[data-ref-quick]").forEach((slot) => {
    slot.innerHTML = refs
      .map(
        (r) => `<div class="quick-row" data-ref-id="${r.id}">
          <div class="name">${esc(r.name)}<small>${esc(r.reward)} · ${r.domainStatus === "official" ? "官方主域名链接" : r.officialLink ? "打开的是官方主站，邀请码相同" : "无链接，到 App 填写"}</small></div>
          <div class="value">${esc(r.code)}</div>
          <div class="actions">
            <button class="btn primary" type="button" data-copy="${esc(r.code)}">复制</button>
            ${r.officialLink || r.link ? `<a class="btn" href="${esc(r.officialLink || r.link)}" target="_blank" rel="noopener">打开 ↗</a>` : `<a class="btn" href="#codes" title="Bitget Card 暂无直达链接">说明</a>`}
          </div>
        </div>`
      )
      .join("");
  });

  /* ── 清单（记住勾选） ── */
  $$("[data-checklist]").forEach((list) => {
    const key = "check:" + list.dataset.checklist;
    const saved = store.get(key, []);
    const boxes = $$("input[type=checkbox]", list);
    const meta = document.createElement("p");
    meta.className = "checklist-meta";
    list.after(meta);
    const sync = () => {
      const done = boxes.filter((b) => b.checked).length;
      boxes.forEach((b) => b.closest("label").classList.toggle("is-checked", b.checked));
      meta.textContent = done === boxes.length ? `✅ 全部完成（${done}/${boxes.length}）` : `已完成 ${done}/${boxes.length}`;
    };
    boxes.forEach((b, i) => {
      b.checked = !!saved[i];
      b.addEventListener("change", () => {
        store.set(key, boxes.map((x) => x.checked));
        sync();
      });
    });
    sync();
  });

  /* ── 术语表 ── */
  (function glossary() {
    const list = $("#glossaryList");
    if (!list) return;
    const input = $("#glossarySearch");
    const filters = $("#glossaryFilters");
    const empty = $("#glossaryEmpty");
    const cats = ["全部", ...new Set(DATA.glossary.map((g) => g[1]))];
    let cat = "全部";
    filters.innerHTML = cats.map((c) => `<button type="button" aria-pressed="${c === cat}" data-cat="${esc(c)}">${esc(c)}</button>`).join("");
    list.innerHTML = DATA.glossary.map((g) => `<div data-text="${esc((g[0] + g[2]).toLowerCase())}" data-cat="${esc(g[1])}"><dt>${esc(g[0])}<small>${esc(g[1])}</small></dt><dd>${esc(g[2])}</dd></div>`).join("");
    const items = $$("div", list);
    const apply = () => {
      const q = input.value.trim().toLowerCase().replace(/\s+/g, "");
      let shown = 0;
      items.forEach((it) => {
        const hit = (cat === "全部" || it.dataset.cat === cat) && (!q || it.dataset.text.replace(/\s+/g, "").includes(q));
        it.hidden = !hit;
        if (hit) shown++;
      });
      empty.hidden = shown > 0;
    };
    input.addEventListener("input", apply);
    filters.addEventListener("click", (e) => {
      const b = e.target.closest("[data-cat]");
      if (!b) return;
      cat = b.dataset.cat;
      $$("button", filters).forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      apply();
    });
  })();

  /* ── 测验 ── */
  const quiz = (function () {
    const Q = DATA.quiz;
    let i = 0;
    let score = 0;
    let answered = false;
    let started = false;
    const els = {
      step: $("#quizStep"),
      bar: $("#quizBar"),
      q: $("#quizQ"),
      type: $("#quizType"),
      opts: $("#quizOptions"),
      fb: $("#quizFeedback"),
      check: $("#quizCheck"),
      next: $("#quizNext"),
      app: $("#quizApp"),
      result: $("#quizResult")
    };
    function render() {
      const item = Q[i];
      answered = false;
      els.step.textContent = `第 ${i + 1} / ${Q.length} 题`;
      els.bar.style.width = `${(i / Q.length) * 100}%`;
      els.q.textContent = item.q;
      els.type.textContent = item.type === "multi" ? "多选题：选出所有正确答案" : "单选题";
      const t = item.type === "multi" ? "checkbox" : "radio";
      els.opts.innerHTML = item.options.map((o, k) => `<label><input type="${t}" name="quizOpt" value="${k}" /><span>${esc(o)}</span></label>`).join("");
      els.fb.textContent = "";
      els.fb.className = "quiz-feedback";
      els.check.hidden = false;
      els.next.hidden = true;
    }
    function check() {
      if (answered) return;
      const picked = $$("input:checked", els.opts).map((x) => Number(x.value));
      if (!picked.length) {
        toast("先选一个答案");
        return;
      }
      const item = Q[i];
      const ok = picked.length === item.answer.length && picked.every((v) => item.answer.includes(v));
      answered = true;
      if (ok) score++;
      $$("label", els.opts).forEach((lab, k) => {
        if (item.answer.includes(k)) lab.classList.add("right");
        else if (picked.includes(k)) lab.classList.add("wrong");
        lab.querySelector("input").disabled = true;
      });
      const ch = byId[item.chapter];
      els.fb.className = "quiz-feedback " + (ok ? "ok" : "no");
      els.fb.innerHTML = `${ok ? "✅ 答对了！" : "❌ 还差一点。"}${esc(item.explain)} ${ch ? `<a href="#${ch.id}">回看：${esc(ch.short)}</a>` : ""}`;
      els.check.hidden = true;
      els.next.hidden = false;
      els.next.textContent = i === Q.length - 1 ? "查看成绩 →" : "下一题 →";
      els.next.focus();
    }
    function next() {
      if (i < Q.length - 1) {
        i++;
        render();
        return;
      }
      els.bar.style.width = "100%";
      const pass = score >= Math.ceil(Q.length * 0.8);
      els.result.hidden = false;
      els.result.innerHTML = `<h2>你的成绩：${score} / ${Q.length}</h2>
        <p>${pass ? "很棒！你已经掌握了新手最关键的安全知识。动手时依然记住：小额、慢慢来、不懂不碰。" : "建议把答错的题对应的课程再看一遍，尤其是防骗和转账两课，再来挑战。"}</p>
        <div class="hero-actions"><button class="btn" type="button" data-quiz-restart>重新测验</button><a class="btn primary" href="#codes">🎁 查看邀请码</a></div>`;
      store.set("quizBest", Math.max(score, store.get("quizBest", 0)));
      els.result.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    function restart() {
      i = 0;
      score = 0;
      els.result.hidden = true;
      render();
      els.app.scrollIntoView({ block: "start" });
    }
    els.check.addEventListener("click", check);
    els.next.addEventListener("click", next);
    document.addEventListener("click", (e) => {
      if (e.target.closest("[data-quiz-restart]")) restart();
    });
    return {
      init() {
        if (!started) {
          started = true;
          render();
        }
      }
    };
  })();

  /* ── 分享 ── */
  const shareUrl = (function () {
    const local = /^(localhost|127\.0\.0\.1|\[::1\]|0\.0\.0\.0)$/.test(location.hostname) || location.protocol === "file:" || /^(10|192\.168|172\.(1[6-9]|2\d|3[01]))\./.test(location.hostname);
    return local ? DATA.canonicalUrl : location.origin + location.pathname;
  })();
  const shareTitle = "加密货币也能交易美股？了解相关平台与操作方式";
  const targets = [
    { label: "💬 微信", action: "wechat" },
    { label: "✈️ Telegram", href: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}` },
    { label: "𝕏 Twitter", href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(shareUrl)}` },
    { label: "📱 WhatsApp", href: `https://wa.me/?text=${encodeURIComponent(shareTitle + " " + shareUrl)}` },
    { label: "📧 邮件", href: `mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(shareTitle + "\n\n" + shareUrl)}` },
    navigator.share ? { label: "📤 系统分享", action: "native" } : { label: "📋 复制链接", action: "copy" }
  ];
  $$("[data-share-url]").forEach((inp) => (inp.value = shareUrl));
  $$("[data-share-targets]").forEach((box) => {
    box.innerHTML = targets
      .map((t) => (t.href ? `<a class="btn" href="${esc(t.href)}" target="_blank" rel="noopener">${t.label}</a>` : `<button class="btn" type="button" data-share-action="${t.action}">${t.label}</button>`))
      .join("");
  });
  let qrDone = false;
  function drawQr() {
    if (qrDone || !window.QR) return;
    qrDone = true;
    try {
      const svg = window.QR.toSvg(shareUrl, { margin: 3 });
      $$("[data-qr]").forEach((el) => (el.innerHTML = svg));
    } catch (e) {
      $$("[data-qr]").forEach((el) => (el.textContent = "二维码生成失败，请复制链接"));
    }
  }

  const modal = $("#shareModal");
  let lastFocus = null;
  function openModal() {
    drawQr();
    lastFocus = document.activeElement;
    modal.hidden = false;
    document.body.classList.add("no-scroll");
    $("[data-close-share]", modal).focus();
  }
  function closeModal() {
    if (modal.hidden) return;
    modal.hidden = true;
    document.body.classList.remove("no-scroll");
    if (lastFocus) lastFocus.focus();
  }
  modal.addEventListener("click", (e) => {
    if (e.target === modal || e.target.closest("[data-close-share]")) closeModal();
  });

  /* ── 全局点击委托 ── */
  document.addEventListener("click", (e) => {
    const copyBtn = e.target.closest("[data-copy]");
    if (copyBtn) {
      copyText(copyBtn.dataset.copy, `已复制邀请码：${copyBtn.dataset.copy}`);
      return;
    }
    if (e.target.closest("[data-share-open]")) {
      openModal();
      return;
    }
    if (e.target.closest("[data-copy-share]")) {
      copyText(shareUrl, "链接已复制，去粘贴给朋友吧");
      return;
    }
    const act = e.target.closest("[data-share-action]");
    if (act) {
      const a = act.dataset.shareAction;
      if (a === "native") {
        navigator.share({ title: shareTitle, url: shareUrl }).catch(() => {});
      } else if (a === "wechat") {
        copyText(shareUrl, "链接已复制，打开微信粘贴发送即可");
      } else {
        copyText(shareUrl, "链接已复制");
      }
      return;
    }
    const link = e.target.closest('a[href^="#"]');
    if (link && link.getAttribute("href") === location.hash) {
      // 点击当前所在的链接，也要关闭抽屉/滚到对应位置
      e.preventDefault();
      route();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeModal();
      closeDrawer();
      return;
    }
    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    if (!modal.hidden || e.target.closest("input, textarea, select, label, [contenteditable]")) return;
    if (e.key === "ArrowRight" && current.index < chapters.length - 1) go(1);
    if (e.key === "ArrowLeft" && current.index > 0) go(-1);
  });

  /* ── 表格横向滚动提示 ── */
  function markScrollableTables() {
    $$(".table-wrap").forEach((w) => w.classList.toggle("scrollable", w.scrollWidth > w.clientWidth + 4));
  }
  let rT = 0;
  window.addEventListener("resize", () => {
    clearTimeout(rT);
    rT = setTimeout(markScrollableTables, 150);
  });

  /* ── 外观：跟随系统 / 浅色 / 深色 ── */
  function applyTheme(mode) {
    if (mode === "light" || mode === "dark") document.documentElement.setAttribute("data-theme", mode);
    else document.documentElement.removeAttribute("data-theme");
    $$("[data-theme-set]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.themeSet === mode)));
  }
  applyTheme(store.get("theme", "auto"));
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-theme-set]");
    if (!b) return;
    store.set("theme", b.dataset.themeSet);
    applyTheme(b.dataset.themeSet);
  });

  /* ── 启动 ── */
  renderToc();
  renderRoadmap();
  refreshReadUi();
  window.addEventListener("hashchange", route);
  route();
  markScrollableTables();
  // 当前课切换后表格才可见，切换时再算一次
  window.addEventListener("hashchange", () => requestAnimationFrame(markScrollableTables));
  if (current && current.id === "codes") drawQr();
  window.addEventListener("hashchange", () => {
    if (current && current.id === "codes") drawQr();
  });
})();
