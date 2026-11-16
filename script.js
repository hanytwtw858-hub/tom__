// قاعدة البيانات المحلية في المتصفح
let db = JSON.parse(localStorage.getItem('storeDB')) || {
    products: [],
    sales: [],
    purchases: [],
    customers: [{ id: 1, name: 'عميل نقدي (عام)', phone: '-', address: '-' }]
};

function saveDB() {
    localStorage.setItem('storeDB', JSON.stringify(db));
    renderAll();
}

// التنقل بين الصفحات
function showTab(tabId, btn) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('nav button').forEach(b => b.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    btn.classList.add('active');
}

// 1. إضافة منتج للمخزن
document.getElementById('product-form').addEventListener('submit', e => {
    e.preventDefault();
    db.products.push({
        id: Date.now(),
        name: document.getElementById('prod-name').value,
        buyPrice: parseFloat(document.getElementById('prod-buy').value),
        sellPrice: parseFloat(document.getElementById('prod-sell').value),
        qty: parseInt(document.getElementById('prod-qty').value)
    });
    e.target.reset();
    saveDB();
});

function deleteProduct(id) {
    if (confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
        db.products = db.products.filter(p => p.id !== id);
        saveDB();
    }
}

// 2. تسجيل عملية بيع
document.getElementById('sale-form').addEventListener('submit', e => {
    e.preventDefault();
    const prodId = parseInt(document.getElementById('sale-product').value);
    const custId = parseInt(document.getElementById('sale-customer').value);
    const qty = parseInt(document.getElementById('sale-qty').value);

    const product = db.products.find(p => p.id === prodId);
    const customer = db.customers.find(c => c.id === custId);

    if (!product) return alert('اختر منتجاً صحيحاً');
    if (product.qty < qty) return alert(`الكمية المتاحة في المخزن (${product.qty}) فقط!`);

    // خصم من المخزن
    product.qty -= qty;

    db.sales.unshift({
        date: new Date().toLocaleDateString('ar-EG'),
        customerName: customer.name,
        customerId: custId,
        productName: product.name,
        qty: qty,
        price: product.sellPrice,
        total: qty * product.sellPrice
    });

    e.target.reset();
    saveDB();
    alert('تم تسجيل البيع وخصم الكمية من المخزن بنجاح!');
});

// 3. تسجيل عملية شراء
document.getElementById('purchase-form').addEventListener('submit', e => {
    e.preventDefault();
    const prodId = parseInt(document.getElementById('pur-product').value);
    const supplier = document.getElementById('pur-supplier').value;
    const qty = parseInt(document.getElementById('pur-qty').value);
    const cost = parseFloat(document.getElementById('pur-cost').value);

    const product = db.products.find(p => p.id === prodId);
    if (!product) return alert('اختر منتجاً صحيحاً');

    // زيادة الكمية وتحديث سعر الشراء
    product.qty += qty;
    product.buyPrice = cost;

    db.purchases.unshift({
        date: new Date().toLocaleDateString('ar-EG'),
        supplier: supplier,
        productName: product.name,
        qty: qty,
        cost: cost,
        total: qty * cost
    });

    e.target.reset();
    saveDB();
    alert('تم تسجيل المشتريات وإضافة الكمية للمخزن بنجاح!');
});

// 4. إضافة عميل جديد
document.getElementById('customer-form').addEventListener('submit', e => {
    e.preventDefault();
    db.customers.push({
        id: Date.now(),
        name: document.getElementById('cust-name').value,
        phone: document.getElementById('cust-phone').value,
        address: document.getElementById('cust-address').value || '-'
    });
    e.target.reset();
    saveDB();
});

function deleteCustomer(id) {
    if (id === 1) return alert('لا يمكن حذف العميل النقدي الافتراضي');
    if (confirm('هل أنت متأكد من حذف هذا العميل؟')) {
        db.customers = db.customers.filter(c => c.id !== id);
        saveDB();
    }
}

// تحديث الجداول والبيانات في الشاشة
function renderAll() {
    // جدول المخزن والقوائم
    const invTable = document.getElementById('inventory-table');
    const saleProdSelect = document.getElementById('sale-product');
    const purProdSelect = document.getElementById('pur-product');
    
    invTable.innerHTML = '';
    saleProdSelect.innerHTML = '<option value="">-- اختر المنتج --</option>';
    purProdSelect.innerHTML = '<option value="">-- اختر المنتج --</option>';

    db.products.forEach((p, index) => {
        invTable.innerHTML += `
            <tr>
                <td>${index + 1}</td>
                <td><strong>${p.name}</strong></td>
                <td>${p.buyPrice} ج.م</td>
                <td>${p.sellPrice} ج.م</td>
                <td class="${p.qty <= 3 ? 'low-stock' : ''}">${p.qty} قطعة</td>
                <td><button class="btn-danger" onclick="deleteProduct(${p.id})">حذف</button></td>
            </tr>
        `;
        saleProdSelect.innerHTML += `<option value="${p.id}">${p.name} (متاح: ${p.qty} | السعر: ${p.sellPrice})</option>`;
        purProdSelect.innerHTML += `<option value="${p.id}">${p.name}</option>`;
    });

    // جدول وقائمة العملاء
    const custTable = document.getElementById('customers-table');
    const saleCustSelect = document.getElementById('sale-customer');
    custTable.innerHTML = '';
    saleCustSelect.innerHTML = '';

    db.customers.forEach((c, index) => {
        const totalBought = db.sales
            .filter(s => s.customerId === c.id)
            .reduce((sum, s) => sum + s.total, 0);

        custTable.innerHTML += `
            <tr>
                <td>${index + 1}</td>
                <td><strong>${c.name}</strong></td>
                <td>${c.phone}</td>
                <td>${c.address}</td>
                <td>${totalBought} ج.م</td>
                <td>${c.id !== 1 ? `<button class="btn-danger" onclick="deleteCustomer(${c.id})">حذف</button>` : '-'}</td>
            </tr>
        `;
        saleCustSelect.innerHTML += `<option value="${c.id}">${c.name}</option>`;
    });

    // جدول المبيعات
    document.getElementById('sales-table').innerHTML = db.sales.map(s => `
        <tr>
            <td>${s.date}</td>
            <td>${s.customerName}</td>
            <td>${s.productName}</td>
            <td>${s.qty}</td>
            <td>${s.price} ج.م</td>
            <td><strong>${s.total} ج.م</strong></td>
        </tr>
    `).join('');

    // جدول المشتريات
    document.getElementById('purchases-table').innerHTML = db.purchases.map(p => `
        <tr>
            <td>${p.date}</td>
            <td>${p.supplier}</td>
            <td>${p.productName}</td>
            <td>${p.qty}</td>
            <td>${p.cost} ج.م</td>
            <td><strong>${p.total} ج.م</strong></td>
        </tr>
    `).join('');

    // الإحصائيات العلوية
    document.getElementById('stat-products').innerText = db.products.length;
    document.getElementById('stat-sales').innerText = db.sales.reduce((sum, s) => sum + s.total, 0) + ' ج.م';
    document.getElementById('stat-purchases').innerText = db.purchases.reduce((sum, p) => sum + p.total, 0) + ' ج.م';
    document.getElementById('stat-customers').innerText = db.customers.length;
}

// تصدير نسخة احتياطية
function exportBackup() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(db));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "backup_store_" + new Date().toISOString().slice(0, 10) + ".json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
}

// تشغيل عند فتح الصفحة
renderAll();
