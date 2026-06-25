import React, { useState, useEffect, useRef } from 'react';
import { AutomationSettings, OcrLog, CropRegion, ConditionOperator } from '../types';
import TerminalLog from './TerminalLog';
import Tesseract from 'tesseract.js';
import { 
  Play, 
  Square, 
  Sliders, 
  Crosshair, 
  Tv, 
  HelpCircle, 
  Info, 
  Volume2, 
  Settings2,
  Sparkles,
  MousePointerClick
} from 'lucide-react';

interface WebAutomatorProps {
  settings: AutomationSettings;
  setSettings: React.Dispatch<React.SetStateAction<AutomationSettings>>;
}

export default function WebAutomator({ settings, setSettings }: WebAutomatorProps) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const [logs, setLogs] = useState<OcrLog[]>([]);
  const [lastExtractedText, setLastExtractedText] = useState('---');
  const [lastExtractedNumber, setLastExtractedNumber] = useState<number | null>(null);
  const [clickRipples, setClickRipples] = useState<{ x: number; y: number; id: number }[]>([]);
  const [ocrProgress, setOcrProgress] = useState<number | null>(null);

  // Canvas and video references
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const ocrIntervalRef = useRef<any | null>(null);
  const demoIntervalRef = useRef<any | null>(null);
  const renderLoopRef = useRef<number | null>(null);

  // State of crop drag interaction
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragType, setDragType] = useState<'move' | 'resize' | null>(null);

  // Simulated live numbers for Demo mode
  const [demoCounter, setDemoCounter] = useState(40);

  // Play trigger sound using Web Audio API Synthesizer
  const playTriggerSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      // Beautiful chime sound
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880.00, ctx.currentTime + 0.12); // A5
      
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {
      console.error("Audio trigger failed: ", e);
    }
  };

  // Helper to add a log entry
  const addLog = (type: 'info' | 'success' | 'warning' | 'error', message: string, text?: string, num?: number) => {
    const timestamp = new Date().toLocaleTimeString('ar-EG', { hour12: false });
    const newLog: OcrLog = {
      id: Math.random().toString(36).substring(7),
      timestamp,
      type,
      message,
      extractedText: text,
      extractedNumber: num !== undefined ? num : undefined
    };
    setLogs((prev) => [...prev, newLog].slice(-100)); // Keep last 100 logs
  };

  // Canvas click listener to set Click Target Coordinates (X, Y)
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    // Calculate click coordinates relative to the actual video resolution drawn in the canvas
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = Math.round((e.clientX - rect.left) * scaleX);
    const y = Math.round((e.clientY - rect.top) * scaleY);

    setSettings(prev => ({
      ...prev,
      clickX: x,
      clickY: y
    }));

    addLog('info', `🎯 تم تحديد نقطة الضغط المستهدفة عند الإحداثيات: X = ${x} بكسل، Y = ${y} بكسل`);
    triggerClickRipple(x, y);
  };

  // Visual click animation helper
  const triggerClickRipple = (x: number, y: number) => {
    const id = Date.now();
    setClickRipples(prev => [...prev, { x, y, id }]);
    setTimeout(() => {
      setClickRipples(prev => prev.filter(r => r.id !== id));
    }, 800);
  };

  // Render loop to draw live video frame on canvas
  const startCanvasRenderLoop = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        // Adjust canvas dimensions to match video stream size
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // Draw the current video frame
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Draw crop area overlay (semi-transparent gray on the rest of screen)
        const crop = settings.cropRegion;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        
        // Draw 4 background boxes around cropped region
        ctx.fillRect(0, 0, canvas.width, crop.y); // top
        ctx.fillRect(0, crop.y, crop.x, crop.height); // left
        ctx.fillRect(crop.x + crop.width, crop.y, canvas.width - (crop.x + crop.width), crop.height); // right
        ctx.fillRect(0, crop.y + crop.height, canvas.width, canvas.height - (crop.y + crop.height)); // bottom

        // Draw the target Crop box border
        ctx.strokeStyle = '#3B82F6'; // Blue
        ctx.lineWidth = 3;
        ctx.strokeRect(crop.x, crop.y, crop.width, crop.height);

        // Draw a subtle focus target in the crop box
        ctx.fillStyle = 'rgba(59, 130, 246, 0.15)';
        ctx.fillRect(crop.x, crop.y, crop.width, crop.height);

        // Bounding box labels
        ctx.fillStyle = '#3B82F6';
        ctx.font = '10px monospace';
        ctx.fillText(`منطقة قراءة OCR [${crop.width}x${crop.height}]`, crop.x + 4, crop.y - 6);

        // Draw the Click Target Coordinate Marker
        const cx = settings.clickX;
        const cy = settings.clickY;
        ctx.beginPath();
        ctx.arc(cx, cy, 12, 0, 2 * Math.PI);
        ctx.strokeStyle = '#F59E0B'; // Amber
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(cx, cy, 4, 0, 2 * Math.PI);
        ctx.fillStyle = '#F59E0B';
        ctx.fill();

        ctx.fillStyle = '#F59E0B';
        ctx.font = '11px sans-serif';
        ctx.fillText(`هدف النقرة (X:${cx}, Y:${cy})`, cx + 15, cy + 4);

        // Draw any active click ripples directly on the canvas
        clickRipples.forEach((ripple) => {
          ctx.beginPath();
          ctx.arc(ripple.x, ripple.y, 35, 0, 2 * Math.PI);
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)'; // Red
          ctx.lineWidth = 3;
          ctx.stroke();
        });
      }
      renderLoopRef.current = requestAnimationFrame(render);
    };

    render();
  };

  // Perform screen capture request via browser standard API
  const startScreenCapture = async () => {
    try {
      setLogs([]);
      setIsDemoMode(false);
      addLog('info', '🖥️ جاري طلب إذن التقاط الشاشة من المتصفح...');
      
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: "browser" },
        audio: false
      });

      streamRef.current = stream;
      setIsCapturing(true);

      // Create video element to feed the stream
      const video = document.createElement('video');
      video.srcObject = stream;
      video.autoplay = true;
      video.playsInline = true;
      videoRef.current = video;

      video.onloadedmetadata = () => {
        video.play();
        startCanvasRenderLoop();
        addLog('info', `✅ تم تفعيل التقاط الشاشة بنجاح! دقة العرض: ${video.videoWidth}x${video.videoHeight} بكسل.`);
        
        // Auto calibrate coordinates relative to video size
        setSettings(prev => ({
          ...prev,
          cropRegion: {
            x: Math.round(video.videoWidth * 0.4),
            y: Math.round(video.videoHeight * 0.4),
            width: 200,
            height: 80
          },
          clickX: Math.round(video.videoWidth * 0.5),
          clickY: Math.round(video.videoHeight * 0.6)
        }));

        startOcrScanning();
      };

      // Handler for screen-share stopped by user via browser built-in UI
      stream.getVideoTracks()[0].onended = () => {
        stopAllAutomation();
        addLog('warning', '⚠️ تم إنهاء مشاركة الشاشة من قبل المستخدم.');
      };

    } catch (err: any) {
      console.error(err);
      addLog('error', `❌ فشل الاتصال بمشاركة الشاشة: ${err.message || err}`);
      setIsCapturing(false);
    }
  };

  // Stop screen sharing and OCR interval
  const stopAllAutomation = () => {
    setIsCapturing(false);
    setIsDemoMode(false);
    setOcrProgress(null);

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (ocrIntervalRef.current) {
      clearInterval(ocrIntervalRef.current);
      ocrIntervalRef.current = null;
    }

    if (demoIntervalRef.current) {
      clearInterval(demoIntervalRef.current);
      demoIntervalRef.current = null;
    }

    if (renderLoopRef.current) {
      cancelAnimationFrame(renderLoopRef.current);
      renderLoopRef.current = null;
    }

    addLog('info', '⏹️ تم إيقاف عملية المراقبة والتحليل وإغلاق التقاط الشاشة.');
  };

  // Perform Local OCR on current Crop Box region
  const captureAndAnalyzeFrame = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || isOcrProcessing) return;

    setIsOcrProcessing(true);

    try {
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) return;

      const crop = settings.cropRegion;
      tempCanvas.width = crop.width;
      tempCanvas.height = crop.height;

      // Draw only the cropped zone from the primary video stream onto our offscreen canvas
      tempCtx.drawImage(
        video,
        crop.x, crop.y, crop.width, crop.height, // Source coordinates
        0, 0, crop.width, crop.height           // Destination coordinates
      );

      // Run Tesseract OCR on the small cropped image
      const result = await Tesseract.recognize(
        tempCanvas,
        'eng',
        {
          logger: m => {
            if (m.status === 'recognizing text') {
              setOcrProgress(Math.round(m.progress * 100));
            }
          }
        }
      );

      const text = result.data.text.trim();
      setOcrProgress(null);
      
      // Parse out the first number found in OCR result
      const numberRegex = /\d+(?:\.\d+)?/;
      const match = text.match(numberRegex);
      
      if (match) {
        const parsedNumber = parseFloat(match[0]);
        setLastExtractedText(text);
        setLastExtractedNumber(parsedNumber);
        
        // Execute conditional evaluation
        evaluateConditionAndTrigger(parsedNumber, text);
      } else {
        setLastExtractedText(text || '[لا يوجد نص]');
        setLastExtractedNumber(null);
        addLog('info', `🔎 تم فحص المربع بنجاح: لم يتم العثور على أرقام.`, text);
      }

    } catch (err: any) {
      console.error(err);
      addLog('error', `❌ حدث خطأ أثناء إجراء OCR للقطة: ${err.message || err}`);
    } finally {
      setIsOcrProcessing(false);
    }
  };

  // Evaluation logic and click trigger simulation
  const evaluateConditionAndTrigger = (num: number, fullText: string) => {
    const thresh = settings.thresholdValue;
    const op = settings.operator;
    let success = false;

    switch (op) {
      case '>': success = num > thresh; break;
      case '<': success = num < thresh; break;
      case '==': success = num === thresh; break;
      case '>=': success = num >= thresh; break;
      case '<=': success = num <= thresh; break;
    }

    if (success) {
      addLog('success', `🎉 الشرط محقق! الرقم المقروء (${num}) ${op} عتبة المقارنة (${thresh}).`, fullText, num);
      addLog('warning', `⚡️ محاكاة ضغط تلقائي فوري للأندرويد عند الإحداثيات: X = ${settings.clickX}، Y = ${settings.clickY}`, undefined, undefined);
      
      // Perform local visualizations
      playTriggerSound();
      triggerClickRipple(settings.clickX, settings.clickY);
    } else {
      addLog('info', `⏱️ تم الفحص: الرقم المقروء هو (${num}). الشرط [${num} ${op} ${thresh}] لم يتحقق بعد.`, fullText, num);
    }
  };

  // Start the repeat interval for OCR scanning
  const startOcrScanning = () => {
    if (ocrIntervalRef.current) clearInterval(ocrIntervalRef.current);
    
    ocrIntervalRef.current = setInterval(() => {
      captureAndAnalyzeFrame();
    }, settings.intervalMs);

    addLog('info', `⚙️ تم تشغيل محرك OCR المتكرر بمعدل فحص كل ${settings.intervalMs} مللي ثانية.`);
  };

  // Start offline interactive demo playground mode
  const startDemoMode = () => {
    stopAllAutomation();
    setLogs([]);
    setIsDemoMode(true);
    addLog('info', '🎮 تم تفعيل "الوضع التجريبي الآمن" لمحاكاة التطبيق بدون تصوير الشاشة!');
    addLog('info', '⚙️ سيقوم العداد الافتراضي بتغيير قيمته كل ثانية لمحاكاة تغير شاشة الهاتف.');

    // Start simulated ticks
    let currentVal = 40;
    demoIntervalRef.current = setInterval(() => {
      // Random walk or periodic increment of values
      const change = Math.floor(Math.random() * 15) - 6; // random change from -6 to +8
      currentVal = Math.max(1, currentVal + change);
      
      // Keep within a good testing range
      if (currentVal > 150) currentVal = 20;
      setDemoCounter(currentVal);

      setLastExtractedText(`السرعة الحالية: ${currentVal} كم/س`);
      setLastExtractedNumber(currentVal);

      // Evaluate simulated value
      evaluateConditionAndTrigger(currentVal, `السرعة الحالية: ${currentVal} كم/س`);

    }, 3000); // Check every 3s for user friendly tracking
  };

  // Apply settings modifications on the fly
  const updateSettingsProperty = (property: keyof AutomationSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [property]: value
    }));
    addLog('info', `🛠️ تم تعديل الإعداد [${property}] إلى القيمة: ${value}`);
  };

  const updateCropProperty = (property: keyof CropRegion, value: number) => {
    setSettings(prev => ({
      ...prev,
      cropRegion: {
        ...prev.cropRegion,
        [property]: value
      }
    }));
  };

  useEffect(() => {
    return () => {
      stopAllAutomation();
    };
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-right" dir="rtl">
      
      {/* Side Control Configuration Form (4 columns) */}
      <div className="lg:col-span-4 space-y-6">
        
        {/* Core Controls */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
            <Settings2 className="w-5 h-5 text-blue-500" />
            إعدادات شروط الأتمتة والضغط
          </h3>

          {/* Condition Logic Selection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 block">أداة المقارنة البرمجية:</label>
            <div className="grid grid-cols-5 gap-1.5" dir="ltr">
              {(['>', '<', '==', '>=', '<='] as ConditionOperator[]).map((op) => (
                <button
                  key={op}
                  onClick={() => updateSettingsProperty('operator', op)}
                  className={`py-1.5 text-xs font-bold font-mono rounded-lg transition-all border ${
                    settings.operator === op
                      ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                >
                  {op}
                </button>
              ))}
            </div>
          </div>

          {/* Threshold value input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 flex justify-between">
              <span>قيمة العتبة المستهدفة (Threshold):</span>
              <span className="font-mono text-blue-600 font-bold">{settings.thresholdValue}</span>
            </label>
            <input
              type="number"
              value={settings.thresholdValue}
              onChange={(e) => updateSettingsProperty('thresholdValue', parseFloat(e.target.value) || 0)}
              className="w-full text-left font-mono px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="مثال: 50"
            />
          </div>

          {/* Target click Coordinates */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 block">إحداثيات نقطة الضغط المستهدفة (بكسل):</label>
            <div className="grid grid-cols-2 gap-3" dir="ltr">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 block">X (المسافة الأفقية):</span>
                <input
                  type="number"
                  value={settings.clickX}
                  onChange={(e) => updateSettingsProperty('clickX', parseInt(e.target.value) || 0)}
                  className="w-full text-center font-mono px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 block">Y (المسافة العمودية):</span>
                <input
                  type="number"
                  value={settings.clickY}
                  onChange={(e) => updateSettingsProperty('clickY', parseInt(e.target.value) || 0)}
                  className="w-full text-center font-mono px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>
            </div>
            <p className="text-[10px] text-slate-400 leading-normal">
              💡 نصيحة: يمكنك تحديد موضع الضغط مباشرة بمجرد النقر على شاشة البث المباشر المقابلة!
            </p>
          </div>

          {/* Scanning Speed Interval */}
          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-semibold text-slate-700 flex justify-between">
              <span>سرعة فحص الشاشة (OCR Interval):</span>
              <span className="font-mono text-emerald-600 font-bold">{settings.intervalMs} ms</span>
            </label>
            <input
              type="range"
              min="500"
              max="5000"
              step="100"
              value={settings.intervalMs}
              onChange={(e) => updateSettingsProperty('intervalMs', parseInt(e.target.value))}
              className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-[9px] text-slate-400 font-mono">
              <span>أسرع (0.5 ثانية)</span>
              <span>أبطأ (5 ثواني)</span>
            </div>
          </div>
        </div>

        {/* Dynamic Crop Coordinates Adjuster */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
            <Sliders className="w-5 h-5 text-indigo-500" />
            تحديد مستطيل القراءة (Crop Zone)
          </h3>
          
          <div className="space-y-2.5">
            {/* Crop X */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-600">الإزاحة الأفقية (X Offset):</span>
                <span className="font-mono font-semibold text-indigo-600">{settings.cropRegion.x}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="1000"
                value={settings.cropRegion.x}
                onChange={(e) => updateCropProperty('x', parseInt(e.target.value))}
                className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>

            {/* Crop Y */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-600">الإزاحة العمودية (Y Offset):</span>
                <span className="font-mono font-semibold text-indigo-600">{settings.cropRegion.y}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="1000"
                value={settings.cropRegion.y}
                onChange={(e) => updateCropProperty('y', parseInt(e.target.value))}
                className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>

            {/* Crop Width */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-600">عرض المربع (Width):</span>
                <span className="font-mono font-semibold text-indigo-600">{settings.cropRegion.width}px</span>
              </div>
              <input
                type="range"
                min="50"
                max="500"
                value={settings.cropRegion.width}
                onChange={(e) => updateCropProperty('width', parseInt(e.target.value))}
                className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>

            {/* Crop Height */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-600">ارتفاع المربع (Height):</span>
                <span className="font-mono font-semibold text-indigo-600">{settings.cropRegion.height}px</span>
              </div>
              <input
                type="range"
                min="30"
                max="250"
                value={settings.cropRegion.height}
                onChange={(e) => updateCropProperty('height', parseInt(e.target.value))}
                className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>
          </div>
        </div>

      </div>

      {/* Primary Video Display Frame (8 columns) */}
      <div className="lg:col-span-8 space-y-6">
        
        {/* Playback Container */}
        <div className="bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-xl flex flex-col">
          
          {/* Header Dashboard status */}
          <div className="bg-slate-900 px-5 py-4 border-b border-slate-800 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Tv className="w-5 h-5 text-blue-400" />
                <h4 className="font-bold text-sm text-slate-100">شاشة البث والمحاكاة المباشرة</h4>
              </div>
              {isCapturing && (
                <span className="flex items-center gap-1 bg-emerald-500/10 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/20 animate-pulse font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                  بث مباشر نشط
                </span>
              )}
              {isDemoMode && (
                <span className="flex items-center gap-1 bg-amber-500/10 text-amber-400 text-[10px] px-2 py-0.5 rounded-full border border-amber-500/20 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block animate-ping"></span>
                  الوضع التجريبي
                </span>
              )}
            </div>

            {/* Launch Action triggers */}
            <div className="flex items-center gap-2">
              {!isCapturing && !isDemoMode ? (
                <>
                  <button
                    onClick={startScreenCapture}
                    className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-md shadow-blue-900/30 active:scale-95"
                  >
                    <Play size={14} />
                    بث ومراقبة الشاشة
                  </button>
                  <button
                    onClick={startDemoMode}
                    className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs px-4 py-2 rounded-xl transition-all border border-slate-700"
                  >
                    <Sparkles size={13} className="text-amber-400" />
                    تشغيل محاكاة تجريبية
                  </button>
                </>
              ) : (
                <button
                  onClick={stopAllAutomation}
                  className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-md shadow-rose-950/30 active:scale-95 animate-pulse"
                >
                  <Square size={14} />
                  إيقاف البث والتعرف
                </button>
              )}
            </div>
          </div>

          {/* Visual Canvas Display Frame */}
          <div className="relative bg-slate-950 flex items-center justify-center p-2 min-h-[350px] overflow-hidden">
            
            {/* Primary Live Canvas */}
            <canvas
              ref={canvasRef}
              onClick={handleCanvasClick}
              className={`max-w-full rounded-lg shadow-inner max-h-[480px] object-contain cursor-crosshair transition-all duration-300 ${
                (isCapturing || isDemoMode) ? 'block' : 'hidden'
              }`}
            />

            {/* Welcome Placeholder / Idle state */}
            {!isCapturing && !isDemoMode && (
              <div className="p-8 text-center max-w-md space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-blue-950 border border-blue-800 flex items-center justify-center mx-auto text-blue-400 shadow-lg shadow-blue-950/40">
                  <Crosshair className="w-8 h-8 animate-spin" />
                </div>
                <div className="space-y-1.5">
                  <h5 className="font-bold text-slate-200 text-base">بث الشاشة وتدقيق النقرات المبرمجة</h5>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    اضغط على <strong className="text-blue-400">بث ومراقبة الشاشة</strong> لاختيار نافذة (مثل صفحة ويب بها أرقام متغيرة) ليقوم محرك OCR للتعرف على النصوص بمراقبتها والضغط عند تحقق شرطك فوراً!
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    onClick={startDemoMode}
                    className="text-xs text-blue-400 hover:text-blue-300 underline font-medium"
                  >
                    أو اضغط هنا لتشغيل محاكاة ذاتية تفاعلية وسريعة
                  </button>
                </div>
              </div>
            )}

            {/* OCR Processing Overlay Spinner */}
            {isOcrProcessing && (
              <div className="absolute top-4 left-4 bg-slate-900/90 border border-slate-800 backdrop-blur-sm px-3 py-1.5 rounded-xl flex items-center gap-2 text-[10px] text-slate-300 shadow-md">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></span>
                <span>محرك التعرف OCR يحلل الشاشة... {ocrProgress !== null && `[${ocrProgress}%]`}</span>
              </div>
            )}
          </div>

          {/* Real-Time Extractions Indicator HUD Footer */}
          <div className="bg-slate-900 px-5 py-4 border-t border-slate-800 grid grid-cols-2 gap-4 text-center">
            
            {/* Extracted string status */}
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-850 space-y-1 text-right">
              <span className="text-[10px] text-slate-400 block font-semibold">محتوى النص المستخرج من المربع:</span>
              <p className="font-mono text-xs text-slate-100 truncate" dir="ltr">
                {lastExtractedText}
              </p>
            </div>

            {/* Parsed target number status */}
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-850 space-y-1 text-right">
              <span className="text-[10px] text-slate-400 block font-semibold">الرقم المستخرج الذي جرى مقارنته:</span>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-mono">PARSED NUMBER</span>
                <span className="font-mono text-sm text-yellow-400 font-bold">
                  {lastExtractedNumber !== null ? lastExtractedNumber : '---'}
                </span>
              </div>
            </div>

          </div>

        </div>

        {/* Console scrolling logs */}
        <TerminalLog logs={logs} onClear={() => setLogs([])} />

      </div>

    </div>
  );
}
