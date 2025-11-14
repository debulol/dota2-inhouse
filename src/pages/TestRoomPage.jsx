import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { rollDice } from '@/lib/utils'
import { Loader2, Users, Dice5, PlayCircle, Trash2, RefreshCw } from 'lucide-react'

/**
 * 测试工具页面 - 模拟10个玩家进行测试
 */
export function TestRoomPage() {
  const [loading, setLoading] = useState(false)
  const [testRoom, setTestRoom] = useState(null)
  const [testPlayers, setTestPlayers] = useState([])
  const [roomPlayers, setRoomPlayers] = useState([])
  const [status, setStatus] = useState('')

  // 订阅房间变化
  useEffect(() => {
    if (!testRoom) return

    const channel = supabase
      .channel(`test_room:${testRoom.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'room_players',
        filter: `room_id=eq.${testRoom.id}`
      }, async () => {
        await loadRoomPlayers()
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'rooms',
        filter: `id=eq.${testRoom.id}`
      }, async (payload) => {
        if (payload.eventType === 'UPDATE') {
          setTestRoom(payload.new)
        }
      })
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [testRoom?.id])

  const loadRoomPlayers = async () => {
    if (!testRoom) return

    const { data } = await supabase
      .from('room_players')
      .select(`
        *,
        player:players(*)
      `)
      .eq('room_id', testRoom.id)
      .order('join_order')

    if (data) {
      setRoomPlayers(data)
    }
  }

  // 步骤1: 创建测试房间
  const createTestRoom = async () => {
    setLoading(true)
    setStatus('正在创建测试房间...')

    try {
      // 获取第一个玩家作为房主
      const { data: players } = await supabase
        .from('players')
        .select('*')
        .limit(10)

      if (!players || players.length < 10) {
        alert('数据库中的玩家不足10个，请先创建足够的玩家')
        return
      }

      setTestPlayers(players)

      // 创建房间
      const { data: roomData } = await supabase.rpc('create_room', {
        p_host_id: players[0].id,
        p_room_name: '测试房间 - 自动化测试'
      })

      const newRoom = roomData[0]

      // 获取房间详情
      const { data: room } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', newRoom.room_id)
        .single()

      setTestRoom(room)
      setStatus(`测试房间已创建: ${room.room_code}`)
    } catch (error) {
      console.error('创建测试房间失败:', error)
      setStatus(`错误: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // 步骤2: 让10个玩家加入房间
  const joinAllPlayers = async () => {
    if (!testRoom) {
      alert('请先创建测试房间')
      return
    }

    setLoading(true)
    setStatus('正在加入10个玩家...')

    try {
      // 跳过第一个（已经是房主了），加入其他9个
      for (let i = 1; i < testPlayers.length; i++) {
        const player = testPlayers[i]
        
        await supabase.rpc('join_room', {
          p_room_code: testRoom.room_code,
          p_player_id: player.id
        })

        setStatus(`已加入 ${i}/9 个玩家...`)
        await new Promise(resolve => setTimeout(resolve, 200)) // 稍微延迟避免过快
      }

      await loadRoomPlayers()
      setStatus('所有玩家已加入房间！')
    } catch (error) {
      console.error('加入玩家失败:', error)
      setStatus(`错误: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // 步骤3: 所有玩家自动roll点
  const rollAllPlayers = async () => {
    if (!testRoom || roomPlayers.length < 10) {
      alert('请先让10个玩家加入房间')
      return
    }

    setLoading(true)
    setStatus('正在为所有玩家roll点...')

    try {
      for (let i = 0; i < roomPlayers.length; i++) {
        const playerData = roomPlayers[i]
        const result = rollDice()

        await supabase
          .from('room_players')
          .update({
            roll_result: result,
            is_ready: true
          })
          .eq('room_id', testRoom.id)
          .eq('player_id', playerData.player_id)

        setStatus(`Roll点进度: ${i + 1}/10 - ${playerData.player.username} roll了 ${result}`)
        await new Promise(resolve => setTimeout(resolve, 300))
      }

      // 设置队长
      const { data: allPlayers } = await supabase
        .from('room_players')
        .select('player_id, roll_result')
        .eq('room_id', testRoom.id)
        .not('roll_result', 'is', null)
        .order('roll_result', { ascending: false })

      if (allPlayers && allPlayers.length >= 2) {
        // 先清除所有队长
        await supabase
          .from('room_players')
          .update({ is_captain: false })
          .eq('room_id', testRoom.id)

        // 设置前两名为队长
        await supabase
          .from('room_players')
          .update({ is_captain: true })
          .eq('room_id', testRoom.id)
          .in('player_id', [allPlayers[0].player_id, allPlayers[1].player_id])
      }

      await loadRoomPlayers()
      setStatus('所有玩家roll点完成！前两名已设为队长')
    } catch (error) {
      console.error('Roll点失败:', error)
      setStatus(`错误: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // 步骤4: 进入选人阶段
  const startDraft = async () => {
  // ... 检查逻辑 ...

  try {
    await loadRoomPlayers()
    
    // 获取按roll点排序的玩家（前两名是队长）
    const sortedByRoll = [...roomPlayers].sort((a, b) => (b.roll_result || 0) - (a.roll_result || 0))
    const captain1 = sortedByRoll[0] // 第一名 → 天辉队长
    const captain2 = sortedByRoll[1] // 第二名 → 夜魇队长

    // 自动将两个队长分配到各自队伍
    await supabase
      .from('room_players')
      .update({ team: 'radiant' })
      .eq('room_id', testRoom.id)
      .eq('player_id', captain1.player_id)

    await supabase
      .from('room_players')
      .update({ team: 'dire' })
      .eq('room_id', testRoom.id)
      .eq('player_id', captain2.player_id)

    setStatus('队长已自动分配到各自队伍')
    
    // 更新房间状态
    await supabase
      .from('rooms')
      .update({ status: 'drafting' })
      .eq('id', testRoom.id)

    setStatus('已进入选人阶段！')
  } catch (error) {
    // ... 错误处理 ...
  }
}

  // 自动选人 - 队长1选奇数位，队长2选偶数位
  const autoSelectPlayers = async () => {
  // ... 检查逻辑 ...

  try {
    await loadRoomPlayers()

    // 获取未分配队伍的玩家（应该是8个，因为2个队长已经在队伍中了）
    const unassignedPlayers = roomPlayers.filter(p => !p.team)

    // 交替分配到两队
    for (let i = 0; i < unassignedPlayers.length; i++) {
      const player = unassignedPlayers[i]
      const team = i % 2 === 0 ? 'radiant' : 'dire'

      await supabase
        .from('room_players')
        .update({ team })
        .eq('room_id', testRoom.id)
        .eq('player_id', player.player_id)

      setStatus(`选人进度: ${i + 1}/${unassignedPlayers.length} - ${player.player.username} → ${team === 'radiant' ? '天辉' : '夜魇'}`)
    }

    setStatus('自动选人完成！')
  } catch (error) {
    // ... 错误处理 ...
  }
}

  // 开始游戏
  const startGame = async () => {
    if (!testRoom) {
      alert('请先创建房间')
      return
    }

    setLoading(true)
    setStatus('正在开始游戏...')

    try {
      await supabase
        .from('rooms')
        .update({ status: 'gaming' })
        .eq('id', testRoom.id)

      setStatus('游戏已开始！')
    } catch (error) {
      console.error('开始游戏失败:', error)
      setStatus(`错误: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // 清理测试房间
  const cleanupTestRoom = async () => {
    if (!testRoom) return

    if (!confirm('确定要清理测试房间吗？')) return

    setLoading(true)
    setStatus('正在清理...')

    try {
      // 删除所有 room_players
      await supabase
        .from('room_players')
        .delete()
        .eq('room_id', testRoom.id)

      // 更新所有玩家的 current_room_id
      for (const player of testPlayers) {
        await supabase
          .from('players')
          .update({ current_room_id: null })
          .eq('id', player.id)
      }

      // 删除房间
      await supabase
        .from('rooms')
        .delete()
        .eq('id', testRoom.id)

      setTestRoom(null)
      setRoomPlayers([])
      setStatus('测试房间已清理')
    } catch (error) {
      console.error('清理失败:', error)
      setStatus(`错误: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // 一键完成所有步骤
  const autoComplete = async () => {
    await createTestRoom()
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    await joinAllPlayers()
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    await rollAllPlayers()
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    await startDraft()
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    await autoSelectPlayers()
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setStatus('✅ 所有步骤已自动完成！现在可以手动测试或开始游戏')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* 标题 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold mb-2">🧪 房间测试工具</h1>
          <p className="text-gray-600">
            自动模拟10个玩家进行房间、roll点、选人测试
          </p>
        </div>

        {/* 状态显示 */}
        {status && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              {loading && <Loader2 className="w-5 h-5 animate-spin text-blue-600" />}
              <p className="text-blue-800 font-medium">{status}</p>
            </div>
          </div>
        )}

        {/* 房间信息 */}
        {testRoom && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">测试房间信息</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">房间名称</p>
                <p className="font-bold">{testRoom.room_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">房间号</p>
                <p className="font-bold text-blue-600">{testRoom.room_code}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">当前状态</p>
                <p className="font-bold">
                  {testRoom.status === 'waiting' && '等待中'}
                  {testRoom.status === 'drafting' && '选人中'}
                  {testRoom.status === 'gaming' && '游戏中'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">玩家数量</p>
                <p className="font-bold">{roomPlayers.length}/10</p>
              </div>
            </div>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* 一键完成 */}
          <button
            onClick={autoComplete}
            disabled={loading || testRoom}
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white p-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center gap-2"
          >
            <RefreshCw className="w-8 h-8" />
            <span className="font-bold text-lg">一键自动测试</span>
            <span className="text-sm opacity-90">创建房间 → 加入玩家 → Roll点 → 选人</span>
          </button>

          {/* 清理 */}
          <button
            onClick={cleanupTestRoom}
            disabled={loading || !testRoom}
            className="bg-red-500 hover:bg-red-600 text-white p-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center gap-2"
          >
            <Trash2 className="w-8 h-8" />
            <span className="font-bold text-lg">清理测试房间</span>
            <span className="text-sm opacity-90">删除房间和所有数据</span>
          </button>
        </div>

        {/* 分步操作 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">分步操作</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <button
              onClick={createTestRoom}
              disabled={loading || testRoom}
              className="flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
            >
              <Users className="w-5 h-5" />
              1. 创建房间
            </button>

            <button
              onClick={joinAllPlayers}
              disabled={loading || !testRoom || roomPlayers.length >= 10}
              className="flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
            >
              <Users className="w-5 h-5" />
              2. 加入10人
            </button>

            <button
              onClick={rollAllPlayers}
              disabled={loading || roomPlayers.length < 10}
              className="flex items-center justify-center gap-2 bg-purple-500 hover:bg-purple-600 text-white py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
            >
              <Dice5 className="w-5 h-5" />
              3. 全部Roll点
            </button>

            <button
              onClick={startDraft}
              disabled={loading || !testRoom || testRoom.status !== 'waiting'}
              className="flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
            >
              <PlayCircle className="w-5 h-5" />
              4. 开始选人
            </button>

            <button
              onClick={autoSelectPlayers}
              disabled={loading || !testRoom || testRoom.status !== 'drafting'}
              className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
            >
              <Users className="w-5 h-5" />
              5. 自动选人
            </button>

            <button
              onClick={startGame}
              disabled={loading || !testRoom || testRoom.status === 'gaming'}
              className="flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
            >
              <PlayCircle className="w-5 h-5" />
              6. 开始游戏
            </button>
          </div>
        </div>

        {/* 玩家列表 */}
        {roomPlayers.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">房间内玩家</h2>
            <div className="space-y-2">
              {roomPlayers
                .sort((a, b) => (b.roll_result || 0) - (a.roll_result || 0))
                .map((playerData, index) => (
                  <div
                    key={playerData.player_id}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      playerData.team === 'radiant' ? 'bg-green-50' :
                      playerData.team === 'dire' ? 'bg-red-50' :
                      'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-gray-400 w-6">
                        {index + 1}
                      </span>
                      <img
                        src={playerData.player.avatar_url}
                        alt={playerData.player.username}
                        className="w-10 h-10 rounded-full"
                      />
                      <span className="font-bold">
                        {playerData.player.username}
                      </span>
                      {playerData.is_captain && (
                        <span className="bg-yellow-400 text-yellow-900 text-xs px-2 py-1 rounded-full font-bold">
                          队长
                        </span>
                      )}
                      {playerData.team && (
                        <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                          playerData.team === 'radiant' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                        }`}>
                          {playerData.team === 'radiant' ? '天辉' : '夜魇'}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      {playerData.roll_result && (
                        <span className="text-2xl font-bold text-blue-600">
                          {playerData.roll_result}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
