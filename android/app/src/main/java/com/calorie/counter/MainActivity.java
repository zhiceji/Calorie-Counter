package com.calorie.counter;

import android.os.Bundle;
import android.util.Base64;
import android.content.Intent;
import android.net.Uri;
import android.graphics.Color;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import androidx.core.content.FileProvider;
import java.io.File;
import java.io.FileOutputStream;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // 1. 关键：先启用全屏布局支持，这是 Android 15+ 的新要求
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        
        // 2. 设置状态栏为透明（ColorOS 16 强制沉浸式，设置白色背景有时会被系统拦截）
        getWindow().setStatusBarColor(Color.TRANSPARENT);

        // 3. 使用 WindowInsetsControllerCompat (官方推荐的兼容库写法，优先级最高)
        WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        // true 表示"亮色状态栏"，即文字和图标变为深色
        controller.setAppearanceLightStatusBars(true);
    }
    
    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            // 每次窗口获得焦点时重新设置状态栏
            WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
            controller.setAppearanceLightStatusBars(true);
        }
    }

    /**
     * 安装 APK (从 Base64 数据)
     */
    public void installApkFromBase64(String base64Data) {
        try {
            byte[] apkBytes = Base64.decode(base64Data, Base64.DEFAULT);
            
            File apkDir = new File(getFilesDir(), "apk_update");
            if (!apkDir.exists()) {
                apkDir.mkdirs();
            }
            
            File apkFile = new File(apkDir, "update.apk");
            FileOutputStream fos = new FileOutputStream(apkFile);
            fos.write(apkBytes);
            fos.close();

            Uri apkUri = FileProvider.getUriForFile(
                this,
                getPackageName() + ".fileprovider",
                apkFile
            );

            Intent intent = new Intent(Intent.ACTION_VIEW);
            intent.setDataAndType(apkUri, "application/vnd.android.package-archive");
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            startActivity(intent);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    /**
     * 安装 APK (从文件路径)
     */
    public void installApkFromFile(String filePath) {
        try {
            File apkFile = new File(filePath);
            Uri apkUri = FileProvider.getUriForFile(
                this,
                getPackageName() + ".fileprovider",
                apkFile
            );

            Intent intent = new Intent(Intent.ACTION_VIEW);
            intent.setDataAndType(apkUri, "application/vnd.android.package-archive");
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            startActivity(intent);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    /**
     * 在浏览器中打开 URL
     */
    public void openInBrowser(String url) {
        try {
            Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
            startActivity(intent);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
