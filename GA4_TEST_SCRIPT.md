# GA4 Event Tracking - Manual Test Script

This script provides step-by-step instructions to manually verify all GA4 events in GA4 DebugView.

## Prerequisites

1. Install GA Debugger extension or add `?debug_mode=true` to URLs
2. Open Google Analytics 4 DebugView (Admin > DebugView)
3. Clear browser cache and localStorage for clean testing

---

## Test 1: Session Start & Page View

**Steps:**
1. Open app in new incognito/private window
2. Navigate to homepage

**Expected Events:**
- ✅ `session_start` (once per session)
- ✅ `page_view` with `page_path: '/'`

**Verify in DebugView:**
- Check event name matches
- Check `device` parameter (mobile/tablet/desktop)
- Check `language` parameter

---

## Test 2: Signup Flow

**Steps:**
1. Navigate to `/sign-up`
2. Type in email field
3. Type in password field
4. Type in name field
5. Fill other required fields
6. Click submit button
7. Complete signup process

**Expected Events:**
- ✅ `start_signup` (on page load)
- ✅ `signup_input` with `field_name: 'email'` (when typing email)
- ✅ `signup_input` with `field_name: 'password'` (when typing password)
- ✅ `signup_input` with `field_name: 'name'` (when typing name)
- ✅ `signup_submit` (when form submitted)
- ✅ `signup_success` with `user_id` (on successful registration)

**Verify in DebugView:**
- All events appear in sequence
- `signup_success` includes `user_id` parameter
- `start_signup` includes `page_location`

---

## Test 3: Login Flow

**Steps:**
1. Navigate to `/sign-in`
2. Enter email/identifier
3. Enter password
4. Click login button

**Expected Events:**
- ✅ `login_attempt` (when login button clicked)
- ✅ `login_success` with `user_id` and `login_method: 'email'` (on success)

**Verify in DebugView:**
- `login_success` includes `user_id` parameter
- `login_method` is 'email' (or 'biometric' if using biometric login)

---

## Test 4: Revisit Detection

**Steps:**
1. Complete Test 3 (login)
2. Log out
3. Log back in with same account

**Expected Events:**
- ✅ `revisit` with `user_id` (when returning user logs in)

**Verify in DebugView:**
- `revisit` event appears after `login_success`
- Includes `user_id` and `timestamp` parameters

---

## Test 5: Post Creation Flow

**Steps:**
1. Log in
2. Navigate to community tab
3. Click "Write Post" or open post creation modal
4. Fill in title and content
5. Click submit

**Expected Events:**
- ✅ `post_start` (when modal opens)
- ✅ `post_submit` (when form submitted)
- ✅ `post_success` with `post_id` (on successful creation)

**Verify in DebugView:**
- `post_start` includes `page_location`
- `post_success` includes `post_id` parameter

---

## Test 6: Comment Flow

**Steps:**
1. Open any post
2. Click/focus on comment input field
3. Type comment
4. Click submit

**Expected Events:**
- ✅ `comment_start` with `post_id` (when input focused)
- ✅ `comment_submit` with `post_id` (when submitted)
- ✅ `comment_success` with `comment_id` and `post_id` (on success)

**Verify in DebugView:**
- All events include `post_id`
- `comment_success` includes both `comment_id` and `post_id`

---

## Test 7: CTA Clicks

**Steps:**
1. Navigate to homepage
2. Click main CTA button (e.g., "Get Started")
3. Click video CTA button
4. Click navbar "Login/Signup" button
5. Click navbar "Mentor Signup" button

**Expected Events:**
- ✅ `cta_click` with `cta_type: 'hero_main_cta'`
- ✅ `cta_click` with `cta_type: 'hero_video_cta'`
- ✅ `cta_click` with `cta_type: 'navbar_login_signup'`
- ✅ `cta_click` with `cta_type: 'navbar_mentor_signup'`

**Verify in DebugView:**
- Each CTA click emits `cta_click` event
- `cta_type` parameter identifies which CTA was clicked
- `page_location` shows where the click occurred

---

## Test 8: Page Navigation

**Steps:**
1. Navigate between different pages:
   - `/` (home)
   - `/sign-in`
   - `/sign-up`
   - `/main`
   - `/community`

**Expected Events:**
- ✅ `page_view` for each page with correct `page_path`

**Verify in DebugView:**
- `page_view` emitted on every route change
- `page_path` matches the actual route
- `page_title` matches document title

---

## Common Issues & Troubleshooting

### Events Not Appearing

1. **Check Debug Mode:**
   - Ensure `?debug_mode=true` is in URL or GA Debugger extension is active
   - Check browser console for GA4 errors

2. **Check gtag Loading:**
   - Open browser console
   - Type: `window.gtag`
   - Should return a function, not undefined

3. **Check Environment Variable:**
   - Verify `NEXT_PUBLIC_GA4_MEASUREMENT_ID` is set correctly
   - Check `.env.local` file

4. **Check Network Tab:**
   - Open DevTools > Network
   - Filter by "collect" or "gtag"
   - Should see requests to `google-analytics.com`

### Duplicate Events

- `session_start` should only fire once per session (uses sessionStorage)
- `revisit` should only fire once per session (uses sessionStorage)
- If seeing duplicates, clear sessionStorage and test again

### Missing Parameters

- Check browser console logs for `[GA4] Event tracked:` messages
- Verify parameters are being passed correctly
- Check that user is logged in for user_id parameters

---

## Automated Testing (Optional)

You can also test programmatically in browser console:

```javascript
// Check if gtag is loaded
console.log('gtag loaded:', typeof window.gtag === 'function')

// Check if events are being tracked
// (Events should appear in console as: [GA4] Event tracked: event_name)

// Manually trigger an event
window.gtag('event', 'test_event', {
  test_param: 'test_value'
})
```

---

## Success Criteria

All tests pass if:
- ✅ All 16 standardized events are implemented
- ✅ Events fire at correct times in user flows
- ✅ Events include required parameters
- ✅ No duplicate events (except intentional ones)
- ✅ Events appear in GA4 DebugView within 1-2 seconds
- ✅ Event parameters are correctly formatted

---

## Next Steps After Testing

1. Verify events in GA4 Real-Time reports
2. Set up conversion events in GA4
3. Create custom funnels using these events
4. Build dashboards and reports
5. Set up alerts for key events
