/**
 * Trade Gold Theme JavaScript with Google Sheets Search
 */

(function($) {
    'use strict';
    
    // ========================================
    // GOOGLE SHEETS SEARCH
    // ========================================
    
    window.allArticles = [];
    window.articlesLoaded = false;
    
    /**
     * โหลดข้อมูลจาก Google Apps Script API และกรองตาม Mode
     */
    async function loadArticlesData() {
        try {
            console.log('📥 Loading articles from Google Sheets...');
            
            // URL ของ Google Apps Script - เปลี่ยนเป็นของคุณเอง
            const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzTIMUcEl49nXGRMQk_L_TI1XFD28gUNyMt0IXKVWnDiPnV5GorIEEPMswp-Gsv0r1Bhw/exec';
            
            const response = await fetch(APPS_SCRIPT_URL);
            const data = await response.json();
            
            let articles = Array.isArray(data) ? data : (data.articles || []);
            articles = articles.filter(article => article.Title || article.Question);
            
            // 🎯 กรองตาม Mode (เหมือน index.html)
            const currentMode = localStorage.getItem('tradeSiteMode') || 'gold';
            const modePrefix = currentMode === 'silver' ? '#Silver' : '#Gold';
            
            window.allArticles = articles.filter(article => {
                const link = article.Link || '';
                return link.toLowerCase().startsWith(modePrefix.toLowerCase());
            });
            
            window.articlesLoaded = true;
            console.log(`✅ Articles loaded (${currentMode} mode):`, window.allArticles.length);
        } catch (error) {
            console.error('❌ Error loading articles:', error);
            window.articlesLoaded = true;
        }
    }
    
    /**
     * ค้นหาบทความจาก Google Sheets
     */
    function searchArticlesFromSheets(query) {
        if (!window.articlesLoaded || window.allArticles.length === 0) {
            return [];
        }
        
        // ไม่ค้นหา (focus) - แสดงแค่ 3 บทล่าสุด
        if (!query || query.trim() === '') {
            return window.allArticles.slice(0, 3);
        }
        
        // ค้นหา - แสดงทุกผลลัพธ์ที่เจอ (ไม่จำกัด)
        const lowerQuery = query.toLowerCase();
        const filtered = window.allArticles.filter(article => {
            const title = (article.Title || article.Question || '').toLowerCase();
            const excerpt = (article.Excerpt || article.Answer || '').toLowerCase();
            const category = (article.Category || article.หมวดหมู่ || '').toLowerCase();
            
            return title.includes(lowerQuery) || excerpt.includes(lowerQuery) || category.includes(lowerQuery);
        });
        
        // แสดงทุกผลลัพธ์ที่เจอ
        return filtered;
    }
    
    /**
     * แสดงผลลัพธ์การค้นหา (ไม่มี excerpt)
     */
    function displaySearchResults($searchDropdown, results, query) {
        const headerText = 'บทความล่าสุด';
        
        let html = '<div class="search-results-header">' + headerText + '</div>';
        html += '<div class="search-results">';
        
        results.forEach(function(article) {
            const title = article.Title || article.Question || 'ไม่มีหัวข้อ';
            const category = article.Category || article.หมวดหมู่ || 'ทั่วไป';
            const date = article.Date || '';
            const articleId = article.ID || article.id || article.No || article.no || 1;
            const image = article.Image || '';
            
            // สร้าง URL สำหรับบทความ
            const siteUrl = window.location.origin + '/trade-gold';
            const articleUrl = siteUrl + '/detail?id=' + articleId;
            
            // แปลง Google Drive URL
            let imageUrl = image;
            if (image && image.includes('drive.google.com')) {
                const match1 = image.match(/\/d\/(.*?)\//);
                const match2 = image.match(/id=(.*?)(&|$)/);
                let fileId = '';
                
                if (match1) fileId = match1[1];
                else if (match2) fileId = match2[1];
                
                if (fileId) {
                    imageUrl = 'https://lh3.googleusercontent.com/d/' + fileId;
                }
            }
            
            html += '<a href="' + articleUrl + '" class="search-result-item">';
            
            if (imageUrl) {
                html += '<img src="' + imageUrl + '" alt="' + title + '" class="search-result-thumb">';
            } else {
                const categoryEmojis = {
                    'การลงทุน': '💰', 'วิเคราะห์': '📊', 'ข่าวสาร': '📰',
                    'เทคนิค': '🔧', 'พื้นฐาน': '📚', 'ทั่วไป': '📖'
                };
                html += '<div class="search-result-icon">' + (categoryEmojis[category] || '📖') + '</div>';
            }
            
            html += '<div class="search-result-content">';
            html += '<div class="search-result-title">' + title + '</div>';
            html += '<div class="search-result-meta">';
            html += '<span class="search-result-category ' + category + '">' + category + '</span>';
            if (date) html += '<span class="search-result-date">' + date + '</span>';
            html += '</div>';
            html += '</div></a>';
        });
        
        html += '</div>';
        $searchDropdown.html(html).show();
        
        // Show clear button when dropdown is displayed
        $('#clearSearch').show();
    }
    
    // ========================================
    // SEARCH BAR SETUP
    // ========================================
    
    function setupSearchBar() {
        const $searchInput = $('#searchInput');
        const $searchDropdown = $('#searchDropdown');
        const $clearButton = $('#clearSearch');
        let searchTimeout;
        
        console.log('🔍 setupSearchBar called');
        console.log('Search Input:', $searchInput.length);
        console.log('Search Dropdown:', $searchDropdown.length);
        console.log('Clear Button:', $clearButton.length);
        
        if ($searchInput.length === 0) {
            console.error('❌ Search input not found!');
            return;
        }
        
        $searchInput.on('input', function() {
            const query = $(this).val().trim();
            console.log('📝 Input:', query);
            
            if (query.length > 0) {
                $clearButton.show();
            } else {
                $clearButton.hide();
            }
            
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(function() {
                performSearch(query, $searchDropdown);
            }, 300);
        });
        
        $searchInput.on('focus', function() {
            console.log('👆 Search bar focused');
            if (!window.articlesLoaded) {
                $searchDropdown.html('<div class="search-loading">กำลังโหลดข้อมูล...</div>').show();
                return;
            }
            performSearch('', $searchDropdown);
            // Show clear button when dropdown opens
            if ($searchDropdown.is(':visible')) {
                $clearButton.show();
            }
        });
        
        $clearButton.on('click', function() {
            console.log('🗑️ Clear button clicked');
            $searchInput.val('');
            $clearButton.hide();
            $searchDropdown.empty().hide();
        });
        
        $(document).on('click', function(e) {
            if (!$(e.target).closest('.search-bar-container').length) {
                $searchDropdown.empty().hide();
            }
        });
        
        $searchInput.on('keydown', function(e) {
            if (e.key === 'Enter') {
                const firstResult = $searchDropdown.find('.search-result-item').first();
                if (firstResult.length) window.location.href = firstResult.attr('href');
            }
        });
        
        console.log('✅ setupSearchBar complete');
    }
    
    function setupMobileSearch() {
        const $searchInput = $('#searchInputMobile');
        const $searchDropdown = $('#searchDropdownMobile');
        const $clearButton = $('#clearSearchMobile');
        let searchTimeout;
        
        $searchInput.on('input', function() {
            const query = $(this).val().trim();
            
            if (query.length > 0) {
                $clearButton.show();
            } else {
                $clearButton.hide();
            }
            
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(function() {
                performSearch(query, $searchDropdown);
            }, 300);
        });
        
        $searchInput.on('focus', function() {
            if (!window.articlesLoaded) {
                $searchDropdown.html('<div class="search-loading">กำลังโหลดข้อมูล...</div>').show();
                return;
            }
            performSearch('', $searchDropdown);
            // Show clear button when dropdown opens
            if ($searchDropdown.is(':visible')) {
                $clearButton.show();
            }
        });
        
        $clearButton.on('click', function() {
            $searchInput.val('');
            $clearButton.hide();
            $searchDropdown.empty().hide();
        });
        
        $(document).on('click', function(e) {
            if (!$(e.target).closest('.mobile-search').length) {
                $searchDropdown.empty().hide();
            }
        });
        
        $searchInput.on('keydown', function(e) {
            if (e.key === 'Enter') {
                const firstResult = $searchDropdown.find('.search-result-item').first();
                if (firstResult.length) window.location.href = firstResult.attr('href');
            }
        });
    }
    
    function performSearch(query, $searchDropdown) {
        console.log('🔎 performSearch called, query:', query);
        console.log('📊 articlesLoaded:', window.articlesLoaded);
        console.log('📚 Articles count:', window.allArticles.length);
        
        if (!window.articlesLoaded) {
            $searchDropdown.html('<div class="search-loading">กำลังโหลดข้อมูล...</div>').show();
            return;
        }
        
        const results = searchArticlesFromSheets(query);
        console.log('📋 Search results:', results.length);
        
        if (results.length === 0) {
            const noResultsMsg = query ? `ไม่พบบทความที่ตรงกับ "${query}"` : 'ไม่มีบทความ';
            $searchDropdown.html(`
                <div class="search-results-header">ไม่พบผลลัพธ์</div>
                <div class="search-no-results" style="padding: 2rem; text-align: center; color: #666;">${noResultsMsg}</div>
            `).show();
            return;
        }
        
        displaySearchResults($searchDropdown, results, query);
        console.log('✅ Results displayed');
    }
    
    // ========================================
    // THEME MANAGEMENT
    // ========================================
    
    const originalSetItem = localStorage.setItem;
    let isThemeChanging = false;
    
    localStorage.setItem = function(key, value) {
        if (key === 'tradeSiteMode' && !isThemeChanging) {
            console.warn('⚠️ External script tried to change tradeSiteMode - blocked!');
            return;
        }
        return originalSetItem.apply(this, arguments);
    };
    
    function initializeTheme() {
        const currentMode = localStorage.getItem('tradeSiteMode');
        if (!currentMode) {
            isThemeChanging = true;
            localStorage.setItem('tradeSiteMode', 'gold');
            isThemeChanging = false;
        }
        
        $('html, body').removeClass('silver-mode gold-mode');
        applyTheme();
    }
    
    function applyTheme() {
        const currentMode = localStorage.getItem('tradeSiteMode') || 'gold';
        const isSilverMode = currentMode === 'silver';
        const root = document.documentElement;
        
        $('html, body').removeClass('silver-mode gold-mode');
        
        if (isSilverMode) {
            $('html, body').addClass('silver-mode');
            root.style.setProperty('--gold-primary', '#AEB6C2');
            root.style.setProperty('--gold-light', '#AEB6C2');
            root.style.setProperty('--gold-dark', '#4EA0B7');
            root.style.setProperty('--silver', '#AEB6C2');
            root.style.setProperty('--silver-dark', '#4EA0B7');
            root.style.setProperty('--silver-light', '#4EA0B7');
            root.style.setProperty('--navy', '#1E3A8A');
            root.style.setProperty('--gold-bg', '#DCE1E8');
            root.style.setProperty('--silver-bg', '#DCE1E8');
        } else {
            $('html, body').addClass('gold-mode');
            root.style.setProperty('--gold-primary', '#FFD700');
            root.style.setProperty('--gold-light', '#FFD700');
            root.style.setProperty('--gold-dark', '#121212');
            root.style.setProperty('--navy', '#1E3A8A');
            root.style.setProperty('--navy-dark', '#172d69');
            root.style.setProperty('--navy-medium', '#1E40AF');
            root.style.setProperty('--gold-bg', '#F7F2EC');
            root.style.setProperty('--silver-bg', '#DCE1E8');
        }
        
        updateSwitchButtonText(isSilverMode);
    }
    
    function enforceTheme() {
        const currentMode = localStorage.getItem('tradeSiteMode') || 'gold';
        const isSilverMode = currentMode === 'silver';
        const hasCorrectClass = currentMode === 'silver' 
            ? $('html, body').hasClass('silver-mode')
            : $('html, body').hasClass('gold-mode');
        
        // Always update switch button text
        updateSwitchButtonText(isSilverMode);
        
        if (!hasCorrectClass) {
            applyTheme();
        }
    }
    
    function updateSwitchButtonText(isSilverMode) {
        $('#switchTargetText').text(isSilverMode ? 'Gold' : 'Silver');
    }
    
    function setupSwitchButton() {
        $('#switchWebButton').on('click', function() {
            const currentMode = localStorage.getItem('tradeSiteMode') || 'gold';
            isThemeChanging = true;
            localStorage.setItem('tradeSiteMode', currentMode === 'gold' ? 'silver' : 'gold');
            isThemeChanging = false;
            window.location.reload();
        });
    }
    
    // ========================================
    // HAMBURGER MENU
    // ========================================
    
    function setupHamburgerMenu() {
        const $hamburger = $('#hamburgerMenu');
        const $mobileMenu = $('#mobileMenuDropdown');
        const $mobileMenuClose = $('#mobileMenuClose');
        const $body = $('body');
        const $header = $('.header');
        
        // Toggle menu function
        function toggleMenu() {
            const isActive = $hamburger.hasClass('active');
            $hamburger.toggleClass('active');
            $mobileMenu.toggleClass('active');
            
            if (!isActive) {
                $body.css('overflow', 'hidden');
                if (!$('.mobile-menu-backdrop').length) {
                    $('<div class="mobile-menu-backdrop"></div>').insertAfter($header).on('click', function() {
                        toggleMenu();
                    });
                }
            } else {
                $body.css('overflow', '');
                $('.mobile-menu-backdrop').remove();
            }
        }
        
        // Hamburger button click
        $hamburger.on('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            toggleMenu();
        });
        
        // Close button click
        $mobileMenuClose.on('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            toggleMenu();
        });
        
        // Menu item click
        $('.mobile-menu a').on('click', function() {
            $hamburger.removeClass('active');
            $mobileMenu.removeClass('active');
            $body.css('overflow', '');
            $('.mobile-menu-backdrop').remove();
        });
        
        // Resize handler
        let resizeTimer;
        $(window).on('resize', function() {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(function() {
                if ($(window).width() > 768) {
                    $hamburger.removeClass('active');
                    $mobileMenu.removeClass('active');
                    $body.css('overflow', '');
                    $('.mobile-menu-backdrop').remove();
                }
            }, 250);
        });
    }
    
    // ========================================
    // STICKY NAVBAR
    // ========================================
    
    function setupStickyNavbar() {
        const $header = $('.header');
        if (!$header.length) return;
        
        $(window).on('scroll', function() {
            const currentScroll = $(this).scrollTop();
            if (currentScroll > 50) {
                $header.addClass('scrolled');
            } else {
                $header.removeClass('scrolled');
            }
        });
    }
    
    // ========================================
    // ACTIVE MENU HIGHLIGHTING
    // ========================================
    
    function setupActiveMenu() {
        console.log('🎯 Setting up active menu highlighting');
        
        // Get current URL path
        const currentPath = window.location.pathname;
        const currentUrl = window.location.href;
        
        // Find all menu links
        $('.nav-menu a').each(function() {
            const $link = $(this);
            const linkHref = $link.attr('href');
            
            // Remove active class from all links first
            $link.removeClass('active');
            
            // Check if this link matches current page
            if (linkHref) {
                // Exact match
                if (linkHref === currentUrl || linkHref === currentPath) {
                    $link.addClass('active');
                    console.log('✅ Active menu found (exact):', $link.text());
                }
                // Partial match (for pages like /trade-gold/home)
                else if (currentPath.includes(linkHref) && linkHref !== '/' && linkHref.length > 1) {
                    $link.addClass('active');
                    console.log('✅ Active menu found (partial):', $link.text());
                }
                // Home page special case
                else if ((currentPath === '/' || currentPath === '/trade-gold/' || currentPath === '/trade-gold') 
                         && (linkHref === '/' || linkHref.includes('/home'))) {
                    $link.addClass('active');
                    console.log('✅ Active menu found (home):', $link.text());
                }
            }
        });
    }
    
    // ========================================
    // INITIALIZATION
    // ========================================
    
    $(document).ready(function() {
        loadArticlesData(); // โหลดข้อมูลจาก Google Sheets
        initializeTheme();
        setupSearchBar();
        setupMobileSearch();
        setupStickyNavbar();
        setupSwitchButton();
        setupHamburgerMenu();
        setupActiveMenu();
        
        setInterval(enforceTheme, 100);
        
        // 🔄 โหลดบทความใหม่เมื่อเปลี่ยน Mode
        window.addEventListener('modeChanged', function() {
            console.log('🔄 Mode changed - reloading articles...');
            loadArticlesData();
        });
    });
    
})(jQuery);
