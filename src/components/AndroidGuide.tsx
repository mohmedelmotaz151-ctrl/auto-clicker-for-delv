import React from 'react';
import { 
  Download, 
  Settings, 
  Layers, 
  HelpCircle, 
  Smartphone, 
  CheckCircle2, 
  Code2, 
  ArrowLeft,
  Terminal,
  AlertTriangle,
  Flame,
  MousePointerClick
} from 'lucide-react';

export default function AndroidGuide() {
  return (
    <div className="space-y-8 text-slate-800" dir="rtl">
      {/* Introduction Card */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
        <div className="absolute top-0 left-0 transform -translate-x-12 -translate-y-12 opacity-10 w-48 h-48 rounded-full bg-white"></div>
        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-2">
            <Smartphone className="w-8 h-8 text-blue-100" />
            <h2 className="text-2xl font-bold">دليل تشغيل التطبيق على الأندرويد</h2>
          </div>
          <p className="text-blue-100 text-sm max-w-2xl leading-relaxed">
            تمت برمجة التطبيق بالكامل بلغة <strong className="text-white">Kotlin</strong> النظيفة ليعمل مباشرة على هاتفك وبدون الحاجة لصلاحيات الروت (No Root) وذلك عبر استثمار واجهات برمجة تطبيقات الأندرويد الرسمية.
          </p>
        </div>
      </div>

      {/* Step by Step Timeline */}
      <div className="space-y-6">
        <h3 className="text-lg font-bold text-slate-900 border-r-4 border-blue-500 pr-3">مراحل التثبيت والتشغيل</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Step 1 */}
          <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 font-bold flex items-center justify-center shrink-0">1</div>
            <div className="space-y-2">
              <h4 className="font-bold text-slate-950 flex items-center gap-2">
                <Download className="w-4.5 h-4.5 text-blue-500" />
                تحميل المشروع واستيراده
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                اضغط على زر <strong className="text-blue-600">تحميل الكود كاملاً (ZIP)</strong> في التبويب المخصص، ثم قم بفك الضغط عنه. افتح برنامج <strong className="text-slate-700">Android Studio</strong> واختر <strong className="text-slate-700">Open</strong> ثم حدد مجلد المشروع المستخرج.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex gap-4">
            <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 font-bold flex items-center justify-center shrink-0">2</div>
            <div className="space-y-2">
              <h4 className="font-bold text-slate-950 flex items-center gap-2">
                <Code2 className="w-4.5 h-4.5 text-indigo-500" />
                البناء والتثبيت (Build & Install)
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                قم بتوصيل هاتفك بالكمبيوتر وتفعيل خيار <strong className="text-indigo-600">USB Debugging</strong>، أو قم بتشغيل المحاكي الرسمي. اضغط على زر <strong className="text-emerald-600">Run (icon ▶)</strong> في شريط الأدوات العلوي ليتم بناء وتثبيت التطبيق تلقائياً.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex gap-4">
            <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 font-bold flex items-center justify-center shrink-0">3</div>
            <div className="space-y-2">
              <h4 className="font-bold text-slate-950 flex items-center gap-2">
                <Layers className="w-4.5 h-4.5 text-amber-500" />
                إذن الظهور فوق التطبيقات (Overlay)
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                عند فتح التطبيق على هاتفك، اضغط على زر <strong className="text-amber-600">تفعيل النافذة العائمة</strong>. سيقوم التطبيق بنقلك لصفحة إعدادات النظام، قم بالبحث عن اسم التطبيق وتفعيل خيار <strong className="text-slate-700">الظهور فوق التطبيقات الأخرى (System Alert Window)</strong>.
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex gap-4">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 font-bold flex items-center justify-center shrink-0">4</div>
            <div className="space-y-2">
              <h4 className="font-bold text-slate-950 flex items-center gap-2">
                <Settings className="w-4.5 h-4.5 text-emerald-500" />
                خدمة إمكانية الوصول (Accessibility)
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                اضغط على زر <strong className="text-emerald-600">تفعيل خدمة إمكانية الوصول</strong>. سيوجهك النظام لقائمة الخدمات المثبتة (Installed Services)، ابحث عن خيار <strong className="text-slate-800">إمكانية الوصول للنقرات</strong> وقم بتفعيله. هذه الصلاحية هي ما يتيح ضغط الشاشة آلياً وبأمان.
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Safety & Design Architecture Insights */}
      <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-5 space-y-4">
        <h4 className="font-bold text-slate-900 flex items-center gap-2">
          <Terminal className="w-5 h-5 text-slate-700" />
          شرح آلية العمل البرمجية في الأندرويد
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600 leading-relaxed">
          <div className="bg-white p-4 rounded-lg border border-slate-100 space-y-2">
            <div className="w-7 h-7 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 font-bold mb-1">A</div>
            <h5 className="font-semibold text-slate-900">1. تصوير الشاشة (Screen Capture)</h5>
            <p>يستخدم التطبيق <strong className="text-indigo-600">MediaProjection API</strong> لالتقاط دفق محتويات الشاشة في الخلفية بترميز RGBA_8888 وتحويلها لـ Bitmap بدون روت.</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-slate-100 space-y-2">
            <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 font-bold mb-1">B</div>
            <h5 className="font-semibold text-slate-900">2. المعالجة السريعة (OCR Engine)</h5>
            <p>نقوم بقص المنطقة المعينة وتمريرها لمكتبة <strong className="text-blue-600">Google ML Kit Text Recognition</strong> محلياً بالكامل على المعالج بسرعات فائقة وبدون استهلاك للإنترنت.</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-slate-100 space-y-2">
            <div className="w-7 h-7 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 font-bold mb-1">C</div>
            <h5 className="font-semibold text-slate-900">3. محاكاة النقرات (Auto Clicking)</h5>
            <p>عبر تفعيل خدمة إمكانية الوصول، نستعين بالدالة <strong className="text-emerald-600">dispatchGesture()</strong> لنقوم بمحاكاة نقرة مبرمجة سريعة (50 مللي ثانية) على الإحداثيات المحددة بدقة بيكسل واحدة.</p>
          </div>
        </div>
      </div>

      {/* Constraints & Troubleshooting */}
      <div className="border border-amber-200 bg-amber-50/50 p-5 rounded-xl space-y-3">
        <h4 className="font-bold text-amber-800 flex items-center gap-2 text-sm">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
          تنبيهات أمنية ونصائح استكشاف الأخطاء
        </h4>
        <ul className="list-disc pr-5 text-xs text-amber-900/80 space-y-2 leading-relaxed">
          <li>
            <strong>تطبيقات البنوك والحماية:</strong> بعض التطبيقات الحساسة (مثل الخدمات المصرفية، أو شاشات تسجيل الدخول) تقوم بتفعيل علم <strong className="text-slate-800">FLAG_SECURE</strong> الذي يمنع نظام التشغيل من تصوير الشاشة. في هذه الحالات، ستظهر المنطقة باللون الأسود ولن يتمكن محرك الـ OCR من قراءة الأرقام لدواعي الخصوصية.
          </li>
          <li>
            <strong>معايرة الإحداثيات:</strong> إحداثيات الشاشة تعتمد على دقة هاتفك (X, Y). يفضل التعرف على دقة شاشتك أولاً (مثال: الشاشات الأكثر شيوعاً هي 1080x2400) لتحديد موضع الضغط بدقة.
          </li>
          <li>
            <strong>ميزة إمكانية الوصول المقيدة في أندرويد 13+:</strong> قد يعرض نظام أندرويد رسالة تحذير "إعداد مقيد" (Restricted Setting) عند محاولة تشغيل خدمة إمكانية الوصول للتطبيقات المثبتة خارج المتجر. لحلها: اذهب لإعدادات الهاتف ➜ التطبيقات ➜ حدد تطبيقك ➜ اضغط على النقاط الثلاث بالأعلى ➜ اختر <strong>السماح بالإعدادات المقيدة (Allow restricted settings)</strong>، ثم قم بتفعيل الخدمة بشكل طبيعي.
          </li>
        </ul>
      </div>

      {/* Dynamic visual calibration card */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-slate-100 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <MousePointerClick className="text-blue-400 w-5 h-5" />
            <h4 className="font-bold text-sm">كيفية ضبط أبعاد منطقة القراءة بدقة؟</h4>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">CALIBRATION GUIDE</span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          تحتوي النافذة العائمة للتطبيق على إعدادات لتحديد مستطيل القراءة بدقة. يمكنك تحريك النافذة العائمة ووضعها مباشرة فوق الرقم الذي ترغب بمراقبته في أي تطبيق آخر، ثم تفعيل القراءة ليقوم بقراءة هذا المربع الصغير فقط، مما يقلل بشكل كبير استهلاك البطارية ويزيد من دقة OCR بنسبة 100%.
        </p>
        <div className="flex flex-wrap gap-4 items-center justify-center bg-slate-950/40 p-4 rounded-xl border border-slate-850 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500"></span> نقطة الضغط X: تمثل المسافة الأفقي من يسار الشاشة</div>
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> نقطة الضغط Y: تمثل المسافة العمودي من أعلى الشاشة</div>
        </div>
      </div>
    </div>
  );
}
