export interface POI {
  id: string;
  name: string;
  building: string;
  floor: string;
  description: string;
  crowdLevel: '🟢 空閒' | '🟡 普通' | '🔴 擁擠';
  crowdValue: number; // 0-100%
  waitDuration: string;
  x: number; // X coordinate on the hospital layout map (0 - 100)
  y: number; // Y coordinate on the hospital layout map (0 - 100)
}

export interface RoutePreferences {
  stairs: boolean;
  escalator: boolean;
  elevator: boolean;
  accessible: boolean; // Wheelchair mode
  shortestDistance: boolean;
  leastTurns: boolean;
  leastCrowded: boolean;
  rainCovered: boolean;
}

export interface ScheduleItem {
  id: number;
  time: string;
  action: string;
  location: string;
  poiId: string;
  status: '已完成' | '進行中' | '未開始';
  queueNo: number;
  queueWait: number; // waiting count
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export interface ParkingRecord {
  parked: boolean;
  building: string;
  floor: string;
  spaceNo: string;
  parkTime: string;
  feeRate: number; // NT$ per hour
}
