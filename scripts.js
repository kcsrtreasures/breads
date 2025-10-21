// const cart = [];
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

const API_BASE = "https://gossip-uye2.onrender.com";

const FRONT_BASE = window.location.origin

// document.getElementById("cartToggle").addEventListener("click", cartToggle);

function syncCartWithDB() {
  const user = localStorage.getItem("gossipUser");
  if (user) {
    fetch(`${API_BASE}/api/cart`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ items: cart })
    })
    .then(res => res.ok ? res.json() : Promise.reject("Failed to save cart"))
    .catch(err => console.error("Cart sync error:", err));
  }
}


// Load saved cart from localStorage (if any)
function loadCartFromStorage() {
  const storedCart = localStorage.getItem("cartData");
  if (storedCart) {
    try {
      cart = JSON.parse(storedCart);
      updateCartDisplay();
      updateCartBadge();
      updateCartSubtotal() // your existing method to refresh cart UI
    } catch (e) {
      // console.error("Error parsing stored cart:", e);
    }
  }
}

// Save current cart to localStorage
function saveCartToStorage() {
  const user = localStorage.getItem("gossipUser");
  if (user) {
    localStorage.setItem("cartData", JSON.stringify(cart));
  }
}

function clearCart() {
  // console.log("clearCart called, clearing cart UI");

  // 1. Clear the cart array data
  cart.length = 0;

  // 2. Remove from localStorage
  localStorage.removeItem("cart");

  // 3. Clear the cart items container (empty, no text so UI stays consistent)
  if (cartItems) {
    cartItems.innerHTML = `<p>Your cart is empty.</p>`;  // empty but ready for new items
  }

  // 4. Reset total display
  if (cartTotalDisplay) {
    cartTotalDisplay.innerHTML = `<strong>Total: RM </strong>`;
  }


  // 5. Update the badge count to hide it
  updateCartBadge();

    // Reset subtotal display
  const subtotalEl = document.getElementById("cartSubtotal");
  if (subtotalEl) {
    subtotalEl.textContent = "RM 0.00";
  }

  // setMinPickupDate()

  // const dateInput = document.getElementById("date");
  // if (dateInput) {
  //   dateInput.value = "";
  // }

  // 6. Clear preview box or any other cart summary if you have one
  if (previewBox) {
    previewBox.textContent = "";
  }
}




async function loadCartFromDatabase() {
  // console.log("loadCartFromDatabase")
  // console.trace()
  try {
    const res = await fetch(`${API_BASE}/api/cart`, {
      method: "GET",
      credentials: "include" // so cookies/session tokens are sent
    });

    if (!res.ok) throw new Error("Failed to load cart");
    const items = await res.json();
    // console.log("Loaded cart from DB:", items);
    

    cart.length = 0; // clear local cart

      cart.push(...items); // load from DB

    updateCartBadge();
    updateCartDisplay();
    updateCartSubtotal()
  } catch (err) {
    // console.error("Error loading cart:", err);
  }
}

function saveCartToDatabase() {
  console.log("Sending cart to server:", cart);
  
  fetch((`${API_BASE}/api/cart` || "/api/cart"), {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items: cart })
  })
  .then(res => res.json())
  .then(data => console.log("Server response:", data))
  .catch(err => {
    console.error("Error saving cart to DB:", err);
  });
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


function cartToggle() {
  const orderPanel = document.querySelector(".order");
  if (orderPanel) {
    orderPanel.classList.toggle("open");
    // console.log("Cart toggled");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const orderPanel = document.querySelector(".order");
  const cartToggleBtn = document.getElementById("cartToggle");

  if (orderPanel && cartToggleBtn) {
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
  }

  // 🔑 Run this immediately on load
  checkAuthFromGossip();
});

// 👇 Refresh login state when user comes back to tab
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    checkAuthFromGossip();
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");
  const userData = params.get("user");

  if (token && userData) {
    localStorage.setItem("gossipToken", token);
    localStorage.setItem("gossipUser", userData);
    history.replaceState({}, document.title, window.location.pathname); // clean URL
    location.reload(); // refresh to update UI
  }
});



window.addEventListener("focus", () => {
  // checkAuthFromGossip();
});


window.addEventListener("storage", (event) => {
  if (event.key === "gossipUser") {
    // re-check login across tabs
  } else if (event.key === "cart") {
    cart = JSON.parse(event.newValue || "[]");
    updateCartDisplay();     // Re-render cart items
    updateCartBadge();       // Update badge number
    updateCartSubtotal();    // Optional: update cart subtotal in header
  }
});



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

function toggleZoom(img) {
  img.classList.toggle("zoomed");
}

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


function addToCart(productName, quantity, price) {
  const qty = parseInt(quantity, 10);
  if (isNaN(qty) || qty <= 0) {
    alert("Please enter a valid quantity.");
    return;
  }

  const existingItem = cart.find(item => item.product === productName);
  if (existingItem) {
    existingItem.quantity += qty;
    showToast(`Updated quantity`)
  } else {
    cart.push({ product: productName, quantity: qty, price: price });
    showToast(`Added to cart!`)
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
    fetch(`${API_BASE}/api/cart`, "", {
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
    const delBtn = document.createElement("button");
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


function removeFromCart(index) {
  cart.splice(index, 1);
  updateCartDisplay();
  updateCartBadge()
  updateCartSubtotal()
  saveCartToStorage()
  syncCartWithDB()
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


form.addEventListener("input", () => {
  previewBox.textContent = buildMessage();
});

function showToast(message = "Order message copied to clipboard!") {
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2000);
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
    const encoded = encodeURIComponent(message);
    window.open(
      `https://m.me/kcsrtreasureslimited?text=${encoded}`,
      "_blank",
      "noopener"
    );

    
  } else if (method === "wa") {
    window.open(`https://wa.me/601136003291?text=${encodeURIComponent(message)}`, "_blank");
  }
}

function toggleDarkMode() {
  document.body.classList.toggle("dark");
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

function printOrderSummary() {
  if (cart.length === 0) {
    alert("Cart is empty.");
    return;
  }

  const name = document.getElementById("name")?.value || "Customer";
  const date = document.getElementById("date").value;
  const printSection = document.getElementById("printSection");
  const printName = document.getElementById("printName");
  const printDate = document.getElementById("printDate");
  const printItems = document.getElementById("printItems");
  const printTotal = document.getElementById("printTotal");

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

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      window.print();
      setTimeout(() => {
        printSection.style.display = "none";
      }, 500);
    }, 1000);
  });
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

let gossipPopup = null;
let isLoggingOut = false; // to prevent conflicts

// function openLogin() {
//   const loginUrl = `${API_BASE}/?redirect=${encodeURIComponent(FRONT_BASE)}`;
//   gossipPopup = window.open(loginUrl, "LoginPopup", "width=400,height=600");

//   // Track popup close — only for debugging / cleanup
//   const closeCheck = setInterval(() => {
//     if (gossipPopup && gossipPopup.closed) {
//       clearInterval(closeCheck);
//       console.log("Login popup closed by user.");
//       // We don’t trigger login here — LOGIN_SUCCESS will handle it
//     }
//   }, 500);
// }

function openLogin() {
  const loginUrl = `${API_BASE}/?redirect=${encodeURIComponent(FRONT_BASE)}`;

  const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);

  if (isMobile) {
    // Mobile: open in same tab for reliability
    window.location.href = loginUrl;
  } else {
    // Desktop: open in popup
    gossipPopup = window.open(loginUrl, "LoginPopup", "width=400,height=600");

    // Track popup close (optional)
    const closeCheck = setInterval(() => {
      if (gossipPopup && gossipPopup.closed) {
        clearInterval(closeCheck);
        console.log("Login popup closed by user.");
      }
    }, 500);
  }
}


// Listen globally for login messages
window.addEventListener("message", function (event) {
  const allowedOrigin = API_BASE; // must match Gossip backend origin exactly (no trailing slash)

  if (event.origin !== allowedOrigin) {
    console.warn("Blocked message from untrusted origin:", event.origin);
    return;
  }

  const { type, user, token } = event.data;

  if (type === "LOGIN_SUCCESS") {
    if (!user || !token) {
      console.error("Login message missing user or token:", event.data);
      return;
    }

    // Save user + token in localStorage
    localStorage.setItem("gossipUser", JSON.stringify(user));
    localStorage.setItem("gossipToken", token);

    console.log("User logged in:", user);

    isLoggingOut = false;

    // Update UI
    updateLoginButton(user);

    // Load cart after login (optional)
    if (typeof loadCartFromDatabase === "function") {
      loadCartFromDatabase();
    }

    // If login came from popup, close it
    if (gossipPopup && !gossipPopup.closed) {
      gossipPopup.close();
    }

    // If this is inside a popup, sync with parent
    if (window.opener) {
      window.opener.postMessage({ type: "LOGIN_SYNC" }, "*");
    }
  }
});



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
      // const toggleMode = document.createElement("div");
      // toggleMode.textContent = "🌓 Toggle";
      // toggleMode.style.padding = "8px 16px";
      // toggleMode.style.cursor = "pointer";
      // toggleMode.addEventListener("click", () => {
      //   toggleDarkMode();
      //   dropdown.style.display = "none";
      // });

      // dropdown.appendChild(toggleMode);

      // Admin link if applicable
      if (user.isAdmin) {
        const adminOption = document.createElement("div");
        adminOption.textContent = "Admin Dash";
        adminOption.style.padding = "8px 16px";
        adminOption.style.cursor = "pointer";
        adminOption.addEventListener("click", () => {
          window.location.href = "./admin.html";
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
              isLoggingOut = true;

              localStorage.removeItem("gossipUser");
              localStorage.removeItem("wasLoggedInBefore");
              clearCart(); // ✅ Instantly clear the cart UI here

              updateCartBadge()
              cartItems.innerHTML = ""; // hide cart container immediately
              cartTotalDisplay.style.display = "";
              previewBox.textContent = "";

              


              fetch(`${API_BASE}/api/auth/logout`, {
                  method: "POST",
                  credentials: "include",
              }).then(res => {
                  if (!res.ok) throw new Error("Logout failed");
                  const cleanLogin = document.createElement("button");
                  cleanLogin.className = "login";
                  cleanLogin.innerHTML = `
  <img src="Bigger logo.png" alt="Gossip Logo" style="height: 22px; vertical-align: middle; margin-right: 6px;">
  Login via Gossip
`;

                  // cleanLogin.textContent = "Login via Gossip";
                  cleanLogin.addEventListener("click", openLogin);
                  wrapper.replaceWith(cleanLogin);
              }).catch(console.error);
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
      newLoginBtn.innerHTML = '<img src="Bigger logo.png" alt="Login via Gossip" style="height: 24px; vertical-align: middle;">';

      // newLoginBtn.textContent = "Login via Gossip";
      newLoginBtn.addEventListener("click", openLogin);
      parent.replaceChild(newLoginBtn, loginBtn);
    }
  });
}

// function updateLoginButton(user = null) {
//   const loginBtns = document.querySelectorAll(".login");

//   loginBtns.forEach((loginBtn) => {
//     const parent = loginBtn.parentNode;
//     const newLoginBtn = loginBtn.cloneNode(true); // fresh copy (no old listeners)

//     if (user) {
//       const name = user.fullName?.split(" ")[0] || "User";

//       // Wrapper to hold button and dropdown
//       const wrapper = document.createElement("div");
//       wrapper.style.position = "relative";
//       wrapper.style.display = "inline-block";

//       // Update button for logged-in state
//       newLoginBtn.textContent = `👋 Hi! ${name}`;
//       newLoginBtn.style.cursor = "pointer";
//       newLoginBtn.style.borderRadius = "20px";
//       newLoginBtn.style.color = isDark ? "#fff" : "#000";

//       // Dropdown menu
//       const dropdown = document.createElement("div");
//       dropdown.className = "login-dropdown";
//       dropdown.style.position = "absolute";
//       dropdown.style.top = "100%";
//       dropdown.style.right = "0";
//       dropdown.style.background = isDark ? "#333" : "#fff";
//       dropdown.style.border = `1px solid ${isDark ? "#555" : "#ccc"}`;
//       dropdown.style.borderRadius = "5px";
//       dropdown.style.boxShadow = "0 2px 2px rgba(0,0,0,0.15)";
//       dropdown.style.padding = "2px 0";
//       dropdown.style.minWidth = "150px";
//       dropdown.style.display = "none";
//       dropdown.style.zIndex = "999";

//       // Admin option
//       if (user.isAdmin) {
//         const adminOption = document.createElement("div");
//         adminOption.textContent = "Admin Dash";
//         adminOption.style.padding = "8px 16px";
//         adminOption.style.cursor = "pointer";
//         adminOption.addEventListener("click", () => {
//           window.location.href = "./admin.html";
//         });
//         dropdown.appendChild(adminOption);
//       }

//       // Logout option
//       const logoutOption = document.createElement("div");
//       logoutOption.textContent = "Logout";
//       logoutOption.style.padding = "8px 16px";
//       logoutOption.style.cursor = "pointer";
//       logoutOption.addEventListener("click", () => {
//         dropdown.style.display = "none";
//         if (confirm("Are you sure you want to logout?")) {
//           isLoggingOut = true;

//           localStorage.removeItem("gossipUser");
//           localStorage.removeItem("wasLoggedInBefore");
//           clearCart();
//           updateCartBadge();
//           cartItems.innerHTML = "";
//           cartTotalDisplay.style.display = "";
//           previewBox.textContent = "";

//           fetch(`${API_BASE}/api/auth/logout`, {
//             method: "POST",
//             credentials: "include",
//           })
//             .then((res) => {
//               if (!res.ok) throw new Error("Logout failed");
//               const cleanLogin = document.createElement("button");
//               cleanLogin.className = "login";
//               cleanLogin.textContent = "Login";
//               cleanLogin.addEventListener("click", openLogin);
//               wrapper.replaceWith(cleanLogin);
//             })
//             .catch(console.error);
//         }
//       });

//       dropdown.appendChild(logoutOption);

//       // Toggle dropdown visibility
//       newLoginBtn.addEventListener("click", (e) => {
//         e.stopPropagation();
//         dropdown.style.display =
//           dropdown.style.display === "block" ? "none" : "block";
//       });

//       document.addEventListener("click", () => {
//         dropdown.style.display = "none";
//       });

//       wrapper.appendChild(newLoginBtn);
//       wrapper.appendChild(dropdown);
//       parent.replaceChild(wrapper, loginBtn);
//     } else {
//       // Not logged in
//       newLoginBtn.textContent = "Login";
//       newLoginBtn.addEventListener("click", async (e) => {
//         e.preventDefault();
//         if (newLoginBtn.disabled) return; // Prevent spam clicks

//         // Show spinner + text
//         newLoginBtn.disabled = true;
//         const originalHTML = newLoginBtn.innerHTML;
//         newLoginBtn.innerHTML = `
//           <span class="spinner"></span> Logging in...
//         `;

//         try {
//           await openLogin(); // your existing Gossip login function
//         } catch (err) {
//           console.error("Login failed:", err);
//           alert("Login failed. Please try again.");
//         } finally {
//           // Restore button
//           newLoginBtn.disabled = false;
//           newLoginBtn.innerHTML = originalHTML;
//         }
//       });

//       parent.replaceChild(newLoginBtn, loginBtn);
//     }
//   });
// }



function checkAuthFromGossip() {
  if (isLoggingOut) {
    // console.log("Skipping auth check because we are logging out");
    return;
  }

  // Always verify with backend before trusting localStorage
  fetch(`${API_BASE}/api/auth/check`, {
    method: "GET",
    credentials: "include"
  })
    .then(res => res.ok ? res.json() : null)
    .then(data => {
      if (data && data.fullName) {
        // Logged in — save user and show cart
        // normalize: always ensure isAdmin is available
        data.isAdmin = data.role === "admin";

        localStorage.setItem("wasLoggedInBefore", "true");
        localStorage.setItem("gossipUser", JSON.stringify(data));
        updateLoginButton(data);
        if (!isLoggingOut){
          loadCartFromDatabase();
        }
      } else {
        // Not logged in — clear stored user and cart
        localStorage.removeItem("gossipUser");
        localStorage.removeItem("wasLoggedInBefore");
        updateLoginButton(null);
        clearCart();
      }
    })
    .catch(err => {
      // console.warn("Failed to check gossip session:", err);
      updateLoginButton(null);
      clearCart();
    });
}




function loadProducts() {
  const grid = document.getElementById("dynamicProducts");
  if (!grid) return;

  const products = JSON.parse(localStorage.getItem("products")) || [];

  // if (products.length === 0) {
  //   grid.innerHTML = "<p>No additional breads yet. Check back later!</p>";
  //   return;
  // }

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
        <input type="number" id="qty-dyn-${index}" min="1" max="99" value="0" step="1" />
        <button type="button" onclick="changeQuantity('qty-dyn-${index}', 1)">+</button>
      </div>

      <button type="button" onclick="addToCart('${product.name}', document.getElementById('qty-dyn-${index}').value, ${product.price})">Add to Cart</button>
    `;
    grid.appendChild(card);
  });
}

window.addEventListener("DOMContentLoaded", () => {
  // UI setup
  setMinPickupDate();
  updateMinusButtons();

  // Data load
  loadProducts();
  loadCartFromDatabase();

  // Auth check — skip if we're in the middle of logging out
  if (!isLoggingOut) {
    // Give the DOM a moment before checking auth (some UI might depend on it)
    authCheckInterval = setInterval(
    setTimeout(() => {
      checkAuthFromGossip();
    }), 5000);

    if (authCheckInterval) clearInterval(authCheckInterval)
  }
});

window.addEventListener("storage", (event) => {
  if (event.key === "gossipUser") {
    const user = event.newValue ? JSON.parse(event.newValue) : null;
    updateLoginButton(user); // updates UI for login or logout
  }
});






// ❌