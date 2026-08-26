// Header Component
export fn createHeader(title, subtitle) {
  return $adu.html`
    <header class="app-header">
      <div>
        <h1 class="header-title">${title}</h1>
        <p style="font-size: 13px; color: var(--text-muted); margin-top: 4px;">${subtitle}</p>
      </div>
      <div class="badge">Modular .ads Active</div>
    </header>
  `
}
