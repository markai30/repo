// =============================================================================
// VAAPP Plugin - Xhamster (Bản vá chuẩn hóa theo cấu trúc Core mới nhất)
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "xhamster",          
        "name": "Xhamster",
        "description": "XXX Hay",
        "version": "2.0",             
        "baseUrl": "https://greenxh.today",
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
            return "https://greenxh.today/" + slug + "/" + page;
        }
        return "https://greenxh.today/" + slug;
    } catch (e) {
        return "https://greenxh.today/" + slug;
    }
}

function getUrlSearch(keyword, filtersJson) {
    return "https://greenxh.today/search/" + encodeURIComponent(keyword);
}

function getUrlDetail(slug) {
    if (!slug) return "";
    if (slug.indexOf('http') === 0) return slug;
    return "https://greenxh.today/" + slug;
}

function getUrlCategories() { return ""; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

// =============================================================================
// PARSERS
// =============================================================================

function parseListResponse(html) {
    try {
        // ĐÃ SỬA: Sửa Regex chính, chỉ quét đến hết thẻ <a> để lấy thông tin cơ bản, tránh bị bẫy nuốt item
        var items = [];
        
        // 1. Tách chuỗi HTML thành từng khối item nhỏ trước
        // Cách này giúp cô lập lỗi: nếu 1 item bị thiếu ảnh, nó chỉ lỗi item đó chứ không nuốt luôn các item phía sau.
        var itemRegex = /thumb-list__item[\s\S]*?(?=(?:thumb-list__item|$))/gi;
        var itemMatches = html.match(itemRegex) || [];

        for (var i = 0; i < itemMatches.length; i++) {
            var itemHtml = itemMatches[i];
            
            // Tìm các thuộc tính riêng lẻ trong khối item đó (không sợ bị sai thứ tự xuất hiện)
            var hrefMatch = itemHtml.match(/href="([^"]+)"/i);
            var labelMatch = itemHtml.match(/aria-label="([^"]+)"/i);
            var srcMatch = itemHtml.match(/img[\s\S]*?src="([^"]+)"/i);

            if (hrefMatch && labelMatch && srcMatch) {
                var limg = srcMatch[1].trim();
                items.push({
                    "id": hrefMatch[1].trim(),          
                    "title": labelMatch[1].trim(), 
                    "posterUrl": limg, 
                    "backdropUrl": limg
                });
            }
        }

        // 2. Tối ưu phần lấy Pagination
        var currentPage = 1;
        var totalPages = 1;

        // Dùng cụm ngoặc tròn ([^>]+) thay vì [\s\S]*? để Regex chạy nhanh hơn, không bị backtracking quá đà
        var currentMatch = html.match(/page-button-link--active[^>]*>(\d+)/i);
        var maxMatch = html.match(/page-limit-button--right[^>]*page-button-link[^>]*>(\d+)/i);

        if (currentMatch) totalPages = currentPage = parseInt(currentMatch[1], 10);
        if (maxMatch) totalPages = parseInt(maxMatch[1], 10);

        return JSON.stringify({
            "items": items,
            "pagination": { 
                "currentPage": currentPage, 
                "totalPages": 100, // ĐÃ SỬA: Thay vì fix cứng 10, ta dùng biến totalPages vừa tìm được
                "totalItems": 46 * totalPages,
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
                "Referer": "https://greenxh.today/",
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
