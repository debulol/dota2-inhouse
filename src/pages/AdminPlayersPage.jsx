import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useStore } from '@/store/useStore'
import { Loader2, Plus, Edit2, Trash2, ArrowLeft, Save, X } from 'lucide-react'

export function AdminPlayersPage() {
  const navigate = useNavigate()
  const { showToast } = useStore()
  
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingPlayer, setEditingPlayer] = useState(null)
  
  // 表单数据
  const [formData, setFormData] = useState({
    username: '',
    avatar_url: '',
    positions: [],
    favorite_heroes: []
  })

  const POSITIONS = ['Carry', 'Mid', 'Off', 'Support']

  useEffect(() => {
    loadPlayers()
  }, [])

  const loadPlayers = async () => {
    try {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .order('username')

      if (error) throw error
      setPlayers(data || [])
    } catch (error) {
      console.error('加载玩家失败:', error)
      showToast('加载玩家失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (player = null) => {
    if (player) {
      setEditingPlayer(player)
      setFormData({
        username: player.username,
        avatar_url: player.avatar_url || '',
        positions: player.positions || [],
        favorite_heroes: player.favorite_heroes || []
      })
    } else {
      setEditingPlayer(null)
      setFormData({
        username: '',
        avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${Date.now()}`,
        positions: [],
        favorite_heroes: []
      })
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingPlayer(null)
    setFormData({
      username: '',
      avatar_url: '',
      positions: [],
      favorite_heroes: []
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.username.trim()) {
      showToast('请输入玩家名称', 'warning')
      return
    }

    if (formData.positions.length === 0) {
      showToast('请至少选择一个位置', 'warning')
      return
    }

    try {
      if (editingPlayer) {
        // 更新
        const { error } = await supabase
          .from('players')
          .update({
            username: formData.username,
            avatar_url: formData.avatar_url,
            positions: formData.positions
          })
          .eq('id', editingPlayer.id)

        if (error) throw error
        showToast('玩家更新成功', 'success')
      } else {
        // 新增
        const { error } = await supabase
          .from('players')
          .insert([{
            username: formData.username,
            avatar_url: formData.avatar_url,
            positions: formData.positions,
            total_wins: 0,
            total_losses: 0,
            stats_visible: true
          }])

        if (error) throw error
        showToast('玩家添加成功', 'success')
      }

      handleCloseModal()
      loadPlayers()
    } catch (error) {
      console.error('保存玩家失败:', error)
      showToast('保存失败: ' + error.message, 'error')
    }
  }

  const handleDelete = async (player) => {
    if (!confirm(`确定要删除玩家 "${player.username}" 吗?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('players')
        .delete()
        .eq('id', player.id)

      if (error) throw error
      showToast('玩家已删除', 'success')
      loadPlayers()
    } catch (error) {
      console.error('删除玩家失败:', error)
      showToast('删除失败: ' + error.message, 'error')
    }
  }

  const togglePosition = (pos) => {
    setFormData(prev => ({
      ...prev,
      positions: prev.positions.includes(pos)
        ? prev.positions.filter(p => p !== pos)
        : [...prev.positions, pos]
    }))
  }

  const generateRandomAvatar = () => {
    const seed = Math.random().toString(36).substring(7)
    setFormData(prev => ({
      ...prev,
      avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-3xl font-bold">玩家管理</h1>
              <p className="text-gray-600">添加、编辑或删除玩家</p>
            </div>
          </div>

          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            添加新玩家
          </button>
        </div>

        {/* 玩家列表 */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-bold">头像</th>
                <th className="px-6 py-4 text-left text-sm font-bold">名称</th>
                <th className="px-6 py-4 text-left text-sm font-bold">位置</th>
                <th className="px-6 py-4 text-center text-sm font-bold">战绩</th>
                <th className="px-6 py-4 text-center text-sm font-bold">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {players.map(player => (
                <tr key={player.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <img
                      src={player.avatar_url}
                      alt={player.username}
                      className="w-12 h-12 rounded-full"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-bold">{player.username}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1 flex-wrap">
                      {player.positions?.map(pos => (
                        <span
                          key={pos}
                          className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs"
                        >
                          {pos}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm">
                      {player.total_wins}胜 {player.total_losses}负
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleOpenModal(player)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(player)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {players.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              暂无玩家,点击上方按钮添加
            </div>
          )}
        </div>
      </div>

      {/* 添加/编辑模态框 */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <form onSubmit={handleSubmit}>
              {/* 标题 */}
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-xl font-bold">
                  {editingPlayer ? '编辑玩家' : '添加新玩家'}
                </h2>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 表单内容 */}
              <div className="p-6 space-y-4">
                {/* 名称 */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    玩家名称 *
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="输入玩家名称"
                    required
                  />
                </div>

                {/* 头像 */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    头像URL
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.avatar_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, avatar_url: e.target.value }))}
                      className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="头像URL"
                    />
                    <button
                      type="button"
                      onClick={generateRandomAvatar}
                      className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors text-sm"
                    >
                      随机生成
                    </button>
                  </div>
                  {formData.avatar_url && (
                    <img
                      src={formData.avatar_url}
                      alt="预览"
                      className="w-20 h-20 rounded-full mt-2 border-2"
                    />
                  )}
                </div>

                {/* 位置 */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    位置 * (至少选择一个)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {POSITIONS.map(pos => (
                      <button
                        key={pos}
                        type="button"
                        onClick={() => togglePosition(pos)}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                          formData.positions.includes(pos)
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 hover:bg-gray-300'
                        }`}
                      >
                        {pos}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 底部按钮 */}
              <div className="flex gap-3 p-6 border-t">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <Save className="w-4 h-4" />
                  {editingPlayer ? '保存' : '添加'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
