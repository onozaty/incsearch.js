/*
--------------------------------------------------------
incsearch.js - Incremental Search
インクリメンタルサーチライブラリ

- onozaty (http://www.enjoyxstudy.com)

Released under the Creative Commons License(Attribution 2.1 Japan):
クリエイティブ・コモンズの帰属 2.1 Japanライセンスの下でライセンスされています。
 http://creativecommons.org/licenses/by/2.1/jp/

depends on prototype.js(http://prototype.conio.net/)
本ライブラリの使用にあたっては、prototype.jsが必要です。

For details, see the web site:
使用方法については、下記を参照してください。
 http://www.enjoyxstudy.com/javascript/incsearch

--------------------------------------------------------
ver 0.1 2006/03/13
  ・公開
ver 0.2 2006/03/19
  ・ブックマーク表示用として、IncSearch.ViewBookmarkを追加
--------------------------------------------------------
*/

if (!IncSearch) {
  var IncSearch = {};
}

/*-- IncSearch.ViewBase -------------------------------*/
IncSearch.ViewBase = Class.create();
IncSearch.ViewBase.prototype = {
  initialize: function(input, viewArea, searchValues) {
    this.input = $(input);
    this.viewArea = $(viewArea);
    this.searchValues = searchValues;

    this.timer = null;

    this.oldInput = null;

    this.setOptions(arguments[3] || {});

    // reg event
    Event.observe(this.input, 'focus', this.checkLoop.bindAsEventListener(this), false);

    this.check();
  },

  // options
  interval: 500,
  dispMax: 20,
  initDispNon: false,
  ignoreCase: true,
  highlight: true,
  highClassName: 'high',
  highClassNum: 4,
  delim: ' ',
  escape: false,

  setBaseOptions: function(options) {

    if (options.interval)
      this.interval = options.interval;

    if (options.initDispNon)
      this.initDispNon = options.initDispNon;

    if (options.dispMax)
      this.dispMax = options.dispMax;

    if (options.startElementText)
      this.startElementText = options.startElementText;

    if (options.endElementText)
      this.endElementText = options.endElementText;

    if (options.searchBefore)
      this.searchBefore = options.searchBefore;

    if (options.searchAfter)
      this.searchAfter = options.searchAfter;

    if (options.ignoreCase != undefined)
      this.ignoreCase = options.ignoreCase;

    if (options.highlight != undefined)
      this.highlight = options.highlight;

    if (options.highClassNum != undefined)
      this.highClassNum = options.highClassNum;

    if (options.highClassName != undefined)
      this.highClassName = options.highClassName;

    if (options.delim != undefined)
      this.delim = options.delim;

    if (options.escape != undefined)
      this.escape = options.escape;
  },

  checkLoop: function() {
    this.check();
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(this.checkLoop.bind(this), this.interval);
  },

  check: function() {
    var input = this.getInput();
    if (!this.oldInput ||
       (input.join(this.delim || '') != this.oldInput.join(this.delim || ''))) {
      this.oldInput = input;

      // init
      this.clearViewArea();
      if (!this.initDispNon || input.length != 0) {
        if (this.searchBefore) this.searchBefore();
        var matchCount = this.search(1, this.dispMax, input);
        if (this.searchAfter) this.searchAfter(matchCount);
      }
    }
  },

  clearViewArea: function() {
    this.viewArea.innerHTML = '';
  },

  search: function(dispStart, dispEnd, patternList) {
    patternList = patternList || this.oldInput;

    var elementText = '';
    var matchCount = 0;

    for (var i = 0; i < this.searchValues.length; i++) {
      if (this.isMatch(this.searchValues[i], patternList)) {
        matchCount++;

        if (dispEnd == 0 ||
           (matchCount >= dispStart && matchCount <= dispEnd)) {
          elementText += this.createLineElement(i, patternList);
        }
      }
    }

    if (elementText != '') {
      if (this.startElementText) elementText = this.startElementText + elementText;
      if (this.endElementText) elementText += this.endElementText;
      this.viewArea.innerHTML = elementText;
    }

    return matchCount;
  },

  createElement: function(value, patternList, tagName) {

    var elementHTML = '<' + tagName + '>';
    elementHTML += this.createText(value, patternList);
    elementHTML += '</' + tagName + '>';

    return elementHTML;
  },

  createText: function(value, patternList) {

    var textList = new Array();

    if (this.highlight) {

      var first = this.getFirstMatch(value, patternList);

      while (first.listIndex != -1) {
        textList.push(this.escapeHTML(value.substr(0, first.matchIndex)));
        textList.push('<strong class="');
        textList.push(this.highClassName);
        textList.push((first.listIndex % this.highClassNum) + 1);
        textList.push('">');
        textList.push(this.escapeHTML(value.substr(first.matchIndex, patternList[first.listIndex].length)));
        textList.push('</strong>');

        value = value.substr(first.matchIndex + patternList[first.listIndex].length);
        first = this.getFirstMatch(value, patternList);
      }
    }

    textList.push(this.escapeHTML(value));

    return textList.join('');
  },

  matchIndex: function(value, pattern) {

    if (this.ignoreCase) {
      return value.toLowerCase().indexOf(pattern.toLowerCase());
    } else {
      return value.indexOf(pattern);
    }
  },

  getFirstMatch: function(value, patternList) {

    var first = {};
    first.listIndex = -1;
    first.matchIndex = value.length;

    for (var i = 0; i < patternList.length; i++) {
      var index = this.matchIndex(value, patternList[i]);
      if (index != -1 && index < first.matchIndex) {
        first.listIndex = i;
        first.matchIndex = index;
      }
    }

    return first;
  },

  getInput: function() {

    if (this.delim) {
      var list = this.input.value.split(this.delim);
      return list.select(function(value) {
        return value != undefined && value != null && value != '';
      });
    } else {
      return new Array(this.input.value);
    }
  },

  escapeHTML: function(value) {
    if (this.escape) {
      return value.replace(/\&/g, '&amp;').replace( /</g, '&lt;').replace(/>/g, '&gt;')
                .replace(/\"/g, '&quot;').replace(/\'/g, '&#39;').replace(/\n|\r\n/g, '<br />');
    } else {
      return value;
    }
  }

}

/*-- IncSearch.ViewList -------------------------------*/
IncSearch.ViewList = Class.create();
Object.extend(Object.extend(IncSearch.ViewList.prototype, IncSearch.ViewBase.prototype), {

  // options
  listTagName: 'div',

  setOptions: function(options) {
    this.setBaseOptions(options);

    if (options.listTagName)
      this.listTagName = options.listTagName;
  },

  isMatch: function(value, patternList) {

    for (var i = 0; i < patternList.length; i++) {
      if (this.matchIndex(value, patternList[i]) == -1) {
        return false;
      }
    }
    return true;
  },

  createLineElement: function(index, patternList) {
    return this.createElement(this.searchValues[index], patternList, this.listTagName);
  }
});

/*-- IncSearch.ViewTable -------------------------------*/
IncSearch.ViewTable = Class.create();
Object.extend(Object.extend(IncSearch.ViewTable.prototype, IncSearch.ViewBase.prototype), {

  setOptions: function(options) {

    this.setBaseOptions(Object.extend({
      startElementText: '<table>',
      endElementText: '</table>'
    }, options));
  },

  isMatch: function(valueArray, patternList) {

    var value = valueArray.join("\n");

    for (var i = 0; i < patternList.length; i++) {
      if (this.matchIndex(value, patternList[i]) == -1) {
        return false;
      }
    }
    return true;
  },

  createLineElement: function(index, patternList) {

    var text = '<tr>';
    for (var i = 0; i < this.searchValues[index].length; i++) {
      text += this.createElement(this.searchValues[index][i], patternList, 'td');
    }

    text += '</tr>';
    return text;
  }
});

/*-- IncSearch.ViewBookmark -------------------------------*/
IncSearch.ViewBookmark = Class.create();
Object.extend(Object.extend(IncSearch.ViewBookmark.prototype, IncSearch.ViewTable.prototype), {

  isMatch: function(post, patternList) {

    var value = post.title + "\n" + post.info + "\n" + post.tags.join("\n") + "\n" + post.others.join("\n");

    for (var i = 0; i < patternList.length; i++) {
      if (this.matchIndex(value, patternList[i]) == -1) {
        return false;
      }
    }
    return true;
  },

  createLineElement: function(index, patternList) {

    var post = this.searchValues[index];

    var text = '<tr><td>';

    // url, title
    text += '<a href="' +  post.url + '"';
    text += " onclick=\"window.open('" + post.url + "'); return false;\"";
    text += " onkeypress=\"window.open('" + post.url + "'); return false;\">";
    text += this.createText(post.title, patternList);
    text += '</a><br />';

    // info
    if (post.info) {
      text += this.createElement(post.info, patternList, 'p');
    }
    text += '</td>';

    // tags
    if (post.tags) {
      text += this.createElement(post.tags.join(' '), patternList, 'td');
    }

    // others
    for (var i = 0; i < post.others.length; i++) {
      text += this.createElement(post.others[i], patternList, 'td');
    }
    text += '</tr>';

    return text;
  }
});
