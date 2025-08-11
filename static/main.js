// static/main.js

const CORS_PROXY_URL = 'https://api.allorigins.win/raw?url='; // Public CORS proxy

// DOM elements
const bookmarkList = document.getElementById('bookmark-list');
const rssFeedContainer = document.getElementById('rss-feed-container');
const addLinkBtn = document.getElementById('add-link-btn');
const addLinkModal = document.getElementById('add-link-modal');
const closeLinkModalBtn = document.getElementById('close-link-modal-btn');
const addLinkForm = document.getElementById('add-link-form');
const addFeedForm = document.getElementById('add-feed-form');
const feedUrlInput = document.getElementById('feed-url-input');
const feedMessage = document.getElementById('feed-message');
const messageBox = document.getElementById('message-box');
const messageText = document.getElementById('message-text');

// Initial data arrays (will be populated from the database)
let bookmarks = [];
let rssFeeds = [];

// Helper function to show a message box
function showMessage(message, type = 'info') {
    messageText.textContent = message;
    messageBox.classList.remove('hidden', 'opacity-0', 'bg-red-100', 'bg-green-100');
    messageBox.classList.add('opacity-100');
    
    if (type === 'error') {
        messageBox.classList.add('bg-red-100', 'text-red-700');
    } else if (type === 'success') {
        messageBox.classList.add('bg-green-100', 'text-green-700');
    } else {
        messageBox.classList.add('bg-white', 'text-gray-800');
    }

    setTimeout(() => {
        messageBox.classList.remove('opacity-100');
        messageBox.classList.add('opacity-0');
        setTimeout(() => {
            messageBox.classList.add('hidden');
        }, 300); // Wait for fade-out to finish
    }, 3000);
}

// Bookmark Functions
async function loadBookmarks() {
    try {
        const response = await fetch('/api/bookmarks');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        bookmarks = await response.json();
    } catch (e) {
        console.error('Failed to load bookmarks from server', e);
        showMessage('Failed to load bookmarks. Please try again.', 'error');
    }
    renderBookmarks();
}

function renderBookmarks() {
    bookmarkList.innerHTML = '';
    bookmarks.forEach((bookmark, index) => {
        const bookmarkCard = document.createElement('a');
        bookmarkCard.href = bookmark.url;
        bookmarkCard.target = '_blank';
        bookmarkCard.className = 'w-32 h-32 p-4 bg-white rounded-xl shadow-md flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors duration-200';
        bookmarkCard.innerHTML = `
            <span class="text-4xl mb-2">🚀</span>
            <span class="text-sm font-medium text-gray-700 truncate w-full">${bookmark.name}</span>
        `;
        bookmarkCard.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            if (confirm(`Do you want to delete the bookmark for "${bookmark.name}"?`)) {
                deleteBookmark(bookmark.id);
            }
        });
        bookmarkList.appendChild(bookmarkCard);
    });
}

async function deleteBookmark(id) {
    try {
        const response = await fetch(`/api/bookmarks/${id}`, { method: 'DELETE' });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        // Reload the bookmarks from the server after deletion
        await loadBookmarks();
        showMessage('Bookmark deleted successfully.', 'success');
    } catch (e) {
        console.error('Failed to delete bookmark', e);
        showMessage('Failed to delete bookmark. Please try again.', 'error');
    }
}

addLinkBtn.addEventListener('click', () => {
    addLinkModal.classList.remove('hidden');
    addLinkModal.classList.add('flex');
});

closeLinkModalBtn.addEventListener('click', () => {
    addLinkModal.classList.add('hidden');
    addLinkModal.classList.remove('flex');
    addLinkForm.reset();
});

addLinkForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('link-name').value;
    const url = document.getElementById('link-url').value;

    if (name && url) {
        try {
            const response = await fetch('/api/bookmarks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, url })
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            await loadBookmarks(); // Reload bookmarks after adding
            addLinkModal.classList.add('hidden');
            addLinkModal.classList.remove('flex');
            addLinkForm.reset();
            showMessage('Bookmark added successfully.', 'success');
        } catch (e) {
            console.error('Failed to add bookmark', e);
            showMessage('Failed to add bookmark. Please try again.', 'error');
        }
    }
});

// RSS Feed Functions
async function loadFeeds() {
    try {
        const response = await fetch('/api/feeds');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        rssFeeds = await response.json();
    } catch (e) {
        console.error('Failed to load RSS feeds from server', e);
        showMessage('Failed to load RSS feeds. Please try again.', 'error');
    }
    renderRssFeeds();
}

function renderRssFeeds() {
    rssFeedContainer.innerHTML = '';
    if (rssFeeds.length === 0) {
        rssFeedContainer.innerHTML = '<p class="text-gray-500">Add an RSS feed to get started.</p>';
        return;
    }
    rssFeeds.forEach(feed => {
        fetchAndRenderFeed(feed);
    });
}

async function fetchAndRenderFeed(feed) {
    feedMessage.textContent = 'Fetching feed...';
    feedMessage.classList.remove('hidden');
    
    // CORS Note: A server-side proxy is required to fetch RSS feeds from other domains.
    // This public proxy is used for demonstration purposes. In a production environment,
    // you would need to implement your own proxy to avoid CORS issues and rate limits.
    const url = CORS_PROXY_URL + encodeURIComponent(feed.url);

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const xmlText = await response.text();
        parseAndDisplayFeed(xmlText, feed.name, feed.url, feed.id);
        feedMessage.textContent = ''; // Clear message on success
    } catch (error) {
        console.error('Could not fetch the RSS feed:', error);
        // Display an error message specific to this feed
        const errorDiv = document.createElement('div');
        errorDiv.className = 'bg-red-100 p-4 rounded-xl shadow-md text-red-700';
        errorDiv.innerHTML = `
            <h2 class="text-xl font-semibold mb-2">${feed.name}</h2>
            <p>Error fetching feed from ${feed.url}.</p>
            <button class="text-sm font-medium underline mt-2" onclick="deleteFeed(${feed.id})">Delete Feed</button>
        `;
        rssFeedContainer.appendChild(errorDiv);
        feedMessage.textContent = ''; // Clear main message
    }
}

function parseAndDisplayFeed(xmlText, name, url, id) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "text/xml");
    
    const feedDiv = document.createElement('div');
    feedDiv.className = 'bg-white p-6 rounded-xl shadow-md space-y-4 relative group';
    
    // Add a delete button that appears on hover
    feedDiv.innerHTML = `
        <button onclick="deleteFeed(${id})" class="absolute top-2 right-2 text-gray-400 hover:text-red-500 hidden group-hover:block transition-all duration-200">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 1 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm6 0a1 1 0 11-2 0v6a1 1 0 112 0V8z" clip-rule="evenodd" />
            </svg>
        </button>
        <h2 class="text-xl font-semibold mb-4 text-gray-800">${name}</h2>
    `;

    const items = xmlDoc.querySelectorAll('item');
    items.forEach((item, index) => {
        if (index >= 3) return; // Limit to 3 articles
        const title = item.querySelector('title')?.textContent;
        const link = item.querySelector('link')?.textContent;
        
        if (title && link) {
            const articleDiv = document.createElement('div');
            articleDiv.className = 'border-t border-gray-200 pt-4';
            articleDiv.innerHTML = `
                <h3 class="text-base font-medium text-gray-900 line-clamp-2">${title}</h3>
                <a href="${link}" target="_blank" class="text-blue-500 hover:underline text-sm font-medium">Open</a>
            `;
            feedDiv.appendChild(articleDiv);
        }
    });
    rssFeedContainer.appendChild(feedDiv);
}

addFeedForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const feedUrl = feedUrlInput.value.trim();
    if (feedUrl) {
        const name = feedUrl.split('/')[2] || 'New Feed'; // Basic name from URL
        try {
            const response = await fetch('/api/feeds', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, url: feedUrl })
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }
            await loadFeeds();
            feedUrlInput.value = '';
            showMessage('RSS feed added successfully.', 'success');
        } catch (e) {
            console.error('Failed to add RSS feed', e);
            showMessage(e.message, 'error');
        }
    } else {
        showMessage('Please enter a valid URL.', 'error');
    }
});

async function deleteFeed(id) {
    try {
        const response = await fetch(`/api/feeds/${id}`, { method: 'DELETE' });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        await loadFeeds();
        showMessage('RSS feed deleted.', 'success');
    } catch (e) {
        console.error('Failed to delete RSS feed', e);
        showMessage('Failed to delete RSS feed. Please try again.', 'error');
    }
}

// Initial loading on page load
document.addEventListener('DOMContentLoaded', () => {
    loadBookmarks();
    loadFeeds();
});
