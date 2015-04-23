(function (callback) {
  if (typeof define === 'function' && define.amd) {
    define(['core/AbstractWidget'], callback);
  }
  else {
    callback();
  }
}(function () {

(function ($) {

/**
 * A pager widget for jQuery.
 *
 *
 * @expects this.target to be a list.
 * @class PagerWidget
 * @augments AjaxSolr.AbstractWidget
 * not the facets. Update only itself and the results widget.
 */
AjaxSolr.PagerWidget = AjaxSolr.AbstractWidget.extend(
  /** @lends AjaxSolr.PagerWidget.prototype */
  {
  /**
   * @param {Object} [attributes]
   * @param {Number} [attributes.innerWindow] How many links are shown around
   *   the current page. Defaults to 4.
   * @param {Number} [attributes.outerWindow] How many links are around the
   *   first and the last page. Defaults to 1.
   * @param {String} [attributes.prevLabel] The previous page link label.
   *   Defaults to "&laquo; Previous".
   * @param {String} [attributes.nextLabel] The next page link label. Defaults
   *   to "Next &raquo;".

   */
  constructor: function (attributes) {
    AjaxSolr.PagerWidget.__super__.constructor.apply(this, arguments);
    AjaxSolr.extend(this, {
      rows: "50",
      innerWindow: 4,
      outerWindow: 1,
      prevLabel: '&laquo; Previous',
      nextLabel: 'Next &raquo;',
      // The current page number.
      currentPage: null,
      // The total number of pages.
      totalPages: null,
    }, attributes);
  },

  beforeRequest: function(){
  },

  /**
   * @returns {Array} The links for the visible page numbers.
   */
  windowedLinks: function () {
    var links = [];

    var prev = null;

    visible = this.visiblePageNumbers();
    if (visible != null){
      for (var i = 0, l = visible.length; i < l; i++) {
        links.push(this.pageLinkOrSpan(visible[i]));
      }
    }
    return links;
  },

  /**
   * @returns {Array} The visible page numbers according to the window options.
   */
  visiblePageNumbers: function () {
    var pages = [];
    if (this.totalPages == 1) return null;
    if (this.totalPages <= 9){
      for (var i = 1; i<= this.totalPages; i++){
        pages.push(i);
      }
    }
    else{
      var left_diff = this.currentPage;
      if (left_diff < 5){ //if current is close to start,
        for (var i = 1; i<= left_diff; i++){ //show all left pages
          pages.push(i);
        }
      }
      else{// else add 5 left pages,
        pages.push(1); //always show first page
        for (var i= this.currentPage - 4; i < this.currentPage; i++){
          if (i == 1){continue}
          pages.push(i);
        }
        pages.push(this.currentPage);
      }
      var right_diff = this.totalPages - this.currentPage;
      if (right_diff < 5){ //if current is close to end,
        for (var i = this.currentPage + 1; i<= this.totalPages; i++){ //add all right pages
          pages.push(i);
        }
      }
      else{// else add 5 right pages
        for (var i = 1; i < 5; i++){
          pages.push(i+ this.currentPage);
        }
      }
    }
    return pages;
  },

  /**
   * @param {Number} page A page number.
   * @param {String} text The inner HTML of the page link (optional).
   * @returns The link or span for the given page.
   */
  pageLinkOrSpan: function (page, text) {
    text = text || page;

    if (page && page != this.currentPage) {
      return $('<button></button>').html(text).button().click(this.clickHandler(page));
    }
    else {
      return $('<button></button>').html(text).addClass("ui-state-active").button({disabled: true});
    }
  },

  /**
   * @param {Number} page A page number.
   * @returns {Function} The click handler for the page link.
   */
  clickHandler: function (page) {
    var self = this;
    return function () {
      self.manager.store.get('start').val((page - 1) * self.perPage());
      self.doRequest(undefined,"select",false);
      return false;
    }
  },

  /**
   * @param {Number} page A page number.
   * @returns {String} The <tt>rel</tt> attribute for the page link.
   */
  relValue: function (page) {
    switch (page) {
      case 1:
        return 'start';
      default:
        return '';
    }
  },

  /**
   * @returns {Number} The page number of the previous page or null if no previous page.
   */
  previousPage: function () {
    return this.currentPage > 1 ? (this.currentPage - 1) : null;
  },

  /**
   * @returns {Number} The page number of the next page or null if no next page.
   */
  nextPage: function () {
    return this.currentPage < this.totalPages ? (this.currentPage + 1) : null;
  },

  /**
   * Render the pagination links.
   *
   * @param {Array} links The links for the visible page numbers.
   */
  renderLinks: function (links) {
    if (this.totalPages > 1) {
      links.unshift(this.pageLinkOrSpan(this.previousPage(), this.prevLabel));
      links.push(this.pageLinkOrSpan(this.nextPage(), this.nextLabel));

      var $target = $(this.target);
      $target.empty();

      for (var i = 0, l = links.length; i < l; i++) {
        $target.append(links[i]);
      }
    }
  },

  /**
   * @returns {Number} The number of results to display per page.
   */
  perPage: function () {
    //return 50;
    return parseInt(this.manager.response.responseHeader && this.manager.response.responseHeader.params && this.manager.response.responseHeader.params.rows || this.manager.store.get('rows').val() || 10);
  },

  /**
   * @returns {Number} The Solr offset parameter's value.
   */
  getOffset: function () {
    return parseInt(this.manager.response.responseHeader && this.manager.response.responseHeader.params && this.manager.response.responseHeader.params.start || this.manager.store.get('start').val() || 0);
  },

  afterRequest: function () {
    var perPage = this.perPage();
    var offset  = this.getOffset();
    var total   = parseInt(this.manager.response.response.numFound);

    // Normalize the offset to a multiple of perPage.
    offset = offset - offset % perPage;

    this.currentPage = Math.ceil((offset + 1) / perPage);
    this.totalPages = Math.ceil(total / perPage);

    $(this.target).empty();

    this.renderLinks(this.windowedLinks());
    var display = $('<span>Displaying ' + Math.min(total, offset + 1) + ' to ' + Math.min(total, offset + perPage) + ' of ' +'<b>' + total + '</b></span>');
    $(this.target).append(display);
  },

  clusterResults: function () {
    var self = this,
        labels = "<p id='cluster_labels'> Displaying Cluster(s): ";
    $(this.target).empty();

    for (var i=0; i<self.manager.clusterLabels.length; i++){
        if (i == 0){
          labels += "<b>" + self.manager.clusterLabels[i] + "</b>";
        }
        else{
          labels += " and " + "<b>" + self.manager.clusterLabels[i] + "</b>";
        }
    }
    labels += ".</p>";

    $(this.target).append($(labels));
    $(this.target).append($('<p>Return to query results</p>').button().click(function() {
          $("circle").css("fill", "#50c1cc");
          self.afterRequest();
          self.manager.widgets["result"].afterRequest();
        }
    ));
    $(this.target).append($('<p>Search More Like this</p>').button().click(function(){
          var result = "";
          for (var i =0; i< self.manager.clusterLabels.length; i++){
            var text = self.manager.clusterLabels[i];
            if (i ==0){
              result += text.slice(0, text.indexOf("("));
            }
            else{
              result += " OR " + text.slice(0, text.indexOf("(")) ;
            }
          }
          self.manager.store.addByValue('q', result);
          self.manager.doRequest(null, "select", true);
        }
    ));
  }
});

})(jQuery);

}));
