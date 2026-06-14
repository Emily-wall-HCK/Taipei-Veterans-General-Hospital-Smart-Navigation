import React, { useState, useEffect, useRef } from 'react';
import { 
  Compass, 
  MapPin, 
  Accessibility, 
  CheckCircle, 
  Clock, 
  PhoneCall, 
  Volume2, 
  Sparkles, 
  User, 
  Search, 
  Navigation, 
  Layers, 
  Activity, 
  AlertTriangle, 
  CheckSquare, 
  Smartphone, 
  Maximize2, 
  Camera, 
  Scan, 
  Info, 
  HelpCircle, 
  ShieldAlert, 
  Car, 
  RefreshCw, 
  ThumbsUp, 
  ChevronRight,
  Eye,
  Settings,
  X,
  PlusSquare,
  Users
} from 'lucide-react';
import { HOSPITAL_POIS, INITIAL_SCHEDULES, MAP_NODES, calculateBestRoute } from './data.ts';
import { POI, RoutePreferences, ScheduleItem } from './types.ts';
import AIChat from './components/AIChat.tsx';

export default function App() {
  // Mode selection & accessibility
  const [seniorMode, setSeniorMode] = useState<boolean>(false);
  const [wheelchairMode, setWheelchairMode] = useState<boolean>(false);
  const [themeMode, setThemeMode] = useState<'light' | 'vgh-classic'>('light');

  // Location simulation state (Beacon Indoor GPS)
  const [currentMapFloor, setCurrentMapFloor] = useState<string>('1F');
  const [simulatedNodeIndex, setSimulatedNodeIndex] = useState<number>(0);
  const [beaconSignal, setBeaconSignal] = useState<number>(95); // signal strength in percent
  const [currentCoordinates, setCurrentCoordinates] = useState<{ x: number; y: number }>({ x: 50, y: 30 });
  const [isSimulatingWalk, setIsSimulatingWalk] = useState<boolean>(false);

  // AR Camera Viewfinder simulation
  const [viewMode, setViewMode] = useState<'map' | 'ar_camera'>('map');
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<boolean>(false);
  const [arAngle, setArAngle] = useState<number>(45); // simulated direction arrow rotation in degrees

  // Route Planning states
  const [routeStartId, setRouteStartId] = useState<string>('start_gate_1f');
  const [routeEndId, setRouteEndId] = useState<string>('blood_draw');
  const [routePreferences, setRoutePreferences] = useState<RoutePreferences>({
    stairs: true,
    escalator: true,
    elevator: true,
    accessible: false,
    shortestDistance: true,
    leastTurns: false,
    leastCrowded: false,
    rainCovered: false,
  });
  const [activeNavigation, setActiveNavigation] = useState<any>(null); // results from calculateBestRoute
  const [navStepIndex, setNavStepIndex] = useState<number>(0);
  const [hasArrived, setHasArrived] = useState<boolean>(false);

  // Dynamic VGH POI info lists with dynamic crowd values
  const [pois, setPois] = useState<POI[]>(HOSPITAL_POIS);
  const [selectedPoi, setSelectedPoi] = useState<POI | null>(HOSPITAL_POIS[0]);

  // Personal schedule timeline tracking
  const [schedules, setSchedules] = useState<ScheduleItem[]>(INITIAL_SCHEDULES);
  const [reorganizing, setReorganizing] = useState<boolean>(false);
  const [aiRecommendationText, setAiRecommendationText] = useState<string>('');
  const [showAiRecommenderPane, setShowAiRecommenderPane] = useState<boolean>(false);

  // Quick QR Code Scanning simulation
  const [showQrSimulator, setShowQrSimulator] = useState<boolean>(false);
  const [scannedCodeValue, setScannedCodeValue] = useState<string>('');

  // Emergency SOS systems
  const [sosTriggered, setSosTriggered] = useState<boolean>(false);
  const [sosCountdown, setSosCountdown] = useState<number>(180); // seconds until medical/volunteer arriving
  const [sosStation, setSosStation] = useState<string>('');
  
  // Parking lot navigation & smart tracker
  const [parkingInfo, setParkingInfo] = useState({
    parked: true,
    building: '中正樓',
    floor: 'B2',
    spaceNo: 'A-128',
    parkTime: '2026-06-02 08:05',
    feeRate: 40,
    elapsedHours: 2.1,
    unpaidAmount: 100,
    vacantSpots: 34
  });
  const [carSearchActive, setCarSearchActive] = useState<boolean>(false);

  // Active tour info (historical/facility narration guides)
  const [activeNarration, setActiveNarration] = useState<string | null>(null);
  const [isNarrating, setIsNarrating] = useState<boolean>(false);

  // Browser level feedback toasts
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);

  // Show Toast Helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(p => p === msg ? null : p);
    }, 4500);
  };

  // Sync wheelchairMode with Route preferences
  useEffect(() => {
    setRoutePreferences(prev => ({
      ...prev,
      accessible: wheelchairMode,
      stairs: !wheelchairMode, // disable stairs if wheelchair mode is true
    }));
    if (wheelchairMode) {
      showToast('♿ 已自動啟用輪椅無障礙導航：系統將為您完全避開階梯與陡峭坡道。');
    }
  }, [wheelchairMode]);

  // Audio beacon chirp simulator for senior feedback & SOS alert
  const playSound = (frequency: number, duration: number, type: OscillatorType = 'sine') => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = type;
      osc.frequency.value = frequency;
      
      gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
      // Fade out
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      console.warn('Audio play skipped due to browser policy or context failure:', e);
    }
  };

  // Pulse effect simulation on location changes
  useEffect(() => {
    // Randomize slight signal fluctuate
    const interval = setInterval(() => {
      setBeaconSignal(p => {
        const delta = Math.floor(Math.random() * 5) - 2;
        return Math.min(100, Math.max(80, p + delta));
      });
      if (isSimulatingWalk) {
        setArAngle(ang => (ang + (Math.random() * 20 - 10)) % 360);
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [isSimulatingWalk]);

  // Simulation: Move along active path steps
  useEffect(() => {
    if (isSimulatingWalk && activeNavigation && activeNavigation.path.length > 0) {
      const stepTimer = setTimeout(() => {
        if (navStepIndex < activeNavigation.path.length - 1) {
          const nextIndex = navStepIndex + 1;
          setNavStepIndex(nextIndex);
          
          const nextNodeId = activeNavigation.path[nextIndex];
          const node = MAP_NODES.find(n => n.id === nextNodeId);
          if (node) {
            setCurrentCoordinates({ x: node.x, y: node.y });
            setCurrentMapFloor(node.floor);
            playSound(587.33, 0.15); // play high pitch feedback
          }
        } else {
          setIsSimulatingWalk(false);
          setHasArrived(true);
          playSound(880, 0.4); // Success high pitch chirp
          showToast('🎉 恭喜！您已在室內 Beacon 引導下抵達您的醫學行程目的地。');
        }
      }, 3500);
      return () => clearTimeout(stepTimer);
    }
  }, [isSimulatingWalk, navStepIndex, activeNavigation]);

  // Start AR Camera stream
  const startCamera = async () => {
    try {
      setCameraError(false);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' }, 
        audio: false 
      });
      setCameraStream(stream);
      showToast('📸 AR 實景模式：已順利取得後置相機權限，投射 AR 箭頭與看板！');
    } catch (err) {
      console.warn('Camera failed/unsupported in sandbox environment; simulating high fidelity hallway layout.', err);
      setCameraError(true);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  };

  useEffect(() => {
    if (viewMode === 'ar_camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [viewMode]);

  // SOS Countdown Timer System
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (sosTriggered && sosCountdown > 0) {
      timer = setInterval(() => {
        setSosCountdown(c => c - 1);
        // Play emergency alert beep every 10 seconds
        if (sosCountdown % 10 === 0) {
          playSound(987.77, 0.5, 'triangle');
        }
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [sosTriggered, sosCountdown]);

  // Perform route calculation
  const triggerRouteCalculation = (startId: string, endId: string) => {
    const routeResult = calculateBestRoute(startId, endId, routePreferences.accessible);
    setActiveNavigation(routeResult);
    setNavStepIndex(0);
    setHasArrived(false);
    
    // Auto set the floor of map to the starting node floor
    const startNode = MAP_NODES.find(n => n.id === startId);
    if (startNode) {
      setCurrentMapFloor(startNode.floor);
      setCurrentCoordinates({ x: startNode.x, y: startNode.y });
    }

    showToast(`🗺️ 已計算路徑！預估步行距離大約 ${routeResult.distance} 公尺。`);
    
    // Auto speech synthesizer notice
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const textToSpeak = `系統已為您規劃最佳路徑，預估距離${routeResult.distance}公尺。${
        routePreferences.accessible ? '已為您自動避開階梯與通道障礙，請遵循畫面指示行進。' : '請您沿箭頭方向行走。'
      }`;
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = 'zh-TW';
      window.speechSynthesis.speak(utterance);
    }
  };

  // Navigate to specific POI or clinical office room
  const handleNavigateToPOI = (poiId: string) => {
    const targetPOI = pois.find(p => p.id === poiId);
    if (targetPOI) {
      setSelectedPoi(targetPOI);
      setRouteEndId(targetPOI.id);
      
      // Select best logical starting landmark based on the current simulator position
      const closestNodeId = MAP_NODES[simulatedNodeIndex]?.id || 'start_gate_1f';
      setRouteStartId(closestNodeId);
      triggerRouteCalculation(closestNodeId, targetPOI.id);
      
      // Auto open Map/AR tab to focus guide
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // API Call: Trigger AI smart medical queue optimizer using Gemini
  const handleAIOptimizedSchedules = async () => {
    setReorganizing(true);
    setShowAiRecommenderPane(true);
    showToast('🧠 正在進行智慧人流大數據算力分析：正在串接台北榮總當日各檢查室與抽血等候人數...');

    try {
      const response = await fetch('/api/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentSchedules: schedules
        })
      });
      const data = await response.json();
      setAiRecommendationText(data.recommendation);

      // Successfully optimize the UI timeline
      // To show real functional impact: we re-order our simulation schedules to match high-efficiency checkups
      // E.g., placing X-Ray first which has short waits, then Doctor Cardiology, and blood test later when peak splits.
      const reorganizedList: ScheduleItem[] = [
        {
          id: 3,
          time: '08:35',
          action: '胸部 X 光透視檢查 (AI推薦領先)',
          location: '中正樓 B1 放射線部',
          poiId: 'xray',
          status: '進行中',
          queueNo: 88,
          queueWait: 1, // immediate
        },
        {
          id: 2,
          time: '08:55',
          action: '心臟功能診查科',
          location: '中正樓 2F 心臟內科門診',
          poiId: 'cardiology',
          status: '未開始',
          queueNo: 12,
          queueWait: 4, 
        },
        {
          id: 1,
          time: '10:00',
          action: '抽血暨生化檢驗 (人潮避開完成)',
          location: '中正樓 1F 抽血櫃台',
          poiId: 'blood_draw',
          status: '未開始',
          queueNo: 2045,
          queueWait: 15, // reduced waiting!
        },
        {
          id: 4,
          time: '10:30',
          action: '門診處方領藥',
          location: '中正樓 1F 中央藥局',
          poiId: 'pharmacy_main',
          status: '未開始',
          queueNo: 1540,
          queueWait: 10,
        }
      ];

      setSchedules(reorganizedList);
      showToast('✨ 智慧看診行程重新排序成功！預估為您省下 35 分鐘等待時間！');
      playSound(659.25, 0.3); // play high success sound
    } catch (err) {
      console.error('Gemini recommend error:', err);
      showToast('❌ 推薦系統忙碌，目前採用院內本機離線分流演算法，建議先做X光以避開抽血巔峰！');
    } finally {
      setReorganizing(false);
    }
  };

  // Restore schedules to default state
  const resetSchedulesToDefault = () => {
    setSchedules(INITIAL_SCHEDULES);
    setAiRecommendationText('');
    setShowAiRecommenderPane(false);
    showToast('🔄 已還原為榮總醫院資訊系統(HIS)原始時段就診表。');
  };

  // Handle Simulated QR Scan Setup
  const executeSimulatedQrScan = (targetId: string) => {
    const matchingPoi = pois.find(p => p.id === targetId);
    if (matchingPoi) {
      setScannedCodeValue(matchingPoi.name);
      setShowQrSimulator(false);
      showToast(`📸 成功掃描掛號單條碼！自動設定目標為：【${matchingPoi.name}】`);
      handleNavigateToPOI(targetId);
    }
  };

  // Trigger Local SOS emergency system
  const triggerSOS = (stationName: string) => {
    setSosStation(stationName);
    setSosTriggered(true);
    setSosCountdown(180);
    playSound(987.77, 1.2, 'sawtooth');
    showToast('🚨 警報發送！台北榮總保全控制中心、中正樓護理站已收到您的 Beacon 3D 座標定位！請在原地安全坐下！');
  };

  // Cancel SOS Alert
  const cancelSOS = () => {
    setSosTriggered(false);
    showToast('✅ 緊急 SOS 求救已取消。');
  };

  // Render facility narration or play audio guide
  const playNarrationAudio = (poi: POI) => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      if (activeNarration === poi.id && isNarrating) {
        setIsNarrating(false);
        setActiveNarration(null);
        return;
      }
      
      const textToSpeak = `${poi.name}。位於${poi.building}的${poi.floor}。本區導覽如下：${poi.description}目前此處人潮${poi.crowdLevel}。如需一鍵導航，請點擊畫面中的帶我前去按鈕。`;
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = 'zh-TW';
      utterance.onend = () => {
        setIsNarrating(false);
        setActiveNarration(null);
      };
      
      setIsNarrating(true);
      setActiveNarration(poi.id);
      window.speechSynthesis.speak(utterance);
      showToast(`🔊 正在播放 【${poi.name}】 智慧語音導航導覽廣播...`);
    } else {
      showToast('🔇 您的瀏覽器不支援語音合成合成系統。');
    }
  };

  // Simulate picking current emulator node to change "Current Location"
  const handleMarkerSelect = (index: number) => {
    setSimulatedNodeIndex(index);
    const node = MAP_NODES[index];
    if (node) {
      setCurrentCoordinates({ x: node.x, y: node.y });
      setCurrentMapFloor(node.floor);
      showToast(`📍 模擬您的 Beacon 定位已更新：【${node.name}】`);
    }
  };

  return (
    <div className={`min-h-screen font-sans transition-colors duration-200 ${
      themeMode === 'vgh-classic' 
        ? 'bg-emerald-950 text-slate-100' 
        : 'bg-slate-50 text-slate-800'
    } ${seniorMode ? 'text-xl' : 'text-sm'}`} id="vgh-app">
      
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div id="vgh-toast" className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-xl bg-teal-900 border-2 border-teal-400 text-white p-4 rounded-xl shadow-2xl flex items-center gap-3 animate-bounce">
          <Sparkles className="w-6 h-6 text-yellow-300 stroke-[2.5]" />
          <div className="flex-1 font-bold text-sm leading-snug">{toastMessage}</div>
          <button onClick={() => setToastMessage(null)} className="text-teal-300 hover:text-white font-extrabold focus:outline-none">
            ✕
          </button>
        </div>
      )}

      {/* Global Accessibility Bar & Quick Mode Toggles */}
      <div className={`w-full bg-gradient-to-r ${themeMode === 'vgh-classic' ? 'from-emerald-900 via-teal-950 to-emerald-900' : 'from-teal-800 via-teal-700 to-emerald-800'} text-white py-2 px-4 shadow`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          
          <div className="flex items-center gap-2">
            <span className="p-1 px-2.5 rounded bg-emerald-600 font-black text-xs tracking-wider uppercase animate-pulse">
              LIVE
            </span>
            <div className="text-xs text-white/90 font-medium">
              台北榮總室內高精準 Beacon 定位系統 • 線上設備強度: <span className="font-bold underline text-lime-400">{beaconSignal}%</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 justify-end w-full md:w-auto">
            {/* Theme Mode VGH Classic */}
            <button 
              onClick={() => setThemeMode(curr => curr === 'light' ? 'vgh-classic' : 'light')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-all ${
                themeMode === 'vgh-classic' 
                  ? 'bg-teal-500 border-teal-300 text-white' 
                  : 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
              }`}
              id="theme-toggle"
            >
              {themeMode === 'vgh-classic' ? '🎨 輕量明亮主題' : '🎨 經典榮總翠綠'}
            </button>

            {/* Wheelchair Accessible Mode Toggle */}
            <button 
              onClick={() => setWheelchairMode(!wheelchairMode)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs font-black transition-all ${
                wheelchairMode 
                  ? 'bg-blue-600 border-blue-400 text-white scale-105 shadow-md' 
                  : 'bg-white/10 hover:bg-white/20 border-white/20 text-white/90'
              }`}
              id="wheelchair-toggle"
            >
              <Accessibility className="w-4 h-4" />
              ♿ {wheelchairMode ? '輪椅模式 [啟動中]' : '輪椅/無障礙'}
            </button>

            {/* Elder Friendly Mode Switch */}
            <button 
              onClick={() => {
                setSeniorMode(!seniorMode);
                showToast(seniorMode ? '🔠 已切換為標準字體精細版。' : '👵 已啟用長輩超大字語音模式！重要按鈕皆已放大，看診更直覺。');
              }}
              className={`flex items-center gap-1 px-4 py-1.5 rounded-xl border text-sm font-black transition-all ${
                seniorMode 
                  ? 'bg-amber-500 hover:bg-amber-400 border-orange-300 text-slate-900 scale-110 shadow-lg' 
                  : 'bg-amber-600 hover:bg-amber-500 border-amber-500 text-white'
              }`}
              id="senior-mode-toggle"
            >
              <Smartphone className="w-4 h-4" />
              📢 {seniorMode ? '切換常規模式' : '切換【長輩友善大字版】'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto p-4 md:p-6" id="main_layout">
        
        {/* Hospital Header Banner */}
        <header className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white rounded-2xl p-4 shadow-sm border border-slate-100" id="vgh-header">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-teal-50 rounded-xl">
              <Compass className="w-8 h-8 text-teal-700 animate-spin" style={{ animationDuration: '20s' }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight text-teal-900">VGH Smart Guide</h1>
                <span className="bg-teal-100 text-teal-800 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full uppercase">
                  Taipei Taiwan
                </span>
              </div>
              <p className="text-slate-500 text-xs font-semibold mt-0.5">
                台北榮總院內 3D 智慧定位導覽 • AI 行程門診效率管理 App
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {/* Quick SOS Trigger Panel button */}
            <button 
              onClick={() => triggerSOS('中央一樓服務大廳')}
              className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-5 py-3 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-black rounded-xl shadow-lg transition-transform hover:scale-105"
              id="sos-trigger-btn"
            >
              <ShieldAlert className="w-5 h-5 animate-pulse" />
              🚨 跌倒/不適 一鍵 SOS
            </button>
          </div>
        </header>

        {/* SOS ACTIVE EMERGENCY MODAL / OVERLAY IF TRIGGERED */}
        {sosTriggered && (
          <div className="mb-6 bg-red-50 border-4 border-red-500 rounded-3xl p-6 text-teal-950 shadow-2xl relative overflow-hidden animate-pulse animate-duration-1000" id="sos-active-panel">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <ShieldAlert className="w-48 h-48 text-red-600" />
            </div>

            <div className="flex flex-col md:flex-row items-center gap-6 justify-between relative z-10">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-red-600 rounded-2xl text-white animate-ping">
                  <AlertTriangle className="w-10 h-10" />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-red-600">🚨 緊急SOS已連線通知 🚨</h2>
                  <p className="text-sm font-bold text-slate-700 mt-1">
                    我們已將您的精準 Beacon 座標（位置：<span className="underline text-red-700">{sosStation}</span>）發送至大樓醫護理站與駐警保全科、家屬。
                  </p>
                  <p className="text-xs bg-red-200/50 text-red-900 p-2 rounded-lg mt-2 font-mono">
                    藍牙精確度: ±1.2公尺 | 發送編號: VGH-SOS-88214 | 醫療求救狀態: 緊急連線中
                  </p>
                </div>
              </div>

              <div className="text-center bg-white border border-red-200 p-4 rounded-2xl w-full md:w-48 shadow-sm">
                <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">醫護救護急赴</div>
                <div className="text-3xl font-black text-rose-600 my-1">
                  ~ {Math.floor(sosCountdown / 60)}分 {sosCountdown % 60}秒
                </div>
                <div className="text-[10px] text-green-600 font-black">醫護急救包攜帶出發</div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-red-200 flex justify-between items-center flex-wrap gap-2">
              <div className="text-xs text-red-800 font-bold">
                ⚠️ 長輩叮嚀：請您盡量**靠牆安全坐下**或向旁邊民眾示意。請不要再四處移動以利院區志工第一時間尋獲！
              </div>
              <button 
                onClick={cancelSOS}
                className="px-6 py-2 bg-slate-900 text-white font-black hover:bg-slate-800 rounded-xl text-xs uppercase"
              >
                取消求救狀態 (我是誤觸)
              </button>
            </div>
          </div>
        )}

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="grid-container">
          
          {/* LEFT 7 COLUMNS: Interactive Live Map & Live Camera View HUD */}
          <div className="lg:col-span-7 flex flex-col gap-6">

            {/* Map & Camera Container Box */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden" id="navigation_box">
              
              {/* Box Header Toolbar */}
              <div className="bg-slate-50 p-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 bg-green-500 rounded-full animate-ping" />
                  <h2 className="text-base font-black text-slate-800">
                    {viewMode === 'map' ? '🗺️ 台北榮總高畫質 2D 導航地圖' : '📸 實景 AR Camera 後置鏡頭導航面'}
                  </h2>
                </div>
                
                {/* View Switchers */}
                <div className="flex rounded-lg bg-slate-200 p-1 text-xs">
                  <button
                    onClick={() => setViewMode('map')}
                    className={`px-3 py-1.5 rounded-md font-bold transition ${
                      viewMode === 'map' ? 'bg-teal-700 text-white shadow' : 'text-slate-600'
                    }`}
                  >
                    2D 平面定位圖
                  </button>
                  <button
                    onClick={() => setViewMode('ar_camera')}
                    className={`px-3 py-1.5 rounded-md font-bold transition flex items-center gap-1 ${
                      viewMode === 'ar_camera' ? 'bg-teal-700 text-white shadow' : 'text-slate-600'
                    }`}
                  >
                    <Camera className="w-3.5 h-3.5" />
                    AR 實境指向
                  </button>
                </div>
              </div>

              {/* VIEW 1: Flat Map Locator View */}
              {viewMode === 'map' && (
                <div className="p-4 flex flex-col">
                  {/* Floor Selector Tab group */}
                  <div className="flex justify-between items-center mb-4 bg-slate-100 p-1.5 rounded-xl">
                    <span className="text-xs font-bold text-slate-500 px-2">樓層轉換切換：</span>
                    <div className="flex gap-1">
                      {['B2', 'B1', '1F', '2F', '3F'].map((floor) => (
                        <button
                          key={floor}
                          onClick={() => {
                            setCurrentMapFloor(floor);
                            showToast(`🏢 已手動載入醫院 ${floor} 平面大平面圖`);
                          }}
                          className={`w-10 h-8 rounded-lg text-xs font-black transition-all ${
                            currentMapFloor === floor
                              ? 'bg-teal-600 text-white scale-110 shadow-md'
                              : 'bg-white text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {floor}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* SVG High-Fidelity Hospital Map Layout Canvas */}
                  <div className="relative w-full aspect-[4/3] bg-teal-50/40 rounded-2xl border-2 border-slate-100 overflow-hidden" id="vgh-canvas-container">
                    
                    {/* Architectural Grid and Wing Labels */}
                    <div className="absolute inset-0 bg-grid-slate-100 opacity-20 pointer-events-none" />
                    
                    {/* Background Wing indicators */}
                    <div className="absolute top-4 left-4 bg-teal-900/10 text-teal-800 text-xs px-2.5 py-1 rounded font-bold uppercase tracking-widest">
                      台北榮總 中正樓 (Chungcheng Block)
                    </div>
                    <div className="absolute bottom-4 right-4 bg-indigo-900/10 text-indigo-800 text-xs px-2.5 py-1 rounded font-bold uppercase tracking-widest">
                      第一與第二門診大廳方向 (Outpatients Block)
                    </div>

                    <svg className="w-full h-full" viewBox="0 0 100 100">
                      
                      {/* Architectural outline representations of VGH corridors */}
                      {/* Corridors between wings */}
                      <path d="M 25 48 L 50 35 L 75 35 M 42 50 L 55 55 M 45 35 L 42 50 L 50 80" 
                            fill="none" 
                            stroke="#cbd5e1" 
                            strokeWidth="1.8" 
                            strokeDasharray="2,2" 
                      />

                      {/* Highlighted Navigation Route Pathway Line */}
                      {activeNavigation && activeNavigation.path && (
                        <polyline
                          points={activeNavigation.path.map((nodeId: string) => {
                            const node = MAP_NODES.find(n => n.id === nodeId);
                            return node ? `${node.x},${node.y}` : '';
                          }).filter(Boolean).join(' ')}
                          fill="none"
                          stroke={wheelchairMode ? '#2563eb' : '#0d9488'}
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="pathway-pulse-line animate-dash"
                          strokeDasharray="4,4"
                        />
                      )}

                      {/* Draw physical lines connecting the static map nodes */}
                      {MAP_NODES.map((node, i) => (
                        <circle
                          key={`node-pt-${node.id}`}
                          cx={node.x}
                          cy={node.y}
                          r="1.4"
                          fill="#94a3b8"
                        />
                      ))}

                    </svg>

                    {/* Nodes as Interactive Landmarks Overlay Buttons */}
                    {MAP_NODES.map((node, idx) => {
                      const isStart = node.id === routeStartId;
                      const isEnd = node.id === routeEndId;
                      const isCurrentlyAt = idx === simulatedNodeIndex;
                      const isNodeOnSelectedFloor = node.floor === currentMapFloor;

                      if (!isNodeOnSelectedFloor) return null;

                      return (
                        <button
                          key={node.id}
                          onClick={() => handleMarkerSelect(idx)}
                          style={{ left: `${node.x}%`, top: `${node.y}%` }}
                          className={`absolute -translate-x-1/2 -translate-y-1/2 group transition-all z-10 ${
                            isCurrentlyAt ? 'scale-125' : 'hover:scale-110'
                          }`}
                          title={node.name}
                        >
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 shadow-md ${
                            isStart 
                              ? 'bg-amber-500 border-white text-white' 
                              : isEnd 
                                ? 'bg-teal-600 border-white text-white animate-bounce' 
                                : isCurrentlyAt 
                                  ? 'bg-rose-500 border-white text-white' 
                                  : 'bg-white border-slate-300 text-slate-700 hover:bg-teal-50'
                          }`}>
                            {isStart ? '🚩' : isEnd ? '🏁' : '📍'}
                          </div>
                          
                          {/* Rich hover label card */}
                          <div className="absolute bottom-7 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] py-1 px-2 rounded shadow-lg opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap z-30">
                            {node.name} (樓層: {node.floor})
                            {isCurrentlyAt && ' [您在這裡]'}
                          </div>
                        </button>
                      );
                    })}

                    {/* PINGING CURRENT LOCATION RED LASER */}
                    <div 
                      style={{ left: `${currentCoordinates.x}%`, top: `${currentCoordinates.y}%` }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20"
                    >
                      <span className="absolute inline-flex h-10 w-10 -translate-x-1/3 -translate-y-1/3 rounded-full bg-rose-400 opacity-60 animate-ping" />
                      <div className="w-5 h-5 bg-rose-600 rounded-full border-2 border-white flex items-center justify-center text-[8px] text-white font-extrabold shadow shadow-slate-950">
                        我
                      </div>
                    </div>
                  </div>

                  {/* Manual Walk Simulator Controls */}
                  <div className="mt-4 p-3 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-3">
                    <div>
                      <div className="font-black text-slate-700 text-xs">藍牙 Beacon 室內自駕模擬行進</div>
                      <p className="text-slate-400 text-[10px] mt-0.5">點擊「模擬自動前行」即可看著手機自動隨沿著定位點引導移動</p>
                    </div>

                    <div className="flex gap-2 w-full md:w-auto">
                      <button
                        onClick={() => {
                          if (!activeNavigation) {
                            showToast('❌ 請先在右側行程中點選「導航至此」或搜尋目的地來劃設路徑！');
                            return;
                          }
                          setIsSimulatingWalk(!isSimulatingWalk);
                          showToast(isSimulatingWalk ? '⏸️ 已暫停自駕前行模擬。' : '🏃 藍牙 Beacon 室內高精度自動前行引導開始...');
                        }}
                        className={`flex-1 md:flex-initial px-4 py-2 rounded-xl text-xs font-black transition text-nowrap ${
                          isSimulatingWalk 
                            ? 'bg-amber-600 hover:bg-amber-700 text-white' 
                            : 'bg-teal-700 hover:bg-teal-800 text-white'
                        }`}
                      >
                        {isSimulatingWalk ? '⏸ 暫停自動前行' : '🏃 模擬自動前行（逐站測試）'}
                      </button>

                      <button
                        onClick={() => {
                          setSimulatedNodeIndex(0);
                          setCurrentCoordinates({ x: MAP_NODES[0].x, y: MAP_NODES[0].y });
                          setCurrentMapFloor(MAP_NODES[0].floor);
                          setIsSimulatingWalk(false);
                          setHasArrived(false);
                          setNavStepIndex(0);
                          showToast('🔄 已將您的 Beacon 定位點還原起點（中正樓大門）。');
                        }}
                        className="px-3 py-2 bg-slate-200 text-slate-700 hover:bg-slate-300 rounded-xl text-xs font-bold"
                        title="還原位置"
                      >
                        還原點
                      </button>
                    </div>
                  </div>

                  {/* Active Guided Navigation Steps Timeline */}
                  {activeNavigation && (
                    <div className="mt-4 p-4 border-l-4 border-teal-600 bg-teal-50/60 rounded-r-2xl">
                      <div className="flex justify-between items-center mb-1.5">
                        <strong className="text-xs text-teal-900 font-extrabold uppercase tracking-wider flex items-center gap-1">
                          <Navigation className="w-3.5 h-3.5" /> HUD 指示看板及路線
                        </strong>
                        <span className="text-xs bg-teal-100 text-teal-800 font-black px-2 py-0.5 rounded-full">
                          總計大約 {activeNavigation.distance} 公尺 (預估 3 ~ 4 分鐘)
                        </span>
                      </div>
                      
                      {/* Current Direction Text */}
                      <p className="text-sm font-black text-slate-800 leading-snug">
                        {activeNavigation.steps[navStepIndex] || '未進入指示'}
                      </p>

                      {/* Navigation Step progress indicators dots */}
                      <div className="flex items-center gap-1.5 mt-3">
                        {activeNavigation.steps.map((_: any, idx: number) => (
                          <div 
                            key={`step-dot-${idx}`}
                            className={`h-2.5 rounded-full transition-all ${
                              idx === navStepIndex 
                                ? 'w-8 bg-teal-600' 
                                : idx < navStepIndex 
                                  ? 'w-2.5 bg-teal-800' 
                                  : 'w-2 bg-slate-200'
                            }`}
                          />
                        ))}
                        <span className="text-[10px] text-slate-400 font-bold ml-1">
                          第 {navStepIndex + 1} 步 / 共 {activeNavigation.steps.length} 步
                        </span>
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* VIEW 2: AR Camera HUD Overlay View */}
              {viewMode === 'ar_camera' && (
                <div className="relative w-full aspect-[4/3] bg-slate-950 overflow-hidden text-white flex flex-col justify-between">
                  
                  {/* Camera Screen Feed simulation */}
                  {cameraError ? (
                    /* High Fidelity Corridor Simulation Backdrop */
                    <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-teal-950 to-slate-900 flex flex-col items-center justify-center p-8">
                      <div className="absolute inset-0 opacity-10 flex flex-col justify-between p-4 pointer-events-none">
                        <div className="flex justify-between text-[10px] font-mono select-none">
                          <span>FPS: 60.00 | AUTO_HUD_ON</span>
                          <span>LATENCY: 5ms</span>
                        </div>
                        <div className="flex justify-center text-[10px] font-mono text-center">
                          <span>BEACON RECEPTOR: VGH-B1-NOD-442</span>
                        </div>
                      </div>

                      {/* Simulated VGH modern corridor graphics */}
                      <div className="w-52 h-44 border-2 border-dashed border-teal-500/30 rounded-2xl flex flex-col items-center justify-center text-center relative">
                        <span className="absolute inset-0 bg-teal-500/5 animate-pulse" />
                        <Camera className="w-12 h-12 text-teal-400 mb-2 animate-bounce" />
                        <div className="text-xs font-bold text-teal-300">本機相機正在沙盒模擬中</div>
                        <div className="text-[10px] text-slate-400 max-w-[160px] leading-tight mt-1">
                          已為您載入台北榮總中正樓1樓大廳 3D 智慧引導視界
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Actual Camera Stream Target */
                    <video 
                      ref={el => {
                        if (el && cameraStream) {
                          el.srcObject = cameraStream;
                          el.play().catch(e => console.warn(e));
                        }
                      }}
                      className="absolute inset-0 w-full h-full object-cover"
                      playsInline
                      muted
                    />
                  )}

                  {/* AR ACCURACY INFORMATION OVERLAY */}
                  <div className="relative z-10 p-4 bg-slate-950/80 backdrop-blur-sm border-b border-white/10 flex justify-between items-center">
                    <div>
                      <div className="text-xs text-teal-400 font-extrabold uppercase tracking-widest flex items-center gap-1">
                        <Scan className="w-3.5 h-3.5 text-lime-400 animate-pulse" /> AR 智慧導引視野
                      </div>
                      <div className="text-base font-black mt-0.5">
                        目標: <span className="text-yellow-300 font-bold">{pois.find(p=>p.id===routeEndId)?.name || '未選擇目的地'}</span>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      {activeNavigation ? (
                        <>
                          <div className="text-2xl font-black text-lime-400">{activeNavigation.distance - (navStepIndex * 25)}m</div>
                          <div className="text-[10px] text-slate-300">預估 1 分 30 秒抵達</div>
                        </>
                      ) : (
                        <span className="text-xs text-rose-400">目前無計算中路徑</span>
                      )}
                    </div>
                  </div>

                  {/* CENTERING DYNAMIC AR OVERLAY DIRECTIONAL GUIDE ARROWS */}
                  <div className="relative z-10 flex-1 flex items-center justify-center p-8">
                    {activeNavigation && (
                      <div className="flex flex-col items-center select-none text-center animate-pulse pointer-events-none">
                        
                        {/* Dynamic float directional signboard */}
                        <div className="bg-gradient-to-r from-teal-900 to-emerald-950 text-white rounded-3xl p-5 shadow-2xl border-2 border-emerald-400/80 mb-6 max-w-sm">
                          <div className="text-xs font-bold text-teal-300 uppercase tracking-widest">下一個移動方向</div>
                          <div className="text-lg font-black text-white mt-1 leading-snug">
                            {activeNavigation.steps[navStepIndex]?.replace(/(🚩|🎉|♿|🛗|🚶)/g, '') || '向前直行'}
                          </div>
                        </div>

                        {/* Animated 3D Floating Arrow pointing downwards corridor */}
                        <div 
                          className="w-24 h-24 bg-gradient-to-t from-emerald-500 to-teal-800 rounded-full flex items-center justify-center text-white border-4 border-teal-200/50 shadow-2xl scale-125 shadow-emerald-900/60 transition-transform duration-300"
                          style={{ transform: `rotate(${arAngle}deg) scale(1.15)` }}
                        >
                          <span className="text-4xl font-black translate-y-0.5">⬆</span>
                        </div>
                        
                        <div className="text-xs text-emerald-300 font-bold mt-4 tracking-wider bg-slate-900/90 py-1 px-3.5 rounded-full border border-emerald-500/20">
                          🚶 沿此通道直行 20 公尺
                        </div>
                      </div>
                    )}

                    {!activeNavigation && (
                      <div className="text-center">
                        <button
                          onClick={() => handleNavigateToPOI('blood_draw')}
                          className="px-6 py-3.5 bg-teal-600 hover:bg-teal-700 font-black rounded-2xl flex items-center gap-2 border border-teal-400 shadow shadow-slate-900"
                        >
                          🗺️ 一鍵導航至 抽血櫃台 啟用 AR 箭頭
                        </button>
                      </div>
                    )}
                  </div>

                  {/* BOTTOM MENU: Scan Hospital QR Barcode Trigger simulated */}
                  <div className="relative z-10 p-4 bg-slate-950/80 backdrop-blur-sm border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-3">
                    <p className="text-xs text-slate-300 font-medium">
                      📸 台北榮總就醫單快速導航：免去打字！直接持「掛號繳費單」或對準門牌 QR Code。
                    </p>
                    
                    <button
                      onClick={() => setShowQrSimulator(!showQrSimulator)}
                      className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-black rounded-xl text-xs flex items-center gap-1.5 shrink-0"
                    >
                      <Scan className="w-4 h-4" />
                      模擬點擊「掃描就診 QR Code」
                    </button>
                  </div>

                </div>
              )}

            </div>

            {/* QR CODE SCAN SIMULATOR INLINE MODAL DRAW DECK */}
            {showQrSimulator && (
              <div className="bg-slate-900 text-white rounded-3xl p-6 border-2 border-yellow-500" id="qr-scan-simulator">
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Scan className="w-5 h-5 text-yellow-500" />
                    <h3 className="text-base font-black text-yellow-400">模擬掛號單或診診門牌 QR 掃描機</h3>
                  </div>
                  <button onClick={() => setShowQrSimulator(false)} className="text-slate-400 hover:text-white">✕</button>
                </div>
                
                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  在院區中，病患每過一關，皆可拿起手機進行掃碼。免除打字輸入點位，系統會自動轉換為下一站 AR 空中引導！**請點選下方一個診用單據進行體驗模擬：**
                </p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <button
                    onClick={() => executeSimulatedQrScan('blood_draw')}
                    className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-center border border-slate-700 transition"
                  >
                    <div className="text-xl mb-1">🩸</div>
                    <div className="text-xs font-bold text-white">掛號單: 抽血大廳</div>
                    <div className="text-[9px] text-teal-400 mt-1">中正樓1F</div>
                  </button>

                  <button
                    onClick={() => executeSimulatedQrScan('xray')}
                    className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-center border border-slate-700 transition"
                  >
                    <div className="text-xl mb-1">🩻</div>
                    <div className="text-xs font-bold text-white">X光檢驗單: 放射部</div>
                    <div className="text-[9px] text-teal-400 mt-1">中正樓B1</div>
                  </button>

                  <button
                    onClick={() => executeSimulatedQrScan('pharmacy_main')}
                    className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-center border border-slate-700 transition"
                  >
                    <div className="text-xl mb-1">💊</div>
                    <div className="text-xs font-bold text-white">看診後領藥單: 中央藥局</div>
                    <div className="text-[9px] text-teal-400 mt-1">中正樓1F</div>
                  </button>

                  <button
                    onClick={() => executeSimulatedQrScan('cardiology')}
                    className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-center border border-slate-700 transition"
                  >
                    <div className="text-xl mb-1">🩺</div>
                    <div className="text-xs font-bold text-white">診間門牌: 心臟內科門牌</div>
                    <div className="text-[9px] text-teal-400 mt-1">中正樓2F</div>
                  </button>
                </div>
              </div>
            )}

            {/* Smart POI Facility Narration Descriptions Explorer */}
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100" id="facilities_explorers">
              <h3 className="text-base font-black text-slate-800 mb-4 flex items-center gap-2">
                🏛️ 台北榮總院區設施介紹與導覽資訊
              </h3>
              
              <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-thin">
                {pois.map((poiItem) => (
                  <button
                    key={poiItem.id}
                    onClick={() => setSelectedPoi(poiItem)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 whitespace-nowrap ${
                      selectedPoi?.id === poiItem.id
                        ? 'bg-teal-700 text-white shadow'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {poiItem.building} • {poiItem.floor} {poiItem.name.split(' ').pop()}
                  </button>
                ))}
              </div>

              {selectedPoi && (
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl relative">
                  <div className="absolute top-4 right-4 flex gap-1">
                    <button
                      onClick={() => playNarrationAudio(selectedPoi)}
                      className={`p-2 rounded-full transition flex items-center gap-1 ${
                        activeNarration === selectedPoi.id && isNarrating
                          ? 'bg-rose-100 text-rose-700 animate-pulse'
                          : 'bg-teal-50 hover:bg-teal-100 text-teal-700'
                      }`}
                      title="聽這景點語音介紹"
                    >
                      <Volume2 className="w-4 h-4" />
                      <span className="text-[10px] font-bold">
                        {activeNarration === selectedPoi.id && isNarrating ? '暫停廣播中' : '景點語音介紹'}
                      </span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-teal-100 text-teal-800 text-[10px] font-black rounded">
                      {selectedPoi.building} ({selectedPoi.floor})
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                      selectedPoi.crowdLevel.includes('擁擠') 
                        ? 'bg-red-100 text-red-800' 
                        : selectedPoi.crowdLevel.includes('普通') 
                          ? 'bg-amber-100 text-amber-800' 
                          : 'bg-green-100 text-green-800'
                    }`}>
                      即時人潮: {selectedPoi.crowdLevel} (預估候診約 {selectedPoi.waitDuration})
                    </span>
                  </div>

                  <h4 className="text-base font-black text-slate-800 mt-2">{selectedPoi.name}</h4>
                  <p className="text-slate-500 font-semibold text-xs mt-1.5 leading-relaxed">
                    {selectedPoi.description}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-200 flex flex-wrap justify-between items-center gap-4">
                    <span className="text-slate-400 text-[10px]">
                      📍 Beacon定位精度: 1~3公尺藍牙覆蓋 
                    </span>
                    
                    <button
                      onClick={() => handleNavigateToPOI(selectedPoi.id)}
                      className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-extrabold rounded-xl text-xs flex items-center gap-1 shadow-sm"
                    >
                      🗺️ 設定為目的地，立即一鍵導航去此處
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Smart Parking Lot Tracker */}
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100" id="parking_smart_slot_module">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                  <Car className="w-5 h-5 text-indigo-600" /> 🅿️ 台北榮總第二與中正樓地下停車場
                </h3>
                <span className="text-xs bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded">
                  石牌立體 & 地下連通
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-indigo-50/50 p-3 rounded-2xl border border-indigo-100">
                  <div className="text-[10px] text-slate-400 font-bold">即時剩餘空車位</div>
                  <div className="text-2xl font-black text-indigo-700 mt-0.5">{parkingInfo.vacantSpots} 格</div>
                  <div className="text-[9px] text-slate-400">中正樓B2停車場中</div>
                </div>

                <div className="bg-indigo-50/50 p-3 rounded-2xl border border-indigo-100">
                  <div className="text-[10px] text-slate-400 font-bold">費率累計計費</div>
                  <div className="text-2xl font-black text-indigo-700 mt-0.5">NT$ {parkingInfo.feeRate} /hr</div>
                  <div className="text-[9px] text-slate-400">已停：{parkingInfo.elapsedHours} 小時</div>
                </div>

                <div className="bg-indigo-50/50 p-3 rounded-2xl border border-indigo-100">
                  <div className="text-[10px] text-slate-400 font-bold">已產生應付費用</div>
                  <div className="text-2xl font-black text-emerald-700 mt-0.5">NT$ {parkingInfo.unpaidAmount} 元</div>
                  <div className="text-[9px] text-slate-400">全院門診消費可抵停車費</div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-100 rounded-xl text-indigo-800 font-bold text-center text-sm">
                    {parkingInfo.floor}
                    <div className="text-[9px] font-medium leading-none mt-0.5">車位</div>
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-800">
                      您的愛車位置登錄：<span className="text-indigo-700 font-bold">{parkingInfo.spaceNo}</span>
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">車牌智慧自動辨識登記：2026/06/02 {parkingInfo.parkTime.split(' ')[1]}</p>
                  </div>
                </div>

                <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0">
                  <button
                    onClick={() => {
                      handleNavigateToPOI('parking_main');
                      showToast('🚗 已設定您的愛車【中正樓B2 停車格 A-128】為目的地。導航會帶您走下樓電梯前往找車！');
                    }}
                    className="flex-1 md:flex-initial px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-1"
                  >
                    🔍 尋車引導與導航
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT 5 COLUMNS: VGH Controls Panel & Real-time Booking Itineraries */}
          <div className="lg:col-span-5 flex flex-col gap-6" id="dashboard_panel">
            
            {/* PANEL SEGMENT 1: Dynamic Route calculation select box manual selector */}
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
              <h3 className="text-base font-black text-slate-800 mb-3 flex items-center gap-1.5">
                <MapPin className="text-teal-700 w-5 h-5" /> 院內診間與檢查室快速前行
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] text-slate-400 font-black mb-1">起點（我的 Beacon 定位座標點）</label>
                  <select 
                    value={routeStartId} 
                    onChange={(e) => setRouteStartId(e.target.value)}
                    className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
                  >
                    {MAP_NODES.map((node) => (
                      <option key={`start-opt-${node.id}`} value={node.id}>
                        {node.floor}樓 - {node.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 font-black mb-1">終點（我想前往的科別大樓）</label>
                  <select 
                    value={routeEndId} 
                    onChange={(e) => setRouteEndId(e.target.value)}
                    className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
                  >
                    {pois.map((poiItem) => (
                      <option key={`end-opt-${poiItem.id}`} value={poiItem.id}>
                        [{poiItem.building}] {poiItem.floor} - {poiItem.name.split(' ').pop()}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Path Preference Switches */}
                <div>
                  <span className="block text-[10px] text-slate-400 font-black mb-1.5">智慧路線規劃偏好與篩選條件</span>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <label className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-50 hover:bg-slate-100 cursor-pointer transition select-none">
                      <input 
                        type="checkbox" 
                        checked={routePreferences.stairs}
                        disabled={wheelchairMode}
                        onChange={(e) => setRoutePreferences(prev => ({ ...prev, stairs: e.target.checked }))}
                        className="rounded accent-teal-700" 
                      />
                      <span className="text-xs font-bold text-slate-600">🚶 經由樓梯</span>
                    </label>

                    <label className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-50 hover:bg-slate-100 cursor-pointer transition select-none">
                      <input 
                        type="checkbox" 
                        checked={routePreferences.elevator}
                        onChange={(e) => setRoutePreferences(prev => ({ ...prev, elevator: e.target.checked }))}
                        className="rounded accent-teal-700" 
                      />
                      <span className="text-xs font-bold text-slate-600">🛗 優先箱電梯</span>
                    </label>

                    <label className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-50 hover:bg-slate-100 cursor-pointer transition select-none">
                      <input 
                        type="checkbox" 
                        checked={routePreferences.leastCrowded}
                        onChange={(e) => setRoutePreferences(prev => ({ ...prev, leastCrowded: e.target.checked }))}
                        className="rounded accent-teal-700" 
                      />
                      <span className="text-xs font-bold text-slate-600">🟢 避開壅塞</span>
                    </label>

                    <label className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-50 hover:bg-slate-100 cursor-pointer transition select-none">
                      <input 
                        type="checkbox" 
                        checked={routePreferences.rainCovered}
                        onChange={(e) => setRoutePreferences(prev => ({ ...prev, rainCovered: e.target.checked }))}
                        className="rounded accent-teal-700" 
                      />
                      <span className="text-xs font-bold text-slate-600">☔ 全程遮雨</span>
                    </label>
                  </div>
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    onClick={() => triggerRouteCalculation(routeStartId, routeEndId)}
                    className="flex-1 py-3 bg-teal-700 hover:bg-teal-800 text-white font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow"
                  >
                    <Navigation className="w-4 h-4" /> 計算最佳路徑
                  </button>
                </div>

              </div>
            </div>

            {/* PANEL SEGMENT 2: My Personal Outpatient Booking Schedule timeline Integration */}
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100" id="appointments_block">
              <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                <div>
                  <h3 className="text-base font-black text-slate-800 flex items-center gap-1.5">
                    <Activity className="text-teal-700 w-5 h-5 animate-pulse" /> 🗓️ 個人看診行程表整合 (門診+檢查)
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5 font-medium">串接台北榮總 HIS 門診資訊整合系統</p>
                </div>
                
                <div className="flex gap-1.5">
                  <button
                    onClick={handleAIOptimizedSchedules}
                    className="px-3 py-1.5 bg-gradient-to-r from-teal-700 to-emerald-600 hover:from-teal-800 hover:to-emerald-700 text-white font-black rounded-xl text-xs flex items-center gap-1 shadow-md hover:scale-105 active:scale-95 transition-all"
                    id="ai_optimize_btn"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                    {"AI智慧最佳化看診行程"}
                  </button>
                  
                  {aiRecommendationText && (
                    <button
                      onClick={resetSchedulesToDefault}
                      className="px-2 py-1.5 bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl text-xs"
                      title="重設原始時序"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* SPECIAL AI RECOMMENDATION RESPONSE BUBBLE */}
              {showAiRecommenderPane && (
                <div className="mb-4 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-slate-800 text-xs shadow-inner transition-all duration-300 relative animate-fadeIn" id="ai-recommender-response bg">
                  <div className="absolute top-2 right-2">
                    <button onClick={() => setShowAiRecommenderPane(false)} className="text-slate-400 hover:text-slate-900">✕</button>
                  </div>
                  <strong className="text-teal-900 font-extrabold flex items-center gap-1 mb-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500" /> VGH AI 避堵流動演算報告
                  </strong>
                  
                  {reorganizing ? (
                    <div className="py-8 text-center text-slate-400">
                      <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      正在執行 Gemini 大數據排隊擁堵計算...
                    </div>
                  ) : (
                    <div className="prose text-slate-700 leading-relaxed font-medium">
                      <div className="whitespace-pre-line leading-relaxed">
                        {aiRecommendationText || '無推薦分析。'}
                      </div>
                      
                      <div className="mt-3 pt-2 border-t border-amber-200/60 text-[10px] text-amber-600 font-bold flex items-center gap-1">
                        💡 備註：本優化行程已與臺北榮總抽血大廳、X光中心即時藍牙 Beacon 擁擠分析系統同步更新。
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Timeline list of schedules */}
              <div className="relative border-l-2 border-slate-100 ml-4 pl-6 space-y-5" id="schedules-timeline">
                {schedules.map((item, index) => {
                  const matchingPoi = pois.find(p => p.id === item.poiId);
                  const isPoiEndRoute = item.poiId === routeEndId;

                  return (
                    <div key={`sch-${item.id}`} className="relative group">
                      
                      {/* Timeline dot state indicator */}
                      <span className={`absolute -left-10 top-1 w-6.5 h-6.5 rounded-full border-2 bg-white flex items-center justify-center text-[10px] font-black z-10 transition shadow-sm ${
                        item.status === '已完成' 
                          ? 'border-green-600 text-green-600 bg-green-50' 
                          : item.status === '進行中'
                            ? 'border-teal-600 text-teal-700 bg-teal-50 ring-2 ring-teal-600/30 ring-offset-1 animate-pulse'
                            : 'border-slate-300 text-slate-400'
                      }`}>
                        {item.status === '已完成' ? '✓' : index + 1}
                      </span>

                      {/* Header slot with card timeline detail */}
                      <div className={`p-4 rounded-2xl border transition ${
                        isPoiEndRoute
                          ? 'bg-teal-50/50 border-teal-300/80 shadow-md ring-2 ring-teal-500/20'
                          : 'bg-slate-50/70 border-slate-100 hover:border-slate-200'
                      }`}>
                        <div className="flex justify-between items-start flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-slate-400 bg-slate-200 py-0.5 px-2 rounded-md">
                              {item.time}
                            </span>
                            <span className="text-xs text-slate-500 font-bold">
                              {item.location}
                            </span>
                          </div>

                          <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                            item.status === '已完成'
                              ? 'bg-green-100 text-green-800'
                              : item.status === '進行中'
                                ? 'bg-teal-100 text-teal-800'
                                : 'bg-slate-100 text-slate-500'
                          }`}>
                            {item.status}
                          </span>
                        </div>

                        <h4 className="text-sm font-black text-slate-800 mt-1.5">{item.action}</h4>
                        
                        {/* Queue analytics panel */}
                        {matchingPoi && (
                          <div className="mt-2.5 flex items-center justify-between bg-white border border-slate-100 p-2 rounded-xl text-xs">
                            <div className="flex items-center gap-1 text-slate-500 font-bold">
                              <span>現場叫號：</span>
                              <strong className="text-teal-700">{item.queueNo} 號</strong>
                            </div>
                            
                            <div className="flex items-center gap-1 text-slate-500 font-bold">
                              <span>等候人數：</span>
                              <strong className={`${matchingPoi.crowdLevel.includes('🔴') ? 'text-rose-600 font-black' : 'text-amber-600 font-black'}`}>
                                {item.queueWait} 人 ({matchingPoi.crowdLevel})
                              </strong>
                            </div>
                          </div>
                        )}

                        {/* Interactive Nav / Complete handlers inside timeline item */}
                        <div className="mt-3 flex justify-between gap-2">
                          <button
                            onClick={() => {
                              // Toggle complete state
                              setSchedules(prev => prev.map(s => s.id === item.id ? {
                                ...s,
                                status: s.status === '已完成' ? '未開始' : '已完成'
                              } : s));
                              showToast(`已變更行程 【${item.action}】 為 ${item.status === '已完成' ? '未完成' : '已完成'}`);
                            }}
                            className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg text-[11px] transition"
                          >
                            {item.status === '已完成' ? '↩️ 標記未完成' : '✓ 標記已完成'}
                          </button>

                          <button
                            onClick={() => handleNavigateToPOI(item.poiId)}
                            className="px-3.5 py-1.5 bg-teal-700 hover:bg-teal-800 text-white font-extrabold rounded-lg text-[11px] flex items-center gap-1 shadow-sm transition"
                          >
                            <Navigation className="w-3 h-3" /> 一鍵導航至此
                          </button>
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>

            </div>

            {/* PANEL SEGMENT 3: AI Helper Multi-modal Text/Voice Synthesizer Room Widget */}
            <AIChat seniorMode={seniorMode} onNavigateToPOI={handleNavigateToPOI} />

            {/* General Volunteer / Physical Helpdesk Locations Quick Info */}
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100" id="offline_support_widget">
              <h3 className="text-sm font-black text-slate-800 mb-3 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-600" /> 🤝 榮總「紅背心愛心志工」與櫃檯
              </h3>
              
              <p className="text-xs text-slate-500 mb-3 font-semibold leading-relaxed">
                如遇定位信號不良、手機快沒電、或身體極度不適。請就近求助身穿 **「榮總愛心志工紅背心」** 之大德或前往各服務櫃檯：
              </p>

              <div className="space-y-2">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex justify-between text-xs font-bold text-slate-700">
                  <span>📍 中正樓 2F 智慧醫療連廊志工站</span>
                  <button 
                    onClick={() => handleNavigateToPOI('smart_med')}
                    className="text-teal-700 hover:underline"
                  >
                    帶我去
                  </button>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex justify-between text-xs font-bold text-slate-700">
                  <span>📍 中正樓 1F 大堂中央住院登錄服務櫃檯</span>
                  <button 
                    onClick={() => handleNavigateToPOI('blood_draw')}
                    className="text-teal-700 hover:underline"
                  >
                    帶我去
                  </button>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Footer system status */}
      <footer className="mt-16 py-8 border-t border-slate-200 bg-white" id="footer-vgh">
        <div className="max-w-7xl mx-auto px-6 text-center text-slate-400">
          <p className="text-xs font-bold">
            © 2026 Taipei Veterans General Hospital . 臺北榮民總醫院 智慧院區室內定位導流應用測試版 
          </p>
          <p className="text-[10px] mt-1 text-slate-400">
            Powered by Google Cloud Run, Intel Beacon Sensor Group & Gemini 3.5 Flash Language Engine
          </p>
        </div>
      </footer>

    </div>
  );
}
