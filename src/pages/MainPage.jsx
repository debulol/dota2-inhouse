import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useStore } from '@/store/useStore'
import { PlayerCard } from '@/components/PlayerCard'
import { Users, Loader2 } from 'lucide-react'

export function MainPage() {
  const navigate = useNavigate()
  const { setCurrentPlayer, setAllPlayers, showToast } = useStore()
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPlayers()
    
    // 实时订阅玩家状态变化
    const channel = supabase
      .channel('players-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'players'
      }, () => {
        loadPlayers()
      })
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [])

  const loadPlayers = async () => {
    try {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .order('username')

      if (error) throw error
      setPlayers(data || [])
      setAllPlayers(data || [])
    } catch (error) {
      console.error('Load players error:', error)
      showToast('加载玩家列表失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectPlayer = (player) => {
    if (player.current_room_id) {
      showToast('该玩家已在房间中', 'warning')
      return
    }

    setCurrentPlayer(player)
    navigate('/rooms')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* 标题区域 */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Users className="w-12 h-12 text-blue-600 mr-3" />
            <h1 className="text-5xl font-bold text-gray-900">大象公会内战系统</h1>
          </div>
          <p className="text-xl text-gray-700 mt-4">选择你的角色开始游戏</p>
        </div>

        {/* 玩家网格 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {players.map(player => (
            <PlayerCard
              key={player.id}
              player={player}
              onClick={() => handleSelectPlayer(player)}
              disabled={!!player.current_room_id}
              size="lg"
              className="transform transition-all"
            />
          ))}
        </div>

        {/* 底部说明 */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 text-sm">
            灰色卡片表示玩家已在房间中，无法选择
          </p>
          <p className="text-gray-500 text-xs mt-2">
            点击卡片选择你的角色进入房间系统
          </p>
        </div>
      </div>
    </div>
  )
}
