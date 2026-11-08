# 币圈新手入门完全指南 / Crypto Tutorial Site

主线：**加密货币也能交易美股？** 讲清楚用 USDT/USDC 接触美股的 4 种方式（真股票账户、代币化股票、股票永续合约、CFD）、各平台支持什么、怎么一步步操作、风险在哪，并附注册、买 U、转账、钱包等新手基础。纯静态页面（HTML + CSS + 原生 JS），无需构建，可直接部署到 GitHub Pages。

**English:** A static, mobile-friendly beginner guide (in Chinese) on getting US-stock exposure with crypto — real-share accounts, tokenized stocks (bStocks, xStocks), stock perpetuals and CFDs — with a platform comparison, step-by-step tutorials, risk notes, and crypto basics.

## 内容（18 课）

| 阶段 | 课程 |
|---|---|
| 开始 | 开始这里（4 种方式入口、3 条铁律、邀请码速查、学习路线） |
| ★ 美股专区 | 1 四种方式一张表 · 2 平台对比（含港股、韩股、日股核实情况） · 3 实操：买第一笔 · 4 股票合约与爆仓 · 5 美股常见问题 |
| 入门基础 | 风险与法规 · 防骗与账户安全 · 基础概念（66 条可搜索术语） · 选交易所与注册 · 第一次买 U · 充值、提币与转账 · Web3 钱包 |
| 进阶与工具 | U 卡 · 工具箱 |
| 复习 | 常见问题 · 闯关测验（13 题） |
| 邀请码 | 全部邀请码 · 链接安全说明（域名核对结果） · 分享 |

平台信息截至 2026 年 11 月，正文附来源链接；产品和地区会变化，更新时请重新核对。

## 目录结构

```
index.html              页面、SEO / 分享卡片、全部课程正文
assets/css/theme.css    配色变量（改版前的原有配色：米白底、墨色字、亮黄点缀、深蓝按钮；改色只改这里）
assets/css/site.css     样式（引用 theme.css 的变量；仅浅色）
assets/js/data.js       邀请码、官方主站入口、域名核对标注、术语表、测验题（改邀请码只改这里）
assets/js/app.js        路由、目录、进度、复制、清单、术语搜索、测验、分享
assets/js/qr.js         本地二维码生成器（无外部依赖）
assets/og-cover.png     分享封面 1200×630
assets/guizang-illustrations/  插图
scripts/check.mjs       自检脚本
```

## 本地预览

```bash
python3 -m http.server 8766 --bind 127.0.0.1
```

然后打开 http://127.0.0.1:8766/ 。手机效果可以在浏览器开发者工具里切换手机视口；页面只有浅色。

## 检查

```bash
node scripts/check.mjs
```

会逐条核对 8 个邀请码与链接是否和改版前一致、每个邀请码是否有域名标注、未确认域名是否配了带同一邀请码的官方主站入口，并检查页内锚点、本地资源、分享卡片、外链属性、脚本语法和二维码结构。新增或修改邀请码时，同时更新 `assets/js/data.js` 和 `scripts/check.mjs` 里的 `EXPECTED`。

## 说明

本站仅用于新手教程和风险科普，不构成投资建议，不推荐任何币种或股票，不承诺收益。平台活动规则、地区限制、返现比例和产品说明以官方页面为准。站内邀请码均为站长本人的推广码。
