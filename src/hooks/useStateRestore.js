// src/hooks/useStateRestore.js
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { supabase } from '@/lib/supabase';

/**
 * 页面刷新后自动恢复用户状态的 Hook
 * 
 * 功能：
 * 1. 恢复玩家选择
 * 2. 恢复房间状态
 * 3. 自动跳转到正确的页面
 * 4. 验证数据库中的状态是否仍然有效
 */
export function useStateRestore() {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    currentPlayer,
    currentRoom,
    setCurrentPlayer, 
    setCurrentRoom,
    getStoredIds,
    showToast 
  } = useStore();
  
  const [restoring, setRestoring] = useState(true);
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    // 只在首次加载时恢复状态
    if (!restored) {
      restoreState();
    }
  }, []);

  const restoreState = async () => {
    console.log('🔄 开始恢复状态...');
    
    try {
      // 获取 localStorage 中保存的 ID
      const { playerId, roomId } = getStoredIds();
      
      console.log('📦 localStorage 数据:', { playerId, roomId });

      // ========== 步骤1: 恢复玩家选择 ==========
      if (playerId && !currentPlayer) {
        const player = await restorePlayer(playerId);
        
        if (player) {
          // ========== 步骤2: 恢复房间状态 ==========
          if (roomId) {
            await restoreRoom(roomId, playerId);
          }
        }
      } else if (currentPlayer) {
        console.log('✅ 玩家已在状态中:', currentPlayer.username);
        
        // 即使玩家已恢复，也检查房间
        if (roomId && !currentRoom) {
          await restoreRoom(roomId, currentPlayer.id);
        }
      }

    } catch (error) {
      console.error('❌ 恢复状态失败:', error);
      showToast('恢复状态失败', 'error');
    } finally {
      setRestoring(false);
      setRestored(true);
      console.log('✅ 状态恢复完成');
    }
  };

  /**
   * 恢复玩家数据
   */
  const restorePlayer = async (playerId) => {
    try {
      console.log('🔍 正在从数据库恢复玩家...', playerId);
      
      const { data: player, error } = await supabase
        .from('players')
        .select('*')
        .eq('id', playerId)
        .single();

      if (error) throw error;

      if (player) {
        setCurrentPlayer(player);
        console.log('✅ 玩家已恢复:', player.username);
        showToast(`欢迎回来，${player.username}!`, 'success');
        return player;
      } else {
        console.warn('⚠️ 玩家不存在，清除 localStorage');
        localStorage.removeItem('currentPlayerId');
        localStorage.removeItem('currentPlayerData');
        return null;
      }
    } catch (error) {
      console.error('❌ 恢复玩家失败:', error);
      localStorage.removeItem('currentPlayerId');
      localStorage.removeItem('currentPlayerData');
      return null;
    }
  };

  /**
   * 恢复房间数据
   */
  const restoreRoom = async (roomId, playerId) => {
    try {
      console.log('🔍 正在验证房间状态...', roomId);
      
      // 1. 检查玩家是否仍在房间中
      const { data: roomPlayer, error: rpError } = await supabase
        .from('room_players')
        .select('room_id')
        .eq('room_id', roomId)
        .eq('player_id', playerId)
        .single();

      if (rpError || !roomPlayer) {
        console.warn('⚠️ 玩家已不在房间中，清除房间记录');
        localStorage.removeItem('currentRoomId');
        localStorage.removeItem('currentRoomData');
        setCurrentRoom(null);
        return null;
      }

      // 2. 获取房间信息
      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', roomId)
        .single();

      if (roomError || !room) {
        console.warn('⚠️ 房间不存在，清除房间记录');
        localStorage.removeItem('currentRoomId');
        localStorage.removeItem('currentRoomData');
        setCurrentRoom(null);
        return null;
      }

      // 3. 恢复房间状态
      setCurrentRoom(room);
      console.log('✅ 房间已恢复:', room.room_name, '状态:', room.status);

      // 4. 如果当前不在房间相关页面，自动跳转
      const shouldRedirect = !location.pathname.includes(roomId);
      
      if (shouldRedirect) {
        const targetPath = getRoomPath(roomId, room.status);
        console.log('🔀 自动跳转到:', targetPath);
        showToast(`正在恢复到房间: ${room.room_name}`, 'info');
        navigate(targetPath, { replace: true });
      } else {
        console.log('✅ 已在房间页面，无需跳转');
      }

      return room;

    } catch (error) {
      console.error('❌ 恢复房间失败:', error);
      localStorage.removeItem('currentRoomId');
      localStorage.removeItem('currentRoomData');
      setCurrentRoom(null);
      return null;
    }
  };

  /**
   * 根据房间状态返回正确的路径
   */
  const getRoomPath = (roomId, status) => {
    switch (status) {
      case 'waiting':
        return `/room/${roomId}/lobby`;
      case 'drafting':
        return `/room/${roomId}/draft`;
      case 'gaming':
        return `/room/${roomId}/game`;
      default:
        return `/room/${roomId}/lobby`;
    }
  };

  return { restoring, restored };
}

/**
 * 手动触发状态恢复（用于特殊场景）
 */
export async function manualRestoreState() {
  const { 
    setCurrentPlayer, 
    setCurrentRoom,
    getStoredIds 
  } = useStore.getState();
  
  const { playerId, roomId } = getStoredIds();
  
  if (playerId) {
    const { data: player } = await supabase
      .from('players')
      .select('*')
      .eq('id', playerId)
      .single();
    
    if (player) {
      setCurrentPlayer(player);
    }
  }
  
  if (roomId && playerId) {
    const { data: roomPlayer } = await supabase
      .from('room_players')
      .select('room_id')
      .eq('room_id', roomId)
      .eq('player_id', playerId)
      .single();
    
    if (roomPlayer) {
      const { data: room } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', roomId)
        .single();
      
      if (room) {
        setCurrentRoom(room);
        return room;
      }
    }
  }
  
  return null;
}