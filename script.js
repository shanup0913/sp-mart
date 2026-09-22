const defaultProducts = [
  {
    id: 1,
    name: "Wireless Headphones",
    price: 39.99,
    category: "Electronics",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=700&q=80"
  },
  {
    id: 2,
    name: "Smart Watch",
    price: 59.99,
    category: "Electronics",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=700&q=80"
  },
  {
    id: 3,
    name: "Running Shoes",
    price: 49.99,
    category: "Fashion",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=700&q=80"
  },
  {
    id: 4,
    name: "Backpack",
    price: 29.99,
    category: "Accessories",
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=700&q=80"
  }
];

let products = JSON.parse(localStorage.getItem("spMartProducts")) || defaultProducts;
let cart = JSON.parse(localStorage.getItem("spMartCart")) || [];

const productGrid = document.getElementById("productGrid");
const productForm = document.getElementById("productForm");
const searchInput = document.getElementById("searchInput");
const cartPanel = document.getElementById("cartPanel");
const overlay = document.getElementById("overlay");
const cartItems = document.getElementById("cartItems");
const cartCount = document.getElementById("cartCount");
const cartTotal = document.getElementById("cartTotal");
const toast = document.getElementById("toast");

function save() {
  localStorage.setItem("spMartProducts", JSON.stringify(products));
  localStorage.setItem("spMartCart", JSON.stringify(cart));
}

function money(value) {
  return `$${Number(value).toFixed(2)}`;
}

function placeholderImage(name) {
  return `https://placehold.co/700x500/eef2ff/2563eb?text=${encodeURIComponent(name)}`;
}

function renderProducts(filter = "") {
  const query = filter.trim().toLowerCase();
  const visible = products.filter(p =>
    p.name.toLowerCase().includes(query) ||
    (p.category || "").toLowerCase().includes(query)
  );

  document.getElementById("productSummary").textContent =
    `${visible.length} product${visible.length === 1 ? "" : "s"}`;

  if (!visible.length) {
    productGrid.innerHTML = `<div class="empty">No products found.</div>`;
    return;
  }

  productGrid.innerHTML = visible.map(product => `
    <article class="product-card">
      <img class="product-image"
           src="${escapeHtml(product.image || placeholderImage(product.name))}"
           alt="${escapeHtml(product.name)}"
           onerror="this.src='${placeholderImage(product.name)}'">
      <div class="product-info">
        <span class="category">${escapeHtml(product.category || "General")}</span>
        <h3 class="product-name">${escapeHtml(product.name)}</h3>
        <div class="price">${money(product.price)}</div>
        <div class="product-actions">
          <button class="add-btn" onclick="addToCart(${product.id})">Add to cart</button>
          <button class="delete-btn" onclick="deleteProduct(${product.id})">Remove</button>
        </div>
      </div>
    </article>
  `).join("");
}

function renderCart() {
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  cartCount.textContent = totalItems;

  if (!cart.length) {
    cartItems.innerHTML = `<div class="empty">Your cart is empty.</div>`;
    cartTotal.textContent = "$0.00";
    return;
  }

  let total = 0;
  cartItems.innerHTML = cart.map(item => {
    const product = products.find(p => p.id === item.id);
    if (!product) return "";
    total += product.price * item.quantity;

    return `
      <div class="cart-item">
        <img src="${escapeHtml(product.image || placeholderImage(product.name))}"
             alt="${escapeHtml(product.name)}"
             onerror="this.src='${placeholderImage(product.name)}'">
        <div>
          <h4>${escapeHtml(product.name)}</h4>
          <small>${money(product.price)} each</small>
          <div class="qty">
            <button onclick="changeQuantity(${product.id}, -1)">−</button>
            <strong>${item.quantity}</strong>
            <button onclick="changeQuantity(${product.id}, 1)">+</button>
          </div>
        </div>
        <button class="remove-item" onclick="removeFromCart(${product.id})">Remove</button>
      </div>
    `;
  }).join("");

  cartTotal.textContent = money(total);
}

function addToCart(id) {
  const existing = cart.find(item => item.id === id);
  if (existing) existing.quantity++;
  else cart.push({ id, quantity: 1 });
  save();
  renderCart();
  showToast("Product added to cart");
}

function changeQuantity(id, change) {
  const item = cart.find(i => i.id === id);
  if (!item) return;
  item.quantity += change;
  if (item.quantity <= 0) cart = cart.filter(i => i.id !== id);
  save();
  renderCart();
}

function removeFromCart(id) {
  cart = cart.filter(item => item.id !== id);
  save();
  renderCart();
}

function deleteProduct(id) {
  const product = products.find(p => p.id === id);
  if (!product) return;

  if (!confirm(`Remove "${product.name}" from SP Mart?`)) return;

  products = products.filter(p => p.id !== id);
  cart = cart.filter(item => item.id !== id);
  save();
  renderProducts(searchInput.value);
  renderCart();
  showToast("Product removed");
}

productForm.addEventListener("submit", event => {
  event.preventDefault();

  const name = document.getElementById("productName").value.trim();
  const price = Number(document.getElementById("productPrice").value);
  const image = document.getElementById("productImage").value.trim();
  const category = document.getElementById("productCategory").value.trim() || "General";

  if (!name || !Number.isFinite(price) || price < 0) return;

  products.unshift({
    id: Date.now(),
    name,
    price,
    category,
    image: image || placeholderImage(name)
  });

  save();
  renderProducts(searchInput.value);
  productForm.reset();
  showToast("Product added successfully");
});

searchInput.addEventListener("input", () => renderProducts(searchInput.value));

document.getElementById("cartBtn").addEventListener("click", () => {
  cartPanel.classList.add("open");
  overlay.classList.add("show");
});

function closeCart() {
  cartPanel.classList.remove("open");
  overlay.classList.remove("show");
}

document.getElementById("closeCart").addEventListener("click", closeCart);
overlay.addEventListener("click", closeCart);

document.getElementById("clearCartBtn").addEventListener("click", () => {
  if (!cart.length) return;
  cart = [];
  save();
  renderCart();
  showToast("Cart cleared");
});

document.getElementById("checkoutBtn").addEventListener("click", () => {
  if (!cart.length) {
    showToast("Your cart is empty");
    return;
  }
  alert("Demo checkout: your order has been received!");
  cart = [];
  save();
  renderCart();
  closeCart();
});

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2200);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

renderProducts();
renderCart();
