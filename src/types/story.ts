export interface Story {
  id: string
  userId: string
  userName: string
  userAvatar?: string
  imageUrl: string
  text: string
  isPublic: boolean
  createdAt: Date
  expiresAt: Date
  isExpired: boolean
}

export interface StoryForm {
  imageUrl: string
  text: string
  isPublic: boolean
}

export interface StoryState {
  isExpanded: boolean
  visibleCount: number
  maxVisibleCount: number
}
