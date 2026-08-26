export function createCategoryChips(categories, activeCategoryState) {
  const chipElements = categories.map(((cat) => {
  const isActive = ((activeCategoryState.value == cat) ? "active" : "");
  return f`<button class="chip-btn ${isActive}" data-category="${cat}">${cat}</button>`;
})).join("");
  const container = $adu.html`
    <div class="category-bar">
      ${chipElements}
    </div>
  `;
  container.addEventListener("click", ((e) => {
  const btn = e.target.closest(".chip-btn");
  if (btn) {
    activeCategoryState.value = btn.getAttribute("data-category");
  }
}));
  return container;
}
