// ========================================================
// AduScript YouTube Clone Application
// Pure .ads, HTML, and CSS (Zero JavaScript files used!)
// Showcases:
// - Cross-subfolder component architecture
// - CSS injection & modern YouTube Dark Mode UI
// - Fine-grained reactive state signals
// - Pattern matching across view states
// - Pipeline data transformations
// ========================================================

import "./styles/theme.css"
import "./styles/animations.css"
import "./styles/layout.css"

import { VIDEO_DATASET } from "./data/videos.ads"
import { createNavbar } from "./components/navbar.ads"
import { createSidebar } from "./components/sidebar.ads"
import { createCategoryChips } from "./components/category_chips.ads"
import { createVideoCard } from "./components/video_card.ads"
import { createWatchPage } from "./components/video_player.ads"

// 1. Reactive State Signals
state activeNav = "home"
state isSidebarCollapsed = false
state searchQuery = ""
state activeCategory = "All"
state selectedVideo = null
state isPlaying = true
state isLiked = false
state isSubscribed = false
state activeComments = []

let CATEGORIES = ["All", "AduScript", "3D WebGL", "Coding", "AI", "Music", "Gaming", "Podcasts"]

// 2. Action Handlers
fn handleSelectVideo(video) {
  selectedVideo.value = video
  isPlaying.value = true
  isLiked.value = false
  isSubscribed.value = false
  activeComments.value = video.comments || []
  window.scrollTo({ top: 0, behavior: "smooth" })
}

fn handleBackToHome() {
  selectedVideo.value = null
}

fn handleToggleSidebar() {
  isSidebarCollapsed.value = !isSidebarCollapsed.value
}

fn handleAddComment(text) {
  let newC = {
    id: f"c_{Date.now()}",
    author: "AduScript Developer",
    avatar: "A",
    time: "Just now",
    text: text
  }
  activeComments.value = [newC, ...activeComments.value]
}

// 3. Render Views
fn renderFeedView() {
  // Filter by category and search query using AduScript pipelines
  let filteredVideos = VIDEO_DATASET
    .filter(v -> {
      let matchesCat = activeCategory.value == "All" || v.category == activeCategory.value
      let matchesSearch = searchQuery.value.trim().length == 0 || v.title.toLowerCase().includes(searchQuery.value.toLowerCase()) || v.channel.toLowerCase().includes(searchQuery.value.toLowerCase())
      return matchesCat && matchesSearch
    })

  let chips = createCategoryChips(CATEGORIES, activeCategory)

  let cards = filteredVideos.map(v -> createVideoCard(v, handleSelectVideo))

  return $adu.html`
    <div class="yt-content-viewport">
      ${chips}
      <div class="video-grid">
        ${cards}
      </div>
    </div>
  `
}

fn renderWatchView(video) {
  return createWatchPage(
    video,
    isPlaying,
    isLiked,
    isSubscribed,
    activeComments,
    handleBackToHome,
    handleAddComment,
    handleSelectVideo,
    VIDEO_DATASET
  )
}

// 4. Main App Root Component
fn App() {
  let navbar = createNavbar(searchQuery, handleToggleSidebar, handleBackToHome)
  let sidebar = createSidebar(activeNav, isSidebarCollapsed, (nav) -> {
    activeNav.value = nav
    selectedVideo.value = null
  })

  // Pattern matching view renderer
  let currentContent = match selectedVideo.value with {
    null => renderFeedView(),
    _    => renderWatchView(selectedVideo.value)
  }

  return $adu.html`
    <div class="app-root">
      ${navbar}
      <div class="yt-main-layout">
        ${sidebar}
        ${currentContent}
      </div>
    </div>
  `
}

// 5. Mount Reactive Application to DOM
$adu.mount("#app-root", App)

console.log("🚀 AduScript YouTube Clone successfully mounted and active!")
