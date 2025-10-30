export type UserLevel =
  | 'sprout' // 75점 미만
  | 'lv1'
  | 'lv2'
  | 'lv3'
  | 'lv4'
  | 'lv5'
  | 'rose' // 3500점 초과

export interface LevelResult {
  level: UserLevel
  label: string
}

// 누적 포인트(lifetime) 기준 레벨 계산
export function getUserLevel(totalPoints: number): LevelResult {
  if (totalPoints > 3500) return { level: 'rose', label: '분홍 장미' }
  if (totalPoints > 1200) return { level: 'lv5', label: 'Lv5' }
  if (totalPoints > 600) return { level: 'lv4', label: 'Lv4' }
  if (totalPoints > 300) return { level: 'lv3', label: 'Lv3' }
  if (totalPoints > 150) return { level: 'lv2', label: 'Lv2' }
  if (totalPoints > 75) return { level: 'lv1', label: 'Lv1' }
  return { level: 'sprout', label: '새싹' }
}

// 누적 포인트 + VIP 플래그 판단 버전 (VIP > 장미 > 레벨)
export function getUserLevelWithVip(totalPoints: number, isVip: boolean): LevelResult & { isVip: boolean; isRose: boolean } {
  if (isVip) return { level: 'vip', label: 'VIP 왕관', isVip: true, isRose: false };
  if (totalPoints > 3500) return { level: 'rose', label: '분홍 장미', isVip: false, isRose: true };
  if (totalPoints > 1200) return { level: 'lv5', label: 'Lv5', isVip: false, isRose: false };
  if (totalPoints > 600) return { level: 'lv4', label: 'Lv4', isVip: false, isRose: false };
  if (totalPoints > 300) return { level: 'lv3', label: 'Lv3', isVip: false, isRose: false };
  if (totalPoints > 150) return { level: 'lv2', label: 'Lv2', isVip: false, isRose: false };
  if (totalPoints > 75) return { level: 'lv1', label: 'Lv1', isVip: false, isRose: false };
  return { level: 'sprout', label: '새싹', isVip: false, isRose: false };
}

export function isEligibleForEvents(totalPoints: number): boolean {
  // Lv1 이상만(> 75)
  return totalPoints > 75
}

export function isRose(totalPoints: number): boolean {
  return totalPoints > 3500
}

// 레벨 변동 감지 (old/new points → 변화 감지)
export function detectLevelChange(oldPoints: number, newPoints: number): {
  oldLevel: LevelResult, newLevel: LevelResult,
  changed: boolean, up: boolean, down: boolean, desc: string
} {
  const oldLevelObj = getUserLevel(oldPoints)
  const newLevelObj = getUserLevel(newPoints)
  const changed = oldLevelObj.level !== newLevelObj.level
  const up = changed && newPoints > oldPoints
  const down = changed && newPoints < oldPoints
  let desc = '레벨 동일'
  if (up) desc = `레벨업(${oldLevelObj.label}→${newLevelObj.label})`
  if (down) desc = `레벨다운(${oldLevelObj.label}→${newLevelObj.label})`
  return {
    oldLevel: oldLevelObj,
    newLevel: newLevelObj,
    changed, up, down, desc
  }
}


