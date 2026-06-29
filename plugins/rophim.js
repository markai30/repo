// =============================================================================
// VAAPP Plugin - Rophim Fake (Bản vá chuẩn hóa theo cấu trúc Core mới nhất)
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "rophim",          
        "name": "RophimFake",
        "description": "Nguồn xem phim PhimVN2Y ổn định",
        "version": "1.9",             
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
        var titleMatch = html.match(/<h2[^>]*class="[^"]*heading-md media-name[^"]*"[^>]*>([\s\S]*?)<\/h2>/i);
        var title = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, '').trim() : "Chưa rõ tên phim";

        var posterMatch = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i);
        var posterUrl = posterMatch ? posterMatch[1] : "";

        var descMatch = html.match(/class="[^"]*child-box[^"]*"[\s\S]*?class="[^"]*child-content[^"]*"[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/i);
        var description = descMatch ? descMatch[1].replace(/<[^>]*>/g, '').trim() : "Đang cập nhật...";

        var episodes = [];
        var checkedUrls = {}; 

        // BƯỚC 1: Tìm vị trí của id="episodes-chunked"
        var startIndex = html.indexOf('id="episodes-chunked"');
        
        if (startIndex !== -1) {
            // Cắt từ id="episodes-chunked" cho đến hết chuỗi html (để đảm bảo ôm trọn hàng trăm thẻ a)
            var chunkedHtml = html.substring(startIndex); 

            // BƯỚC 2: Dùng Regex quét mọi thẻ <a> có class="item" nằm trong vùng này
            // Thay vì dùng [\s\S]*? dễ bị nuốt chuỗi, ta ép Regex quét qua các cụm nội dung bên trong cho đến khi đụng thẻ </a> kế cận.
            var itemRegex = /<a\s+href="([^"]+)"[^>]*class="[^"]*item[^"]*"[^>]*>([\s\S]*?)<\/a>/g;
            var match;

            while ((match = itemRegex.exec(chunkedHtml)) !== null) {
                var epUrl = match[1].trim();       // Lấy href của tập phim
                var itemInnerHtml = match[2];     // Toàn bộ phần ruột bên trong thẻ <a> đó

                if (epUrl && !checkedUrls[epUrl]) {
                    checkedUrls[epUrl] = true;

                    // BƯỚC 3: Quét lấy tên tập ở ep-sort flex-shrink-0 trong phần ruột vừa tách riêng
                    var nameMatch = itemInnerHtml.match(/class="[^"]*ep-sort flex-shrink-0[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
                    var epName = nameMatch ? nameMatch[1].replace(/<[^>]*>/g, '').trim() : "Tập";

                    episodes.push({
                        "id": epUrl,
                        "slug": epUrl,
                        "name": epName,
                        "url": epUrl
                    });
                }
            }
        }

        if (episodes.length === 0) {
            episodes.push({ 
                "id": "full",
                "slug": "full",
                "name": "Full", 
                "url": "https://phimvn2y.com" 
            });
        }

        return JSON.stringify({
            "id": title.toLowerCase().replace(/[^a-z0-9]/g, '-'),
            "title": title,
            "posterUrl": posterUrl,
            "backdropUrl": posterUrl,
            "description": description,
            "year": "2026",
            "rating": 10,
            "quality": "HD",
            "servers": [
                {
                    "name": "Nguồn Phim VN",
                    "episodes": episodes
                }
            ]
        });

    } catch (error) {
        return JSON.stringify({ "id": "error", "title": "Lỗi cấu trúc", "servers": [] });
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
