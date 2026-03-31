// Inject shared sidebar into any page that includes a <div id="sidebar"></div>.
// This keeps the navigation defined in one place.
(function () {
  function ready(fn) {
    if (document.readyState !== 'loading') {
      fn();
    } else {
      document.addEventListener('DOMContentLoaded', fn);
    }
  }

  ready(function () {
    var container = document.getElementById('sidebar');
    if (!container) return;

    var path = window.location.pathname || '';

    function link(label, href) {
      var active = false;
      if (href === 'index.html') {
        active = path === '/' || /\/index\.html$/i.test(path) ||
          (path.endsWith('/') && !/\.html$/i.test(path)) ||
          /^\/[^/.]+\/?$/.test(path); // e.g. /website (no .html segment = Pages root)
      } else {
        active = path === href || path.startsWith(href);
      }
      var cls = 'sidebar-link' + (active ? ' active' : '');
      return '<h2><a class="' + cls + '" href="' + href + '">' + label + '</a></h2>';
    }

    // Relative hrefs + <base> in each page — works on github.io/website/ and custom domain root.
    container.innerHTML = ''
      + '<div class="topic-box"><div class="topic">'
      + '<h1 class="site-title"><a href="/">adam hajari</a></h1>'
      + '</div></div>'
      + '<div class="topic-box"><div class="topic">'
      + link('projects', '/projects/')
      + '</div></div>'
      + '<div class="topic-box"><div class="topic">'
      + link('spyre', '/spyre/')
      + '</div></div>'
      + '<div class="topic-box"><div class="topic">'
      + link('music', '/music/')
      + '</div></div>'
      + '<div class="topic-box"><div class="topic">'
      + link('social', '/social/')
      + '</div></div>';
  });
})();

