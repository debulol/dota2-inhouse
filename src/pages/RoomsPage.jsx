import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useStore } from '@/store/useStore'
import { useCreateRoom, useJoinRoom } from '@/hooks/useRoom'
import { getRoomStatusText, formatRelativeTime } from '@/lib/utils'
import { 
  ArrowLeft, Plus, Users, DoorOpen, Loader2, 
  Copy, Check, Search 
} from 'lucide-react'

export function RoomsPage() {
  const navigate = useNavigate()
  const { currentPlayer, showToast } = useStore()
  const { createRoom, loading: creating } = useCreateRoom()
  const { joinRoom, loading: joining } = useJoinRoom()

  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [roomName, setRoomName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [copied, setCopied] = useState(null)

  useEffect(() => {
    if (!currentPlayer) {
      navigate('/')
      return
    }

    loadRooms()

    // 实时订阅房间变化
    const channel = supabase
      .channel('rooms-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'rooms'
      }, () => {
        loadRooms()
      })
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [currentPlayer, navigate])

  const loadRooms = async () => { 
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select(`
          *,
          host:players!rooms_host_id_fkey(username)
        `)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })

      if (error) throw error
      setRooms(data || [])
    } catch (error) {
      console.error('Load rooms error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateRoom = async () => {
    const result = await createRoom(currentPlayer.id, roomName || null)
    
    if (result) {
      showToast('房间创建成功！', 'success')
      setShowCreateModal(false)
      navigate(`/room/${result.room_id}/lobby`)
    } else {
      showToast('创建房间失败', 'error')
    }
  }

  const handleJoinByCode = async () => {
    if (!joinCode.trim()) {
      showToast('请输入房间号', 'warning')
      return
    }

    const roomId = await joinRoom(joinCode.toUpperCase(), currentPlayer.id)
    
    if (roomId) {
      showToast('加入房间成功！', 'success')
      navigate(`/room/${roomId}/lobby`)
    } else {
      showToast('加入房间失败，请检查房间号', 'error')
    }
  }

  const handleJoinRoom = async (room) => {
    const roomId = await joinRoom(room.room_code, currentPlayer.id)
    
    if (roomId) {
      navigate(`/room/${roomId}/lobby`)
    }
  }

  const handleCopyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(code)
      showToast('房间号已复制', 'success')
      setTimeout(() => setCopied(null), 2000)
    } catch (err) {
      showToast('复制失败', 'error')
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
              <h1 className="text-3xl font-bold">房间列表</h1>
              <p className="text-gray-600 mt-1">当前玩家: {currentPlayer.username}</p>
            </div>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            创建房间
          </button>
        </div>

        {/* 快速加入 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Search className="w-5 h-5" />
            快速加入
          </h2>
          <div className="flex gap-3">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="输入6位房间号（如: ABC123）"
              maxLength={6}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
            />
            <button
              onClick={handleJoinByCode}
              disabled={joining}
              className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {joining ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <DoorOpen className="w-5 h-5" />
              )}
              加入
            </button>
          </div>
        </div>

        {/* 房间列表 */}
        <div>
          <h2 className="text-xl font-bold mb-4">所有房间</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rooms.length === 0 ? (
              <div className="col-span-2 text-center py-12 text-gray-500">
                暂无活跃房间，创建一个开始游戏吧！
              </div>
            ) : (
              rooms.map(room => (
                <RoomCard
                  key={room.id}
                  room={room}
                  onJoin={() => handleJoinRoom(room)}
                  onCopy={() => handleCopyCode(room.room_code)}
                  copied={copied === room.room_code}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* 创建房间弹窗 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-6">创建新房间</h2>
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">
                房间名称（可选）
              </label>
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="留空则自动命名为大象内战房X"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreateRoom}
                disabled={creating}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {creating ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  '创建'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function RoomCard({ room, onJoin, onCopy, copied }) {
  const statusColors = {
    waiting: 'bg-green-100 text-green-700',
    drafting: 'bg-yellow-100 text-yellow-700',
    gaming: 'bg-red-100 text-red-700'
  }

  const canJoin = room.player_count < 10 && room.status !== 'gaming'

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold mb-1">{room.room_name}</h3>
          <p className="text-sm text-gray-500">
            房主: {room.host.username} · {formatRelativeTime(room.created_at)}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[room.status]}`}>
          {getRoomStatusText(room.status)}
        </span>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-gray-600">
          <Users className="w-5 h-5" />
          <span className="font-medium">{room.player_count}/10</span>
        </div>

        <button
          onClick={onCopy}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" />
              已复制
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              {room.room_code}
            </>
          )}
        </button>
      </div>

      <button
        onClick={onJoin}
        disabled={!canJoin}
        className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        <DoorOpen className="w-5 h-5" />
        {canJoin ? '加入房间' : room.status === 'gaming' ? '游戏进行中' : '房间已满'}
      </button>
    </div>
  )
}
