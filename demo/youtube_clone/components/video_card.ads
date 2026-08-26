// Video Card Component in pure AduScript
import { formatViews, formatDuration } from "../utils/formatters.ads"

export fn createVideoCard(video, onSelectVideo) {
  let viewsFormatted = formatViews(video.views)
  let durationFormatted = formatDuration(video.duration)

  return $adu.html`
    <div class="video-card video-card-anim" onclick=${() -> onSelectVideo(video)}>
      <!-- 16:9 Animated Gradient Thumbnail Canvas -->
      <div class="video-thumbnail video-thumbnail-wrapper">
        <div class="thumbnail-content">
          <div class="thumbnail-gradient video-thumbnail-canvas" style="background: ${video.colorGradient};">
            <div style="font-size: 32px; filter: drop-shadow(0 4px 10px rgba(0,0,0,0.5));">${video.iconBadge}</div>
            <div style="font-size: 13px; font-weight: 700; color: rgba(255,255,255,0.9); text-shadow: 0 2px 4px rgba(0,0,0,0.6);">
              ${video.category}
            </div>
          </div>
        </div>
        <div class="time-badge">${durationFormatted}</div>
      </div>

      <!-- Video Details & Channel Info -->
      <div class="video-details">
        <div class="channel-avatar" style="background: ${video.channelColor};">
          ${video.channelAvatar}
        </div>

        <div class="video-info">
          <h3 class="video-title" title="${video.title}">${video.title}</h3>
          <div class="channel-name">
            <span>${video.channel}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="#aaa"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
          </div>
          <div class="video-metadata">
            <span>${viewsFormatted}</span> • <span>${video.timestamp}</span>
          </div>
        </div>
      </div>
    </div>
  `
}
