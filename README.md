# 币圈新手入门完全指南 / Crypto Tutorial Site

写给完全零基础新手的币圈入门教程站。纯静态页面（HTML + CSS + 原生 JS），无需构建，可直接部署到 GitHub Pages。

**English:** A static, mobile-friendly beginner guide (in Chinese) covering crypto risks, scam prevention, basics, exchanges, buying stablecoins, transfers, wallets, crypto cards, tokenized stocks, an FAQ and a quiz.

## 内容（14 课）

| 阶段 | 课程 |
|---|---|
| 开始 | 开始这里（3 条铁律、邀请码速查、学习路线） |
| 第一阶段 · 认清风险 | 1 风险与法规 · 2 防骗与账户安全 |
| 第二阶段 · 搞懂概念 | 3 基础概念（含 57 条可搜索术语表） |
| 第三阶段 · 动手操作 | 4 选交易所与注册 · 5 第一次买 U · 6 充值、提币与转账 · 7 Web3 钱包 |
| 第四阶段 · 进阶 | 8 U 卡 · 9 用 U 买美股（代币化股票） · 10 工具箱 |
| 复习 | 11 常见问题 · 12 闯关测验 · 邀请码汇总与分享 |

## 目录结构

```
index.html            页面与全部课程正文
assets/css/site.css   样式（桌面侧栏 / 手机抽屉 + 底部翻页栏）
assets/js/data.js     邀请码、术语表、测验题（改邀请码只改这里）
assets/js/app.js      路由、目录、进度、复制、清单、术语搜索、测验、分享
assets/js/qr.js       本地二维码生成器（无外部依赖）
assets/guizang-illustrations/  插图
scripts/check.mjs     自检脚本
```

## 本地预览

```bash
python3 -m http.server 8766 --bind 127.0.0.1
```

然后打开 http://127.0.0.1:8766/ 。手机效果可以在浏览器开发者工具里切换手机视口。

## 检查

```bash
node scripts/check.mjs
```

会逐条核对 8 个邀请码与链接是否和改版前一致，并检查页内锚点、本地资源、外链属性、脚本语法和二维码结构。新增或修改邀请码时，同时更新 `assets/js/data.js` 和 `scripts/check.mjs` 里的 `EXPECTED`。

## 说明

本站仅用于新手教程和风险科普，不构成投资建议，不推荐任何币种或股票，不承诺收益。平台活动规则、地区限制、返现比例和产品说明以官方页面为准。站内含邀请链接。
