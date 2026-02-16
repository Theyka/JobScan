// DOM Elements
const themeToggle = document.getElementById('theme-toggle');
const htmlElement = document.documentElement;
const companyFilterInput = document.getElementById('company-filter');
const techFilterInput = document.getElementById('tech-filter');
const toggleAllTechsBtn = document.getElementById('toggle-all-techs');
const allTechsContainer = document.getElementById('all-techs-container');
const toggleAllCompaniesBtn = document.getElementById('toggle-all-companies');
const allCompaniesContainer = document.getElementById('all-companies-container');
const prevPageBtn = document.getElementById('prev-page');
const nextPageBtn = document.getElementById('next-page');
const pageInfoEl = document.getElementById('page-info');
const itemsPerPageEl = document.getElementById('items-per-page');

// Chart Configuration
let barChart = null;


// State
let allJobs = [];
let availableTechs = [];
let allTechsFromBackend = [];
let allCompanies = [];
let availableCompanies = [];
let filteredJobsCount = 0;
let currentPage = 1;
let itemsPerPage = parseInt(localStorage.getItem('itemsPerPage')) || 20;

let activeFilters = {
    tech: null,
    companyTag: null,
    source: null,
    search: '',
    companyInput: '',
    techInput: '',
    salaryMin: null,
    salaryMax: null
};

// Theme Management
// Theme Management - Update to standard Tailwind 'class' strategy
const savedTheme = localStorage.getItem('theme');
const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
let currentTheme = savedTheme || systemTheme;

function setTheme(theme) {
    if (theme === 'dark') {
        htmlElement.classList.add('dark');
        htmlElement.classList.remove('light');
    } else {
        htmlElement.classList.remove('dark');
        htmlElement.classList.add('light');
    }
    localStorage.setItem('theme', theme);
    currentTheme = theme;
    updateChartTheme();
}

// Custom Select Logic
const customSelectWrapper = document.getElementById('custom-select-wrapper');
const customSelectTrigger = document.getElementById('custom-select-trigger');
const customSelectOptions = document.getElementById('custom-select-options');
const customOptions = document.querySelectorAll('.custom-option');
const displayEl = document.getElementById('items-per-page-display');

if (customSelectTrigger) {
    if (displayEl) displayEl.textContent = itemsPerPage;
    
    customSelectTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        const isHidden = customSelectOptions.classList.contains('hidden');
        
        if (isHidden) {
            // Open
            customSelectOptions.classList.remove('hidden');
            setTimeout(() => {
                customSelectOptions.classList.remove('scale-95', 'opacity-0');
                customSelectOptions.classList.add('scale-100', 'opacity-100');
            }, 10);
        } else {
            // Close
            closeCustomSelect();
        }
    });

    customOptions.forEach(opt => {
        opt.addEventListener('click', (e) => {
            const val = parseInt(opt.dataset.value);
            itemsPerPage = val;
            if (displayEl) displayEl.textContent = val;
            localStorage.setItem('itemsPerPage', val);
            currentPage = 1;
            renderView();
            closeCustomSelect();
        });
    });

    document.addEventListener('click', () => {
        if (!customSelectOptions.classList.contains('hidden')) {
            closeCustomSelect();
        }
    });
}

function closeCustomSelect() {
    customSelectOptions.classList.add('scale-95', 'opacity-0');
    customSelectOptions.classList.remove('scale-100', 'opacity-100');
    setTimeout(() => {
        customSelectOptions.classList.add('hidden');
    }, 200);
}
themeToggle.addEventListener('click', () => {
    setTheme(currentTheme === 'light' ? 'dark' : 'light');
});

function getChartColors() {
    const isDark = currentTheme === 'dark';
    return {
        text: isDark ? '#9ca3af' : '#6b7280',
        grid: isDark ? '#374151' : '#e5e7eb',
        tooltipBg: isDark ? '#1f2937' : '#ffffff',
        tooltipText: isDark ? '#f9fafb' : '#1f2937',
        tooltipBorder: isDark ? '#374151' : '#e5e7eb'
    };
}

const palette = [
    '#2563eb', '#10b981', '#f59e0b', '#ef4444', 
    '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16',
    '#6366f1', '#14b8a6', '#f97316', '#a855f7'
];

// Constants
const POLL_INTERVAL = 300000; // 5 minutes

// Data Loading
function loadData() {
    fetch('/api/data')
        .then(res => res.json())
        .then(data => processData(data))
        .catch(err => {
            console.error("Error fetching data", err);
            // Retry after 5s if failed
            setTimeout(loadData, 5000);
        });
}

function processData(data) {
    const loadingEl = document.getElementById('loading');
    
    // If backend is still doing initial load
    if (data.is_loading && data.total_jobs === 0) {
        if (loadingEl) {
            loadingEl.classList.remove('hidden');
            loadingEl.querySelector('.loading-note').textContent = "Server is analyzing jobs... this may take a moment.";
        }
        setTimeout(loadData, 3000);
        return;
    }
    
    // Update Stats
    document.getElementById('total-jobs').textContent = data.total_jobs;
    document.getElementById('tech-jobs').textContent = data.jobs_with_tech;
    document.getElementById('total-techs').textContent = data.languages.length;
    
    if (data.languages && data.languages.length > 0) {
        document.getElementById('top-language').textContent = data.languages[0].name;
    } else {
        document.getElementById('top-language').textContent = "--";
    }
    
    // Update Source Breakdown Stats
    if (data.stats) {
        document.getElementById('stat-glorri').textContent = data.stats.total_glorri || 0;
        document.getElementById('stat-jsaz').textContent = data.stats.total_jsaz || 0;
        document.getElementById('stat-overlap').textContent = data.stats.overlap || 0;
        document.getElementById('stat-unique').textContent = (data.stats.unique_glorri + data.stats.unique_jsaz) || 0;
    }
    
    // Format Last Updated
    if (data.last_updated) {
        try {
            const date = new Date(data.last_updated);
            document.getElementById('last-updated').textContent = date.toLocaleTimeString([], { hour12: false });
        } catch(e) {
            document.getElementById('last-updated').textContent = data.last_updated;
        }
    }
    
    allJobs = data.recent_jobs;
    allTechsFromBackend = data.languages;
    
    // Derive companies from jobs once
    const companyCounts = {};
    allJobs.forEach(job => {
        const name = job.company || 'Unknown';
        companyCounts[name] = (companyCounts[name] || 0) + 1;
    });
    allCompanies = Object.entries(companyCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);
    
    renderView();
    if (loadingEl) loadingEl.classList.add('hidden');
    
    // Poll for updates without full reload - DISABLED per user request
    // setTimeout(loadData, POLL_INTERVAL);
}

// Filtering & View Orchestration
function renderView() {
    // 1. Filter jobs based on active filters
    const filteredJobs = getFilteredJobs();
    filteredJobsCount = filteredJobs.length;
    
    // 2. Re-calculate available technologies and companies based on current job set
    recomputeAvailableTechs(filteredJobs);
    recomputeAvailableCompanies(filteredJobs);
    
    // 3. Render components
    renderCharts(availableTechs.slice(0, 15));
    renderTechExplorer();
    renderCompanyExplorer();
    renderJobs(filteredJobs);
}

function getFilteredJobs() {
    return allJobs.filter(job => {
        // Tech Filter (Active tech must be in job's technologies)
        if (activeFilters.tech && !job.technologies.some(t => t.toLowerCase() === activeFilters.tech.toLowerCase())) return false;
        
        // Company Tag Filter (Exact match)
        if (activeFilters.companyTag && job.company !== activeFilters.companyTag) return false;
        
        // Source Filter
        if (activeFilters.source && job.source !== activeFilters.source) return false;
        
        // Salary Range Filter
        if (activeFilters.salaryMin !== null || activeFilters.salaryMax !== null) {
            const salary = parseSalary(job.salary);
            if (salary === null) return false; // Skip jobs without parseable salary
            if (activeFilters.salaryMin !== null && salary < activeFilters.salaryMin) return false;
            if (activeFilters.salaryMax !== null && salary > activeFilters.salaryMax) return false;
        }
        
        // Company Input Search (Partial match)
        if (activeFilters.companyInput && !job.company.toLowerCase().includes(activeFilters.companyInput)) return false;
        
        // General Search (Title, Company, or Tech)
        if (activeFilters.search) {
            const inTitle = job.title.toLowerCase().includes(activeFilters.search);
            const inCompany = job.company.toLowerCase().includes(activeFilters.search);
            const inTech = job.technologies.some(t => t.toLowerCase().includes(activeFilters.search));
            if (!inTitle && !inCompany && !inTech) return false;
        }
        return true;
    });
}

function recomputeAvailableTechs(jobs) {
    const techCounts = {};
    jobs.forEach(job => {
        job.technologies.forEach(t => {
            techCounts[t] = (techCounts[t] || 0) + 1;
        });
    });
    
    // Ensure active filter is always in the list
    if (activeFilters.tech && !techCounts[activeFilters.tech]) {
        techCounts[activeFilters.tech] = 0;
    }
    
    availableTechs = Object.entries(techCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);
}

function recomputeAvailableCompanies(jobs) {
    const companyCounts = {};
    jobs.forEach(job => {
        const name = job.company || 'Unknown';
        companyCounts[name] = (companyCounts[name] || 0) + 1;
    });
    
    // Ensure active filter is always in the list
    if (activeFilters.companyTag && !companyCounts[activeFilters.companyTag]) {
        companyCounts[activeFilters.companyTag] = 0;
    }
    
    availableCompanies = Object.entries(companyCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);
}

// Event Listeners
// Event Listeners
const searchInputs = document.querySelectorAll('.search-input');
searchInputs.forEach(input => {
    input.addEventListener('input', (e) => {
        const val = e.target.value;
        // Sync other inputs
        searchInputs.forEach(other => {
            if (other !== input) other.value = val;
        });
        activeFilters.search = val.toLowerCase();
        currentPage = 1;
        renderView();
    });
});

companyFilterInput.addEventListener('input', () => {
    activeFilters.companyInput = companyFilterInput.value.toLowerCase();
    currentPage = 1;
    renderView();
});

if (techFilterInput) {
    techFilterInput.addEventListener('input', () => {
        activeFilters.techInput = techFilterInput.value.toLowerCase();
        currentPage = 1;
        renderView();
    });
}

// Expose these to global scope for onclick handlers
window.setTechFilter = function(tech) {
    activeFilters.tech = (activeFilters.tech === tech) ? null : tech;
    updateFilterBadge();
    currentPage = 1;
    renderView();
}

window.setCompanyTagFilter = function(company) {
    activeFilters.companyTag = (activeFilters.companyTag === company) ? null : company;
    updateFilterBadge();
    currentPage = 1;
    renderView();
}

window.clearFilter = function() {
    activeFilters.tech = null;
    activeFilters.companyTag = null;
    activeFilters.source = null;
    updateSourceFilterUI();
    updateFilterBadge();
    currentPage = 1;
    renderView();
}

// Parse salary string to numeric value (extract first number)
function parseSalary(salaryStr) {
    if (!salaryStr || salaryStr === 'Not specified') return null;
    // Extract first number from string (handles "1000-2000", "1000 AZN", etc.)
    const match = salaryStr.toString().match(/\d+/);
    return match ? parseInt(match[0]) : null;
}

window.setSalaryRange = function(min, max) {
    activeFilters.salaryMin = min;
    activeFilters.salaryMax = max;
    updateSalaryFilterUI(min, max);
    currentPage = 1;
    renderView();
}

function updateSalaryFilterUI(min, max) {
    const buttons = document.querySelectorAll('.salary-filter-btn');
    buttons.forEach(btn => {
        btn.classList.remove('bg-blue-50', 'dark:bg-blue-900/30', 'text-blue-600', 'dark:text-blue-400', 'border-blue-200', 'dark:border-blue-800');
        btn.classList.add('border-gray-200', 'dark:border-gray-700', 'text-gray-600', 'dark:text-gray-400');
        // Remove indicator dot if exists
        const dot = btn.querySelector('.w-2.h-2');
        if (dot) dot.remove();
    });
    
    // Highlight active button
    let activeBtn = null;
    if (min === null && max === null) {
        activeBtn = document.getElementById('salary-all');
    } else if (min === 0 && max === 1000) {
        activeBtn = document.getElementById('salary-0-1000');
    } else if (min === 1000 && max === 2000) {
        activeBtn = document.getElementById('salary-1000-2000');
    } else if (min === 2000 && max === 3000) {
        activeBtn = document.getElementById('salary-2000-3000');
    } else if (min === 3000 && max === 5000) {
        activeBtn = document.getElementById('salary-3000-5000');
    } else if (min === 5000 && max === null) {
        activeBtn = document.getElementById('salary-5000-up');
    }
    
    if (activeBtn) {
        activeBtn.classList.remove('border-gray-200', 'dark:border-gray-700', 'text-gray-600', 'dark:text-gray-400');
        activeBtn.classList.add('bg-blue-50', 'dark:bg-blue-900/30', 'text-blue-600', 'dark:text-blue-400', 'border-blue-200', 'dark:border-blue-800');
        // Add indicator dot
        if (!activeBtn.querySelector('.w-2.h-2')) {
            const dot = document.createElement('span');
            dot.className = 'w-2 h-2 rounded-full bg-blue-500';
            activeBtn.appendChild(dot);
        }
    }
}

window.setSourceFilter = function(source) {
    activeFilters.source = source;
    updateSourceFilterUI();
    updateFilterBadge();
    currentPage = 1;
    renderView();
}

function updateSourceFilterUI() {
    const btns = document.querySelectorAll('.source-filter-btn');
    btns.forEach(btn => {
        const id = btn.id;
        const activeClass = "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800";
        const inactiveClass = "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700";
        
        const dot = btn.querySelector('.w-2.h-2');
        
        let isActive = false;
        if (activeFilters.source === null && id === 'source-all') isActive = true;
        if (activeFilters.source === 'jobsearch.az' && id === 'source-jsaz') isActive = true;
        if (activeFilters.source === 'glorri' && id === 'source-glorri') isActive = true;
        
        if (isActive) {
            btn.className = `source-filter-btn flex items-center justify-between px-4 py-2 rounded-lg text-sm font-medium border transition-all ${activeClass}`;
            if (!dot) {
                const newDot = document.createElement('span');
                newDot.className = "w-2 h-2 rounded-full bg-blue-500";
                btn.appendChild(newDot);
            }
        } else {
            btn.className = `source-filter-btn flex items-center justify-between px-4 py-2 rounded-lg text-sm font-medium border transition-all ${inactiveClass}`;
            if (dot) dot.remove();
        }
    });
}


function updateFilterBadge() {
    const filterBadge = document.getElementById('active-filter');
    const filterText = document.getElementById('filter-text');
    
    const parts = [];
    if (activeFilters.tech) parts.push(`Tech: ${activeFilters.tech}`);
    if (activeFilters.companyTag) parts.push(`Company: ${activeFilters.companyTag}`);
    if (activeFilters.source) parts.push(`Source: ${activeFilters.source === 'glorri' ? 'Glorri' : 'JS.AZ'}`);
    
    if (parts.length > 0) {
        filterText.textContent = parts.join(' | ');
        filterBadge.classList.remove('hidden');
    } else {
        filterBadge.classList.add('hidden');
    }
}

// Rendering Details
function renderTechExplorer() {
    if (!allTechsContainer) return;
    
    let displayTechs = availableTechs;
    if (activeFilters.techInput) {
        displayTechs = availableTechs.filter(t => t.name.toLowerCase().includes(activeFilters.techInput));
    }

    allTechsContainer.innerHTML = displayTechs.map(tech => {
        const isActive = activeFilters.tech === tech.name;
        // Tailwind classes for tags
        const baseClasses = "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium cursor-pointer transition-colors border";
        const activeClasses = "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 border-blue-200 dark:border-blue-700 ring-2 ring-blue-500 ring-offset-1 dark:ring-offset-gray-800";
        const inactiveClasses = "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600";
        
        return `
            <div class="${baseClasses} ${isActive ? activeClasses : inactiveClasses}" 
                 onclick="setTechFilter('${tech.name.replace(/'/g, "\\'")}')">
                ${escapeHtml(tech.name)} <span class="ml-1.5 opacity-60 text-xs">(${tech.count})</span>
            </div>
        `;
    }).join('');
}

function renderCompanyExplorer() {
    if (!allCompaniesContainer) return;
    
    let displayCompanies = availableCompanies;
    if (activeFilters.companyInput) {
        displayCompanies = availableCompanies.filter(c => c.name.toLowerCase().includes(activeFilters.companyInput));
    }
    
    allCompaniesContainer.innerHTML = displayCompanies.map(comp => {
        const isActive = activeFilters.companyTag === comp.name;
        // Tailwind classes for company tags
        const baseClasses = "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium cursor-pointer transition-colors border";
        const activeClasses = "bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-100 border-purple-200 dark:border-purple-700 ring-2 ring-purple-500 ring-offset-1 dark:ring-offset-gray-800";
        const inactiveClasses = "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600";

        return `
            <div class="${baseClasses} ${isActive ? activeClasses : inactiveClasses}" 
                 onclick="setCompanyTagFilter('${comp.name.replace(/'/g, "\\'")}')">
                ${escapeHtml(comp.name)} <span class="ml-1.5 opacity-60 text-xs">(${comp.count})</span>
            </div>
        `;
    }).join('');
}

function renderJobs(filteredJobs) {
    const container = document.getElementById('jobs-grid');
    const titleEl = document.getElementById('jobs-title');
    
    const totalPages = Math.ceil(filteredJobs.length / itemsPerPage) || 1;
    if (currentPage > totalPages) currentPage = totalPages;
    // ensure current page is at least 1, but if matching jobs is 0, it doesn't matter much
    if (currentPage < 1) currentPage = 1; 

    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageJobs = filteredJobs.slice(start, end);
    
    if (titleEl) titleEl.textContent = `Jobs (${filteredJobs.length})`;
    
    // Pagination UI
    pageInfoEl.textContent = `Page ${currentPage} of ${totalPages}`;
    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage >= totalPages;
    // Update opacity for disabled buttons
    prevPageBtn.style.opacity = prevPageBtn.disabled ? '0.5' : '1';
    nextPageBtn.style.opacity = nextPageBtn.disabled ? '0.5' : '1';
    
    if (pageJobs.length === 0) {
        container.innerHTML = '<div class="col-span-full py-12 text-center text-gray-500 dark:text-gray-400">No jobs match your filters.</div>';
        return;
    }
    
    container.innerHTML = pageJobs.map(job => {
        const sourcesHtml = job.sources.map(src => `
            <div class="flex items-center gap-1.5 px-2 py-1 rounded-full bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600" title="${src.name}">
                <img src="${src.icon}" class="w-3.5 h-3.5 rounded-sm" alt="">
                <span class="font-medium text-gray-500 dark:text-gray-400 hidden sm:inline text-[10px]">${src.name}</span>
            </div>
        `).join('');
        
        return `
        <a href="/job/${job.slug}" class="block p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 group flex flex-col h-full">
            <div class="flex justify-between items-start mb-3">
                <h3 class="text-lg font-bold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 line-clamp-2 leading-tight" title="${escapeHtml(job.title)}">${escapeHtml(job.title)}</h3>
                <span class="text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap ml-3 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">${job.created_at || ''}</span>
            </div>
            
            <div class="flex items-center gap-2 mb-4 text-gray-700 dark:text-gray-300 text-sm font-medium">
                ${job.company_logo ? 
                    `<img src="${job.company_logo}" alt="" class="w-6 h-6 object-contain bg-white rounded-md p-0.5 border border-gray-100">` : 
                    `<div class="w-6 h-6 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-md">
                        <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                    </div>`} 
                <span class="truncate">${escapeHtml(job.company)}</span>
            </div>
            
            <div class="flex flex-wrap gap-2 mt-auto mb-3">
                ${job.technologies.slice(0, 5).map(tech => {
                    const isActive = (activeFilters.tech && tech.toLowerCase() === activeFilters.tech.toLowerCase()) ||
                                     (activeFilters.search && tech.toLowerCase().includes(activeFilters.search));
                    return `<span class="inline-flex items-center px-2.5 py-1 rounded text-xs font-medium border ${isActive ? 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-200 dark:border-yellow-700' : 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 group-hover:bg-white dark:group-hover:bg-gray-600 transition-colors'}">${escapeHtml(tech)}</span>`;
                }).join('')}
                ${job.technologies.length > 5 ? `<span class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-50 text-gray-500 border border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700">+${job.technologies.length - 5}</span>` : ''}
            </div>
            <div class="flex justify-between items-center mt-2 pt-3 border-t border-gray-100 dark:border-gray-700 group-hover:border-gray-200 dark:group-hover:border-gray-600 transition-colors text-xs text-gray-400 dark:text-gray-500">
                <div class="flex flex-wrap gap-1.5 max-w-[70%]">
                    ${sourcesHtml}
                </div>
                <span class="inline-block bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800 px-3 py-1 rounded-md font-medium text-xs group-hover:bg-blue-600 group-hover:text-white dark:group-hover:bg-blue-500 dark:group-hover:text-white transition-all whitespace-nowrap">Details</span>
            </div>
        </a>
    `;}).join('');
}

// Listeners for Pagination
prevPageBtn.addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        renderView();
    }
});

nextPageBtn.addEventListener('click', () => {
    const totalPages = Math.ceil(filteredJobsCount / itemsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        renderView();
    }
});

toggleAllTechsBtn.addEventListener('click', () => {
    const container = allTechsContainer;
    const filterWrapper = document.getElementById('tech-filter-wrapper');
    const isHidden = container.classList.contains('hidden');
    
    container.classList.toggle('hidden');
    if (filterWrapper) filterWrapper.classList.toggle('hidden');
    
    toggleAllTechsBtn.textContent = isHidden ? 'Hide All' : 'Show All';
});

toggleAllCompaniesBtn.addEventListener('click', () => {
    const container = allCompaniesContainer;
    const filterWrapper = document.getElementById('company-filter-wrapper');
    const isHidden = container.classList.contains('hidden');
    
    container.classList.toggle('hidden');
    if (filterWrapper) filterWrapper.classList.toggle('hidden');
    
    toggleAllCompaniesBtn.textContent = isHidden ? 'Hide All' : 'Show All';
});

function handleChartClick(event, elements, chart) {
    if (elements.length > 0) {
        const index = elements[0].index;
        setTechFilter(chart.data.labels[index]);
    }
}

function renderCharts(languages) {
    const colors = getChartColors();
    const labels = languages.map(l => l.name);
    const values = languages.map(l => l.count);
    
    const ctxBar = document.getElementById('barChart').getContext('2d');
    if (barChart) {
        barChart.data.labels = labels;
        barChart.data.datasets[0].data = values;
        barChart.update();
    } else {
        barChart = new Chart(ctxBar, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{ label: 'Mentions', data: values, backgroundColor: palette[0], borderRadius: 4 }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                onClick: (e, els) => handleChartClick(e, els, barChart),
                plugins: { legend: { display: false }, tooltip: getTooltipConfig() },
                scales: {
                    x: { grid: { display: false }, ticks: { color: colors.text } },
                    y: { grid: { color: colors.grid, drawBorder: false }, ticks: { color: colors.text, stepSize: 1 } }
                }
            }
        });
    }
}

function updateChartTheme() {
    if (!barChart) return;
    const colors = getChartColors();
    [barChart].forEach(chart => {
        if (chart.options.scales) {
            chart.options.scales.x.ticks.color = colors.text;
            chart.options.scales.y.ticks.color = colors.text;
            chart.options.scales.y.grid.color = colors.grid;
        }
        if (chart.options.plugins.legend) chart.options.plugins.legend.labels.color = colors.text;
        chart.options.plugins.tooltip = getTooltipConfig();
        chart.update();
    });
}

function getTooltipConfig() {
    const colors = getChartColors();
    return { backgroundColor: colors.tooltipBg, titleColor: colors.tooltipText, bodyColor: colors.tooltipText, borderColor: colors.tooltipBorder, borderWidth: 1, padding: 10 };
}

function escapeHtml(text) {
    if (!text) return "";
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize
loadData();

// Mobile Sidebar Toggle Logic
document.addEventListener('DOMContentLoaded', () => {
    const filterSidebar = document.getElementById('filters-sidebar');
    const mobileFilterBtn = document.getElementById('mobile-filter-btn');
    const closeSidebarBtn = document.getElementById('close-sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');

    if (filterSidebar && mobileFilterBtn && closeSidebarBtn && sidebarOverlay) {
        function openSidebar() {
            filterSidebar.classList.remove('translate-x-full');
            sidebarOverlay.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        }

        function closeSidebar() {
            filterSidebar.classList.add('translate-x-full');
            sidebarOverlay.classList.add('hidden');
            document.body.style.overflow = '';
        }

        mobileFilterBtn.addEventListener('click', openSidebar);
        closeSidebarBtn.addEventListener('click', closeSidebar);
        sidebarOverlay.addEventListener('click', closeSidebar);
    }
});
