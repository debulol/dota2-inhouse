import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * 合并Tailwind CSS类名
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

/**
 * 计算胜率
 */
export function calculateWinRate(wins, losses) {
  const total = wins + losses
  if (total === 0) return 0
  return ((wins / total) * 100).toFixed(1)
}

/**
 * 格式化战绩显示
 */
export function formatRecord(wins, losses) {
  const winRate = calculateWinRate(wins, losses)
  return `${wins}-${losses} (${winRate}%)`
}

/**
 * 生成随机Roll点结果（1-100）
 */
export function rollDice() {
  return Math.floor(Math.random() * 100) + 1
}

/**
 * 检测并列第二名
 * @param {Array} rolls - 已排序的roll点结果数组
 * @returns {Array} - 并列第二的玩家数组
 */
export function detectTiedSecond(rolls) {
  if (rolls.length < 2) return []
  
  const sortedRolls = [...rolls].sort((a, b) => b.roll_result - a.roll_result)
  const firstMax = sortedRolls[0].roll_result
  const secondMax = sortedRolls[1].roll_result
  
  // 如果第一名和第二名相同，不处理（让第一名和第三名并列）
  if (firstMax === secondMax) return []
  
  // 找出所有和第二名相同点数的玩家
  const tiedPlayers = sortedRolls.filter(p => p.roll_result === secondMax)
  
  return tiedPlayers.length > 1 ? tiedPlayers : []
}

/**
 * 获取房间状态的中文显示
 */
export function getRoomStatusText(status) {
  const statusMap = {
    waiting: '等待中',
    drafting: '选人中',
    gaming: '游戏中'
  }
  return statusMap[status] || status
}

/**
 * 获取队伍名称的中文显示
 */
export function getTeamName(team) {
  return team === 'radiant' ? '天辉' : '夜魇'
}

/**
 * 复制文本到剪贴板
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (err) {
    console.error('Failed to copy:', err)
    return false
  }
}

/**
 * 格式化日期时间
 */
export function formatDateTime(dateString) {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * 格式化相对时间（如：2小时前）
 */
export function formatRelativeTime(dateString) {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now - date
  
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  if (days > 0) return `${days}天前`
  if (hours > 0) return `${hours}小时前`
  if (minutes > 0) return `${minutes}分钟前`
  return '刚刚'
}
