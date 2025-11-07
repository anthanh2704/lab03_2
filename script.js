let currentPage = 1;
let currentQuery = '';
let totalResults = 0;

// --- 1. Gọi API GitHub để tìm repo ---
async function searchRepositories(query, sort = 'stars', page = 1) {
  clearError();
  const url = `https://api.github.com/search/repositories?q=${query}&sort=${sort}&page=${page}&per_page=10`;

  try {
    const response = await fetch(url);
    if (response.status === 403) {
      showError("⚠️ GitHub rate limit exceeded! Hãy thử lại sau vài phút.");
      return null;
    }
    if (!response.ok) {
      showError("❌ Không thể lấy dữ liệu từ GitHub.");
      return null;
    }
    const data = await response.json();
    totalResults = data.total_count;
    return data.items; // trả về mảng repository
  } catch (error) {
    showError("❌ Lỗi mạng hoặc kết nối internet.");
    return null;
  }
}

// --- 2. Hiển thị danh sách repo ---
function displayRepositories(repos, append = false) {
  const repoList = document.getElementById('repoList');
  const loadMoreContainer = document.getElementById('loadMoreContainer');

  if (!append) repoList.innerHTML = ''; // xóa kết quả cũ

  if (!repos || repos.length === 0) {
    repoList.innerHTML = '<p class="loading">Không tìm thấy repository nào.</p>';
    loadMoreContainer.innerHTML = '';
    return;
  }

  repos.forEach(repo => {
    const card = createRepoCard(repo);
    repoList.appendChild(card);
  });

  const totalPages = Math.ceil(totalResults / 10);
  if (currentPage < totalPages && repos.length === 10) {
    loadMoreContainer.innerHTML = `
      <div class="load-more">
        <button onclick="loadMore()">Load More Results</button>
      </div>
    `;
  } else {
    loadMoreContainer.innerHTML = '';
  }
}

// --- 3. Tạo thẻ hiển thị cho mỗi repo ---
function createRepoCard(repo) {
  const card = document.createElement('div');
  card.className = 'repo-card';
  card.innerHTML = `
    <a href="${repo.html_url}" class="repo-name" target="_blank">
      ${repo.owner.login}/${repo.name}
    </a>
    <p class="repo-description">${repo.description || 'No description available.'}</p>
    <div class="repo-meta">
      <span>⭐ ${formatNumber(repo.stargazers_count)}</span>
      <span>🔱 ${formatNumber(repo.forks_count)}</span>
      <span>👤 ${repo.owner.login}</span>
      ${repo.language ? `<span class="language-badge">${repo.language}</span>` : ''}
    </div>
  `;
  return card;
}

// --- 4. Khi người dùng bấm "Search" ---
async function performSearch() {
  const query = document.getElementById('searchInput').value.trim();
  const sort = document.getElementById('sortSelect').value;

  if (query === '') {
    showError("Vui lòng nhập từ khóa tìm kiếm!");
    return;
  }

  clearError();
  currentPage = 1;
  currentQuery = query;

  document.getElementById('repoList').innerHTML = '<p class="loading">Đang tải...</p>';
  const repos = await searchRepositories(query, sort, currentPage);
  displayRepositories(repos);
}

// --- 5. Nút Load More ---
async function loadMore() {
  currentPage++;
  const sort = document.getElementById('sortSelect').value;
  const repos = await searchRepositories(currentQuery, sort, currentPage);
  displayRepositories(repos, true);
}

// --- 6. Hiển thị lỗi ---
function showError(message) {
  const errorDiv = document.getElementById('errorMessage');
  errorDiv.innerHTML = `<div class="error">${message}</div>`;
}

function clearError() {
  document.getElementById('errorMessage').innerHTML = '';
}

// --- 7. Định dạng số ---
function formatNumber(num) {
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return num;
}
