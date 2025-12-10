# GA4 Event Tracking Implementation Summary

## Overview
This document summarizes the GA4 event tracking implementation that standardizes all analytics events across the Amiko platform.

## Files Modified

### Core Analytics Files
1. **`src/lib/analytics.ts`**
   - Added centralized `logEvent()` helper function
   - Added `trackSessionStart()` for session tracking
   - Added `trackRevisit()` for returning user detection
   - Added standardized event helpers:
     - `trackCTAClick()`
     - `trackStartSignup()`, `trackSignupInput()`, `trackSignupSubmit()`, `trackSignupSuccess()`
     - `trackLoginAttempt()`, `trackLoginSuccess()`
     - `trackPostStart()`, `trackPostSubmit()`, `trackPostSuccess()`
     - `trackCommentStart()`, `trackCommentSubmit()`, `trackCommentSuccess()`
   - Updated `trackPageView()` to also emit `page_view` event

### Component Updates
2. **`src/components/analytics/Analytics.tsx`**
   - Added `trackSessionStart()` call on component mount

3. **`src/context/AuthContext.tsx`**
   - Added `trackRevisit()` calls when:
     - User logs in successfully
     - Session is restored from localStorage
     - Auth state changes detect existing session

4. **`src/app/sign-up/page.tsx`**
   - Added `trackStartSignup()` on page load
   - Added `trackSignupInput()` for form field interactions
   - Added `trackSignupSubmit()` before API call
   - Added `trackSignupSuccess()` on successful registration
   - Added CTA click tracking for sign-in link

5. **`src/app/sign-in/page.tsx`**
   - Added `trackLoginAttempt()` before login API call
   - Added `trackLoginSuccess()` on successful login
   - Added CTA click tracking for sign-up link

6. **`src/components/main/app/community/CommunityTab.tsx`**
   - Added `trackPostStart()` when write modal opens
   - Added `trackPostSubmit()` before post creation
   - Added `trackPostSuccess()` on successful post creation

7. **`src/components/main/app/community/CommentSection.tsx`**
   - Added `trackCommentStart()` when comment input is focused
   - Added `trackCommentSubmit()` before comment API call
   - Added `trackCommentSuccess()` on successful comment creation (for both comments and replies)

8. **`src/components/main/shared/Hero.tsx`**
   - Added `trackCTAClick()` for main CTA button
   - Added `trackCTAClick()` for video CTA button

9. **`src/components/layout/Navbar.tsx`**
   - Added `trackCTAClick()` for login/signup button
   - Added `trackCTAClick()` for mentor signup button

## Standardized Events Implemented

### Core Events
- ✅ `session_start` - Emitted once per session via Analytics component
- ✅ `page_view` - Emitted on every page navigation via Analytics component
- ✅ `revisit` - Emitted when returning user logs in or session is restored

### CTA Events
- ✅ `cta_click` - Emitted on all CTA button clicks with `cta_type` parameter

### Signup Flow
- ✅ `start_signup` - When signup page loads
- ✅ `signup_input` - When user types in signup form fields
- ✅ `signup_submit` - When user submits signup form
- ✅ `signup_success` - When signup completes successfully

### Login Flow
- ✅ `login_attempt` - When user attempts to log in
- ✅ `login_success` - When login succeeds

### Post Flow
- ✅ `post_start` - When post creation modal opens
- ✅ `post_submit` - When user submits post
- ✅ `post_success` - When post is created successfully

### Comment Flow
- ✅ `comment_start` - When user focuses on comment input
- ✅ `comment_submit` - When user submits comment
- ✅ `comment_success` - When comment is created successfully

## Event Parameters

All events include default parameters:
- `device` - 'mobile' | 'tablet' | 'desktop'
- `language` - User's language preference ('ko' | 'es')

Additional parameters per event:
- `cta_click`: `cta_type`, `page_location`
- `start_signup`: `page_location`
- `signup_input`: `field_name`
- `signup_success`: `user_id`
- `login_success`: `user_id`, `login_method`
- `post_start`: `page_location`
- `post_success`: `post_id`
- `comment_start`: `post_id`
- `comment_submit`: `post_id`
- `comment_success`: `comment_id`, `post_id`
- `revisit`: `user_id`, `timestamp`

## Testing Guide

### Manual Testing in GA4 DebugView

1. **Open GA4 DebugView**
   - Go to Google Analytics 4
   - Navigate to Admin > DebugView
   - Ensure debug mode is enabled (add `?debug_mode=true` to URL or use GA Debugger extension)

2. **Test Session Start**
   - Open the app in a new browser/incognito window
   - Expected: `session_start` event should appear

3. **Test Page View**
   - Navigate to any page
   - Expected: `page_view` event with `page_path` parameter

4. **Test Signup Flow**
   - Navigate to `/sign-up`
   - Expected: `start_signup` event
   - Type in email field
   - Expected: `signup_input` with `field_name: 'email'`
   - Type in password field
   - Expected: `signup_input` with `field_name: 'password'`
   - Submit form
   - Expected: `signup_submit` then `signup_success` with `user_id`

5. **Test Login Flow**
   - Navigate to `/sign-in`
   - Enter credentials and submit
   - Expected: `login_attempt` then `login_success` with `user_id`
   - If returning user: `revisit` event should also appear

6. **Test Post Flow**
   - Log in and navigate to community
   - Click "Write Post" button
   - Expected: `post_start` event
   - Fill form and submit
   - Expected: `post_submit` then `post_success` with `post_id`

7. **Test Comment Flow**
   - Open a post
   - Click/focus on comment input
   - Expected: `comment_start` with `post_id`
   - Type and submit comment
   - Expected: `comment_submit` then `comment_success` with `comment_id` and `post_id`

8. **Test CTA Clicks**
   - Click any CTA button (Hero, Navbar, etc.)
   - Expected: `cta_click` with `cta_type` parameter

9. **Test Revisit**
   - Log out
   - Log back in with same account
   - Expected: `revisit` event with `user_id`

## Environment Variables

Ensure these are set in your `.env.local`:
```
NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-5RM3B0CKWJ
```

## Notes

- All events go through the centralized `logEvent()` helper
- Events are automatically retried if gtag is not ready
- Device type and language are automatically added to all events
- Session storage is used to prevent duplicate `session_start` and `revisit` events
- All events include console logging for debugging (can be removed in production)

## Next Steps

1. Verify events in GA4 DebugView
2. Set up funnels in GA4 using these standardized event names
3. Create custom reports and dashboards
4. Monitor event volumes and adjust as needed
5. Consider removing console.log statements in production build
