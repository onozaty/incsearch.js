/*
--------------------------------------------------------
incsearch.js - Incremental Search
Version 1.1.0 (Update 2006/11/02)

- onozaty (http://www.enjoyxstudy.com)

Released under the Creative Commons License(Attribution 2.1 Japan):
 http://creativecommons.org/licenses/by/2.1/jp/

depends on prototype.js(http://prototype.conio.net/)

For details, see the web site:
 http://www.enjoyxstudy.com/javascript/incsearch

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
    this.matchList = null;
    this.setOptions(arguments[3] || {});

    this.nowPage = 0;

    // check loop start
    this.checkLoop();
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
  pagePrevName: 'prev',
  pageNextName: 'next',

  setBaseOptions: function(options) {

    if (options.interval != undefined)
      this.interval = options.interval;

    if (options.initDispNon != undefined)
      this.initDispNon = options.initDispNon;

    if (options.dispMax != undefined)
      this.dispMax = options.dispMax;

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

    if (options.startElementText != undefined)
      this.startElementText = options.startElementText;

    if (options.endElementText != undefined)
      this.endElementText = options.endElementText;

    if (options.searchBefore != undefined)
      this.searchBefore = options.searchBefore;

    if (options.searchAfter != undefined)
      this.searchAfter = options.searchAfter;

    if (options.pageLink != undefined)
      this.pageLink = options.pageLink;

    if (options.pagePrevName != undefined)
      this.pagePrevName = options.pagePrevName;

    if (options.pageNextName != undefined)
      this.pageNextName = options.pageNextName;

    if (options.changePageAfter != undefined)
      this.changePageAfter = options.changePageAfter;

    if (options.changePageAfter != undefined)
      this.changePageAfter = options.changePageAfter;

    if (options.hotkey != undefined) {
      if (window.opera) {
        Event._observeAndCache($(options.hotkey), 'keypress', this.hotkey.bindAsEventListener(this), false);
      } else {
        Event.observe($(options.hotkey), 'keypress', this.hotkey.bindAsEventListener(this), false);
      }
    }
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
        this.search(input);
        this.nowPage = 1;
        this.createViewArea(0, this.dispMax, input);
        if (this.pageLink) this.createPageLink(1, this.pageLink);
        if (this.searchAfter) this.searchAfter();
      }
    }
  },

  changePage: function(pageNo) {
    var start = (pageNo - 1) * this.dispMax;

    if (!this.matchList || start >= this.matchList.length) return false;

    if (this.changePageBefore) this.changePageBefore(pageNo);
    this.createViewArea(start, this.dispMax, this.oldInput);
    this.nowPage = pageNo;
    if (this.pageLink) this.createPageLink(pageNo, this.pageLink);
    if (this.changePageAfter) this.changePageAfter(pageNo);
    return true;
  },

  createPageLink: function(pageNo, pageLinkElm) {

    pageLinkElm = $(pageLinkElm);

    var pageCount = this.getPageCount();

    var prev_page = false;
    var next_page = false;

    if (pageCount > 1) {

      if (pageNo == 1) {
        next_page = true;
      } else if (pageNo == pageCount) {
        prev_page = true;
      } else {
        next_page = true;
        prev_page = true;
      }
    }

    pageLinkElm.innerHTML = '';

    if (prev_page) {

      var prev = document.createElement('a');
      prev.setAttribute('href', 'javascript:void(0)');
      var prev_text = document.createTextNode(this.pagePrevName);
      prev.appendChild(prev_text);

      pageLinkElm.appendChild(prev);

      Event.observe(prev, 'click', this.changePage.bind(this, pageNo - 1), false);
    }
    if (next_page) {
      if (prev_page) {
        var sep = document.createTextNode(' | ');
        pageLinkElm.appendChild(sep);
      }

      var next = document.createElement('a');
      next.setAttribute('href', 'javascript:void(0)');
      var next_text = document.createTextNode(this.pageNextName);
      next.appendChild(next_text);

      pageLinkElm.appendChild(next);

      Event.observe(next, 'click', this.changePage.bind(this, pageNo + 1), false);
    }
  },

  getPageCount: function() {
    var pageCount = 0;

    if (this.matchList && this.matchList.length != 0) {
      if (this.dispMax == 0) {
        pageCount = 1;
      } else {
        pageCount = Math.floor((this.matchList.length + this.dispMax - 1) / this.dispMax);
      }
    }
    return pageCount;
  },

  hotkey: function(event) {
    if (event.ctrlKey) {
      if (event.keyCode == Event.KEY_RIGHT) {
        if (this.nowPage < this.getPageCount()) {
          this.changePage(this.nowPage + 1);
        }
        Event.stop(event);
      } else if (event.keyCode == Event.KEY_LEFT) {
        if (this.nowPage > 1) {
          this.changePage(this.nowPage - 1);
        }
        Event.stop(event);
      }
    }
  },

  createViewArea: function(start, count, patternList) {
    var elementText = '';

    var end = this.matchList.length;
    if (count != 0 && end > (start + count)) {
      end = start + count;
    }

    for (var i = start; i < end; i++) {
      elementText += this.createLineElement(this.matchList[i], patternList);
    }

    if (elementText != '') {
      if (this.startElementText) elementText = this.startElementText + elementText;
      if (this.endElementText) elementText += this.endElementText;
      this.viewArea.innerHTML = elementText;
    }
  },

  clearViewArea: function() {
    this.viewArea.innerHTML = '';
    this.matchList = null;
    this.nowPage = 1;
  },

  search: function(patternList) {
    patternList = patternList || this.oldInput;

    this.matchList = new Array();

    var length = this.searchValues.length;

    for (var i = 0; i < length; i++) {
      if (this.isMatch(this.searchValues[i], patternList)) {
        this.matchList.push(i);
      }
    }
    return this.matchList.length;
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

  setOptions: function(options) {

    (IncSearch.ViewTable.prototype.setOptions).apply(this, [options]);

    if (options.tagBracket != undefined)
      this.tagBracket = options.tagBracket;
  },

  isMatch: function(post, patternList) {

    var value = post.title + "\n" + post.info + "\n" + this.tagsString(post.tags, '\n') + "\n" + post.others.join("\n");

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
    text += " onkeypress=\"var event = event || window.event; if (event.keyCode == Event.KEY_RETURN) {window.open('" + post.url + "'); return false;}\">";
    text += this.createText(post.title, patternList);
    text += '</a><br />';

    // info
    if (post.info) {
      text += this.createElement(post.info, patternList, 'p');
    }
    text += '</td>';

    // tags
    if (post.tags) {
      text += this.createElement(this.tagsString(post.tags), patternList, 'td');
    }

    // others
    for (var i = 0; i < post.others.length; i++) {
      text += this.createElement(post.others[i], patternList, 'td');
    }
    text += '</tr>';

    return text;
  },

  tagsString: function(tags, sep) {
    sep = sep || ' ';
    if (this.tagBracket && tags.length != 0) {
      return '[' + tags.join(']' + sep + '[') + ']';
    } else {
      return tags.join(sep);
    }
  }
});
