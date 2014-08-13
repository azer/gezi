function search () {

}


function searchFrames () {

}

function searchHistory () {
  var keyword = input.value();

  if (keyword.length < 3) {
    dom('.search .results').html('');
    return centerSearchUI();
  }

  var matches = [];

  var url;
  for (url in history) {
    if (url.toLowerCase().indexOf(keyword.toLowerCase()) > -1) matches.push(history[url]);
  }

  matches = matches.map(function (item) {
    return format('<li data-url="{full-url}" class="item"><span>{title}</span><label>{url}</label></li>', {
      title: shortText(item.title.trim(), 50),
      url: shortText(cleanURL(item.url), 26),
      'full-url': item.url
    });
  });

  if (matches.length == 0) {
    return dom('.search .results').html('<li class="no-results">Nothing in your history matches <span>"{0}"</span></li>', keyword);
  }

  dom('.search .results').html(matches.join('\n'));

  centerSearchUI();
}
