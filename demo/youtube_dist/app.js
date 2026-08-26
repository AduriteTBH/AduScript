import { $adu } from "./runtime.js";

import "./styles/theme.css";
import "./styles/animations.css";
import "./styles/layout.css";
import { VIDEO_DATASET } from "./data/videos.js";
import { createNavbar } from "./components/navbar.js";
import { createSidebar } from "./components/sidebar.js";
import { createCategoryChips } from "./components/category_chips.js";
import { createVideoCard } from "./components/video_card.js";
import { createWatchPage } from "./components/video_player.js";
const activeNav = $adu.state("home");
const isSidebarCollapsed = $adu.state(false);
const searchQuery = $adu.state("");
const activeCategory = $adu.state("All");
const selectedVideo = $adu.state(null);
const isPlaying = $adu.state(true);
const isLiked = $adu.state(false);
const isSubscribed = $adu.state(false);
const activeComments = $adu.state([]);
const CATEGORIES = ["All", "AduScript", "3D WebGL", "Coding", "AI", "Music", "Gaming", "Podcasts"];
function handleSelectVideo(video) {
  selectedVideo.value = video;
  isPlaying.value = true;
  isLiked.value = false;
  isSubscribed.value = false;
  activeComments.value = (video.comments || []);
  window.scrollTo({ top: 0, behavior: "smooth" });
}
function handleBackToHome() {
  selectedVideo.value = null;
}
function handleToggleSidebar() {
  isSidebarCollapsed.value = !isSidebarCollapsed.value;
}
function handleAddComment(text) {
  const newC = { id: `c_${Date.now()}`, author: "AduScript Developer", avatar: "A", time: "Just now", text: text };
  activeComments.value = [newC, ...activeComments.value];
}
function renderFeedView() {
  const filteredVideos = VIDEO_DATASET.filter(((v) => {
  const matchesCat = ((activeCategory.value == "All") || (v.category == activeCategory.value));
  const matchesSearch = (((searchQuery.value.trim().length == 0) || v.title.toLowerCase().includes(searchQuery.value.toLowerCase())) || v.channel.toLowerCase().includes(searchQuery.value.toLowerCase()));
  return (matchesCat && matchesSearch);
}));
  const chips = createCategoryChips(CATEGORIES, activeCategory);
  const cards = filteredVideos.map(((v) => createVideoCard(v, handleSelectVideo)));
  return $adu.html`
    <div class="yt-content-viewport">
      ${chips}
      <div class="video-grid">
        ${cards}
      </div>
    </div>
  `;
}
function renderWatchView(video) {
  return createWatchPage(video, isPlaying, isLiked, isSubscribed, activeComments, handleBackToHome, handleAddComment, handleSelectVideo, VIDEO_DATASET);
}
function App() {
  const navbar = createNavbar(searchQuery, handleToggleSidebar, handleBackToHome);
  const sidebar = createSidebar(activeNav, isSidebarCollapsed, ((nav) => {
  activeNav.value = nav;
  selectedVideo.value = null;
}));
  const currentContent = $adu.match(selectedVideo.value, [
  { test: $adu.matchLiteral(null), guard: null, body: (val) => (renderFeedView()) },
  { test: $adu.matchWildcard(), guard: null, body: (val) => (renderWatchView(selectedVideo.value)) }
]);
  return $adu.html`
    <div class="app-root">
      ${navbar}
      <div class="yt-main-layout">
        ${sidebar}
        ${currentContent}
      </div>
    </div>
  `;
}
$adu.mount("#app-root", App);
console.log("🚀 AduScript YouTube Clone successfully mounted and active!");
