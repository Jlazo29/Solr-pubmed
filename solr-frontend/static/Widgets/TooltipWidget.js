/**
 * Created by Jorge lazo on 2/25/15.
 */
(function ($) {
AjaxSolr.TooltipWidget = AjaxSolr.AbstractFacetWidget.extend({
    rows: "50",

    formatDate: function(date){
        date = date.substring(0,10);
        return date;
    },
    //Had to borrow helper functions from abstractTextWidget, any way to extend both without conflict?
    tooltipHandler: function (facet,field,manager){
      var self = this;
      return function(){
          self = self.manager.widgets[field];
          manager.curr[field][facet] = facet;
          if (self.set(facet)) {
            self.doRequest(null, "select", true);
          }
          return false;
      };
    },
    set: function (q) {
        return this.changeSelection(function () {
            this.manager.store.get('q').val(q);
        });},

    clear: function () {
        return this.changeSelection(function () {
            this.manager.store.remove('q');
        });},

    changeSelection: function (func) {
        var before = this.manager.store.get('q').val();
        func.apply(this);
        var after = this.manager.store.get('q').val();
        if (after !== before)
            this.afterChangeSelection(after);
        return after !== before;},

    afterChangeSelection: function (value) {},

    afterRequest: function () {
        for (var i = 0, l = this.manager.response.response.docs.length; i < l; i++) {
            var doc = this.manager.response.response.docs[i];
            var lists = $('<div class="tooltip_title"></div>');
            lists = lists.append($('<a href="#">ID: ' + doc.pmid + '</a>'));
            lists = lists.append(" | ");
            lists = lists.append($('<a href="#">Date created: ' + this.formatDate(doc.date[0]) + '</a>'));
            lists = lists.append(" | ");
            lists = lists.append($('<a href="#">'+doc.journal+'</a>').click(this.clickHandler(doc.journal[0], "journal", this.manager)));

            var sub1 = $('');
            var sub2 = sub1;

            if (doc.gene_symbol_list){
                sub1 = $('<div style="float:left;width:33%"><b>Gene Symbol List:</b></div>');
                for (var k = 0; k< doc.gene_symbol_list.length; k++){
                    sub1 = sub1.append($('<li><a href="#">' + doc.gene_symbol_list[k] + '</a></li>').click(this.tooltipHandler(doc.gene_symbol_list[k],"gene_symbol_list",this.manager)));
                }
            }
            if (doc.mesh_term){
                sub2 = $('<div style="float:left;width:33%"><b>MeSH Heading List:</b></div>');
                for (var k = 0; k< doc.mesh_term.length; k++){
                    if (doc.mesh_term_major){
                        if (doc.mesh_term_major.indexOf(doc.mesh_term[k]) > -1){sub2 = sub2.append($('<li><a href="#">' + doc.mesh_term[k] + '<i style="display:inline-block" class="ui-icon ui-icon-star"></i></a></li>')
                            .click(this.tooltipHandler(doc.mesh_term[k],"mesh_term",this.manager)));
                        }
                        else{
                            sub2= sub2.append($('<li><a href="#">' + doc.mesh_term[k] + '</a></li>').click(this.tooltipHandler(doc.mesh_term[k],"mesh_term",this.manager)));}}
                    else{
                        sub2= sub2.append($('<li><a href="#">' + doc.mesh_term[k] + '</a></li>').click(this.tooltipHandler(doc.mesh_term[k],"mesh_term",this.manager)));}
                }
            }
            lists = lists.add(sub1);
            lists = lists.add(sub2);

            var $info = $('#info-' + doc.pmid);
            $info.tooltipster({
                minWidth: 1000,
                maxWidth: 1000,
                theme: 'tooltipster-noir',
                content: lists,
                interactive: true
                //trigger: 'click'
            })
        }
    },

    clusterResults: function () {
        for (var i = 0, l = this.manager.clustersDocs.length; i < l; i++) {
            var doc = this.manager.clustersDocs[i];
            var lists = $('<div class="tooltip_title"></div>');
            lists = lists.append($('<a href="#">ID: ' + doc.pmid + '</a>'));
            lists = lists.append(" | ");
            lists = lists.append($('<a href="#">Date created: ' + this.formatDate(doc.date[0]) + '</a>'));
            lists = lists.append(" | ");
            lists = lists.append($('<a href="#">' + doc.journal_title + '</a>').click(this.clickHandler(doc.journal[0], "journal", this.manager)));

            var sub1 = $('');
            var sub2 = sub1;

            if (doc.gene_symbol_list) {
                sub1 = $('<div style="float:left;width:33%"><b>Gene Symbol List:</b></div>');
                for (var k = 0; k < doc.gene_symbol_list.length; k++) {
                    sub1 = sub1.append($('<li><a href="#">' + doc.gene_symbol_list[k] + '</a></li>').click(this.tooltipHandler(doc.gene_symbol_list[k], "gene_symbol_list", this.manager)));
                }
            }
            if (doc.mesh_term) {
                sub2 = $('<div style="float:left;width:33%"><b>MeSH Heading List:</b></div>');
                for (var k = 0; k < doc.mesh_term.length; k++) {
                    if (doc.mesh_term_major) {
                        if (doc.mesh_term_major.indexOf(doc.mesh_term[k]) > -1) {
                            sub2 = sub2.append($('<li><a href="#">' + doc.mesh_term[k] + '<i style="display:inline-block" class="ui-icon ui-icon-star"></i></a></li>')
                                .click(this.tooltipHandler(doc.mesh_term[k], "mesh_term", this.manager)));
                        }
                        else {
                            sub2 = sub2.append($('<li><a href="#">' + doc.mesh_term[k] + '</a></li>').click(this.tooltipHandler(doc.mesh_term[k], "mesh_term", this.manager)));
                        }
                    }
                    else {
                        sub2 = sub2.append($('<li><a href="#">' + doc.mesh_term[k] + '</a></li>').click(this.tooltipHandler(doc.mesh_term[k], "mesh_term", this.manager)));
                    }
                }
            }
            lists = lists.add(sub1);
            lists = lists.add(sub2);

            var $info = $('#info-' + doc.pmid);
            $info.tooltipster({
                minWidth: 1000,
                maxWidth: 1000,
                theme: 'tooltipster-noir',
                content: lists,
                interactive: true
                //trigger: 'click'
            })
        }
    }
});

})(jQuery);

