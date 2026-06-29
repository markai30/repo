// =============================================================================
// VAAPP Plugin - Crophim (Bản chuẩn hóa Thuần ES5 - Khử lỗi biên dịch trên Mobile)
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "crophim",          
        "name": "Crophim",
        "description": "Phim Online",
        "version": "1.4",             
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
        var regexList = new RegExp('<div class="module-item-pic"><a\\s+href="([^"]+)"\\s+title="([^"]+)"[\\s\\S]*?<img[^>]*data-src="([^"]+)"', 'g');
        var matchList;
        
        while ((matchList = regexList.exec(html)) !== null) {
            var cleanThumb = matchList[3].split('&amp;').join('&'); 
            items.push({
                "id": matchList[1],          
                "title": matchList[2].trim(), 
                "posterUrl": cleanThumb,  
                "backdropUrl": cleanThumb
            });
        }
        
        var totalPages = 1; 
        var currentPage = 1; 

        if (html && html.indexOf('id="page"') > -1) {
            var pageSectionBox = html.match(new RegExp('<div id="page">([\\s\\S]*?)<\/div>', 'i'));
            if (pageSectionBox && pageSectionBox[1]) {
                var pageHtml = pageSectionBox[1];
                var currentMatch = pageHtml.match(new RegExp('class="[^"]*page-current[^"]*">(\\d+)<', 'i'));
                if (currentMatch) {
                    currentPage = parseInt(currentMatch[1], 10);
                }

                var pageNumbers = [];
                var pageRegex = new RegExp('>(\\d+)<\\/a>', 'g');
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
        var year = "????";
        var des = "Chưa có mô tả.";
        var img = "";
        var movieUrl = "";
        var episodes = [];

        var tMatch = html.match(new RegExp('<h1 class="page-title">([\\s\\S]*?)<\\/h1>', 'i'));
        if (tMatch && tMatch[1]) { title = tMatch[1].replace(new RegExp('<[^>]*>', 'g'), '').trim(); }

        var yMatch = html.match(new RegExp('<div class="tag-link">([\\s\\S]*?)<\\/div>', 'i'));
        if (yMatch && yMatch[1]) { year = yMatch[1].replace(new RegExp('<[^>]*>', 'g'), '').trim(); }

        var dMatch = html.match(new RegExp('<div class="video-info-item video-info-content">([\\s\\S]*?)<\\/div>', 'i'));
        if (dMatch && dMatch[1]) { des = dMatch[1].replace(new RegExp('<[^>]*>', 'g'), '').trim(); }

        var iMatch = html.match(new RegExp('<div class="module-item-pic">[\\s\\S]*?<img[\\s\\S]*?src="([\\s\\S]*?)"', 'i'));
        if (iMatch && iMatch[1]) { img = iMatch[1].replace(new RegExp('<[^>]*>', 'g'), '').trim(); }

        var uMatch = html.match(new RegExp('<div class="video-info-footer display">[\\s\\S]*?<a[\\s\\S]*?href="([\\s\\S]*?)"', 'i'));
        if (uMatch && uMatch[1]) {
            movieUrl = uMatch[1].replace(new RegExp('<[^>]*>', 'g'), '').trim();

            if (movieUrl.indexOf("full") > -1) {
                episodes.push({
                    "id": movieUrl,
                    "slug": "1",
                    "name": "Full Tập",
                    "url": movieUrl
                });
            } else {
                var pageMatch = html.match(new RegExp('<span class="video-info-itemtitle">Thời lượng[\\s\\S]*?<div class="video-info-item">([\\s\\S]*?)<\\/div>', 'i'));
                var totalEpisodes = 0;

                if (pageMatch && pageMatch[1]) {
                    var numMatch = pageMatch[1].match(new RegExp('(\\d+)'));
                    if (numMatch && numMatch[1]) {
                        totalEpisodes = parseInt(numMatch[1], 10);
                    }
                }

                var linkParts = movieUrl.split(new RegExp('tap-(\\d+)-'));
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
            "status": episodes.length > 1 ? "Tập " + episodes.length : "Full"
        });

    } catch (e) {
        return JSON.stringify({ "id": "error", "title": "Lỗi tải dữ liệu", "servers": [] });
    }
}

function parseDetailResponse(html) {
    try {
        var videoUrl = "";

        if (html && typeof html === 'string') {
            var m3u8Match = html.match(new RegExp('(https?:\\/\\/[^"\']+\\.m3u8[^"\']*)', 'i'));
            if (m3u8Match) {
                videoUrl = m3u8Match[1].trim();
            } else {
                var embedMatch = html.match(new RegExp('(https?:\\/\\/player[^"\']+\\/player\\/\\?url=[^"\']+)', 'i'));
                if (embedMatch) {
                    videoUrl = decodeURIComponent(embedMatch[1].split('url=')[1]);
                } else if (html.indexOf("http://") === 0 || html.indexOf("https://") === 0) {
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

function parseCategoriesResponse(html) { return JSON.stringify([]); }
function parseCountriesResponse(html) { return JSON.stringify([]); }
function parseYearsResponse(html) { return JSON.stringify([]); }
