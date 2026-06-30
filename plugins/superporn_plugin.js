// =============================================================================
// VAAPP Plugin - SUPERPORN (Bản vá chuẩn hóa theo cấu trúc Core mới nhất)
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "superporn",          
        "name": "SuperPorn",
        "description": "XXX Hay",
        "version": "1.2",             
        "baseUrl": "https://www.superporn.com",
        "iconUrl": "https://superporn.com/favicon.ico", 
        "isEnabled": true,
        "isAdult": true,
        "type": "VIDEO",
        "playerType": "auto"
    });
}
/*
{ "slug": "phim-sex-hiep-dam", "title": "Hiếp Dâm", "type": "Horizontal" },
        { "slug": "phim-sex-loan-luan", "title": "Loạn Luân", "type": "Horizontal" },
        { "slug": "phim-sex-vung-trom", "title": "Vụng Trộm", "type": "Horizontal" }, // ĐÃ SỬA: Thêm dấu phẩy hợp lệ ở đây
        { "slug": "phim-sex-chau-au", "title": "Châu Âu", "type": "Horizontal" },
        { "slug": "phim-sex-trung-quoc", "title": "Trung Quốc", "type": "Horizontal" }
    ]);
*/
function getHomeSections() {
    return JSON.stringify([
        { "slug": "big-tits", "title": "Vú Bự", "type": "Horizontal" },
        { "slug": "anal", "title": "Lỗ Nhị", "type": "Horizontal" },
        { "slug": "gangbang", "title": "Tập Thể", "type": "Horizontal" }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { "slug": "shemale", "name": "Shemale"},
        { "slug": "japanese", "name": "Gái Nhật"},
        { "slug": "cheating", "name": "Chơi Lén"},
        { "slug": "gay", "name": "Gay"},
        { "slug": "russian-porn", "name": "Gái Nga"},
        { "slug": "dad-and-daughter", "name": "Cha Con"},
        { "slug": "mom-and-son", "name": "Mẹ Con"}
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
            return "https://superporn.com/" + slug + "/" + page;
        }
        return "https://superporn.com/" + slug;
    } catch (e) {
        return "https://superporn.com/" + slug;
    }
}

function getUrlSearch(keyword, filtersJson) {
    return "https://www.superporn.com/search?q=" + encodeURIComponent(keyword);
}

function getUrlDetail(slug) {
    if (!slug) return "";
    if (slug.indexOf('http') === 0) return slug;
    return "https://superporn.com/" + slug;
}

function getUrlCategories() { return ""; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

// =============================================================================
// PARSERS
// =============================================================================
/*
<div class="thumb-video  ">
    <a href="https://www.superporn.com/video/hard-black-cock-for-tori-black" class="thumb-duracion">
    <img alt="Hard black cock for Tori Black" loading="lazy" class="lazy " src="https://img2.superporn.com/videos/146/14658/thumbs/thumbs_0012_custom_1678794635.1263.jpg" width="332" height="186" data-loaded="true">
    <span class="duracion">
    26:41
  </span>
*/
function parseListResponse(html) {
    try {
        var items = [];
        var cleanHtml = html.replace(/<!--[\s\S]*?-->/g,""); // Xóa comment[cite: 5]
        
        // Bóc chính xác thẻ <a> và thẻ <img> nằm bên trong cụm class="thumb-video"
        var regex = /div class="thumb-video[^>]*>[\s\S]*?href="([^"]+)"[\s\S]*?<img\s+alt="([^"]+)"[\s\S]*?<source srcset="(http[^"]+)"/gi;
        var match;
        
        while ((match = regex.exec(cleanHtml)) !== null) {
            var id = match[1].trim();
            var title = match[2].trim();
            var limg = match[3].trim();
            
            items.push({
                "id": id,          
                "title": title, 
                "posterUrl": limg,
                "backdropUrl": limg
            });
        }

        var currentPage = 1;
        var totalPages = 1;

        if (cleanHtml) {
            var currentMatch = cleanHtml.match(/btn-pagination--selected[^>]*>(\d+)<\/a>/i);
            var maxMatch = cleanHtml.match(/<a[^>]*>(\d+)<\/a>\s*<\/li>\s*<li[^>]*class="[^"]*next/i);

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
                "totalPages": 20,    
                "totalItems":  56 * totalPages,
                "itemsPerPage": 56
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

    var rmatch = html.match(/link\srel="canonical"[\s\S]*?href="([\s\S]*?)"/i);
    if (rmatch && rmatch[1]) { lurl = rmatch[1]; }

    rmatch = html.match(/meta\s+property="og:image"\s+content="([\s\S]*?)"/i);
    if (rmatch && rmatch[1]) { limg = rmatch[1]; }

    rmatch = html.match(/meta\s+property="og:title"\s+content="([\s\S]*?)"/i);
    if (rmatch && rmatch[1]) { lname = rmatch[1]; }

    rmatch = html.match(/<div\s+class="content">([\s\S]*?)<\/div>/i);
    if (rmatch && rmatch[1]) { ldes = rmatch[1]; }
     
    return JSON.stringify({
        id: lurl,
        title: lname,
        posterUrl: limg,
        backdropUrl: limg,
        description: ldes,
        servers: [
            {
                name: "Full",
                episodes: [
                    { id: lurl, name: "Full", slug: "" }
                ]
            }
        ],
        quality: "HD",
        year: 2026, // ĐÃ SỬA: Thay "????" bằng số nguyên để không lỗi ép kiểu
        rating: 8.0,
        status: "Full",
        duration: 0, // ĐÃ SỬA: Thay "????" bằng 0 đề phòng lỗi ép kiểu tương tự
        casts: "Diễn viên",
        director: "Đạo diễn",
        category: "18+"
    });
}

function parseDetailResponse(html) {
    try {
        var streamUrl = "";
        var rmatch = html.match(/<div\s+class="video-player mobile"[\s\S]*?iframe\s+src="([\s\S]*?)"/i);
        if (rmatch && rmatch[1]) {
            streamUrl = rmatch[1];
        }	
        var customJs = "var style = document.createElement('style');" +
            "style.innerHTML = '#playback { display: none !important; }';" +
            "document.head.appendChild(style);";

        return JSON.stringify({
            url: streamUrl,
            headers: {
                "Referer": "https://clbphimxua.com/",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Custom-Js": customJs
            }
        });
    } catch (error) {
        return JSON.stringify({ url: "", headers: {} });
    }
}

function parseCategoriesResponse(html) { return "[]"; }
function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html) { return "[]"; }
