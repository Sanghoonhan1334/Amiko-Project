package com.amiko.biz;

import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import androidx.core.view.ViewCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // 시스템 바 표시하고 앱은 시스템 바 아래에 배치
        Window window = getWindow();
        View decorView = window.getDecorView();
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            // Android 11+ : 시스템 바를 항상 표시하고 컨텐츠는 그 아래에
            window.setDecorFitsSystemWindows(true);
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            // Android 5.0+ : Status Bar & Navigation Bar 처리
            window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS);
            window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
            window.setStatusBarColor(Color.TRANSPARENT);
            window.setNavigationBarColor(Color.TRANSPARENT);
            
            // 시스템 UI를 표시하고 컨텐츠는 시스템 바 아래에
            int flags = View.SYSTEM_UI_FLAG_LAYOUT_STABLE;
            decorView.setSystemUiVisibility(flags);
        }
        
        // fitsSystemWindows 적용
        ViewCompat.setOnApplyWindowInsetsListener(decorView, (v, windowInsets) -> {
            // 시스템 바 영역만큼 패딩 적용
            v.setPadding(
                windowInsets.getSystemWindowInsetLeft(),
                windowInsets.getSystemWindowInsetTop(),
                windowInsets.getSystemWindowInsetRight(),
                windowInsets.getSystemWindowInsetBottom()
            );
            return windowInsets;
        });
    }
}
