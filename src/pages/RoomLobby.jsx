import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useStore } from '@/store/useStore'
import {
  useRoomSubscription,
  useLeaveRoom,
  useKickPlayer,
  useRollDice
} from '@/hooks/useRoom'
import { supabase } from '@/lib/supabase'
import { PlayerCard } from '@/components/PlayerCard'
import { rollDice, detectTiedSecond } from '@/lib/utils'
import {
  ArrowLeft, Dice5, Crown, Copy, Check,
  UserMinus, Loader2, PlayCircle
} from 'lucide-react'

export function RoomLobby() {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const { currentPlayer, currentRoom, roomPlayers, showToast } = useStore()
  const { loading: subscriptionLoading } = useRoomSubscription(roomId)
  const { leaveRoom } = useLeaveRoom()
  const { kickPlayer } = useKickPlayer()
  const { roll, loading: rolling } = useRollDice()

  const [copied, setCopied] = useState(false)
  const [tiedPlayers, setTiedPlayers] = useState([])

  useEffect(() => {
    if (!currentPlayer) {
      navigate('/')
      return
    }

    // 检查并列第二
    if (roomPlayers.length > 0) {
      const playersWithRolls = roomPlayers.filter(p => p.roll_result)
      const tied = detectTiedSecond(playersWithRolls)
      setTiedPlayers(tied.map(p => p.player_id))
    }
  }, [roomPlayers, currentPlayer, navigate])

  const handleRoll = async () => {
    const result = rollDice()
    const success = await roll(roomId, currentPlayer.id, result)
    
    if (success) {
      showToast(`你Roll到了 ${result} 点！`, 'success')
    } else {
      showToast('Roll点失败', 'error')
    }
  }

  const handleLeave = async () => {
    const success = await leaveRoom(roomId, currentPlayer.id)
    if (success) {
      navigate('/rooms')
    }
  }

  const handleKick = async (playerId) => {
    const success = await kickPlayer(roomId, currentPlayer.id, playerId)
    if (success) {
      showToast('已踢出玩家', 'success')
    } else {
      showToast('踢人失败', 'error')
    }
  }

  const handleCopyRoomCode = async () => {
    try {
      await navigator.clipboard.writeText(currentRoom.room_code)
      setCopied(true)
      showToast('房间号已复制', 'success')
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      showToast('复制失败', 'error')
    }
  }

  const handleStartDraft = async () => {
  // ... 前面的检查逻辑保持不变 ...

  try {
    // 获取按roll点排序的玩家（前两名是队长）
    const sortedByRoll = [...roomPlayers].sort((a, b) => b.roll_result - a.roll_result)
    const captain1 = sortedByRoll[0] // 第一名 → 天辉队长
    const captain2 = sortedByRoll[1] // 第二名 → 夜魇队长

    // 自动将两个队长分配到各自队伍
    await supabase
      .from('room_players')
      .update({ team: 'radiant' })
      .eq('room_id', roomId)
      .eq('player_id', captain1.player_id)

    await supabase
      .from('room_players')
      .update({ team: 'dire' })
      .eq('room_id', roomId)
      .eq('player_id', captain2.player_id)

    // 更新房间状态
    const { error } = await supabase
      .from('rooms')
      .update({ status: 'drafting' })
      .eq('id', roomId)

    if (error) {
      showToast('开始选人失败', 'error')
      return
    }

    showToast('队长已自动分配到各自队伍', 'success')
    navigate(`/room/${roomId}/draft`)
  } catch (error) {
    console.error('Start draft error:', error)
    showToast('开始选人失败', 'error')
  }
}

  if (subscriptionLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
      </div>
    )
  }

  if (!currentRoom) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600 mb-4">房间不存在或已解散</p>
          <button
            onClick={() => navigate('/rooms')}
            className="text-blue-500 hover:underline"
          >
            返回房间列表
          </button>
        </div>
      </div>
    )
  }

  const isHost = currentRoom.host_id === currentPlayer.id
  const currentPlayerData = roomPlayers.find(p => p.player_id === currentPlayer.id)
  const hasRolled = currentPlayerData?.roll_result !== null
  const canStartDraft = isHost && roomPlayers.length === 10 && 
                        roomPlayers.every(p => p.roll_result !== null)

  // 按roll点结果降序排列
  const sortedPlayers = [...roomPlayers].sort((a, b) => {
    if (a.roll_result === null) return 1
    if (b.roll_result === null) return -1
    return b.roll_result - a.roll_result
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* 头部 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleLeave}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-2xl font-bold">{currentRoom.room_name}</h1>
                <p className="text-gray-600 text-sm mt-1">
                  房间号: {currentRoom.room_code} · 
                  {roomPlayers.length}/10 人
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCopyRoomCode}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-5 h-5" />
                    已复制
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5" />
                    复制房间号
                  </>
                )}
              </button>

              {canStartDraft && (
                <button
                  onClick={handleStartDraft}
                  className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  <PlayCircle className="w-5 h-5" />
                  开始选人
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Roll点结果区域 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Dice5 className="w-6 h-6 text-blue-500" />
            Roll点结果
          </h2>

          {sortedPlayers.filter(p => p.roll_result).length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              还没有人Roll点，快来第一个吧！
            </p>
          ) : (
            <div className="space-y-2">
              {sortedPlayers.filter(p => p.roll_result).map((playerData, index) => (
                <div
                  key={playerData.player_id}
                  className={`flex items-center justify-between p-4 rounded-lg ${
                    playerData.is_captain ? 'bg-yellow-50 border-2 border-yellow-400' : 'bg-gray-50'
                  } ${
                    tiedPlayers.includes(playerData.player_id) ? 'ring-2 ring-red-500' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-gray-400 w-8">
                      {index + 1}
                    </span>
                    <img
                      src={playerData.player.avatar_url}
                      alt={playerData.player.username}
                      className="w-10 h-10 rounded-full"
                    />
                    <span className="font-bold text-lg">
                      {playerData.player.username}
                    </span>
                    {playerData.is_captain && (
                      <Crown className="w-5 h-5 text-yellow-600" />
                    )}
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    {playerData.roll_result}
                  </div>
                </div>
              ))}
            </div>
          )}

          {tiedPlayers.length > 0 && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 font-medium">
                ⚠️ 检测到并列第二名，请这些玩家重新Roll点！
              </p>
            </div>
          )}
        </div>

        {/* 玩家列表 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">玩家列表</h2>
            {!hasRolled && (
              <button
                onClick={handleRoll}
                disabled={rolling}
                className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-colors disabled:opacity-50"
              >
                {rolling ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Dice5 className="w-5 h-5" />
                    Roll点
                  </>
                )}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedPlayers.map(playerData => (
              <div key={playerData.player_id} className="relative">
                <PlayerCard
                  player={playerData.player}
                  isCaptain={playerData.is_captain}
                  isReady={playerData.is_ready}
                  showStats={false}
                />
                
                {isHost && playerData.player_id !== currentPlayer.id && (
                  <button
                    onClick={() => handleKick(playerData.player_id)}
                    className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
                    title="踢出玩家"
                  >
                    <UserMinus className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {roomPlayers.length < 10 && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
              <p className="text-blue-700">
                等待更多玩家加入... ({roomPlayers.length}/10)
              </p>
              <p className="text-sm text-blue-600 mt-2">
                分享房间号 <strong>{currentRoom.room_code}</strong> 给你的朋友
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
