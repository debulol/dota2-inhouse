import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useStore } from '@/store/useStore'
import { useRoomSubscription, useFinishMatch } from '@/hooks/useRoom'
import { PlayerCard } from '@/components/PlayerCard'
import { Trophy, Loader2, Home } from 'lucide-react'

export function GamePage() {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const { currentPlayer, currentRoom, roomPlayers, showToast } = useStore()
  const { loading: subscriptionLoading } = useRoomSubscription(roomId)
  const { finishMatch, loading: finishing } = useFinishMatch()

  useEffect(() => {
    if (!currentPlayer) {
      navigate('/')
      return
    }

    if (currentRoom && currentRoom.status === 'waiting') {
      navigate(`/room/${roomId}/lobby`)
    }
  }, [currentRoom, currentPlayer, roomId, navigate])

  const handleFinishMatch = async (winner) => {
    const success = await finishMatch(roomId, winner)
    
    if (success) {
      showToast('战绩已更新！', 'success')
      // 延迟一下再跳转，让玩家看到结果
      setTimeout(() => {
        navigate(`/room/${roomId}/lobby`)
      }, 1500)
    } else {
      showToast('更新战绩失败', 'error')
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

  const radiantPlayers = roomPlayers.filter(p => p.team === 'radiant')
  const direPlayers = roomPlayers.filter(p => p.team === 'dire')
  const isHost = currentRoom.host_id === currentPlayer.id

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-gray-50 to-red-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* 头部 */}
        <div className="bg-white bg-opacity-95 rounded-lg shadow-lg p-6 mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Trophy className="w-8 h-8 text-yellow-500" />
            <h1 className="text-3xl font-bold">游戏进行中</h1>
          </div>
          <p className="text-gray-600">
            {currentRoom.room_name} · 房间将在比赛结束后重置
          </p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 flex items-center gap-2 mx-auto text-gray-600 hover:text-gray-900 transition-colors"
          >
            <Home className="w-4 h-4" />
            返回主页
          </button>
        </div>

        {/* 队伍对战展示 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* 天辉队 */}
          <div className="bg-radiant-50 bg-opacity-90 rounded-lg shadow-lg p-8 border-4 border-radiant-500">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-radiant-700">天辉</h2>
              <div className="mt-2 h-1 w-20 bg-radiant-500 mx-auto rounded-full"></div>
            </div>
            <div className="space-y-4">
              {radiantPlayers.map(playerData => (
                <PlayerCard
                  key={playerData.player_id}
                  player={playerData.player}
                  isCaptain={playerData.is_captain}
                  size="lg"
                  className="transform hover:scale-105 transition-transform"
                />
              ))}
            </div>
          </div>

          {/* 夜魇队 */}
          <div className="bg-dire-50 bg-opacity-90 rounded-lg shadow-lg p-8 border-4 border-dire-500">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-dire-700">夜魇</h2>
              <div className="mt-2 h-1 w-20 bg-dire-500 mx-auto rounded-full"></div>
            </div>
            <div className="space-y-4">
              {direPlayers.map(playerData => (
                <PlayerCard
                  key={playerData.player_id}
                  player={playerData.player}
                  isCaptain={playerData.is_captain}
                  size="lg"
                  className="transform hover:scale-105 transition-transform"
                />
              ))}
            </div>
          </div>
        </div>

        {/* 房主操作区 */}
        {isHost && (
          <div className="bg-white bg-opacity-95 rounded-lg shadow-lg p-8">
            <h3 className="text-2xl font-bold text-center mb-6">
              比赛结果（房主操作）
            </h3>
            <div className="flex gap-6 justify-center">
              <button
                onClick={() => handleFinishMatch('radiant')}
                disabled={finishing}
                className="flex-1 max-w-xs bg-radiant-500 hover:bg-radiant-600 text-white py-6 px-8 rounded-xl text-2xl font-bold transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {finishing ? (
                  <Loader2 className="w-8 h-8 animate-spin mx-auto" />
                ) : (
                  <>
                    <Trophy className="w-8 h-8 mx-auto mb-2" />
                    天辉胜利
                  </>
                )}
              </button>

              <button
                onClick={() => handleFinishMatch('dire')}
                disabled={finishing}
                className="flex-1 max-w-xs bg-dire-500 hover:bg-dire-600 text-white py-6 px-8 rounded-xl text-2xl font-bold transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {finishing ? (
                  <Loader2 className="w-8 h-8 animate-spin mx-auto" />
                ) : (
                  <>
                    <Trophy className="w-8 h-8 mx-auto mb-2" />
                    夜魇胜利
                  </>
                )}
              </button>
            </div>
            <p className="text-center text-sm text-gray-600 mt-6">
              点击对应按钮记录比赛结果并更新战绩
            </p>
          </div>
        )}

        {!isHost && (
          <div className="bg-white bg-opacity-95 rounded-lg shadow-lg p-8 text-center">
            <p className="text-lg text-gray-700">
              等待房主（{roomPlayers.find(p => p.player_id === currentRoom.host_id)?.player.username}）记录比赛结果...
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
