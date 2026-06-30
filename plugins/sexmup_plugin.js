// =============================================================================
// VAAPP Plugin - SEX MUP (Bản vá chuẩn hóa theo cấu trúc Core mới nhất)
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "sexmup",          
        "name": "SexMup",
        "description": "XXX Hay",
        "version": "1.5",             
        "baseUrl": "https://sexmupxinh.net",
        "iconUrl": "https://sexmupxinh.net/favicon.ico", 
        "isEnabled": true,
        "isAdult": true,
        "type": "VIDEO",
        "playerType": "embed"
    });
}
// { "slug": "", "title": "Phim Sex mới", "type": "Horizontal" },
function getHomeSections() {
    return JSON.stringify([
        { "slug": "phim-sex-hiep-dam", "title": "Hiếp Dâm", "type": "Horizontal" },
        { "slug": "phim-sex-loan-luan", "title": "Loạn Luân", "type": "Horizontal" },
        { "slug": "phim-sex-vung-trom", "title": "Vụng Trộm", "type": "Horizontal" },
        { "slug": "phim-sex-chau-au", "title": "Châu Âu", "type": "Horizontal" },
        { "slug": "phim-sex-trung-quoc", "title": "Trung Quốc", "type": "Horizontal" }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { "name": "Hiếp Dâm", "slug": "phim-sex-hiep-dam"},
        { "name": "Loạn Luân", "slug": "phim-sex-loan-luan"},
        { "slug": "phim-sex-vung-trom", "name": "Vụng Trộm"},
        { "slug": "phim-sex-chau-au", "name": "Châu Âu"},
        { "slug": "phim-sex-trung-quoc", "name": "Trung Quốc"},
        { "slug": "search/?do=search&qh=L%E1%BB%97+Nh%E1%BB%8B", "name": "Lỗ Nhị"}
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
        
        // ĐÃ SỬA: Nếu là trang 1 thì giữ nguyên, từ trang 2 trở đi chuyển sang cấu trúc /page/X/ để tương thích hệ thống rewrite URL của web https://sexmupxinh.net/phim-sex-hiep-dam/page/2/
        if (page > 1) {
            // Thử cấu trúc phổ biến nhất của các web phim hiện tại: danh-muc/page/2
            return "https://sexmupxinh.net/" + slug + "/page/" + page + "/";
        }
        
        // Trang 1 mặc định
        return "https://sexmupxinh.net/" + slug;
    } catch (e) {
        return "https://sexmupxinh.net/" + slug;
    }
}


//https://sexmupxinh.net/search/?do=search&qh=Gay
function getUrlSearch(keyword, filtersJson) {
    return "https://sexmupxinh.net/search/?do=search&qh=" + encodeURIComponent(keyword);
}

function getUrlDetail(slug) {
    if (!slug) return "";
    if (slug.indexOf('http') === 0) return slug;
    return "https://sexmupxinh.net/" + slug;
}

function getUrlCategories() { return ""; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

// =============================================================================
// PARSERS (Đã chuẩn hóa chỉ nhận duy nhất 1 tham số html)
// =============================================================================
// <li class="video-list"><a title="Chuyện tình nóng bỏng nơi công sở với đồng nghiệp ngực to" href="https://sexmupxinh.net/phim/chuyen-tinh-nong-bong-noi-cong-so-voi-dong-nghiep-nguc-to/"><img class="video-image" src="https://sexmupxinh.net/file/cover/chuyen-tinh-nong-bong-noi-cong-so-voi-dong-nghiep-nguc-to.jpg" loading="eager" fetchpriority="high" width="320" height="180" decoding="async" alt="Chuyện tình nóng bỏng nơi công sở với đồng nghiệp ngực to"></a><div class="video-name"><a title="Chuyện tình nóng bỏng nơi công sở với đồng nghiệp ngực to" href="https://sexmupxinh.net/phim/chuyen-tinh-nong-bong-noi-cong-so-voi-dong-nghiep-nguc-to/">Chuyện tình nóng bỏng nơi công sở với đồng nghiệp ngực to</a></div></li>

function parseListResponse(html) {
    try {
        var items = [];
        var regex = /class="video-list"[\s\S]*?a\s+title="([^"]+)"[\s\S]*?href="([^"]+)"[\s\S]*?class="video-image"[\s\S]*?src="([^"]+)"/g;
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
            // [\s\S]*?
            // <div class="pagenavi"><a class="active" aria-current="page">1</a>
            var currentMatch = html.match(/class="pagenavi"[\s\S]*?class="active"[\s\S]*?>(\d+)<\/a>/i) ;
            
            // 2. Tìm giá trị max (Tổng số trang) trong thẻ input v-form-control
            var maxMatch = html.match(/>(\d+)<\/a><a[^>]*>→<\/a>/i);
                       

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
    // Nhiệm vụ của bạn ở đây: Viết Regex cào tên, mô tả, ảnh cover, và quan trọng nhất là DANH SÁCH TẬP PHIM.
    // Lấy url video <link rel="canonical" href="https://sexmupxinh.net/phim/co-em-ve-mat-dam-dang-lam-tinh-cuc-phe/">
    var rmatch = html.match(/link\srel="canonical"[\s\S]*?href="([\s\S]*?)"/i) ;
    if (rmatch && rmatch[1]) {
           var lurl = rmatch[1];
     }
     // Lấy img video <meta property="og:image" content="https://sexmupxinh.net/file/cover/co-em-ve-mat-dam-dang-lam-tinh-cuc-phe.jpg">
    var rmatch = html.match(/meta\s+property="og:image"\s+content="([\s\S]*?)"/i) ;
    if (rmatch && rmatch[1]) {
           var limg = rmatch[1];
     }
    // lấy tên phim <meta property="og:title" content="Cô em vẻ mặt dâm đãng làm tình cực phê">
    var rmatch = html.match(/meta\s+property="og:title"\s+content="([\s\S]*?)"/i) ;
    if (rmatch && rmatch[1]) {
           var lname = rmatch[1];
     }
     // Lấy nội dung phim <div class="content">
     var rmatch = html.match(/<div\s+class="content">([\s\S]*?)<\/div>/i) ;
    if (rmatch && rmatch[1]) {
           var ldes = rmatch[1];
     }
     
    return JSON.stringify({
        id: lurl,
        title: lname,
        posterUrl: limg,
        backdropUrl: limg,
        description: ldes,
        servers: [
            {
                name: "Full", // Tên server phim
                episodes: [
                    // ⚠️ LƯU Ý LỚN: `id` của tập phim có thể là link trực tiếp (.mp4/.m3u8), hoặc là một slug phụ.
                    // Nếu là slug phụ (ví dụ: 'tap-1'), khi người dùng bấm xem, App sẽ lại gọi hàm getUrlDetail('tap-1') 
                    // để lấy HTML tập 1 rồi ném vào hàm parseDetailResponse() dưới đây.
                    { id: lurl, name: "Full", slug: "" }
                ]
            }
        ],
        quality: "HD",
        year: 2026,
        rating: 8.0,
        status: "Full",
        duration: "120 Phút",
        casts: "Diễn viên A, B",
        director: "Đạo diễn C",
        category: "Hành Động"
    });
}

/**
 * Hàm lấy LINK VIDEO CUỐI CÙNG (Trọng yếu nhất)
 * Được gọi khi người dùng ấn nút "PHÁT VIDEO" (Play)
 */ 
 
 //
function parseDetailResponse(html) {
    try {
    	var rmatch = html.match(/<div\s+class="video-player mobile"[\s\S]*?iframe\s+src="([\s\S]*?)"/i) ;
   	 if (rmatch && rmatch[1]) {
           var streamUrl  = rmatch[1];
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
