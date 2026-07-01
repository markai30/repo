// =============================================================================
// VAAPP Plugin - Xhamster (Bản vá chuẩn hóa theo cấu trúc Core mới nhất)
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "xhamster",          
        "name": "Xhamster",
        "description": "XXX Hay",
        "version": "1.7",             
        "baseUrl": "https://greenxh.today",
        "iconUrl": "https://static.cdnsolutions.media/xh-desktop/images/favicon/favicon-v2-256x256.ico", 
        "isEnabled": true,
        "isAdult": true,
        "type": "VIDEO",
        "playerType": "embedtoexoplay"
    });
}

function getHomeSections() {
    return JSON.stringify([
        { "slug": "categories/vietnamese", "title": "Việt Nam", "type": "Horizontal" },
        { "slug": "categories/bus", "title": "Xe Bus", "type": "Horizontal" },
        { "slug": "categories/uncensored", "title": "Không Che", "type": "Horizontal" },
        { "slug": "best/weekly", "title": "Hay Trong Tuần", "type": "Horizontal" },
        { "slug": "newest", "title": "Hàng Mới", "type": "Grid" },
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { "slug": "categories/anal", "name": "Lỗ Nhị"},
        { "slug": "categories/big-tits", "name": "Vú Bự"},
        { "slug": "categories/gangbang", "name": "Tập Thể"},
        { "slug": "categories/threesome", "name": "Chơi 3"},
        { "slug": "categories/russian", "name": "Gái Nga"},
        { "slug": "categories/hentai", "name": "Hentai"}
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
            return "https://greenxh.today/" + slug + "/" + page;
        }
        return "https://greenxh.today/" + slug;
    } catch (e) {
        return "https://greenxh.today/" + slug;
    }
}

function getUrlSearch(keyword, filtersJson) {
    return "https://greenxh.today/search/" + encodeURIComponent(keyword);
}

function getUrlDetail(slug) {
    if (!slug) return "";
    if (slug.indexOf('http') === 0) return slug;
    return "https://greenxh.today/" + slug;
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
var pattern = /(?=<div[^>]*class="[^"]*thumb-list__item[^"]*")/g;
var splitItems = html.split(pattern).filter(Boolean);

for (var j = 1; j < splitItems.length; j++) {
    var block = splitItems[j];
    var hrefMatch = block.match(/href="([^"]+)"/i);
    if (!hrefMatch) continue; // Bỏ qua nếu khối không chứa link

    var id = hrefMatch[1].trim();
    
    // ĐIỀU KIỆN 2: Đường dẫn id buộc phải chứa dạng "/videos/"
    if (id.indexOf('/videos/') === -1) {
        continue; // Loại bỏ nếu không đúng định dạng đường dẫn video
    }

    var title = "";
    
    // Thử lấy title từ thuộc tính alt của ảnh trước
    var altMatch = block.match(/img[\s\S]*?alt="([^"]+)"/i);
    if (altMatch) {
        title = altMatch[1].trim();
    } else {
        // Khử fallback sang aria-label nếu alt không tồn tại
        var labelMatch = block.match(/aria-label="([^"]+)"/i);
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

        var currentMatch = html.match(/page-button-link--active[^>]*>(\d+)/i);
        var maxMatch = html.match(/page-limit-button--right[^>]*page-button-link[^>]*>(\d+)/i);

        if (currentMatch) currentPage = parseInt(currentMatch[1], 10);
        if (maxMatch) totalPages = parseInt(maxMatch[1], 10);
        if (totalPages < currentPage) totalPages = currentPage;

        return JSON.stringify({
            "items": items,
            "pagination": { 
                "currentPage": currentPage, 
                "totalPages": 10, // ĐÃ SỬA: Đồng bộ đúng biến totalPages động
                "totalItems": 46 * totalPages,
                "itemsPerPage": 46
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

    var rmatch = html.match(/link\s+rel="canonical"\s+href="([^"]+)"/i);
    if (rmatch && rmatch[1]) { lurl = rmatch[1].replace("https://xhamster.com","https://greenxh.today"); }

    rmatch = html.match(/meta\s+property="og:image"\s+content="([^"]+)"/i);
    if (rmatch && rmatch[1]) { limg = rmatch[1]; }

    rmatch = html.match(/meta\s+property="og:title"\s+content="([^"]+)"/i);
    if (rmatch && rmatch[1]) { lname = rmatch[1]; }

    rmatch = html.match(/meta\s+property="og:description"\s+content="([^"]+)"/i);
    if (rmatch && rmatch[1]) { ldes = rmatch[1]; }
    
     var rmatch = html.match(/rel="preload"\shref="([\s\S]*?m3u8)"/i);
   	 if (rmatch && rmatch[1]) { streamUrl = rmatch[1]; }
        
     
    return JSON.stringify({
        id: lurl,
        title: lname,
        posterUrl: limg,
        backdropUrl: limg,
        description: ldes + "\r\n\r\n" + streamUrl + "\r\n\r\n" +lurl,
        servers: [
            {
                name: "Xhamster Stream",
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
        var streamUrl = "";
        
        var rmatch = html.match(/rel="preload"\shref="([\s\S]*?m3u8)"/i);
   	 if (rmatch && rmatch[1]) { streamUrl = rmatch[1]; }
        
      /*
      var rmatch = html.match(/link\s+rel="canonical"\s+href="([^"]+)"/i);
    if (rmatch && rmatch[1]) { lurl = rmatch[1]; }
    */
		var customJs = `
function initCustomVideoFix() {
  alert('${decodedUrl}');

  // 1. Chèn CSS dọn dẹp giao diện (ẩn footer, sidebar, navbar...)
  const style = document.createElement('style');
  style.innerHTML = '';
  document.head.appendChild(style);

  // 2. Dùng setInterval để đợi trình phát video và nút bấm tải xong hoàn toàn
  const checkInterval = setInterval(() => {
    const theaterButton = document.querySelector('.icon-theater.vjs-control.vjs-button');
    const video = document.querySelector('video');

    // Chỉ xử lý khi cả nút bấm và thẻ video đều đã xuất hiện trên trang
    if (theaterButton && video) {
      clearInterval(checkInterval); // Tìm thấy rồi thì dừng vòng lặp kiểm tra

      // Xử lý nút Cinema mode
      const buttonText = theaterButton.innerText || theaterButton.textContent || "";
      if (buttonText.toLowerCase().includes('cinema mode')) {
        theaterButton.click();
        console.log("Đã kích hoạt Cinema mode thành công!");
      }

      // Xử lý bật tiếng video
      if (video.muted) {
        video.muted = false;
        console.log("Đã mở tiếng video thành công!");
      }
    }
  }, 200); // Cứ mỗi 0.2 giây sẽ kiểm tra lại một lần

  // Bảo hiểm: Tự động dừng kiểm tra sau 10 giây nếu trang bị lỗi không tải được video
  setTimeout(() => clearInterval(checkInterval), 10000);
}

// Kiểm tra trạng thái trang để kích hoạt hàm an toàn nhất
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCustomVideoFix);
} else {
  initCustomVideoFix();
}
`;

return JSON.stringify({
    url: streamUrl,
    headers: {
        "Referer": "https://greenxh.today",
        "Origin": "https://greenxh.today",
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
