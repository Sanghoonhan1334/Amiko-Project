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

        // ✅ WhatsApp 인증용 App Hash 출력
        AppSignatureHelper.printAppHash(this);

        // ✅ 시스템 바 설정
        Window window = getWindow();
        View decorView = window.getDecorView();

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
            window.setStatusBarColor(Color.TRANSPARENT);
        }

        // ✅ Status bar padding만 적용 (bottom은 0으로 - 키보드 회색 영역 방지)
        ViewCompat.setOnApplyWindowInsetsListener(decorView, (v, windowInsets) -> {
            v.setPadding(
                    0,
                    windowInsets.getSystemWindowInsetTop(),  // status bar 높이만 적용
                    0,
                    0  // bottom 0 = 키보드 회색 영역 방지
            );
            return windowInsets;
        });
    }
}