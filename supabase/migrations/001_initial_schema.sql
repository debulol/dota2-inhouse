-- =====================================================
-- 大象公会 Dota2 内战系统 - 数据库初始化脚本
-- =====================================================

-- 启用UUID扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 表1: players (玩家表)
-- =====================================================
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT NOT NULL,
  positions TEXT[] NOT NULL DEFAULT '{}',
  favorite_heroes TEXT[] NOT NULL DEFAULT '{}',
  total_wins INT DEFAULT 0 CHECK (total_wins >= 0),
  total_losses INT DEFAULT 0 CHECK (total_losses >= 0),
  stats_visible BOOLEAN DEFAULT TRUE,
  current_room_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_players_current_room ON players(current_room_id);
CREATE INDEX idx_players_username ON players(username);

-- =====================================================
-- 表2: rooms (房间表)
-- =====================================================
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_name TEXT NOT NULL,
  room_code TEXT UNIQUE NOT NULL,
  host_id UUID REFERENCES players(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'drafting', 'gaming')),
  player_count INT DEFAULT 1 CHECK (player_count >= 0 AND player_count <= 10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '24 hours',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_rooms_status ON rooms(status);
CREATE INDEX idx_rooms_expires ON rooms(expires_at);
CREATE INDEX idx_rooms_room_code ON rooms(room_code);

-- =====================================================
-- 表3: room_players (房间成员表)
-- =====================================================
CREATE TABLE room_players (
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  join_order INT NOT NULL,
  roll_result INT CHECK (roll_result >= 1 AND roll_result <= 100),
  is_captain BOOLEAN DEFAULT FALSE,
  team TEXT CHECK (team IN ('radiant', 'dire')),
  preferred_team TEXT CHECK (preferred_team IN ('radiant', 'dire')),
  is_ready BOOLEAN DEFAULT FALSE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (room_id, player_id)
);

-- 索引
CREATE INDEX idx_room_players_room ON room_players(room_id);
CREATE INDEX idx_room_players_join_order ON room_players(room_id, join_order);

-- =====================================================
-- 表4: matches (比赛记录表)
-- =====================================================
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES rooms(id),
  radiant_players UUID[] NOT NULL,
  dire_players UUID[] NOT NULL,
  winner TEXT NOT NULL CHECK (winner IN ('radiant', 'dire')),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引（用于查询玩家历史战绩）
CREATE INDEX idx_matches_radiant_players ON matches USING GIN (radiant_players);
CREATE INDEX idx_matches_dire_players ON matches USING GIN (dire_players);
CREATE INDEX idx_matches_room_id ON matches(room_id);

-- =====================================================
-- 函数1: 生成6位房间号
-- =====================================================
CREATE OR REPLACE FUNCTION generate_room_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- 去除易混淆字符 (I,O,0,1)
  result TEXT := '';
  i INT;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 函数2: 创建房间
-- =====================================================
CREATE OR REPLACE FUNCTION create_room(
  p_host_id UUID,
  p_room_name TEXT
)
RETURNS TABLE(room_id UUID, room_code TEXT) AS $$
DECLARE
  v_room_id UUID;
  v_room_code TEXT;
  v_room_name TEXT;
BEGIN
  -- 生成唯一房间号
  LOOP
    v_room_code := generate_room_code();
    EXIT WHEN NOT EXISTS (SELECT 1 FROM rooms WHERE room_code = v_room_code);
  END LOOP;
  
  -- 如果没有提供房间名，生成默认名称
  IF p_room_name IS NULL OR p_room_name = '' THEN
    SELECT COUNT(*) + 1 INTO v_room_name
    FROM rooms 
    WHERE room_name LIKE '大象内战房%';
    v_room_name := '大象内战房' || v_room_name;
  ELSE
    v_room_name := p_room_name;
  END IF;
  
  -- 创建房间
  INSERT INTO rooms (room_name, room_code, host_id)
  VALUES (v_room_name, v_room_code, p_host_id)
  RETURNING id, room_code INTO v_room_id, v_room_code;
  
  -- 房主加入房间
  INSERT INTO room_players (room_id, player_id, join_order)
  VALUES (v_room_id, p_host_id, 1);
  
  -- 更新玩家当前房间
  UPDATE players SET current_room_id = v_room_id WHERE id = p_host_id;
  
  RETURN QUERY SELECT v_room_id, v_room_code;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 函数3: 加入房间
-- =====================================================
CREATE OR REPLACE FUNCTION join_room(
  p_room_code TEXT,
  p_player_id UUID
)
RETURNS TABLE(success BOOLEAN, message TEXT, room_id UUID) AS $$
DECLARE
  v_room_id UUID;
  v_player_count INT;
  v_room_status TEXT;
  v_next_order INT;
BEGIN
  -- 检查房间是否存在
  SELECT id, player_count, status INTO v_room_id, v_player_count, v_room_status
  FROM rooms WHERE room_code = p_room_code;
  
  IF v_room_id IS NULL THEN
    RETURN QUERY SELECT FALSE, '房间不存在'::TEXT, NULL::UUID;
    RETURN;
  END IF;
  
  -- 检查房间是否已满
  IF v_player_count >= 10 THEN
    RETURN QUERY SELECT FALSE, '房间已满'::TEXT, v_room_id;
    RETURN;
  END IF;
  
  -- 检查房间状态
  IF v_room_status = 'gaming' THEN
    RETURN QUERY SELECT FALSE, '游戏进行中，无法加入'::TEXT, v_room_id;
    RETURN;
  END IF;
  
  -- 检查玩家是否已在房间
  IF EXISTS (SELECT 1 FROM room_players WHERE room_id = v_room_id AND player_id = p_player_id) THEN
    RETURN QUERY SELECT TRUE, '已在房间中'::TEXT, v_room_id;
    RETURN;
  END IF;
  
  -- 获取下一个进房顺序
  SELECT COALESCE(MAX(join_order), 0) + 1 INTO v_next_order
  FROM room_players WHERE room_id = v_room_id;
  
  -- 加入房间
  INSERT INTO room_players (room_id, player_id, join_order)
  VALUES (v_room_id, p_player_id, v_next_order);
  
  -- 更新房间人数和玩家当前房间
  UPDATE rooms SET player_count = player_count + 1, updated_at = NOW()
  WHERE id = v_room_id;
  
  UPDATE players SET current_room_id = v_room_id WHERE id = p_player_id;
  
  RETURN QUERY SELECT TRUE, '加入成功'::TEXT, v_room_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 函数4: 退出房间
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
BEGIN
  -- 检查是否是房主
  SELECT host_id = p_player_id INTO v_is_host
  FROM rooms WHERE id = p_room_id;
  
  -- 删除玩家记录
  DELETE FROM room_players 
  WHERE room_id = p_room_id AND player_id = p_player_id;
  
  -- 更新玩家当前房间
  UPDATE players SET current_room_id = NULL WHERE id = p_player_id;
  
  -- 更新房间人数
  UPDATE rooms SET player_count = player_count - 1, updated_at = NOW()
  WHERE id = p_room_id;
  
  -- 获取当前人数
  SELECT player_count INTO v_player_count FROM rooms WHERE id = p_room_id;
  
  -- 如果是房主且房间还有人，随机选择新房主
  IF v_is_host AND v_player_count > 0 THEN
    SELECT player_id INTO v_new_host_id
    FROM room_players
    WHERE room_id = p_room_id
    ORDER BY RANDOM()
    LIMIT 1;
    
    UPDATE rooms SET host_id = v_new_host_id WHERE id = p_room_id;
  END IF;
  
  -- 如果房间空了，删除房间
  IF v_player_count = 0 THEN
    DELETE FROM rooms WHERE id = p_room_id;
    RETURN QUERY SELECT TRUE, '房间已解散'::TEXT;
  ELSE
    RETURN QUERY SELECT TRUE, '退出成功'::TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 函数5: 踢出玩家（房主专用）
-- =====================================================
CREATE OR REPLACE FUNCTION kick_player(
  p_room_id UUID,
  p_host_id UUID,
  p_target_player_id UUID
)
RETURNS TABLE(success BOOLEAN, message TEXT) AS $$
DECLARE
  v_is_host BOOLEAN;
BEGIN
  -- 验证是否是房主
  SELECT host_id = p_host_id INTO v_is_host
  FROM rooms WHERE id = p_room_id;
  
  IF NOT v_is_host THEN
    RETURN QUERY SELECT FALSE, '只有房主可以踢人'::TEXT;
    RETURN;
  END IF;
  
  -- 不能踢自己
  IF p_host_id = p_target_player_id THEN
    RETURN QUERY SELECT FALSE, '不能踢出自己'::TEXT;
    RETURN;
  END IF;
  
  -- 调用退出房间函数
  RETURN QUERY SELECT * FROM leave_room(p_room_id, p_target_player_id);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 函数6: 完成比赛并更新战绩
-- =====================================================
CREATE OR REPLACE FUNCTION finish_match(
  p_room_id UUID,
  p_winner TEXT
)
RETURNS TABLE(success BOOLEAN, message TEXT) AS $$
DECLARE
  radiant_ids UUID[];
  dire_ids UUID[];
BEGIN
  -- 获取双方队员ID
  SELECT array_agg(player_id) INTO radiant_ids
  FROM room_players WHERE room_id = p_room_id AND team = 'radiant';
  
  SELECT array_agg(player_id) INTO dire_ids
  FROM room_players WHERE room_id = p_room_id AND team = 'dire';
  
  -- 验证是否有效（双方各5人）
  IF array_length(radiant_ids, 1) != 5 OR array_length(dire_ids, 1) != 5 THEN
    RETURN QUERY SELECT FALSE, '队伍人数不足，无法记录战绩'::TEXT;
    RETURN;
  END IF;
  
  -- 插入match记录
  INSERT INTO matches (room_id, radiant_players, dire_players, winner)
  VALUES (p_room_id, radiant_ids, dire_ids, p_winner);
  
  -- 更新胜方战绩
  IF p_winner = 'radiant' THEN
    UPDATE players SET total_wins = total_wins + 1, updated_at = NOW()
    WHERE id = ANY(radiant_ids);
    UPDATE players SET total_losses = total_losses + 1, updated_at = NOW()
    WHERE id = ANY(dire_ids);
  ELSE
    UPDATE players SET total_wins = total_wins + 1, updated_at = NOW()
    WHERE id = ANY(dire_ids);
    UPDATE players SET total_losses = total_losses + 1, updated_at = NOW()
    WHERE id = ANY(radiant_ids);
  END IF;
  
  -- 重置房间状态
  UPDATE rooms SET status = 'waiting', updated_at = NOW() WHERE id = p_room_id;
  
  UPDATE room_players SET 
    roll_result = NULL,
    is_captain = FALSE,
    team = NULL,
    preferred_team = NULL,
    is_ready = FALSE
  WHERE room_id = p_room_id;
  
  RETURN QUERY SELECT TRUE, '战绩已更新'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 函数7: 自动清理过期房间（定时任务）
-- =====================================================
CREATE OR REPLACE FUNCTION cleanup_expired_rooms()
RETURNS void AS $$
BEGIN
  -- 清空过期房间的玩家current_room_id
  UPDATE players 
  SET current_room_id = NULL
  WHERE current_room_id IN (
    SELECT id FROM rooms WHERE expires_at < NOW()
  );
  
  -- 删除过期房间
  DELETE FROM rooms WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 触发器: 自动更新updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER players_updated_at BEFORE UPDATE ON players
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER rooms_updated_at BEFORE UPDATE ON rooms
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- 初始化玩家数据（大象公会成员）
-- =====================================================

-- 玩家数据
-- 注意：头像文件需要放在项目的 public/avatars/ 目录下
-- 或者修改 avatar_url 为在线图片URL
INSERT INTO players (username, avatar_url, positions, favorite_heroes, total_wins, total_losses) VALUES
('冥皇', '/avatars/冥皇.jpg', ARRAY['Carry'], ARRAY['ursa', 'sven', 'razor'], 0, 0),
('菠萝', '/avatars/菠萝.jpg', ARRAY['Off'], ARRAY['pangolier', 'centaur', 'slardar'], 0, 0),
('Quintus', '/avatars/Quintus.jpg', ARRAY['Off'], ARRAY['shredder', 'slardar', 'axe'], 0, 0),
('GBC', '/avatars/GBC.jpg', ARRAY['Off', 'Support'], ARRAY['lion', 'jakiro', 'axe'], 0, 0),
('三哥', '/avatars/三哥.jpg', ARRAY['Carry', 'Off'], ARRAY['weaver', 'underlord'], 0, 0),
('四哥', '/avatars/四哥.jpg', ARRAY['Support'], ARRAY['oracle', 'shadow_demon', 'grimstroke'], 0, 0),
('原酱', '/avatars/原酱.jpg', ARRAY['Support'], ARRAY['grimstroke', 'furion', 'ogre_magi'], 0, 0),
('黄sir', '/avatars/黄sir.jpg', ARRAY['Carry'], ARRAY['antimage', 'clinkz', 'tiny'], 0, 0),
('YJF', '/avatars/yjf.jpg', ARRAY['Support'], ARRAY['ogre_magi', 'vengefulspirit', 'sniper'], 0, 0),
('K', '/avatars/八木唯.jpg', ARRAY['Mid'], ARRAY['storm_spirit', 'puck', 'skywrath_mage'], 0, 0),
('老哥', '/avatars/老哥.jpg', ARRAY['Support'], ARRAY['lich'], 0, 0),
('chase', '/avatars/chase.jpg', ARRAY['Mid', 'Off'], ARRAY['dawnbreaker', 'slardar', 'queenofpain'], 0, 0),
('once', '/avatars/once.jpg', ARRAY['Support'], ARRAY['snapfire', 'pugna', 'lion'], 0, 0),
('Ding', '/avatars/Ding.jpg', ARRAY['Carry', 'Mid', 'Off', 'Support'], ARRAY['spirit_breaker', 'ursa', 'furion'], 0, 0);

-- =====================================================
-- 完成！
-- =====================================================
-- 你可以在Supabase控制台中执行此脚本
-- 记得修改玩家的初始战绩数据
