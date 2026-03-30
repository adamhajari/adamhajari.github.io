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

    var path = window.location.pathname || '/';

    function link(label, href) {
      var active = (href === '/' && (path === '/' || path === '/index.html')) ||
                   (href !== '/' && path.indexOf(href) === 0);
      var cls = 'sidebar-link' + (active ? ' active' : '');
      return '<h2><a class="' + cls + '" href="' + href + '">' + label + '</a></h2>';
    }

    // Use .html paths — GitHub Pages serves files as stored (no CherryPy-style clean URLs).
    container.innerHTML = ''
      + '<div class="topic-box"><div class="topic">'
      + '<h1 class="site-title"><a href="/">adam hajari</a></h1>'
      + '</div></div>'
      + '<div class="topic-box"><div class="topic">'
      + link('projects', '/projects.html')
      + '</div></div>'
      + '<div class="topic-box"><div class="topic">'
      + link('spyre', '/spyre_examples.html')
      + '</div></div>'
      + '<div class="topic-box"><div class="topic">'
      + link('music', '/music.html')
      + '</div></div>'
      + '<div class="topic-box"><div class="topic">'
      + link('social', '/social.html')
      + '</div></div>';
  });
})();

