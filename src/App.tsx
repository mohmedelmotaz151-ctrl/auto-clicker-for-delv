import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Tv, 
  Smartphone, 
  BookOpen, 
  Download, 
  Settings, 
  HelpCircle, 
  FileCode, 
  Copy, 
  Check, 
  AlertCircle,
  Play,
  Layers,
  Wrench,
  Crosshair
} from 'lucide-react';
import WebAutomator from './components/WebAutomator';
import AndroidGuide from './components/AndroidGuide';
import { generateAndroidProject } from './androidProjectFiles';
import { AutomationSettings, AndroidConfig } from './types';
import JSZip from 'jszip';

export default function App() {
  const [activeTab, setActiveTab] = useState<'automator' | 'exporter' | 'guide'>('automator');
  
  // Shared Automation settings
  const [settings, setSettings] = useState<AutomationSettings>({
    operator: '>',
    thresholdValue: 50,
    clickX: 500,
    clickY: 1200,
    cropRegion: {
      x: 350,
      y: 450,
      width: 250,
      height: 100
    },
    intervalMs: 2000
  });

  // Android specific configuration
  const [androidConfig, setAndroidConfig] = useState<AndroidConfig>({
    packageName: 'com.ocr.autoclicker',
    appName: 'أوتو كليكر القارئ الذكي',
    serviceName: 'خدمة الضغط التلقائي الذكية',
    overlayTitle: 'نافذة التحكم العائمة'
  });

  const [isZipGenerating, setIsZipGenerating] = useState(false);
  const [selectedFileToView, setSelectedFileToView] = useState<string>('app/src/main/java/com/ocr/autoclicker/FloatingOverlayService.kt');
  const [copiedFile, setCopiedFile] = useState(false);

  // Helper to generate dynamic file paths based on package name
  const getSelectedFileKey = () => {
    const pkgDir = androidConfig.packageName.replace(/\./g, '/');
    if (selectedFileToView.includes('MainActivity.kt')) {
      return `app/src/main/java/${pkgDir}/MainActivity.kt`;
    }
    if (selectedFileToView.includes('MyAccessibilityService.kt')) {
      return `app/src/main/java/${pkgDir}/MyAccessibilityService.kt`;
    }
    if (selectedFileToView.includes('FloatingOverlayService.kt')) {
      return `app/src/main/java/${pkgDir}/FloatingOverlayService.kt`;
    }
    if (selectedFileToView.includes('OcrAnalyzer.kt')) {
      return `app/src/main/java/${pkgDir}/OcrAnalyzer.kt`;
    }
    return selectedFileToView;
  };

  const projectFiles = generateAndroidProject(androidConfig, settings);
  const fileKey = getSelectedFileKey();
  const fileContentToShow = projectFiles[fileKey] || projectFiles[Object.keys(projectFiles)[0]] || '';

  // Copy code utility
  const handleCopyCode = () => {
    navigator.clipboard.writeText(fileContentToShow);
    setCopiedFile(true);
    setTimeout(() => setCopiedFile(false), 2000);
  };

  // Generate and download zip containing full Android project
  const handleDownloadZip = async () => {
    setIsZipGenerating(true);
    try {
      const zip = new JSZip();
      const files = generateAndroidProject(androidConfig, settings);
      
      // Populate files into zip structure
      Object.entries(files).forEach(([path, content]) => {
        zip.file(path, content);
      });

      // Generate binary ZIP blob
      const content = await zip.generateAsync({ type: 'blob' });
      
      // Download blob locally
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Android_OCR_AutoClicker_${androidConfig.packageName}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('ZIP compilation error:', err);
      alert('حدث خطأ أثناء حزم ملفات المشروع.');
    } finally {
      setIsZipGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans" dir="rtl">
      {/* Header Bar */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-200">
              <Crosshair size={22} className="animate-pulse" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">مساعد الضغط التلقائي الحقيقي وقارئ الشاشة (OCR) بالجوال</h1>
              <p className="text-[10px] text-blue-600 font-bold font-mono">NATIVE ANDROID REAL SCREEN MONITOR & ACCESSIBILITY CLICKER</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center bg-slate-100 p-1 rounded-xl max-w-full overflow-x-auto scrollbar-none whitespace-nowrap shrink-0 w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('automator')}
              className={`flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all shrink-0 ${
                activeTab === 'automator'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Tv size={14} />
              1. معايرة مستطيل القراءة وإحداثيات الضغط
            </button>
            <button
              onClick={() => setActiveTab('exporter')}
              className={`flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all shrink-0 ${
                activeTab === 'exporter'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Smartphone size={14} />
              2. حزم وتنزيل الكود المصدري للهاتف
            </button>
            <button
              onClick={() => setActiveTab('guide')}
              className={`flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all shrink-0 ${
                activeTab === 'guide'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <BookOpen size={14} />
              3. طريقة التثبيت وتفعيل الخدمة بالهاتف
            </button>
          </nav>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          {/* Tab 1: Live Web Automator Playground */}
          {activeTab === 'automator' && (
            <div className="space-y-6">
              {/* Feature Banner */}
              <div className="bg-slate-900 text-slate-100 p-6 rounded-2xl flex items-center justify-between flex-wrap gap-4 border border-slate-800 shadow-lg">
                <div className="space-y-1.5">
                  <h2 className="text-base font-bold flex items-center gap-2 text-white">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block animate-ping"></span>
                    محطة معايرة الحساس والـ OCR واختيار أهداف الضغط
                  </h2>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">
                    هنا تقوم بتحديد <strong>مستطيل الفحص (Crop Zone)</strong> و <strong>إحداثيات الضغط (Click Coordinates)</strong> والشرط الرياضي. يمكنك الضغط على زر "بدء البث" واختيار شاشة لمعايرتها بدقة. هذه القيم سيتم دمجها تلقائياً داخل تطبيق الأندرويد الحقيقي ليعمل بالخلفية على شاشة جوالك مباشرة!
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('guide')}
                  className="bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white px-4 py-2 rounded-xl transition-all shadow-md shadow-blue-900/40"
                >
                  افتح دليل إعداد الهاتف 📱
                </button>
              </div>

              {/* Automator Body */}
              <WebAutomator settings={settings} setSettings={setSettings} />
            </div>
          )}

          {/* Tab 2: Android Project Exporter and Code Inspector */}
          {activeTab === 'exporter' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-right">
              
              {/* Configuration forms (5 cols) */}
              <div className="lg:col-span-5 space-y-6">
                
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-5">
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <Settings className="w-5 h-5 text-blue-500" />
                      إعداد الحزمة وتسمية التطبيق
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-1">قم بتخصيص إعدادات الهوية لتطبيق الأندرويد الخاص بك</p>
                  </div>

                  <div className="space-y-4">
                    {/* App Name */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 block">اسم التطبيق بالهاتف:</label>
                      <input
                        type="text"
                        value={androidConfig.appName}
                        onChange={(e) => setAndroidConfig(prev => ({ ...prev, appName: e.target.value }))}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Package Name */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 block">اسم الحزمة الفريد (Package Name):</label>
                      <input
                        type="text"
                        value={androidConfig.packageName}
                        onChange={(e) => setAndroidConfig(prev => ({ ...prev, packageName: e.target.value }))}
                        className="w-full px-3 py-2 text-xs font-mono text-left bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g. com.example.ocr"
                      />
                    </div>

                    {/* Accessibility Name */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 block">اسم خدمة إمكانية الوصول (بالإعدادات):</label>
                      <input
                        type="text"
                        value={androidConfig.serviceName}
                        onChange={(e) => setAndroidConfig(prev => ({ ...prev, serviceName: e.target.value }))}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Overlay Title */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 block">عنوان شريط النافذة المنبثقة العائمة:</label>
                      <input
                        type="text"
                        value={androidConfig.overlayTitle}
                        onChange={(e) => setAndroidConfig(prev => ({ ...prev, overlayTitle: e.target.value }))}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Generate Button */}
                  <div className="pt-3">
                    <button
                      onClick={handleDownloadZip}
                      disabled={isZipGenerating}
                      className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs py-3.5 rounded-xl transition-all shadow-md shadow-blue-100 disabled:opacity-50 active:scale-98"
                    >
                      <Download size={16} className={isZipGenerating ? 'animate-bounce' : ''} />
                      {isZipGenerating ? 'جاري إنشاء حزمة ZIP للمشروع...' : 'تحميل كود الأندرويد كاملاً (ZIP)'}
                    </button>
                    <p className="text-[10px] text-slate-400 mt-2 text-center leading-normal">
                      🎉 جاهز للتنزيل! بمجرد النقر، سيتم تجميع كود لغة Kotlin وملفات XML والمانيفست وهيكلية Gradle في ملف ZIP يمكنك فتحه برمجياً ببرنامج Android Studio.
                    </p>
                  </div>
                </div>

                {/* Automation Parameters summary banner */}
                <div className="bg-slate-900 text-slate-200 p-5 rounded-2xl border border-slate-800 space-y-3 shadow-md">
                  <h4 className="font-bold text-xs text-white flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-amber-400" />
                    المتغيرات المحقونة برمجياً داخل كود الأندرويد:
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-[11px] font-mono">
                    <div className="bg-slate-950 p-2 rounded border border-slate-800">
                      <span className="text-slate-500 block">الشرط الإفتراضي:</span>
                      <span className="text-emerald-400 font-bold">{settings.operator} {settings.thresholdValue}</span>
                    </div>
                    <div className="bg-slate-950 p-2 rounded border border-slate-800">
                      <span className="text-slate-500 block">إحداثيات النقرة:</span>
                      <span className="text-blue-400 font-bold">X:{settings.clickX}, Y:{settings.clickY}</span>
                    </div>
                    <div className="bg-slate-950 p-2 rounded border border-slate-800">
                      <span className="text-slate-500 block">منطقة القراءة (X,Y):</span>
                      <span className="text-indigo-400">({settings.cropRegion.x},{settings.cropRegion.y})</span>
                    </div>
                    <div className="bg-slate-950 p-2 rounded border border-slate-800">
                      <span className="text-slate-500 block">حجم مربع القراءة:</span>
                      <span className="text-indigo-400">{settings.cropRegion.width}x{settings.cropRegion.height}px</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Code viewer (7 cols) */}
              <div className="lg:col-span-7 space-y-4">
                <div className="bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-xl flex flex-col h-[380px] sm:h-[500px] lg:h-[650px]">
                  
                  {/* Code Viewer Header selector */}
                  <div className="bg-slate-900 px-4 py-3 border-b border-slate-850 flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2.5">
                      <FileCode className="w-5 h-5 text-blue-400" />
                      <select
                        value={selectedFileToView}
                        onChange={(e) => setSelectedFileToView(e.target.value)}
                        className="bg-slate-950 text-slate-200 border border-slate-800 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 max-w-xs"
                      >
                        <option value="app/src/main/java/com/ocr/autoclicker/FloatingOverlayService.kt">
                          FloatingOverlayService.kt (مستشعر الشاشة والنقرات العائم)
                        </option>
                        <option value="app/src/main/java/com/ocr/autoclicker/MyAccessibilityService.kt">
                          MyAccessibilityService.kt (خدمة نقرات الأندرويد الآمنة)
                        </option>
                        <option value="app/src/main/java/com/ocr/autoclicker/OcrAnalyzer.kt">
                          OcrAnalyzer.kt (محرك ML Kit للتعرف على النصوص)
                        </option>
                        <option value="app/src/main/java/com/ocr/autoclicker/MainActivity.kt">
                          MainActivity.kt (واجهة مستخدم تفعيل الأذونات)
                        </option>
                        <option value="app/src/main/AndroidManifest.xml">
                          AndroidManifest.xml (الأذونات وتسجيل الخدمات)
                        </option>
                        <option value="app/src/main/res/xml/accessibility_service_config.xml">
                          accessibility_service_config.xml (تكوين إمكانية الوصول)
                        </option>
                        <option value="app/build.gradle">
                          build.gradle (مكتبات Gradle والتبعيات للـ OCR)
                        </option>
                      </select>
                    </div>

                    {/* Copy Button */}
                    <button
                      onClick={handleCopyCode}
                      className="flex items-center gap-1 text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-2.5 py-1.5 rounded-lg transition-all active:scale-95"
                    >
                      {copiedFile ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                      {copiedFile ? 'تم النسخ!' : 'نسخ الكود'}
                    </button>
                  </div>

                  {/* Pre-formatted code block */}
                  <div className="p-4 overflow-auto flex-1 font-mono text-[11px] text-slate-300 text-left bg-slate-950 custom-scrollbar select-all" dir="ltr">
                    <pre className="whitespace-pre">{fileContentToShow}</pre>
                  </div>

                </div>
              </div>

            </div>
          )}

          {/* Tab 3: Detailed Interactive Help Guide */}
          {activeTab === 'guide' && (
            <AndroidGuide />
          )}
        </motion.div>
      </main>

      {/* Footer credits and information */}
      <footer className="bg-white border-t border-slate-100 py-8 mt-16 text-center text-xs text-slate-400" dir="ltr">
        <p>© {new Date().getFullYear()} Android OCR Auto Clicker. Generated dynamically inside Google AI Studio.</p>
        <p className="mt-1">Powered by React, Tailwind CSS, Tesseract.js, Google ML Kit, and Android Accessibility APIs.</p>
      </footer>
    </div>
  );
}
