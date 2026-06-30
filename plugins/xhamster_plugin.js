// =============================================================================
// VAAPP Plugin - Xhamster (Bản vá chuẩn hóa theo cấu trúc Core mới nhất)
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "xhamster",          
        "name": "Xhamster",
        "description": "XXX Hay",
        "version": "1.0",             
        "baseUrl": "https://xhamster.com",
        "iconUrl": "https://static.cdnsolutions.media/xh-desktop/images/favicon/favicon-v2-256x256.ico", 
        "isEnabled": true,
        "isAdult": true,
        "type": "VIDEO",
        "playerType": "embed"
    });
}
/*
{ "slug": "phim-sex-hiep-dam", "title": "Hiếp Dâm", "type": "Horizontal" },
        { "slug": "phim-sex-loan-luan", "title": "Loạn Luân", "type": "Horizontal" },
        { "slug": "phim-sex-vung-trom", "title": "Vụng Trộm", "type": "Horizontal" }, // ĐÃ SỬA: Thêm dấu phẩy hợp lệ ở đây
        { "slug": "phim-sex-chau-au", "title": "Châu Âu", "type": "Horizontal" },
        { "slug": "phim-sex-trung-quoc", "title": "Trung Quốc", "type": "Horizontal" }
    ]); https://xhamster.com/categories/vietnamese
*/
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
        // ĐÃ SỬA: Chỉ bóc cụm nội dung bên trong thẻ <img> để không bị bẫy mất item không có data-src
        // <a class="video-thumb__image-container role-pop thumb-image-container ist-trigger" data-role="thumb-link" href="https://xhamster.com/videos/old-vietnamese-couple-xhrKa7y" data-previewvideo="https://thumb-v6.cdnsolutions.media/a/jxVbbBQw9-aB339QzQ2MyQ/019/414/846/526x298.94.3.5.t.av1.mp4" data-previewvideo-fallback="https://thumb-v6.cdnsolutions.media/a/Ygw_noJSK_0aF8BdDaim_Q/019/414/846/526x298.94.3.5.t.mp4" aria-label="old vietnamese couple">
        
        var regex = /class="video-thumb__image-container[\s\S]*?data-role="thumb-link"[\s\S]*?href="([\s\S]*?)"[\s\S]*?data-previewvideo="([\s\S]*?)"[\s\S+]*?aria-label="([\s\S]*?)"/i;
        var match;
        
        while ((match = regex.exec(html)) !== null) {
            var title = match[3].trim();
            var id = match[1].trim();
            var imgTagContent = match[2];
            items.push({
                "id": id,          
                "title": title, 
                "posterUrl": imgTagContent,
                "backdropUrl": imgTagContent
            });
        }

        var currentPage = 1;
        var totalPages = 1;

        if (html) {
            var currentMatch = html.match(/page-button-link--active"[\s\S]*?>(\d+)<\/a>/i);
            // <div class="page-limit-button page-limit-button--right"><div class="limit-gradient limit-gradient--right"></div> <!----><!----><a class="page-button-link " href="https://xhamster.com/categories/vietnamese/55">55</a><!----> <!----><!----></div>
            
            var maxMatch = html.match(/class="page-limit-button page-limit-button--right"[\s\S]*?page-button-link[\s\S]*?href="[\s\S]*?>(\d+)<\/a>/i);

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
        year: "????",
        rating: 8.0,
        status: "Full",
        duration: "????",
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