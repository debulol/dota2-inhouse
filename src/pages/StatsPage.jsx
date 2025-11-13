import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { calculateWinRate, formatRecord } from '@/lib/utils'
import { Trophy, TrendingUp, Home, Eye, EyeOff, Loader2 } from 'lucide-react'

export function StatsPage() {
  const navigate = useNavigate()
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('stats_visible', true)
        .order('total_wins', { ascending: false })

      if (error) throw error

      // 计算胜率并排序
      const playersWithWinRate = data.map(p => ({
        ...p,
        winRate: calculateWinRate(p.total_wins, p.total_losses),
        totalGames: p.total_wins + p.total_losses
      }))

      // 按胜率降序排序
      playersWithWinRate.sort((a, b) => {
        if (b.totalGames === 0 && a.totalGames === 0) return 0
        if (b.totalGames === 0) return -1
        if (a.totalGames === 0) return 1
        return parseFloat(b.winRate) - parseFloat(a.winRate)
      })

      setPlayers(playersWithWinRate)
    } catch (error) {
      console.error('Load stats error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* 头部 */}
        <div className="bg-white bg-opacity-95 rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <Home className="w-6 h-6" />
              </button>
              <div>
                <div className="flex items-center gap-3">
                  <Trophy className="w-8 h-8 text-yellow-500" />
                  <h1 className="text-3xl font-bold">战绩统计</h1>
                </div>
                <p className="text-gray-600 mt-1">
                  大象公会内战排行榜
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            icon={<Trophy className="w-8 h-8 text-yellow-500" />}
            title="总参赛人数"
            value={players.length}
            subtitle="位玩家"
          />
          <StatCard
            icon={<TrendingUp className="w-8 h-8 text-green-500" />}
            title="总比赛场次"
            value={players.reduce((sum, p) => sum + p.totalGames, 0)}
            subtitle="场比赛"
          />
          <StatCard
            icon={<Trophy className="w-8 h-8 text-blue-500" />}
            title="最高胜率"
            value={players.length > 0 ? `${players[0].winRate}%` : '0%'}
            subtitle={players.length > 0 ? players[0].username : ''}
          />
        </div>

        {/* 排行榜 */}
        <div className="bg-white bg-opacity-95 rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">
                    排名
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">
                    玩家
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">
                    胜场
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">
                    负场
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">
                    总场次
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">
                    胜率
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {players.map((player, index) => (
                  <tr
                    key={player.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {index < 3 ? (
                          <div className={`
                            w-8 h-8 rounded-full flex items-center justify-center font-bold text-white
                            ${index === 0 ? 'bg-yellow-500' : ''}
                            ${index === 1 ? 'bg-gray-400' : ''}
                            ${index === 2 ? 'bg-orange-600' : ''}
                          `}>
                            {index + 1}
                          </div>
                        ) : (
                          <span className="text-gray-600 font-medium ml-2">
                            {index + 1}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={player.avatar_url}
                          alt={player.username}
                          className="w-10 h-10 rounded-full"
                        />
                        <div>
                          <div className="font-bold text-gray-900">
                            {player.username}
                          </div>
                          <div className="text-xs text-gray-500">
                            {player.positions?.join(', ')}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-green-600 font-bold">
                        {player.total_wins}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-red-600 font-bold">
                        {player.total_losses}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="font-medium text-gray-700">
                        {player.totalGames}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex items-center gap-2">
                        <span className={`
                          font-bold text-lg
                          ${parseFloat(player.winRate) >= 60 ? 'text-green-600' : ''}
                          ${parseFloat(player.winRate) >= 50 && parseFloat(player.winRate) < 60 ? 'text-blue-600' : ''}
                          ${parseFloat(player.winRate) < 50 ? 'text-red-600' : ''}
                        `}>
                          {player.winRate}%
                        </span>
                        {parseFloat(player.winRate) >= 60 && (
                          <TrendingUp className="w-4 h-4 text-green-600" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => navigate(`/stats/${player.id}`)}
                        className="text-blue-500 hover:text-blue-700 font-medium transition-colors"
                      >
                        详情
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {players.length === 0 && (
          <div className="bg-white bg-opacity-95 rounded-lg shadow-lg p-12 text-center">
            <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-xl text-gray-500">暂无战绩数据</p>
            <p className="text-sm text-gray-400 mt-2">
              开始第一场比赛来建立排行榜吧！
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ icon, title, value, subtitle }) {
  return (
    <div className="bg-white bg-opacity-95 rounded-lg shadow-lg p-6">
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0">{icon}</div>
        <div className="flex-1">
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  )
}
