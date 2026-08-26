import { formatViews, formatDuration, formatSubs } from "../utils/formatters.js";
import { createCommentsSection } from "./comments.js";
export function createWatchPage(video, isPlayingState, likeState, isSubscribedState, commentsState, onBack, onAddComment, onSelectRelated, relatedVideos) {
  const viewsFormatted = formatViews(video.views);
  const subsFormatted = formatSubs(video.subscribers);
  const likesFormatted = (video.likes + (likeState.value ? 1 : 0)).toLocaleString();
  const subText = (isSubscribedState.value ? "Subscribed ✓" : "Subscribe");
  const subClass = (isSubscribedState.value ? "subscribed" : "");
  const likeClass = (likeState.value ? "liked-active" : "");
  const relatedItems = relatedVideos.filter(((v) => (v.id != video.id))).slice(0, 6).map(((v) => {
  return f`
      <div class="side-video-card video-card-anim" onclick=${(() => onSelectRelated(v))}>
        <div class="side-thumbnail video-thumbnail-wrapper">
          <div class="thumbnail-gradient video-thumbnail-canvas" style="background:${v.colorGradient};display:flex;align-items:center;justify-content:center;height:100%;font-size:24px;">
            ${v.iconBadge}
          </div>
          <div class="time-badge">${formatDuration(v.duration)}</div>
        </div>
        <div style="flex:1;display:flex;flex-direction:column;gap:3px;">
          <div style="font-size:13px;font-weight:600;line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${v.title}</div>
          <div style="font-size:12px;color:var(--yt-text-secondary);">${v.channel}</div>
          <div style="font-size:11.5px;color:var(--yt-text-dim);">${formatViews(v.views)} • ${v.timestamp}</div>
        </div>
      </div>
    `;
})).join("");
  const container = $adu.html`
    <div class="watch-page">
      <!-- Main Player & Details Column -->
      <div class="player-container">
        <!-- Back to Grid Button -->
        <div>
          <button class="btn" style="background:var(--yt-bg-hover);color:var(--yt-text-primary);display:flex;align-items:center;gap:6px;padding:6px 12px;font-size:13px;" onclick=${onBack}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg>
            Back to Feed
          </button>
        </div>

        <!-- 16:9 Video Canvas Screen -->
        <div class="video-screen">
          <div class="video-screen-inner" style="background:${video.colorGradient};">
            <!-- Simulated Video Playback Overlay -->
            <div style="display:flex;align-items:center;justify-content:center;height:100%;flex-direction:column;gap:12px;">
              <div style="font-size:72px;filter:drop-shadow(0 8px 24px rgba(0,0,0,0.6));animation:${(isPlayingState.value ? "pulseGlow 2s infinite" : "none")};">
                ${video.iconBadge}
              </div>
              <div style="background:rgba(0,0,0,0.6);backdrop-filter:blur(8px);padding:8px 16px;border-radius:20px;font-size:13px;font-weight:700;letter-spacing:0.5px;">
                ${(isPlayingState.value ? "▶ NOW PLAYING IN ADUSCRIPT ENGINE" : "❚❚ PAUSED")}
              </div>
            </div>

            <!-- Player Bottom Controls Bar -->
            <div class="player-controls">
              <!-- Seek Progress Bar -->
              <div class="progress-bar-container" onclick=${((e) => {
  const rect = e.currentTarget.getBoundingClientRect();
  const pct = ((e.clientX - rect.left) / rect.width);
  console.log(`Seeked video to: ${Math.round((pct * 100))}%`);
})}>
                <div class="progress-bar-fill" style="width: ${(isPlayingState.value ? "45%" : "20%")};"></div>
              </div>

              <!-- Controls Buttons -->
              <div class="player-actions-row">
                <div class="player-left-actions">
                  <button class="play-pause-btn interactive-btn" onclick=${(() => {
  isPlayingState.value = !isPlayingState.value;
})}>
                    ${(isPlayingState.value ? "<svg width=\"22\" height=\"22\" viewBox=\"0 0 24 24\" fill=\"currentColor\"><rect x=\"6\" y=\"4\" width=\"4\" height=\"16\"/><rect x=\"14\" y=\"4\" width=\"4\" height=\"16\"/></svg>" : "<svg width=\"22\" height=\"22\" viewBox=\"0 0 24 24\" fill=\"currentColor\"><polygon points=\"5 3 19 12 5 21 5 3\"/></svg>")}
                  </button>

                  <button class="play-pause-btn interactive-btn" title="Mute/Unmute">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
                  </button>

                  <span style="font-size:12.5px;color:#fff;font-family:var(--font-mono);">
                    03:42 / ${formatDuration(video.duration)}
                  </span>
                </div>

                <div style="display:flex;gap:12px;">
                  <button class="play-pause-btn interactive-btn" title="Settings">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                  </button>

                  <button class="play-pause-btn interactive-btn" title="Fullscreen" onclick=${(() => {
  alert("📺 Fullscreen Theater Mode Triggered!");
})}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Video Title -->
        <h1 class="watch-title">${video.title}</h1>

        <!-- Channel Row & Actions Bar -->
        <div class="watch-meta-row">
          <div class="channel-subscribe-box">
            <div class="channel-avatar" style="width:44px;height:44px;background:${video.channelColor};font-size:16px;">
              ${video.channelAvatar}
            </div>
            <div>
              <div style="font-weight:700;font-size:15px;color:#fff;">${video.channel}</div>
              <div style="font-size:12px;color:var(--yt-text-secondary);">${subsFormatted}</div>
            </div>
            <button class="sub-btn subscribe-btn-anim ${subClass}" onclick=${(() => {
  isSubscribedState.value = !isSubscribedState.value;
})}>
              ${subText}
            </button>
          </div>

          <div style="display:flex;gap:10px;">
            <!-- Like / Dislike Pill -->
            <div class="action-pill-group">
              <button class="action-pill-btn ${likeClass}" onclick=${(() => {
  likeState.value = !likeState.value;
})}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>
                <span>${likesFormatted}</span>
              </button>
              <div style="width:1px;height:16px;background:var(--yt-border);"></div>
              <button class="action-pill-btn" title="Dislike">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3"></path></svg>
              </button>
            </div>

            <button class="action-pill-btn" style="background:var(--yt-bg-hover);border-radius:var(--radius-pill);" onclick=${(() => {
  alert("🔗 Share Link copied to clipboard!");
})}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
              <span>Share</span>
            </button>

            <button class="action-pill-btn" style="background:var(--yt-bg-hover);border-radius:var(--radius-pill);">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              <span>Download</span>
            </button>
          </div>
        </div>

        <!-- Description Box -->
        <div class="watch-description">
          <div style="font-weight:700;margin-bottom:6px;">${viewsFormatted} • Uploaded ${video.timestamp}</div>
          <p>${video.description}</p>
        </div>

        <!-- Comments Section -->
        ${createCommentsSection(video, commentsState, onAddComment)}
      </div>

      <!-- Up Next Column -->
      <div class="up-next-column">
        <div style="font-size:16px;font-weight:700;margin-bottom:4px;">Up Next</div>
        ${relatedItems}
      </div>
    </div>
  `;
  return container;
}
