export function createNavbar(searchState, onToggleSidebar, onHomeClick) {
  return $adu.html`
    <header class="yt-navbar">
      <!-- Left: Hamburger Menu & Logo -->
      <div class="yt-nav-left">
        <button class="yt-icon-btn interactive-btn" onclick=${onToggleSidebar} title="Toggle Sidebar">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>

        <div class="yt-logo" onclick=${onHomeClick} title="AduScript YouTube">
          ${$adu.logo(28)}
          <span class="yt-logo-text" style="margin-left:4px;">AduTube</span>
          <span class="yt-logo-sub">ADS</span>
        </div>
      </div>

      <!-- Center: Search Bar -->
      <div class="yt-nav-center">
        <div class="yt-search-container">
          <input
            type="text"
            class="yt-search-input"
            placeholder="Search videos, creators, topics..."
            value="${searchState.value}"
            oninput=${((e) => {
  searchState.value = e.target.value;
})}
          />
          <button class="yt-search-btn" title="Search">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </button>
        </div>

        <button class="yt-icon-btn interactive-btn" title="Search with your voice" onclick=${(() => {
  alert("🎙️ Voice search activated: Speak your query!");
})}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
            <line x1="12" y1="19" x2="12" y2="23"></line>
            <line x1="8" y1="23" x2="16" y2="23"></line>
          </svg>
        </button>
      </div>

      <!-- Right: Actions & User Avatar -->
      <div class="yt-nav-right">
        <button class="yt-icon-btn interactive-btn" title="Create Video">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="23 7 16 12 23 17 23 7"></polygon>
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
          </svg>
        </button>

        <button class="yt-icon-btn interactive-btn" title="Notifications">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
        </button>

        <div class="yt-avatar interactive-btn" title="AduScript User">A</div>
      </div>
    </header>
  `;
}
