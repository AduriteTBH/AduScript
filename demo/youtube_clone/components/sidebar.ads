// Sidebar Navigation Component in pure AduScript

export fn createSidebar(activeNav, isCollapsed, onNavSelect) {
  let collapseClass = isCollapsed.value ? "collapsed" : ""

  return $adu.html`
    <aside class="yt-sidebar ${collapseClass}">
      <div class="sidebar-link ${activeNav.value == 'home' ? 'active' : ''}" onclick=${() -> onNavSelect('home')}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
        <span class="sidebar-label">Home</span>
      </div>

      <div class="sidebar-link ${activeNav.value == 'shorts' ? 'active' : ''}" onclick=${() -> onNavSelect('shorts')}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
          <polyline points="2 17 12 22 22 17"></polyline>
          <polyline points="2 12 12 17 22 12"></polyline>
        </svg>
        <span class="sidebar-label">Shorts</span>
      </div>

      <div class="sidebar-link ${activeNav.value == 'subscriptions' ? 'active' : ''}" onclick=${() -> onNavSelect('subscriptions')}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"></path>
          <polyline points="10 2 10 10 13 7 16 10 16 2"></polyline>
        </svg>
        <span class="sidebar-label">Subscriptions</span>
      </div>

      <div class="sidebar-divider"></div>

      <div class="sidebar-section-title">Explore</div>

      <div class="sidebar-link ${activeNav.value == 'trending' ? 'active' : ''}" onclick=${() -> onNavSelect('trending')}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path>
        </svg>
        <span class="sidebar-label">Trending</span>
      </div>

      <div class="sidebar-link ${activeNav.value == 'gaming' ? 'active' : ''}" onclick=${() -> onNavSelect('gaming')}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="6" y1="12" x2="10" y2="12"></line>
          <line x1="8" y1="10" x2="8" y2="14"></line>
          <line x1="15" y1="13" x2="15.01" y2="13"></line>
          <line x1="18" y1="11" x2="18.01" y2="11"></line>
          <rect x="2" y="6" width="20" height="12" rx="2"></rect>
        </svg>
        <span class="sidebar-label">Gaming</span>
      </div>

      <div class="sidebar-link ${activeNav.value == 'music' ? 'active' : ''}" onclick=${() -> onNavSelect('music')}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 18V5l12-2v13"></path>
          <circle cx="6" cy="18" r="3"></circle>
          <circle cx="18" cy="16" r="3"></circle>
        </svg>
        <span class="sidebar-label">Music</span>
      </div>

      <div class="sidebar-divider"></div>

      <div class="sidebar-section-title">Subscriptions</div>

      <div class="sidebar-link" onclick=${() -> onNavSelect('aduscript')}>
        <div style="width:24px;height:24px;border-radius:50%;background:#6366f1;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:bold;color:#fff;">A</div>
        <span class="sidebar-label">AduScript Devs</span>
      </div>

      <div class="sidebar-link" onclick=${() -> onNavSelect('three')}>
        <div style="width:24px;height:24px;border-radius:50%;background:#06b6d4;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:bold;color:#fff;">3</div>
        <span class="sidebar-label">Three.js Matrix</span>
      </div>
    </aside>
  `
}
