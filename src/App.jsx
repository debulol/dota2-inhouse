import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toast } from './components/Toast'
import { MainPage } from './pages/MainPage'
import { RoomsPage } from './pages/RoomsPage'
import { RoomLobby } from './pages/RoomLobby'
import { DraftPage } from './pages/DraftPage'
import { GamePage } from './pages/GamePage'
import { StatsPage } from './pages/StatsPage'
import { PlayerStatsPage } from './pages/PlayerStatsPage'

function App() {
  return (
    <BrowserRouter>
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
          
          {/* 默认重定向 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        
        {/* 全局Toast通知 */}
        <Toast />
      </div>
    </BrowserRouter>
  )
}

export default App
