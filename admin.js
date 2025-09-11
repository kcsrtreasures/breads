const addForm = document.getElementById("addProductForm");
const preview = document.getElementById("productGrid");

let productList = JSON.parse(localStorage.getItem("products")) || [];
let editIndex = -1;


// Render all products
function renderProducts() {
  preview.innerHTML = "";
  productList.forEach((product, index) => {
    const div = document.createElement("div");
    div.className = "product-card";

    div.innerHTML = `
      <div class="product-thumb">
        <img src="${product.image}" alt="${product.name}" />
      </div>
      <div class="product-details">
        <div class="title-price">
          <strong>${product.name}</strong>
          <small>${product.description || ""}</small>
          <span>RM ${parseFloat(product.price).toFixed(2)}</span>


      <div class="product-actions">
        <button onclick="editProduct(${index})">✏️ Edit</button>
        <button onclick="deleteProduct(${index})">🗑️</button>
      </div>
          </div>
            </div>
    `;


    preview.appendChild(div);
  });
}

// Add product
addForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const name = document.getElementById("productName").value.trim();
  const price = parseFloat(document.getElementById("productPrice").value);
  const imageFile = document.getElementById("productImage").files[0];
  const description = document.getElementById("productDescription").value.trim();

  if (!name || !price || (editIndex === -1 && !imageFile)) {
    alert("Please fill in all required fields.");
    return;
  }


  const handleSave = (base64Image) => {
    const newProduct = {
      name,
      price,
      image: base64Image || productList[editIndex].image,
      description,
    };

    if (editIndex === -1) {
      productList.push(newProduct);
    } else {
      productList[editIndex] = newProduct;
      document.querySelector("button[type=submit]").textContent = "Add Product"
      editIndex = -1;
    }

    localStorage.setItem("products", JSON.stringify(productList));
    renderProducts();
    addForm.reset();
    document.getElementById("productImage").value = "";
  };

  if (imageFile) {
    const reader = new FileReader();
    reader.onload = function () {
      handleSave(reader.result);
    };
    reader.readAsDataURL(imageFile);
  } else {
    handleSave();
  }
});


// Edit product
function editProduct(index) {
  const product = productList[index];
  document.getElementById("productName").value = product.name;
  document.getElementById("productPrice").value = product.price;
  document.getElementById("productDescription").value = product.description || "";
  document.getElementById("productImage").value = ""; // File input can't be prefilled
  editIndex = index;
  window.scrollTo({ top: 0, behavior: "smooth" });
  document.querySelector("button[type=submit]").textContent = "Update Product"
}

// Delete product
function deleteProduct(index) {
  if (!confirm(`Are you sure you want to delete "${productList[index].name}"?`)) return;
  productList.splice(index, 1);
  localStorage.setItem("products", JSON.stringify(productList));
  renderProducts();
}

// Initial render
renderProducts();
