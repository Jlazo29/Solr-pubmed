(function ($) {

AjaxSolr.ResultWidget = AjaxSolr.AbstractWidget.extend({
  start: 0,
  rows: "50",

  beforeRequest: function () {
    $(this.target).html($('<img id="Loading">').attr('src', '/static/images/Loading.gif'));
  },

  authorLinks: function(authors){
    var links = [];
    if (authors !== undefined){
      for (var i = 0; i<= authors.length; i++){
        if (authors[i] !== undefined){
          links.push(
              $('<a class="author-link" href="#"></a>')
                  .text(authors[i] + this.addComa(i, authors.length))
                  .click(this.authorHandler(authors[i]))
          );
        }
      }
      return links;
    }
    else{
      return null;
    }
  },

  authorHandler: function (author){
    var self = this;
    return function(){
      author = author.replace(/ /g, "+");
      self.manager.store.remove('fq');
      self.manager.store.addByValue('q', 'authors:' + author);
      self.manager.doRequest(null, "select", false);
    }
  },


  addComa: function (iter, len){
    if (iter != len - 1){
      return ',';
    }
    else{
      return '';
    }
  },

  getRank: function(i){
    return (i + this.manager.response.response.start + 1);
  },

  /*
   The afterRequest method empties the target HTML element and appends HTML content to it for each document in the Solr response.
   */
  afterRequest: function () {
    $(this.target).empty();
    for (var i = 0, l = this.manager.response.response.docs.length; i < l; i++) {
      var doc = this.manager.response.response.docs[i];
      $(this.target).append(this.template(doc, i));

      var items = [];
      items = items.concat(this.authorLinks(doc.authors));

      var $links = $('#links_' + doc.pmid);
      $links.empty();
      if (items.length > 10 ){
        for (var j = 0; j <= 9; j++) {
          $links.append($('<li></li>').append(items[j]));
        }
        var $overflow = $('<span id="overflow" style="display:none;">'); //start overflow of authors
        for (var j = 10; j<=items.length; j++){
          $overflow.append($('<li></li>').append(items[j]));
        }
        $links.append($overflow);
        $links.append('</span> <a href="#" class=" author-link more">[more]</a>'); //end overflow
      }
      else{
        for (var j = 0, m = items.length; j < m; j++) {
          $links.append($('<li></li>').append(items[j]));
        }
      }
    }
  },

  clusterResults: function(){
    $(this.target).empty();
    for (var i = 0, l = this.manager.clustersDocs.length; i < l; i++) {
      var doc = this.manager.clustersDocs[i];
      $(this.target).append(this.template(doc, i));

      var items = [];
      items = items.concat(this.authorLinks(doc.authors));

      var $links = $('#links_' + doc.pmid);
      $links.empty();
      if (items.length > 10) {
        for (var j = 0; j <= 9; j++) {
          $links.append($('<li></li>').append(items[j]));
        }
        var $overflow = $('<span id="overflow" style="display:none;">'); //start overflow of authors
        for (var j = 10; j <= items.length; j++) {
          $overflow.append($('<li></li>').append(items[j]));
        }
        $links.append($overflow);
        $links.append('</span> <a href="#" class=" author-link more">[more]</a>'); //end overflow
      }
      else {
        for (var j = 0, m = items.length; j < m; j++) {
          $links.append($('<li></li>').append(items[j]));
        }
      }
    }
  },

  template: function (doc, i) {
    var snippet = '';

    if (doc.abstract == undefined){ //No abstract..
      var output = '<div class="document"><div class="title"><span class="rank">' + this.getRank(i)+ '</span><h2>' + doc.title + " "; //title
      output += '<i class="fa fa-info-circle" id=info-'+doc.pmid + '></i></h2>'; //info
      output += '<p id="links_' + doc.pmid + '" class="links"></p>';
      output += '<p>[No Abstract Available]</p>';
      output += '<a class="external" target="_blank" href="http://www.ncbi.nlm.nih.gov/pubmed/' + doc.pmid + '">' + "Pubmed " + '<i class="fa fa-external-link"></i></a></div>';
      return output;
    }
    else{ //Abstract found
      var abstract = doc.abstract.toString();
      if (abstract.length >= 600) {
        snippet +=  abstract.substring(0, 600);
        snippet += '<span style="display:none;">' + abstract.substring(600);
        snippet += '</span> <a href="#" class="more">...[more]</a>';
      }
      else {
        snippet += abstract;
      }
      var output = '<div class="document"><div class="title"><span class="rank">' + this.getRank(i) + '</span><h2>' + doc.title + " "; //title
      output += '<i class="fa fa-info-circle" id=info-'+doc.pmid + '></i></h2></div>'; //info
      output += '<p id="links_' + doc.pmid + '" class="links"></p>'; //authors
      output += '<p class="results-text">' + snippet + '</p>'; //abstract
      output += '<a class="external" target="_blank" href="http://www.ncbi.nlm.nih.gov/pubmed/' + doc.pmid + '">' + "Pubmed " + '<i class="fa fa-external-link"></i></a></div>'; //pubmed link
      return output;
    }
  },

  handleQueryChange: function(self) {
    return function(){
      self.manager.queryOptions = !self.manager.queryOptions;
    };
  },

  init: function () {
    var self = this;
    $(document).on('click', 'a.more', function () {
      var $this = $(this),
          span = $this.parent().find('span');

      if (span.is(':visible')) {
        span.hide();
        $this.text('...[more]');
      }
      else {
        span.show();
        $this.text('[less]');
      }
      return false;
    });
    $("#tab-tagcloud").prepend($('<div id="filters">Apply Selected Filters</div>').button({disabled: true}).click(function(){return self.doRequest(null, "select", false)}));
    $("#full_text").change(self.handleQueryChange(self));
  }
});

})(jQuery);