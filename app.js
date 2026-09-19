// 交互逻辑：首页 → 答题 → 结果页
// 零依赖、零后端：题库、计分、判定全在本地，不请求任何接口。

const app = document.getElementById("app");

const LIKERT = [
  "完全不同意",
  "不同意",
  "有点不同意",
  "不确定",
  "有点同意",
  "同意",
  "完全同意",
];

// 点选即前进，留 160ms 让选中态被看见再翻页
const ADVANCE_MS = 160;

const state = {
  view: "home",
  order: [],
  current: 0,
  answers: {},
  outcome: null,
  advancing: false,
};

// Fisher-Yates 打乱（每次进测试顺序不同，避免靠位置猜维度）
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = a[i];
    a[i] = a[j];
    a[j] = t;
  }
  return a;
}

function pct(ratio) {
  return (ratio * 100).toFixed(1);
}

function startTest() {
  state.order = shuffle(QUESTIONS.map((_, i) => i));
  state.current = 0;
  state.answers = {};
  state.outcome = null;
  state.advancing = false;
  state.view = "test";
  render();
  scrollTo({ top: 0 });
}

function move(delta) {
  state.current += delta;
  state.advancing = false;
  render();
}

// 点选即前进。advancing 挡住等待翻页期间的重复点击，
// 否则连点两下会一次跳两题、漏掉中间那道。
function choose(qid, value) {
  if (state.advancing) return;
  state.advancing = true;
  state.answers[qid] = value;
  document.querySelectorAll(".option-btn").forEach((el) => {
    el.classList.toggle("is-selected", Number(el.dataset.value) === value);
  });
  setTimeout(advance, ADVANCE_MS);
}

function advance() {
  state.advancing = false;
  if (state.current === QUESTIONS.length - 1) submit();
  else move(1);
}

function submit() {
  const quality = assess(state.answers);
  // 没答完就不给分：半份答卷的均分没有意义。置 null 而不是留一维有值——
  // 渲染层只看一个维度就知道该不该出维度条。
  const dims = quality.verdict === "unfinished" ? null : score(state.answers);
  const blocked =
    quality.verdict === "unfinished" || quality.verdict === "mechanical";
  const quadrant = dims
    ? classify(dims.anxiety, dims.avoidance)
    : { type: null };
  const type = blocked ? null : quadrant.type;
  state.outcome = {
    anxiety: dims ? dims.anxiety : null,
    avoidance: dims ? dims.avoidance : null,
    quality,
    type,
    position: dims && !blocked
      ? positionReadback(dims.anxiety, dims.avoidance, type)
      : null,
    readback: dims && !blocked ? readback(state.answers, type) : [],
  };
  state.view = "result";
  render();
  scrollTo({ top: 0 });
}

// ===== 渲染 =====

function render() {
  if (state.view === "home") return renderHome();
  if (state.view === "test") return renderTest();
  return renderResult();
}

function renderHome() {
  app.innerHTML = `
    <main class="app-shell">
      <section class="card hero-card">
        <span class="badge">36 题</span>
        <h1 class="hero-title">依恋类型测试</h1>
        <p class="hero-subtitle">看你在亲近的人面前，习惯靠拢，还是习惯退开。</p>
        <ul class="hero-points">
          <li>回想身边亲近的几个人——好朋友、喜欢的人，不必限定在某一个</li>
          <li>凭第一感觉作答，约 5 分钟</li>
          <li>答完给你两个维度分和一种类型，不上传、不存档</li>
        </ul>
        <button class="btn btn-primary btn-large" id="start">开始测试</button>
        <p class="footnote">本测试仅用于自我了解，不能替代专业心理评估。</p>
      </section>
    </main>`;
  document.getElementById("start").addEventListener("click", startTest);
}

function renderTest() {
  const q = QUESTIONS[state.order[state.current]];
  app.innerHTML = quizMarkup({
    q,
    cur: state.current + 1,
    total: QUESTIONS.length,
    chosen: state.answers[q.id],
  });
  document.getElementById("prev").addEventListener("click", () => move(-1));
  document.querySelectorAll(".option-btn").forEach((el) => {
    el.addEventListener("click", () => choose(q.id, Number(el.dataset.value)));
  });
}

function quizMarkup({ q, cur, total, chosen }) {
  const answered = countAnswered(state.answers);
  return `
    <main class="app-shell">
      <section class="card quiz-head">
        <div class="progress-top">
          <span>第 ${cur} / ${total} 题</span>
          <span>已完成 ${answered}/${total}</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill" style="width:${pct(answered / total)}%"></div>
        </div>
      </section>
      <section class="card question-card">
        <h2 class="question-title">${q.zh}</h2>
        <div class="option-list">
          ${LIKERT.map((s, i) => optionMarkup(i + 1, s, chosen)).join("")}
        </div>
      </section>
      <div class="quiz-actions">
        <button class="btn btn-secondary" id="prev" ${cur === 1 ? "disabled" : ""}>上一题</button>
      </div>
    </main>`;
}

function optionMarkup(value, label, chosen) {
  const sel = chosen === value ? " is-selected" : "";
  return `<button type="button" class="option-btn${sel}" data-value="${value}">${label}</button>`;
}

function renderResult() {
  const o = state.outcome;
  app.innerHTML = resultMarkup(o);
  document.getElementById("again").addEventListener("click", startTest);
}

// 主题色挂在 .app-shell 上，CSS 的 .t-<type> 会级联给所有子元素
function resultMarkup(o) {
  return `
    <main class="app-shell${o.type ? ` t-${o.type}` : ""}">
      ${heroBlock(o)}
      ${qualityBlock(o)}
      ${dimsBlock(o)}
      ${readbackCard(o)}
      ${typeBlock(o)}
      ${closingBlock()}
      <div class="result-actions">
        <button class="btn btn-secondary" id="again">重新测试</button>
      </div>
    </main>`;
}

function heroBlock(o) {
  const res = o.type ? RESULTS[o.type] : null;
  const place = o.anxiety !== null && o.quality.verdict !== "mechanical";
  const chart = o.anxiety === null
    ? ""
    : quadrantChart(o.anxiety, o.avoidance, o.type, place);
  return `
    <section class="card result-hero">
      <span class="badge result-kicker">你的依恋类型</span>
      ${res ? `<h1 class="result-type">${res.name}</h1>` : `<h1 class="result-type">${heroFallbackName(o)}</h1>`}
      ${res ? `<p class="result-subtitle">${res.tagline}</p>` : ""}
      ${chart}
      ${res ? `<p class="result-description">${res.what}</p>` : heroFallbackNote(o)}
    </section>`;
}

function heroFallbackName(o) {
  if (o.quality.verdict === "mechanical") return "无法判定";
  if (o.quality.verdict === "unfinished") return "答题未完成";
  return MIDDLE_RESULT.name;
}

function heroFallbackNote(o) {
  if (o.quality.verdict === "mechanical") return "";
  if (o.quality.verdict === "unfinished") return "";
  return `<p class="result-description">${MIDDLE_RESULT.what}</p>`;
}

// ===== 象限图 =====
// 视窗 280×256：左 48 留纵轴标签，底 44 留横轴标签。
// 横轴 = 回避（左低右高），纵轴 = 焦虑（下低上高），Y 轴在 SVG 里要翻转。
const Q = { L: 48, T: 24, W: 216, H: 188 };

const Q_QUADS = [
  { key: "anxious", name: "焦虑型", x: 48, y: 24, w: 108, h: 94, lx: 102, ly: 71 },
  { key: "fearful", name: "恐惧型", x: 156, y: 24, w: 108, h: 94, lx: 210, ly: 71 },
  { key: "secure", name: "安全型", x: 48, y: 118, w: 108, h: 94, lx: 102, ly: 165 },
  { key: "avoidant", name: "回避型", x: 156, y: 118, w: 108, h: 94, lx: 210, ly: 165 },
];

function sx(v) {
  return Q.L + ((v - 1) / 6) * Q.W;
}

function sy(v) {
  return Q.T + (1 - (v - 1) / 6) * Q.H;
}

function quadrantChart(anxiety, avoidance, type, place) {
  const x = sx(avoidance);
  const y = sy(anxiety);
  return `
    <svg class="quadrant-svg" viewBox="0 0 280 256" role="img" aria-label="依恋类型象限图：横轴回避，纵轴焦虑">
      ${qQuads()}
      ${qZoneBand()}
      ${qDividers()}
      ${qBorder()}
      ${qAxisLabels()}
      ${place ? qDot(x, y, type) : ""}
    </svg>`;
}

function qQuads() {
  const fills = Q_QUADS
    .map((q) => `<rect class="qf-${q.key}" x="${q.x}" y="${q.y}" width="${q.w}" height="${q.h}" />`)
    .join("");
  const labels = Q_QUADS
    .map((q) => `<text class="ql-${q.key}" x="${q.lx}" y="${q.ly}" text-anchor="middle" dy="0.35em">${q.name}</text>`)
    .join("");
  return `
    <defs>
      <clipPath id="quad-clip"><rect x="48" y="24" width="216" height="188" rx="12" /></clipPath>
    </defs>
    <g clip-path="url(#quad-clip)">${fills}</g>
    ${labels}`;
}

function qZoneBand() {
  const x1 = sx(3.5);
  const x2 = sx(4.5);
  const y1 = sy(4.5);
  const y2 = sy(3.5);
  return `
    <rect class="q-zone-band" x="${x1}" y="${Q.T}" width="${x2 - x1}" height="${Q.H}" />
    <rect class="q-zone-band" x="${Q.L}" y="${y1}" width="${Q.W}" height="${y2 - y1}" />`;
}

function qDividers() {
  const x = sx(4);
  const y = sy(4);
  return `
    <line class="q-divider" x1="${x}" y1="${Q.T}" x2="${x}" y2="${Q.T + Q.H}" />
    <line class="q-divider" x1="${Q.L}" y1="${y}" x2="${Q.L + Q.W}" y2="${y}" />`;
}

function qBorder() {
  return `<rect class="q-border" x="${Q.L}" y="${Q.T}" width="${Q.W}" height="${Q.H}" rx="12" />`;
}

function qDot(x, y, type) {
  const halo = type ? "" : " q-halo-neutral";
  const dot = type ? "" : " q-dot-neutral";
  return `
    <circle class="q-halo${halo}" cx="${x}" cy="${y}" r="10" />
    <circle class="q-dot${dot}" cx="${x}" cy="${y}" r="5.5" />`;
}

function qAxisLabels() {
  return `
    <text class="q-axis-title" transform="rotate(-90 18 118)" x="18" y="118" text-anchor="middle" dy="0.35em">焦虑</text>
    <text class="q-axis-title" x="156" y="250" text-anchor="middle" dy="0.35em">回避</text>
    <text class="q-axis-tick" x="34" y="19" text-anchor="middle" dy="0.35em">高</text>
    <text class="q-axis-tick" x="34" y="228" text-anchor="middle" dy="0.35em">低</text>
    <text class="q-axis-tick" x="48" y="236" text-anchor="middle" dy="0.35em">低</text>
    <text class="q-axis-tick" x="264" y="236" text-anchor="middle" dy="0.35em">高</text>`;
}

function qualityBlock(o) {
  const q = o.quality;
  if (q.verdict === "unfinished") {
    return warnCard(
      "还没答完",
      `你只完成了 ${q.answered} / ${q.total} 题，不足以给出结论。`,
    );
  }
  if (q.verdict === "mechanical") {
    return warnCard(
      "这份结果不作数",
      "所有题目都选了同一个选项，这无法反映你的真实倾向。建议逐题重做一次。",
    );
  }
  if (q.verdict === "shaky") {
    return softCard(
      "这份结果可能不够稳",
      `原因：${q.reasons.join("；")}。下面的类型只作参考——两个维度分比类型标签更能反映你的情况。`,
    );
  }
  return "";
}

function warnCard(title, body) {
  return `<section class="card notice-card is-warn"><h2>${title}</h2><p>${body}</p></section>`;
}

function softCard(title, body) {
  return `<section class="card notice-card"><h2>${title}</h2><p>${body}</p></section>`;
}

function dimsBlock(o) {
  if (o.anxiety === null) return "";
  return `
    <section class="card">
      <h2 class="card-title">两个维度</h2>
      ${dimBar("焦虑", o.anxiety)}
      ${dimBar("回避", o.avoidance)}
      ${o.position ? posBlock(o.position) : ""}
      <p class="card-foot">条长是分数在 1–7 上的位置，不是人群百分位——本测试没有可比的常模，所以不给百分比。</p>
    </section>`;
}

function dimBar(label, value) {
  return `
    <div class="bar-item">
      <div class="bar-head"><span>${label}</span><span class="bar-value">${value.toFixed(1)} / 7</span></div>
      <div class="bar-track">
        <div class="bar-fill" style="width:${pct(value / 7)}%"></div>
      </div>
      <div class="bar-note">${magnitude(value)}</div>
    </div>`;
}

function posBlock(pos) {
  return `
    <div class="pos-read">
      <p>${pos.strength}</p>
      <p>${pos.dom}</p>
      ${pos.caveat ? `<p class="pos-caveat">${pos.caveat}</p>` : ""}
    </div>`;
}

function readbackCard(o) {
  if (o.readback.length === 0) return "";
  return `
    <section class="card">
      <h2 class="card-title">你答得最肯定的几题</h2>
      <ul class="readback-list">
        ${o.readback.map((x) => `<li>「${x.q.zh}」——${LIKERT[x.raw - 1]}</li>`).join("")}
      </ul>
    </section>`;
}

function typeBlock(o) {
  if (!o.type) return "";
  const res = RESULTS[o.type];
  return `
    <section class="card">
      <h2 class="card-title">为什么会这样</h2>
      <p class="prose">${res.why}</p>
    </section>
    <section class="card">
      <h2 class="card-title">落在你的生活里</h2>
      <p class="prose">${res.life}</p>
    </section>`;
}

function closingBlock() {
  return `
    <section class="card">
      <h2 class="card-title">最后</h2>
      <p class="prose">结果反映你此刻的自评倾向，不是固定标签，会随经历变化。本测试仅用于自我了解，不能替代专业心理评估。</p>
    </section>`;
}

render();
