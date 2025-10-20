let cart = [];
const form = document.querySelector("#orderForm form");
const toast = document.getElementById("toast");
const previewBox = document.getElementById("previewBox");
const cartItems = document.getElementById("cartItems");
const cartTotalDisplay = document.getElementById("cartTotal");

const maxQty = 99;
const minQty = 1;

const grid = document.getElementById("dynamicProducts");
grid.innerHTML = "";

const isDark = document.body.classList.contains("dark")

function toggleDarkMode() {
  document.body.classList.toggle("dark");
}



function updateMinusButtons() {
  document.querySelectorAll('input[type="number"]').forEach(input => {
    const id = input.id;
    const val = parseInt(input.value, 10) || 0;
    const minusBtn = document.getElementById("minus-" + id.split("qty-")[1]);
    if (minusBtn) {
      minusBtn.disabled = val <= 0;
      minusBtn.style.opacity = val <= 0 ? "0.5" : "1";
      minusBtn.style.cursor = val <= 0 ? "not-allowed" : "pointer";

    }
  });
}




function toggleZoom(img) {
  img.classList.toggle("zoomed");
}

form.addEventListener("input", () => {
  previewBox.textContent = buildMessage();
});

function showToast(message = "Order message copied to clipboard!") {
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2000);
}

form.addEventListener("input", () => {
  previewBox.textContent = buildMessage();
});


function cartToggle() {
  const orderPanel = document.querySelector(".order");
  if (orderPanel) {
    orderPanel.classList.toggle("open");
    console.log("Cart toggled");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const orderPanel = document.querySelector(".order");
  const cartToggleBtn = document.getElementById("cartToggle");

  if (!orderPanel || !cartToggleBtn) return;

  // Initial state — show cart only on desktop
  if (window.innerWidth >= 768) {
    orderPanel.classList.add("open");
  } else {
    orderPanel.classList.remove("open");
  }

  // Cart toggle works on both desktop and mobile
  cartToggleBtn.addEventListener("click", () => {
    orderPanel.classList.toggle("open");
  });
});

function changeQuantity(id, delta) {
  const input = document.getElementById(id);
  let val = parseInt(input.value) || 0;
  val = Math.min(maxQty, Math.max(0, val + delta));
  input.value = val;
  updateMinusButtons(); // Optional if you want minus buttons to disable at 0
  updateCartDisplay()
  updateCartBadge();
  updateCartSubtotal()
  saveCartToStorage()
}

document.querySelectorAll('input[type="number"]').forEach(input => {
  input.addEventListener('wheel', e => e.preventDefault());
  input.addEventListener('keydown', e => {
    const allowedKeys = ['Backspace', 'ArrowLeft', 'ArrowRight', 'Tab', 'Delete', 'Home', 'End'];
    const isNumberKey = e.key >= '0' && e.key <= '9';
    if (!isNumberKey && !allowedKeys.includes(e.key)) e.preventDefault();
  });
  input.addEventListener('input', () => {
    let val = input.value.replace(/\D/g, '');
    let num = parseInt(val, 10);
    if (isNaN(num) || num < minQty) num = minQty;
    if (num > maxQty) num = maxQty;
    input.value = num;
  });
});

function addToCart(productName, quantity, price) {
  const qty = parseInt(quantity, 10);
  if (isNaN(qty) || qty <= 0) {
    alert("Please enter a valid quantity.");
    return;
  }

  const existingItem = cart.find(item => item.product === productName);
  if (existingItem) {
    existingItem.quantity += qty;
  } else {
    cart.push({ product: productName, quantity: qty, price: price });
  }

  updateCartDisplay();
  // document.querySelector('.order').scrollIntoView({ behavior: "smooth" });
  updateCartBadge();
  updateCartSubtotal()
  saveCartToStorage()
  syncCartWithDB()

    // 🔹 Save to DB if logged in
  const user = localStorage.getItem("gossipUser");
  if (user) {
    fetch("http://127.0.0.1:5001/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ items: cart })
    })
    .then(res => res.ok ? res.json() : Promise.reject("Failed to save cart"))
    .catch(err => console.error(err));
  }

}


function updateCartDisplay() {
  cartItems.innerHTML = "";
  let total = 0;

  cart.forEach((item, index) => {
    const li = document.createElement("li");
    
    const itemText = document.createElement("span");
    const subtotal = item.quantity * item.price;
    itemText.textContent = `🔹${item.product}\n     @ RM ${item.price.toFixed(2)} = RM ${subtotal.toFixed(2)}`;
    
    // Quantity Controls
    const qtyControl = document.createElement("div");
    qtyControl.style.display = "inline-flex";
    qtyControl.style.alignItems = "center";
    qtyControl.style.gap = "5px";
    qtyControl.style.marginLeft = "0px";
    qtyControl.style.marginRight = "0px";

    const minusBtn = document.createElement("button");
    minusBtn.className = "qtyBtn";
    minusBtn.textContent = "−";
    minusBtn.style.cursor = "pointer";
    minusBtn.style.display = "flex";
    minusBtn.style.alignItems = "center";
    minusBtn.style.justifyContent = "center";
    
    minusBtn.onclick = () => {
      if (item.quantity > 1) {
        item.quantity--;
        updateCartDisplay()
        updateCartBadge()
        updateCartSubtotal()
        saveCartToStorage()
        syncCartWithDB()


      } else {
        const confirmDelete = confirm(`Remove ${item.product} from cart?`);
        if (confirmDelete) {
          cart.splice(index, 1);
        }
      }
      updateCartDisplay();
      updateCartBadge()
      updateCartSubtotal()
      saveCartToStorage()
    };



    minusBtn.disabled = item.quantity === 0;
    minusBtn.style.opacity = item.quantity === 0 ? "0.4" : "1";

    const qtyDisplay = document.createElement("span");
    qtyDisplay.textContent = item.quantity;
    qtyDisplay.style.minWidth = "20px";
    qtyDisplay.style.textAlign = "center";

    const plusBtn = document.createElement("button");
    plusBtn.className = "qtyBtn"
    plusBtn.textContent = "+";
    plusBtn.style.cursor = "pointer";
    plusBtn.style.display = "flex";
    plusBtn.style.alignItems = "center";
    plusBtn.style.justifyContent = "center"

    plusBtn.onclick = () => {
      if (item.quantity < maxQty) {
        item.quantity++;
        updateCartDisplay();
        updateCartBadge()
        updateCartSubtotal()
        saveCartToStorage()
        syncCartWithDB()
      }
    };

    qtyControl.appendChild(minusBtn);
    qtyControl.appendChild(qtyDisplay);
    qtyControl.appendChild(plusBtn);

    // Delete button
    const delBtn = document.createElement("del-btn");
    delBtn.className = "del-btn";
    delBtn.textContent = "🗑️";
    delBtn.setAttribute("aria-label", "Remove item");
    delBtn.style.marginLeft = "40px";

    delBtn.style.marginRight = "5px";
    delBtn.style.background = "none";
    delBtn.style.border = "none";
    delBtn.style.cursor = "pointer";
    delBtn.style.color = "red";
    delBtn.onclick = () => removeFromCart(index);

    li.appendChild(itemText);
    li.appendChild(qtyControl);
    li.appendChild(delBtn);
    cartItems.appendChild(li);

    total += subtotal;
  });

  cartTotalDisplay.innerHTML = `<strong>Total: RM ${total.toFixed(2)}</strong>`;
  previewBox.textContent = buildMessage();
}


// 🔢 Update cart icon badge count
function updateCartBadge() {
  let total = 0;
  cart.forEach(item => total += parseInt(item.quantity));

  // Desktop
  const cartCountEl = document.getElementById("cartCount");
  if (cartCountEl) {
    cartCountEl.textContent = total;
    cartCountEl.style.display = total > 0 ? "inline-block" : "none";
  }

  // Mobile (optional)
  const mobileCountEl = document.getElementById("mobileCartCount");
  if (mobileCountEl) {
    mobileCountEl.textContent = total;
    mobileCountEl.style.display = total > 0 ? "inline-block" : "none";
  }
}

function updateCartSubtotal() {
  const subtotal = cart.reduce((sum, item) => {
    return sum + item.quantity * item.price;
  }, 0);

  const subtotalEl = document.getElementById("cartSubtotal");
  if (subtotalEl) {
    subtotalEl.textContent = `RM ${subtotal.toFixed(2)}`;
  }
}

function setMinPickupDate() {
  const dateInput = document.getElementById("date");
  const today = new Date();
  today.setDate(today.getDate() + 2);
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  dateInput.min = `${yyyy}-${mm}-${dd}`;
}


function buildMessage() {
  const date = document.getElementById("date").value || "Not specified";
  if (cart.length === 0) return "Your cart is empty.";

  const lines = cart.map(item =>
    `👉 ${item.quantity} × ${item.product} @ RM ${item.price.toFixed(2)} = RM ${(item.quantity * item.price).toFixed(2)}`
  );

  const total = cart.reduce((sum, item) => sum + item.quantity * item.price, 0);

  return `Hi KCSR! I'd like to place an order:\n\n🧺 Order Summary:\n${lines.join("\n")}\n\n🧾 Total: RM ${total.toFixed(2)}\n📅 Pick-up Date: ${date}`;
}


function validateAndSend(method) {
  if (cart.length === 0) {
    alert("Please add at least one product to the cart.");
    return;
  }

  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const message = buildMessage();

  if (method === "fb") {
    navigator.clipboard.writeText(message).then(() => {
      showToast();
      window.open(`https://m.me/zenunycats`, "_blank");
    }).catch(() => {
      alert("Failed to copy message.");
    });
  } else if (method === "wa") {
    window.open(`https://wa.me/601136003291?text=${encodeURIComponent(message)}`, "_blank");
  }
}





function checkAuthFromGossip() {
  console.log("Checking Gossip authentication...");

  const userData = localStorage.getItem("gossipUser");

  if (userData) {
    try {
      const user = JSON.parse(userData);
      updateLoginButton(user);
      loadCartFromDatabase();
    } catch (e) {
      console.warn("Invalid gossipUser data, clearing...");
      localStorage.removeItem("gossipUser");
      clearCart();
      updateLoginButton(null);
    }
    return; // Exit here, no need to check API if we already have a valid session
  }

  // No user in localStorage → clear cart right away
  clearCart();
  updateLoginButton(null);

  // Double-check with server in case cookie session is still valid
  fetch("http://127.0.0.1:5001/api/auth/check", {
    method: "GET",
    credentials: "include"
  })
    .then(res => res.ok ? res.json() : null)
    .then(data => {
      if (data && data.fullName) {
        localStorage.setItem("wasLoggedInBefore", "true");
        localStorage.setItem("gossipUser", JSON.stringify(data));
        updateLoginButton(data);
        loadCartFromDatabase();
      } else {
        localStorage.removeItem("gossipUser");
        clearCart();
        updateLoginButton(null);
      }
    })
    .catch(err => {
      console.warn("Failed to check gossip session:", err);
      localStorage.removeItem("gossipUser");
      clearCart();
      updateLoginButton(null);
    });
}

let gossipPopup = null;



function openLogin() {
  const loginUrl = ("http://127.0.0.1:5173/login?redirect=http://127.0.0.1:5501/");
  gossipPopup = window.open(loginUrl, "LoginPopup", "width=600, height=600");

    // Optional: handle when popup is closed manually
  const timer = setInterval(() => {
    if (gossipPopup && gossipPopup.closed) {
      clearInterval(timer);
      console.log("Popup closed by user");
      
      checkAuthFromGossip();
    }
  }, 500);

  window.addEventListener("message", function(event) {
    const allowedOrigin = "http://127.0.0.1:5173";
    if (event.origin !== allowedOrigin) return;

    const { type, user, token } = event.data;
      if (type === "LOGIN_SUCCESS") {
        localStorage.setItem("gossipUser", JSON.stringify(user));
        console.log(JSON.parse(localStorage.getItem("gossipUser")));


      if(window.opener) {
        window.opener.postMessage({ type: "LOGIN_SYNC" }, "*")

      }

      // checkLoginStatus()
      // localStorage.setItem("token", token);
      // document.querySelector(".login").textContent = `👋 Hi! ${user.fullName}`;
    }
  }, false);

}

function updateLoginButton(user = null) {
  const loginBtns = document.querySelectorAll(".login");
  loginBtns.forEach((loginBtn) => {
    const parent = loginBtn.parentNode;

    // Create a clean button clone (removes old event listeners)
    const newLoginBtn = loginBtn.cloneNode(true);

    if (user) {
      const name = user.fullName.split(" ")[0];

      // Create wrapper to hold button and dropdown
      const wrapper = document.createElement("div");
      wrapper.style.position = "relative";
      wrapper.style.display = "inline-block";

      // Update button appearance
      newLoginBtn.textContent = `👋 Hi! ${name}`;
      newLoginBtn.title = "";
      newLoginBtn.style.cursor = "pointer";
      // newLoginBtn.style.background = isDark ? "#333" : "#fff";
      newLoginBtn.style.color = isDark ? "#fff" : "#000";
      newLoginBtn.style.borderRadius = "20px";
      

      // Dropdown menu
      const dropdown = document.createElement("div");
      dropdown.className = "login-dropdown";
      dropdown.style.position = "absolute";
      dropdown.style.top = "100%";
      dropdown.style.right = "0";
      dropdown.style.background = isDark ? "#333" : "#fff";
      dropdown.style.color = "#000";
      dropdown.style.border = `1px solid ${isDark ? "#555": "#ccc"}`;
      dropdown.style.borderRadius = "5px";
      dropdown.style.boxShadow = "0 2px 2px rgba(0,0,0,0.15)";
      dropdown.style.padding = "2px 0";
      dropdown.style.minWidth = "150px";
      dropdown.style.display = "none";
      dropdown.style.zIndex = "999";

      // Dark mode toggle
      const toggleMode = document.createElement("div");
      toggleMode.textContent = "🌓 Toggle";
      toggleMode.style.padding = "8px 16px";
      toggleMode.style.cursor = "pointer";
      toggleMode.addEventListener("click", () => {
        toggleDarkMode();
        dropdown.style.display = "none";
      });

      dropdown.appendChild(toggleMode);

      // Admin link if applicable
      if (user.isAdmin) {
        const adminOption = document.createElement("div");
        adminOption.textContent = "Admin Dash";
        adminOption.style.padding = "8px 16px";
        adminOption.style.cursor = "pointer";
        adminOption.addEventListener("click", () => {
          window.location.href = "/admin.html";
        });
        dropdown.appendChild(adminOption);
      }

      // Logout
      const logoutOption = document.createElement("div");
      logoutOption.textContent = "Logout";
      logoutOption.style.padding = "8px 16px";
      logoutOption.style.cursor = "pointer";
      logoutOption.addEventListener("click", () => {
        dropdown.style.display = "none";
        if (confirm("Are you sure you want to logout?")) {
          fetch("http://127.0.0.1:5001/api/auth/logout", {
            method: "POST",
            credentials: "include",
          }).then(res => {
            if (!res.ok) throw new Error("Logout failed");

            // Clean localStorage
            localStorage.removeItem("gossipUser");
            localStorage.removeItem("wasLoggedInBefore");   
            cart.length = 0        
            clearCart()
            updateCartBadge()
            updateCartDisplay()
            updateCartSubtotal()


            // Replace the entire wrapper with a fresh login button
            const cleanLogin = document.createElement("button");
            cleanLogin.className = "login";
            cleanLogin.textContent = "Login";
            cleanLogin.addEventListener("click", openLogin);

            wrapper.replaceWith(cleanLogin);
          }).catch(err => {
            alert("Logout failed.");
            console.error(err);
          });
        }
      });

      dropdown.appendChild(logoutOption);

      // Toggle dropdown
      newLoginBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
      });

      document.addEventListener("click", () => {
        dropdown.style.display = "none";
      });

      wrapper.appendChild(newLoginBtn);
      wrapper.appendChild(dropdown);
      parent.replaceChild(wrapper, loginBtn);
    } else {
      // Not logged in: create fresh login button
      newLoginBtn.textContent = "Login";
      newLoginBtn.addEventListener("click", openLogin);
      parent.replaceChild(newLoginBtn, loginBtn);
    }
  });
}


window.addEventListener("focus", () => {
  checkAuthFromGossip();
});


window.addEventListener("storage", (event) => {
  if (event.key === "gossipUser") {
    checkAuthFromGossip(); // re-check login across tabs
  } else if (event.key === "cart") {
    cart = JSON.parse(event.newValue || "[]");
    updateCartDisplay();     // Re-render cart items
    updateCartBadge();       // Update badge number
    updateCartSubtotal();    // Optional: update cart subtotal in header
  }
});

// 👇 Add this below to refresh login button when user switches back to tab
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    checkAuthFromGossip();
  }
});


document.addEventListener("DOMContentLoaded", () => {
  loadCartFromDatabase()
  loadProducts();
  checkAuthFromGossip();
});

// Page load
window.addEventListener("DOMContentLoaded", () => {
  setMinPickupDate();
  updateMinusButtons();
//   clearCart()

  setTimeout(() => {
    checkAuthFromGossip()
  }, 100)
  ; // now also checks with gossip backend
});
