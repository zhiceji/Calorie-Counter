package com.calorie.counter;

import android.os.Bundle;
import android.util.Base64;
import android.content.Intent;
import android.net.Uri;
import androidx.core.content.FileProvider;
import java.io.File;
import java.io.FileOutputStream;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
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
