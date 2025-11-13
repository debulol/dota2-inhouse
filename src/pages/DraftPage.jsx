import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useStore } from '@/store/useStore'
import {
  useRoomSubscription,
  useSelectPlayer,
  useSetPreference,
  useStartGame
} from '@/hooks/useRoom'
import { PlayerCard } from '@/components/PlayerCard'
import { PlayCircle, Loader2, ArrowLeft } from 'lucide-react'

export function DraftPage() {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const { currentPlayer, currentRoom, roomPlayers, showToast } = useStore()
  const { loading: subscriptionLoading } = useRoomSubscription(roomId)
  const { selectPlayer } = useSelectPlayer()
  const { setPreference } = useSetPreference()
  const { startGame, loading: startingGame } = useStartGame()

  const [selectedTeam, setSelectedTeam] = useState(null) // 当前用户选择的偏好队伍

  useEffect(() => {
    if (!currentPlayer) {
      navigate('/')
      return
    }

    if (currentRoom && currentRoom.status === 'gaming') {
      navigate(`/room/${roomId}/game`)
    }

    // 加载当前玩家的偏好
    const current = roomPlayers.find(p => p.player_id === currentPlayer.id)
    if (current?.preferred_team) {
      setSelectedTeam(current.preferred_team)
    }
  }, [currentRoom, currentPlayer, roomPlayers, roomId, navigate])

  const handleSelectPlayer = async (playerId, team) => {
    const success = await selectPlayer(roomId, playerId, team)
    if (success) {
      showToast('选择成功', 'success')
    } else {
      showToast('选择失败', 'error')
    }
  }

  const handleTogglePreference = async (team) => {
    const newPreference = selectedTeam === team ? null : team
    const success = await setPreference(roomId, currentPlayer.id, newPreference)
    
    if (success) {
      setSelectedTeam(newPreference)
      showToast(
        newPreference ? `已设置偏好${team === 'radiant' ? '天辉' : '夜魇'}` : '已取消偏好',
        'success'
      )
    }
  }

  const handleStartGame = async () => {
    const success = await startGame(roomId)
    if (success) {
      showToast('游戏开始！', 'success')
      navigate(`/room/${roomId}/game`)
    } else {
      showToast('开始游戏失败，请确保双方都是5人', 'error')
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
          <p className="text-xl text-gray-600 mb-4">房间不存在</p>
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

  // 分组玩家
  const radiantPlayers = roomPlayers.filter(p => p.team === 'radiant')
  const direPlayers = roomPlayers.filter(p => p.team === 'dire')
  const availablePlayers = roomPlayers.filter(p => !p.team && p.is_ready)
  
  const captains = roomPlayers.filter(p => p.is_captain)
  const currentPlayerData = roomPlayers.find(p => p.player_id === currentPlayer.id)
  const isCaptain = currentPlayerData?.is_captain
  const myTeam = currentPlayerData?.team

  const isHost = currentRoom.host_id === currentPlayer.id
  const canStartGame = isHost && radiantPlayers.length === 5 && direPlayers.length === 5

  return (
    <div className="min-h-screen bg-gradient-to-br from-radiant-900 via-gray-900 to-dire-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* 头部 */}
        <div className="bg-white bg-opacity-95 rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(`/room/${roomId}/lobby`)}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-2xl font-bold">选人阶段</h1>
                <p className="text-gray-600 text-sm mt-1">
                  {currentRoom.room_name} · {isCaptain ? '你是队长' : '等待队长选人'}
                </p>
              </div>
            </div>

            {canStartGame && (
              <button
                onClick={handleStartGame}
                disabled={startingGame}
                className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg transition-colors disabled:opacity-50"
              >
                {startingGame ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <PlayCircle className="w-5 h-5" />
                    开始游戏
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* 已选队员区域 */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          {/* 天辉队 */}
          <div className="bg-radiant-50 bg-opacity-90 rounded-lg shadow-lg p-6 border-2 border-radiant-500">
            <h2 className="text-2xl font-bold text-radiant-700 mb-4 text-center">
              天辉 ({radiantPlayers.length}/5)
            </h2>
            <div className="space-y-3">
              {[...Array(5)].map((_, index) => {
                const player = radiantPlayers[index]
                return (
                  <div key={index} className="min-h-[120px]">
                    {player ? (
                      <PlayerCard
                        player={player.player}
                        isCaptain={player.is_captain}
                        size="md"
                      />
                    ) : (
                      <div className="h-full border-2 border-dashed border-radiant-300 rounded-lg flex items-center justify-center text-radiant-400">
                        空位
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* 夜魇队 */}
          <div className="bg-dire-50 bg-opacity-90 rounded-lg shadow-lg p-6 border-2 border-dire-500">
            <h2 className="text-2xl font-bold text-dire-700 mb-4 text-center">
              夜魇 ({direPlayers.length}/5)
            </h2>
            <div className="space-y-3">
              {[...Array(5)].map((_, index) => {
                const player = direPlayers[index]
                return (
                  <div key={index} className="min-h-[120px]">
                    {player ? (
                      <PlayerCard
                        player={player.player}
                        isCaptain={player.is_captain}
                        size="md"
                      />
                    ) : (
                      <div className="h-full border-2 border-dashed border-dire-300 rounded-lg flex items-center justify-center text-dire-400">
                        空位
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* 待选队员区域 */}
        <div className="bg-white bg-opacity-95 rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">待选队员</h2>
            
            {/* 偏好设置按钮（仅非队长显示） */}
            {!isCaptain && !myTeam && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleTogglePreference('radiant')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    selectedTeam === 'radiant'
                      ? 'bg-radiant-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  偏好天辉
                </button>
                <button
                  onClick={() => handleTogglePreference('dire')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    selectedTeam === 'dire'
                      ? 'bg-dire-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  偏好夜魇
                </button>
              </div>
            )}
          </div>

          {availablePlayers.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              所有队员已选完
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {availablePlayers.map(playerData => (
                <div key={playerData.player_id} className="relative">
                  <PlayerCard
                    player={playerData.player}
                    preferredTeam={playerData.preferred_team}
                    onClick={
                      isCaptain
                        ? () => handleSelectPlayer(playerData.player_id, myTeam)
                        : undefined
                    }
                    disabled={!isCaptain}
                    className={isCaptain ? 'cursor-pointer' : 'cursor-default'}
                  />
                </div>
              ))}
            </div>
          )}

          {isCaptain && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
              <p className="text-blue-700 font-medium">
                点击队员卡片将其加入你的队伍
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
