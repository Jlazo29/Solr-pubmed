(function ($) {

AjaxSolr.TextWidget = AjaxSolr.AbstractTextWidget.extend({
  init: function () {
    var self = this;
    $(this.target).find('input').bind('keydown', function(e) {
      if (e.which == 13) {
        var value = $(this).val();
        self.manager.store.get('q').val(value);
        self.doRequest(undefined, "select", true);
      }
    });
  },


  afterRequest: function () {
  },

  clear: function(){
    $(this.target).find('input').val('');
  }
});

})(jQuery);
