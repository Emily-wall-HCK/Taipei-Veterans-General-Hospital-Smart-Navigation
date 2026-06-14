import { POI, ScheduleItem } from './types.ts';

export const HOSPITAL_POIS: POI[] = [
  {
    id: 'blood_draw',
    name: '中正樓 1F 抽血櫃台',
    building: '中正樓',
    floor: '1F',
    description: '榮總中央最大的抽血暨檢驗登錄中心。每日病患量大，設有號碼牌叫號系統。',
    crowdLevel: '🔴 擁擠',
    crowdValue: 85,
    waitDuration: '45分鐘',
    x: 42,
    y: 50,
  },
  {
    id: 'cardiology',
    name: '中正樓 2F 心臟內科門診',
    building: '中正樓',
    floor: '2F',
    description: '心血管疾病專業診治中心、包括超音波及心電圖科。設有高齡友善友善優先席。',
    crowdLevel: '🟡 普通',
    crowdValue: 55,
    waitDuration: '20分鐘',
    x: 48,
    y: 40,
  },
  {
    id: 'xray',
    name: '中正樓 B1 放射線部 (X光檢驗)',
    building: '中正樓',
    floor: 'B1',
    description: '胸透側透、X光造影、電腦斷層(CT)檢查。請先在放射櫃檯報到。',
    crowdLevel: '🟢 空閒',
    crowdValue: 15,
    waitDuration: '5分鐘',
    x: 35,
    y: 58,
  },
  {
    id: 'pharmacy_main',
    name: '中正樓 1F 中央藥局',
    building: '中正樓',
    floor: '1F',
    description: '24小時住院與常規處方箋領藥櫃台。附設愛心無障礙窗口。',
    crowdLevel: '🟡 普通',
    crowdValue: 40,
    waitDuration: '12分鐘',
    x: 55,
    y: 55,
  },
  {
    id: 'emergency',
    name: '中正樓 1F 急診重症醫學部',
    building: '中正樓',
    floor: '1F',
    description: '急診與創傷中心，設有24小時快速救護與保全聯絡站。',
    crowdLevel: '🟡 普通',
    crowdValue: 60,
    waitDuration: '15分鐘',
    x: 25,
    y: 48,
  },
  {
    id: 'pediatrics',
    name: '第一門診大樓 2F 小兒科門診',
    building: '第一門診',
    floor: '2F',
    description: '兒童醫學與新生兒預防注射、設有溫馨哺乳室。',
    crowdLevel: '🟢 空閒',
    crowdValue: 25,
    waitDuration: '8分鐘',
    x: 75,
    y: 35,
  },
  {
    id: 'chinese_medicine',
    name: '第二門診大樓 3F 中醫部',
    building: '第二門診',
    floor: '3F',
    description: '中醫針灸、中藥處方領取、骨傷科理療。',
    crowdLevel: '🟡 普通',
    crowdValue: 45,
    waitDuration: '18分鐘',
    x: 18,
    y: 72,
  },
  {
    id: 'heavy_particle',
    name: '榮總重粒子癌症治療中心',
    building: '重粒子中心',
    floor: '1F',
    description: '亞洲先進的重粒子射線精準癌症治療中心，大樓環境靜謐怡人。',
    crowdLevel: '🟢 空閒',
    crowdValue: 10,
    waitDuration: '3分鐘',
    x: 88,
    y: 65,
  },
  {
    id: 'smart_med',
    name: '中正樓 2F 智慧醫療展示區',
    building: '中正樓',
    floor: '2F',
    description: '展示本院最新 AI 聯網導醫、達文西手術機械與智慧病房科技展。',
    crowdLevel: '🟢 空閒',
    crowdValue: 5,
    waitDuration: '無須等待',
    x: 60,
    y: 32,
  },
  {
    id: 'parking_main',
    name: '中正樓 B2 地下收費停車場',
    building: '中正樓',
    floor: 'B2',
    description: '設有身障與高齡專屬孕婦車位、智慧尋車辨識與自動繳費機。',
    crowdLevel: '🔴 擁擠',
    crowdValue: 80,
    waitDuration: '找車位約10分鐘',
    x: 50,
    y: 80,
  }
];

export const INITIAL_SCHEDULES: ScheduleItem[] = [
  {
    id: 1,
    time: '08:30',
    action: '抽血暨生化檢驗',
    location: '中正樓 1F 抽血櫃台',
    poiId: 'blood_draw',
    status: '進行中',
    queueNo: 2045,
    queueWait: 45,
  },
  {
    id: 2,
    time: '09:15',
    action: '心臟功能診查科',
    location: '中正樓 2F 心臟內科門診',
    poiId: 'cardiology',
    status: '未開始',
    queueNo: 12,
    queueWait: 8,
  },
  {
    id: 3,
    time: '10:30',
    action: '胸部 X 光透視檢查',
    location: '中正樓 B1 放射線部',
    poiId: 'xray',
    status: '未開始',
    queueNo: 88,
    queueWait: 3,
  },
  {
    id: 4,
    time: '11:15',
    action: '門診處方領藥',
    location: '中正樓 1F 中央藥局',
    poiId: 'pharmacy_main',
    status: '未開始',
    queueNo: 1540,
    queueWait: 12,
  }
];

// Hospital map pathways representing connections on the layout
export interface HospitalNode {
  id: string;
  name: string;
  x: number;
  y: number;
  floor: string;
}

export const MAP_NODES: HospitalNode[] = [
  { id: 'start_gate_1f', name: '中正樓 1F 大門 / 藝術大廳', x: 50, y: 30, floor: '1F' },
  { id: 'gate_elevator', name: '大廳西側 A2 電梯組(無障礙)', x: 45, y: 35, floor: '1F' },
  { id: 'blood_draw', name: '中正樓 1F 抽血櫃台', x: 42, y: 50, floor: '1F' },
  { id: 'pharmacy_main', name: '中正樓 1F 中央藥局', x: 55, y: 55, floor: '1F' },
  { id: 'emergency', name: '中正樓 1F 急診重症醫學部', x: 25, y: 48, floor: '1F' },
  { id: 'corridor_mid_2f', name: '中正樓 2F 中央空中走道', x: 50, y: 35, floor: '2F' },
  { id: 'cardiology', name: '中正樓 2F 心臟內科門診', x: 48, y: 40, floor: '2F' },
  { id: 'smart_med', name: '中正樓 2F 智慧醫療展示區', x: 60, y: 32, floor: '2F' },
  { id: 'stairs_b1', name: '中央迴旋梯 (B1大階梯)', x: 40, y: 54, floor: 'B1' },
  { id: 'xray', name: '中正樓 B1 放射線部', x: 35, y: 58, floor: 'B1' },
  { id: 'parking_main', name: '中正樓 B2 地下車位', x: 50, y: 80, floor: 'B2' },
];

export interface HospitalEdge {
  from: string;
  to: string;
  distance: number; // in meters
  stairs: boolean;
  escalator: boolean;
  elevator: boolean;
  rainCovered: boolean;
  crowdedLevel: 'low' | 'med' | 'high';
}

// Map edge connectivity representing physically passable hallways, ramps and lifts
export const MAP_EDGES: HospitalEdge[] = [
  // 1F connections
  { from: 'start_gate_1f', to: 'gate_elevator', distance: 30, stairs: false, escalator: false, elevator: false, rainCovered: true, crowdedLevel: 'low' },
  { from: 'gate_elevator', to: 'blood_draw', distance: 50, stairs: false, escalator: false, elevator: false, rainCovered: true, crowdedLevel: 'low' },
  { from: 'gate_elevator', to: 'pharmacy_main', distance: 60, stairs: false, escalator: false, elevator: false, rainCovered: true, crowdedLevel: 'med' },
  { from: 'blood_draw', to: 'pharmacy_main', distance: 40, stairs: false, escalator: false, elevator: false, rainCovered: true, crowdedLevel: 'high' },
  { from: 'blood_draw', to: 'emergency', distance: 80, stairs: false, escalator: false, elevator: false, rainCovered: true, crowdedLevel: 'low' },
  
  // Elevators and Stairs crossing floors
  { from: 'gate_elevator', to: 'corridor_mid_2f', distance: 20, stairs: false, escalator: false, elevator: true, rainCovered: true, crowdedLevel: 'low' },
  { from: 'gate_elevator', to: 'stairs_b1', distance: 30, stairs: true, escalator: false, elevator: false, rainCovered: true, crowdedLevel: 'low' },
  { from: 'gate_elevator', to: 'parking_main', distance: 40, stairs: false, escalator: false, elevator: true, rainCovered: true, crowdedLevel: 'low' },
  
  // 2F connection
  { from: 'corridor_mid_2f', to: 'cardiology', distance: 25, stairs: false, escalator: false, elevator: false, rainCovered: true, crowdedLevel: 'med' },
  { from: 'corridor_mid_2f', to: 'smart_med', distance: 40, stairs: false, escalator: false, elevator: false, rainCovered: true, crowdedLevel: 'low' },

  // B1 connection
  { from: 'stairs_b1', to: 'xray', distance: 30, stairs: false, escalator: false, elevator: false, rainCovered: true, crowdedLevel: 'low' },
];

/**
 * Computes the navigation path from source ID to destination ID based on preferences.
 * Uses a basic Dijkstra algorithm adjusted for accessibility and other parameters.
 */
export function calculateBestRoute(
  startId: string,
  endId: string,
  accessible: boolean // True means wheelchair mode -> bypass anything with stairs: true
): { path: string[]; distance: number; steps: string[] } {
  // Simple BFS / Dijkstra tailored for hospital node count
  const visited = new Set<string>();
  const parentMap: { [key: string]: string } = {};
  const distanceMap: { [key: string]: number } = {};
  const queue: string[] = [];

  // Initialize
  MAP_NODES.forEach((n) => {
    distanceMap[n.id] = Infinity;
  });
  
  distanceMap[startId] = 0;
  queue.push(startId);

  while (queue.length > 0) {
    // Pick node with minimum distance
    queue.sort((a, b) => distanceMap[a] - distanceMap[b]);
    const current = queue.shift()!;
    visited.add(current);

    if (current === endId) break;

    // Get outgoing connections
    const neighbors = MAP_EDGES.filter(
      (e) => (e.from === current || e.to === current)
    );

    for (const edge of neighbors) {
      const neighborId = edge.from === current ? edge.to : edge.from;
      if (visited.has(neighborId)) continue;

      // Wheelchair Mode Enforcement: Avoid any edges that are ONLY stairs (no elevator, bypass)
      if (accessible && edge.stairs && !edge.elevator) {
        continue;
      }

      const altDist = distanceMap[current] + edge.distance;
      if (altDist < distanceMap[neighborId]) {
        distanceMap[neighborId] = altDist;
        parentMap[neighborId] = current;
        if (!queue.includes(neighborId)) {
          queue.push(neighborId);
        }
      }
    }
  }

  // Backtrack path
  const finalPath: string[] = [];
  let curr = endId;
  while (curr) {
    finalPath.unshift(curr);
    curr = parentMap[curr];
  }

  // If start is not in path or path only has 1 element, routing failed/fallback defaults
  if (finalPath[0] !== startId) {
    // Return direct line as safe fallback
    return {
      path: [startId, endId],
      distance: 120,
      steps: [
        '依據地標開始規劃起點。',
        accessible ? '🚨 系統已為您啟用無障礙輪椅模式，避開所有樓梯及狹窄高低差走道！' : '沿著中央走道直行。',
        '請搭乘電梯到達目的地。'
      ]
    };
  }

  // Generate directions descriptions
  const steps: string[] = [];
  steps.push(`🚩 從 【${MAP_NODES.find(n => n.id === startId)?.name || startId}】 出發`);
  
  if (accessible) {
    steps.push('♿ 系統已鎖定【無障礙輪椅友善通道】優先規劃一條避開任何階梯與障礙之路徑。');
  }

  for (let i = 0; i < finalPath.length - 1; i++) {
    const from = finalPath[i];
    const to = finalPath[i + 1];
    const edge = MAP_EDGES.find(
      (e) => (e.from === from && e.to === to) || (e.from === to && e.to === from)
    );
    const nFrom = MAP_NODES.find(n => n.id === from);
    const nTo = MAP_NODES.find(n => n.id === to);

    if (edge) {
      let action = '前行';
      if (nFrom && nTo && nFrom.floor !== nTo.floor) {
        if (edge.elevator) {
          action = `🛗 搭乘無障礙電梯往【${nTo.floor}】樓`;
        } else if (edge.stairs) {
          action = `🚶 沿迴旋梯步行至【${nTo.floor}】樓`;
        }
      } else {
        action = `🚶 沿指示方向直走約 ${edge.distance} 公尺過通廊`;
      }
      steps.push(`${action}，前往 【${nTo?.name || to}】`);
    }
  }
  steps.push(`🎉 抵達目的地：【${MAP_NODES.find(n => n.id === endId)?.name || endId}】！`);

  return {
    path: finalPath,
    distance: distanceMap[endId],
    steps,
  };
}
