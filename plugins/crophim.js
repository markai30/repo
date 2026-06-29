// =============================================================================
// VAAPP Plugin - Rophim Fake (Bản vá chuẩn hóa theo cấu trúc Core mới nhất)
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "con.pro",          
        "name": "con.pro",
        "description": "Phim Online",
        "version": "1.1",             
        "baseUrl": "https://coon.pro/",
        "iconUrl": "https://coon.pro/wp-content/uploads/2026/04/phimhayok-io-fav.jpg", 
        "isEnabled": true,
        "type": "MOVIE"
    });
}

function getHomeSections() {
    return JSON.stringify([
        { "slug": "?s=&genres=&regions=&years=&categories=motphim", "title": "Phim Mới", "type": "Grid" },
        { "slug": "?s=&genres=&regions=&years=&categories=phim-le", "title": "Phim Lẻ", "type": "Grid" },
        { "slug": "?s=&genres=&regions=&years=&categories=phim-ngan", "title": "Phim Ngắn", "type": "Grid" },
        { "slug": "?s=&genres=&regions=&years=&categories=phim-bo", "title": "Phim Bộ", "type": "Grid" }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
         { "name": "Hành Động", "slug": "?s=&genres=hanh-dong" },
        { "name": "Kinh Dị", "slug": "?s=&genres=kinh-di" },
        { "slug": "?s=&genres=phim-18", "name": "Phim 18+"},
        { "slug": "?s=&genres=hai-huoc", "name": "Phim Hài"},
        { "slug": "?s=&genres=chien-tranh", "name": "Phim Chiến Tranh"},
        { "slug": "?s=&genres=hoat-hinh", "name": "Phim Hoạt Hình"},
        { "slug": "?s=&genres=vien-tuong", "name": "Phim Viễn Tưởng"}
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
// https://coon.pro/page/2/?s&genres=hai-huoc&regions&years&categories#038;genres=hai-huoc&regions&years&categories

function getUrlList(slug, filtersJson) {
    var filters = JSON.parse(filtersJson || "{}");
    var page = filters.page || 1;
    return "https://coon.pro/page/"  + page + "/" + slug;
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
// PARSERS (Đã chuẩn hóa chỉ nhận duy nhất 1 tham số html)
// =============================================================================

function parseListResponse(html) {
    try {
        var items = [];
        
        // 1. REGEX LẤY DANH SÁCH VIDEO
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
        
        // 2. LOGIC BÓC TÁCH TỔNG SỐ TRANG (PAGINATION)
        var totalPages = 1; // Mặc định nếu không tìm thấy phân trang thì là 1
        var currentPage = 1; // Mặc định trang hiện tại là 1

        if (html && html.indexOf('id="page"') > -1) {
            // Lấy riêng đoạn HTML chứa phân trang để xử lý chính xác hơn
            var pageSectionBox = html.match(/<div id="page">([\s\S]*?)<\/div>/i);
            if (pageSectionBox && pageSectionBox[1]) {
                var pageHtml = pageSectionBox[1];

                // Tìm trang hiện tại (nằm trong thẻ span class="page-current")
                var currentMatch = pageHtml.match(/class="[^"]*page-current[^"]*">(\d+)</i);
                if (currentMatch) {
                    currentPage = parseInt(currentMatch[1], 10);
                }

                // Quét tìm tất cả các số trang xuất hiện trong các thẻ a hoặc span
                // Regex này tìm các chữ số nằm ngay trước thẻ đóng </a> hoặc </span>
                var pageNumbers = [];
                var pageRegex = />(\d+)<\/a>/g;
                var pageMatch;
                
                while ((pageMatch = pageRegex.exec(pageHtml)) !== null) {
                    pageNumbers.push(parseInt(pageMatch[1], 10));
                }

                // Nếu tìm thấy danh sách các số trang, số lớn nhất chính là tổng số trang
                if (pageNumbers.length > 0) {
                    totalPages = Math.max.apply(Math, pageNumbers);
                }
                
                // Trường hợp đặc biệt: Nếu tổng số trang tìm được vẫn nhỏ hơn trang hiện tại
                if (totalPages < currentPage) {
                    totalPages = currentPage;
                }
            }
        }
        
        return JSON.stringify({
            "items": items,
            "pagination": { 
                "currentPage": currentPage, 
                "totalPages": totalPages 
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
   var $title =  html.split(/\<h1 class\=\"page-title\"\>([\s\S]*?)<\/h1>/)
    if($title){
    	$title = $title[1].replace(/<[^>]*>/g, '').trim() || "Chưa rõ tên phim";
	}
	var $year =  html.split(/\<div class\=\"tag-link\"\>([\s\S]*?)<\/div>/)
    if($year){
    	$year= $year[1].replace(/<[^>]*>/g, '').trim() || "????";
	}
	var $des =  html.split(/\<div class\=\"video-info-item video-info-content\"\>([\s\S]*?)<\/div>/)
    if($des){
    	$des= $des[1].replace(/<[^>]*>/g, '').trim() || "????";
	}
	var $img =  html.split(/\<div class\=\"module-item-pic\"\>[\s\S]*?<img[\s\S]*?src\=\"([\s\S]*?)\"/)
    if($img){
    	$img= $img[1].replace(/<[^>]*>/g, '').trim() || "????";
	}
	var $url = html.split(/\<div class\=\"video-info-footer display\"\>[\s\S]*?<a[\s\S]*?href\=\"([\s\S]*?)\"/)
    if($url){
    	$url= $url[1].replace(/<[^>]*>/g, '').trim();
    	var episodes = [];
    	if($url.indexOf("full") > -1){
    		episodes.push({
                                "id": $url,  // Gán link trang tập vào id để hệ thống Core tải mã nguồn trang đó
                                "slug": 1,
                                "name": $title,
                                "url": $url
           });
		}
		else{
			var $page = html.split(/\<span class\=\"video-info-itemtitle\"\>Thời lượng：[\s\S]*?<div class\=\"video-info-item\"\>([\s\S]*?)\<\/div>/);
			if($page){
				$page= $page[1].match(/\|\s(\d+)\s\|/)[1];
				var $link = $url.split(/tap-(\d+)-/);
				var $linkgoc = $link[0];
				var $linkser = $link[2];
				for(var $j = 1; $j < Number($page) + 1;$j++){
					var $full = $linkgoc + "tap-" + $j + "-" + $linkser;
					episodes.push({
                                "id": $full,  // Gán link trang tập vào id để hệ thống Core tải mã nguồn trang đó
                                "slug": $j,
                                "name": "Tập " + $j,
                                "url": $full
          			 });	
				}
			}
		}
	}
	
	
    return JSON.stringify({
        id: $url,
        title: $title,
        posterUrl: $img,
        backdropUrl: $img,
        description: $des,
        servers: [
            {
                name: "Server Vietsub", // Tên server phim
                episodes: episodes
            }
        ],
        quality: "HD",
        year: $year,
        rating: 8.0,
        status: "Full",
        duration: "???",
        casts: "???",
        director: "???"
    });
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
