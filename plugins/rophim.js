// =============================================================================
// VAAPP Plugin - Rophim Fake (Bản vá chuẩn hóa theo cấu trúc Core mới nhất)
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "rophim",          
        "name": "RophimFake",
        "description": "Nguồn xem phim PhimVN2Y ổn định",
        "version": "1.3",             
        "baseUrl": "https://phimvn2y.com",
        "iconUrl": "https://raw.githubusercontent.com/youngbi/repo/main/plugins/kkphim.png", 
        "isEnabled": true,
        "type": "MOVIE"
    });
}

function getHomeSections() {
    return JSON.stringify([
        { "slug": "phim-le", "title": "Phim Lẻ Mới", "type": "Horizontal" },
        { "slug": "phim-bo", "title": "Phim Bộ Mới", "type": "Horizontal" },
        { "slug": "phim-18", "title": "Phim 18+", "type": "Horizontal" },
        { "slug": "phim-hai", "title": "Phim Hài", "type": "Horizontal" },
        { "slug": "hoat-hinh", "title": "Phim Hoạt Hình", "type": "Horizontal" },
        { "slug": "hanh-dong", "title": "Phim Hành Động", "type": "Horizontal" },
        { "slug": "kinh-di", "title": "Phim Kinh Dị", "type": "Grid" }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { "name": "Hành Động", "slug": "hanh-dong" },
        { "name": "Kinh Dị", "slug": "kinh-di" },
        { "slug": "phim-18", "name": "Phim 18+"},
        { "slug": "phim-hai", "name": "Phim Hài"},
        { "slug": "chien-tranh", "name": "Phim Chiến Tranh"},
        { "slug": "hoat-hinh", "name": "Phim Hoạt Hình"},
        { "slug": "vien-tuong", "name": "Phim Viễn Tưởng"}
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
    try {
        var filters = JSON.parse(filtersJson || "{}");
        var page = filters.page || 1;
        
        // ĐÃ SỬA: Nếu là trang 1 thì giữ nguyên, từ trang 2 trở đi chuyển sang cấu trúc /page/X/ để tương thích hệ thống rewrite URL của web
        if (page > 1) {
            // Thử cấu trúc phổ biến nhất của các web phim hiện tại: danh-muc/page/2
            return "https://phimvn2y.com/" + slug + "/?page=" + page;
        }
        
        // Trang 1 mặc định
        return "https://phimvn2y.com/" + slug;
    } catch (e) {
        return "https://phimvn2y.com/" + slug;
    }
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

        // --- KHU VỰC SỬA LẠI PHÂN TRANG CHUẨN ---
        var currentPage = 1;
        var totalPages = 1;

        if (html) {
            // 1. Tìm giá trị đang hiển thị (Trang hiện tại) trong thẻ input v-form-control
            var currentMatch = html.match(/class="[^"]*v-form-control[^"]*"[^>]*value="(\d+)"/i) 
                            || html.match(/value="(\d+)"[^>]*class="[^"]*v-form-control[^"]*"/i);
            
            // 2. Tìm giá trị max (Tổng số trang) trong thẻ input v-form-control
            var maxMatch = html.match(/class="[^"]*v-form-control[^"]*"[^>]*max="(\d+)"/i)
                        || html.match(/max="(\d+)"[^>]*class="[^"]*v-form-control[^"]*"/i);

            if (currentMatch && currentMatch[1]) {
                currentPage = parseInt(currentMatch[1], 10);
            }
            if (maxMatch && maxMatch[1]) {
                totalPages = parseInt(maxMatch[1], 10);
            }
        }
        // ----------------------------------------

        return JSON.stringify({
            "items": items,
            "pagination": { 
                "currentPage": currentPage, 
                "totalPages": totalPages,    
                "totalItems":  24 * totalPages,
                "itemsPerPage": 24
            }
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
            var movieSlug = _movieObj.slug || "";
            
            var descMatch = html.match(/class="[^"]*child-box[^"]*"[\s\S]*?class="[^"]*child-content[^"]*"[\s\S]*?class="[^"]*movie-seo-article[^"]*"[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/i);
            var description = descMatch ? descMatch[1].replace(/<[^>]*>/g, '').trim() : "Đang cập nhật...";
            
            var appServers = [];

            if (Array.isArray(_movieObj.episodes)) {
                for (var s = 0; s < _movieObj.episodes.length; s++) {
                    var rawServer = _movieObj.episodes[s];
                    var serverName = rawServer.server_name || rawServer.name || ("Server " + (s + 1));
                    var episodes = [];

                    if (Array.isArray(rawServer.server_data)) {
                        for (var i = 0; i < rawServer.server_data.length; i++) {
                            var ep = rawServer.server_data[i];
                            
                            var epName = ep.name ? "Tập " + ep.name : "Tập " + (i + 1);
                            var epSlug = ep.slug || String(i + 1);
                            
                            // LOGIC MỚI: Sinh ra URL trang xem phim hoàn chỉnh để App thực hiện Request GET tiếp theo
                            // Kết quả: https://phimvn2y.com/dau-la-dai-luc-2-tuyet-the-duong-mon-tap-01.html
                            var chapterPageUrl = "https://phimvn2y.com/" + movieSlug + "-" + epSlug + ".html";

                            episodes.push({
                                "id": chapterPageUrl,  // Gán link trang tập vào id để hệ thống Core tải mã nguồn trang đó
                                "slug": epSlug,
                                "name": epName,
                                "url": chapterPageUrl
                            });
                        }
                    }

                    if (episodes.length > 0) {
                        appServers.push({
                            "name": serverName.trim(),
                            "episodes": episodes
                        });
                    }
                }
            }

            if (appServers.length === 0) {
                appServers.push({
                    "name": "Nguồn Dự Phòng",
                    "episodes": [{ "id": "full", "slug": "full", "name": "Full", "url": "https://phimvn2y.com" }]
                });
            }

            return JSON.stringify({
                "id": movieSlug || title.toLowerCase().replace(/[^a-z0-9]/g, '-'),
                "title": title,
                "posterUrl": posterUrl,
                "backdropUrl": posterUrl,
                "description": description,
                "year": _movieObj.year || "2026",
                "rating": 10,
                "quality": "HD",
                "servers": appServers 
            });
        }

        return JSON.stringify({ "id": "error-object", "title": "Lỗi khởi tạo Object dữ liệu phim", "servers": [] });

    } catch (error) {
        return JSON.stringify({ "id": "error", "title": "Lỗi Thực Thi Hệ Thống: " + error.message, "servers": [] });
    }
}

/**
 * ĐÃ SỬA: Phân giải mã HTML của trang xem phim riêng biệt để bóc link .m3u8 cuối cùng ẩn bên trong
 */
function parseDetailResponse(html) {
    try {
        var videoUrl = "";

        if (html && typeof html === 'string') {
            // Bước 1: Quét tìm tất cả các chuỗi có định dạng link kết thúc bằng .m3u8 trong HTML/Script của trang xem phim mới tải
            var m3u8Match = html.match(/(https?:\/\/[^"']+\.m3u8[^"']*)/i);
            
            if (m3u8Match) {
                videoUrl = m3u8Match[1].trim();
            } else {
                // Bước dự phòng: Nếu không tìm thấy, thử tìm link embed player (như player.phimapi.com...)
                var embedMatch = html.match(/(https?:\/\/player[^"']+\/player\/\?url=[^"']+)/i);
                if (embedMatch) {
                    videoUrl = decodeURIComponent(embedMatch[1].split('url=')[1]);
                } else if (html.startsWith("http://") || html.startsWith("https://")) {
                    videoUrl = html.trim();
                }
            }
        }

        return JSON.stringify({
            "url": videoUrl, 
            "headers": {
                "Referer": "https://phimvn2y.com/", 
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            },
            "subtitles": []
        });

    } catch (e) {
        return JSON.stringify({ "url": "", "headers": {} });
    }
}

function parseCategoriesResponse(html) { return "[]"; }
function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html) { return "[]"; }
