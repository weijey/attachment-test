// 计分 + 一致性检测 + 作答质量评估 + 类型判定
// 量表：7 点 Likert（1=完全不同意 … 7=完全同意）
// 反向题：得分 = 8 - 原始分（共 14 条）
// 维度分：焦虑 18 题均分、回避 18 题均分（范围 1–7）

// ===== 常量 =====

// 反向题转换
function reverseScore(raw) {
  return 8 - raw;
}

// 语义相反的正向题→反向题配对，用于一致性检测
const CONSISTENCY_PAIRS = [
  [168, 191], // 害怕失去 ↔ 不担心离开
  [57, 82], // 担心不想保持关系 ↔ 不担心被抛下
  [199, 131], // 不愿展露内心 ↔ 自在分享想法
  [267, 265], // 不愿走太近 ↔ 亲近自在
  [171, 14], // 不愿敞开心扉 ↔ 什么都说
  [59, 242], // 难依赖 ↔ 依赖自在
];

// 作答质量门槛。前两个是硬门槛（否决结论），后两个是软指标（只调节措辞）。
const MIN_COMPLETENESS = 0.9; // 低于此视为没答完
const SHAKY_CONSISTENCY = 0.7; // 低于此（矛盾对 ≥2）提示摇摆
const SHAKY_DECISIVENESS = 0.25; // 低于此提示回避表态

// ===== 维度分 =====

// 计算焦虑、回避两个维度均分。未作答的题不计入。
// 整个维度一题未答时返回 null —— 均分不存在，NaN 会被渲染成「焦虑 NaN」。
function score(answers) {
  const groups = { anxiety: [], avoidance: [] };
  for (const q of QUESTIONS) {
    const raw = answers[q.id];
    if (raw === undefined) continue;
    groups[q.dim].push(q.reversed ? reverseScore(raw) : raw);
  }
  const avg = (arr) =>
    arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;
  return {
    anxiety: avg(groups.anxiety),
    avoidance: avg(groups.avoidance),
  };
}

// ===== 作答质量 =====

// 已作答题数
function countAnswered(answers) {
  return QUESTIONS.filter((q) => answers[q.id] !== undefined).length;
}

// 矛盾对数量：一对两题同时 ≥5 或同时 ≤3 → 记一次
function countContradictions(answers) {
  let n = 0;
  for (const [posId, revId] of CONSISTENCY_PAIRS) {
    const pos = answers[posId];
    const rev = answers[revId];
    if ((pos >= 5 && rev >= 5) || (pos <= 3 && rev <= 3)) n++;
  }
  return n;
}

// 用户实际点过的不同选项个数。只有 1 种才算机械作答。
// 不能用"最长连跑长度"代替：量表有 14 道反向题，一个心理上极端但认真作答的人
// （焦虑 6 分、回避 2 分）原始分只会有 2 种取值，随机顺序下很容易连跑 10 次以上
// —— 那是这种作答模式的必然产物，不是没读题。
function distinctRawValues(answers) {
  const vals = QUESTIONS.map((q) => answers[q.id]).filter(
    (v) => v !== undefined,
  );
  return new Set(vals).size;
}

// 决断度：极端选项（1/2/6/7）占比。
// 全选 3/4/5 的人没有提供任何区分两个维度的信息。
function decisiveness(answers) {
  const vals = QUESTIONS.map((q) => answers[q.id]).filter(
    (v) => v !== undefined,
  );
  if (vals.length === 0) return 0;
  const decisive = vals.filter((v) => v <= 2 || v >= 6).length;
  return decisive / vals.length;
}

// 分层判定：只有硬门槛能否决结论，软指标只影响措辞
function verdictOf({ answered, distinctValues, consistency, decisiveness }) {
  if (answered < QUESTIONS.length * MIN_COMPLETENESS) return "unfinished";
  if (distinctValues <= 1) return "mechanical";
  if (consistency < SHAKY_CONSISTENCY) return "shaky";
  if (decisiveness < SHAKY_DECISIVENESS) return "shaky";
  return "ok";
}

// 具体亮的是哪几项，用于告诉用户原因而不是笼统说"不可靠"
function shakyReasons(consistency, decisiveness) {
  const reasons = [];
  if (consistency < SHAKY_CONSISTENCY) reasons.push("有前后不一致的回答");
  if (decisiveness < SHAKY_DECISIVENESS) reasons.push("大量选了中间选项");
  return reasons;
}

// 汇总作答质量。verdict: ok | shaky | unfinished | mechanical
function assess(answers) {
  const answered = countAnswered(answers);
  const contradictions = countContradictions(answers);
  const consistency = 1 - contradictions / CONSISTENCY_PAIRS.length;
  const decisive = decisiveness(answers);
  const distinctValues = distinctRawValues(answers);
  return {
    answered,
    total: QUESTIONS.length,
    completeness: answered / QUESTIONS.length,
    contradictions,
    consistency,
    decisiveness: decisive,
    distinctValues,
    verdict: verdictOf({
      answered,
      distinctValues,
      consistency,
      decisiveness: decisive,
    }),
    reasons: shakyReasons(consistency, decisive),
  };
}

// ===== 类型判定 =====

// 以 4 为理论中点，±0.5 作为缓冲区（3.5 / 4.5）
function classify(anxiety, avoidance) {
  const aHigh = anxiety >= 4.5;
  const aLow = anxiety <= 3.5;
  const bHigh = avoidance >= 4.5;
  const bLow = avoidance <= 3.5;
  const aClear = aHigh || aLow;
  const bClear = bHigh || bLow;

  if (!aClear && !bClear) return { type: null, clear: false };

  let type;
  if (aHigh && bHigh) type = "fearful";
  else if (aHigh) type = "anxious";
  else if (bHigh) type = "avoidant";
  else type = "secure";

  return { type, clear: aClear && bClear };
}

// 维度分数 → 幅度描述。边界与 classify 的 3.5/4.5 严格对齐：
// |分−4| 的 0.5 = 3.5/4.5 那条线，1.0 = 3.0/5.0，2.0 = 2.0/6.0。
function magnitude(value) {
  const d = value - 4;
  const a = Math.abs(d);
  if (a < 0.5) return "居中";
  if (a < 1.0) return d > 0 ? "轻微偏高" : "轻微偏低";
  if (a < 2.0) return d > 0 ? "明显偏高" : "明显偏低";
  return d > 0 ? "强烈偏高" : "强烈偏低";
}

// ===== 个性化读回 =====
// 只读回用户自己的作答与落点坐标，不发明指标、不引常模。
// 阈值与 decisiveness() 一致：|计分−4| ≥ 2 才算「明确表态」。

// 选出「反应最强烈」的题：计分后离中点 4 越远越强，按强度降序。
function decisiveItems(answers) {
  return QUESTIONS.map((q) => {
    const raw = answers[q.id];
    if (raw === undefined) return null;
    const s = q.reversed ? 8 - raw : raw;
    return { q, raw, s, strength: Math.abs(s - 4) };
  })
    .filter((x) => x && x.strength >= 2)
    .sort((a, b) => b.strength - a.strength);
}

// 决定类型的维度。逐题读回按它抽样，避免所有题都挤在同一个维度。
function drivingDims(type) {
  if (type === "anxious") return ["anxiety"];
  if (type === "avoidant") return ["avoidance"];
  if (type === "fearful") return ["anxiety", "avoidance"];
  if (type === "secure") return ["avoidance", "anxiety"];
  return [];
}

// 逐题读回：每个驱动维度取最极端的 1 条，剩余名额按全局强度补足，最多 n 条。
function readback(answers, type, n = 3) {
  const items = decisiveItems(answers);
  if (items.length === 0) return [];
  const picked = [];
  const used = new Set();
  for (const dim of drivingDims(type)) {
    const hit = items.find((x) => x.q.dim === dim && !used.has(x.q.id));
    if (hit) { picked.push(hit); used.add(hit.q.id); }
  }
  for (const x of items) {
    if (picked.length >= n) break;
    if (used.has(x.q.id)) continue;
    picked.push(x);
    used.add(x.q.id);
  }
  return picked.slice(0, n);
}

// 落点读回：把象限图上的点翻译成「强度 + 主导 + 轻偏提示」三句。
function positionReadback(anxiety, avoidance, type) {
  const aD = anxiety - 4;
  const bD = avoidance - 4;
  return {
    strength: positionStrength(Math.hypot(aD, bD)),
    dom: positionDominance(Math.abs(aD), Math.abs(bD)),
    caveat: positionCaveat(type, Math.abs(aD), Math.abs(bD)),
  };
}

function positionStrength(r) {
  if (r < 0.7) return "你的点离中心很近，倾向不强——比起某个极端，你更接近平衡。";
  if (r < 1.8) return "你的点和中心拉开了一段距离，倾向开始成形，但还算温和。";
  return "你的点落在象限深处，这个倾向很鲜明、很确定。";
}

function positionDominance(aA, bA) {
  if (aA < 0.5 && bA < 0.5) return "两个维度都不突出。";
  if (aA > bA + 0.5) return `焦虑这一维偏离中心更远（${aA.toFixed(1)} vs ${bA.toFixed(1)}）。`;
  if (bA > aA + 0.5) return `回避这一维偏离中心更远（${bA.toFixed(1)} vs ${aA.toFixed(1)}）。`;
  return "两个维度偏离中心差不多，都在起作用。";
}

// 只有「决定类型的维度」落在轻微偏区间时，才提示别把标签看太重。
// 次要维度的轻微偏不影响类型，不用提示（问题 1 的修法）。
function positionCaveat(type, aA, bA) {
  if (!type) return "";
  const mild = drivingDims(type)
    .map((dim) => (dim === "anxiety" ? ["焦虑", aA] : ["回避", bA]))
    .filter(([, a]) => a >= 0.5 && a < 1.0)
    .map(([name]) => name);
  if (mild.length === 0) return "";
  return `${mild.join("和")}只是轻微越过边界，这个类型是「轻偏」出来的，别把标签看太重。`;
}
