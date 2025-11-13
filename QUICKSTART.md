# 快速开始指南 🚀

恭喜！你已经拥有了完整的大象公会 Dota2 内战系统代码。

## 📦 项目已包含

✅ 完整的前端代码（React + Vite）
✅ 数据库SQL脚本（Supabase）
✅ 所有必要的配置文件
✅ 详细的文档

## 🎯 三步快速上线

### 第一步：设置数据库（5分钟）

1. 访问 [Supabase](https://supabase.com) 创建免费账号
2. 创建新项目（选择新加坡区域）
3. 进入 SQL Editor，执行 `supabase/migrations/001_initial_schema.sql` 中的脚本
4. 在 Settings → API 页面复制 URL 和 anon key

### 第二步：本地测试（5分钟）

```bash
# 1. 进入项目目录
cd dota2-inhouse

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填入你的 Supabase URL 和 Key

# 4. 启动开发服务器
npm run dev
```

访问 `http://localhost:5173` 查看效果！

### 第三步：部署上线（5分钟）

1. 将代码推送到 GitHub：
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/你的用户名/dota2-inhouse.git
   git push -u origin main
   ```

2. 访问 [Vercel](https://vercel.com)，导入你的 GitHub 仓库
3. 添加环境变量（Supabase URL 和 Key）
4. 点击 Deploy，等待部署完成

完成！🎉

## 📚 详细文档

- **README.md** - 项目介绍和功能说明
- **DEPLOYMENT.md** - 完整部署指南（含故障排查）
- **DEVELOPMENT.md** - 开发指南（面向开发者）

## 🎮 功能清单

✅ 玩家角色选择
✅ 房间创建/加入（支持房间号和列表）
✅ Roll 点选队长（自动检测并列第二）
✅ 队伍选人（支持偏好设置）
✅ 游戏进行（房主记录胜负）
✅ 战绩统计（总榜 + 个人详情）
✅ 队友组合胜率分析
✅ 实时同步（多设备自动更新）

## 🔧 自定义配置

### 修改玩家数据

编辑 `supabase/migrations/001_initial_schema.sql` 最后的 INSERT 语句：

```sql
INSERT INTO players (username, avatar_url, positions, favorite_heroes, total_wins, total_losses) VALUES
('你的名字', '头像URL', ARRAY['Carry'], ARRAY['antimage'], 0, 0),
-- 添加更多玩家...
```

### 修改英雄数据

编辑 `src/data/heroes.js`，根据需要增删英雄。

### 修改UI样式

编辑 `tailwind.config.js` 和 `src/index.css`。

## 💡 常见问题

**Q: 如何添加新玩家？**
A: 直接在 Supabase 控制台的 `players` 表中插入新记录。

**Q: 战绩如何修改？**
A: 在 Supabase 控制台修改 `players` 表的 `total_wins` 和 `total_losses` 字段。

**Q: 如何获取英雄头像？**
A: 从 [dota2-minimap-hero-sprites](https://github.com/bontscho/dota2-minimap-hero-sprites) 下载，放到 `public/heroes/` 目录。

**Q: 实时更新不工作？**
A: 检查 Supabase Realtime 是否启用，网络连接是否正常。

## 🆘 需要帮助？

1. 查看详细文档：`DEPLOYMENT.md` 和 `DEVELOPMENT.md`
2. 检查浏览器控制台错误信息
3. 查看 Supabase 日志

## 🚀 后续优化建议

- 添加聊天功能
- 接入 Dota2 GSI 自动识别比赛结果
- 添加英雄胜率统计
- 实现赛季制度
- 移动端优化

---

祝你使用愉快！如有问题，请查阅详细文档。🎮
