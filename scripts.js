// scripts.js — cleaned & consolidated for KCSR Breads atbp

let cart = [];
const form = document.querySelector("#orderForm form");
const toast = document.getElementById("toast");
const previewBox = document.getElementById("previewBox");
const cartItems = document.getElementById("cartItems");
const cartTotalDisplay = document.getElementById("cartTotal");
const grid = document.getElementById("dynamicProducts");
const maxQty = 99;
const minQty = 1;

const API_BASE = "https://gossip-uye2.onrender.com";
const FRONT_BASE = window.location.origin;
const LOCAL_CART_KEY = "cartData";
const LOCAL_PRODUCTS_KEY = "products";

let gossipPopup = null;
let isLoggingOut = false;
const isDark = document.body.classList.contains("dark");

// ------------------- Storage & server sync -------------------

function saveCartToStorage() {
  try {
    localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(cart));
    window.dispatchEvent(new StorageEvent('storage', { key: LOCAL_CART_KEY, newValue: JSON.stringify(cart) }));
  } catch (e) {
    console.error("Couldn't save cart to storage:", e);
  }
}

function loadCartFromStorage() {
  const stored = localStorage.getItem(LOCAL_CART_KEY);
  if (!stored) return;
  try {
    cart = JSON.parse(stored) || [];
  } catch (e) {
    console.error("Failed to parse stored cart:", e);
    cart = [];
  }
  updateCartDisplay();
  updateCartBadge();
  updateCartSubtotal();
}

function syncCartWithDB() {
  const user = localStorage.getItem("gossipUser");
  if (!user || !cart) return;
  fetch(`${API_BASE}/api/cart`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ items: cart })
  })
  .then(res => {
    if (!res.ok) throw new Error("Failed saving cart to server");
    return res.json();
  })
  .then(data => {
    // optionally handle server response
    console.log("Cart synced to server:", data);
  })
  .catch(err => console.error("Cart sync error:", err));
}

async function loadCartFromDatabase() {
  const user = localStorage.getItem("gossipUser");
  if (!user) return; // don't attempt if not logged in
  try {
    const res = await fetch(`${API_BASE}/api/cart`, {
      method: "GET",
      credentials: "include"
    });
    if (!res.ok) throw new Error("Failed to load cart from DB");
    const items = await res.json();
    if (Array.isArray(items)) {
      cart.length = 0;
      cart.push(...items);
      saveCartToStorage();
      updateCartBadge();
      updateCartDisplay();
      updateCartSubtotal();
    }
  } catch (err) {
    console.error("Error loading cart:", err);
  }
}

// ------------------- Cart UI helpers -------------------

function updateCartBadge() {
  let total = 0;
  cart.forEach(item => total += parseInt(item.quantity || 0, 10));

  const cartCountEl = document.getElementById("cartCount");
  if (cartCountEl) {
    cartCountEl.textContent = total;
    cartCountEl.style.display = total > 0 ? "inline-block" : "none";
  }

  const mobileCountEl = document.getElementById("mobileCartCount");
  if (mobileCountEl) {
    mobileCountEl.textContent = total;
    mobileCountEl.style.display = total > 0 ? "inline-block" : "none";
  }
}

function updateCartSubtotal() {
  const subtotal = cart.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  const subtotalEl = document.getElementById("cartSubtotal");
  if (subtotalEl) subtotalEl.textContent = `RM ${subtotal.toFixed(2)}`;
}

function cartToggle() {
  const orderPanel = document.querySelector(".order");
  if (orderPanel) orderPanel.classList.toggle("open");
}

function buildMessage() {
  const date = document.getElementById("date")?.value || "Not specified";
  if (cart.length === 0) return "Your cart is empty.";

  const lines = cart.map(item =>
    `👉 ${item.quantity} × ${item.product} @ RM ${item.price.toFixed(2)} = RM ${(item.quantity * item.price).toFixed(2)}`
  );
  const total = cart.reduce((sum, item) => sum + item.quantity * item.price, 0);

  return `Hi KCSR! I'd like to place an order:\n\n🧺 Order Summary:\n${lines.join("\n")}\n\n🧾 Total: RM ${total.toFixed(2)}\n📅 Pick-up Date: ${date}`;
}

function showToast(message = "Order message copied to clipboard!") {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2000);
}

// ------------------- Cart actions -------------------

function addToCart(productName, quantity, price) {
  const qty = parseInt(quantity, 10);
  if (isNaN(qty) || qty <= 0) {
    alert("Please enter a valid quantity.");
    return;
  }
  const existing = cart.find(i => i.product === productName);
  if (existing) {
    existing.quantity += qty;
  } else {
    cart.push({ product: productName, quantity: qty, price: Number(price) });
  }

  updateCartDisplay();
  updateCartBadge();
  updateCartSubtotal();
  saveCartToStorage();
  syncCartWithDB();
}

function removeFromCart(index) {
  if (index < 0 || index >= cart.length) return;
  cart.splice(index, 1);
  updateCartDisplay();
  updateCartBadge();
  updateCartSubtotal();
  saveCartToStorage();
  syncCartWithDB();
}

function changeQuantity(id, delta) {
  const input = document.getElementById(id);
  if (!input) return;
  let val = parseInt(input.value, 10) || 0;
  val = Math.min(maxQty, Math.max(0, val + delta));
  input.value = val;
  // No direct cart mutation here unless it's an "add to cart" action.
}

// ------------------- Render cart -------------------

function updateCartDisplay() {
  if (!cartItems) return;
  cartItems.innerHTML = "";

  if (cart.length === 0) {
    cartItems.innerHTML = `<p>Your cart is empty.</p>`;
    cartTotalDisplay.innerHTML = `<strong>Total: RM 0.00</strong>`;
    previewBox.textContent = buildMessage();
    return;
  }

  let total = 0;

  cart.forEach((item, index) => {
    const li = document.createElement("li");
    li.className = "cart-item";

    // Title & price lines
    const title = document.createElement("div");
    title.className = "cart-item-title";
    title.textContent = `${item.product} — RM ${item.price.toFixed(2)}`;

    // Qty controls
    const controls = document.createElement("div");
    controls.className = "cart-item-controls";

    const minusBtn = document.createElement("button");
    minusBtn.className = "qtyBtn";
    minusBtn.textContent = "−";
    minusBtn.addEventListener("click", () => {
      if (item.quantity > 1) {
        item.quantity--;
      } else {
        if (confirm(`Remove ${item.product} from cart?`)) {
          cart.splice(index, 1);
        }
      }
      updateCartDisplay();
      updateCartBadge();
      updateCartSubtotal();
      saveCartToStorage();
      syncCartWithDB();
    });

    const qtyDisplay = document.createElement("span");
    qtyDisplay.className = "qtyDisplay";
    qtyDisplay.textContent = item.quantity;

    const plusBtn = document.createElement("button");
    plusBtn.className = "qtyBtn";
    plusBtn.textContent = "+";
    plusBtn.addEventListener("click", () => {
      if (item.quantity < maxQty) {
        item.quantity++;
        updateCartDisplay();
        updateCartBadge();
        updateCartSubtotal();
        saveCartToStorage();
        syncCartWithDB();
      }
    });

    controls.appendChild(minusBtn);
    controls.appendChild(qtyDisplay);
    controls.appendChild(plusBtn);

    // Delete button
    const delBtn = document.createElement("button");
    delBtn.className = "del-btn";
    delBtn.textContent = "🗑️";
    delBtn.title = "Remove item";
    delBtn.addEventListener("click", () => removeFromCart(index));

    // Subtotal line
    const subtotal = item.quantity * item.price;
    const subtotalEl = document.createElement("div");
    subtotalEl.className = "cart-item-subtotal";
    subtotalEl.textContent = `RM ${subtotal.toFixed(2)}`;

    li.appendChild(title);
    li.appendChild(controls);
    li.appendChild(subtotalEl);
    li.appendChild(delBtn);
    cartItems.appendChild(li);

    total += subtotal;
  });

  cartTotalDisplay.innerHTML = `<strong>Total: RM ${total.toFixed(2)}</strong>`;
  previewBox.textContent = buildMessage();
}

// ------------------- Products -------------------

function loadProducts() {
  if (!grid) return;
  const products = JSON.parse(localStorage.getItem(LOCAL_PRODUCTS_KEY)) || [];
  grid.innerHTML = "";

  products.forEach((product, index) => {
    const card = document.createElement("div");
    card.className = "product";
    card.innerHTML = `
      <img src="${product.image}" alt="${product.name}" onclick="toggleZoom(this)">
      <h2>${product.name}</h2>
      <p>${product.description || ""}</p>
      <p><strong>RM ${product.price.toFixed(2)}</strong></p>

      <div class="quantity-control">
        <button type="button" onclick="changeQuantity('qty-dyn-${index}', -1)">−</button>
        <input type="number" id="qty-dyn-${index}" min="1" max="99" value="1" step="1" />
        <button type="button" onclick="changeQuantity('qty-dyn-${index}', 1)">+</button>
      </div>

      <button type="button" onclick="addToCart('${escapeHtml(product.name)}', document.getElementById('qty-dyn-${index}').value, ${product.price})">Add to Cart</button>
    `;
    grid.appendChild(card);
  });
}

function escapeHtml(text) {
  return text.replace(/'/g, "\\'").replace(/"/g, '\\"');
}

// ------------------- Misc UI -------------------

function toggleZoom(img) {
  img.classList.toggle("zoomed");
}

function setMinPickupDate() {
  const dateInput = document.getElementById("date");
  if (!dateInput) return;
  const today = new Date();
  today.setDate(today.getDate() + 2);
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  dateInput.min = `${yyyy}-${mm}-${dd}`;
}

function printOrderSummary() {
  if (cart.length === 0) {
    alert("Cart is empty.");
    return;
  }
  const name = document.getElementById("name")?.value || "Customer";
  const date = document.getElementById("date")?.value || "";
  const printSection = document.getElementById("printSection");
  const printName = document.getElementById("printName");
  const printDate = document.getElementById("printDate");
  const printItems = document.getElementById("printItems");
  const printTotal = document.getElementById("printTotal");

  if (!printSection || !printItems) return;

  printName.textContent = name;
  printDate.textContent = date;
  printItems.innerHTML = "";
  let total = 0;

  cart.forEach(item => {
    const li = document.createElement("li");
    const lineTotal = item.quantity * item.price;
    li.textContent = `${item.quantity} × ${item.product} — RM ${lineTotal.toFixed(2)}`;
    printItems.appendChild(li);
    total += lineTotal;
  });

  printTotal.textContent = total.toFixed(2);
  printSection.style.display = "block";

  // Print then hide the print section
  requestAnimationFrame(() => {
    window.print();
    setTimeout(() => printSection.style.display = "none", 500);
  });
}

// ------------------- Validation & sending -------------------

form?.addEventListener("input", () => {
  if (previewBox) previewBox.textContent = buildMessage();
});

function validateAndSend(method) {
  if (cart.length === 0) {
    alert("Please add at least one product to the cart.");
    return;
  }
  if (!form?.checkValidity()) {
    form.reportValidity();
    return;
  }
  const message = buildMessage();
  if (method === "fb") {
    navigator.clipboard.writeText(message).then(() => {
      showToast();
      window.open(`https://m.me/zenunycats`, "_blank");
    }).catch(() => alert("Failed to copy message."));
  } else if (method === "wa") {
    window.open(`https://wa.me/601136003291?text=${encodeURIComponent(message)}`, "_blank");
  }
}

// ------------------- Authentication & gossip integration -------------------

function openLogin() {
  const loginUrl = `${API_BASE}/login?redirect=${encodeURIComponent(FRONT_BASE)}`;
  gossipPopup = window.open(loginUrl, "LoginPopup", "width=400,height=600");
  const closeCheck = setInterval(() => {
    if (gossipPopup && gossipPopup.closed) {
      clearInterval(closeCheck);
      console.log("Login popup closed by user.");
    }
  }, 500);
}

window.addEventListener("message", function (event) {
  // ensure origin matches
  let allowedOrigin;
  try { allowedOrigin = new URL(API_BASE).origin; } catch (e) { allowedOrigin = API_BASE; }

  if (event.origin !== allowedOrigin) {
    console.warn("Blocked message from untrusted origin:", event.origin);
    return;
  }

  const { type, user, token } = event.data || {};
  if (type === "LOGIN_SUCCESS") {
    if (!user || !token) {
      console.error("Login message missing user or token:", event.data);
      return;
    }
    localStorage.setItem("gossipUser", JSON.stringify(user));
    localStorage.setItem("gossipToken", token);
    console.log("User logged in:", user);
    isLoggingOut = false;
    updateLoginButton(user);
    loadCartFromDatabase();
    if (gossipPopup && !gossipPopup.closed) gossipPopup.close();
    if (window.opener) window.opener.postMessage({ type: "LOGIN_SYNC" }, "*");
  }
});

function updateLoginButton(user = null) {
  const loginBtns = document.querySelectorAll(".login");
  loginBtns.forEach((loginBtn) => {
    const parent = loginBtn.parentNode;
    const newLoginBtn = loginBtn.cloneNode(true);

    if (user) {
      const name = (user.fullName || "User").split(" ")[0];
      const wrapper = document.createElement("div");
      wrapper.style.position = "relative";
      wrapper.style.display = "inline-block";

      newLoginBtn.textContent = `👋 Hi! ${name}`;
      newLoginBtn.style.cursor = "pointer";
      newLoginBtn.style.color = isDark ? "#fff" : "#000";
      newLoginBtn.style.borderRadius = "20px";

      const dropdown = document.createElement("div");
      dropdown.className = "login-dropdown";
      dropdown.style.position = "absolute";
      dropdown.style.top = "100%";
      dropdown.style.right = "0";
      dropdown.style.background = isDark ? "#333" : "#fff";
      dropdown.style.color = isDark ? "#fff" : "#000";
      dropdown.style.border = `1px solid ${isDark ? "#555": "#ccc"}`;
      dropdown.style.borderRadius = "5px";
      dropdown.style.boxShadow = "0 2px 2px rgba(0,0,0,0.15)";
      dropdown.style.padding = "2px 0";
      dropdown.style.minWidth = "150px";
      dropdown.style.display = "none";
      dropdown.style.zIndex = "999";

      if (user.isAdmin) {
        const adminOption = document.createElement("div");
        adminOption.textContent = "Admin Dash";
        adminOption.style.padding = "8px 16px";
        adminOption.style.cursor = "pointer";
        adminOption.addEventListener("click", () => window.location.href = "./admin.html");
        dropdown.appendChild(adminOption);
      }

      const logoutOption = document.createElement("div");
      logoutOption.textContent = "Logout";
      logoutOption.style.padding = "8px 16px";
      logoutOption.style.cursor = "pointer";
      logoutOption.addEventListener("click", () => {
        dropdown.style.display = "none";
        if (!confirm("Are you sure you want to logout?")) return;
        isLoggingOut = true;
        localStorage.removeItem("gossipUser");
        localStorage.removeItem("wasLoggedInBefore");
        clearCart();
        updateCartBadge();
        cartItems.innerHTML = "";
        cartTotalDisplay.style.display = "";
        previewBox.textContent = "";
        fetch(`${API_BASE}/api/auth/logout`, {
          method: "POST",
          credentials: "include"
        }).then(res => {
          // replace with a fresh login button
          const cleanLogin = document.createElement("button");
          cleanLogin.className = "login";
          cleanLogin.textContent = "Login";
          cleanLogin.addEventListener("click", openLogin);
          parent.replaceChild(cleanLogin, parent.querySelector(".login, div") || loginBtn);
        }).catch(err => {
          console.error("Logout error:", err);
        });
      });

      dropdown.appendChild(logoutOption);

      newLoginBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
      });
      document.addEventListener("click", () => dropdown.style.display = "none");

      wrapper.appendChild(newLoginBtn);
      wrapper.appendChild(dropdown);
      parent.replaceChild(wrapper, loginBtn);
    } else {
      newLoginBtn.textContent = "Login";
      newLoginBtn.addEventListener("click", openLogin);
      parent.replaceChild(newLoginBtn, loginBtn);
    }
  });
}

function clearCart() {
  cart.length = 0;
  localStorage.removeItem(LOCAL_CART_KEY);
  if (cartItems) cartItems.innerHTML = `<p>Your cart is empty.</p>`;
  if (cartTotalDisplay) cartTotalDisplay.innerHTML = `<strong>Total: RM 0.00</strong>`;
  const subtotalEl = document.getElementById("cartSubtotal");
  if (subtotalEl) subtotalEl.textContent = "RM 0.00";
  if (previewBox) previewBox.textContent = buildMessage();
}

// Check session by asking backend
function checkAuthFromGossip() {
  if (isLoggingOut) return;
  fetch(`${API_BASE}/api/auth/check`, {
    method: "GET",
    credentials: "include"
  }).then(res => res.ok ? res.json() : null)
    .then(data => {
      if (data && data.fullName) {
        data.isAdmin = data.role === "admin";
        localStorage.setItem("wasLoggedInBefore", "true");
        localStorage.setItem("gossipUser", JSON.stringify(data));
        updateLoginButton(data);
        if (!isLoggingOut) loadCartFromDatabase();
      } else {
        localStorage.removeItem("gossipUser");
        localStorage.removeItem("wasLoggedInBefore");
        updateLoginButton(null);
        clearCart();
      }
    })
    .catch(err => {
      console.warn("Auth check failed:", err);
      updateLoginButton(null);
      clearCart();
    });
}

// ------------------- Events & initialization -------------------

window.addEventListener("storage", (event) => {
  if (!event.key) return;
  if (event.key === "gossipUser") {
    const user = event.newValue ? JSON.parse(event.newValue) : null;
    updateLoginButton(user);
    if (user) loadCartFromDatabase();
    else clearCart();
  } else if (event.key === LOCAL_CART_KEY) {
    cart = JSON.parse(event.newValue || "[]");
    updateCartDisplay();
    updateCartBadge();
    updateCartSubtotal();
  }
});

// Prevent number input wheel change & sanitize typed values
document.addEventListener("input", (e) => {
  if (e.target?.matches && e.target.matches('input[type="number"]')) {
    let val = e.target.value.replace(/\D/g, '');
    let num = parseInt(val, 10);
    if (isNaN(num) || num < minQty) num = minQty;
    if (num > maxQty) num = maxQty;
    e.target.value = num;
  }
});
document.addEventListener('wheel', (e) => {
  if (e.target?.matches && e.target.matches('input[type="number"]')) e.preventDefault();
}, { passive: false });

// DOM ready initialization
window.addEventListener("DOMContentLoaded", () => {
  setMinPickupDate();
  loadProducts();
  loadCartFromStorage();

  // small delayed auth check so cookies/sessions have time to settle
  setTimeout(checkAuthFromGossip, 500);

  // open cart on desktop by default
  const orderPanel = document.querySelector(".order");
  const cartToggleBtn = document.getElementById("cartToggle");
  if (orderPanel && cartToggleBtn) {
    if (window.innerWidth >= 768) orderPanel.classList.add("open");
    cartToggleBtn.addEventListener("click", cartToggle);
  }
});
