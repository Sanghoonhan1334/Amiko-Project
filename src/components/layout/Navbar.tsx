'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const router = useRouter()
  const { user, signOut } = useAuth()

  const handleMentorSignup = () => {
    // 소통멘토 가입 페이지로 이동 (나중에 실제 페이지로 연결)
    alert('소통멘토 가입 페이지로 이동합니다! (페이지 준비 중)')
  }

  const handleLoginSignup = () => {
          router.push('/sign-in')
  }

  const handleLogout = async () => {
    try {
      await signOut()
      router.push('/')
      alert('로그아웃되었습니다.')
    } catch (error) {
      alert('로그아웃 중 오류가 발생했습니다.')
    }
  }

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const handleMobileMenuClose = () => {
    setIsMobileMenuOpen(false)
  }

  const scrollToVideo = () => {
    const videoSection = document.querySelector('#video')
    if (videoSection) {
      videoSection.scrollIntoView({ behavior: 'smooth' })
    }
    setIsMobileMenuOpen(false)
  }

  const scrollToFeatures = () => {
    const featuresSection = document.querySelector('#features')
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: 'smooth' })
    }
    setIsMobileMenuOpen(false)
  }

  return (
    <>
      <nav className="navbar">
        <div className="navbar-container">
          {/* 모바일 햄버거 메뉴 */}
          <div className="mobile-menu-toggle" onClick={handleMobileMenuToggle}>
            <div className="hamburger">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>

          {/* 데스크톱 메뉴 */}
          <div className="navbar-menu desktop-menu">
            <div className="auth-links">
              {user ? (
                <div className="user-menu">
                  <span className="user-email">{user?.email}</span>
                  <button onClick={handleLogout} className="logout-btn">
                    로그아웃
                  </button>
                </div>
              ) : (
                <span className="auth-text clickable" onClick={handleLoginSignup}>
                  로그인/회원가입
                </span>
              )}
            </div>
            <button 
              onClick={handleMentorSignup}
              className="mentor-signup-btn"
            >
              소통멘토가입
            </button>
          </div>
        </div>
      </nav>

      {/* 모바일 사이드바 */}
      <div className={`mobile-sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <button className="close-btn" onClick={handleMobileMenuClose}>
            ✕
          </button>
        </div>
        <div className="sidebar-content">
          {user ? (
            <div className="sidebar-item">
              <h3>안녕하세요!</h3>
              <p>{user?.email}</p>
              <button onClick={handleLogout} className="sidebar-logout-btn">
                로그아웃
              </button>
            </div>
          ) : (
            <div className="sidebar-item clickable" onClick={handleLoginSignup}>
              <h3>로그인 해주세요</h3>
              <p>로그인 / 회원가입 &gt;</p>
            </div>
          )}
          <div className="sidebar-item">
            <h3>소통멘토가입</h3>
            <p>멘토로 참여하고 문화를 나누어보세요</p>
          </div>
          <div className="sidebar-item clickable" onClick={scrollToVideo}>
            <h3>소개 영상</h3>
            <p>Amiko 소개 영상을 확인해보세요</p>
          </div>
          <div className="sidebar-item clickable" onClick={scrollToFeatures}>
            <h3>서비스 특징</h3>
            <p>Amiko만의 특별한 장점들을 확인해보세요</p>
          </div>
          <div className="sidebar-item">
            <Link href="/booking/create" className="block">
              <h3>상담 예약</h3>
              <p>지금 바로 상담을 예약해보세요</p>
            </Link>
          </div>
        </div>
      </div>

      {/* 모바일 오버레이 */}
      {isMobileMenuOpen && (
        <div className="mobile-overlay" onClick={handleMobileMenuClose}></div>
      )}
    </>
  )
}
