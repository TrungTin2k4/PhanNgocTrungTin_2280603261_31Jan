// ==================== API ====================
const API_URL = 'https://api.escuelajs.co/api/v1/products';

// ==================== STATE ====================
let allProducts = [];
let filteredProducts = [];
let currentPage = 1;
let itemsPerPage = 10;

// ==================== DOM ====================
const loadingEl = document.getElementById('loading');
const errorEl = document.getElementById('error');
const tableBody = document.getElementById('tableBody');
const paginationEl = document.getElementById('pagination');
const paginationInfoEl = document.getElementById('paginationInfo');
const searchInput = document.getElementById('searchInput');
const itemsPerPageSelect = document.getElementById('itemsPerPage');

// Sort buttons
const sortPriceAsc = document.getElementById('sortPriceAsc');
const sortPriceDesc = document.getElementById('sortPriceDesc');
const sortNameAsc = document.getElementById('sortNameAsc');
const sortNameDesc = document.getElementById('sortNameDesc');

// ==================== IMAGE UTILS ====================
function parseImageUrls(images) {
    if (!images) return [];
    if (typeof images === 'string') {
        try {
            images = JSON.parse(images);
        } catch {
            return [];
        }
    }
    return Array.isArray(images)
        ? images.map(i => typeof i === 'string' ? i.trim() : '').filter(Boolean)
        : [];
}

function isValidImageUrl(url) {
    return typeof url === 'string' && url.startsWith('http');
}

function getFallbackImage() {
    return 'https://dummyimage.com/60x60/667eea/ffffff&text=No+Image';
}

// ==================== FETCH ====================
async function getAllProducts() {
    try {
        showLoading();
        hideError();

        const res = await fetch(API_URL);
        if (!res.ok) throw new Error(res.status);

        const data = await res.json();

        allProducts = data.map(p => ({
            ...p,
            images: parseImageUrls(p.images)
        }));

        filteredProducts = [...allProducts];

        hideLoading();
        renderTable();
        renderPagination();
    } catch (err) {
        console.error(err);
        hideLoading();
        showError();
    }
}

// ==================== RENDER TABLE ====================
function renderTable() {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageData = filteredProducts.slice(start, end);

    if (!pageData.length) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center;padding:30px;">
                    ❌ Không có dữ liệu
                </td>
            </tr>`;
        return;
    }

    tableBody.innerHTML = pageData.map(product => {
        const imgs = product.images
            .filter(isValidImageUrl)
            .slice(0, 3);

        const images = imgs.length ? imgs : [getFallbackImage()];

        return `
            <tr>
                <td>${product.id}</td>
                <td>
                    <div class="product-images">
                        ${images.map(img => `
                            <img 
                                src="${img}"
                                class="product-image"
                                loading="lazy"
                                referrerpolicy="no-referrer"
                                onerror="this.onerror=null;this.src='${getFallbackImage()}'"
                            >

                        `).join('')}
                    </div>
                </td>
                <td><strong>${escapeHtml(product.title)}</strong></td>
                <td><span class="price">$${product.price}</span></td>
                <td>
                    <span class="category-badge">
                        ${escapeHtml(product.category?.name || 'N/A')}
                    </span>
                </td>
                <td class="description">
                    ${escapeHtml(truncateText(product.description, 120))}
                </td>
            </tr>
        `;
    }).join('');

    updatePaginationInfo();
}

// ==================== PAGINATION ====================
function renderPagination() {
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    paginationEl.innerHTML = '';

    if (totalPages <= 1) return;

    for (let i = 1; i <= totalPages; i++) {
        paginationEl.innerHTML += `
            <button 
                class="${i === currentPage ? 'active' : ''}"
                onclick="goToPage(${i})">
                ${i}
            </button>`;
    }
}

function goToPage(p) {
    currentPage = p;
    renderTable();
    renderPagination();
}

// ==================== SEARCH ====================
searchInput.addEventListener('input', () => {
    const q = searchInput.value.toLowerCase().trim();
    filteredProducts = allProducts.filter(p =>
        p.title.toLowerCase().includes(q)
    );
    currentPage = 1;
    renderTable();
    renderPagination();
});

// ==================== SORT ====================
function sortProducts(type) {
    if (type === 'priceAsc') filteredProducts.sort((a, b) => a.price - b.price);
    if (type === 'priceDesc') filteredProducts.sort((a, b) => b.price - a.price);
    if (type === 'nameAsc') filteredProducts.sort((a, b) => a.title.localeCompare(b.title));
    if (type === 'nameDesc') filteredProducts.sort((a, b) => b.title.localeCompare(a.title));

    currentPage = 1;
    renderTable();
    renderPagination();
}

sortPriceAsc.onclick = () => sortProducts('priceAsc');
sortPriceDesc.onclick = () => sortProducts('priceDesc');
sortNameAsc.onclick = () => sortProducts('nameAsc');
sortNameDesc.onclick = () => sortProducts('nameDesc');

// ==================== ITEMS PER PAGE ====================
itemsPerPageSelect.addEventListener('change', () => {
    itemsPerPage = +itemsPerPageSelect.value;
    currentPage = 1;
    renderTable();
    renderPagination();
});

// ==================== UI ====================
function showLoading() {
    loadingEl.style.display = 'block';
    document.querySelector('.table-container').style.display = 'none';
}
function hideLoading() {
    loadingEl.style.display = 'none';
    document.querySelector('.table-container').style.display = 'block';
}
function showError() {
    errorEl.style.display = 'block';
}
function hideError() {
    errorEl.style.display = 'none';
}
function updatePaginationInfo() {
    const start = (currentPage - 1) * itemsPerPage + 1;
    const end = Math.min(currentPage * itemsPerPage, filteredProducts.length);
    paginationInfoEl.textContent =
        `Hiển thị ${start} - ${end} của ${filteredProducts.length} sản phẩm`;
}

// ==================== HELPERS ====================
function truncateText(text = '', max = 100) {
    return text.length > max ? text.slice(0, max) + '...' : text;
}
function escapeHtml(text = '') {
    const d = document.createElement('div');
    d.textContent = text;
    return d.innerHTML;
}

// ==================== INIT ====================
getAllProducts();
