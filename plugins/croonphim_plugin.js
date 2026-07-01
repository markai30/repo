// =============================================================================
// VAAPP Plugin - Crophim Pro (Đồng bộ cấu trúc 100% theo chuẩn RophimFake)
// Tên file bắt buộc khi lưu: crophim_plugin.js
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "croonphim",          
        "name": "Croon Phim",
        "description": "Nguồn xem phim Online ổn định",
        "version": "1.1",             
        "baseUrl": "https://crimescenesolutions.co.za",
        "iconUrl": "https://crimescenesolutions.co.za/wp-content/uploads/2026/04/phimhayok-io-fav.jpg", 
        "isEnabled": true,
        "type": "MOVIE",
        "playerType": "exoplayer"
    });
}

function getHomeSections() {
    return JSON.stringify([
        { "slug": "phim-le", "title": "Phim Lẻ", "type": "Horizontal" },
        { "slug": "phim-bo", "title": "Phim Bộ", "type": "Horizontal" },
        { "slug": "phim-ngan", "title": "Phim Ngắn", "type": "Horizontal" },
        { "slug": "motphim", "title": "Phim Mới", "type": "Grid" }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { "name": "Hành Động", "slug": "hanh-dong" },
        { "name": "Kinh Dị", "slug": "kinh-di" },
        { "slug": "phim-18", "name": "Phim 18+"},
        { "slug": "hai-huoc", "name": "Phim Hài"},
        { "slug": "chien-tranh", "name": "Phim Chiến Tranh"},
        { "slug": "hoat-hinh", "name": "Phim Hoạt Hình"},
        { "slug": "vien-tuong", "name": "Phim Viễn Tưởng"}
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
// URL GENERATION (Bóc tách slug sạch theo khuôn mẫu mới)
// =============================================================================

function getUrlList(slug, filtersJson) {
    var filters = JSON.parse(filtersJson || "{}");
    var page = filters.page || 1;
    
    if (slug === "hanh-dong" || slug === "kinh-di" || slug === "phim-18" || slug === "hai-huoc" || slug === "chien-tranh" || slug === "hoat-hinh" || slug === "vien-tuong") {
        return "https://crimescenesolutions.co.za/page/" + page + "/?s=&genres=" + slug;
    }
    return "https://crimescenesolutions.co.za/page/" + page + "/?s=&categories=" + slug;
}

function getUrlSearch(keyword, filtersJson) {
    return "https://crimescenesolutions.co.za/?s=" + encodeURIComponent(keyword);
}

function getUrlDetail(slug) {
    if (!slug) return "";
    if (slug.indexOf('http') === 0) return slug;
    return "https://crimescenesolutions.co.za/" + slug;
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
            var cleanThumb = matchList[3].replace(/&amp;/g, '&'); 
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
        var year = "2026";
        var des = "Chưa có mô tả.";
        var img = "";
        var movieUrl = "";
        var episodes = [];
		var linkfrist = "";
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
                episodes.push({ "id": movieUrl, "slug": "1", "name": "Full Tập", "url": movieUrl });
                linkfrist += movieUrl + "\r\n";
            } else {
                var pageMatch = html.match(new RegExp('<span class="video-info-itemtitle">Thời lượng[\\s\\S]*?<div class="video-info-item">([\\s\\S]*?)<\\/div>', 'i'));
                var totalEpisodes = 0;

                if (pageMatch && pageMatch[1]) {
                    var numMatch = pageMatch[1].match(/[\s\S]*?\|[\s\S]*?(\d+)[\s\S]*?\|[\s\S]*?(\d+)/i);
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
                        linkfrist += fullLink + "\r\n";
                        episodes.push({ "id": fullLink, "slug": String(j), "name": "Tập " + j, "url": fullLink });
                    }
                } else if (movieUrl) {
                	linkfrist += movieUrl + "\r\n";
                    episodes.push({ "id": movieUrl, "slug": "1", "name": "Tập 1", "url": movieUrl });
                }
            }
        }

        return JSON.stringify({
            "id": movieUrl || "unknown",
            "title": title,
            "posterUrl": img,
            "backdropUrl": img,
            "description": des + "\r\n" + linkfrist,
            "year": year,
            "rating": 10,
            "quality": "HD",
            "servers": [{ "name": "Server Vietsub", "episodes": episodes }]
        });

    } catch (e) {
        return JSON.stringify({ "id": "error", "title": "Lỗi tải dữ liệu", "servers": [] });
    }
}
//  <a onclick="chooseStreamingServer(this)" data-type="m3u8" id="streaming-sv" data-id="1" data-link="https://cdn.phimhayok.net/filmhayok/hls/6a3a9626d63a92f33ffa0063/20260623142024/playlist.m3u8" class="streaming-server tag-link" style="background: #232328;color: #FFF">
function parseDetailResponse(html) {
    try {
        var videoUrl = "";
       
        var getlink = html.match(/id="streaming-sv"[^>]*?data-link="(https?:[^"]*)"/i);
        if (getlink && getlink[1]) {
            videoUrl = getlink[1];
        }
        
        /*
        var getlink = html.match(/class="playactive" href="(https?:[^"]*)"/i);
        if (getlink && getlink[1]) {
            videoUrl = getlink[1];
        }
        */
        // ĐÃ SỬA: Xóa bỏ hoàn toàn hàm alert() gây treo App
      

        return JSON.stringify({
            "url": videoUrl.replace("playlist","playlist_1080"), 
            headers: {
        	"Referer": "https://crimescenesolutions.co.za",
        	"Origin": "https://crimescenesolutions.co.za",
        	"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
   		 },
            "subtitles": []
        });

    } catch (e) {
        return JSON.stringify({ "url": "https://cdn.phimhayok.net/filmhayok/episode/20260625/6a3d1f01000826b5bd8a2254/playlist_1080.m3u8", "headers": {} });
    }
}

// KHỚP MẪU ROPHIMFAKE: Trả về chuỗi text thuần túy thay vì gọi JSON.stringify
function parseCategoriesResponse(html) { return "[]"; }
function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html) { return "[]"; }
