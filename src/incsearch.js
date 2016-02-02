/*
--------------------------------------------------------
incsearch.js - Incremental Search
Version 2.0 (Update 2007/06/20)

- onozaty (http://www.enjoyxstudy.com)

Released under the Creative Commons License(Attribution 2.1 Japan):
 http://creativecommons.org/licenses/by/2.1/jp/

For details, see the web site:
 http://www.enjoyxstudy.com/javascript/incsearch

--------------------------------------------------------
*/

if (!IncSearch) {
  var IncSearch = {};
}

/*-- Utils --------------------------------------------*/
IncSearch._copyProperties = function(dest, src) {
  for (var property in src) {
    dest[property] = src[property];
  }
  return dest;
};

IncSearch._copyProperties = function(dest, src) {
  for (var property in src) {
    dest[property] = src[property];
  }
  return dest;
};

IncSearch._getElement = function(element) {
  return (typeof element == 'string') ? document.getElementById(element) : element;
};

IncSearch._addEvent = (window.addEventListener ?
  function(element, type, func) {
    element.addEventListener(type, func, false);
  } :
  function(element, type, func) {
    element.attachEvent('on' + type, func);
  });

IncSearch._stopEvent = function(event) {
  if (event.preventDefault) {
    event.preventDefault();
    event.stopPropagation();
  } else {
    event.returnValue = false;
    event.cancelBubble = true;
  }
};

IncSearch._getEventElement = function(event) {
  return event.target || event.srcElement;
};

/*-- IncSearch.ViewBase -------------------------------*/
IncSearch.ViewBase = function() {
  this.initialize.apply(this, arguments);
};
IncSearch.ViewBase.prototype = {
  initialize: function(input, viewArea, searchValues) {
    this.input = IncSearch._getElement(input);
    this.viewArea = IncSearch._getElement(viewArea);
    this.searchValues = searchValues;

    this.checkLoopTimer = null;
    this.oldInput = null;
    this.matchList = null;
    this.setOptions(arguments[3] || {});

    this.nowPage = 0;

    // check loop start
    this.checkLoop();
  },

  // options
  interval: 500,
  delay: 0,
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
  useHotkey: false,

  setOptions: function(options) {

    IncSearch._copyProperties(this, options);

    if (this.useHotkey) {
      var keyevent = (window.opera) ? 'keypress' : 'keydown';
      IncSearch._addEvent(document, keyevent, this._bindEvent(this.hotkey));
    }
  },

  checkLoop: function() {
    var input = this.getInput();
    if (this.isChange(input)) {
      this.oldInput = input;
      if (this.delay == 0) {
        this.startSearch(input);
      } else {
        if (this.startSearchTimer) clearTimeout(this.startSearchTimer);
        this.startSearchTimer = setTimeout(this._bind(this.startSearch, input), this.delay);
      }
    }
    if (this.checkLoopTimer) clearTimeout(this.checkLoopTimer);
    this.checkLoopTimer = setTimeout(this._bind(this.checkLoop), this.interval);
  },

  isChange: function(input) {
    return (!this.oldInput || (input.join(this.delim) != this.oldInput.join(this.delim)));
  },

  startSearch: function(input) {
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

    pageLinkElm = IncSearch._getElement(pageLinkElm);

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
      this.createPageAnchor(pageLinkElm, this.pagePrevName, pageNo - 1);
    }
    if (next_page) {
      if (prev_page) {
        pageLinkElm.appendChild(document.createTextNode(' | '));
      }

      this.createPageAnchor(pageLinkElm, this.pageNextName, pageNo + 1);
    }
  },

  createPageAnchor: function(parent, text, page) {

    var a = parent.appendChild(document.createElement('a'));
    a.setAttribute('href', 'javascript:void(0)');
    a.appendChild(document.createTextNode(text));

    IncSearch._addEvent(a, 'click', this._bind(this.changePage, page));
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
      if (event.keyCode == 39) { // key right
        if (this.nowPage < this.getPageCount()) {
          this.changePage(this.nowPage + 1);
        }
        IncSearch._stopEvent(event);
      } else if (event.keyCode == 37) { // key reft
        if (this.nowPage > 1) {
          this.changePage(this.nowPage - 1);
        }
        IncSearch._stopEvent(event);
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

    this.matchList = [];

    for (var i = 0, len = this.searchValues.length; i < len; i++) {
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

    var textList = [];

    if (this.highlight) {

      var first = this.getFirstMatch(value, patternList);

      while (first.listIndex != -1) {
        textList.push(this._escapeHTML(value.substr(0, first.matchIndex)));
        textList.push('<strong class="');
        textList.push(this.highClassName);
        textList.push((first.listIndex % this.highClassNum) + 1);
        textList.push('">');
        textList.push(this._escapeHTML(value.substr(first.matchIndex, patternList[first.listIndex].length)));
        textList.push('</strong>');

        value = value.substr(first.matchIndex + patternList[first.listIndex].length);
        first = this.getFirstMatch(value, patternList);
      }
    }

    textList.push(this._escapeHTML(value));

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

    for (var i = 0, len = patternList.length; i < len; i++) {
      var index = this.matchIndex(value, patternList[i]);
      if (index != -1 && index < first.matchIndex) {
        first.listIndex = i;
        first.matchIndex = index;
      }
    }

    return first;
  },

  getInput: function() {

    var value = this.input.value;

    if (!value) {
      return [];
    } else if (this.delim) {
      var list = value.split(this.delim);
      var inputs = [];
      for (var i = 0, len = list.length; i < len; i++) {
        if (list[i]) inputs.push(list[i]);
      }
      return inputs;
    } else {
      return [value];
    }
  },

  // Utils
  _bind: function(func) {
    var self = this;
    var args = Array.prototype.slice.call(arguments, 1);
    return function(){ func.apply(self, args); };
  },
  _bindEvent: function(func) {
    var self = this;
    var args = Array.prototype.slice.call(arguments, 1);
    return function(event){ event = event || window.event; func.apply(self, [event].concat(args)); };
  },
  _escapeHTML: function(value) {
    if (this.escape) {
      return value.replace(/\&/g, '&amp;').replace( /</g, '&lt;').replace(/>/g, '&gt;')
                .replace(/\"/g, '&quot;').replace(/\'/g, '&#39;').replace(/\n|\r\n/g, '<br />');
    } else {
      return value;
    }
  }

}

/*-- IncSearch.ViewList -------------------------------*/
IncSearch.ViewList =  function() {
  this.initialize.apply(this, arguments);
};
IncSearch._copyProperties(IncSearch.ViewList.prototype, IncSearch.ViewBase.prototype);

IncSearch.ViewList.prototype.listTagName = 'div';

IncSearch.ViewList.prototype.isMatch = function(value, patternList) {

  for (var i = 0, len = patternList.length; i < len; i++) {
    if (this.matchIndex(value, patternList[i]) == -1) {
      return false;
    }
  }
  return true;
};

IncSearch.ViewList.prototype.createLineElement = function(index, patternList) {
  return this.createElement(this.searchValues[index], patternList, this.listTagName);
};

/*-- IncSearch.ViewTable -------------------------------*/
IncSearch.ViewTable =  function() {
  this.initialize.apply(this, arguments);
};
IncSearch._copyProperties(IncSearch.ViewTable.prototype, IncSearch.ViewBase.prototype);

IncSearch.ViewTable.prototype.startElementText = '<table>';
IncSearch.ViewTable.prototype.endElementText = '</table>';

IncSearch.ViewTable.prototype.isMatch = function(valueArray, patternList) {

  var value = valueArray.join("\n");

  for (var i = 0, len = patternList.length; i < len; i++) {
    if (this.matchIndex(value, patternList[i]) == -1) {
      return false;
    }
  }
  return true;
};

IncSearch.ViewTable.prototype.createLineElement = function(index, patternList) {

  var text = '<tr>';
  for (var i = 0, len = this.searchValues[index].length; i < len; i++) {
    text += this.createElement(this.searchValues[index][i], patternList, 'td');
  }

  text += '</tr>';
  return text;
};

/*-- IncSearch.ViewBookmark -------------------------------*/
IncSearch.ViewBookmark =  function() {
  this.initialize.apply(this, arguments);
};
IncSearch._copyProperties(IncSearch.ViewBookmark.prototype, IncSearch.ViewTable.prototype);

IncSearch.ViewBookmark.prototype.isMatch = function(post, patternList) {

  var value = this.createValue(post);

  for (var i = 0, len = patternList.length; i < len; i++) {
    if (this.matchIndex(value, patternList[i]) == -1) {
      return false;
    }
  }
  return true;
};

IncSearch.ViewBookmark.prototype.createLineElement = function(index, patternList) {

  var post = this.searchValues[index];

  var text = '<tr><td>';

  // url, title
  text += this.createTitleElement(post, patternList);

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
  text += this.createOthersElement(post, patternList);
  text += '</tr>';

  return text;
};

IncSearch.ViewBookmark.prototype.tagsString = function(tags, sep) {

  if (typeof(tags) == 'string') return tags;

  sep = sep || ' ';
  if (this.tagBracket && tags.length != 0) {
    return '[' + tags.join(']' + sep + '[') + ']';
  } else {
    return tags.join(sep);
  }
};

IncSearch.ViewBookmark.prototype.createValue = function(post) {
  return post.title + "\n" + post.info + "\n" + this.tagsString(post.tags, '\n') + "\n" + post.others.join("\n");
};

IncSearch.ViewBookmark.prototype.createTitleElement = function(post, patternList) {
  var text = '<a href="' +  post.url + '"';
  if (this.target) {
    text += ' target="' + this.target + '" ';
  }
  text += '>';
  text += this.createText(post.title, patternList);
  text += '</a><br />';

  return text;
};

IncSearch.ViewBookmark.prototype.createOthersElement = function(post, patternList) {
  var text = '';
  for (var i = 0, len = post.others.length; i < len; i++) {
    text += this.createElement(post.others[i], patternList, 'td');
  }

  return text;
};
