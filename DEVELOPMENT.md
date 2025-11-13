# 开发指南

本指南面向想要理解或修改此项目的开发者。

## 项目架构

### 技术选型理由

- **React + Vite**: 快速开发、热更新、现代化工具链
- **Supabase**: 提供免费的 PostgreSQL + 实时订阅，国内可访问
- **Zustand**: 轻量级状态管理，比 Redux 简单
- **Tailwind CSS**: 快速构建 UI，减少自定义 CSS
- **React Router**: 标准的 React 路由方案

### 目录结构解析

```
src/
├── components/       # 可复用UI组件
│   ├── PlayerCard.jsx    # 玩家卡片
│   └── Toast.jsx         # 通知提示
├── pages/           # 页面组件
│   ├── MainPage.jsx      # 主页-选择角色
│   ├── RoomsPage.jsx     # 房间列表
│   ├── RoomLobby.jsx     # 房间大厅-Roll点
│   ├── DraftPage.jsx     # 选人界面
│   ├── GamePage.jsx      # 游戏进行
│   ├── StatsPage.jsx     # 战绩统计
│   └── PlayerStatsPage.jsx # 个人战绩
├── store/           # 状态管理
│   └── useStore.js       # Zustand store
├── hooks/           # 自定义Hooks
│   └── useRoom.js        # 房间相关操作
├── lib/             # 工具库
│   ├── supabase.js       # Supabase客户端
│   └── utils.js          # 工具函数
└── data/            # 静态数据
    └── heroes.js         # 英雄数据
```

## 核心功能实现

### 1. 实时同步机制

使用 Supabase Realtime 订阅数据库变化：

```javascript
// 订阅房间变化
const channel = supabase
  .channel(`room:${roomId}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'rooms',
    filter: `id=eq.${roomId}`
  }, (payload) => {
    // 处理变化
  })
  .subscribe()
```

**注意事项**：
- 记得在组件卸载时取消订阅
- 避免订阅过多通道（影响性能）
- 处理订阅失败的情况

### 2. 全局锁定机制

玩家选择角色后，`current_room_id` 字段会全局锁定，防止重复选择：

```sql
UPDATE players 
SET current_room_id = v_room_id 
WHERE id = p_player_id;
```

**设计考量**：
- 全局锁定确保一个玩家只能在一个房间
- 退出房间时自动清除锁定
- 房间解散时批量清除锁定

### 3. Roll点和队长选择

```javascript
// 自动设置前两名为队长
const sortedPlayers = players.sort((a, b) => 
  b.roll_result - a.roll_result
)
await supabase
  .from('room_players')
  .update({ is_captain: true })
  .in('player_id', [sortedPlayers[0].id, sortedPlayers[1].id])
```

**并列第二处理**：
- 检测并列第二名
- 提示重新 Roll
- 不影响第一名和第三名

### 4. 选人逻辑

选人规则完全由玩家自己控制，系统只负责：
- 标记哪些玩家已准备（可被选）
- 记录玩家的队伍偏好
- 允许队长点击队员加入队伍

```javascript
// 队长选择队员
const selectPlayer = async (playerId, team) => {
  await supabase
    .from('room_players')
    .update({ team })
    .eq('player_id', playerId)
}
```

### 5. 游戏状态流转

```
waiting (等待中)
  ↓ [开始选人]
drafting (选人中)
  ↓ [开始游戏]
gaming (游戏中)
  ↓ [记录结果]
waiting (重置)
```

状态在 `rooms.status` 字段中管理。

### 6. 战绩更新

使用数据库函数 `finish_match` 原子性更新：

```sql
-- 1. 验证队伍人数
-- 2. 插入比赛记录
-- 3. 批量更新玩家战绩
-- 4. 重置房间状态
```

**优势**：
- 原子性操作，不会部分失败
- 减少网络请求
- 服务端执行，更安全

## 常见开发任务

### 添加新页面

1. 在 `src/pages/` 创建组件
2. 在 `src/App.jsx` 添加路由
3. 在相关页面添加导航链接

### 添加新的房间操作

1. 在 `src/hooks/useRoom.js` 添加 hook
2. 可能需要在数据库添加新函数
3. 在页面组件中使用 hook

### 修改UI样式

- 主要使用 Tailwind 工具类
- 自定义颜色在 `tailwind.config.js` 定义
- 全局样式在 `src/index.css`

### 调试实时订阅

1. 打开浏览器控制台
2. 查看 WebSocket 连接
3. 使用 Supabase 控制台的实时日志

## 数据库操作最佳实践

### 使用 RPC 函数

复杂逻辑应封装在数据库函数中：

```javascript
// ✅ 推荐：使用RPC
await supabase.rpc('create_room', { 
  p_host_id: playerId 
})

// ❌ 不推荐：客户端多次操作
await supabase.from('rooms').insert(...)
await supabase.from('room_players').insert(...)
await supabase.from('players').update(...)
```

### 错误处理

```javascript
try {
  const { data, error } = await supabase...
  if (error) throw error
  // 处理数据
} catch (err) {
  console.error('操作失败:', err)
  showToast('操作失败', 'error')
}
```

### 查询优化

```javascript
// ✅ 使用 select 指定字段
.select('id, username, total_wins')

// ❌ 避免 select('*') 如果不需要所有字段

// ✅ 使用关联查询
.select(`
  *,
  player:players(username, avatar_url)
`)
```

## 性能优化建议

### 1. 组件优化

```javascript
// 使用 React.memo 避免不必要的重渲染
export const PlayerCard = React.memo(({ player, ...props }) => {
  // ...
})

// 使用 useCallback 缓存函数
const handleClick = useCallback(() => {
  // ...
}, [dependencies])
```

### 2. 订阅优化

- 只订阅必要的表
- 使用 filter 减少订阅范围
- 及时清理订阅

### 3. 图片优化

- 使用适当大小的头像
- 考虑使用 CDN
- 添加懒加载

## 测试策略

### 本地测试

1. **多设备测试**：
   - 用不同浏览器模拟多个玩家
   - 测试实时同步是否正常

2. **边界情况**：
   - 房间满员
   - 网络断开重连
   - 并发操作

3. **数据一致性**：
   - 战绩是否正确累计
   - 房间状态是否正确流转

### 数据库测试

直接在 Supabase SQL Editor 测试函数：

```sql
-- 测试创建房间
SELECT * FROM create_room('player-uuid', '测试房间');

-- 测试加入房间
SELECT * FROM join_room('ABC123', 'player-uuid');
```

## 故障排查

### 常见问题

1. **实时更新不工作**
   - 检查 Supabase Realtime 是否启用
   - 查看浏览器控制台 WebSocket 连接
   - 确认表的 Realtime 功能已开启

2. **玩家无法加入房间**
   - 检查玩家是否已在其他房间
   - 查看 `join_room` 函数返回的错误信息
   - 确认房间状态和人数限制

3. **战绩未更新**
   - 查看 `finish_match` 函数执行日志
   - 确认游戏开始时队伍人数正确
   - 检查数据库触发器

### 调试技巧

1. **Chrome DevTools**：
   - Network 面板查看 API 请求
   - Console 面板查看错误信息
   - Application 面板查看 WebSocket

2. **Supabase 日志**：
   - 在 Supabase 控制台查看 Logs
   - 使用 SQL Editor 直接查询数据

3. **React DevTools**：
   - 查看组件状态
   - 分析渲染性能

## 扩展建议

### 功能扩展

1. **聊天系统**：
   - 添加 `messages` 表
   - 使用 Realtime 订阅新消息
   - 显示在房间侧边栏

2. **英雄禁用**：
   - 添加 Ban/Pick 阶段
   - 记录每场比赛的英雄选择

3. **赛季系统**：
   - 添加 `seasons` 表
   - 每个赛季独立计算战绩
   - 赛季结束后归档数据

### UI/UX 改进

1. **响应式优化**：
   - 完善移动端布局
   - 添加触摸友好的交互

2. **动画效果**：
   - Roll 点动画
   - 页面切换过渡
   - 卡片hover效果

3. **无障碍功能**：
   - 添加键盘导航
   - 增加ARIA标签
   - 支持屏幕阅读器

## 贡献指南

### 代码规范

- 使用 ESLint 保持代码风格一致
- 组件使用 PascalCase
- 函数和变量使用 camelCase
- 添加必要的注释

### Git 提交规范

```
feat: 添加新功能
fix: 修复bug
docs: 文档更新
style: 代码格式调整
refactor: 代码重构
perf: 性能优化
test: 测试相关
chore: 构建工具或辅助工具更改
```

### Pull Request

1. Fork 项目
2. 创建特性分支
3. 提交更改
4. 推送到 Fork
5. 创建 Pull Request

---

Happy Coding! 🚀
