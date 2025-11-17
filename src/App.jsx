// src/App.jsx - 集成状态恢复功能
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useStateRestore } from './hooks/useStateRestore';
import { Toast } from './components/Toast';
import { MainPage } from './pages/MainPage';
import { RoomsPage } from './pages/RoomsPage';
import { RoomLobby } from './pages/RoomLobby';
import { DraftPage } from './pages/DraftPage';
import { GamePage } from './pages/GamePage';
import { StatsPage } from './pages/StatsPage';
import { PlayerStatsPage } from './pages/PlayerStatsPage';
import { Loader2 } from 'lucide-react';
import { AdminPlayersPage } from './pages/AdminPlayersPage';
import { TestImagePage } from './pages/TestImagePage';


/**
 * App 内容组件 - 处理状态恢复
 */
function AppContent() {
  // 使用状态恢复 Hook
  const { restoring } = useStateRestore();

  // 显示加载中状态
  if (restoring) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">正在恢复状态...</p>
          <p className="text-gray-400 text-sm mt-2">
            正在检查您的玩家和房间信息
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <Routes>
        {/* 主页 - 选择角色 */}
        <Route path="/" element={<MainPage />} />
        
        {/* 房间列表 */}
        <Route path="/rooms" element={<RoomsPage />} />
        
        {/* 房间大厅 - Roll点 */}
        <Route path="/room/:roomId/lobby" element={<RoomLobby />} />
        
        {/* 选人界面 */}
        <Route path="/room/:roomId/draft" element={<DraftPage />} />
        
        {/* 游戏进行 */}
        <Route path="/room/:roomId/game" element={<GamePage />} />
        
        {/* 战绩统计 */}
        <Route path="/stats" element={<StatsPage />} />
        
        {/* 个人战绩详情 */}
        <Route path="/stats/:playerId" element={<PlayerStatsPage />} />
        
        {/* 图片测试页面 */}
        <Route path="/test/image" element={<TestImagePage />} />
        
        {/* 管理员页面 - 玩家管理 */}
        <Route path="/admin/players" element={<AdminPlayersPage />} />

        {/* 默认重定向 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      
      {/* 全局Toast通知 */}
      <Toast />
    </div>
  );
}

/**
 * App 根组件
 */
function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
