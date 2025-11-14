// src/store/useStore.js - 增强版（带状态持久化）
import { create } from 'zustand';

/**
 * 全局状态管理 - 带 localStorage 持久化
 */
export const useStore = create((set, get) => ({
  // ==================== 状态 ====================
  
  // 当前用户（选中的玩家）
  currentPlayer: null,
  
  // 当前房间
  currentRoom: null,
  
  // 房间内的玩家列表
  roomPlayers: [],
  
  // 所有玩家列表（用于主页显示）
  allPlayers: [],
  
  // 全局加载状态
  isLoading: false,
  
  // 错误信息
  error: null,
  
  // Toast通知
  toast: null,

  // ==================== Actions ====================
  
  /**
   * 设置当前玩家（自动保存到 localStorage）
   */
  setCurrentPlayer: (player) => {
    set({ currentPlayer: player });
    
    // 持久化到 localStorage
    if (player) {
      localStorage.setItem('currentPlayerId', player.id);
      localStorage.setItem('currentPlayerData', JSON.stringify(player));
      console.log('✅ 已保存玩家到 localStorage:', player.username);
    } else {
      localStorage.removeItem('currentPlayerId');
      localStorage.removeItem('currentPlayerData');
      console.log('🗑️ 已清除 localStorage 中的玩家信息');
    }
  },

  /**
   * 设置当前房间（自动保存到 localStorage）
   */
  setCurrentRoom: (room) => {
    set({ currentRoom: room });
    
    // 持久化到 localStorage
    if (room) {
      localStorage.setItem('currentRoomId', room.id);
      localStorage.setItem('currentRoomData', JSON.stringify(room));
      console.log('✅ 已保存房间到 localStorage:', room.room_name);
    } else {
      localStorage.removeItem('currentRoomId');
      localStorage.removeItem('currentRoomData');
      console.log('🗑️ 已清除 localStorage 中的房间信息');
    }
  },

  /**
   * 设置房间玩家列表
   */
  setRoomPlayers: (players) => set({ roomPlayers: players }),

  /**
   * 设置所有玩家列表
   */
  setAllPlayers: (players) => set({ allPlayers: players }),

  /**
   * 设置加载状态
   */
  setIsLoading: (loading) => set({ isLoading: loading }),

  /**
   * 设置错误信息
   */
  setError: (error) => set({ error }),
  
  /**
   * 清除错误信息
   */
  clearError: () => set({ error: null }),

  /**
   * 显示 Toast 通知
   */
  showToast: (message, type = 'info') => 
    set({ toast: { message, type, timestamp: Date.now() } }),
  
  /**
   * 清除 Toast 通知
   */
  clearToast: () => set({ toast: null }),

  /**
   * 重置房间相关状态（但保留玩家选择）
   */
  reset: () => {
    const currentPlayer = get().currentPlayer;
    
    set({
      currentRoom: null,
      roomPlayers: [],
      error: null,
      toast: null,
    });
    
    // 清除房间相关的 localStorage
    localStorage.removeItem('currentRoomId');
    localStorage.removeItem('currentRoomData');
    
    // 保留玩家选择
    if (currentPlayer) {
      localStorage.setItem('currentPlayerId', currentPlayer.id);
      localStorage.setItem('currentPlayerData', JSON.stringify(currentPlayer));
    }
    
    console.log('🔄 已重置房间状态，保留玩家选择');
  },

  /**
   * 完全清空所有状态（包括玩家选择）
   */
  clearAll: () => {
    set({
      currentPlayer: null,
      currentRoom: null,
      roomPlayers: [],
      allPlayers: [],
      error: null,
      toast: null,
    });
    
    // 清除所有 localStorage
    localStorage.removeItem('currentPlayerId');
    localStorage.removeItem('currentPlayerData');
    localStorage.removeItem('currentRoomId');
    localStorage.removeItem('currentRoomData');
    
    console.log('🗑️ 已清空所有状态和 localStorage');
  },

  /**
   * 从 localStorage 恢复玩家状态
   */
  restorePlayerFromStorage: () => {
    try {
      const playerId = localStorage.getItem('currentPlayerId');
      const playerDataStr = localStorage.getItem('currentPlayerData');
      
      if (playerId && playerDataStr) {
        const playerData = JSON.parse(playerDataStr);
        set({ currentPlayer: playerData });
        console.log('✅ 从 localStorage 恢复玩家:', playerData.username);
        return playerData;
      }
      
      return null;
    } catch (error) {
      console.error('❌ 恢复玩家状态失败:', error);
      // 清除损坏的数据
      localStorage.removeItem('currentPlayerId');
      localStorage.removeItem('currentPlayerData');
      return null;
    }
  },

  /**
   * 从 localStorage 恢复房间状态
   */
  restoreRoomFromStorage: () => {
    try {
      const roomId = localStorage.getItem('currentRoomId');
      const roomDataStr = localStorage.getItem('currentRoomData');
      
      if (roomId && roomDataStr) {
        const roomData = JSON.parse(roomDataStr);
        set({ currentRoom: roomData });
        console.log('✅ 从 localStorage 恢复房间:', roomData.room_name);
        return roomData;
      }
      
      return null;
    } catch (error) {
      console.error('❌ 恢复房间状态失败:', error);
      // 清除损坏的数据
      localStorage.removeItem('currentRoomId');
      localStorage.removeItem('currentRoomData');
      return null;
    }
  },

  /**
   * 获取 localStorage 中保存的 ID
   */
  getStoredIds: () => {
    return {
      playerId: localStorage.getItem('currentPlayerId'),
      roomId: localStorage.getItem('currentRoomId'),
    };
  },
}));

// ==================== 导出便捷函数 ====================

/**
 * 检查是否有保存的玩家
 */
export function hasStoredPlayer() {
  return !!localStorage.getItem('currentPlayerId');
}

/**
 * 检查是否有保存的房间
 */
export function hasStoredRoom() {
  return !!localStorage.getItem('currentRoomId');
}

/**
 * 获取保存的玩家ID
 */
export function getStoredPlayerId() {
  return localStorage.getItem('currentPlayerId');
}

/**
 * 获取保存的房间ID
 */
export function getStoredRoomId() {
  return localStorage.getItem('currentRoomId');
}

/**
 * 清除所有 localStorage 数据
 */
export function clearAllStorage() {
  localStorage.removeItem('currentPlayerId');
  localStorage.removeItem('currentPlayerData');
  localStorage.removeItem('currentRoomId');
  localStorage.removeItem('currentRoomData');
  console.log('🗑️ 已清除所有 localStorage 数据');
}
