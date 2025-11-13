# 项目结构说明

## 完整文件清单

```
dota2-inhouse/
│
├── 📄 配置文件
│   ├── package.json              # 项目依赖和脚本
│   ├── vite.config.js            # Vite 构建配置
│   ├── tailwind.config.js        # Tailwind CSS 配置
│   ├── postcss.config.js         # PostCSS 配置
│   ├── vercel.json               # Vercel 部署配置
│   ├── .env.example              # 环境变量示例
│   └── .gitignore                # Git 忽略文件
│
├── 📚 文档
│   ├── README.md                 # 项目介绍
│   ├── QUICKSTART.md             # 快速开始（⭐ 从这里开始）
│   ├── DEPLOYMENT.md             # 部署指南
│   └── DEVELOPMENT.md            # 开发指南
│
├── 🗄️ 数据库
│   └── supabase/
│       └── migrations/
│           └── 001_initial_schema.sql  # 数据库初始化脚本
│
├── 🎨 前端代码
│   ├── index.html                # HTML 入口
│   └── src/
│       ├── main.jsx              # 应用入口
│       ├── App.jsx               # 主应用组件（路由配置）
│       ├── index.css             # 全局样式
│       │
│       ├── 📦 components/        # 可复用组件
│       │   ├── PlayerCard.jsx    # 玩家卡片组件
│       │   └── Toast.jsx         # 通知提示组件
│       │
│       ├── 📄 pages/             # 页面组件
│       │   ├── MainPage.jsx      # 主页 - 选择角色
│       │   ├── RoomsPage.jsx     # 房间列表页
│       │   ├── RoomLobby.jsx     # 房间大厅 - Roll点
│       │   ├── DraftPage.jsx     # 选人界面
│       │   ├── GamePage.jsx      # 游戏进行界面
│       │   ├── StatsPage.jsx     # 战绩统计页
│       │   └── PlayerStatsPage.jsx # 个人战绩详情
│       │
│       ├── 🔧 hooks/             # 自定义 React Hooks
│       │   └── useRoom.js        # 房间相关操作 Hooks
│       │
│       ├── 💾 store/             # 状态管理
│       │   └── useStore.js       # Zustand 全局状态
│       │
│       ├── 🛠️ lib/               # 工具库
│       │   ├── supabase.js       # Supabase 客户端配置
│       │   └── utils.js          # 通用工具函数
│       │
│       └── 📊 data/              # 静态数据
│           └── heroes.js         # Dota2 英雄数据映射
│
└── 🖼️ public/                   # 静态资源（需自行添加）
    └── heroes/                   # 英雄头像图片
        ├── antimage.png
        ├── axe.png
        └── ...
```

## 核心文件说明

### 📄 配置文件

| 文件 | 作用 | 是否需要修改 |
|------|------|-------------|
| `package.json` | 项目依赖和构建脚本 | ❌ 一般不需要 |
| `.env` | 环境变量（Supabase配置）| ✅ **必须配置** |
| `tailwind.config.js` | UI样式配置 | 可选 |
| `vercel.json` | 部署配置 | ❌ 不需要 |

### 🗄️ 数据库

| 文件 | 作用 | 是否需要修改 |
|------|------|-------------|
| `001_initial_schema.sql` | 创建表、函数、初始数据 | ✅ **修改玩家数据** |

**重要提示**：执行此脚本前，请修改最后的 `INSERT INTO players` 部分，填入你的真实玩家信息。

### 🎨 前端核心文件

#### 页面组件（按流程顺序）

1. **MainPage.jsx** - 主页
   - 显示所有玩家卡片
   - 选择自己的角色
   - 跳转到房间列表

2. **RoomsPage.jsx** - 房间列表
   - 创建新房间
   - 输入房间号加入
   - 从列表选择房间加入

3. **RoomLobby.jsx** - 房间大厅
   - 显示房间内玩家
   - Roll 点功能
   - 自动选择队长
   - 开始选人

4. **DraftPage.jsx** - 选人界面
   - 显示已选和待选队员
   - 队长选择队员
   - 队员设置偏好
   - 开始游戏

5. **GamePage.jsx** - 游戏界面
   - 显示双方阵容
   - 房主记录胜负
   - 自动更新战绩

6. **StatsPage.jsx** - 战绩总览
   - 排行榜
   - 点击查看详情

7. **PlayerStatsPage.jsx** - 个人详情
   - 个人战绩统计
   - 队友组合胜率
   - 近期比赛记录
   - 战绩显示开关

#### 工具文件

- **useRoom.js** - 封装所有房间相关操作
  - 创建/加入/退出房间
  - Roll 点
  - 选择队员
  - 开始/结束游戏

- **useStore.js** - 全局状态管理
  - 当前用户
  - 当前房间
  - 房间内玩家
  - Toast 通知

- **utils.js** - 工具函数
  - 计算胜率
  - 格式化战绩
  - 检测并列
  - 时间格式化

- **heroes.js** - 英雄数据
  - 124个英雄的中英文名
  - 英雄头像 URL 映射
  - 搜索功能

### 🗄️ 数据库表结构

#### players（玩家表）
- 存储玩家基本信息
- 战绩数据
- 当前房间锁定

#### rooms（房间表）
- 房间基本信息
- 房主、状态、人数
- 24小时过期机制

#### room_players（房间成员表）
- 玩家在房间内的状态
- Roll 点结果
- 队伍分配
- 偏好设置

#### matches（比赛记录表）
- 每场比赛的完整记录
- 用于统计和查询

## 技术栈

### 前端
- **React 18** - UI 框架
- **Vite** - 构建工具
- **React Router v6** - 路由管理
- **Zustand** - 状态管理
- **Tailwind CSS** - UI 样式
- **Lucide React** - 图标库

### 后端
- **Supabase** - 后端服务
  - PostgreSQL 数据库
  - Realtime 实时订阅
  - RESTful API
  - Row Level Security

### 部署
- **Vercel** - 前端托管
- **Supabase Cloud** - 数据库托管

## 数据流向

```
用户操作
  ↓
React 组件
  ↓
Custom Hooks (useRoom.js)
  ↓
Supabase Client
  ↓
PostgreSQL 数据库
  ↓
Realtime 订阅推送
  ↓
更新组件状态
  ↓
UI 重新渲染
```

## 关键功能实现

### 1. 实时同步
使用 Supabase Realtime 订阅数据库变化，所有玩家看到的数据自动同步。

### 2. 全局锁定
玩家选择角色后，`current_room_id` 字段锁定，防止重复选择。

### 3. Roll 点机制
- 生成 1-100 随机数
- 自动排序
- 前两名标记为队长
- 检测并列第二

### 4. 队伍选人
- 队长点击队员加入队伍
- 队员设置偏好（天辉/夜魇）
- 双方满5人后可开始游戏

### 5. 战绩更新
- 使用数据库函数原子性更新
- 批量更新所有10人战绩
- 自动重置房间状态

## 环境要求

- **Node.js**: 18.0.0 或更高
- **npm**: 9.0.0 或更高
- **浏览器**: Chrome、Firefox、Safari、Edge（最新版）

## 已知限制

1. **英雄头像需手动添加**：项目不包含英雄头像图片，需从 GitHub 下载
2. **无身份验证**：基于信任机制，无需登录
3. **单地区优化**：适合局域网或小团队使用
4. **手动记录胜负**：由房主手动选择，未接入 Dota2 GSI

## 未来扩展方向

- 🔐 添加身份验证
- 💬 房间聊天功能
- 🎮 接入 Dota2 GSI 自动识别比赛结果
- 📊 英雄胜率统计
- 🏆 赛季排行榜
- 📱 移动端 App
- 🌍 多语言支持

## 开发统计

- **总代码行数**: ~3000 行
- **组件数量**: 9 个页面 + 2 个组件
- **数据库函数**: 7 个
- **开发时间**: 约 3-5 天（完整实现）

---

希望这份文档能帮助你快速理解项目结构！🚀
