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

    // æ£€æŸ¥å¹¶åˆ—ç¬¬äºŒ
    if (roomPlayers.length > 0) {
      const playersWithRolls = roomPlayers.filter(p => p.roll_result)
      const tied = detectTiedSecond(playersWithRolls)
      setTiedPlayers(tied.map(p => p.player_id))
    }
  }, [roomPlayers, currentPlayer, navigate])

  // 🔥 监听房间状态变化,实现自动跳转
  useEffect(() => {
    if (!currentRoom) return
    
    // 当房间状态变为drafting时,自动跳转到选人页面
    if (currentRoom.status === 'drafting') {
      console.log('🎯 检测到房间进入选人阶段,自动跳转到Draft页面')
      navigate(`/room/${roomId}/draft`)
    }
    // 当房间状态变为gaming时,自动跳转到游戏页面
    else if (currentRoom.status === 'gaming') {
      console.log('🎮 检测到房间进入游戏阶段,自动跳转到Game页面')
      navigate(`/room/${roomId}/game`)
    }
  }, [currentRoom?.status, roomId, navigate])

  const handleRoll = async () => {
    const result = rollDice()
    const success = await roll(roomId, currentPlayer.id, result)
    
    if (success) {
      showToast(`ä½ Rollåˆ°äº† ${result} ç‚¹ï¼`, 'success')
    } else {
      showToast('Rollç‚¹å¤±è´¥', 'error')
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
      showToast('å·²è¸¢å‡ºçŽ©å®¶', 'success')
    } else {
      showToast('è¸¢äººå¤±è´¥', 'error')
    }
  }

  const handleCopyRoomCode = async () => {
    try {
      await navigator.clipboard.writeText(currentRoom.room_code)
      setCopied(true)
      showToast('æˆ¿é—´å·å·²å¤åˆ¶', 'success')
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      showToast('å¤åˆ¶å¤±è´¥', 'error')
    }
  }

  const handleStartDraft = async () => {
    // æ£€æŸ¥æ˜¯å¦æ»¡10äºº
    if (roomPlayers.length < 10) {
      showToast('éœ€è¦10äººæ‰èƒ½å¼€å§‹é€‰äºº', 'warning')
      return
    }

    // æ£€æŸ¥æ˜¯å¦éƒ½rolläº†
    const allRolled = roomPlayers.every(p => p.roll_result !== null)
    if (!allRolled) {
      showToast('è¿˜æœ‰çŽ©å®¶æœªRollç‚¹', 'warning')
      return
    }

    // æ›´æ–°æˆ¿é—´çŠ¶æ€
    const { error } = await supabase
      .from('rooms')
      .update({ status: 'drafting' })
      .eq('id', roomId)

    if (error) {
      showToast('å¼€å§‹é€‰äººå¤±è´¥', 'error')
      return
    }

    navigate(`/room/${roomId}/draft`)
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
          <p className="text-xl text-gray-600 mb-4">æˆ¿é—´ä¸å­˜åœ¨æˆ–å·²è§£æ•£</p>
          <button
            onClick={() => navigate('/rooms')}
            className="text-blue-500 hover:underline"
          >
            è¿”å›žæˆ¿é—´åˆ—è¡¨
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

  // æŒ‰rollç‚¹ç»“æžœé™åºæŽ’åˆ—
  const sortedPlayers = [...roomPlayers].sort((a, b) => {
    if (a.roll_result === null) return 1
    if (b.roll_result === null) return -1
    return b.roll_result - a.roll_result
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* å¤´éƒ¨ */}
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
                  æˆ¿é—´å·: {currentRoom.room_code} Â· 
                  {roomPlayers.length}/10 äºº
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
                    å·²å¤åˆ¶
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5" />
                    å¤åˆ¶æˆ¿é—´å·
                  </>
                )}
              </button>

              {canStartDraft && (
                <button
                  onClick={handleStartDraft}
                  className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  <PlayCircle className="w-5 h-5" />
                  å¼€å§‹é€‰äºº
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Rollç‚¹ç»“æžœåŒºåŸŸ */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Dice5 className="w-6 h-6 text-blue-500" />
            Rollç‚¹ç»“æžœ
          </h2>

          {sortedPlayers.filter(p => p.roll_result).length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              è¿˜æ²¡æœ‰äººRollç‚¹ï¼Œå¿«æ¥ç¬¬ä¸€ä¸ªå§ï¼
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
                âš ï¸ æ£€æµ‹åˆ°å¹¶åˆ—ç¬¬äºŒåï¼Œè¯·è¿™äº›çŽ©å®¶é‡æ–°Rollç‚¹ï¼
              </p>
            </div>
          )}
        </div>

        {/* çŽ©å®¶åˆ—è¡¨ */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">çŽ©å®¶åˆ—è¡¨</h2>
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
                    Rollç‚¹
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
                    title="è¸¢å‡ºçŽ©å®¶"
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
                ç­‰å¾…æ›´å¤šçŽ©å®¶åŠ å…¥... ({roomPlayers.length}/10)
              </p>
              <p className="text-sm text-blue-600 mt-2">
                åˆ†äº«æˆ¿é—´å· <strong>{currentRoom.room_code}</strong> ç»™ä½ çš„æœ‹å‹
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
