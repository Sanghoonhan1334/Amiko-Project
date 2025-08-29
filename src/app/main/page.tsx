'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, Sparkles, Clock, Users, Home } from 'lucide-react'
import MeetTab from '@/components/main/app/meet/MeetTab'
import CommunityTab from '@/components/main/app/community/CommunityTab'
import MyTab from '@/components/main/app/me/MyTab'

export default function AppPage() {
  return (
    <div className="min-h-screen body-gradient">

      
      {/* 상단 고정 헤더 */}
      <div className="relative z-10 bg-white border-b border-gray-200 mt-4">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-brand-100 to-mint-100 rounded-2xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-brand-600" />
              </div>
              <div>
                <Badge className="bg-gradient-to-r from-brand-100 to-mint-100 text-brand-700 border-brand-200 mb-1">
                  이번 주말 ZEP 라운지 🫧
                </Badge>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>토 20:00 (KST)</span>
                  <Users className="w-4 h-4 ml-2" />
                  <span>최대 30명</span>
                </div>
              </div>
            </div>
            
            <Button 
              variant="outline" 
              className="border-brand-300 text-brand-700 hover:bg-brand-50 hover:border-brand-400 transition-all duration-300 shadow-none"
              onClick={() => window.location.href = '/lounge'}
            >
              <Calendar className="w-4 h-4 mr-2" />
              캘린더 보기
            </Button>
          </div>
        </div>
      </div>

      {/* 메인 탭 섹션 */}
      <div className="max-w-5xl mx-auto px-4 py-6 relative z-0">
        <Tabs defaultValue="meet" className="w-full">
          {/* 탭 헤더 */}
          <div className="mb-8">
            <TabsList className="grid w-full grid-cols-3 bg-white border border-gray-200 rounded-3xl p-0">
              <TabsTrigger 
                value="meet" 
                className="data-[state=active]:bg-brand-100 data-[state=active]:text-brand-700 data-[state=active]:shadow-lg data-[state=active]:shadow-black/20 hover:shadow-md hover:shadow-black/10 rounded-l-3xl rounded-r-2xl transition-all duration-300 m-0"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">🎥</span>
                  <span className="font-medium">만남</span>
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="community" 
                className="data-[state=active]:bg-mint-100 data-[state=active]:text-mint-700 data-[state=active]:shadow-lg data-[state=active]:shadow-black/20 hover:shadow-md hover:shadow-black/10 rounded-2xl transition-all duration-300 m-0"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">💬</span>
                  <span className="font-medium">커뮤니티</span>
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="me" 
                className="data-[state=active]:bg-sky-100 data-[state=active]:text-sky-700 data-[state=active]:shadow-lg data-[state=active]:shadow-black/20 hover:shadow-md hover:shadow-black/10 rounded-r-3xl rounded-l-2xl transition-all duration-300 m-0"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">👤</span>
                  <span className="font-medium">마이</span>
                </div>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* 탭 콘텐츠 */}
          <div className="space-y-8">
            <TabsContent value="meet" className="mt-0">
              <div className="card p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-brand-100 rounded-3xl flex items-center justify-center">
                    <span className="text-2xl">🎥</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">만남 (영상)</h2>
                    <p className="text-gray-600">한국인 친구와 화상 상담으로 한국 문화를 배워보세요</p>
                  </div>
                </div>
                <MeetTab />
              </div>
            </TabsContent>

            <TabsContent value="community" className="mt-0">
              <div className="card p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-mint-100 rounded-3xl flex items-center justify-center">
                    <span className="text-2xl">💬</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">커뮤니티 (Q&A)</h2>
                    <p className="text-gray-600">질문하고 답변하며 포인트를 모아 특별한 혜택을 받아보세요</p>
                  </div>
                </div>
                <CommunityTab />
              </div>
            </TabsContent>

            <TabsContent value="me" className="mt-0">
              <div className="card p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-sky-100 rounded-3xl flex items-center justify-center">
                    <span className="text-2xl">👤</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">마이</h2>
                    <p className="text-gray-600">프로필 관리, 포인트, 쿠폰 등 개인 정보를 확인하세요</p>
                  </div>
                </div>
                <MyTab />
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  )
}
