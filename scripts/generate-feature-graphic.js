const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');

async function generateFeatureGraphic() {
  try {
    // 1024 x 500 캔버스 생성
    const canvas = createCanvas(1024, 500);
    const ctx = canvas.getContext('2d');

    // 그라데이션 배경 (보라-파랑-핑크)
    const gradient = ctx.createLinearGradient(0, 0, 1024, 0);
    gradient.addColorStop(0, '#667eea');    // 보라
    gradient.addColorStop(0.5, '#764ba2');  // 진보라
    gradient.addColorStop(1, '#f093fb');    // 핑크
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1024, 500);

    // 로고 로드 및 배치
    try {
      const logo = await loadImage('public/amiko-logo.png');
      
      // 로고 크기 (300x300으로 크게)
      const logoSize = 300;
      const logoX = 100; // 왼쪽에 배치
      const logoY = (500 - logoSize) / 2; // 세로 중앙
      
      ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);
    } catch (err) {
      console.log('로고 로드 실패, 로고 없이 진행합니다.');
    }

    // 텍스트 추가
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 80px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    
    // "AMIKO" 텍스트
    ctx.fillText('AMIKO', 450, 200);
    
    // 부제목
    ctx.font = '32px sans-serif';
    ctx.fillText('Conecta con la cultura coreana', 450, 280);
    
    // 이모지/아이콘 추가
    ctx.font = '40px sans-serif';
    ctx.fillText('🇰🇷 💬 🎥 🎭', 450, 340);

    // PNG로 저장
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync('public/amiko-feature-graphic.png', buffer);
    
    console.log('✅ Feature Graphic 생성 완료: public/amiko-feature-graphic.png (1024x500)');
  } catch (error) {
    console.error('❌ Feature Graphic 생성 실패:', error.message);
    console.log('📝 canvas 패키지 설치가 필요할 수 있습니다: npm install canvas');
  }
}

generateFeatureGraphic();

