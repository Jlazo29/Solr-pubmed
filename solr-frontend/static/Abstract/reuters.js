var Manager;

(function ($) {

  $(function () {
    Manager = new AjaxSolr.Manager({
      solrUrl: 'http://localhost:8983/core0/'
    });
    Manager.addWidget(new AjaxSolr.ResultWidget({
      id: 'result',
      target: '#docs'
    }));
    Manager.addWidget(new AjaxSolr.PagerWidget({
      id: 'pager',
      target: '.pager',
      prevLabel: '&laquo;',
      nextLabel: '&raquo;',
      innerWindow: 1
    }));

    var fields = [ 'journal', 'gene-mention', 'date'];
    for (var i = 0, l = fields.length; i < l; i++) {
      Manager.addWidget(new AjaxSolr.FacetWidget({
        id: fields[i],
        target: '#' + fields[i],
        field: fields[i]
      }));
    }

    Manager.addWidget(new AjaxSolr.CurrentSearchWidget({
      id: 'currentsearch',
      target: '#selection'
    }));

    //Manager.addWidget(new AjaxSolr.AutocompleteWidget({
    //  id: 'text',
    //  target: '#search',
    //  fields: [ 'journal', 'date' ]
    //}));

    Manager.addWidget(new AjaxSolr.TextWidget({
      id: 'text',
      target: '#search'
    }));

    Manager.addWidget(new AjaxSolr.TooltipWidget({
      id: 'tooltip'
    }));

    Manager.addWidget(new AjaxSolr.ClustersWidget({
      id: 'clusters',
      target: '#clusters'
    }));

    Manager.addWidget(new AjaxSolr.DateWidget({
      id: 'date',
      target: '#calendar'
    }));

    Manager.init();
    Manager.store.addByValue('q', '*:*');
    var params = {
      facet: true,
      'facet.field': [ 'journal', 'gene-mention', 'date' ],
      'facet.limit': 20,
      'f.gene-mention.facet.limit': 50,
      'facet.mincount': 1,
        'sort': "abstract desc"
      //'facet.range': 'date'
    };
    for (var name in params) {
      Manager.store.addByValue(name, params[name]);
    }
    Manager.doRequest(undefined,"select",true);
  });

})(jQuery);
