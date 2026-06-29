// =============================================================================
// VAAPP Plugin - Rophim Fake (Bản vá chuẩn tương thích hệ thống)
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "rophim_fixed_2026",          
        "name": "RophimFake",
        "description": "Nguồn xem phim PhimVN2Y ổn định",
        "version": "1.1.1",             
        "baseUrl": "https://phimvn2y.com",
        "iconUrl": "https://raw.githubusercontent.com/youngbi/repo/main/plugins/kkphim.png", // Dùng tạm icon sạch test
        "isEnabled": true,
        "type": "MOVIE"
    });
}

function getHomeSections() {
    return JSON.stringify([
        { slug: 'phim-le', title: 'Phim Lẻ Mới', type: 'Horizontal', path: 'danh-sach' },
        { slug: 'phim-bo', title: 'Phim Bộ Mới', type: 'Horizontal', path: 'danh-sach' },
        { slug: 'phim-chieu-rap', title: 'Phim Chiếu Rạp', type: 'Horizontal', path: 'danh-sach' },
        { slug: 'phim-long-tieng', title: 'Phim Lồng Tiếng', type: 'Horizontal', path: 'danh-sach' }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { name: 'Hành Động', slug: 'hanh-dong' },
        { name: 'Kinh Dị', slug: 'kinh-di' },
        { name: 'Viễn Tưởng', slug: 'vien-tuong' },
        { name: 'Khoa Học', slug: 'khoa-hoc' },
        { name: 'Hoạt Hình', slug: 'hoat-hinh' }
    ]);
}

function getFilterConfig() {
    return JSON.stringify({
        sort: [
            { name: 'Mới nhất', value: 'newest' }
        ]
    });
}

// =============================================================================
// URL GENERATION
// =============================================================================

function getUrlList(slug, filtersJson) {
    var filters = JSON.parse(filtersJson || "{}");
    var page = filters.page || 1;
    return "https://phimvn2y.com/" + slug + "?page=" + page;
}

function getUrlSearch(keyword, filtersJson) {
    return "https://phimvn2y.com/tim-kiem/?q=" + encodeURIComponent(keyword);
}

function getUrlDetail(slug) {
    if (!slug) return "";
    if (slug.indexOf('http') === 0) return slug;
    if (slug.indexOf('/') === 0) return "https://phimvn2y.com" + slug;
    return "https://phimvn2y.com/" + slug;
}

function getUrlCategories() { return ""; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

// =============================================================================
// PARSERS
// =============================================================================

function parseListResponse(html) {
    try {
        var items = [];
        var regex = /class="sw-item"[^>]*data-title="([^"]+)"[\s\S]*?<a\s+href="([^"]+)"[^>]*class="v-thumbnail"[\s\S]*?<img\s+src="([^"]+)"/g;
        var match;
        
        while ((match = regex.exec(html)) !== null) {
            var cleanThumb = match[3].replace(/&amp;/g, '&'); 
            items.push({
                id: match[2],          
                title: match[1].trim(), 
                posterUrl: cleanThumb,
                backdropUrl: cleanThumb
            });
        }
        
        return JSON.stringify({
            items: items,
            pagination: { currentPage: 1, totalPages: 1 }
        });
    } catch (e) {
        return JSON.stringify({ items: [], pagination: { currentPage: 1, totalPages: 1 } });
    }
}

function parseSearchResponse(html) {
    return parseListResponse(html);
}

// ĐÃ SỬA: Thêm tham số fallbackUrl cho đúng signature hệ thống của App
function parseMovieDetail(html, fallbackUrl) {
    try {
        var titleMatch = html.match(/<h2[^>]*class="[^"]*heading-md media-name[^"]*"[^>]*>([\s\S]*?)<\/h2>/i);
        var title = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, '').trim() : "Chưa rõ tên phim";

        var posterMatch = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i);
        var posterUrl = posterMatch ? posterMatch[1] : "";

        var descMatch = html.match(/class="[^"]*child-box[^"]*"[\s\S]*?class="[^"]*child-content[^"]*"[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/i);
        var description = descMatch ? descMatch[1].replace(/<[^>]*>/g, '').trim() : "Đang cập nhật...";

        var episodes = [];
        var checkedUrls = {}; 

        var epRegex = /class="[^"]*item-ep[^"]*"[^>]*data-m3u8="([^"]+)"[^>]*data-embed="([^"]+)"[\s\S]*?<div class="v-title">([\s\S]*?)<\/div>/g;
        var match;

        while ((match = epRegex.exec(html)) !== null) {
            var videoStreamUrl = match[1] ? match[1].trim() : match[2].trim();
            var epName = match[3].replace(/<[^>]*>/g, '').trim(); 

            if (videoStreamUrl && !checkedUrls[videoStreamUrl]) {
                checkedUrls[videoStreamUrl] = true;
                episodes.push({
                    id: videoStreamUrl, 
                    name: epName,
                    slug: videoStreamUrl
                });
            }
        }

        if (episodes.length === 0) {
            var canonicalMatch = html.match(/<link[^>]*rel="canonical"[^>]*href="([^"]+)"/i);
            var currentUrl = canonicalMatch ? canonicalMatch[1] : "full";
            episodes.push({ id: currentUrl, name: "Full", slug: "full" });
        }

        return JSON.stringify({
            id: title.toLowerCase().replace(/[^a-z0-9]/g, '-'),
            title: title,
            posterUrl: posterUrl,
            backdropUrl: posterUrl,
            description: description,
            year: 2026,
            rating: 10,
            quality: "HD",
            servers: [
                {
                    name: "Nguồn Phim VN",
                    episodes: episodes
                }
            ]
        });

    } catch (error) {
        return JSON.stringify({ id: "error", title: "Lỗi", servers: [] });
    }
}

// ĐÃ SỬA: Thêm tham số fallbackUrl cho chuẩn cấu trúc
function parseDetailResponse(html, fallbackUrl) {
    try {
        var activeEpRegex = /class="[^"]*item-ep[^"]*active[^"]*"[^>]*data-m3u8="([^"]+)"[^>]*data-embed="([^"]+)"/i;
        var match = html.match(activeEpRegex);
        
        var videoUrl = match ? (match[1] ? match[1].trim() : match[2].trim()) : "";

        if (!videoUrl) {
            var backupMatch = html.match(/(https?:\/\/[^"']+\.m3u8[^"']*)/i);
            videoUrl = backupMatch ? backupMatch[1] : (fallbackUrl || "");
        }

        return JSON.stringify({
            url: videoUrl, 
            headers: {
                "Referer": "https://phimvn2y.com/", 
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            }
        });

    } catch (e) {
        return JSON.stringify({ url: fallbackUrl || "", headers: {} });
    }
}

function parseCategoriesResponse(html) { return "[]"; }
function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html) { return "[]"; }
