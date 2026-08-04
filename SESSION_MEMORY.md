# Velora Bureau Site - Session Memory

This file serves as a memory checkpoint for the state of the project, capturing everything that was modified in the latest development session so that future sessions can pick up exactly where we left off.

## 1. Local Environment Setup
- Successfully set up and ran the local development server using `http-server` on `http://localhost:8080`.
- Verified live rendering on physical mobile devices by pointing to the local IP address.

## 2. Header and Button Updates
- **Button Styling & Order:** The "JOIN US" and "CONTACT US" buttons were re-ordered. The "JOIN US" button now perfectly inherits the premium gradient and animations of the "CONTACT US" button.
- **Button Stacking:** Per user request, the "Join Us" button is now stacked below the "Contact Us" button globally (in all previews/devices) using `flex-direction: column` in `.header-actions`.
- **Mobile Header Layout:** We completely removed the hamburger menu approach. The standard navigation bar is now displayed on mobile devices.
- **Fluid Sizing:** We converted mobile header sizing to `vw` units to prevent the navigation bar from overlapping or overflowing on narrow screens.
- **Header Scroll Contrast:** Added a sleek, semi-transparent frosted-glass background (`rgba(0,0,0,0.85)` with `backdrop-filter`) to the mobile header so the text below doesn't clash when scrolling.

## 3. Mobile Layout, Scaling, & Layout Break Fixes
- **Zoom-Out Split-Screen Bug Fixed:** The user encountered a bug where zooming out on their phone would trigger a desktop layout (split screen). This was fixed by locking the viewport in `index.html` (`maximum-scale=1.0, user-scalable=0`), permanently securing the mobile layout.
- **Horizontal Overflow Fixed:** Added strict `overflow-x: hidden` and `width: 100%` rules to `html`, `body`, and `<main>`.
- **Text Centering & Padding:** Fixed a bug where massive nested paddings were squeezing content to the left side of the screen. Stripped all nested paddings and ensured all `.home-intro` texts are perfectly 100% wide and center-aligned on mobile.
- **Slide Alignment:** Decreased the `.slide-title` font size and shifted it up slightly (`top: 32%`) on mobile so the paragraph description doesn't get cut off at the bottom of the screen.

## 4. Performance & Javascript Fixes
- **WebGL Resize Glitching:** Fixed severe glitching and lag on mobile when the address bar appeared/disappeared (which triggered hundreds of `resize` events). Wrapped the heavy WebGL `resizeCanvas` function inside a 100ms debounce timeout in `assets/liquid-effect.js`.
- **WebGL Scroll Disappearance:** Fixed a major bug where scrolling down the page would cause the golden horse video background to scroll up out of view, leaving only a solid black background. The script `liquid-effect.js` was hardcoded to `position: absolute`; changed it to `position: fixed`.
- **Background Effects Disabled on Mobile:** Disabled the heavy film-grain SVG overlay (`body:after`) on mobile to improve scrolling performance.
- **Cache Busting:** Implemented forced cache invalidation parameters (`?v=3` and `?v=4`) in `index.html` on stylesheets and scripts to ensure mobile and desktop devices immediately bypass browser cache after CSS and JS updates.

## 5. Cinematic Background & "Flawless View" Cleanup
- **Header Line:** Hid the animated breathing line at the bottom of the navigation bar.
- **Progress Dash:** Commented out the `.cinematic-progress` vertical slider tracking dash.
- **Ambient Sheen:** Commented out the `.ambient-sheen` diagonal floating light flares.
- **Section Dividers:** Removed the faint horizontal border lines (`border-top`, `border-bottom`) from `.home-section` so content flows seamlessly.

## 6. Custom Cursor Reversion
- The custom cursor was intentionally RESTORED and remains active across all devices.

---
*Ready to continue development in the next session!*
