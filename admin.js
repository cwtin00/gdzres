const auth = firebase.auth();
const database = window.gdzDatabase;
const menuRef = database.ref("menu");
let adminMenu = [];
let selectedCategoryId = "";

const $ = id => document.getElementById(id);
const loginScreen = $("loginScreen");
const dashboard = $("dashboard");
const products = $("products");
const categorySelectAdmin = $("categorySelect");

function asArray(value) {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== "object") return [];
  return Object.keys(value).sort((a, b) => Number(a) - Number(b)).map(key => value[key]);
}

function normalizeMenu(value) {
  const menu = asArray(value).map(category => {
    if (category.groups) {
      category.groups = asArray(category.groups).map((group, index) => ({
        ...group,
        title: group.title || group.name || `Alt Grup ${index + 1}`,
        items: asArray(group.items)
      }));
    } else {
      category.items = asArray(category.items);
    }
    return category;
  });
  const drinks = menu.find(category => category.id === "icecekler");
  if (drinks && !drinks.groups) {
    const regularIndex = drinks.items.findIndex(item => item.name === "Red Bull");
    const largeIndex = drinks.items.findIndex(item => item.name === "Red Bull Büyük");
    if (regularIndex > -1 && largeIndex > -1 && largeIndex !== regularIndex + 1) {
      const [large] = drinks.items.splice(largeIndex, 1);
      const currentRegularIndex = drinks.items.findIndex(item => item.name === "Red Bull");
      drinks.items.splice(currentRegularIndex + 1, 0, large);
    }
  }
  const main = menu.find(category => category.id === "ana-yemekler");
  if (main) main.title = "Ana Yemek";
  const raki = menu.find(category => category.id === "rakilar");
  if (raki && raki.groups) {
    const index = raki.groups.findIndex(group => group.title === "İstanbul");
    if (index > -1) {
      const group = raki.groups.splice(index, 1)[0];
      group.items = asArray(group.items).map(item => ({...item, description: String(item.description || "").replace("İstanbul Rakı", "İstanbul Blue Vodka")}));
      let vodka = menu.find(category => category.id === "votkalar");
      if (!vodka) {
        vodka = {id:"votkalar", title:"Votkalar", image:"image/gin.webp", groups:[]};
        menu.splice(menu.indexOf(raki) + 1, 0, vodka);
      }
      if (!vodka.groups.some(item => item.title === "İstanbul Blue")) vodka.groups.push({...group, title:"İstanbul Blue"});
    }
  }
  return menu;
}

// Sitede kodla eklenmiş yeni ürün gruplarını mevcut Firebase menüsüne de ekler.
// Mevcut Firebase ürünlerini/fiyatlarını değiştirmez; yalnızca eksik grup veya ürünleri tamamlar.
function ensureRequiredGroups(menu) {
  const initial = window.GDZ_INITIAL_MENU || [];
  const required = {
    rakilar: ["Yeni Rakı Yeni Seri", "Sarı Zeybek 3 Meşe"],
    viskiler: ["Scotch Blue"]
  };

  Object.entries(required).forEach(([categoryId, groupTitles]) => {
    const targetCategory = menu.find(category => category.id === categoryId);
    const sourceCategory = initial.find(category => category.id === categoryId);
    if (!targetCategory || !sourceCategory) return;

    targetCategory.groups = asArray(targetCategory.groups);
    const sourceGroups = asArray(sourceCategory.groups);

    groupTitles.forEach(title => {
      const sourceGroup = sourceGroups.find(group => group.title === title);
      if (!sourceGroup) return;
      let existing = targetCategory.groups.find(group => group.title === title);
      if (!existing) {
        targetCategory.groups.push(JSON.parse(JSON.stringify(sourceGroup)));
        return;
      }
      existing.items = asArray(existing.items);
      asArray(sourceGroup.items).forEach(sourceItem => {
        if (!existing.items.some(item => item.name === sourceItem.name)) {
          existing.items.push(JSON.parse(JSON.stringify(sourceItem)));
        }
      });
    });
  });
  return menu;
}

function applyRequestedMenuUpdate(menu) {
  if (menu[0] && menu[0].priceRevision === "2026-09-21") return menu;
  const updates = {
    "ana-yemekler": [
      ["Karışık Izgara","₺1.000"],["Pirzola","₺900"],["Antrikot","₺1.000"],["Köfte","₺600"],["Kanat","₺500"],["Saç Kavurma","₺650"],
      ["Sucuk","₺500","Izgarada pişirilen dana sucuk, sıcak servis edilir."],["Tavuk Pirzola","₺500","Özel baharatlarla marine edilen tavuk pirzola, ızgarada pişirilerek servis edilir."]
    ],
    "mezeler": [["Yoğurtlu Köz Patlıcan","₺150"],["Tereyağlı Patlıcan","₺150"],["Semizotlu Yoğurt","₺150"],["Kırmızı Biber","₺150"],["Çiğ Köfte","₺150"],["Köz Biber Patlıcan Salatası","₺150"],["Havuç Tarator","₺150"],["Kuru Cacık","₺150"],["Haydari","₺150"],["Acılı Atom","₺150"],["Zeytin","₺150"],["Acılı Ezme","₺150"],["Rus Salatası","₺150"],["Barbunya","₺150"],["Ezine Peyniri","₺150"],["Şakşuka","₺150"]],
    "makarnalar": [["Mantarlı Kremalı Makarna","₺400"],["Tavuklu Körili Penne","₺400"],["Fırında Kaşarlı Makarna","₺400"],["Spaghetti","₺300"]],
    "atistirmaliklar": [["Karışık Çerez","₺250"],["Tuzlu Fıstık","₺200"],["Tuzlu Leblebi","₺100"],["Çikolata Jelibon","₺250"],["Popcorn","₺100"],["Doritos & Ruffles","₺200"]],
    "icecekler": [["Red Bull","₺200"],["Red Bull Büyük","₺250","Büyük boy enerji içeceği."],["Coca-Cola","₺100"],["Fanta","₺100"],["Ayran","₺50"],["Sade Soda","₺30"],["1 Litre Acılı Şalgam","₺200"],["1 Litre Tatlı Şalgam","₺200"],["Bardak Şalgam","₺60"],["Elma Suyu","₺200"],["Vişne Suyu","₺100"],["1,5 L Su","₺100"],["Çay","₺20"],["Nescafe","₺100"],["Türk Kahvesi","₺100"]],
    "salatalar": [["Kaşık Salata","₺250"],["Gavurdağı Salata","₺250"],["Roka Salata","₺250"],["Yeşil Salata","₺250"],["Çoban Salatası","₺250"],["Ton Balıklı Salata","₺250"],["Domates Salatalık Söğüş","₺100"],["Salatalık Turşusu","₺150"],["Salatalık Havuç","₺150"]],
    "meyve-tabagi": [["Meyve Tabağı","₺300"]],
    "aperatifler": [["Bira Tabağı","₺400"],["Patates Kızartması","₺300"]],
    "ara-sicaklar": [["Kaşarlı Mantar","₺250"],["Tereyağlı Mantar","₺200"],["Yaprak Ciğer","₺450"]]
  };
  const aliases = {"Acılı Atom":["Atom"],"Çikolata Jelibon":["Çikolata & Jelibon"],"Doritos & Ruffles":["Ruffles & Doritos"],"Çoban Salatası":["Çoban Salata"],"Domates Salatalık Söğüş":["Domates & Salatalık Söğüş"],"Salatalık Havuç":["Salatalık & Havuç"]};
  Object.entries(updates).forEach(([categoryId, rows]) => {
    const category = menu.find(item => item.id === categoryId);
    if (!category || category.groups) return;
    category.items = asArray(category.items);
    rows.forEach(([name, price, description]) => {
      const accepted = [name, ...(aliases[name] || [])];
      let item = category.items.find(product => accepted.includes(product.name));
      if (!item) { item = {name, description: description || `${name}.`, price, visible:true}; category.items.push(item); }
      item.name = name; item.price = price;
      if (description && !item.description) item.description = description;
    });
  });
  if (menu[0]) menu[0].priceRevision = "2026-09-21";
  return menu;
}

function applyBeerMenuUpdate(menu) {
  if (menu[0] && menu[0].beerRevision === "2026-09-21-v1") return menu;
  const category = menu.find(item => item.id === "biralar");
  if (category) category.items = [
    {name:"Efes Lager Malt", description:"Soğuk servis edilen Efes Lager Malt bira.", price:"₺150", visible:true},
    {name:"Efes Lager Pilsen", description:"Soğuk servis edilen Efes Lager Pilsen bira.", price:"₺150", visible:true},
    {name:"Belfast", description:"Soğuk servis edilen Belfast bira.", price:"₺150", visible:true},
    {name:"Efes Lager Green", description:"Soğuk servis edilen Efes Lager Green bira.", price:"₺150", visible:true},
    {name:"Beck's", description:"Soğuk servis edilen Beck's bira.", price:"₺200", visible:true},
    {name:"Bud", description:"Soğuk servis edilen Bud bira.", price:"₺200", visible:true},
    {name:"Bomonti Filtresiz", description:"Soğuk servis edilen Bomonti Filtresiz bira.", price:"₺200", visible:true},
    {name:"Stella Artois", description:"Soğuk servis edilen Stella Artois bira.", price:"₺250", visible:true},
    {name:"Corona Cerveza", description:"Soğuk servis edilen Corona Cerveza bira.", price:"₺250", visible:true},
    {name:"Miller Genuine Draft", description:"Soğuk servis edilen Miller Genuine Draft bira.", price:"₺250", visible:true}
  ];
  if (menu[0]) menu[0].beerRevision = "2026-09-21-v1";
  return menu;
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>'"]/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[char]));
}

function slugify(value) {
  return value.toLocaleLowerCase("tr-TR").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ı/g,"i").replace(/ğ/g,"g").replace(/ü/g,"u").replace(/ş/g,"s").replace(/ö/g,"o").replace(/ç/g,"c").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"") || `kategori-${Date.now()}`;
}

function toast(message) {
  $("toast").textContent = message;
  $("toast").classList.add("show");
  setTimeout(() => $("toast").classList.remove("show"), 2200);
}

function productTotal() {
  return adminMenu.reduce((total, category) => total + (category.groups ? category.groups.reduce((sum, group) => sum + group.items.length, 0) : (category.items || []).length), 0);
}

function currentCategory() {
  return adminMenu.find(category => category.id === selectedCategoryId);
}

async function saveMenu(message = "Değişiklik kaydedildi") {
  try {
    await menuRef.set(adminMenu);
    toast(message);
    return true;
  } catch (error) {
    console.error("Firebase kayıt hatası:", error);
    const text = error && error.code === "PERMISSION_DENIED"
      ? "Kayıt izni yok. Firebase Rules bölümünü kontrol edin."
      : "Kayıt yapılamadı. İnternet bağlantısını kontrol edin.";
    toast(text);
    return false;
  }
}

function renderDashboard() {
  if (!adminMenu.length) return;
  if (!adminMenu.some(category => category.id === selectedCategoryId)) selectedCategoryId = adminMenu[0].id;
  $("categoryCount").textContent = adminMenu.length;
  $("productCount").textContent = productTotal();
  categorySelectAdmin.innerHTML = adminMenu.map((category, index) => `<option value="${escapeHtml(category.id)}">${String(index + 1).padStart(2,"0")} — ${escapeHtml(category.title)}</option>`).join("");
  categorySelectAdmin.value = selectedCategoryId;
  renderCategory();
}

function productCard(item, index, groupIndex = null) {
  const path = groupIndex === null ? `${index}` : `${groupIndex}:${index}`;
  const safeName = escapeHtml(item.name || "");
  const safeDescription = escapeHtml(item.description || "");
  const safeCalories = escapeHtml(item.calories || "");
  const safePrice = escapeHtml(item.price || "");
  const safeImage = escapeHtml(item.image || "");
  return `<div class="product-card" data-path="${path}">
    <div class="product-card-top">
      <span class="number">${String(index + 1).padStart(2,"0")}</span>
      <label class="product-name-wrap"><span class="field-label">ÜRÜN ADI</span><input class="name" value="${safeName}" aria-label="Ürün adı"></label>
    </div>
    <div class="product-main-fields">
      <label class="product-field"><span class="field-label">AÇIKLAMA</span><textarea class="desc" rows="2" aria-label="Açıklama">${safeDescription}</textarea></label>
      <label class="product-field"><span class="field-label">FİYAT</span><input class="price" value="${safePrice}" aria-label="Fiyat"></label>
      <label class="product-field"><span class="field-label">KALORİ</span><input class="calories" value="${safeCalories}" aria-label="Kalori"></label>
    </div>
    <label class="product-image-field"><span class="field-label">FOTOĞRAF YOLU</span><input class="image" value="${safeImage}" placeholder="image/products/urun-adi.webp"></label>
    <div class="product-actions">
      <button class="move-up" type="button" title="Yukarı taşı" aria-label="Ürünü yukarı taşı">↑</button>
      <button class="move-down" type="button" title="Aşağı taşı" aria-label="Ürünü aşağı taşı">↓</button>
      <button class="visibility ${item.visible === false ? "off" : ""}" type="button">${item.visible === false ? "PASİF" : "AKTİF"}</button>
      <button class="delete-item" type="button" title="Ürünü sil">ÜRÜNÜ SİL</button>
    </div>
  </div>`;
}

function renderCategory() {
  const category = currentCategory();
  if (!category) return;
  $("categoryHeading").textContent = category.title + " Ürünleri";
  $("selectedCategoryName").textContent = category.title;
  $("categoryTitle").value = category.title;
  $("categoryImage").value = category.image || "";
  if (category.groups) {
    products.innerHTML = category.groups.map((group, groupIndex) => `<div class="group-divider">${escapeHtml(group.title)}</div>${group.items.map((item,index) => productCard(item,index,groupIndex)).join("")}`).join("");
  } else {
    products.innerHTML = (category.items || []).map((item,index) => productCard(item,index)).join("");
  }
}

function locateItem(path) {
  const category = currentCategory();
  const parts = path.split(":").map(Number);
  if (parts.length === 2) return {items: category.groups[parts[0]].items, index: parts[1]};
  return {items: category.items, index: parts[0]};
}

$("loginForm").addEventListener("submit", async event => {
  event.preventDefault();
  $("loginMessage").textContent = "Giriş kontrol ediliyor…";
  try {
    await auth.signInWithEmailAndPassword($("email").value.trim(), $("password").value);
    $("loginMessage").textContent = "";
  } catch (error) {
    $("loginMessage").textContent = "E-posta veya şifre hatalı.";
  }
});

auth.onAuthStateChanged(async user => {
  if (!user) {
    loginScreen.hidden = false;
    dashboard.hidden = true;
    return;
  }
  loginScreen.hidden = true;
  dashboard.hidden = false;
  const snapshot = await menuRef.once("value");
  if (!snapshot.exists()) await menuRef.set(window.applyGDZProductImages(ensureRequiredGroups(applyBeerMenuUpdate(applyRequestedMenuUpdate(normalizeMenu(window.GDZ_INITIAL_MENU))))));
  else {
    const updatedMenu = window.applyGDZProductImages(ensureRequiredGroups(applyBeerMenuUpdate(applyRequestedMenuUpdate(normalizeMenu(snapshot.val())))));
    if (JSON.stringify(updatedMenu) !== JSON.stringify(snapshot.val())) await menuRef.set(updatedMenu);
  }
  menuRef.on("value", value => {
    adminMenu = normalizeMenu(value.val());
    renderDashboard();
  });
});

$("logoutButton").addEventListener("click", () => auth.signOut());
categorySelectAdmin.addEventListener("change", event => { selectedCategoryId = event.target.value; renderCategory(); });

$("saveCategoryButton").addEventListener("click", async () => {
  const category = currentCategory();
  category.title = $("categoryTitle").value.trim();
  category.image = $("categoryImage").value.trim();
  await saveMenu("Kategori güncellendi");
});

$("deleteCategoryButton").addEventListener("click", async () => {
  if (adminMenu.length === 1) return toast("Son kategori silinemez");
  const category = currentCategory();
  if (!confirm(`“${category.title}” kategorisi silinsin mi?`)) return;
  adminMenu = adminMenu.filter(item => item.id !== category.id);
  selectedCategoryId = adminMenu[0].id;
  await saveMenu("Kategori silindi");
});

products.addEventListener("change", async event => {
  if (!event.target.matches("input, textarea")) return;
  const card = event.target.closest(".product-card");
  const located = locateItem(card.dataset.path);
  const item = located.items[located.index];
  item.name = card.querySelector(".name").value.trim();
  item.description = card.querySelector(".desc").value.trim();
  item.calories = card.querySelector(".calories").value.trim();
  item.price = card.querySelector(".price").value.trim();
  item.image = card.querySelector(".image").value.trim();
  await saveMenu("Ürün güncellendi");
});

products.addEventListener("click", async event => {
  const card = event.target.closest(".product-card");
  if (!card) return;
  const located = locateItem(card.dataset.path);
  if (event.target.matches(".move-up")) {
    if (located.index === 0) return toast("Ürün zaten ilk sırada");
    [located.items[located.index - 1], located.items[located.index]] = [located.items[located.index], located.items[located.index - 1]];
    await saveMenu("Ürün yukarı taşındı");
    return;
  }
  if (event.target.matches(".move-down")) {
    if (located.index >= located.items.length - 1) return toast("Ürün zaten son sırada");
    [located.items[located.index + 1], located.items[located.index]] = [located.items[located.index], located.items[located.index + 1]];
    await saveMenu("Ürün aşağı taşındı");
    return;
  }
  if (event.target.matches(".delete-item")) {
    if (!confirm("Bu ürün silinsin mi?")) return;
    located.items.splice(located.index, 1);
    await saveMenu("Ürün silindi");
  }
  if (event.target.matches(".visibility")) {
    const item = located.items[located.index];
    item.visible = item.visible === false;
    await saveMenu(item.visible ? "Ürün yayına alındı" : "Ürün gizlendi");
  }
});

function openModal(id) { $(id).hidden = false; }
function closeModals() { document.querySelectorAll(".modal").forEach(modal => modal.hidden = true); }
document.querySelectorAll("[data-close]").forEach(button => button.addEventListener("click", closeModals));
document.querySelectorAll(".modal").forEach(modal => modal.addEventListener("click", event => { if (event.target === modal) closeModals(); }));

$("addCategoryButton").addEventListener("click", () => openModal("categoryModal"));
$("categoryForm").addEventListener("submit", async event => {
  event.preventDefault();
  const title = $("newCategoryTitle").value.trim();
  let id = slugify(title), suffix = 2;
  while (adminMenu.some(category => category.id === id)) id = `${slugify(title)}-${suffix++}`;
  adminMenu.push({id, title, image: $("newCategoryImage").value.trim() || "image/ana.webp", items: []});
  selectedCategoryId = id;
  await saveMenu("Kategori eklendi");
  event.target.reset(); closeModals();
});

$("addProductButton").addEventListener("click", () => {
  const category = currentCategory();
  const groupField = $("groupField");
  $("newProductCategoryName").textContent = category ? category.title : "—";
  $("productMessage").textContent = "";
  if (category.groups) {
    groupField.hidden = false;
    const groupSelect = $("newProductGroup");
    const groups = asArray(category.groups);
    groupSelect.innerHTML = groups.map((group,index) => `<option value="${index}">${escapeHtml(group.title || group.name || `Alt Grup ${index + 1}`)}</option>`).join("");
    groupSelect.selectedIndex = 0;
  } else groupField.hidden = true;
  openModal("productModal");
});

$("productForm").addEventListener("submit", async event => {
  event.preventDefault();
  const category = currentCategory();
  const submitButton = $("submitProductButton");
  const message = $("productMessage");
  if (!category) return;
  const item = {name: $("newProductName").value.trim(), description: $("newProductDescription").value.trim(), calories: $("newProductCalories").value.trim(), price: $("newProductPrice").value.trim(), image: $("newProductImage").value.trim(), visible: true};
  let targetItems;
  if (category.groups) {
    category.groups = asArray(category.groups);
    const groupIndex = Number($("newProductGroup").value || 0);
    const group = category.groups[groupIndex];
    if (!group) {
      message.textContent = "Lütfen bir alt grup seçin.";
      return;
    }
    group.items = asArray(group.items);
    targetItems = group.items;
  } else {
    category.items = asArray(category.items);
    targetItems = category.items;
  }
  targetItems.push(item);
  submitButton.disabled = true;
  submitButton.textContent = "KAYDEDİLİYOR…";
  message.textContent = "";
  const saved = await saveMenu("Ürün eklendi");
  submitButton.disabled = false;
  submitButton.textContent = "ÜRÜNÜ EKLE";
  if (!saved) {
    targetItems.pop();
    message.textContent = "Ürün kaydedilemedi. Firebase Rules ayarını kontrol edin.";
    return;
  }
  event.target.reset();
  closeModals();
});
