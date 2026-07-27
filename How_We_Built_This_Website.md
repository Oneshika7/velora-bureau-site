# 🚀 How We Built The Velora Bureau Website: A Beginner's Guide

Welcome! If you are new to web development, this guide will explain exactly how the **Velora Bureau** website was built, step-by-step. We will break down the technologies we used and the logic behind our cinematic scrolling effects so anyone can understand it.

---

## 🛠️ The Technology Stack

We purposely avoided complex frameworks (like React or Next.js) to keep the website lightning-fast and easy to understand. Here is what we used:

1. **HTML5 (The Skeleton):** 
   - HTML provides the structure of the website. It creates the text, buttons, and holds the videos/images.
2. **Vanilla CSS3 (The Paint & Style):**
   - CSS makes the website look beautiful. We used it to position elements, create modern "glassmorphic" (frosted glass) cards, and apply high-quality 8K color filters to our videos.
3. **Vanilla JavaScript (The Brain & Interactivity):**
   - JavaScript handles the logic. We used it specifically to track when the user scrolls down the page and to connect that scroll movement to our cinematic video backgrounds.
4. **Git & GitHub (The Time Machine & Hosting):**
   - We used Git to save versions of our code. GitHub stores our code online and automatically publishes our website to the world using **GitHub Pages**.
5. **Node.js Local Server (`http-server`):**
   - A tool we used to run the website securely on our own computer (at `http://localhost:3101`) before showing it to the world.

---

## 🏗️ Step-by-Step: How We Built It

### Step 1: Setting Up the Workspace and Git
Instead of starting from complete scratch, we started with a "Fork" (a personal copy) of a GitHub repository. 
- We downloaded the code to our local computer.
- By using `git`, every time we made a good change, we took a "snapshot" (a commit) so we could always go back if we made a mistake.

### Step 2: Creating the HTML Structure and Landing Page Sections
We divided the website into separate pages and logical sections to keep things organized.

**1. The Main Landing Page (`index.html`):**
- **Hero Section:** The very top of the website. It contains the large "Velora Bureau" text and introductory message. We used a background video here to grab attention immediately.
- **Services/Engagement Section:** A grid layout explaining what Velora Bureau does (e.g., brand identity, web design). We used CSS Grid to arrange these cleanly.
- **Features Section:** Highlighting key values and metrics.

**2. The Dedicated Partners Page (`partners.html`):**
- A separate, distraction-free page built entirely for our cinematic "Partners in Motion" presentation.

### Step 3: Styling and Landing Page Animations (CSS)
To make Velora Bureau look like a million bucks, we wrote custom CSS in our `assets/home-sections.css` file.
- **Glassmorphism:** We gave text cards a frosted glass look by using `backdrop-filter: blur(15px)` and a semi-transparent dark background `rgba(12, 10, 8, 0.7)`.
- **Video Filters:** To make the background videos pop and feel like an 8K cinematic movie, we applied CSS filters: `filter: contrast(1.15) saturate(1.3) brightness(1.1)`.
- **Smooth Fades & Hero Animations:** When you first load the website, the text doesn't just appear—it slides up and fades in smoothly. We did this using CSS `@keyframes` animations, transforming the `opacity` (from invisible to visible) and `transform: translateY()` (sliding it upward).

### Step 4: The Magic "Scrollytelling" Effect (JavaScript)
The most impressive part of `partners.html` is how the video plays forward and backward as you scroll up and down. Here is how we did it in `assets/partner-scrollytelling.js`:

1. **Make the section very tall:** We used CSS to make the scrolling area much taller than the screen (`height: 320vh`).
2. **Pin the video:** We made the video and text stick to the screen (`position: sticky`) so they stay in view while you scroll down the invisible tall container.
3. **The Math:** JavaScript calculates exactly how far down the page you have scrolled (from 0% to 100%).
4. **Method A (The Canvas Frame Sequence):** Before we used the MP4 video, we exported our video as 30 individual PNG pictures (frames). As the scroll percentage went from 0% to 100%, JavaScript calculated which of the 30 images to draw onto an HTML `<canvas>`, creating a perfect frame-by-frame animation just by scrolling!
5. **Method B (Video Scrubbing):** For even higher quality, we switched to using the raw `.mp4` video. We take the scroll percentage and multiply it by the video's total length. *Example:* If you scroll 50% down the page, JavaScript tells the video: *"Jump exactly to the middle of the movie (`video.currentTime`)."* 
6. **Revealing Text Cards:** As the percentage increases, JavaScript automatically hides the old text card and reveals the next one, perfectly matching the video's current scene.

### Step 5: Testing Locally
Before putting the website on the internet, we ran a command in our terminal: `npx http-server`.
This launched a mini web-server on our computer so we could test our cinematic scrolling in our browser (Chrome/Edge) to ensure it felt smooth and perfect.

### Step 6: Going Live (Deployment)
Once everything was perfect locally, we didn't have to pay for an expensive server. 
1. We used Git to "Push" (upload) our changes to our GitHub repository.
2. GitHub automatically noticed the new code and updated the live website via **GitHub Pages**.

---

## 🎓 Summary for Beginners
If you are starting out, the Velora Bureau project proves that you **do not** need incredibly complex software to build something breathtaking. By mastering the core fundamentals—**HTML structure, CSS animations/glassmorphism, and JavaScript scroll math**—you can create world-class, cinematic web experiences from the ground up!
