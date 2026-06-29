// =============================================================================
// VAAPP Plugin - Rophim Fake (Bản vá chuẩn hóa theo cấu trúc Core mới nhất)
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "crophim",          
        "name": "crophim",
        "description": "Phim Online",
        "version": "1.3",             
        "baseUrl": "https://coon.pro/",
        "iconUrl": "https://coon.pro/wp-content/uploads/2026/04/phimhayok-io-fav.jpg", 
        "isEnabled": true,
        "type": "MOVIE"
    });
}

function getHomeSections() {
    return JSON.stringify([
        { "slug": "?s=&categories=motphim", "title": "Phim Mới", "type": "Grid" },
        { "slug": "?s=&categories=phim-le", "title": "Phim Lẻ", "type": "Grid" },
        { "slug": "?s=&categories=phim-ngan", "title": "Phim Ngắn", "type": "Grid" },
        { "slug": "?s=&categories=phim-bo", "title": "Phim Bộ", "type": "Grid" }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { "name": "Hành Động", "slug": "?s=&genres=hanh-dong" },
        { "name": "Kinh Dị", "slug": "?s=&genres=kinh-di" },
        { "name": "Phim 18+", "slug": "?s=&genres=phim-18" },
        { "name": "Phim Hài", "slug": "?s=&genres=hai-huoc" },
        { "name": "Phim Chiến Tranh", "slug": "?s=&genres=chien-tranh" },
        { "name": "Phim Hoạt Hình", "slug": "?s=&genres=hoat-hinh" },
        { "name": "Viễn Tưởng", "slug": "?s=&genres=vien-tuong" }
    ]);
}

// ĐÃ SỬA: Giữ nguyên getFilters() theo chuẩn hệ thống kkphim/ophim hiện tại của bạn
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
    return "https://coon.pro/page/" + page + "/" + slug;
}

function getUrlSearch(keyword, filtersJson) {
    return "https://coon.pro/?s=" + encodeURIComponent(keyword);
}

function getUrlDetail(slug) {
    if (!slug) return "";
    if (slug.indexOf('http') === 0) return slug;
    return "https://coon.pro/" + slug;
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
        var regex = /<div class="module-item-pic"><a\s+href="([^"]+)"\s+title="([^"]+)"[\s\S]*?<img[^>]*data-src="([^"]+)"/g;
        var match;
        
        while ((match = regex.exec(html)) !== null) {
            var cleanThumb = match[3].replace(/&amp;/g, '&'); 
            items.push({
                "id": match[1],          
                "title": match[2].trim(), 
                "posterUrl": cleanThumb,  
                "backdropUrl": cleanThumb
            });
        }
        
        var totalPages = 1; 
        var currentPage = 1; 

        if (html && html.indexOf('id="page"') > -1) {
            var pageSectionBox = html.match(/<div id="page">([\s\S]*?)<\/div>/i);
            if (pageSectionBox && pageSectionBox[1]) {
                var pageHtml = pageSectionBox[1];
                var currentMatch = pageHtml.match(/class="[^"]*page-current[^"]*">(\d+)</i);
                if (currentMatch) {
                    currentPage = parseInt(currentMatch[1], 10);
                }

                var pageNumbers = [];
                var pageRegex = />(\d+)<\/a>/g;
                var pageMatch;
                
                while ((pageMatch = pageRegex.exec(pageHtml)) !== null) {
                    pageNumbers.push(parseInt(pageMatch[1], 10));
                }

                if (pageNumbers.length > 0) {
                    totalPages = Math.max.apply(Math, pageNumbers);
                }
                if (totalPages < currentPage) {
                    totalPages = currentPage;
                }
            }
        }
        
        return JSON.stringify({
            "items": items,
            "pagination": { "currentPage": currentPage, "totalPages": totalPages }
        });
    } catch (e) {
        return JSON.stringify({ "items": [], "pagination": { "currentPage": 1, "totalPages": 1 } });
    }
}

function parseSearchResponse(html) {
    return parseListResponse(html);
}

/**
 * ĐÃ SỬA TOÀN BỘ: Thêm chốt chặn điều kiện (if-validate) chống crash ứng dụng mobile
 */
function parseMovieDetail(html) {
    try {
        var title = "Chưa rõ tên phim";
        var year = "????";
        var des = "Chưa có mô tả.";
        var img = "";
        var movieUrl = "";
        var episodes = [];

        // 1. Bóc tách Tiêu đề phim
        var titleMatch = html.split(/\<h1 class\=\"page-title\"\>([\s\S]*?)<\/h1>/);
        if (titleMatch && titleMatch[1]) {
            title = titleMatch[1].replace(/<[^>]*>/g, '').trim();
        }

        // 2. Bóc tách Năm phát hành
        var yearMatch = html.split(/\<div class\=\"tag-link\"\>([\s\S]*?)<\/div>/);
        if (yearMatch && yearMatch[1]) {
            year = yearMatch[1].replace(/<[^>]*>/g, '').trim();
        }

        // 3. Bóc tách Nội dung phim
        var desMatch = html.split(/\<div class\=\"video-info-item video-info-content\"\>([\s\S]*?)<\/div>/);
        if (desMatch && desMatch[1]) {
            des = desMatch[1].replace(/<[^>]*>/g, '').trim();
        }

        // 4. Bóc tách Ảnh đại diện
        var imgMatch = html.split(/\<div class\=\"module-item-pic\"\>[\s\S]*?<img[\s\S]*?src\=\"([\s\S]*?)\"/);
        if (imgMatch && imgMatch[1]) {
            img = imgMatch[1].replace(/<[^>]*>/g, '').trim();
        }

        // 5. Bóc tách Link tập phim cơ sở & xử lý Danh sách tập
        var urlMatch = html.split(/\<div class\=\"video-info-footer display\"\>[\s\S]*?<a[\s\S]*?href\=\"([\s\S]*?)\"/);
        if (urlMatch && urlMatch[1]) {
            movieUrl = urlMatch[1].replace(/<[^>]*>/g, '').trim();

            // Trường hợp phim lẻ (có chữ "full" trong đường dẫn)
            if (movieUrl.indexOf("full") > -1) {
                episodes.push({
                    "id": movieUrl,
                    "slug": 1,
                    "name": "Full Tập",
                    "url": movieUrl
                });
            } else {
                // Trường hợp phim bộ: Lấy tổng số tập hiện tại
                var pageMatch = html.split(/\<span class\=\"video-info-itemtitle\"\>Thời lượng：[\s\S]*?<div class\=\"video-info-item\"\>([\s\S]*?)\<\/div>/);
                var totalEpisodes = 0;

                if (pageMatch && pageMatch[1]) {
                    var numMatch = pageMatch[1].match(/\|\s(\d+)\s\|/);
                    if (numMatch && numMatch[1]) {
                        totalEpisodes = parseInt(numMatch[1], 10);
                    }
                }

                // Tiến hành dựng vòng lặp tạo link tập phim nếu tìm được cấu trúc link chuẩn
                var linkParts = movieUrl.split(/tap-(\d+)-/);
                if (linkParts && linkParts.length >= 3 && totalEpisodes > 0) {
                    var linkGoc = linkParts[0];
                    var linkSer = linkParts[2];

                    for (var j = 1; j <= totalEpisodes; j++) {
                        var fullLink = linkGoc + "tap-" + j + "-" + linkSer;
                        episodes.push({
                            "id": fullLink,
                            "slug": j,
                            "name": "Tập " + j,
                            "url": fullLink
                        });
                    }
                } else if (movieUrl) {
                    // Dự phòng nếu không phân tích được cấu trúc "tap-X-" thì thêm chính link gốc làm tập 1
                    episodes.push({
                        "id": movieUrl,
                        "slug": 1,
                        "name": "Tập 1",
                        "url": movieUrl
                    });
                }
            }
        }

        return JSON.stringify({
            "id": movieUrl || "unknown",
            "title": title,
            "posterUrl": img,
            "backdropUrl": img,
            "description": des,
            "servers": [
                {
                    "name": "Server Vietsub",
                    "episodes": episodes
                }
            ],
            "quality": "HD",
            "year": year,
            "rating": 8.0,
            "status": episodes.length > 1 ? "Tập " + episodes.length : "Full",
            "duration": "???",
            "casts": "???",
            "director": "???"
        });

    } catch (e) {
        // Trả về Object rỗng an toàn nếu có lỗi bất ngờ xảy ra bên trong hàm
        return JSON.stringify({ "id": "", "title": "Lỗi tải dữ liệu", "servers": [] });
    }
}

function parseDetailResponse(html) {
    try {
        var videoUrl = "";

        if (html && typeof html === 'string') {
            var m3u8Match = html.match(/(https?:\/\/[^"']+\.m3u8[^"']*)/i);
            if (m3u8Match) {
                videoUrl = m3u8Match[1].trim();
            } else {
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
                "Referer": "https://coon.pro/", 
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
