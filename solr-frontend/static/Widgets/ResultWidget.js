(function ($) {
  /**
   * A widget in charge manipulating and presenting the document results from Solr.
   */

AjaxSolr.ResultWidget = AjaxSolr.AbstractWidget.extend({
  start: 0,
  rows: "50",
  docHeight: undefined,

  init: function () {
    this.docHeight = $("body").height() * 0.15; //set each documents height
    var self = this;
    $(document).on('click', '.more', function () {
      var $this = $(this),
          divText = $this.parent().find('div.results-text'),
          faIcon = $this.find("i");

      if (faIcon.hasClass("fa-chevron-up")){
        divText.css("height", self.docHeight);
        faIcon.removeClass();
        faIcon.addClass("fa fa-chevron-down")
      }
      else{
        divText.css("height", "auto");
        faIcon.removeClass();
        faIcon.addClass("fa fa-chevron-up")
      }
      return false;
    });

    $(document).on('click', '.expand', function(){
      var $this = $(this),
          span = $this.parent().find('#overflow');

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
    $("#tab-tagcloud").prepend($('<div id="filters">Apply Selected Filters</div>').button({disabled: true}).click(function(){return self.doRequest(null, "select", true)}));
    $("#full_text").change(self.handleQueryChange(self));
  },

  /**
   * Method called right before manager.doRequest finishes. Appends a loading gif
   */
  beforeRequest: function () {
    $(this.target).html($('<img id="Loading">').attr('src', '/static/images/Loading.gif'));
  },

  /**
   * Method called immediately after initial data comes back. Emtpies the target HTML,
   * and appends it with each documents data with links.
   *
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
      var maxAuthors = 12;
      if (items.length > maxAuthors ){
        for (var j = 0; j < maxAuthors; j++) {
          $links.append($('<li></li>').append(items[j]));
        }
        var $overflow = $('<span id="overflow" style="display:none;">'); //start overflow of authors
        for (var j = maxAuthors; j<=items.length; j++){
          $overflow.append($('<li></li>').append(items[j]));
        }
        $links.append($overflow);
        $links.append('</span><a href="#" class="author-link expand">...[more]</a>'); //end overflow
      }
      else{
        for (var j = 0, m = items.length; j < m; j++) {
          $links.append($('<li></li>').append(items[j]));
        }
      }
    }
      var allTags = $('.GENE');
      for (var t =0; t<allTags.length; t++){
          this.manager.widgets["tooltip"].tagInfo(allTags[t]);
      }
  },

  /**
   * Method called immediately after cluster data comes back, it is very similar to
   * afterRequest but tailored for cluster data. Emtpies the target HTML,
   * and appends it with each cluster documents data with links.
   */
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
          $links.append('</span><a href="#" class="author-link expand">...[more]</a>'); //end overflow
        //$links.append('</span> <div class="author-link expand"><p class="clickable" >...[more]</p></div>'); //end overflow
      }
      else {
        for (var j = 0, m = items.length; j < m; j++) {
          $links.append($('<li></li>').append(items[j]));
        }
      }
    }
      var allTags = $('.GENE');
      for (var t =0; t<allTags.length; t++){
          this.manager.widgets["tooltip"].tagInfo(allTags[t]);
      }
  },

  /**
   * Helper function. Creates HTML content based on the document
   * @param doc the document JSON object.
   * @param i the current index of the document.
   * @returns {HTMLElement} the formatted HTML contet to present.
   */
  template: function (doc, i) {
      var abstract = '',
          output = '';

    if (doc.abstract == undefined){ //No abstract..
      output = '<div class="document"><div class="title"><span class="rank">' + this.getRank(i)+ '</span><h2>' + doc.title + " "; //title
      output += '<i class="fa fa-info-circle" id=info-'+doc.pmid + '></i></h2>'; //info
      output += '<p id="links_' + doc.pmid + '" class="links"></p>';
      output += '<p>[No Abstract Available]</p></div>';
      output += '<div class="external"><a target="_blank" href="http://www.ncbi.nlm.nih.gov/pubmed/' + doc.pmid + '">' + "Pubmed " + '<i class="fa fa-external-link"></i></a></div>';
      return output;
    }
    else{ //Abstract found
      abstract = doc.abstract.toString();
      if (this.countWords(abstract) >= 200) {
        abstract = '<div class="results-text" style="height:' + this.docHeight + 'px"</div><p>' + abstract + '</p></div>';
        abstract += '<div class="more"><i class="fa fa-chevron-down"></i></div>';
      }
      else {
        abstract = '<div><p class="results-text">' + abstract + '</p></div>';
      }
      output = '<div class="document"><div class="title"><span class="rank">' + this.getRank(i) + '</span><h2>' + doc.title + " "; //title
      output += '<i class="fa fa-info-circle" id=info-'+doc.pmid + '></i></h2>';//info
      output += '<p id="links_' + doc.pmid + '" class="links"></p></div>'; //authors
      output += abstract; //snippet
      output += '<div class="external"><a target="_blank" href="http://www.ncbi.nlm.nih.gov/pubmed/' + doc.pmid + '">' + "Pubmed " + '<i class="fa fa-external-link"></i></a></div></div>'; //pubmed link
      return output;
    }
  },

  /**
   * Helper function. Handles full text query changes.
   * @param self
   */
  handleQueryChange: function(self) {
    return function(){
      self.manager.queryOptions = !self.manager.queryOptions;
    };
  },

  /**
   * Helper function: Creates a list of HTML content representing
   * the corresponding authors with links.
   * @param authors list of authors
   * @returns A list of HTML content authors. or null if undefined.
   */
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

  /**
   * Handler for when an author is selected. Makes a Manager.doRequest
   * @param author
   */
  authorHandler: function (author){
    var self = this;
    return function(){
      author = author.replace(/ /g, "+");
      self.manager.store.remove('fq');
      self.manager.store.addByValue('q', 'authors:' + author);
      self.manager.doRequest(null, "select", false);
    }
  },

  /**
   * Helper function to add coma to each author list
   * @param iter
   * @param len
   * @returns {string} returns comma if mutlitple, empty if last.
   */
  addComa: function (iter, len){
    if (iter != len - 1){
      return ',';
    }
    else{
      return '';
    }
  },
  /**
   * Helper function. Retrieves rank of document i
   * @param i
   * @returns number representation of rank
   */
  getRank: function(i){
    return (i + this.manager.response.response.start + 1);
  },
  /**
   * Helper function. Count the words in a string. Used for splitting a text
   * overflow at a proper site.
   * @param {String} text The text to count words on
   * @returns {Number} The number of words
   */
  countWords: function(text){
    var words = text.split(/\s+/);
    return words.length;
  }
});

})(jQuery);