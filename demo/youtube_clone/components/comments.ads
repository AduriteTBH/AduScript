// Comments Component in pure AduScript

export fn createCommentsSection(video, commentsState, onAddComment) {
  let commentList = commentsState.value.map(c -> {
    return f`
      <div class="comment-item">
        <div class="channel-avatar" style="width:36px;height:36px;background:#6366f1;font-size:12px;">
          ${c.avatar || 'U'}
        </div>
        <div style="flex:1;">
          <div>
            <span class="comment-author">@${c.author}</span>
            <span class="comment-time">${c.time}</span>
          </div>
          <div class="comment-text">${c.text}</div>
          <div style="display:flex;gap:16px;margin-top:8px;font-size:12px;color:var(--yt-text-secondary);align-items:center;">
            <button style="background:none;border:none;color:inherit;cursor:pointer;display:flex;align-items:center;gap:4px;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>
              <span>12</span>
            </button>
            <button style="background:none;border:none;color:inherit;cursor:pointer;">Reply</button>
          </div>
        </div>
      </div>
    `
  }).join("")

  let container = $adu.html`
    <section class="comments-section">
      <div class="comments-header">
        <span>${commentsState.value.length} Comments</span>
      </div>

      <!-- Add Comment Form -->
      <div class="comment-input-box">
        <div class="channel-avatar" style="width:36px;height:36px;background:linear-gradient(135deg, #6366f1, #ec4899);font-size:12px;">A</div>
        <div style="flex:1;display:flex;flex-direction:column;gap:8px;">
          <input
            type="text"
            id="new-comment-input"
            class="comment-input"
            placeholder="Add a public comment..."
          />
          <div style="display:flex;justify-content:flex-end;gap:8px;">
            <button class="btn" style="background:transparent;color:var(--yt-text-secondary);" onclick=${() -> {
              let input = document.getElementById("new-comment-input")
              if (input) input.value = ""
            }}>Cancel</button>
            <button class="btn btn-inc" onclick=${() -> {
              let input = document.getElementById("new-comment-input")
              if (input && input.value.trim().length > 0) {
                onAddComment(input.value.trim())
                input.value = ""
              }
            }}>Comment</button>
          </div>
        </div>
      </div>

      <!-- Comment Items List -->
      <div style="display:flex;flex-direction:column;gap:18px;margin-top:8px;">
        ${commentList}
      </div>
    </section>
  `

  return container
}
