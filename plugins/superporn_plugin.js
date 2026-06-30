// =============================================================================
// VAAPP Plugin - SUPERPORN (Bản vá chuẩn hóa theo cấu trúc Core mới nhất)
// =============================================================================

function getManifest() {
    return JSON.stringify({
        "id": "superporn",          
        "name": "SuperPorn",
        "description": "XXX Hay",
        "version": "2.5",             
        "baseUrl": "https://www.superporn.com",
        "iconUrl": "https://superporn.com/favicon.ico", 
        "isEnabled": true,
        "isAdult": true,
        "type": "VIDEO",
        "playerType": "auto"
    });
}
/*
{ "slug": "phim-sex-hiep-dam", "title": "Hiếp Dâm", "type": "Horizontal" },
        { "slug": "phim-sex-loan-luan", "title": "Loạn Luân", "type": "Horizontal" },
        { "slug": "phim-sex-vung-trom", "title": "Vụng Trộm", "type": "Horizontal" }, // ĐÃ SỬA: Thêm dấu phẩy hợp lệ ở đây
        { "slug": "phim-sex-chau-au", "title": "Châu Âu", "type": "Horizontal" },
        { "slug": "phim-sex-trung-quoc", "title": "Trung Quốc", "type": "Horizontal" }
    ]);
*/
function getHomeSections() {
    return JSON.stringify([
        { "slug": "japanese", "title": "Gái Nhật", "type": "Horizontal" },
        { "slug": "teen", "title": "Gái Trẻ", "type": "Horizontal" },
        { "slug": "series/full-movies", "title": "Phim Dài", "type": "Horizontal" },
        { "slug": "", "title": "Clip Mới", "type": "Grid" }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { "slug": "shemale", "name": "Shemale"},
        { "slug": "japanese", "name": "Gái Nhật"},
        { "slug": "cheating", "name": "Chơi Lén"},
        { "slug": "gay", "name": "Gay"},
        { "slug": "russian-porn", "name": "Gái Nga"},
        { "slug": "dad-and-daughter", "name": "Cha Con"},
        { "slug": "mom-and-son", "name": "Mẹ Con"}
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
            return "https://www.superporn.com/" + slug + "/" + page;
        }
        return "https://www.superporn.com/" + slug;
    } catch (e) {
        return "https://www.superporn.com/" + slug;
    }
}

function getUrlSearch(keyword, filtersJson) {
    return "https://www.superporn.com/search?q=" + encodeURIComponent(keyword);
}

function getUrlDetail(slug) {
    if (!slug) return "";
    if (slug.indexOf('http') === 0) return slug;
    return "https://superporn.com/" + slug;
}

function getUrlCategories() { return ""; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

// =============================================================================
// PARSERS
// =============================================================================
/*
<div class="thumb-video  ">
    <a href="https://www.superporn.com/video/hard-black-cock-for-tori-black" class="thumb-duracion">
    <img alt="Hard black cock for Tori Black" loading="lazy" class="lazy " src="https://img2.superporn.com/videos/146/14658/thumbs/thumbs_0012_custom_1678794635.1263.jpg" width="332" height="186" data-loaded="true">
    <span class="duracion">
    26:41
  </span>
*/
function parseListResponse(html) {
    try {
        var items = [];
        var cleanHtml = html.replace(/<!--[\s\S]*?-->/g,""); // Xóa comment[cite: 5]
        
        // Bóc chính xác thẻ <a> và thẻ <img> nằm bên trong cụm class="thumb-video"
        var regex = /div class="thumb-video[^>]*>[\s\S]*?href="([^"]+)"[\s\S]*?<img\s+alt="([^"]+)"[\s\S]*?src="(http[^"]+)"/gi;
        var match;
        
        while ((match = regex.exec(cleanHtml)) !== null) {
            var id = match[1].trim();
            var title = match[2].trim();
            var limg = match[3].trim();
            
            items.push({
                "id": id,          
                "title": title, 
                "posterUrl": limg,
                "backdropUrl": limg
            });
        }

        var currentPage = 1;
        var totalPages = 1;

        if (cleanHtml) {
            var currentMatch = cleanHtml.match(/btn-pagination--selected[^>]*>(\d+)<\/a>/i);
            //var maxMatch = cleanHtml.match(/<a[^>]*>(\d+)<\/a>\s*<\/li>\s*<li[^>]*class="[^"]*next/i);
			var maxMatch = cleanHtml.match(/results__search--videos[\s\S]*?count-results[\s\S]*?(\d+)/i);
			
            if (currentMatch && currentMatch[1]) {
                currentPage = parseInt(currentMatch[1], 10);
            }
            if (maxMatch && maxMatch[1]) {
                var totalPage = parseInt(maxMatch[1], 10);
                var totalPages = Math.floor(totalPage / 56)
            }
            else{
            	var maxMatch = cleanHtml.match(/count-results[\s\S]*?(\d+)/i);
            	if (maxMatch && maxMatch[1]) {
                	var totalPage = parseInt(maxMatch[1], 10);
                	var totalPages = Math.floor(totalPage / 56)
          	  }	
			}
        }

        return JSON.stringify({
            "items": items,
            "pagination": { 
                "currentPage": currentPage, 
                "totalPages": 10,    
                "totalItems":  56 * totalPages,
                "itemsPerPage": 56
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
	// <link rel="canonical" href="https://www.superporn.com/video/japanese-and-german-girls-massage-each-other-s-giant-boobs">
    var rmatch = html.match(/link\srel="canonical"[\s\S]*?href="([\s\S]*?)"/i);
    if (rmatch && rmatch[1]) { lurl = rmatch[1]; }

    rmatch = html.match(/meta\s+property="og:image"\s+content="([\s\S]*?)"/i);
    if (rmatch && rmatch[1]) { limg = rmatch[1]; }

    rmatch = html.match(/meta\s+property="og:title"\s+content="([\s\S]*?)"/i);
    if (rmatch && rmatch[1]) { lname = rmatch[1]; }

    rmatch = html.match(/meta\s+property="og:description"\s+content="([\s\S]*?)"/i);
    if (rmatch && rmatch[1]) { ldes = rmatch[1]; }
    rmatch = html.match(/id="superporn_player_html5_api[\s\S]*?source\ssrc="([\s\S]*?)"/i);
    var streamUrl = "None";
        if (rmatch && rmatch[1]) {
            streamUrl = rmatch[1];
        }	
     
    return JSON.stringify({
        id: lurl,
        title: lname,
        posterUrl: limg,
        backdropUrl: limg,
        description: ldes + "\r\n" + streamUrl,
        servers: [
            {
                name: "Full",
                episodes: [
                    { id: lurl, name: "Full", slug: "" }
                ]
            }
        ],
        quality: "HD",
        year: 2026, // ĐÃ SỬA: Thay "????" bằng số nguyên để không lỗi ép kiểu
        rating: 8.0,
        status: "Full",
        duration: 0, // ĐÃ SỬA: Thay "????" bằng 0 đề phòng lỗi ép kiểu tương tự
        casts: "Diễn viên",
        director: "Đạo diễn",
        category: "18+"
    });
}
//<video id="superporn_player_html5_api" playsinline="playsinline" webkit-playsinline="" preload="none" class="vjs-tech" poster="https://img.superporn.com/videos/356/3560/previews/previews_0012_custom_1654675518.0576.jpg" data-stats-video-id="3560" data-sprites-url="https://img.superporn.com/videos/356/3560/sprites/sprite_[index].jpg" data-video-duration="1146" data-video-preview="https://img.superporn.com/videos/356/3560/previews/previews_0012_custom_1654675518.0576.jpg" tabindex="-1"> <source src="https://cdnst.superporn.com/videos/356/3560/mp4/08742e514343b8c354693ddf5c593d76521831d9e6c586f29da7106393d5bba4.mp4?secure=lptcAIZwqd7MiKvVipxKeg%3D%3D%2C1782908733" type="video/mp4"> </video>

function parseDetailResponse(html) {
    try {
        var streamUrl = "";
        var rmatch = html.match(/id="superporn_player_html5_api[\s\S]*?source\ssrc="([\s\S]*?)"/i);
        if (rmatch && rmatch[1]) {
            streamUrl = rmatch[1];
        }	
        var decodedUrl = streamUrl ? decodeURIComponent(streamUrl) : "";

        var customJs = `
function initCustomVideoFix() {
  alert('${decodedUrl}');

  // 1. Chèn CSS dọn dẹp giao diện (ẩn footer, sidebar, navbar...)
  const style = document.createElement('style');
  style.innerHTML = 'footer,#sidebar,.col-70,#playback,.header,.navbar,.intensive-add,#overlay-video{display:none!important}#video-layout{margin-top:-50px}body{overflow:hidden;background:black}div#player {display: block !important}';
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
    url: decodedUrl,
    headers: {
        "Referer": "https://www.superporn.com",
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
