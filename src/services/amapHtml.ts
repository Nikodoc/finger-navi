/**
 * 高德地图 JS API 2.0 HTML 模板
 * 在 WebView 中渲染，通过 postMessage 与 RN 通信
 */

export function buildAmapHtml(apiKey: string): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no" />
<style>
  * { margin: 0; padding: 0; }
  html, body { background: #F2F4F7; width:100%; height:100%; overflow:hidden; }
  #map { position:absolute; top:0; bottom:0; left:0; right:0; }
  .amap-logo, .amap-copyright { display:none !important; }
  .callout {
    background: #FFFFFF;
    border-radius: 12px;
    padding: 12px 16px;
    min-width: 140px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.12);
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    text-align: center;
  }
  .callout-name { font-size:15px; font-weight:800; color:#1A1D28; margin-bottom:6px; }
  .callout-row { display:flex; align-items:center; justify-content:center; gap:8px; margin-bottom:4px; }
  .callout-meta { font-size:11px; color:#6B7280; }
  .callout-tags { display:flex; gap:4px; justify-content:center; margin-bottom:4px; }
  .callout-tag { background:rgba(0,152,255,0.08); padding:1px 6px; border-radius:6px; font-size:10px; color:#0098FF; font-weight:700; }
  .callout-hint { font-size:10px; color:#9CA3AF; margin-top:2px; }
</style>
</head>
<body>
<div id="map"></div>
<script>
  window._amap_ready = false;
  window._markers = {};
  window._userMarker = null;
  window._selectedId = null;

  function postMsg(type, data) {
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: type, data: data }));
  }

  window.initMap = function(lat, lng) {
    if (window._map) {
      // 地图已存在，只平移中心
      window._map.setZoomAndCenter(15, [lng, lat]);
      if (window._userMarker) {
        window._userMarker.setPosition([lng, lat]);
      }
      return;
    }

    var map = new AMap.Map('map', {
      zoom: 15,
      center: [lng, lat],
      resizeEnable: true,
      touchZoom: true,
      dragEnable: true,
      zoomEnable: true,
      rotateEnable: false,
      pitchEnable: false,
    });
    window._map = map;

    // 用户位置圆形
    window._userMarker = new AMap.Marker({
      position: [lng, lat],
      icon: new AMap.Icon({
        size: new AMap.Size(20, 20),
        image: 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><circle cx="10" cy="10" r="8" fill="#007AFF" stroke="#fff" stroke-width="3"/><circle cx="10" cy="10" r="3" fill="#fff"/></svg>'),
        imageSize: new AMap.Size(20, 20),
      }),
      anchor: 'center',
      zIndex: 999,
    });
    window._userMarker.setMap(map);

    map.on('click', function() {
      postMsg('mapClick', {});
    });

    window._amap_ready = true;
    postMsg('ready', {});
  };

  // 更新用户位置
  window.updateUserLocation = function(lat, lng) {
    if (window._userMarker) {
      window._userMarker.setPosition([lng, lat]);
    }
  };

  // 设置厕所标记
  window.setToilets = function(toilets, selectedId) {
    var map = window._map;
    // 清除旧标记
    Object.keys(window._markers).forEach(function(k) {
      window._markers[k].setMap(null);
    });
    window._markers = {};
    window._selectedId = selectedId;

    toilets.forEach(function(t, i) {
      var isSel = t.id === selectedId;
      var size = isSel ? 32 : 22;
      var bg = isSel ? '#FF9500' : '#007AFF';
      var num = i + 1;
      var color = isSel ? '#fff' : '#fff';

      var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '">' +
        '<circle cx="' + (size/2) + '" cy="' + (size/2) + '" r="' + (size/2-1) + '" fill="' + bg + '" stroke="#fff" stroke-width="2"/>' +
        '<text x="' + (size/2) + '" y="' + (size/2+4) + '" text-anchor="middle" font-size="' + (isSel?13:9) + '" font-weight="800" fill="' + color + '" font-family="sans-serif">' + num + '</text>' +
        '</svg>';

      var marker = new AMap.Marker({
        position: [t.lng, t.lat],
        icon: new AMap.Icon({
          size: new AMap.Size(size, size),
          image: 'data:image/svg+xml,' + encodeURIComponent(svg),
          imageSize: new AMap.Size(size, size),
          imageOffset: new AMap.Pixel(0, 0),
        }),
        anchor: 'center',
        offset: new AMap.Pixel(0, 0),
        zIndex: isSel ? 100 : 50,
      });

      // 点击事件
      marker.on('click', (function(toilet) {
        return function() {
          postMsg('markerClick', { id: toilet.id });
        };
      })(t));

      marker.setMap(map);
      window._markers[t.id] = marker;

      // 选中时显示 InfoWindow
      if (isSel) {
        var tags = '';
        if (t.isFree) tags += '<span class="callout-tag">免费</span>';
        if (t.hasAccessible) tags += '<span class="callout-tag">无障碍</span>';

        var distStr = t.distance !== undefined ? '距' + formatDist(t.distance) : '';

        var infoWin = new AMap.InfoWindow({
          content: '<div class="callout" id="callout_' + t.id + '">' +
            '<div class="callout-name">' + escHtml(t.name) + '</div>' +
            '<div class="callout-row">' + distStr + '</div>' +
            '<div class="callout-tags">' + tags + '</div>' +
            '<div class="callout-hint">戳我看详情 →</div>' +
            '</div>',
          offset: new AMap.Pixel(0, -size - 8),
          closeWhenClickMap: true,
        });
        infoWin.open(map, marker.getPosition());

        // 延迟绑定点击，等 DOM 就绪
        setTimeout(function() {
          var el = document.getElementById('callout_' + t.id);
          if (el) {
            el.addEventListener('click', function() {
              postMsg('openDetail', { id: t.id });
            });
          }
        }, 100);
      }
    });
  };

  function formatDist(m) {
    if (m < 1000) return m + 'm';
    return (m / 1000).toFixed(1) + 'km';
  }

  function escHtml(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
</script>
<script src="https://webapi.amap.com/maps?v=2.0&key=${apiKey}&callback=initMapFn" onerror="postMsg('loadError',{})"></script>
<script>
  // 等待高德 SDK 加载完成后以默认中心初始化
  function initMapFn() {
    initMap(39.9042, 116.4074);
  }
</script>
</body>
</html>`
}
