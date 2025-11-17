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

  const [selectedTeam, setSelectedTeam] = useState(null)
  const [captainsAssigned, setCaptainsAssigned] = useState(false)

  useEffect(() => {
    if (!currentPlayer) {
      navigate('/')
      return
    }
  }, [currentPlayer, navigate])

  // 监听房间状态变化
  useEffect(() => {
    if (!currentRoom) return

    if (currentRoom.status === 'gaming') {
      navigate(`/room/${roomId}/game`)
    } else if (currentRoom.status === 'waiting') {
      navigate(`/room/${roomId}/lobby`)
    }
  }, [currentRoom?.status, roomId, navigate])

  // 🔥 队长自动就位逻辑
  useEffect(() => {
    const assignCaptainsToTeams = async () => {
      if (!roomPlayers || roomPlayers.length === 0) return
      if (captainsAssigned) return // 避免重复执行

      // 找出所有队长
      const captains = roomPlayers.filter(p => p.is_captain)
      
      if (captains.length !== 2) return

      // 按roll点排序,确定哪个是队长1,哪个是队长2
      const sortedCaptains = [...captains].sort((a, b) => 
        (b.roll_result || 0) - (a.roll_result || 0)
      )

      const captain1 = sortedCaptains[0] // roll点最高 → radiant
      const captain2 = sortedCaptains[1] // roll点第二 → dire

      // 检查队长是否已经分配到队伍
      const captain1HasTeam = captain1.team !== null
      const captain2HasTeam = captain2.team !== null

      // 如果两个队长都已经有队伍了,就不需要再分配
      if (captain1HasTeam && captain2HasTeam) {
        setCaptainsAssigned(true)
        return
      }

      console.log('🎯 开始分配队长到队伍...')
      console.log('队长1 (Radiant):', captain1.player.username, 'Roll:', captain1.roll_result)
      console.log('队长2 (Dire):', captain2.player.username, 'Roll:', captain2.roll_result)

      // 分配队长1到天辉
      if (!captain1HasTeam) {
        const success1 = await selectPlayer(roomId, captain1.player_id, 'radiant')
        if (success1) {
          console.log('✅ 队长1已分配到天辉')
        }
      }

      // 分配队长2到夜魇
      if (!captain2HasTeam) {
        const success2 = await selectPlayer(roomId, captain2.player_id, 'dire')
        if (success2) {
          console.log('✅ 队长2已分配到夜魇')
        }
      }

      setCaptainsAssigned(true)
      showToast('队长已自动就位！', 'success')
    }

    assignCaptainsToTeams()
  }, [roomPlayers, roomId, selectPlayer, captainsAssigned, showToast])

  // 加载当前玩家的偏好
  useEffect(() => {
    const current = roomPlayers.find(p => p.player_id === currentPlayer?.id)
    if (current?.preferred_team) {
      setSelectedTeam(current.preferred_team)
    }
  }, [roomPlayers, currentPlayer])

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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-gray-50 to-red-50">
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

          {isCaptain && availablePlayers.length > 0 && (
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
