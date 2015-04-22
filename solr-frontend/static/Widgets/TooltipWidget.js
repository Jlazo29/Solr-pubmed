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
              //manager.store.get('q').val('*:*');
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
        return after !== before;
    },

    tagInfo: function(mention){
        var self = this;
        //tooltips in text for tagged entities
        mention = $(mention);
        var text = mention.text();

        var outline = $('<div><p>Gene Mention: <b>' + text + '</b></p></div>');

        var sub1 = $('<div class="clickable"><i class="fa fa-search"></i> Search documents with this mention </div>')
            .click(self.tooltipHandler(text, "gene-mention", self.manager));
        var sub2 = $('<div class="clickable"><i class="fa fa-search"></i> Do a fuzzy search on this mention</div>')
            .click(self.fuzzy(mention.text(),self.manager));

        outline = outline.add(sub1).add(sub2);

        mention.tooltipster({
            minWidth: 310,
            maxWidth: 310,
            theme: 'tooltipster-noir',
            content: outline,
            position: "right",
            interactive: true
        })
    },

    fuzzy: function(text, manager){
        var words = text.split(/\s+/);
        return function(){
            for (var i = 0; i < words.length; i++){
                if (words[i].length > 5){
                    words[i] = words[i] + "~";
                }
                else{
                    if(words[i].length > 1){
                        words[i] = words[i] + "*";
                    }
                }
            }
            var result = words.join(" ");
            manager.store.remove('q');
            manager.store.addByValue('q', result);
            manager.doRequest(null,"select",true);
        };

        //text = text.replaceAll(" ", "~ ")
    },

    afterChangeSelection: function (value) {},

    afterRequest: function () {
        for (var i = 0, l = this.manager.response.response.docs.length; i < l; i++) {
            var doc = this.manager.response.response.docs[i];
            var lists = $('<div class="tooltip_title"></div>');
            lists = lists.append($('<span class="clickable">ID: ' + doc.pmid + '</span>'));
            lists = lists.append(" | ");
            lists = lists.append($('<span class="clickable">Date created: ' + this.formatDate(doc.date[0]) + '</span>'));
            lists = lists.append(" | ");
            lists = lists.append($('<span class="clickable">'+doc.journal+'</span>').click(this.clickHandler(doc.journal[0], "journal", this.manager)));

            var sub1 = $('');
            var sub2 = sub1;

            if (doc["gene-mention"]){
                sub1 = $('<div style="float:left;width:33%"><b>Gene mentions:</b></div>');
                for (var k = 0; k< doc["gene-mention"].length; k++){
                    sub1 = sub1.append($('<li><span class="clickable">' + doc["gene-mention"][k] + '</span></li>').click(this.tooltipHandler(doc["gene-mention"][k],"gene-mention",this.manager)));
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
                //trigger: 'click' //debugging
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
            lists = lists.append($('<a href="#">' + doc.journal + '</a>').click(this.clickHandler(doc.journal[0], "journal", this.manager)));

            var sub1 = $('');
            var sub2 = sub1;

            if (doc["gene-mention"]){
                sub1 = $('<div style="float:left;width:33%"><b>Gene mentions</b></div>');
                for (var k = 0; k< doc["gene-mention"].length; k++){
                    sub1 = sub1.append($('<li><a href="#">' + doc["gene-mention"][k] + '</a></li>').click(this.tooltipHandler(doc["gene-mention"][k],"gene-mention",this.manager)));
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
