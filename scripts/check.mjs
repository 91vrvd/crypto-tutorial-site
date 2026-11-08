#!/usr/bin/env node
// 站点自检：邀请码逐条核对 + 本地资源 + 页内锚点 + JS 语法 + 二维码自测。
// 用法：node scripts/check.mjs
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(join(root, p), "utf8");
let failed = 0;
const ok = (msg) => console.log(`  ✓ ${msg}`);
const bad = (msg) => {
  failed++;
  console.log(`  ✗ ${msg}`);
};

// 改版前（commit 3e45c5c）站上全部邀请码，必须原样保留。
const EXPECTED = [
  ["binance-exchange", "币安交易所", "BTC10888", "https://www.bsmkweb.cc/register?ref=BTC10888", "返现 20%"],
  ["binance-wallet", "币安钱包", "BTC10888", "https://web3.binance.com/referral?ref=BTC10888", "返现 30%"],
  ["okx-wallet", "OKX 钱包", "YAYA12345", "https://web3.okx.com/join/YAYA12345", "返现 20%"],
  ["okx-exchange", "OKX 交易所", "3604739", "https://www.tzbflgjyscw.org/join/3604739", "返现 20%"],
  ["bitget-exchange", "Bitget 交易所", "0LJJYSJ8", "https://www.bitget.org/zh-CN/referral/register?clacCode=0LJJYSJ8&from=%2Fzh-CN%2Fevents%2Freferral-all-program&source=events&utmSource=PremierInviter", "返现 25%"],
  ["bybit-exchange", "Bybit 交易所", "M881VM", "https://www.bybitglobal.com/invite?ref=M881VM&medium=referral&utm_campaign=evergreen", "返现 30%"],
  ["bybit-card", "Bybit Card", "M881VM", "https://www.bybit.com/cards/?ref=M881VM&source=applet_invite", "10% 返现和 10 USDT 活动说明"],
  ["bitget-card", "Bitget Card", "btcbtc18", "", "活动以官方页面为准"]
];

// 1. 加载数据
console.log("\n[1] 邀请码核对");
const ctx = { window: {}, globalThis: {} };
vm.createContext(ctx);
vm.runInContext(read("assets/js/data.js"), ctx);
const data = ctx.window.SITE_DATA;
if (!data) {
  bad("data.js 没有导出 SITE_DATA");
  process.exit(1);
}
const refs = data.referrals;
if (refs.length !== EXPECTED.length) bad(`邀请码数量 ${refs.length}，应为 ${EXPECTED.length}`);
for (const [id, name, code, link, reward] of EXPECTED) {
  const r = refs.find((x) => x.id === id);
  if (!r) {
    bad(`${name}（${id}）缺失`);
    continue;
  }
  const diffs = [];
  if (r.name !== name) diffs.push(`名称 ${r.name}`);
  if (r.code !== code) diffs.push(`邀请码 ${r.code}`);
  if (r.link !== link) diffs.push(`链接 ${r.link}`);
  if (r.reward !== reward) diffs.push(`返现文案 ${r.reward}`);
  if (diffs.length) bad(`${name}: ${diffs.join("；")}`);
  else ok(`${name.padEnd(10, "　")} ${code.padEnd(10)} ${link ? "链接一致" : "（原本无链接）"}`);
}

// 2. 页面结构
console.log("\n[2] 页面结构");
const html = read("index.html");
const slots = [...html.matchAll(/data-ref="([^"]+)"/g)].map((m) => m[1]);
const placed = new Set(slots.flatMap((s) => (s === "all" ? refs.map((r) => r.id) : s.split(","))));
for (const s of slots) {
  if (s === "all") continue;
  for (const id of s.split(",")) if (!refs.find((r) => r.id === id)) bad(`data-ref 引用了不存在的 ${id}`);
}
if (!slots.includes("all")) bad("缺少邀请码汇总（data-ref=\"all\"）");
if (!html.includes("data-ref-quick")) bad("首页缺少邀请码速查");
else ok("首页有邀请码速查，汇总页有全部卡片");
if (!html.includes('href="#codes"')) bad("顶栏缺少邀请码入口");
else ok(`顶栏/侧栏有邀请码入口；章节内放置了 ${placed.size} 个平台卡片`);
// noscript 兜底里也要能看到所有邀请码
const noscript = (html.match(/<noscript>[\s\S]*?<\/noscript>/) || [""])[0];
const missingNs = refs.filter((r) => !noscript.includes(r.code));
if (missingNs.length) bad(`noscript 兜底缺少：${missingNs.map((r) => r.code).join(", ")}`);
else ok("无 JS 兜底文字包含全部邀请码");

const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
const dupIds = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]).filter((v, i, a) => a.indexOf(v) !== i);
if (dupIds.length) bad(`重复 id：${[...new Set(dupIds)].join(", ")}`);
const anchors = [...html.matchAll(/href="#([^"]+)"/g)].map((m) => m[1]);
const brokenAnchors = [...new Set(anchors.filter((a) => !ids.has(a)))];
if (brokenAnchors.length) bad(`页内锚点不存在：${brokenAnchors.join(", ")}`);
else ok(`页内锚点 ${new Set(anchors).size} 个全部有效`);

const quizChapters = data.quiz.map((q) => q.chapter).filter((c) => !ids.has(c));
if (quizChapters.length) bad(`测验回看章节不存在：${quizChapters.join(", ")}`);
for (const q of data.quiz) {
  if (!q.answer.every((a) => a >= 0 && a < q.options.length)) bad(`测验答案越界：${q.q}`);
}
ok(`测验 ${data.quiz.length} 题、术语 ${data.glossary.length} 条`);

const chapterCount = (html.match(/<section class="chapter"/g) || []).length;
ok(`章节 ${chapterCount} 个`);

// 3. 本地资源
console.log("\n[3] 本地资源");
const localRefs = [...html.matchAll(/(?:src|href)="\.\/([^"]+)"/g)].map((m) => m[1]);
const missing = localRefs.filter((p) => !existsSync(join(root, p)));
if (missing.length) bad(`缺少文件：${missing.join(", ")}`);
else ok(`本地资源 ${localRefs.length} 个全部存在`);
const emptyHref = html.match(/href=""/g);
if (emptyHref) bad(`有 ${emptyHref.length} 个空链接`);
const extNoRel = [...html.matchAll(/<a [^>]*target="_blank"[^>]*>/g)].filter((m) => !/rel="[^"]*noopener/.test(m[0]));
if (extNoRel.length) bad(`${extNoRel.length} 个外链缺少 rel=noopener`);
else ok("外链都带 rel=noopener");

// 4. JS 语法
console.log("\n[4] 脚本语法");
for (const f of ["assets/js/data.js", "assets/js/qr.js", "assets/js/app.js"]) {
  try {
    new vm.Script(read(f), { filename: f });
    ok(f);
  } catch (e) {
    bad(`${f}: ${e.message}`);
  }
}

// 5. 二维码自测：结构性检查（定位图形、时序图形、格式信息 BCH 校验）
console.log("\n[5] 二维码自测");
const qctx = { window: {}, TextEncoder };
vm.createContext(qctx);
vm.runInContext(read("assets/js/qr.js"), qctx);
const m = qctx.window.QR.encode(data.canonicalUrl);
const size = m.length;
const finderOk = [[0, 0], [size - 7, 0], [0, size - 7]].every(([x0, y0]) => {
  for (let y = 0; y < 7; y++)
    for (let x = 0; x < 7; x++) {
      const d = Math.max(Math.abs(x - 3), Math.abs(y - 3));
      if (m[y0 + y][x0 + x] !== (d !== 2)) return false;
    }
  return true;
});
let timingOk = true;
for (let i = 8; i < size - 8; i++) if (m[6][i] !== (i % 2 === 0) || m[i][6] !== (i % 2 === 0)) timingOk = false;
let fmt = 0;
for (let i = 0; i <= 5; i++) fmt |= (m[i][8] ? 1 : 0) << i;
fmt |= (m[7][8] ? 1 : 0) << 6;
fmt |= (m[8][8] ? 1 : 0) << 7;
fmt |= (m[8][7] ? 1 : 0) << 8;
for (let i = 9; i < 15; i++) fmt |= (m[8][14 - i] ? 1 : 0) << i;
const raw = fmt ^ 0x5412;
let rem = raw >>> 10;
const dataBits = rem;
for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
const bchOk = ((dataBits << 10) | (rem & 0x3ff)) === raw && dataBits >>> 3 === 0;
if (finderOk && timingOk && bchOk) ok(`版本 ${(size - 17) / 4}（${size}×${size}），定位/时序/格式信息正确，掩码 ${dataBits & 7}`);
else bad(`二维码结构异常 finder=${finderOk} timing=${timingOk} format=${bchOk}`);

console.log(failed ? `\n❌ ${failed} 项未通过\n` : "\n✅ 全部检查通过\n");
process.exit(failed ? 1 : 0);
