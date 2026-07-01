// =============================================================================
// VAAPP Plugin - Xhamster (Bản vá chuẩn hóa theo cấu trúc Core mới nhất)
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "viet69",          
        "name": "Viet69",
        "description": "XXX Hay",
        "version": "1.1",             
        "baseUrl": "https://viet69z.me",
        "iconUrl": "https://static.cdnsolutions.media/xh-desktop/images/favicon/favicon-v2-256x256.ico", 
        "isEnabled": true,
        "isAdult": true,
        "type": "VIDEO",
        "playerType": "embed"
    });
}

function getHomeSections() {
    return JSON.stringify([
        { "slug": "", "title": "Sex Mới", "type": "Grid" }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
    { "slug": "sinh-vien", "name": "Sinh Viên" },
    { "slug": "may-bay-ba-gia", "name": "Máy Bay" },
    { "slug": "?s=Vi%E1%BB%87t+nam", "name": "Việt Nam" },
    { "slug": "?s=T%E1%BA%ADp+th%E1%BB%83", "name": "Tập Thể" }
    { "slug": "?s=Hi%E1%BA%BFp+d%C3%A2m", "name": "Hiếp Dâm" }
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
        	if(slug.indexOf("s=") > -1){
        		 return "https://viet69z.me/page/" + page +"/" + slug;
			}
           else{
           	 return "https://viet69z.me/" + slug + "/page/" + page;
			}
        }
        return "https://viet69z.me/" + slug;
    } catch (e) {
        return "https://viet69z.me/" + slug;
    }
}

function getUrlSearch(keyword, filtersJson) {
    return "https://viet69z.me/?s=" + encodeURIComponent(keyword);
}

function getUrlDetail(slug) {
    if (!slug) return "";
    if (slug.indexOf('http') === 0) return slug;
    return "https://viet69z.me/" + slug;
}

function getUrlCategories() { return ""; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

// =============================================================================
// PARSERS
// =============================================================================
// $('.entry-video__thumbnail')
function parseListResponse(html) {
    try {
        var items = [];
var pattern = /(?=<div[^>]*class="[^"]*entry-video__thumbnail[^"]*")/g;
var splitItems = html.split(pattern).filter(Boolean);

for (var j = 1; j < splitItems.length; j++) {
    var block = splitItems[j];
    var hrefMatch = block.match(/href="([^"]+)"/i);
    if (!hrefMatch) continue; // Bỏ qua nếu khối không chứa link

    var id = hrefMatch[1].trim();

    var title = "";
    
    // Thử lấy title từ thuộc tính alt của ảnh trước
    // <span class="title">
    var altMatch = block.match(/title="([^"]+)"/i);
    if (altMatch) {
        title = altMatch[1].trim();
    } else {
        // Khử fallback sang aria-label nếu alt không tồn tại
        var labelMatch = block.match(/title="([^"]+)"/i);
        title = labelMatch ? labelMatch[1].trim() : "";
    }
    
    // ĐIỀU KIỆN 1: Nếu tiêu đề rỗng hoặc là "Video không tiêu đề" thì không gán vào items
    if (!title || title === "Video không tiêu đề") {
        continue; 
    }
    
    var srcMatch = block.match(/img[\s\S]*?src="([^"]+)"/i);
    var posterUrl = srcMatch ? srcMatch[1].trim() : "https://ic-vt-nss.cdnsolutions.media/a/YjgwNDg0MGRkZWVjZjQ1ZGVhZjc5MzQ0ZWJkMDlhOTA/s(w:1280,h:720),webp/026/522/500/1280x720.17475568.jpg";
    
    items.push({
        "id": id,          
        "title": title, 
        "posterUrl": posterUrl, 
        "backdropUrl": posterUrl
    });
}
		
        var currentPage = 1;
        var totalPages = 1;

        const currentRegex = /aria-current="page"[^>]*>([\d]+)<\/span>/;
const currentMatch = html.match(currentRegex);
const currentPage = currentMatch ? parseInt(currentMatch[1], 10) : null;

// 2. Tìm trang cuối cùng (Last Page)
// Tìm tất cả các số trang dạng /page/X/ trong thuộc tính href, sau đó tìm số lớn nhất
const pageNumRegex = /\/page\/([\d]+)\//g;
let match;
let maxPage = 1; // Mặc định là 1 nếu không tìm thấy phân trang lớn hơn

while ((match = pageNumRegex.exec(html)) !== null) {
    const pageNum = parseInt(match[1], 10);
    if (pageNum > maxPage) {
        maxPage = pageNum;
    }
}

        return JSON.stringify({
            "items": items,
            "pagination": { 
                "currentPage": currentPage, 
                "totalPages": maxPage, // ĐÃ SỬA: Đồng bộ đúng biến totalPages động
                "totalItems": 20 * totalPages,
                "itemsPerPage": 20
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

    var rmatch = html.match(/<meta[^>]*?property="og:url"[^>]*?(https?:\/\/[^"\s]+)|<meta[^>]*?(https?:\/\/[^"\s]+)[^>]*?property="og:url"/);
    if (rmatch && rmatch[1]) { lurl = rmatch[1]}
	//property="og:url" content="
    rmatch = html.match(/property="og:image" content="([^"]+)"/i);
    if (rmatch && rmatch[1]) { limg = rmatch[1]; }

    rmatch = html.match(/meta\s+property="og:title"\s+content="([^"]+)"/i);
    if (rmatch && rmatch[1]) { lname = rmatch[1]; }

    rmatch = html.match(/meta\s+property="og:description"\s+content="([^"]+)"/i);
    if (rmatch && rmatch[1]) { ldes = rmatch[1]; }   
     
     var streamUrl = "";
        
        var rmatch = html.match(/jsVideoIframe[\s\S]*?src="([\s\S]*?)"/i);
   	 if (rmatch && rmatch[1]) { streamUrl = rmatch[1]; }
     
    return JSON.stringify({
        id: lurl,
        title: lname,
        posterUrl: limg,
        backdropUrl: limg,
        description: ldes  + "\r\n\r\n" +lurl + "\r\n\r\n" + streamUrl,
        servers: [
            {
                name: "HaySex",
                episodes: [
                    { id: lurl, name: "Xem Ngay", slug: "full" }
                ]
            }
        ],
        quality: "HD",
        year: 2026,
        rating: 8.5,
        status: "Full",
        duration: "N/A",
        casts: "N/A",
        director: "N/A",
        category: "18+"
    });
}
//<link rel="preload" href="https://video3.cdnsolutions.media/key=kePlMtN+ADhubUR5+oDV3A,end=1782846000/data=2405:4802:918e:9690:213f:c9b0:ee12:58e-dvp/media=hls4/multi=256x144:144p:,426x240:240p:,854x480:480p:,1280x720:720p:,1920x1080:1080p:/029/485/972/_TPL_.av1.mp4.m3u8" as="fetch" crossorigin="true">
function parseDetailResponse(html) {
    try {
      /*
      var rmatch = html.match(/link\s+rel="canonical"\s+href="([^"]+)"/i);
    if (rmatch && rmatch[1]) { lurl = rmatch[1]; }
    */
		var customJs = `
function initCustomVideoFix() {
  // 1. Chèn CSS dọn dẹp giao diện (ẩn footer, sidebar, navbar...)
  const style = document.createElement('style');
  style.innerHTML = '';
  document.head.appendChild(style);
  
  const player = jwplayer("previewPlayer");

// 2. Kiểm tra xem player có tồn tại và đang bị tắt tiếng hay không
if (player && typeof player.getMute === "function") {
    if (player.getMute()) {
        player.setMute(false); // Bật tiếng (Bỏ chế độ Mute)
        console.log("Đã bật tiếng video!");
    } else {
        console.log("Video đã có tiếng sẵn từ trước.");
    }

    // Tiện tay nếu bạn muốn đảm bảo âm thanh ở mức to nhất (ví dụ: 100%)
    player.setVolume(100); 
} else {
    console.error("Không tìm thấy đối tượng JW Player hoặc player chưa sẵn sàng.");
}


}
  // 2. Dùng setInterval để đợi trình phát video v0:480p:,1280x720:720p:,1920x10

// Kiểm tra trạng thái trang để kích hoạt hàm an toàn nhất
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCustomVideoFix);
} else {
  initCustomVideoFix();
}
`;
		var streamUrl = "";
        
        var rmatch = html.match(/jsVideoIframe[\s\S]*?src="([\s\S]*?)"/i);
   	 if (rmatch && rmatch[1]) { streamUrl = rmatch[1]; }
   
return JSON.stringify({
    url: streamUrl,
    headers: {
        "Referer": "https://viet69z.me",
        "Origin": "https://viet69z.me",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Custom-Js": customJs.trim()
    }
});
    } catch (error) {
        return JSON.stringify({ url: "", headers: {} });
    }
}

function parseCategoriesResponse(html) { return "[]"; }
function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html) { return "[]"; }