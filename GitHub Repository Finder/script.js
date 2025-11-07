

const PER_PAGE = 10;
let currentPage = 1;
let currentQuery = '';
let totalResults = 0;

// 1) Search GitHub repositories (API call)
async function searchRepositories(query, sort = 'stars', page = 1) {
  clearError();

  const q = encodeURIComponent((query || '').trim());
  const url = `https://api.github.com/search/repositories?q=${q}&sort=${sort}&page=${page}&per_page=${PER_PAGE}`;

  try {
    const response = await fetch(url);

    // Rate limit (unauthenticated ~60 req/hour)
    if (response.status === 403) {
      showError("⚠️ GitHub rate limit exceeded! Please try again later.");
      return null;
    }

    if (!response.ok) {
      showError("❌ Failed to fetch data from GitHub.");
      return null;
    }

    const data = await response.json();
    totalResults = data.total_count || 0; // used for pagination
    return Array.isArray(data.items) ? data.items : [];
  } catch (error) {
    showError("❌ Network error. Please check your internet connection.");
    return null;
  }
}

// 2) Display results (replace current list)
function displayRepositories(repos) {
  const repoList = document.getElementById('repoList');
  const loadMoreContainer = document.getElementById('loadMoreContainer');

  // Clear previous results
  repoList.innerHTML = '';

  // If null, an error was already shown
  if (repos === null) {
    loadMoreContainer.innerHTML = '';
    return;
  }

  // Empty-state
  if (!repos || repos.length === 0) {
    repoList.innerHTML = '<p class="loading">No repositories found.</p>';
    loadMoreContainer.innerHTML = '';
    return;
  }

  // Render each card
  repos.forEach(repo => {
    repoList.appendChild(createRepoCard(repo));
  });

  // Decide whether to show the Load More button
  const maxTotal = Math.min(totalResults, 1000); // Search API visible cap
  const totalPages = Math.ceil(maxTotal / PER_PAGE);

  if (currentPage < totalPages && repos.length === PER_PAGE) {
    loadMoreContainer.innerHTML = `
      <div class="load-more">
        <button onclick="loadMore()">Load More Results</button>
      </div>
    `;
  } else {
    loadMoreContainer.innerHTML = '';
  }
}

// 3) Append more results (do NOT clear)
function appendRepositories(repos) {
  const repoList = document.getElementById('repoList');
  const loadMoreContainer = document.getElementById('loadMoreContainer');

  if (repos === null) {
    // Error already shown
    return;
  }

  if (!repos || repos.length === 0) {
    // No more results to append
    loadMoreContainer.innerHTML = '';
    return;
  }

  // Append cards
  repos.forEach(repo => {
    repoList.appendChild(createRepoCard(repo));
  });

  // Re-evaluate Load More visibility
  const maxTotal = Math.min(totalResults, 1000);
  const totalPages = Math.ceil(maxTotal / PER_PAGE);

  if (currentPage < totalPages && repos.length === PER_PAGE) {
    loadMoreContainer.innerHTML = `
      <div class="load-more">
        <button onclick="loadMore()">Load More Results</button>
      </div>
    `;
  } else {
    loadMoreContainer.innerHTML = '';
  }
}

// 4) Read selected sort option
function getSortValue() {
  const el = document.getElementById('sortSelect');
  const value = el && el.value ? el.value : 'stars';
  return ['stars', 'forks', 'updated'].includes(value) ? value : 'stars';
}

// 5) Load next page and append
async function loadMore() {
  const sort = getSortValue();
  const nextPage = currentPage + 1;

  const repos = await searchRepositories(currentQuery, sort, nextPage);
  if (repos === null) {
    // Keep currentPage unchanged on failure
    return;
  }

  currentPage = nextPage;
  appendRepositories(repos);
}


// Triggered by Search button / Enter key / sort change
async function performSearch() {
  const input = document.getElementById('searchInput');
  const query = (input && input.value ? input.value : '').trim();

  if (!query) {
    showError("Please enter a search keyword.");
    return;
  }

  clearError();
  currentQuery = query;
  currentPage = 1;

  // Loading placeholder
  document.getElementById('repoList').innerHTML = '<p class="loading">Loading...</p>';

  const repos = await searchRepositories(currentQuery, getSortValue(), currentPage);
  displayRepositories(repos);
}

// Create a single repository card
function createRepoCard(repo) {
  const card = document.createElement('div');
  card.className = 'repo-card';

  const owner = repo.owner && repo.owner.login ? repo.owner.login : 'unknown';
  const name = repo.name || 'unknown';
  const description = repo.description ? escapeHtml(repo.description) : 'No description available.';
  const stars = typeof repo.stargazers_count === 'number' ? repo.stargazers_count : 0;
  const forks = typeof repo.forks_count === 'number' ? repo.forks_count : 0;
  const language = repo.language ? repo.language : '';

  card.innerHTML = `
    <a href="${repo.html_url}" class="repo-name" target="_blank" rel="noopener noreferrer">
      ${owner}/${name}
    </a>
    <p class="repo-description">${description}</p>
    <div class="repo-meta">
      <span>⭐ ${formatNumber(stars)}</span>
      <span>🔱 ${formatNumber(forks)}</span>
      <span>👤 ${owner}</span>
      ${language ? `<span class="language-badge">${language}</span>` : ''}
    </div>
  `;
  return card;
}

// Error banner helpers
function showError(message) {
  const errorDiv = document.getElementById('errorMessage');
  errorDiv.innerHTML = `<div class="error">${message}</div>`;
}
function clearError() {
  const errorDiv = document.getElementById('errorMessage');
  if (errorDiv) errorDiv.innerHTML = '';
}

// Format large numbers (e.g., 1530 -> 1.5k)
function formatNumber(num) {
  if (typeof num !== 'number') return num;
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
  return num.toString();
}

// Basic HTML escaping to avoid injecting markup via description
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
