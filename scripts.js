const cart = [];
const form = document.querySelector("#orderForm form");
const toast = document.getElementById("toast");
const previewBox = document.getElementById("previewBox");
const cartItems = document.getElementById("cartItems");
const cartTotalDisplay = document.getElementById("cartTotal");

const maxQty = 99;
const minQty = 1;

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
  } else {
    cart.push({ product: productName, quantity: qty, price: price });
  }

  updateCartDisplay();
  // document.querySelector('.order').scrollIntoView({ behavior: "smooth" });
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

    const minusBtn = document.createElement("qtyBtn");
    minusBtn.textContent = "−";
    minusBtn.style.cursor = "pointer";
    minusBtn.style.display = "flex";
    minusBtn.style.alignItems = "center";
    minusBtn.style.justifyContent = "center";
    
    minusBtn.onclick = () => {
      if (item.quantity > 1) {
        item.quantity--;
      } else {
        const confirmDelete = confirm(`Remove ${item.product} from cart?`);
        if (confirmDelete) {
          cart.splice(index, 1);
        }
      }
      updateCartDisplay();
    };



    minusBtn.disabled = item.quantity === 0;
    minusBtn.style.opacity = item.quantity === 0 ? "0.4" : "1";

    const qtyDisplay = document.createElement("span");
    qtyDisplay.textContent = item.quantity;
    qtyDisplay.style.minWidth = "20px";
    qtyDisplay.style.textAlign = "center";

    const plusBtn = document.createElement("qtyBtn");
    plusBtn.textContent = "+";
    plusBtn.style.cursor = "pointer";
    plusBtn.style.display = "flex";
    plusBtn.style.alignItems = "center";
    plusBtn.style.justifyContent = "center"

    plusBtn.onclick = () => {
      if (item.quantity < maxQty) {
        item.quantity++;
        updateCartDisplay();
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


function removeFromCart(index) {
  cart.splice(index, 1);
  updateCartDisplay();
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


window.addEventListener("DOMContentLoaded", () => {
  setMinPickupDate();
  updateMinusButtons(); // <- this ensures buttons reflect 0 state
});

// ❌