/**
 * FanZone API 테스트 스크립트
 * 개발 서버가 실행 중일 때 API 엔드포인트를 테스트합니다.
 */

const BASE_URL = 'http://localhost:3000'

async function testFanzoneAPI() {
  console.log('🧪 FanZone API 테스트 시작...\n')

  try {
    // 1. 기본 리스트 조회
    console.log('1️⃣ 기본 리스트 조회 테스트')
    const response1 = await fetch(`${BASE_URL}/api/fanzone/list?country=latam&limit=10`)
    const data1 = await response1.json()
    
    if (data1.success && data1.fanrooms) {
      console.log(`✅ 성공: ${data1.fanrooms.length}개의 FanRoom 조회됨`)
      console.log('📋 FanRoom 목록:')
      data1.fanrooms.forEach((fanroom, index) => {
        console.log(`   ${index + 1}. ${fanroom.name} (${fanroom.category}) - ${fanroom.member_count}명`)
      })
    } else {
      console.log('❌ 실패:', data1.error || '알 수 없는 오류')
    }
    console.log('')

    // 2. 트렌딩 필터 테스트
    console.log('2️⃣ 트렌딩 필터 테스트')
    const response2 = await fetch(`${BASE_URL}/api/fanzone/list?sort=trending&limit=5`)
    const data2 = await response2.json()
    
    if (data2.success && data2.fanrooms) {
      const trendingCount = data2.fanrooms.filter(f => f.is_trending).length
      console.log(`✅ 성공: ${trendingCount}개의 트렌딩 FanRoom`)
    } else {
      console.log('❌ 실패:', data2.error || '알 수 없는 오류')
    }
    console.log('')

    // 3. 카테고리 필터 테스트
    console.log('3️⃣ K-Pop 카테고리 필터 테스트')
    const response3 = await fetch(`${BASE_URL}/api/fanzone/list?category=kpop&limit=5`)
    const data3 = await response3.json()
    
    if (data3.success && data3.fanrooms) {
      console.log(`✅ 성공: ${data3.fanrooms.length}개의 K-Pop FanRoom`)
      data3.fanrooms.forEach(f => {
        console.log(`   - ${f.name}`)
      })
    } else {
      console.log('❌ 실패:', data3.error || '알 수 없는 오류')
    }
    console.log('')

    // 4. 검색 테스트
    console.log('4️⃣ 검색 테스트 (BTS)')
    const response4 = await fetch(`${BASE_URL}/api/fanzone/list?q=BTS`)
    const data4 = await response4.json()
    
    if (data4.success && data4.fanrooms) {
      console.log(`✅ 성공: "${data4.fanrooms.length}개의 결과`)
      data4.fanrooms.forEach(f => {
        console.log(`   - ${f.name}`)
      })
    } else {
      console.log('❌ 실패:', data4.error || '알 수 없는 오류')
    }
    console.log('')

    // 5. 각국별 테스트
    console.log('5️⃣ 국가별 필터 테스트')
    const countries = ['mx', 'cl', 'latam']
    for (const country of countries) {
      const response = await fetch(`${BASE_URL}/api/fanzone/list?country=${country}&limit=3`)
      const data = await response.json()
      
      if (data.success && data.fanrooms) {
        console.log(`   ${country}: ${data.fanrooms.length}개`)
      }
    }
    console.log('')

    console.log('🎉 모든 테스트 완료!')
    
  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error.message)
    console.log('\n💡 개발 서버가 실행 중인지 확인하세요: npm run dev')
  }
}

// 실행
testFanzoneAPI()

