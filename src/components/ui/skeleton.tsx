import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-gray-200", className)}
      {...props}
    />
  )
}

// 스토리 카드 스켈레톤
function StorySkeleton() {
  return (
    <div className="min-w-[200px] w-[200px] h-[280px] bg-gray-100 rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
      {/* 프로필 이미지 */}
      <div className="w-full h-16 bg-gray-200 flex items-center justify-center p-3">
        <Skeleton className="w-10 h-10 rounded-full bg-gray-300" />
      </div>
      
      {/* 스토리 이미지 */}
      <Skeleton className="w-full h-32 bg-gray-300" />
      
      {/* 텍스트 영역 */}
      <div className="p-3 space-y-2">
        <Skeleton className="h-3 w-3/4 bg-gray-300" />
        <Skeleton className="h-3 w-1/2 bg-gray-300" />
      </div>
      
      {/* 하단 버튼들 */}
      <div className="p-3 flex justify-between items-center">
        <Skeleton className="h-6 w-6 rounded-full bg-gray-300" />
        <Skeleton className="h-6 w-6 rounded-full bg-gray-300" />
      </div>
    </div>
  )
}

// 게시글 카드 스켈레톤
function PostSkeleton() {
  return (
    <div className="bg-gray-100 rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
      {/* 헤더 */}
      <div className="flex items-center space-x-3">
        <Skeleton className="w-10 h-10 rounded-full bg-gray-300" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-24 bg-gray-300" />
          <Skeleton className="h-3 w-16 bg-gray-300" />
        </div>
      </div>
      
      {/* 제목 */}
      <Skeleton className="h-6 w-3/4 bg-gray-300" />
      
      {/* 내용 */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-full bg-gray-300" />
        <Skeleton className="h-4 w-5/6 bg-gray-300" />
        <Skeleton className="h-4 w-4/6 bg-gray-300" />
      </div>
      
      {/* 하단 메타 정보 */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex space-x-4">
          <Skeleton className="h-4 w-12 bg-gray-300" />
          <Skeleton className="h-4 w-12 bg-gray-300" />
          <Skeleton className="h-4 w-12 bg-gray-300" />
        </div>
        <Skeleton className="h-4 w-16 bg-gray-300" />
      </div>
    </div>
  )
}

// 프로필 스켈레톤
function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      {/* 프로필 사진 */}
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <Skeleton className="w-32 h-32 rounded-full bg-gray-300" />
        </div>
        <Skeleton className="h-4 w-24 bg-gray-300" />
      </div>
      
      {/* 프로필 정보 */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32 bg-gray-300" />
          <Skeleton className="h-10 w-full bg-gray-300" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-24 bg-gray-300" />
          <Skeleton className="h-10 w-full bg-gray-300" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-20 bg-gray-300" />
          <Skeleton className="h-20 w-full bg-gray-300" />
        </div>
      </div>
    </div>
  )
}

// 카드 그리드 스켈레톤
function CardGridSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <PostSkeleton key={i} />
      ))}
    </div>
  )
}

// 스토리 캐러셀 스켈레톤
function StoryCarouselSkeleton() {
  return (
    <div className="flex space-x-4 overflow-hidden">
      {Array.from({ length: 4 }).map((_, i) => (
        <StorySkeleton key={i} />
      ))}
    </div>
  )
}

export { 
  Skeleton, 
  StorySkeleton, 
  PostSkeleton, 
  ProfileSkeleton, 
  CardGridSkeleton, 
  StoryCarouselSkeleton 
}