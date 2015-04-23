(function ($) {
  /**
   * A widget in charge of saving the current search state of the search engine
   *
   */

AjaxSolr.CurrentSearchWidget = AjaxSolr.AbstractWidget.extend({
  start: 0,

  /**
   * Method called as soon as data is retrieved from Solr. This method is responsible for showing
   * the current state as well as listen to any change (removing facets, making a new query, etc)
   */
  afterRequest: function () {
    var self = this;
    var links = [];

    var q = this.manager.store.get('q').val();
    if (q != '*:*') {
      var a = $("<li style='cursor:pointer'><i class='fa-li fa fa-close' style='color:#77b8f0'></i><a href=''#'>" + self.formatFacet(q) + "</a></li>");
      links.push(a.click(function () {
        self.manager.store.get('q').val('*:*');
        self.doRequest(null, "select", true);
        self.manager.widgets["text"].clear();
        return false;
      }));
    }

    var fq = this.manager.store.values('fq');
    for (var i = 0, l = fq.length; i < l; i++) {
      var a = $("<li style='cursor:pointer'><i class='fa-li fa fa-close' style='color:#77b8f0'></i><a href=''#'>" + self.formatFacet(fq[i]) + "</a></li>");
      links.push(a.click(self.removeFacet(fq[i])));
    }

    if (links.length > 1) {
      links.unshift($('<a style="font-size:135%" href="#">Remove all</a>').click(function () {
        for ( var member in self.manager.curr){
          self.manager.curr[member] = {};
        }
        self.manager.store.get('q').val('*:*');
        self.manager.store.remove('fq');
        self.doRequest(null, "select", true);
        self.manager.widgets["currentsearch"].clear();
        return false;
      }));
    }

    if (links.length) {
      var $target = $(this.target);
      $target.empty();
      for (var i = 0, l = links.length; i < l; i++) {
        $target.append(links[i]);
      }
    }
    else {
      $(this.target).html('<li>Viewing all documents!</li>');
    }
  },

  /**
   * Safely removes a facet query from the widget and
   * sends the new state as a request to Solr
   *
   * @param facet
   */
  removeFacet: function (facet) {
    var self = this;
    return function () {
      var field = facet.substring(0,facet.indexOf(":"));
      var pretty_facet = facet.substring(facet.indexOf(":")+1);
      pretty_facet = pretty_facet.replace(/"/g, '');
      self.manager.curr[field][pretty_facet] = undefined;
      if (self.manager.store.removeByValue('fq', facet)) {
        self.doRequest(null, "select", true);

      }
      return false;
    };
  },

  /**
   * Formats a facet query (basically pretty prints it).
   * @param facet
   * @returns {string}
   */
  formatFacet: function (facet){
    var result = facet.replace(/_/g, " ");
    result = result.replace("%26", "&");
    result = result.replace(/:/g, ": ");
    result = result.replace(/\+/g, " ");
    return result;
  }
});

})(jQuery);
