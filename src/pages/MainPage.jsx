// src/pages/MainPage.jsx - 增强版（支持状态恢复）
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store/useStore';
import { PlayerCard } from '@/components/PlayerCard';
import { Users, Loader2, TrendingUp, RefreshCw } from 'lucide-react';

export function MainPage() {
  const navigate = useNavigate();
  const { 
    currentPlayer,
    setCurrentPlayer, 
    setAllPlayers, 
    showToast 
  } = useStore();
  
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkingRoom, setCheckingRoom] = useState(false);

  useEffect(() => {
    loadPlayers();
    
    // 实时订阅玩家状态变化
    const channel = supabase
      .channel('players-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'players'
      }, () => {
        loadPlayers();
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  // 如果已经选择了玩家，检查是否在房间中
  useEffect(() => {
    if (currentPlayer) {
      checkPlayerRoomStatus();
    }
  }, [currentPlayer]);

  /**
   * 检查玩家是否在房间中，如果在则自动跳转
   */
  const checkPlayerRoomStatus = async () => {
    if (!currentPlayer) return;

    setCheckingRoom(true);
    
    try {
      // 获取玩家的最新数据（包括 current_room_id）
      const { data: playerData } = await supabase
        .from('players')
        .select('current_room_id')
        .eq('id', currentPlayer.id)
        .single();

      if (playerData?.current_room_id) {
        const roomId = playerData.current_room_id;
        console.log('🔍 检测到玩家在房间中:', roomId);
        
        // 获取房间状态
        const { data: room } = await supabase
          .from('rooms')
          .select('*')
          .eq('id', roomId)
          .single();

        if (room) {
          console.log('🏠 房间状态:', room.status);
          
          // 显示提示
          showToast(`检测到您在房间中: ${room.room_name}`, 'info');
          
          // 根据房间状态跳转到相应页面
          setTimeout(() => {
            switch (room.status) {
              case 'waiting':
                navigate(`/room/${roomId}/lobby`);
                break;
              case 'drafting':
                navigate(`/room/${roomId}/draft`);
                break;
              case 'gaming':
                navigate(`/room/${roomId}/game`);
                break;
              default:
                navigate(`/room/${roomId}/lobby`);
            }
          }, 1000);
        } else {
          // 房间不存在，清除 current_room_id
          console.warn('⚠️ 房间不存在，清除玩家的房间关联');
          await supabase
            .from('players')
            .update({ current_room_id: null })
            .eq('id', currentPlayer.id);
        }
      } else {
        console.log('✅ 玩家不在任何房间中');
      }
    } catch (error) {
      console.error('❌ 检查玩家房间状态失败:', error);
    } finally {
      setCheckingRoom(false);
    }
  };

  /**
   * 加载所有玩家
   */
  const loadPlayers = async () => {
    try {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .order('username');

      if (error) throw error;
      setPlayers(data || []);
      setAllPlayers(data || []);
    } catch (error) {
      console.error('Load players error:', error);
      showToast('加载玩家列表失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 选择玩家
   */
  const handleSelectPlayer = (player) => {
    // 检查玩家是否已在房间中
    if (player.current_room_id) {
      showToast('该玩家已在房间中，无法选择', 'warning');
      return;
    }

    // 保存选择的玩家（会自动保存到 localStorage）
    setCurrentPlayer(player);
    
    showToast(`已选择角色: ${player.username}`, 'success');
    
    console.log('✅ 已选择玩家:', player.username);
    console.log('📦 已保存到 localStorage');
    
    // 跳转到房间列表
    navigate('/rooms');
  };

  /**
   * 取消角色选择
   */
  const handleDeselectPlayer = () => {
    // 检查是否在房间中
    if (currentPlayer?.current_room_id) {
      const confirm = window.confirm(
        '您当前在房间中，取消角色选择会退出房间。确定要继续吗？'
      );
      if (!confirm) return;
    }

    setCurrentPlayer(null);
    showToast('已取消角色选择', 'info');
    console.log('🗑️ 已清除玩家选择');
  };

  /**
   * 手动刷新玩家列表
   */
  const handleRefresh = () => {
    setLoading(true);
    loadPlayers();
    showToast('正在刷新...', 'info');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* 标题区域 */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Users className="w-12 h-12 text-blue-600 mr-3" />
            <h1 className="text-5xl font-bold text-gray-900">大象公会内战系统</h1>
          </div>
          
          {/* 当前角色显示 */}
          <div className="mt-4">
            {currentPlayer ? (
              <div className="inline-flex items-center gap-4 bg-white px-6 py-3 rounded-lg shadow-md">
                <img 
                  src={currentPlayer.avatar_url} 
                  alt={currentPlayer.username}
                  className="w-10 h-10 rounded-full"
                />
                <div className="text-left">
                  <p className="text-sm text-gray-500">当前角色</p>
                  <p className="text-lg font-bold text-gray-900">
                    {currentPlayer.username}
                  </p>
                </div>
                <button
                  onClick={handleDeselectPlayer}
                  className="ml-4 text-sm text-red-600 hover:text-red-700 hover:underline"
                >
                  切换角色
                </button>
              </div>
            ) : (
              <p className="text-xl text-gray-700">选择你的角色开始游戏</p>
            )}
          </div>

          {/* 检查房间状态提示 */}
          {checkingRoom && (
            <div className="mt-4 inline-flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-lg">
              <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
              <span className="text-sm text-blue-700">正在检查房间状态...</span>
            </div>
          )}
        </div>

        {/* 快速导航 */}
        <div className="max-w-4xl mx-auto mb-8 flex gap-4 justify-center flex-wrap">
          {currentPlayer && (
            <>
              <button
                onClick={() => navigate('/rooms')}
                disabled={checkingRoom}
                className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-colors disabled:opacity-50"
              >
                <Users className="w-5 h-5" />
                进入房间列表
              </button>
              
              <button
                onClick={checkPlayerRoomStatus}
                disabled={checkingRoom}
                className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg transition-colors disabled:opacity-50"
              >
                {checkingRoom ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <RefreshCw className="w-5 h-5" />
                )}
                检查我的房间
              </button>
            </>
          )}
          
          <button
            onClick={() => navigate('/stats')}
            className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-lg transition-colors"
          >
            <TrendingUp className="w-5 h-5" />
            查看战绩
          </button>

          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            刷新列表
          </button>
        </div>

        {/* 玩家网格 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {players.map(player => (
            <PlayerCard
              key={player.id}
              player={player}
              onClick={() => handleSelectPlayer(player)}
              disabled={!!player.current_room_id}
              selected={currentPlayer?.id === player.id}
              size="lg"
              className="transform transition-all"
            />
          ))}
        </div>

        {/* 底部说明 */}
        <div className="mt-12 text-center space-y-2">
          <p className="text-gray-600 text-sm">
            灰色卡片表示玩家已在房间中，无法选择
          </p>
          <p className="text-gray-500 text-xs">
            点击卡片选择你的角色进入房间系统
          </p>
          <p className="text-blue-600 text-xs font-medium">
            💡 提示: 刷新页面会自动恢复您的角色选择和房间状态
          </p>
        </div>
      </div>
    </div>
  );
}
