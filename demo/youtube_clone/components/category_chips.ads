// Category Filter Chips in pure AduScript

export fn createCategoryChips(categories, activeCategoryState) {
  let chipElements = categories.map(cat -> {
    let isActive = activeCategoryState.value == cat ? "active" : ""
    return f`<button class="chip-btn ${isActive}" data-category="${cat}">${cat}</button>`
  }).join("")

  let container = $adu.html`
    <div class="category-bar">
      ${chipElements}
    </div>
  `

  // Event Delegation for active category filter
  container.addEventListener("click", (e) -> {
    let btn = e.target.closest(".chip-btn")
    if (btn) {
      activeCategoryState.value = btn.getAttribute("data-category")
    }
  })

  return container
}
