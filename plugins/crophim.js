// =============================================================================
// VAAPP Plugin - crophim (Bản vá lỗi Overload Memory & Đồng bộ Cấu trúc Rophim gốc)
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "crophim",          
        "name": "crophim",
        "description": "Phim Online",
        "version": "1.0",             
        "baseUrl": "https://sportshots.pro", 
        "iconUrl": "https://sportshots.pro/wp-content/uploads/2026/04/phimhayok-io-fav.jpg", 
        "isEnabled": true,
        "type": "MOVIE"
    });
}

function getHomeSections() {
    return JSON.stringify([
        { "slug": "motphim", "title": "Phim Mới", "type": "Grid" },
        { "slug": "phim-le", "title": "Phim Lẻ", "type": "Grid" },
        { "slug": "phim-ngan", "title": "Phim Ngắn", "type": "Grid" },
        { "slug": "phim-bo", "title": "Phim Bộ", "type": "Grid" }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { "name": "Hành Động", "slug": "hanh-dong" },
        { "name": "Kinh Dị", "slug": "kinh-di" },
        { "name": "Phim 18+", "slug": "phim-18" },
        { "name": "Phim Hài", "slug": "hai-huoc" },
        { "name": "Phim Chiến Tranh", "slug": "chien-tranh" },
        { "name": "Phim Hoạt Hình", "slug": "hoat-hinh" },
        { "name": "Viễn Tưởng", "slug": "vien-tuong" }
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
    var filters = {};
    try {
        if (filtersJson && filtersJson.trim()) {
            filters = JSON.parse(filtersJson);
        }
    } catch(e) {}
    
    var page = filters.page || 1;
    
    // Bước 1: Xác định xem slug này thuộc nhóm Danh mục (categories) hay Thể loại (genres)
    var pathType = "chuyen-muc"; // Mặc định là danh mục (phim-le, phim-bo, motphim...)
    
    if (slug === "hanh-dong" || slug === "kinh-di" || slug === "phim-18" || slug === "hai-huoc" || slug === "chien-tranh" || slug === "hoat-hinh" || slug === "vien-tuong") {
        pathType = "the-loai"; // Nếu slug truyền vào là thể loại, đổi thành /the-loai/
    }
    
    // Bước 2: Build URL dựa theo số trang (page)
    if (page === 1) {
        // Trang đầu tiên: https://sportshots.pro/chuyen-muc/phim-le/
        return "https://sportshots.pro/" + pathType + "/" + slug + "/";
    } else {
        // Các trang sau: https://sportshots.pro/chuyen-muc/phim-le/page/3/
        return "https://sportshots.pro/" + pathType + "/" + slug + "/page/" + page + "/";
    }
}

function getUrlSearch(keyword, filtersJson) {
    return "https://sportshots.pro/?s=" + encodeURIComponent(keyword);
}

function getUrlDetail(slug) {
    if (!slug) return "";
    if (slug.indexOf('http') === 0) return slug;
    return "https://sportshots.pro/" + slug;
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

function parseMovieDetail(html) {
    try {
        var title = "Chưa rõ tên phim";
        var year = "2026";
        var des = "Chưa có mô tả.";
        var img = "";
        var movieUrl = "";
        var episodes = [];

        // ĐÃ SỬA: Chuyển hoàn toàn từ .split() sang .match() để tối ưu bộ nhớ Engine Mobile
        var titleMatch = html.match(/<h1 class="page-title">([\s\S]*?)<\/h1>/i);
        if (titleMatch && titleMatch[1]) {
            title = titleMatch[1].replace(/<[^>]*>/g, '').trim();
        }

        var yearMatch = html.match(/<div class="tag-link">([\s\S]*?)<\/div>/i);
        if (yearMatch && yearMatch[1]) {
            year = yearMatch[1].replace(/<[^>]*>/g, '').trim();
        }

        var desMatch = html.match(/<div class="video-info-item video-info-content">([\s\S]*?)<\/div>/i);
        if (desMatch && desMatch[1]) {
            des = desMatch[1].replace(/<[^>]*>/g, '').trim();
        }

        var imgMatch = html.match(/<div class="module-item-pic">[\s\S]*?<img[\s\S]*?src="([\s\S]*?)"/i);
        if (imgMatch && imgMatch[1]) {
            img = imgMatch[1].replace(/<[^>]*>/g, '').trim();
        }

        var urlMatch = html.match(/<div class="video-info-footer display">[\s\S]*?<a[\s\S]*?href="([\s\S]*?)"/i);
        if (urlMatch && urlMatch[1]) {
            movieUrl = urlMatch[1].replace(/<[^>]*>/g, '').trim();

            if (movieUrl.indexOf("full") > -1) {
                episodes.push({
                    "id": movieUrl,
                    "slug": "1",
                    "name": "Full Tập",
                    "url": movieUrl
                });
            } else {
                var pageMatch = html.match(/<span class="video-info-itemtitle">Thời lượng：[\s\S]*?<div class="video-info-item">([\s\S]*?)<\/div>/i);
                var totalEpisodes = 0;

                if (pageMatch && pageMatch[1]) {
                    var numMatch = pageMatch[1].match(/\|\s(\d+)\s\|/);
                    if (numMatch && numMatch[1]) {
                        totalEpisodes = parseInt(numMatch[1], 10);
                    }
                }

                var linkParts = movieUrl.split(/tap-(\d+)-/);
                if (linkParts && linkParts.length >= 3 && totalEpisodes > 0) {
                    var linkGoc = linkParts[0];
                    var linkSer = linkParts[2];

                    for (var j = 1; j <= totalEpisodes; j++) {
                        var fullLink = linkGoc + "tap-" + j + "-" + linkSer;
                        episodes.push({
                            "id": fullLink,
                            "slug": String(j),
                            "name": "Tập " + j,
                            "url": fullLink
                        });
                    }
                } else if (movieUrl) {
                    episodes.push({
                        "id": movieUrl,
                        "slug": "1",
                        "name": "Tập 1",
                        "url": movieUrl
                    });
                }
            }
        }

        // ĐÃ SỬA: Đồng bộ cấu trúc Object trả về chính xác 100% theo chuẩn file rophim.js gốc
        return JSON.stringify({
            "id": movieUrl || "unknown",
            "title": title,
            "posterUrl": img,
            "backdropUrl": img,
            "description": des,
            "year": year,
            "rating": 10,
            "quality": "HD",
            "servers": [
                {
                    "name": "Server Vietsub",
                    "episodes": episodes
                }
            ]
        });

    } catch (e) {
        return JSON.stringify({ "id": "error", "title": "Lỗi tải dữ liệu", "servers": [] });
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
                "Referer": "https://sportshots.pro/", 
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
