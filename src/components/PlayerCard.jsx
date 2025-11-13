import { cn, formatRecord } from '@/lib/utils'
import { getHeroIcon } from '@/data/heroes'
import { User, Crown, Check } from 'lucide-react'

/**
 * 玩家卡片组件
 */
export function PlayerCard({
  player,
  onClick,
  disabled = false,
  selected = false,
  isCaptain = false,
  isReady = false,
  showStats = true,
  showHeroes = true,
  showPositions = true,
  preferredTeam = null,
  size = 'md',
  className
}) {
  const sizeClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  }

  const avatarSizes = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-20 h-20'
  }

  const positionColors = {
    Carry: 'bg-red-100 text-red-700',
    Mid: 'bg-blue-100 text-blue-700',
    Off: 'bg-green-100 text-green-700',
    Support: 'bg-purple-100 text-purple-700'
  }

  const teamBorderColors = {
    radiant: 'border-radiant-500',
    dire: 'border-dire-500'
  }

  return (
    <div
      onClick={!disabled ? onClick : undefined}
      className={cn(
        'bg-white rounded-lg border-2 transition-all duration-200',
        sizeClasses[size],
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-lg hover:scale-105',
        selected && 'ring-2 ring-blue-500',
        preferredTeam && teamBorderColors[preferredTeam],
        !preferredTeam && 'border-gray-200',
        className
      )}
    >
      {/* 头部：头像和状态标志 */}
      <div className="flex items-start gap-3 mb-3">
        <div className="relative">
          {player.avatar_url ? (
            <img
              src={player.avatar_url}
              alt={player.username}
              className={cn('rounded-full', avatarSizes[size])}
            />
          ) : (
            <div className={cn(
              'rounded-full bg-gray-200 flex items-center justify-center',
              avatarSizes[size]
            )}>
              <User className="w-8 h-8 text-gray-400" />
            </div>
          )}
          
          {/* 队长图标 */}
          {isCaptain && (
            <div className="absolute -top-1 -right-1 bg-yellow-400 rounded-full p-1">
              <Crown className="w-4 h-4 text-yellow-900" />
            </div>
          )}
          
          {/* 准备状态 */}
          {isReady && (
            <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1">
              <Check className="w-3 h-3 text-white" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* 用户名 */}
          <h3 className={cn(
            'font-bold truncate',
            size === 'sm' ? 'text-sm' : size === 'md' ? 'text-base' : 'text-lg'
          )}>
            {player.username}
          </h3>

          {/* 战绩 */}
          {showStats && (
            <p className="text-xs text-gray-500 mt-1">
              {formatRecord(player.total_wins, player.total_losses)}
            </p>
          )}
        </div>
      </div>

      {/* 位置标签 */}
      {showPositions && player.positions && player.positions.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {player.positions.map(pos => (
            <span
              key={pos}
              className={cn(
                'text-xs px-2 py-1 rounded-full font-medium',
                positionColors[pos]
              )}
            >
              {pos}
            </span>
          ))}
        </div>
      )}

      {/* 常用英雄 */}
      {showHeroes && player.favorite_heroes && player.favorite_heroes.length > 0 && (
        <div className="flex gap-1 mt-2">
          {player.favorite_heroes.slice(0, 5).map(heroId => (
            <img
              key={heroId}
              src={getHeroIcon(heroId)}
              alt={heroId}
              className="w-8 h-8 rounded-full border border-gray-200"
              title={heroId}
            />
          ))}
        </div>
      )}

      {/* 队伍偏好标签 */}
      {preferredTeam && (
        <div className="mt-2 pt-2 border-t">
          <span className={cn(
            'text-xs font-medium px-2 py-1 rounded',
            preferredTeam === 'radiant' ? 'bg-radiant-100 text-radiant-700' : 'bg-dire-100 text-dire-700'
          )}>
            偏好{preferredTeam === 'radiant' ? '天辉' : '夜魇'}
          </span>
        </div>
      )}
    </div>
  )
}
