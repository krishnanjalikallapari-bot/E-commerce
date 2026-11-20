const API_URL = "https://fakestoreapi.com/products";
const SHIPPING_FEE = 6.99;
const FREE_SHIPPING_THRESHOLD = 100;

const productGrid = document.getElementById("productGrid");
const loadingState = document.getElementById("loadingState");
const errorState = document.getElementById("errorState");
const emptyState = document.getElementById("emptyState");
const resultSummary = document.getElementById("resultSummary");
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const categoryChips = document.getElementById("categoryChips");
const sortSelect = document.getElementById("sortSelect");
const cartDrawer = document.getElementById("cartDrawer");
const drawerBackdrop = document.getElementById("drawerBackdrop");
const cartItemsEl = document.getElementById("cartItems");
const cartEmpty = document.getElementById("cartEmpty");
const cartSummary = document.getElementById("cartSummary");
const cartCount = document.getElementById("cartCount");
const drawerItemCount = document.getElementById("drawerItemCount");
const toast = document.getElementById("toast");

let products = [];
let activeCategory = "all";
let cart = loadCart();
let toastTimer;

document.getElementById("year").textContent = new Date().getFullYear();

function loadCart() {
  try {
    const saved = JSON.parse(localStorage.getItem("shopease-cart") || "[]");
    return Array.isArray(saved) ? saved.filter(item =>
      Number.isInteger(item.id) && Number.isInteger(item.quantity) && item.quantity > 0
    ) : [];
  } catch {
    return [];
  }
}

function saveCart() {
  localStorage.setItem("shopease-cart", JSON.stringify(cart));
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[char]);
}

function money(amount) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

function shortCategory(category) {
  return category.replace(/^(men's|women's)\s+/i, "");
}

async function fetchProducts() {
  loadingState.classList.remove("hidden");
  errorState.classList.add("hidden");
  emptyState.classList.add("hidden");
  productGrid.innerHTML = "";
  resultSummary.textContent = "Loading products…";
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error(`API request failed: ${response.status}`);
    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0) throw new Error("No products returned");
    products = data;
    populateCategories();
    renderProducts();
    renderCart();
  } catch (error) {
    console.error(error);
    loadingState.classList.add("hidden");
    resultSummary.textContent = "Collection unavailable";
    errorState.classList.remove("hidden");
  }
}

function populateCategories() {
  const categories = [...new Set(products.map(product => product.category))].sort();
  categoryFilter.innerHTML = '<option value="all">All categories</option>' +
    categories.map(category => `<option value="${escapeHTML(category)}">${escapeHTML(category)}</option>`).join("");
  categoryChips.innerHTML = `<button class="chip ${activeCategory === "all" ? "active" : ""}" data-category="all">All items</button>` +
    categories.map(category => `<button class="chip ${activeCategory === category ? "active" : ""}" data-category="${escapeHTML(category)}">${escapeHTML(shortCategory(category))}</button>`).join("");
  categoryFilter.value = activeCategory;
}

function getVisibleProducts() {
  const query = searchInput.value.trim().toLowerCase();
  let visible = products.filter(product => {
    const matchesCategory = activeCategory === "all" || product.category === activeCategory;
    const matchesSearch = `${product.title} ${product.description} ${product.category}`.toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });

  switch (sortSelect.value) {
    case "price-low": visible.sort((a, b) => a.price - b.price); break;
    case "price-high": visible.sort((a, b) => b.price - a.price); break;
    case "rating": visible.sort((a, b) => b.rating.rate - a.rating.rate); break;
    case "name": visible.sort((a, b) => a.title.localeCompare(b.title)); break;
    default: visible.sort((a, b) => a.id - b.id);
  }
  return visible;
}

function renderProducts() {
  loadingState.classList.add("hidden");
  errorState.classList.add("hidden");
  const visible = getVisibleProducts();
  resultSummary.textContent = `${visible.length} ${visible.length === 1 ? "item" : "items"} to explore`;
  productGrid.innerHTML = "";
  emptyState.classList.toggle("hidden", visible.length !== 0);
  if (visible.length === 0) return;

  productGrid.innerHTML = visible.map((product, index) => `
    <article class="product-card" style="animation-delay:${Math.min(index * 35, 250)}ms">
      <div class="product-image-wrap">
        <span class="product-category">${escapeHTML(shortCategory(product.category))}</span>
        <img src="${escapeHTML(product.image)}" alt="${escapeHTML(product.title)}" loading="lazy" />
        <button class="quick-add" data-add="${product.id}" aria-label="Add ${escapeHTML(product.title)} to cart" title="Add to bag">+</button>
      </div>
      <div class="product-info">
        <h3 class="product-title" title="${escapeHTML(product.title)}">${escapeHTML(product.title)}</h3>
        <div class="product-meta"><span class="product-price">${money(product.price)}</span>
          <span class="product-rating" aria-label="Rated ${product.rating.rate} out of 5">★ ${Number(product.rating.rate).toFixed(1)} <span class="rating-count">(${product.rating.count})</span></span>
        </div>
      </div>
    </article>`).join("");
}

function addToCart(id) {
  const product = products.find(item => item.id === Number(id));
  if (!product) return;
  const existing = cart.find(item => item.id === product.id);
  if (existing) existing.quantity += 1;
  else cart.push({ id: product.id, quantity: 1 });
  saveCart();
  renderCart();
  showToast(`${product.title} added to your bag`);
}

function changeQuantity(id, delta) {
  const item = cart.find(entry => entry.id === Number(id));
  if (!item) return;
  item.quantity += delta;
  if (item.quantity <= 0) cart = cart.filter(entry => entry.id !== Number(id));
  saveCart();
  renderCart();
}

function removeFromCart(id) {
  cart = cart.filter(item => item.id !== Number(id));
  saveCart();
  renderCart();
  showToast("Item removed from your bag");
}

function getCartDetails() {
  const items = cart.map(entry => {
    const product = products.find(item => item.id === entry.id);
    return product ? { ...product, quantity: entry.quantity } : null;
  }).filter(Boolean);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = items.length === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  return { items, subtotal, shipping, total: subtotal + shipping, quantity: items.reduce((sum, item) => sum + item.quantity, 0) };
}

function renderCart() {
  const { items, subtotal, shipping, total, quantity } = getCartDetails();
  cartCount.textContent = quantity;
  drawerItemCount.textContent = `(${quantity})`;
  cartEmpty.classList.toggle("hidden", items.length > 0);
  cartItemsEl.classList.toggle("hidden", items.length === 0);
  cartSummary.classList.toggle("hidden", items.length === 0);

  cartItemsEl.innerHTML = items.map(item => `
    <article class="cart-item">
      <img src="${escapeHTML(item.image)}" alt="${escapeHTML(item.title)}" />
      <div>
        <h3 class="cart-item-title">${escapeHTML(item.title)}</h3>
        <div class="cart-item-price">${money(item.price)}</div>
        <div class="cart-item-actions">
          <div class="qty-control" aria-label="Quantity controls for ${escapeHTML(item.title)}">
            <button data-qty="${item.id}" data-delta="-1" aria-label="Decrease quantity">−</button>
            <span>${item.quantity}</span>
            <button data-qty="${item.id}" data-delta="1" aria-label="Increase quantity">+</button>
          </div>
          <button class="remove-item" data-remove="${item.id}">Remove</button>
        </div>
      </div>
      <div class="cart-item-total">${money(item.price * item.quantity)}</div>
    </article>`).join("");

  document.getElementById("subtotal").textContent = money(subtotal);
  document.getElementById("shipping").textContent = shipping === 0 ? "Free" : money(shipping);
  document.getElementById("grandTotal").textContent = money(total);
  document.getElementById("checkoutTotal").textContent = money(total);
  document.getElementById("shippingNote").textContent = subtotal >= FREE_SHIPPING_THRESHOLD
    ? "You've unlocked free shipping!"
    : `Add ${money(FREE_SHIPPING_THRESHOLD - subtotal)} more for free shipping.`;
}

function openCart() {
  cartDrawer.classList.add("open");
  drawerBackdrop.classList.add("open");
  cartDrawer.setAttribute("aria-hidden", "false");
  document.body.classList.add("no-scroll");
  document.getElementById("closeCart").focus();
}

function closeCart() {
  cartDrawer.classList.remove("open");
  drawerBackdrop.classList.remove("open");
  cartDrawer.setAttribute("aria-hidden", "true");
  document.body.classList.remove("no-scroll");
}

function openCheckout() {
  if (cart.length === 0) return;
  document.getElementById("checkoutBackdrop").classList.remove("hidden");
  document.getElementById("customerName").focus();
}

function closeCheckout() {
  document.getElementById("checkoutBackdrop").classList.add("hidden");
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2400);
}

function clearFilters() {
  activeCategory = "all";
  searchInput.value = "";
  categoryFilter.value = "all";
  sortSelect.value = "featured";
  populateCategories();
  renderProducts();
}

searchInput.addEventListener("input", renderProducts);
categoryFilter.addEventListener("change", () => {
  activeCategory = categoryFilter.value;
  populateCategories();
  renderProducts();
});
sortSelect.addEventListener("change", renderProducts);
categoryChips.addEventListener("click", event => {
  const button = event.target.closest("[data-category]");
  if (!button) return;
  activeCategory = button.dataset.category;
  categoryFilter.value = activeCategory;
  populateCategories();
  renderProducts();
});
productGrid.addEventListener("click", event => {
  const button = event.target.closest("[data-add]");
  if (button) addToCart(button.dataset.add);
});
cartItemsEl.addEventListener("click", event => {
  const qtyButton = event.target.closest("[data-qty]");
  const removeButton = event.target.closest("[data-remove]");
  if (qtyButton) changeQuantity(qtyButton.dataset.qty, Number(qtyButton.dataset.delta));
  if (removeButton) removeFromCart(removeButton.dataset.remove);
});

document.getElementById("openCart").addEventListener("click", openCart);
document.getElementById("closeCart").addEventListener("click", closeCart);
drawerBackdrop.addEventListener("click", closeCart);
document.getElementById("continueShopping").addEventListener("click", () => {
  closeCart();
  document.getElementById("shop").scrollIntoView({ behavior: "smooth" });
});
document.getElementById("checkoutButton").addEventListener("click", openCheckout);
document.getElementById("closeCheckout").addEventListener("click", closeCheckout);
document.getElementById("checkoutBackdrop").addEventListener("click", event => {
  if (event.target.id === "checkoutBackdrop") closeCheckout();
});
document.getElementById("retryButton").addEventListener("click", fetchProducts);
document.getElementById("clearFilters").addEventListener("click", clearFilters);
document.getElementById("searchFocus").addEventListener("click", () => {
  document.getElementById("shop").scrollIntoView({ behavior: "smooth" });
  setTimeout(() => searchInput.focus(), 400);
});

document.getElementById("checkoutForm").addEventListener("submit", event => {
  event.preventDefault();
  const name = document.getElementById("customerName").value.trim();
  const email = document.getElementById("customerEmail").value.trim();
  if (!name || !email) return;
  const orderNumber = `SE-${Date.now().toString().slice(-7)}`;
  const { total, quantity } = getCartDetails();
  closeCheckout();
  closeCart();
  cart = [];
  saveCart();
  renderCart();
  event.target.reset();
  showToast(`Order ${orderNumber} confirmed for ${name}! Total: ${money(total)} · ${quantity} item(s).`);
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    closeCheckout();
    closeCart();
  }
});

renderCart();
fetchProducts();
