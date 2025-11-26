const fs = require('fs');
const path = require('path');

// Android 아이콘 해상도 정의 (적응형 아이콘 foreground 크기)
const iconSizes = {
  'mipmap-mdpi': { foreground: 108, launcher: 48 },
  'mipmap-hdpi': { foreground: 162, launcher: 72 },
  'mipmap-xhdpi': { foreground: 216, launcher: 96 },
  'mipmap-xxhdpi': { foreground: 324, launcher: 144 },
  'mipmap-xxxhdpi': { foreground: 432, launcher: 192 },
};

const sourceIcon = path.join(__dirname, '../public/logos/amiko-logo-512.png');
const androidResPath = path.join(__dirname, '../android/app/src/main/res');

async function generateIcons() {
  try {
    // sharp가 설치되어 있는지 확인
    let sharp;
    try {
      sharp = require('sharp');
    } catch (e) {
      console.error('❌ sharp 패키지가 설치되어 있지 않습니다.');
      console.log('📦 설치 명령어: npm install --save-dev sharp');
      process.exit(1);
    }

    // 소스 아이콘 파일 확인
    if (!fs.existsSync(sourceIcon)) {
      console.error(`❌ 소스 아이콘 파일을 찾을 수 없습니다: ${sourceIcon}`);
      process.exit(1);
    }

    console.log('🎨 Android 아이콘 생성 시작...');
    console.log(`📁 소스 파일: ${sourceIcon}`);

    // 각 해상도별로 아이콘 생성
    for (const [folder, sizes] of Object.entries(iconSizes)) {
      const folderPath = path.join(androidResPath, folder);
      
      // 폴더가 없으면 생성
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }

      // Foreground 아이콘 생성 (적응형 아이콘용)
      const foregroundPath = path.join(folderPath, 'ic_launcher_foreground.png');
      await sharp(sourceIcon)
        .resize(sizes.foreground, sizes.foreground, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 } // 투명 배경
        })
        .toFile(foregroundPath);
      console.log(`✅ ${folder}/ic_launcher_foreground.png 생성 완료 (${sizes.foreground}x${sizes.foreground})`);

      // 일반 Launcher 아이콘 생성
      const launcherPath = path.join(folderPath, 'ic_launcher.png');
      await sharp(sourceIcon)
        .resize(sizes.launcher, sizes.launcher, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 } // 흰색 배경
        })
        .toFile(launcherPath);
      console.log(`✅ ${folder}/ic_launcher.png 생성 완료 (${sizes.launcher}x${sizes.launcher})`);

      // Round 아이콘 생성 (동일한 크기)
      const roundPath = path.join(folderPath, 'ic_launcher_round.png');
      await sharp(sourceIcon)
        .resize(sizes.launcher, sizes.launcher, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .toFile(roundPath);
      console.log(`✅ ${folder}/ic_launcher_round.png 생성 완료 (${sizes.launcher}x${sizes.launcher})`);
    }

    console.log('\n🎉 모든 Android 아이콘 생성 완료!');
    console.log('📱 다음 단계:');
    console.log('   1. Android Studio에서 프로젝트를 다시 빌드하세요');
    console.log('   2. 또는: npx cap sync android');
    console.log('   3. 앱을 다시 설치하여 아이콘 변경을 확인하세요');
    
  } catch (error) {
    console.error('❌ 아이콘 생성 중 오류 발생:', error);
    process.exit(1);
  }
}

generateIcons();

