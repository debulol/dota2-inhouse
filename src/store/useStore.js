import { create } from 'zustand'

/**
 * 全局状态管理
 */
export const useStore = create((set) => ({
  // 当前用户（选中的玩家）
  currentPlayer: null,
  setCurrentPlayer: (player) => set({ currentPlayer: player }),

  // 当前房间
  currentRoom: null,
  setCurrentRoom: (room) => set({ currentRoom: room }),

  // 房间内的玩家列表
  roomPlayers: [],
  setRoomPlayers: (players) => set({ roomPlayers: players }),

  // 所有玩家列表（用于主页显示）
  allPlayers: [],
  setAllPlayers: (players) => set({ allPlayers: players }),

  // 全局加载状态
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),

  // 错误信息
  error: null,
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  // Toast通知
  toast: null,
  showToast: (message, type = 'info') => 
    set({ toast: { message, type, timestamp: Date.now() } }),
  clearToast: () => set({ toast: null }),

  // 重置所有状态
  reset: () => set({
    currentPlayer: null,
    currentRoom: null,
    roomPlayers: [],
    error: null,
    toast: null,
  }),
}))
