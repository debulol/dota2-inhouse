import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useStore } from '@/store/useStore'

/**
 * 实时订阅房间数据
 */
export function useRoomSubscription(roomId) {
  const { setCurrentRoom, setRoomPlayers } = useStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!roomId) {
      setLoading(false)
      return
    }

    let roomChannel
    let playersChannel

    const setupSubscriptions = async () => {
      try {
        // 获取初始房间数据
        const { data: room } = await supabase
          .from('rooms')
          .select('*')
          .eq('id', roomId)
          .single()

        if (room) {
          setCurrentRoom(room)
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
        }

        setLoading(false)

        // 订阅房间变化
        roomChannel = supabase
          .channel(`room:${roomId}`)
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'rooms',
            filter: `id=eq.${roomId}`
          }, (payload) => {
            if (payload.eventType === 'UPDATE') {
              setCurrentRoom(payload.new)
            } else if (payload.eventType === 'DELETE') {
              setCurrentRoom(null)
            }
          })
          .subscribe()

        // 订阅房间玩家变化
        playersChannel = supabase
          .channel(`room_players:${roomId}`)
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'room_players',
            filter: `room_id=eq.${roomId}`
          }, async () => {
            // 重新获取玩家列表
            const { data } = await supabase
              .from('room_players')
              .select(`
                *,
                player:players(*)
              `)
              .eq('room_id', roomId)
              .order('join_order')

            if (data) {
              setRoomPlayers(data)
            }
          })
          .subscribe()

      } catch (error) {
        console.error('Setup subscriptions error:', error)
        setLoading(false)
      }
    }

    setupSubscriptions()

    // 清理订阅
    return () => {
      if (roomChannel) roomChannel.unsubscribe()
      if (playersChannel) playersChannel.unsubscribe()
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
 * 退出房间
 */
export function useLeaveRoom() {
  const [loading, setLoading] = useState(false)
  const { showToast } = useStore()

  const leaveRoom = async (roomId, playerId) => {
    if (!roomId || !playerId) {
      showToast('退出房间失败：房间或玩家信息缺失', 'error')
      return false
    }

    setLoading(true)
    const { data, error } = await supabase.rpc('leave_room', {
      p_room_id: roomId,
      p_player_id: playerId,
    })
    setLoading(false)

    if (error) {
      console.error('leave_room error:', error)
      showToast(`退出房间失败：${error.message}`, 'error')
      return false
    }

    // ⚠️ 函数返回 TABLE(success boolean, message text)
    // Supabase 会返回一个数组：[{ success, message }]
    const result = Array.isArray(data) ? data[0] : data

    if (!result?.success) {
      showToast(result?.message || '退出房间失败', 'error')
      return false
    }

    showToast(result.message || '已退出房间', 'success')
    return true
  }

  return { leaveRoom, loading }
}

/**
 * 踢出玩家
 */
export function useKickPlayer() {
  const [loading, setLoading] = useState(false)

  const kickPlayer = useCallback(async (roomId, hostId, targetPlayerId) => {
    setLoading(true)

    try {
      const { data, error } = await supabase.rpc('kick_player', {
        p_room_id: roomId,
        p_host_id: hostId,
        p_target_player_id: targetPlayerId
      })

      if (error) throw error
      
      const result = data[0]
      return result.success
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

      // 检查是否所有人都roll了，如果是，自动设置队长
      const { data: allPlayers } = await supabase
        .from('room_players')
        .select('player_id, roll_result')
        .eq('room_id', roomId)
        .not('roll_result', 'is', null)
        .order('roll_result', { ascending: false })

      if (allPlayers && allPlayers.length >= 2) {
        // 设置前两名为队长
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
 * 选择队员
 */
export function useSelectPlayer() {
  const [loading, setLoading] = useState(false)

  const selectPlayer = useCallback(async (roomId, playerId, team) => {
    setLoading(true)

    try {
      const { error } = await supabase
        .from('room_players')
        .update({ team })
        .eq('room_id', roomId)
        .eq('player_id', playerId)

      if (error) throw error
      return true
    } catch (err) {
      console.error('Select player error:', err)
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
