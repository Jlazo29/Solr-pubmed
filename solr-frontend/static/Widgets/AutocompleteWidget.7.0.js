(function ($) {

AjaxSolr.AutocompleteWidget = AjaxSolr.AbstractTextWidget.extend({
  afterRequest: function (){
    $(this.target).find('input').autocomplete();
    //$(this.target).find('input').unbind().removeData('events').val('');

    var self = this;

    var list = [];
    for (var i = 0; i < this.fields.length; i++) {
      var field = this.fields[i];
      var response_facet = this.manager.response.facet_counts.facet_fields[field];
      for (var i = 0; i< response_facet.length; i++) {
        if( i % 2 != 0) continue;
        list.push({
          field: field,
          value: response_facet[i],
          label: ' (' + this.manager.response.facet_counts.facet_fields[field][i] + ') - ' + self.formatField(field)
        });
      }
    }

    this.requestSent = false;
    $(this.target).find('input').autocomplete('destroy').autocomplete({
      source: list,
      select: function(event, ui) {
        if (ui.item) {
          self.requestSent = true;
          if (self.manager.store.addByValue('fq', ui.item.field + ':' + AjaxSolr.Parameter.escapeValue(ui.item.value))) {
            self.doRequest(null, "select", true);
          }
        }
      }
    });

    // This has lower priority so that requestSent is set.
    $(this.target).find('input').bind('keydown', function(e) {
      if (self.requestSent === false && e.which == 13) {
        var value = $(this).val();
        if (value && self.set(value)) {
          self.doRequest(null, "select", true);
        }
      }
    });


  }, //end callback

  clusterResults: function () {

  },

  formatField: function(field){
    var result = field.replace(/_/g, " ");
    result = result.replace(/:/g, ": ");
    result = result.replace(/d\+1/g, " ");
    return result;
  }

});

})(jQuery);
