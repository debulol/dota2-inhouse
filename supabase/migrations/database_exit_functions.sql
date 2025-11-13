-- =====================================================
-- 房间退出和删除相关数据库函数
-- =====================================================

-- 如果您已经有 leave_room 函数，以下是改进版本
-- 如果没有，请完整执行以下 SQL

-- =====================================================
-- 函数1: 退出房间 (改进版)
-- =====================================================
CREATE OR REPLACE FUNCTION leave_room(
  p_room_id UUID,
  p_player_id UUID
)
RETURNS TABLE(success BOOLEAN, message TEXT) AS $$
DECLARE
  v_is_host BOOLEAN;
  v_new_host_id UUID;
  v_player_count INT;
  v_room_status TEXT;
BEGIN
  -- 检查房间是否存在
  IF NOT EXISTS (SELECT 1 FROM rooms WHERE id = p_room_id) THEN
    RETURN QUERY SELECT FALSE, '房间不存在'::TEXT;
    RETURN;
  END IF;

  -- 检查玩家是否在房间中
  IF NOT EXISTS (
    SELECT 1 FROM room_players 
    WHERE room_id = p_room_id AND player_id = p_player_id
  ) THEN
    RETURN QUERY SELECT FALSE, '您不在此房间中'::TEXT;
    RETURN;
  END IF;

  -- 获取房间状态
  SELECT status INTO v_room_status FROM rooms WHERE id = p_room_id;

  -- 如果游戏进行中，不允许退出（可选规则）
  -- 如果您希望游戏中也能退出，可以注释掉这段
  IF v_room_status = 'gaming' THEN
    RETURN QUERY SELECT FALSE, '游戏进行中无法退出'::TEXT;
    RETURN;
  END IF;

  -- 检查是否是房主
  SELECT host_id = p_player_id INTO v_is_host
  FROM rooms WHERE id = p_room_id;
  
  -- 删除玩家的roll点记录（如果有）
  DELETE FROM roll_results 
  WHERE room_id = p_room_id AND player_id = p_player_id;
  
  -- 删除玩家的房间关系
  DELETE FROM room_players 
  WHERE room_id = p_room_id AND player_id = p_player_id;
  
  -- 更新玩家的当前房间状态
  UPDATE players 
  SET current_room_id = NULL, updated_at = NOW()
  WHERE id = p_player_id;
  
  -- 更新房间人数
  UPDATE rooms 
  SET player_count = player_count - 1, updated_at = NOW()
  WHERE id = p_room_id;
  
  -- 获取当前人数
  SELECT player_count INTO v_player_count 
  FROM rooms WHERE id = p_room_id;
  
  -- 如果是房主退出
  IF v_is_host THEN
    -- 如果房间还有人，随机选择新房主
    IF v_player_count > 0 THEN
      SELECT player_id INTO v_new_host_id
      FROM room_players
      WHERE room_id = p_room_id
      ORDER BY join_order ASC  -- 按加入顺序，最早加入的成为新房主
      LIMIT 1;
      
      UPDATE rooms 
      SET host_id = v_new_host_id, updated_at = NOW()
      WHERE id = p_room_id;
      
      RETURN QUERY SELECT TRUE, '已退出，房主已转移'::TEXT;
    ELSE
      -- 房间空了，自动删除
      DELETE FROM rooms WHERE id = p_room_id;
      RETURN QUERY SELECT TRUE, '房间已解散'::TEXT;
    END IF;
  ELSE
    -- 普通玩家退出
    RETURN QUERY SELECT TRUE, '退出成功'::TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 函数2: 房主删除房间
-- =====================================================
CREATE OR REPLACE FUNCTION delete_room_by_host(
  p_room_id UUID,
  p_host_id UUID
)
RETURNS TABLE(success BOOLEAN, message TEXT) AS $$
DECLARE
  v_actual_host_id UUID;
  v_player_count INT;
BEGIN
  -- 检查房间是否存在
  SELECT host_id, player_count 
  INTO v_actual_host_id, v_player_count
  FROM rooms 
  WHERE id = p_room_id;
  
  IF v_actual_host_id IS NULL THEN
    RETURN QUERY SELECT FALSE, '房间不存在'::TEXT;
    RETURN;
  END IF;

  -- 验证是否是房主
  IF v_actual_host_id != p_host_id THEN
    RETURN QUERY SELECT FALSE, '只有房主才能删除房间'::TEXT;
    RETURN;
  END IF;

  -- 清除所有玩家的当前房间关联
  UPDATE players 
  SET current_room_id = NULL, updated_at = NOW()
  WHERE current_room_id = p_room_id;

  -- 删除房间的roll点记录
  DELETE FROM roll_results WHERE room_id = p_room_id;

  -- 删除房间玩家关系
  DELETE FROM room_players WHERE room_id = p_room_id;

  -- 删除房间
  DELETE FROM rooms WHERE id = p_room_id;

  RETURN QUERY SELECT TRUE, 
    '房间已删除，共' || v_player_count::TEXT || '名玩家被移除'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 函数3: 踢出玩家 (房主专用，可选功能)
-- =====================================================
CREATE OR REPLACE FUNCTION kick_player(
  p_room_id UUID,
  p_host_id UUID,
  p_target_player_id UUID
)
RETURNS TABLE(success BOOLEAN, message TEXT) AS $$
DECLARE
  v_actual_host_id UUID;
  v_room_status TEXT;
BEGIN
  -- 验证房间和房主
  SELECT host_id, status 
  INTO v_actual_host_id, v_room_status
  FROM rooms 
  WHERE id = p_room_id;
  
  IF v_actual_host_id IS NULL THEN
    RETURN QUERY SELECT FALSE, '房间不存在'::TEXT;
    RETURN;
  END IF;

  IF v_actual_host_id != p_host_id THEN
    RETURN QUERY SELECT FALSE, '只有房主才能踢人'::TEXT;
    RETURN;
  END IF;

  -- 不能踢自己
  IF p_target_player_id = p_host_id THEN
    RETURN QUERY SELECT FALSE, '不能踢出自己'::TEXT;
    RETURN;
  END IF;

  -- 检查目标玩家是否在房间中
  IF NOT EXISTS (
    SELECT 1 FROM room_players 
    WHERE room_id = p_room_id AND player_id = p_target_player_id
  ) THEN
    RETURN QUERY SELECT FALSE, '该玩家不在房间中'::TEXT;
    RETURN;
  END IF;

  -- 删除玩家的roll点记录
  DELETE FROM roll_results 
  WHERE room_id = p_room_id AND player_id = p_target_player_id;

  -- 删除玩家
  DELETE FROM room_players 
  WHERE room_id = p_room_id AND player_id = p_target_player_id;

  -- 更新玩家状态
  UPDATE players 
  SET current_room_id = NULL, updated_at = NOW()
  WHERE id = p_target_player_id;

  -- 更新房间人数
  UPDATE rooms 
  SET player_count = player_count - 1, updated_at = NOW()
  WHERE id = p_room_id;

  RETURN QUERY SELECT TRUE, '玩家已被踢出'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 函数4: 批量清理空房间 (定时任务用，可选)
-- =====================================================
CREATE OR REPLACE FUNCTION cleanup_empty_rooms()
RETURNS TABLE(deleted_count INT) AS $$
DECLARE
  v_count INT;
BEGIN
  -- 删除所有没有玩家的房间
  WITH deleted AS (
    DELETE FROM rooms 
    WHERE player_count = 0
    RETURNING id
  )
  SELECT COUNT(*) INTO v_count FROM deleted;
  
  RETURN QUERY SELECT v_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 函数5: 批量清理过期房间 (24小时未活动，可选)
-- =====================================================
CREATE OR REPLACE FUNCTION cleanup_expired_rooms()
RETURNS TABLE(deleted_count INT) AS $$
DECLARE
  v_count INT;
BEGIN
  -- 清理所有玩家关联
  UPDATE players 
  SET current_room_id = NULL, updated_at = NOW()
  WHERE current_room_id IN (
    SELECT id FROM rooms 
    WHERE updated_at < NOW() - INTERVAL '24 hours'
  );

  -- 删除过期房间
  WITH deleted AS (
    DELETE FROM rooms 
    WHERE updated_at < NOW() - INTERVAL '24 hours'
    RETURNING id
  )
  SELECT COUNT(*) INTO v_count FROM deleted;
  
  RETURN QUERY SELECT v_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 测试函数 (可选，用于验证功能)
-- =====================================================

-- 测试退出房间
-- SELECT * FROM leave_room(
--   'your-room-id'::UUID, 
--   'your-player-id'::UUID
-- );

-- 测试删除房间
-- SELECT * FROM delete_room_by_host(
--   'your-room-id'::UUID, 
--   'your-host-id'::UUID
-- );

-- 测试踢人
-- SELECT * FROM kick_player(
--   'your-room-id'::UUID, 
--   'your-host-id'::UUID,
--   'target-player-id'::UUID
-- );

-- 清理空房间
-- SELECT * FROM cleanup_empty_rooms();

-- 清理过期房间
-- SELECT * FROM cleanup_expired_rooms();

-- =====================================================
-- 索引优化 (提升性能)
-- =====================================================

-- 为常用查询添加索引
CREATE INDEX IF NOT EXISTS idx_room_players_room_id 
ON room_players(room_id);

CREATE INDEX IF NOT EXISTS idx_room_players_player_id 
ON room_players(player_id);

CREATE INDEX IF NOT EXISTS idx_rooms_updated_at 
ON rooms(updated_at);

CREATE INDEX IF NOT EXISTS idx_players_current_room 
ON players(current_room_id);

-- =====================================================
-- 执行说明
-- =====================================================

/*
执行步骤：
1. 在 Supabase 控制台的 SQL Editor 中执行此脚本
2. 确保所有函数创建成功
3. 在前端代码中调用这些函数

注意事项：
- leave_room: 普通玩家退出，房主退出会转移房主权限
- delete_room_by_host: 房主强制删除房间，移除所有玩家
- kick_player: 房主踢出指定玩家
- cleanup_empty_rooms: 清理空房间（可设置定时任务）
- cleanup_expired_rooms: 清理24小时未活动的房间

权限说明：
- 只有房主可以调用 delete_room_by_host 和 kick_player
- 任何房间内玩家都可以调用 leave_room
*/
