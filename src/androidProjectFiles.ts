import { AndroidConfig, AutomationSettings } from './types';

export function generateAndroidProject(config: AndroidConfig, settings: AutomationSettings) {
  const pkgDir = config.packageName.replace(/\./g, '/');
  
  const files: { [key: string]: string } = {};

  // 1. build.gradle (app module)
  files['app/build.gradle'] = `plugins {
    id 'com.android.application'
    id 'org.jetbrains.kotlin.android'
  }

android {
    namespace '${config.packageName}'
    compileSdk 34

    defaultConfig {
        applicationId "${config.packageName}"
        minSdk 26
        targetSdk 34
        versionCode 1
        versionName "1.0"
        testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_17
        targetCompatibility JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = '17'
    }
    buildFeatures {
        viewBinding true
    }
}

dependencies {
    implementation 'androidx.core:core-ktx:1.12.0'
    implementation 'androidx.appcompat:appcompat:1.6.1'
    implementation 'com.google.android.material:material:1.11.0'
    implementation 'androidx.constraintlayout:constraintlayout:2.1.4'
    implementation 'androidx.lifecycle:lifecycle-service:2.7.0'

    // ML Kit Text Recognition for OCR
    implementation 'com.google.android.gms:play-services-mlkit-text-recognition:19.0.0'
}`;

  // 2. build.gradle (project)
  files['build.gradle'] = `// Top-level build file where you can add configuration options common to all sub-projects/modules.
plugins {
    id 'com.android.application' version '8.2.1' apply false
    id 'org.jetbrains.kotlin.android' version '1.9.22' apply false
}`;

  // 3. settings.gradle
  files['settings.gradle'] = `pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}
rootProject.name = "${config.appName}"
include ':app'`;

  // 4. AndroidManifest.xml
  files['app/src/main/AndroidManifest.xml'] = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <!-- Permissions required for screen capturing, overlay and automatic clicking -->
    <uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_MEDIA_PROJECTION" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_SPECIAL_USE" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="${config.appName}"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.AppCompat.Light.NoActionBar">
        
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:theme="@style/Theme.AppCompat.Light.NoActionBar">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <!-- Floating Overlay Background Service -->
        <service
            android:name=".FloatingOverlayService"
            android:enabled="true"
            android:exported="false"
            android:foregroundServiceType="mediaProjection" />

        <!-- Auto Clicker Accessibility Service -->
        <service
            android:name=".MyAccessibilityService"
            android:permission="android.permission.BIND_ACCESSIBILITY_SERVICE"
            android:exported="true">
            <intent-filter>
                <action android:name="android.accessibilityservice.AccessibilityService" />
            </intent-filter>
            <meta-data
                android:name="android.accessibilityservice"
                android:resource="@xml/accessibility_service_config" />
        </service>

    </application>
</manifest>`;

  // 5. res/xml/accessibility_service_config.xml
  files['app/src/main/res/xml/accessibility_service_config.xml'] = `<?xml version="1.0" encoding="utf-8"?>
<accessibility-service xmlns:android="http://schemas.android.com/apk/res/android"
    android:accessibilityEventTypes="typeAllMask"
    android:accessibilityFeedbackType="feedbackGeneric"
    android:accessibilityFlags="flagDefault|flagRetrieveInteractiveWindows|flagReportViewIds"
    android:canPerformGestures="true"
    android:canRetrieveWindowContent="true"
    android:notificationTimeout="100" />`;

  // 6. MainActivity.kt
  files[`app/src/main/java/${pkgDir}/MainActivity.kt`] = `package ${config.packageName}

import android.accessibilityservice.AccessibilityService
import android.content.Context
import android.content.Intent
import android.media.projection.MediaProjectionManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {

    private val OVERLAY_PERMISSION_REQ_CODE = 1234
    private val MEDIA_PROJECTION_REQ_CODE = 5678

    private lateinit var btnToggleOverlay: Button
    private lateinit var btnCheckAccessibility: Button
    private lateinit var tvStatus: TextView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(createMainLayout())

        btnToggleOverlay = findViewById(R.id.btnToggleOverlay)
        btnCheckAccessibility = findViewById(R.id.btnCheckAccessibility)
        tvStatus = findViewById(R.id.tvStatus)

        btnToggleOverlay.setOnClickListener {
            if (checkOverlayPermission()) {
                startMediaProjectionRequest()
            } else {
                requestOverlayPermission()
            }
        }

        btnCheckAccessibility.setOnClickListener {
            requestAccessibilityPermission()
        }
    }

    override fun onResume() {
        super.onResume()
        updateStatus()
    }

    private fun updateStatus() {
        val overlayOk = checkOverlayPermission()
        val accessibilityOk = isAccessibilityServiceEnabled(MyAccessibilityService::class.java)

        var status = "📝 الصلاحيات المطلوبة:\\n\\n"
        status += "• نافذة فوق التطبيقات: \${if (overlayOk) "✅ مفعلة" else "❌ غير مفعلة"}\\n"
        status += "• خدمة إمكانية الوصول: \${if (accessibilityOk) "✅ مفعلة" else "❌ غير مفعلة"}\\n\\n"

        if (overlayOk && accessibilityOk) {
            status += "🎉 جاهز للتشغيل! اضغط على زر تفعيل النافذة للبدء."
            btnToggleOverlay.text = "تفعيل النافذة العائمة"
        } else {
            status += "⚠️ يرجى تفعيل الصلاحيات أعلاه ليعمل التطبيق بشكل صحيح."
        }
        tvStatus.text = status
    }

    private fun checkOverlayPermission(): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            Settings.canDrawOverlays(this)
        } else {
            true
        }
    }

    private fun requestOverlayPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val intent = Intent(
                Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                Uri.parse("package:\$packageName")
            )
            startActivityForResult(intent, OVERLAY_PERMISSION_REQ_CODE)
        }
    }

    private fun requestAccessibilityPermission() {
        val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
        startActivity(intent)
        Toast.makeText(this, "يرجى البحث عن [\${getString(R.string.accessibility_name)}] وتفعيله", Toast.LENGTH_LONG).show()
    }

    private fun isAccessibilityServiceEnabled(service: Class<out AccessibilityService>): Boolean {
        val expectedComponentName = android.content.ComponentName(this, service)
        val enabledServicesSetting = Settings.Secure.getString(
            contentResolver,
            Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
        ) ?: return false
        val colonSplitter = android.text.TextUtils.SimpleStringSplitter(':')
        colonSplitter.setString(enabledServicesSetting)
        while (colonSplitter.hasNext()) {
            val componentNameString = colonSplitter.next()
            val enabledService = android.content.ComponentName.unflattenFromString(componentNameString)
            if (enabledService != null && enabledService == expectedComponentName) {
                return true
            }
        }
        return false
    }

    private fun startMediaProjectionRequest() {
        val mediaProjectionManager = getSystemService(Context.MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
        startActivityForResult(mediaProjectionManager.createScreenCaptureIntent(), MEDIA_PROJECTION_REQ_CODE)
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == OVERLAY_PERMISSION_REQ_CODE) {
            updateStatus()
        } else if (requestCode == MEDIA_PROJECTION_REQ_CODE) {
            if (resultCode == RESULT_OK && data != null) {
                // Start background floating service with projection token
                val serviceIntent = Intent(this, FloatingOverlayService::class.java).apply {
                    putExtra("resultCode", resultCode)
                    putExtra("data", data)
                }
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    startForegroundService(serviceIntent)
                } else {
                    startService(serviceIntent)
                }
                finish() // Hide setup screen to show overlay immediately
            } else {
                Toast.makeText(this, "فشل الحصول على إذن تصوير الشاشة", Toast.LENGTH_SHORT).show()
            }
        }
    }

    // Helper to generate XML layout dynamically without needing physical res layout file
    private fun createMainLayout(): android.view.View {
        val container = android.widget.LinearLayout(this).apply {
            orientation = android.widget.LinearLayout.VERTICAL
            setPadding(48, 48, 48, 48)
            gravity = android.view.Gravity.CENTER_HORIZONTAL
            backgroundColor = 0xFFF8F9FA.toInt()
        }

        val title = TextView(this).apply {
            text = "${config.appName}"
            textSize = 24f
            typeface = android.graphics.Typeface.DEFAULT_BOLD
            setTextColor(0xFF212529.toInt())
            gravity = android.view.Gravity.CENTER
            setPadding(0, 0, 0, 32)
        }

        tvStatus = TextView(this).apply {
            id = R.id.tvStatus
            text = ""
            textSize = 15f
            setTextColor(0xFF495057.toInt())
            setPadding(24, 24, 24, 24)
            val bg = android.graphics.drawable.GradientDrawable().apply {
                setColor(0xFFFFFFFF.toInt())
                setStroke(2, 0xFFE9ECEF.toInt())
                cornerRadius = 16f
            }
            background = bg
        }

        val spacer = android.view.View(this).apply {
            layoutParams = android.widget.LinearLayout.LayoutParams(1, 48)
        }

        btnToggleOverlay = Button(this).apply {
            id = R.id.btnToggleOverlay
            text = "تفعيل النافذة العائمة"
            setTextColor(0xFFFFFFFF.toInt())
            textSize = 16f
            val bg = android.graphics.drawable.GradientDrawable().apply {
                setColor(0xFF3B82F6.toInt())
                cornerRadius = 12f
            }
            background = bg
            setPadding(32, 24, 32, 24)
        }

        val spacer2 = android.view.View(this).apply {
            layoutParams = android.widget.LinearLayout.LayoutParams(1, 24)
        }

        btnCheckAccessibility = Button(this).apply {
            id = R.id.btnCheckAccessibility
            text = "تفعيل خدمة إمكانية الوصول (Accessibility)"
            setTextColor(0xFF1E293B.toInt())
            textSize = 14f
            val bg = android.graphics.drawable.GradientDrawable().apply {
                setColor(0xFFE2E8F0.toInt())
                cornerRadius = 12f
            }
            background = bg
            setPadding(24, 18, 24, 18)
        }

        val desc = TextView(this).apply {
            text = "يقوم هذا التطبيق بالتقاط جزء من الشاشة وإجراء التعرف على الأرقام (OCR). عند تطابق الشرط، يتم الضغط على الشاشة تلقائياً عبر خدمة إمكانية الوصول دون روت."
            textSize = 12f
            setTextColor(0xFF94A3B8.toInt())
            gravity = android.view.Gravity.CENTER
            setPadding(0, 48, 0, 0)
        }

        container.addView(title)
        container.addView(tvStatus)
        container.addView(spacer)
        container.addView(btnToggleOverlay)
        container.addView(spacer2)
        container.addView(btnCheckAccessibility)
        container.addView(desc)

        // Give them IDs to locate via findViewById
        btnToggleOverlay.id = R.id.btnToggleOverlay
        btnCheckAccessibility.id = R.id.btnCheckAccessibility
        tvStatus.id = R.id.tvStatus

        return container
    }
}

// Global IDs helper
object R {
    object id {
        const val btnToggleOverlay = 10001
        const val btnCheckAccessibility = 10002
        const val tvStatus = 10003
    }
    object string {
        const val accessibility_name = 20001
    }
}
`;

  // 7. MyAccessibilityService.kt
  files[`app/src/main/java/${pkgDir}/MyAccessibilityService.kt`] = `package ${config.packageName}

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.GestureDescription
import android.graphics.Path
import android.view.accessibility.AccessibilityEvent
import android.widget.Toast

class MyAccessibilityService : AccessibilityService() {

    override fun onCreate() {
        super.onCreate()
        instance = this
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        Toast.makeText(this, "خدمة إمكانية الوصول متصلة بنجاح ✅", Toast.LENGTH_SHORT).show()
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        // No operation needed for screen capture auto-clicking
    }

    override fun onInterrupt() {
        instance = null
    }

    override fun onDestroy() {
        super.onDestroy()
        instance = null
    }

    /**
     * Performs a programmatic auto click gesture at coordinates (x, y)
     */
    fun performAutoClick(x: Float, y: Float) {
        val path = Path()
        path.moveTo(x, y)
        val gesture = GestureDescription.Builder()
            .addStroke(
                GestureDescription.StrokeDescription(
                    path,
                    0, // Start instantly
                    50 // Click duration 50ms
                )
            )
            .build()
        dispatchGesture(gesture, null, null)
    }

    companion object {
        var instance: MyAccessibilityService? = null
    }
}`;

  // 8. OcrAnalyzer.kt
  files[`app/src/main/java/${pkgDir}/OcrAnalyzer.kt`] = `package ${config.packageName}

import android.graphics.Bitmap
import com.google.android.gms.tasks.Task
import com.google.android.gms.tasks.Tasks
import com.google.android.gms.tasks.Tasks.await
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.latin.TextRecognizerOptions

object OcrAnalyzer {
    private val recognizer = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)

    /**
     * Runs ML Kit OCR on a given bitmap and extracts the first number it finds.
     * Returns null if no number is parsed.
     */
    fun extractNumberFromBitmap(bitmap: Bitmap): Double? {
        val image = InputImage.fromBitmap(bitmap, 0)
        return try {
            val task = recognizer.process(image)
            // Block and wait for local ML Kit task since this runs on a background handler thread
            val textResult = Tasks.await(task)
            
            val detectedText = textResult.text
            // Regular expression to find integers or decimal numbers
            val pattern = "\\\\d+(?:\\\\.\\\\d+)?".toRegex()
            val match = pattern.find(detectedText)
            match?.value?.toDoubleOrNull()
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }
}`;

  // 9. FloatingOverlayService.kt (The main logic)
  files[`app/src/main/java/${pkgDir}/FloatingOverlayService.kt`] = `package ${config.packageName}

import android.app.*
import android.content.Context
import android.content.Intent
import android.graphics.*
import android.hardware.display.DisplayManager
import android.hardware.display.VirtualDisplay
import android.media.ImageReader
import android.media.projection.MediaProjection
import android.media.projection.MediaProjectionManager
import android.os.*
import android.util.DisplayMetrics
import android.view.*
import android.widget.*
import androidx.core.app.NotificationCompat
import java.io.ByteArrayOutputStream
import java.nio.ByteBuffer

class FloatingOverlayService : Service() {

    private val NOTIFICATION_ID = 999
    private val CHANNEL_ID = "ocr_auto_clicker_channel"

    private lateinit var windowManager: WindowManager
    private lateinit var overlayView: View
    private lateinit var overlayParams: WindowManager.LayoutParams

    private var mediaProjection: MediaProjection? = null
    private var virtualDisplay: VirtualDisplay? = null
    private var imageReader: ImageReader? = null
    
    // Automation configurations loaded from state (defaults matched with UI)
    private var operator: String = "${settings.operator}" // ">", "<", "==", ">=", "<="
    private var thresholdValue: Double = ${settings.thresholdValue}.0
    private var clickX: Float = ${settings.clickX}f
    private var clickY: Float = ${settings.clickY}f
    private var cropX: Int = ${settings.cropRegion.x}
    private var cropY: Int = ${settings.cropRegion.y}
    private var cropW: Int = ${settings.cropRegion.width}
    private var cropH: Int = ${settings.cropRegion.height}
    private var scanInterval: Long = ${settings.intervalMs}L

    private var isMonitoring = false
    private val handler = Handler(Looper.getMainLooper())
    private var scanRunnable: Runnable? = null
    private var backgroundHandler: Handler? = null
    private var backgroundThread: HandlerThread? = null

    private lateinit var tvExtractedText: TextView
    private lateinit var btnToggleScan: Button

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        startForeground(NOTIFICATION_ID, createNotification("جاهز للمراقبة..."))

        windowManager = getSystemService(Context.WINDOW_SERVICE) as WindowManager
        createFloatingWindow()

        // Background worker thread for OCR processing to keep main thread fast
        backgroundThread = HandlerThread("OcrProcessorThread")
        backgroundThread?.start()
        backgroundHandler = Handler(backgroundThread!!.looper)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent != null && intent.hasExtra("resultCode")) {
            val resultCode = intent.getIntExtra("resultCode", Activity.RESULT_OK)
            val data = intent.getParcelableExtra<Intent>("data")
            if (data != null) {
                initMediaProjection(resultCode, data)
            }
        }
        return START_NOT_STICKY
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "إشعارات OCR Clicker",
                NotificationManager.IMPORTANCE_LOW
            )
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
    }

    private fun createNotification(text: String): Notification {
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("${config.appName}")
            .setContentText(text)
            .setSmallIcon(android.R.drawable.ic_media_play)
            .build()
    }

    private fun initMediaProjection(resultCode: Int, data: Intent) {
        val mpManager = getSystemService(Context.MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
        mediaProjection = mpManager.getMediaProjection(resultCode, data)
        setupVirtualDisplay()
    }

    private fun setupVirtualDisplay() {
        val metrics = resources.displayMetrics
        val width = metrics.widthPixels
        val height = metrics.heightPixels
        val density = metrics.densityDpi

        // ImageReader to capture pixel data asynchronously
        imageReader = ImageReader.newInstance(width, height, PixelFormat.RGBA_8888, 2)
        virtualDisplay = mediaProjection?.createVirtualDisplay(
            "OcrScreenCapture",
            width, height, density,
            DisplayManager.VIRTUAL_DISPLAY_FLAG_AUTO_MIRROR,
            imageReader?.surface, null, null
        )
    }

    private fun createFloatingWindow() {
        val layoutFlag = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
        } else {
            WindowManager.LayoutParams.TYPE_PHONE
        }

        overlayParams = WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            layoutFlag,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.START
            x = 100
            y = 100
        }

        // Programmatic elegant overlay layout (bubble layout)
        val context = this
        val mainCard = LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(24, 24, 24, 24)
            val gd = android.graphics.drawable.GradientDrawable().apply {
                setColor(0xE61E293B.toInt()) // Slate dark semi-transparent
                cornerRadius = 24f
                setStroke(3, 0xFF3B82F6.toInt()) // Blue border
            }
            background = gd
            elevation = 16f
        }

        // Horizontal title bar with touch drag listener
        val titleBar = RelativeLayout(context).apply {
            val params = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            )
            layoutParams = params
        }

        val tvTitle = TextView(context).apply {
            text = "${config.overlayTitle}"
            setTextColor(0xFF3B82F6.toInt())
            textSize = 14f
            typeface = Typeface.DEFAULT_BOLD
            gravity = Gravity.START
        }
        titleBar.addView(tvTitle)

        tvExtractedText = TextView(context).apply {
            text = "الرقم المقروء: ---"
            setTextColor(Color.WHITE)
            textSize = 13f
            setPadding(0, 16, 0, 16)
        }

        // Mini configuration inputs
        val configLayout = LinearLayout(context).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            setPadding(0, 8, 0, 16)
        }

        val tvCondition = TextView(context).apply {
            text = "الشرط: \${operator} \${thresholdValue.toInt()}"
            setTextColor(0xFF94A3B8.toInt())
            textSize = 11f
        }
        configLayout.addView(tvCondition)

        btnToggleScan = Button(context).apply {
            text = "بدء المراقبة"
            setTextColor(Color.WHITE)
            textSize = 12f
            val bg = android.graphics.drawable.GradientDrawable().apply {
                setColor(0xFF10B981.toInt()) // Green
                cornerRadius = 12f
            }
            background = bg
            setPadding(16, 12, 16, 12)
        }

        btnToggleScan.setOnClickListener {
            if (isMonitoring) {
                stopOcrMonitoring()
            } else {
                startOcrMonitoring()
            }
        }

        val btnClose = Button(context).apply {
            text = "إغلاق"
            setTextColor(Color.WHITE)
            textSize = 10f
            val bg = android.graphics.drawable.GradientDrawable().apply {
                setColor(0x33FFFFFF.toInt())
                cornerRadius = 12f
            }
            background = bg
            setPadding(12, 8, 12, 8)
        }
        btnClose.setOnClickListener {
            stopSelf()
        }

        mainCard.addView(titleBar)
        mainCard.addView(tvExtractedText)
        mainCard.addView(configLayout)
        mainCard.addView(btnToggleScan)
        
        val space = android.view.View(context).apply {
            layoutParams = LinearLayout.LayoutParams(1, 12)
        }
        mainCard.addView(space)
        mainCard.addView(btnClose)

        overlayView = mainCard

        // Draggable window implementation
        overlayView.setOnTouchListener(object : View.OnTouchListener {
            private var initialX = 0
            private var initialY = 0
            private var initialTouchX = 0f
            private var initialTouchY = 0f

            override fun onTouch(v: View, event: MotionEvent): Boolean {
                when (event.action) {
                    MotionEvent.ACTION_DOWN -> {
                        initialX = overlayParams.x
                        initialY = overlayParams.y
                        initialTouchX = event.rawX
                        initialTouchY = event.rawY
                        return true
                    }
                    MotionEvent.ACTION_MOVE -> {
                        overlayParams.x = initialX + (event.rawX - initialTouchX).toInt()
                        overlayParams.y = initialY + (event.rawY - initialTouchY).toInt()
                        windowManager.updateViewLayout(overlayView, overlayParams)
                        return true
                    }
                }
                return false
            }
        })

        windowManager.addView(overlayView, overlayParams)
    }

    private fun startOcrMonitoring() {
        if (mediaProjection == null) {
            Toast.makeText(this, "يرجى تشغيل التطبيق أولاً للموافقة على تصوير الشاشة", Toast.LENGTH_SHORT).show()
            return
        }
        isMonitoring = true
        btnToggleScan.text = "إيقاف المراقبة"
        val bg = android.graphics.drawable.GradientDrawable().apply {
            setColor(0xFFEF4444.toInt()) // Red
            cornerRadius = 12f
        }
        btnToggleScan.background = bg
        tvExtractedText.text = "جارٍ البدء..."

        val mNotificationManager = getSystemService(NotificationManager::class.java)
        mNotificationManager.notify(NOTIFICATION_ID, createNotification("المراقبة نشطة..."))

        // OCR Scan task runner loop
        scanRunnable = object : Runnable {
            override fun run() {
                if (!isMonitoring) return
                // Process frame on background thread
                backgroundHandler?.post {
                    captureAndProcessOcr()
                }
                handler.postDelayed(this, scanInterval)
            }
        }
        handler.post(scanRunnable!!)
    }

    private fun stopOcrMonitoring() {
        isMonitoring = false
        btnToggleScan.text = "بدء المراقبة"
        val bg = android.graphics.drawable.GradientDrawable().apply {
            setColor(0xFF10B981.toInt()) // Green
            cornerRadius = 12f
        }
        btnToggleScan.background = bg
        tvExtractedText.text = "الرقم المقروء: موقوف"
        
        val mNotificationManager = getSystemService(NotificationManager::class.java)
        mNotificationManager.notify(NOTIFICATION_ID, createNotification("المراقبة متوقفة."))
    }

    private fun captureAndProcessOcr() {
        val image = imageReader?.acquireLatestImage()
        if (image == null) {
            return
        }

        try {
            val planes = image.planes
            val buffer = planes[0].buffer
            val pixelStride = planes[0].pixelStride
            val rowStride = planes[0].rowStride
            val rowPadding = rowStride - pixelStride * image.width

            // Create bitmap from the raw screenshot pixel buffer
            val bitmap = Bitmap.createBitmap(
                image.width + rowPadding / pixelStride,
                image.height,
                Bitmap.Config.ARGB_8888
            )
            bitmap.copyPixelsFromBuffer(buffer)

            // Crop the specific target region
            // Clamp crops to prevent crashing if coordinates are out of bounds
            val x = cropX.coerceIn(0, bitmap.width - 2)
            val y = cropY.coerceIn(0, bitmap.height - 2)
            val w = cropW.coerceIn(2, bitmap.width - x)
            val h = cropH.coerceIn(2, bitmap.height - y)

            val croppedBitmap = Bitmap.createBitmap(bitmap, x, y, w, h)
            bitmap.recycle() // Release huge bitmap memory quickly

            // Perform OCR using ML Kit
            val detectedNumber = OcrAnalyzer.extractNumberFromBitmap(croppedBitmap)
            croppedBitmap.recycle()

            handler.post {
                if (detectedNumber != null) {
                    tvExtractedText.text = "الرقم المقروء: \${detectedNumber}"
                    checkAndTriggerAutomation(detectedNumber)
                } else {
                    tvExtractedText.text = "الرقم المقروء: لم يتم كشفه"
                }
            }

        } catch (e: Exception) {
            e.printStackTrace()
        } finally {
            image.close()
        }
    }

    private fun checkAndTriggerAutomation(number: Double) {
        var isMatched = false
        when (operator) {
            ">" -> if (number > thresholdValue) isMatched = true
            "<" -> if (number < thresholdValue) isMatched = true
            "==" -> if (number == thresholdValue) isMatched = true
            ">=" -> if (number >= thresholdValue) isMatched = true
            "<=" -> if (number <= thresholdValue) isMatched = true
        }

        if (isMatched) {
            val accessibilityService = MyAccessibilityService.instance
            if (accessibilityService != null) {
                // Execute automatic gesture click
                accessibilityService.performAutoClick(clickX, clickY)
                
                // Visual feedback: temporarily flash floating overlay orange
                overlayView.post {
                    val originalBg = overlayView.background
                    val flashBg = android.graphics.drawable.GradientDrawable().apply {
                        setColor(0xFFF59E0B.toInt()) // Warning amber
                        cornerRadius = 24f
                        setStroke(3, Color.YELLOW)
                    }
                    overlayView.background = flashBg
                    overlayView.postDelayed({
                        overlayView.background = originalBg
                    }, 150)
                }
            } else {
                handler.post {
                    Toast.makeText(this, "⚠️ تفعيل خدمة إمكانية الوصول مطلوب لإتمام الضغط!", Toast.LENGTH_SHORT).show()
                }
            }
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        stopOcrMonitoring()
        if (::overlayView.isInitialized) {
            windowManager.removeView(overlayView)
        }
        virtualDisplay?.release()
        imageReader?.close()
        mediaProjection?.stop()
        backgroundThread?.quit()
    }

    override fun onBind(intent: Intent?): IBinder? {
        return null
    }
}`;

  // 10. res/values/strings.xml for display name
  files['app/src/main/res/values/strings.xml'] = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">${config.appName}</string>
    <string name="accessibility_name">${config.serviceName}</string>
</resources>`;

  return files;
}
