import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { calculateWinRate, formatDateTime } from '@/lib/utils'
import { 
  ArrowLeft, Trophy, Users, TrendingUp, 
  Calendar, Eye, EyeOff, Loader2 
} from 'lucide-react'

export function PlayerStatsPage() {
  const { playerId } = useParams()
  const navigate = useNavigate()
  
  const [player, setPlayer] = useState(null)
  const [matches, setMatches] = useState([])
  const [teammates, setTeammates] = useState([])
  const [loading, setLoading] = useState(true)
  const [updatingVisibility, setUpdatingVisibility] = useState(false)

  useEffect(() => {
    loadPlayerStats()
  }, [playerId])

  const loadPlayerStats = async () => {
    try {
      // 加载玩家信息
      const { data: playerData, error: playerError } = await supabase
        .from('players')
        .select('*')
        .eq('id', playerId)
        .single()

      if (playerError) throw playerError
      setPlayer(playerData)

      // 加载比赛记录
      const { data: matchData, error: matchError } = await supabase
        .from('matches')
        .select('*')
        .or(`radiant_players.cs.{${playerId}},dire_players.cs.{${playerId}}`)
        .order('ended_at', { ascending: false })
        .limit(20)

      if (matchError) throw matchError
      setMatches(matchData || [])

      // 计算队友组合胜率
      const teammateStats = {}
      
      for (const match of matchData || []) {
        const isRadiant = match.radiant_players.includes(playerId)
        const teamMates = isRadiant ? match.radiant_players : match.dire_players
        const won = (isRadiant && match.winner === 'radiant') || 
                    (!isRadiant && match.winner === 'dire')
        
        for (const mateId of teamMates) {
          if (mateId !== playerId) {
            if (!teammateStats[mateId]) {
              teammateStats[mateId] = { wins: 0, total: 0, playerId: mateId }
            }
            teammateStats[mateId].total++
            if (won) teammateStats[mateId].wins++
          }
        }
      }

      // 获取队友信息并计算胜率
      const teammateIds = Object.keys(teammateStats)
      if (teammateIds.length > 0) {
        const { data: playersData } = await supabase
          .from('players')
          .select('id, username, avatar_url')
          .in('id', teammateIds)

        const teammatesWithStats = playersData.map(p => ({
          ...p,
          ...teammateStats[p.id],
          winRate: calculateWinRate(teammateStats[p.id].wins, teammateStats[p.id].total - teammateStats[p.id].wins)
        }))

        // 按总场次排序
        teammatesWithStats.sort((a, b) => b.total - a.total)
        setTeammates(teammatesWithStats)
      }

    } catch (error) {
      console.error('Load player stats error:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleStatsVisibility = async () => {
    setUpdatingVisibility(true)
    try {
      const newVisibility = !player.stats_visible
      
      const { error } = await supabase
        .from('players')
        .update({ stats_visible: newVisibility })
        .eq('id', playerId)

      if (error) throw error

      setPlayer({ ...player, stats_visible: newVisibility })
    } catch (error) {
      console.error('Toggle visibility error:', error)
    } finally {
      setUpdatingVisibility(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
      </div>
    )
  }

  if (!player) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600 mb-4">玩家不存在</p>
          <button
            onClick={() => navigate('/stats')}
            className="text-blue-500 hover:underline"
          >
            返回战绩页
          </button>
        </div>
      </div>
    )
  }

  const totalGames = player.total_wins + player.total_losses
  const winRate = calculateWinRate(player.total_wins, player.total_losses)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* 头部 */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/stats')}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-3xl font-bold">玩家详情</h1>
        </div>

        {/* 玩家信息卡片 */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-6">
              <img
                src={player.avatar_url}
                alt={player.username}
                className="w-24 h-24 rounded-full border-4 border-blue-500"
              />
              <div>
                <h2 className="text-3xl font-bold mb-2">{player.username}</h2>
                <div className="flex flex-wrap gap-2 mb-3">
                  {player.positions?.map(pos => (
                    <span
                      key={pos}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                    >
                      {pos}
                    </span>
                  ))}
                </div>
                <div className="flex gap-6 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{totalGames} 场比赛</span>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={toggleStatsVisibility}
              disabled={updatingVisibility}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {updatingVisibility ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : player.stats_visible ? (
                <>
                  <Eye className="w-4 h-4" />
                  显示战绩
                </>
              ) : (
                <>
                  <EyeOff className="w-4 h-4" />
                  隐藏战绩
                </>
              )}
            </button>
          </div>

          {/* 战绩统计 */}
          <div className="grid grid-cols-3 gap-6 mt-8 pt-8 border-t">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">胜场</p>
              <p className="text-4xl font-bold text-green-600">
                {player.total_wins}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">负场</p>
              <p className="text-4xl font-bold text-red-600">
                {player.total_losses}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">胜率</p>
              <p className={`text-4xl font-bold ${
                parseFloat(winRate) >= 60 ? 'text-green-600' :
                parseFloat(winRate) >= 50 ? 'text-blue-600' :
                'text-red-600'
              }`}>
                {winRate}%
              </p>
            </div>
          </div>
        </div>

        {/* 队友组合胜率 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-500" />
            队友组合胜率
          </h3>
          
          {teammates.length === 0 ? (
            <p className="text-center text-gray-500 py-8">暂无组合数据</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">
                      队友
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-bold text-gray-700">
                      胜场
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-bold text-gray-700">
                      总场
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-bold text-gray-700">
                      组合胜率
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {teammates.map(mate => (
                    <tr key={mate.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={mate.avatar_url}
                            alt={mate.username}
                            className="w-8 h-8 rounded-full"
                          />
                          <span className="font-medium">{mate.username}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-green-600 font-bold">
                        {mate.wins}
                      </td>
                      <td className="px-4 py-3 text-center font-medium">
                        {mate.total}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-bold ${
                          parseFloat(mate.winRate) >= 60 ? 'text-green-600' :
                          parseFloat(mate.winRate) >= 50 ? 'text-blue-600' :
                          'text-red-600'
                        }`}>
                          {mate.winRate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 近期比赛 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" />
            近期比赛（最近20场）
          </h3>
          
          {matches.length === 0 ? (
            <p className="text-center text-gray-500 py-8">暂无比赛记录</p>
          ) : (
            <div className="space-y-3">
              {matches.map(match => {
                const isRadiant = match.radiant_players.includes(playerId)
                const won = (isRadiant && match.winner === 'radiant') || 
                            (!isRadiant && match.winner === 'dire')
                
                return (
                  <div
                    key={match.id}
                    className={`p-4 rounded-lg border-2 ${
                      won ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`
                          px-4 py-2 rounded-lg font-bold text-lg
                          ${won ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}
                        `}>
                          {won ? '胜利' : '失败'}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {isRadiant ? '天辉方' : '夜魇方'}
                          </p>
                          <p className="text-sm text-gray-600">
                            {formatDateTime(match.ended_at)}
                          </p>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">
                        5 vs 5
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
