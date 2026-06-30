// =============================================================================
// VAAPP Plugin - Xhamster (Bản vá chuẩn hóa theo cấu trúc Core mới nhất)
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "xhamster",          
        "name": "Xhamster",
        "description": "XXX Hay",
        "version": "1.4",             
        "baseUrl": "https://xhamster.com",
        "iconUrl": "https://static.cdnsolutions.media/xh-desktop/images/favicon/favicon-v2-256x256.ico", 
        "isEnabled": true,
        "isAdult": true,
        "type": "VIDEO",
        "playerType": "embed"
    });
}

function getHomeSections() {
    return JSON.stringify([
        { "slug": "categories/vietnamese", "title": "Việt Nam", "type": "Grid" }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { "slug": "categories/anal", "name": "Lỗ Nhị"},
        { "slug": "categories/big-tits", "name": "Vú Bự"},
        { "slug": "categories/gangbang", "name": "Tập Thể"},
        { "slug": "categories/threesome", "name": "Chơi 3"},
        { "slug": "categories/russian", "name": "Gái Nga"},
        { "slug": "categories/hentai", "name": "Hentai"}
    ]);
}

function getFilters() {
    return JSON.stringify({
        "sort": [
            { "name": "Mới nhất", "value": "newest" }
        ]
    });
}

// =============================================================================
// URL GENERATION
// =============================================================================

function getUrlList(slug, filtersJson) {
    try {
        var filters = JSON.parse(filtersJson || "{}");
        var page = filters.page || 1;
        
        if (page > 1) {
            return "https://xhamster.com/" + slug + "/" + page;
        }
        return "https://xhamster.com/" + slug;
    } catch (e) {
        return "https://xhamster.com/" + slug;
    }
}

function getUrlSearch(keyword, filtersJson) {
    return "https://xhamster.com/search/" + encodeURIComponent(keyword);
}

function getUrlDetail(slug) {
    if (!slug) return "";
    if (slug.indexOf('http') === 0) return slug;
    return "https://xhamster.com/" + slug;
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
        // ĐÃ SỬA: Sửa Regex chính, chỉ quét đến hết thẻ <a> để lấy thông tin cơ bản, tránh bị bẫy nuốt item
        var regex = /class="video-thumb__image-container[\s\S]*?data-role="thumb-link"[\s\S]*?href="([^"]+)"[\s\S]*?data-previewvideo="([^"]+)"[^>]*aria-label="([^"]+)"([^>]*>)/gi;
        var match;
        
        while ((match = regex.exec(html)) !== null) {
            var id = match[1].trim();
            var title = match[3].trim();
            
            // ĐÃ SỬA: Dùng cơ chế quét phụ vùng an toàn để nhặt chính xác src ảnh
            var remainingHtml = html.substring(match.index, match.index + 1200);
            var imgMatch = remainingHtml.match(/<img[^>]*?src="([^"]+)"/i);
            var limg = imgMatch ? imgMatch[1] : "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=500";

            items.push({
                "id": id,          
                "title": title, 
                "posterUrl": limg, 
                "backdropUrl": limg
            });
        }

        var currentPage = 1;
        var totalPages = 1;

        if (html) {
            var currentMatch = html.match(/page-button-link--active"[\s\S]*?>(\d+)<\/a>/i);
            var maxMatch = html.match(/class="page-limit-button page-limit-button--right"[\s\S]*?page-button-link[^>]*>(\d+)<\/a>/i);

            if (currentMatch && currentMatch[1]) {
                currentPage = parseInt(currentMatch[1], 10);
            }
            if (maxMatch && maxMatch[1]) {
                totalPages = parseInt(maxMatch[1], 10);
            }
        }

        return JSON.stringify({
            "items": items,
            "pagination": { 
                "currentPage": currentPage, 
                "totalPages": totalPages,    
                "totalItems":  46 * totalPages,
                "itemsPerPage": 46
            }
        });
    } catch (e) {
        return JSON.stringify({ "items": [], "pagination": { "currentPage": 1, "totalPages": 1 } });
    }
}

function parseSearchResponse(html) {
    return parseListResponse(html);
}

function parseMovieDetail(html) {
    var lurl = "";
    var limg = "";
    var lname = "Đang cập nhật...";
    var ldes = "Không có mô tả.";

    var rmatch = html.match(/link\s+rel="canonical"\s+href="([^"]+)"/i);
    if (rmatch && rmatch[1]) { lurl = rmatch[1]; }

    rmatch = html.match(/meta\s+property="og:image"\s+content="([^"]+)"/i);
    if (rmatch && rmatch[1]) { limg = rmatch[1]; }

    rmatch = html.match(/meta\s+property="og:title"\s+content="([^"]+)"/i);
    if (rmatch && rmatch[1]) { lname = rmatch[1]; }

    rmatch = html.match(/meta\s+property="og:description"\s+content="([^"]+)"/i);
    if (rmatch && rmatch[1]) { ldes = rmatch[1]; }
     
    return JSON.stringify({
        id: lurl,
        title: lname,
        posterUrl: limg,
        backdropUrl: limg,
        description: ldes,
        servers: [
            {
                name: "Xhamster Stream",
                episodes: [
                    { id: lurl, name: "Full Video", slug: "full" }
                ]
            }
        ],
        quality: "HD",
        year: 2026,
        rating: 8.5,
        status: "Full",
        duration: "N/A",
        casts: "N/A",
        director: "N/A",
        category: "18+"
    });
}

function parseDetailResponse(html) {
    try {
        var streamUrl = "";
        
        // ĐÃ SỬA: Xhamster giấu link luồng trong biến cấu hình JSON initials.
        // Đoạn Regex dưới đây bóc tách toàn bộ Object cấu hình luồng phát của họ (hls hoặc mp4)
        var scriptMatch = html.match(/window\.initials\s*=\s*(\{[\s\S]*?\});/i) || html.match(/id="initials-script"[^>]*>(\{[\s\S]*?\})<\/script>/i);
        
        if (scriptMatch && scriptMatch[1]) {
            var jsonData = JSON.parse(scriptMatch[1]);
            // Tìm kiếm sâu trong cấu trúc object để lấy link m3u8 hoặc mp4 chất lượng cao nhất
            if (jsonData.videoModel && jsonData.videoModel.sources) {
                var sources = jsonData.videoModel.sources;
                streamUrl = sources.hls || sources.mp4 || "";
            }
        }
        
        // Dự phòng (Fallback) nếu hệ thống không parse được JSON, quét thô tìm file hls (.m3u8) công khai trong script
        if (!streamUrl) {
            var rawUrlMatch = html.match(/"(https?:\\?\/\\?\/[^"]+?\.m3u8[^"]*?)"/i);
            if (rawUrlMatch && rawUrlMatch[1]) {
                streamUrl = rawUrlMatch[1].replace(/\\/g, '');
            }
        }

        return JSON.stringify({
            url: streamUrl,
            headers: {
                "Referer": "https://xhamster.com/",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }
        });
    } catch (error) {
        return JSON.stringify({ url: "", headers: {} });
    }
}

function parseCategoriesResponse(html) { return "[]"; }
function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html) { return "[]"; }
