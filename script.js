let currentTab = 'customer';
let orders = JSON.parse(localStorage.getItem('app_orders')) || [];
let drivers = JSON.parse(localStorage.getItem('app_drivers')) || [];
let currentDriver = JSON.parse(localStorage.getItem('current_driver')) || null;
let adminSettings = JSON.parse(localStorage.getItem('admin_settings')) || { whish: "03000000", shop: "محل حمدان صادق" };
let activeCodes = JSON.parse(localStorage.getItem('active_codes')) || ["VIP-1001"];

function initApp() {
    updateUI();
}

function switchTab(tab) {
    currentTab = tab;
    document.getElementById('customer-tab').classList.add('hidden');
    document.getElementById('driver-tab').classList.add('hidden');
    document.getElementById('admin-tab').classList.add('hidden');

    if (tab === 'customer') {
        document.getElementById('customer-tab').classList.remove('hidden');
    } else if (tab === 'driver') {
        document.getElementById('driver-tab').classList.remove('hidden');
        checkDriverState();
    } else if (tab === 'admin') {
        document.getElementById('admin-tab').classList.remove('hidden');
        loadAdminData();
    }
    
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    if(tab !== 'admin' && event && event.target) {
        event.target.classList.add('active');
    }
}

function submitOrder(e) {
    e.preventDefault();
    const newOrder = {
        id: Date.now(),
        type: document.getElementById('service-type').value,
        vehicle: document.getElementById('vehicle-pref').value,
        name: document.getElementById('cust-name').value,
        phone: document.getElementById('cust-phone').value,
        details: document.getElementById('cust-details').value,
        status: 'قيد الانتظار',
        driverName: ''
    };
    orders.unshift(newOrder);
    localStorage.setItem('app_orders', JSON.stringify(orders));
    alert('تم إرسال طلبك بنجاح! سيتم التواصل معك قريباً.');
    document.getElementById('order-form').reset();
    updateUI();
}

function registerDriver(e) {
    e.preventDefault();
    const newDriver = {
        id: 'DRV-' + Math.floor(1000 + Math.random() * 9000),
        name: document.getElementById('reg-name').value,
        phone: document.getElementById('reg-phone').value,
        vehicle: document.getElementById('reg-vehicle').value,
        plate: document.getElementById('reg-plate').value,
        expiryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
    };
    drivers.push(newDriver);
    currentDriver = newDriver;
    localStorage.setItem('app_drivers', JSON.stringify(drivers));
    localStorage.setItem('current_driver', JSON.stringify(currentDriver));
    
    alert('تم التسجيل بنجاح! لديك فترة تجريبية مجانية لمدة 3 أيام.');
    checkDriverState();
}

function checkDriverState() {
    if (currentDriver) {
        document.getElementById('driver-register-section').classList.add('hidden');
        document.getElementById('driver-dashboard').classList.remove('hidden');
        document.getElementById('driver-welcome-name').innerText = 'الكابتن: ' + currentDriver.name;
        document.getElementById('whish-display').innerText = adminSettings.whish;
        document.getElementById('shop-display').innerText = adminSettings.shop;
        
        let isExpired = new Date() > new Date(currentDriver.expiryDate);
        if (isExpired) {
            document.getElementById('driver-sub-status').innerHTML = '<span class="badge badge-danger">انتهى الاشتراك - جدد لمتابعة العمل</span>';
        } else {
            document.getElementById('driver-sub-status').innerHTML = '<span class="badge badge-success">الاشتراك نشط</span>';
        }
    } else {
        document.getElementById('driver-register-section').classList.remove('hidden');
        document.getElementById('driver-dashboard').classList.add('hidden');
    }
    renderOrders();
}

function logoutDriver() {
    currentDriver = null;
    localStorage.removeItem('current_driver');
    checkDriverState();
}

function activateSubscription() {
    let code = document.getElementById('activation-code-input').value.trim();
    if (activeCodes.includes(code)) {
        let newExpiry = new Date(Math.max(new Date(), new Date(currentDriver.expiryDate)) + 30 * 24 * 60 * 60 * 1000);
        currentDriver.expiryDate = newExpiry.toISOString();
        localStorage.setItem('current_driver', JSON.stringify(currentDriver));
        
        activeCodes = activeCodes.filter(c => c !== code);
        localStorage.setItem('active_codes', JSON.stringify(activeCodes));
        
        alert('تم تفعيل الاشتراك بنجاح لمدة 30 يوماً!');
        document.getElementById('activation-code-input').value = '';
        checkDriverState();
    } else {
        alert('كود التفعيل غير صالح أو مستخدم مسبقاً!');
    }
}

function renderOrders() {
    let custHtml = '';
    let phoneVal = document.getElementById('cust-phone') ? document.getElementById('cust-phone').value : '';
    let activeCustOrders = orders.filter(o => o.phone === phoneVal);
    
    if(orders.length === 0) {
        custHtml = '<p style="color: #666; font-size: 0.85rem;">لا توجد طلبات سابقة.</p>';
    } else {
        orders.slice(0, 3).forEach(o => {
            custHtml += `<div style="border-bottom: 1px solid #eee; padding: 8px 0; font-size: 0.85rem;">
                <b>${o.type}</b> (${o.vehicle})<br>
                الحالة: <span class="badge ${o.status === 'مكتمل' ? 'badge-success' : 'badge-danger'}">${o.status}</span>
            </div>`;
        });
    }
    let custContainer = document.getElementById('customer-orders-list');
    if(custContainer) custContainer.innerHTML = custHtml;

    let drvHtml = '';
    let pendingOrders = orders.filter(o => o.status === 'قيد الانتظار');
    let isExpired = currentDriver ? new Date() > new Date(currentDriver.expiryDate) : true;

    if (pendingOrders.length === 0) {
        drvHtml = '<p style="color: #666; font-size: 0.85rem;">لا توجد طلبات متاحة حالياً في المنطقة.</p>';
    } else if (isExpired) {
        drvHtml = '<p style="color: red; font-size: 0.85rem;">يجب تجديد الاشتراك لعرض أرقام وتفاصيل الطلبات.</p>';
    } else {
        pendingOrders.forEach(o => {
            drvHtml += `<div style="border: 1px solid #ddd; padding: 10px; border-radius: 5px; margin-bottom: 8px; font-size: 0.85rem;">
                <b>الخدمة:</b> ${o.type} (${o.vehicle})<br>
                <b>الزبون:</b> ${o.name} - ${o.phone}<br>
                <b>التفاصيل:</b> ${o.details}<br>
                <a href="https://wa.me/${o.phone}" target="_blank" style="display:inline-block; margin-top:5px; background:#25d366; color:white; padding:5px 10px; text-decoration:none; border-radius:4px;">مراسلة واتساب</a>
                <button onclick="completeOrder(${o.id})" style="margin-top:5px; background:var(--primary); color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">تم التوصيل</button>
            </div>`;
        });
    }
    let drvContainer = document.getElementById('available-orders-list');
    if(drvContainer) drvContainer.innerHTML = drvHtml;
}

function completeOrder(id) {
    orders = orders.map(o => o.id === id ? {...o, status: 'مكتمل'} : o);
    localStorage.setItem('app_orders', JSON.stringify(orders));
    renderOrders();
}

// الرمز السري الجديد والمعقد لإدارة اللوحة
function openAdminLogin() {
    let pass = prompt("أدخل رمز لوحة الإدارة:");
    if (pass === "Sh#9vK!2$mP9xL") {
        switchTab('admin');
    } else if (pass !== null) {
        alert("الرمز غير صحيح!");
    }
}

function generateNewCode() {
    let newCode = 'VIP-' + Math.floor(1000 + Math.random() * 9000);
    activeCodes.push(newCode);
    localStorage.setItem('active_codes', JSON.stringify(activeCodes));
    document.getElementById('generated-code-box').innerText = 'تم توليد الكود: ' + newCode;
    loadAdminData();
}

function loadAdminData() {
    document.getElementById('admin-whish').value = adminSettings.whish;
    document.getElementById('admin-shop').value = adminSettings.shop;
    
    let dHtml = '';
    drivers.forEach(d => {
        dHtml += `<div style="border-bottom: 1px solid #eee; padding: 5px 0; font-size: 0.8rem;">
            <b>${d.name}</b> (${d.vehicle}) - ${d.phone}
        </div>`;
    });
    document.getElementById('admin-drivers-list').innerHTML = dHtml || 'لا يوجد سائقين مسجلين بعد.';
}

function saveAdminSettings() {
    adminSettings.whish = document.getElementById('admin-whish').value;
    adminSettings.shop = document.getElementById('admin-shop').value;
    localStorage.setItem('admin_settings', JSON.stringify(adminSettings));
    alert('تم حفظ الإعدادات بنجاح!');
}

function updateUI() {
    renderOrders();
}

window.onload = initApp;
