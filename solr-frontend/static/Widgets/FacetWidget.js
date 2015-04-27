(function ($) {
  /**
   * A widget in charge manipulating and presenting the facet results from Solr.
   */

AjaxSolr.FacetWidget = AjaxSolr.AbstractFacetWidget.extend({

  /**
   * Method called immediately after initial data comes back. Emtpies the target HTML,
   * and appends it with the facet results.
   */
  afterRequest: function () {
    if (this.manager.response.facet_counts.facet_fields[this.field] === undefined) {
      $(this.target).html('no items found in current selection');
      return;
    }
    var maxCount = 0;
    var objectedItems = [];
    var tagCloudList = this.manager.response.facet_counts.facet_fields[this.field];

    for (var i = 0; i< tagCloudList.length; i++) {
      if (tagCloudList[i] == undefined){
        continue;
      }
      if (i % 2 == 0) {
        objectedItems.push({facet: tagCloudList[i], count: parseInt(tagCloudList[i+1])});
      }
      else {
        var count = parseInt(tagCloudList[i]);
        if (count > maxCount) {
          maxCount = count;}
      }
    }
    objectedItems.sort(function (a, b) {
      return a.facet < b.facet ? -1 : 1;
    });

    $(this.target).empty();
    var tagCloud_total = 0;
    //for (var k=0; k < objectedItems.length; k++){
    //  tagCloud_total+= parseInt(objectedItems[k].count);
    //}
    //tagCloud_total = tagCloud_total / objectedItems.length;

    //console.log(objectedItems);

    for (var j = 0, l = objectedItems.length; j < l; j++) {
      if (objectedItems[j].facet == this.manager.curr[this.field][objectedItems[j].facet]){
        continue;
      }
      var facet = objectedItems[j].facet;
      //if (tagCloud_total == 1){
      //  var tagCloud_size = 4;
      //}
      //else{
        tagCloud_size = parseInt(objectedItems[j].count / maxCount * 10);
      //}
      $(this.target).append(
        $('<a href="#" class="tagcloud_item"></a>')
        .text(facet + this.addComa(j, l))
        .addClass('tagcloud_size_' + tagCloud_size)
            .click(this.tagClick(facet, this.field, this.manager))
      );
    }
  },

  /**
   * Helper function
   */
  addComa: function (iter, len){
    if (iter != len - 1){
      return ','
    }
    else{
      return ''
    }
  },

  /**
   * Helper function, handlers a click to a filter tag.
   * @param facet The facet clicked.
   * @param field The field which the facet belongs to.
   * @param manager The manager reference.
   */
  tagClick: function(facet, field, manager){
    var self = this;
    return function(){
      facet = facet.replace("&", "%26"); //replace & with +
      var result = field +  ':"' + facet + '"';
      if (manager.curr[field][facet] != undefined){ //delete selection
        manager.curr[field][facet] = undefined;
        $(this).children("i").remove();
        self.manager.store.removeByValue('fq', result);
      }
      else{                                  //add selection
        manager.curr[field][facet] = facet;
        $(this).append($('<i class="fa fa-check"></i>'));
        manager.store.addFacetValue('fq', result);
      }
      if (manager.store.params.fq == undefined){
        $( "#filters" ).button( "option", "disabled", true );
      }
      else{
        $( "#filters" ).button( "option", "disabled", false );
      }
      return false;
    }
  }

});

})(jQuery);
