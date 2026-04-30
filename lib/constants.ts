export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const POSITIONS = ['Goalkeeper', 'Defender', 'Midfielder', 'Forward'];
export const POS_SHORT: Record<string, string> = { Goalkeeper: 'GK', Defender: 'DEF', Midfielder: 'MID', Forward: 'FWD' };

export const OPPONENT_TEAMS = [
  { id: 'o1', name: 'Al Nasr FC', ovr: 89.7 },
  { id: 'o2', name: 'Muscat United', ovr: 88.2 },
  { id: 'o3', name: 'Thunder Wolves', ovr: 87.5 },
  { id: 'o4', name: 'Royal Knights', ovr: 86.9 },
];

export function generateDates(count = 14): Date[] {
  const today = new Date();
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i + 1);
    return d;
  });
}
