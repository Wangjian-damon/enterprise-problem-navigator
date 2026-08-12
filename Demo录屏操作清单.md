# Demo 录屏操作清单（2 分钟版）

> 用途：BUIDL_QUESTS 提交页 + 作品集 + README 的演示素材
> 前提：本机已启动两个服务（见 README Quick Start）——API :8091 + 前端 :8090
> 时长：建议 1:45–2:00 ｜ 分辨率：1080p ｜ 数据：合成示例仓库（脱敏）

---

## 一、录制前准备（5 分钟）

1. **启动服务**（终端 A 和 B 各开一个）：
   ```bash
   # 终端 A：API
   cd /Users/macbook/WorkBuddy/2026-08-03-10-28-15/code
   node apps/api/dist/server.js
   # 终端 B：前端页
   cd /Users/macbook/WorkBuddy/2026-08-03-10-28-15
   python3 -m http.server 8090
   ```
2. 浏览器打开 `http://localhost:8090/demo/index.html`，确认右上角徽章显示 **"LIVE · 真实推理引擎已连接"**（绿色）
3. 关闭无关标签页/通知；把浏览器窗口放大到全屏
4. 录制工具：macOS 用 `⌘⇧5`（录屏）或 QuickTime；手机/相机录音做旁白可选
5. **开录前先练习一遍**下面 3 个问题各走一遍，熟悉节奏

---

## 二、分镜脚本（照此顺序录）

### 镜头 1：开场（0:00–0:15）
- 画面：页面首屏 + 徽章特写
- 旁白（英文，或录屏后配字幕）：
  > "When something breaks in an enterprise, the hardest part isn't fixing it — it's knowing where to look. This is Enterprise Problem Navigator. Describe the problem, get the search path."

### 镜头 2：Demo 1 · 授信接口 500（0:15–0:40）
- 在输入框输入：`授信接口持续返回 500，先查什么？`
- 点「导航」
- 展示：涉及对象 chips → 排查顺序 → 证据列表
- 旁白：
  > "Credit API keeps returning 500. The navigator returns the chain — gateway, service, DB, config, cache — with evidence at every hop. Note: no hallucinated answers. Every claim carries a source reference and a confidence level."

### 镜头 3：Demo 2 · 错误码追踪（0:40–1:05）
- 输入：`错误码 E1002 在哪里定义和返回？`
- 点「导航」
- 展示证据：**S4 | sdk/error-codes.ts:5 定义于第 5 行**、**S4 | tasks/loan-scheduler.ts:22 返回**
- 旁白：
  > "Now trace an error code. The engine points to the exact file and line — defined in error-codes.ts, returned in loan-scheduler.ts. Source-level evidence, not a guess."

### 镜头 4：Demo 3 · 配置影响（1:05–1:30）
- 输入：`配置 loan_retry 关闭后影响哪些页面和服务？`
- 点「导航」
- 展示：反向影响链（读取代码 → 接口 → 任务 → 页面）
- 旁白：
  > "Config impact analysis — what breaks if we flip this switch? The system walks the reverse dependency chain instead of making you grep for it."

### 镜头 5：收尾（1:30–1:50）
- 画面：切到 GitHub 仓库页（可选）或产品架构图
- 旁白：
  > "One core, any enterprise system. Validated on 10/10 gold questions. Built by a solo developer on the One-Person-Company model. The messier the system, the more value we create."

---

## 三、录屏技巧

- **光标别乱晃**：点到为止，输入完就放开
- **打字速度**：正常打字即可，字幕会帮助理解
- **网络证据展示**：Demo 2/3 的 S4 证据是最大亮点，录完检查是否清晰可见
- **结尾黑场 1 秒**：方便剪辑时加结束卡
- 如果旁白紧张，可以**先录画面后配音**（画面节奏留白）

---

## 四、成品检查清单

- [ ] 徽章是 LIVE（绿色）不是 STATIC
- [ ] 三个 demo 都成功返回（10/10 命中率的问题集，不会失败）
- [ ] S4 证据的 file:line 清晰可见
- [ ] 无公司名/内部系统名/真实数据入镜（合成数据 ✅）
- [ ] 时长 ≤ 2:00
- [ ] 1080p 导出，命名 `demo.mp4` 或 `epn-demo.mp4`

---

## 五、录制完成后

1. 视频文件放工作区：`/Users/macbook/WorkBuddy/2026-08-03-10-28-15/demo/demo.mp4`
2. 提交到 GitHub（`git add demo/demo.mp4 && git commit && git push`）
3. OpenArena 项目页如有"更新/补充材料"入口，更新 demo 链接
4. X/TG 发帖（build in public）@OpenArena_To
