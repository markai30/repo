// =============================================================================
// VAAPP Plugin - Rophim Fake (Bản vá chuẩn hóa theo cấu trúc Core mới nhất)
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "rophim",          
        "name": "RophimFake",
        "description": "Nguồn xem phim PhimVN2Y ổn định",
        "version": "1.6",             
        "baseUrl": "https://phimvn2y.com",
        "iconUrl": "https://raw.githubusercontent.com/youngbi/repo/main/plugins/kkphim.png", 
        "isEnabled": true,
        "type": "MOVIE"
    });
}

function getHomeSections() {
    return JSON.stringify([
        { "slug": "phim-le", "title": "Phim Lẻ Mới", "type": "Horizontal" },
        { "slug": "phim-bo", "title": "Phim Bộ Mới", "type": "Horizontal" }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { "name": "Hành Động", "slug": "hanh-dong" },
        { "name": "Kinh Dị", "slug": "kinh-di" }
    ]);
}

// ĐÃ SỬA: Đổi tên từ getFilterConfig thành getFilters theo chuẩn kkphim/ophim
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
    return "https://phimvn2y.com/" + slug;
}

function getUrlCategories() { return ""; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

// =============================================================================
// PARSERS (Đã chuẩn hóa chỉ nhận duy nhất 1 tham số html)
// =============================================================================

function parseListResponse(html) {
    try {
        var items = [];
        var regex = /class="sw-item"[^>]*data-title="([^"]+)"[\s\S]*?<a\s+href="([^"]+)"[^>]*class="v-thumbnail"[\s\S]*?<img\s+src="([^"]+)"/g;
        var match;
        
        while ((match = regex.exec(html)) !== null) {
            var cleanThumb = match[3].replace(/&amp;/g, '&'); 
            items.push({
                "id": match[2],          
                "title": match[1].trim(), 
                "posterUrl": cleanThumb,
                "backdropUrl": cleanThumb
            });
        }
        
        return JSON.stringify({
            "items": items,
            "pagination": { "currentPage": 1, "totalPages": 1 }
        });
    } catch (e) {
        return JSON.stringify({ "items": [], "pagination": { "currentPage": 1, "totalPages": 1 } });
    }
}

function parseSearchResponse(html) {
    return parseListResponse(html);
}

// ĐÃ SỬA: Chỉ nhận 1 tham số html theo đúng chuẩn lõi hệ thống
function parseMovieDetail(html) {
    try {
        var parts = html.split(/window\s*\.?\s*_\s*movie\s*=\s*(.*)/i);
        
        if (!parts || parts.length < 2) {
            return JSON.stringify({ "id": "error-split", "title": "Không tìm thấy vùng dữ liệu window._movie", "servers": [] });
        }

        var movieScriptMatch = parts[1];
        var _movieObj;
        eval("_movieObj = " + movieScriptMatch);

        if (_movieObj) {
            var title = _movieObj.title || "Chưa rõ tên phim";
            var posterUrl = _movieObj.poster || _movieObj.thumb || "";
            var descMatch = html.match(/class="[^"]*child-box[^"]*"[\s\S]*?class="[^"]*child-content[^"]*"[\s\S]*?class="[^"]*movie-seo-article[^"]*"[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/i);
        var description = descMatch ? descMatch[1].replace(/<[^>]*>/g, '').trim() : "Đang cập nhật...";
            
            var episodes = [];
            
            // ĐÃ SỬA: Đi đúng cây thư mục dữ liệu từ ảnh DevTools của bạn
            // Kiểm tra xem có mảng _movieObj.episodes và phần tử server đầu tiên không
            if (_movieObj.episodes && _movieObj.episodes[0] && Array.isArray(_movieObj.episodes[0].server_data)) {
                var rawEpisodes = _movieObj.episodes[0].server_data; // Trỏ thẳng vào mảng Array(159) như trong ảnh

                for (var i = 0; i < rawEpisodes.length; i++) {
                    var ep = rawEpisodes[i];
                    
                    var epName = ep.name ? "Tập " + ep.name : "Tập " + (i + 1);
                    var epSlug = ep.slug || String(i + 1);
                    
                    // Ưu tiên lấy link_m3u8, nếu không có thì fallback sang link_embed
                    var videoUrl = ep.link_m3u8 || ep.link_embed || ""; 

                    // Đẩy đủ 4 trường cốt lõi phục vụ Android Model Serialization của App
                    episodes.push({
                        "id": epSlug,
                        "slug": epSlug,
                        "name": epName,
                        "url": videoUrl
                    });
                }
            }

            if (episodes.length === 0) {
                episodes.push({ "id": "full", "slug": "full", "name": "Full", "url": "https://phimvn2y.com" });
            }

            return JSON.stringify({
                "id": _movieObj.slug || title.toLowerCase().replace(/[^a-z0-9]/g, '-'),
                "title": title,
                "posterUrl": posterUrl,
                "backdropUrl": posterUrl,
                "description": description,
                "year": _movieObj.year || "2026",
                "rating": 10,
                "quality": "HD",
                "servers": [
                    {
                        "name": "Nguồn Phim VN",
                        "episodes": episodes
                    }
                ]
            });
        }

        return JSON.stringify({ "id": "error-object", "title": "Lỗi khởi tạo Object dữ liệu phim", "servers": [] });

    } catch (error) {
        return JSON.stringify({ "id": "error", "title": "Lỗi Thực Thi Hệ Thống: " + error.message, "servers": [] });
    }
}





// ĐÃ SỬA: Chỉ nhận duy nhất 1 tham số html
function parseDetailResponse(html) {
    try {
        var activeEpRegex = /class="[^"]*item-ep[^"]*active[^"]*"[^>]*data-m3u8="([^"]+)"[^>]*data-embed="([^"]+)"/i;
        var match = html.match(activeEpRegex);
        
        var videoUrl = match ? (match[1] ? match[1].trim() : match[2].trim()) : "";

        if (!videoUrl) {
            var backupMatch = html.match(/(https?:\/\/[^"']+\.m3u8[^"']*)/i);
            videoUrl = backupMatch ? backupMatch[1] : "";
        }

        return JSON.stringify({
            "url": videoUrl, 
            "headers": {
                "Referer": "https://phimvn2y.com/", 
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            }
        });

    } catch (e) {
        return JSON.stringify({ "url": "", "headers": {} });
    }
}

function parseCategoriesResponse(html) { return "[]"; }
function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html) { return "[]"; }
