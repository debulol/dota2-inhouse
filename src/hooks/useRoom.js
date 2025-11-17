import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useStore } from '@/store/useStore'

/**
 * 实时订阅房间数据 - 修复版本
 * 
 * 主要改进：
 * 1. 合并到单一 channel，避免多 channel 冲突
 * 2. 添加详细的调试日志
 * 3. 使用唯一的 channel 名称
 * 4. 添加订阅状态回调
 */
export function useRoomSubscription(roomId) {
  const { setCurrentRoom, setRoomPlayers } = useStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!roomId) {
      setLoading(false)
      return
    }

    let channel

    const setupSubscription = async () => {
      try {
        console.log('🔌 正在建立房间订阅...', roomId)

        // 获取初始房间数据
        const { data: room } = await supabase
          .from('rooms')
          .select('*')
          .eq('id', roomId)
          .single()

        if (room) {
          setCurrentRoom(room)
          console.log('✅ 初始房间数据已加载:', room.room_name)
        }

        // 获取初始玩家列表
        const { data: players } = await supabase
          .from('room_players')
          .select(`
            *,
            player:players(*)
          `)
          .eq('room_id', roomId)
          .order('join_order')

        if (players) {
          setRoomPlayers(players)
          console.log('✅ 初始玩家列表已加载:', players.length, '人')
        }

        setLoading(false)

        // 创建一个统一的 channel，使用唯一的名称
        const channelName = `room-${roomId}-${Date.now()}`
        console.log('📡 创建 Realtime Channel:', channelName)

        channel = supabase
          .channel(channelName)
          // 订阅房间表的变化
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'rooms',
              filter: `id=eq.${roomId}`
            },
            (payload) => {
              console.log('🔔 房间更新事件:', payload.eventType)
              if (payload.eventType === 'UPDATE') {
                setCurrentRoom(payload.new)
                console.log('✅ 房间状态已更新:', payload.new.status)
              } else if (payload.eventType === 'DELETE') {
                setCurrentRoom(null)
                console.log('⚠️ 房间已删除')
              }
            }
          )
          // 订阅房间玩家表的变化
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'room_players',
              filter: `room_id=eq.${roomId}`
            },
            async (payload) => {
              console.log('🔔 玩家列表更新事件:', payload.eventType, payload.new || payload.old)
              
              // 重新获取完整的玩家列表
              const { data, error } = await supabase
                .from('room_players')
                .select(`
                  *,
                  player:players(*)
                `)
                .eq('room_id', roomId)
                .order('join_order')

              if (error) {
                console.error('❌ 获取玩家列表失败:', error)
                return
              }

              if (data) {
                setRoomPlayers(data)
                console.log('✅ 玩家列表已刷新:', data.length, '人', 
                  data.filter(p => p.team).map(p => `${p.player.username}(${p.team})`))
              }
            }
          )
          .subscribe((status) => {
            console.log('📡 订阅状态:', status)
            if (status === 'SUBSCRIBED') {
              console.log('✅ Realtime 订阅成功!')
            } else if (status === 'CHANNEL_ERROR') {
              console.error('❌ Realtime 订阅失败!')
            }
          })

      } catch (error) {
        console.error('❌ 建立订阅失败:', error)
        setLoading(false)
      }
    }

    setupSubscription()

    // 清理订阅
    return () => {
      if (channel) {
        console.log('🔌 正在清理订阅...')
        channel.unsubscribe()
      }
    }
  }, [roomId, setCurrentRoom, setRoomPlayers])

  return { loading }
}

/**
 * 创建房间
 */
export function useCreateRoom() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const createRoom = useCallback(async (hostId, roomName = null) => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: rpcError } = await supabase.rpc('create_room', {
        p_host_id: hostId,
        p_room_name: roomName
      })

      if (rpcError) throw rpcError

      return data[0] // { room_id, room_code }
    } catch (err) {
      console.error('Create room error:', err)
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return { createRoom, loading, error }
}

/**
 * 加入房间
 */
export function useJoinRoom() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const joinRoom = useCallback(async (roomCode, playerId) => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: rpcError } = await supabase.rpc('join_room', {
        p_room_code: roomCode,
        p_player_id: playerId
      })

      if (rpcError) throw rpcError

      const result = data[0]
      if (!result.success) {
        throw new Error(result.message)
      }

      return result.room_id
    } catch (err) {
      console.error('Join room error:', err)
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return { joinRoom, loading, error }
}

/**
 * 退出房间 - 改进版本
 * 方案1：直接操作数据库(推荐)
 */
export function useLeaveRoom() {
  const [loading, setLoading] = useState(false)
  const { showToast } = useStore()

  const leaveRoom = async (roomId, playerId) => {
    if (!roomId || !playerId) {
      showToast('退出房间失败:房间或玩家信息缺失', 'error')
      return false
    }

    setLoading(true)
    
    try {
      // 方案1:直接删除 room_players 记录(这会触发 Realtime 事件)
      const { error: deleteError } = await supabase
        .from('room_players')
        .delete()
        .eq('room_id', roomId)
        .eq('player_id', playerId)

      if (deleteError) throw deleteError

      // 更新玩家的 current_room_id
      const { error: updateError } = await supabase
        .from('players')
        .update({ current_room_id: null })
        .eq('id', playerId)

      if (updateError) throw updateError

      // 检查房间是否还有玩家,如果没有则删除房间
      const { data: remainingPlayers, error: checkError } = await supabase
        .from('room_players')
        .select('player_id')
        .eq('room_id', roomId)

      if (checkError) throw checkError

      if (!remainingPlayers || remainingPlayers.length === 0) {
        // 房间没人了,删除房间
        await supabase
          .from('rooms')
          .delete()
          .eq('id', roomId)
      }

      showToast('已退出房间', 'success')
      return true

    } catch (error) {
      console.error('Leave room error:', error)
      showToast(`退出房间失败:${error.message}`, 'error')
      return false
    } finally {
      setLoading(false)
    }
  }

  return { leaveRoom, loading }
}

/**
 * 踢出玩家 - 改进版本
 */
export function useKickPlayer() {
  const [loading, setLoading] = useState(false)

  const kickPlayer = useCallback(async (roomId, hostId, targetPlayerId) => {
    setLoading(true)

    try {
      // 方案1:直接删除(推荐)
      const { error: deleteError } = await supabase
        .from('room_players')
        .delete()
        .eq('room_id', roomId)
        .eq('player_id', targetPlayerId)

      if (deleteError) throw deleteError

      // 更新被踢玩家的 current_room_id
      await supabase
        .from('players')
        .update({ current_room_id: null })
        .eq('id', targetPlayerId)

      return true
    } catch (err) {
      console.error('Kick player error:', err)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  return { kickPlayer, loading }
}

/**
 * Roll点
 */
export function useRollDice() {
  const [loading, setLoading] = useState(false)

  const roll = useCallback(async (roomId, playerId, result) => {
    setLoading(true)

    try {
      const { error } = await supabase
        .from('room_players')
        .update({
          roll_result: result,
          is_ready: true
        })
        .eq('room_id', roomId)
        .eq('player_id', playerId)

      if (error) throw error

      // 检查是否所有人都roll了,如果是,自动设置队长
      const { data: allPlayers } = await supabase
        .from('room_players')
        .select('player_id, roll_result')
        .eq('room_id', roomId)
        .not('roll_result', 'is', null)
        .order('roll_result', { ascending: false })

      if (allPlayers && allPlayers.length >= 2) {
        // 先清除所有队长标记
        await supabase
          .from('room_players')
          .update({ is_captain: false })
          .eq('room_id', roomId)
        
        // 然后设置前两名为队长
        await supabase
          .from('room_players')
          .update({ is_captain: true })
          .eq('room_id', roomId)
          .in('player_id', [allPlayers[0].player_id, allPlayers[1].player_id])
      }

      return true
    } catch (err) {
      console.error('Roll dice error:', err)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  return { roll, loading }
}

/**
 * 选择队员 - 添加调试日志
 */
export function useSelectPlayer() {
  const [loading, setLoading] = useState(false)

  const selectPlayer = useCallback(async (roomId, playerId, team) => {
    setLoading(true)
    console.log('🎯 正在选择玩家:', { roomId, playerId, team })

    try {
      const { error } = await supabase
        .from('room_players')
        .update({ team })
        .eq('room_id', roomId)
        .eq('player_id', playerId)

      if (error) throw error
      
      console.log('✅ 选择成功!')
      return true
    } catch (err) {
      console.error('❌ Select player error:', err)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  return { selectPlayer, loading }
}

/**
 * 设置队伍偏好
 */
export function useSetPreference() {
  const [loading, setLoading] = useState(false)

  const setPreference = useCallback(async (roomId, playerId, preferredTeam) => {
    setLoading(true)

    try {
      const { error } = await supabase
        .from('room_players')
        .update({ preferred_team: preferredTeam })
        .eq('room_id', roomId)
        .eq('player_id', playerId)

      if (error) throw error
      return true
    } catch (err) {
      console.error('Set preference error:', err)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  return { setPreference, loading }
}

/**
 * 开始游戏
 */
export function useStartGame() {
  const [loading, setLoading] = useState(false)

  const startGame = useCallback(async (roomId) => {
    setLoading(true)

    try {
      // 验证双方都是5人
      const { data: teams } = await supabase
        .from('room_players')
        .select('team')
        .eq('room_id', roomId)
        .not('team', 'is', null)

      const radiantCount = teams.filter(t => t.team === 'radiant').length
      const direCount = teams.filter(t => t.team === 'dire').length

      if (radiantCount !== 5 || direCount !== 5) {
        throw new Error('双方队伍人数不足5人')
      }

      // 更新房间状态
      const { error } = await supabase
        .from('rooms')
        .update({ status: 'gaming' })
        .eq('id', roomId)

      if (error) throw error
      return true
    } catch (err) {
      console.error('Start game error:', err)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  return { startGame, loading }
}

/**
 * 完成比赛
 */
export function useFinishMatch() {
  const [loading, setLoading] = useState(false)

  const finishMatch = useCallback(async (roomId, winner) => {
    setLoading(true)

    try {
      const { data, error } = await supabase.rpc('finish_match', {
        p_room_id: roomId,
        p_winner: winner
      })

      if (error) throw error
      
      const result = data[0]
      return result.success
    } catch (err) {
      console.error('Finish match error:', err)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  return { finishMatch, loading }
}