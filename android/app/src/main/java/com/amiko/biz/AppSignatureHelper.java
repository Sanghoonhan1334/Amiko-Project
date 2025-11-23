package com.amiko.biz;

import android.content.Context;
import android.content.pm.PackageManager;
import android.content.pm.Signature;          // ✅ 추가
import android.util.Base64;
import android.util.Log;

import java.nio.charset.StandardCharsets;     // ✅ 추가
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

public class AppSignatureHelper {

    private static final String TAG = AppSignatureHelper.class.getSimpleName();
    private static final String HASH_TYPE = "SHA-256";
    private static final int NUM_HASHED_BYTES = 9;
    private static final int NUM_BASE64_CHAR = 11;

    public static void printAppHash(Context context) {
        try {
            String packageName = context.getPackageName();
            Signature[] signatures = context.getPackageManager()
                    .getPackageInfo(packageName, PackageManager.GET_SIGNATURES)
                    .signatures;

            if (signatures == null || signatures.length == 0) {
                Log.e(TAG, "No signatures found");
                return;
            }

            for (Signature signature : signatures) {
                String hash = hashAppSignature(packageName, signature.toCharsString());
                Log.d(TAG, "App hash: " + hash);
            }
        } catch (Exception e) {
            Log.e(TAG, "Error while generating hash", e);
        }
    }

    private static String hashAppSignature(String packageName, String signature) {
        try {
            String appInfo = packageName + " " + signature;
            MessageDigest messageDigest = MessageDigest.getInstance(HASH_TYPE);
            messageDigest.update(appInfo.getBytes(StandardCharsets.UTF_8));
            byte[] hashSignature = messageDigest.digest();

            byte[] truncated = new byte[NUM_HASHED_BYTES];
            System.arraycopy(hashSignature, 0, truncated, 0, truncated.length);

            return Base64.encodeToString(truncated, Base64.NO_PADDING | Base64.NO_WRAP)
                    .substring(0, NUM_BASE64_CHAR);
        } catch (Exception e) {
            Log.e(TAG, "Error generating signature hash", e);
            return null;
        }
    }
}