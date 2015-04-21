(function (callback) {
  if (typeof define === 'function' && define.amd) {
    define(['core/AbstractManager'], callback);
  }
  else {
    callback();
  }
}(function () {

/**
 * @see http://wiki.apache.org/solr/SolJSON#JSON_specific_parameters
 * @class Manager
 * @augments AjaxSolr.AbstractManager
 */
AjaxSolr.Manager = AjaxSolr.AbstractManager.extend(
  /** @lends AjaxSolr.Manager.prototype */
  {
    init: function () {
      this.initialized = true;
      if (this.store === null) {
        this.setStore(new AjaxSolr.ParameterStore());
      }
      this.store.load(false);
      for (var widgetId in this.widgets) {
        this.widgets[widgetId].init();
      }
      this.store.init();
    },

    /**
     * Set the manager's parameter store.
     *
     * @param {AjaxSolr.ParameterStore} store
     */
    setStore: function (store) {
      store.manager = this;
      this.store = store;
    },

    /**
     * Adds a widget to the manager.
     *
     * @param {AjaxSolr.AbstractWidget} widget
     */
    addWidget: function (widget) {
      widget.manager = this;
      this.widgets[widget.id] = widget;
    },

    stringFq: function(array){
      if(array.length > 0){
        var string_fq = "&fq=(";

        for (var i = 0; i< array.length; i++){
          if (i == array.length - 1){ //last
            string_fq += array[i] + ")";
          }
          else{string_fq += array[i] + " OR ";}

        }
        return string_fq;
      }
      else{
        return ""
      }
    },

    dateQuery: function(date){
      var obj = this.widgets['date'];
      date = date + obj.begin + obj.finish + obj.gap;
      return date;
    },

    /**
     * Stores the Solr parameters to be sent to Solr and sends a request to Solr.
     *
     * @param {Boolean} [start] The Solr start offset parameter.
     * @param {String} [servlet] The Solr servlet to send the request to.
     * @param {Boolean} [cluster] Whether to cluster or not.
     */
    doRequest: function (start, servlet, cluster) {
      if (this.initialized === false) {
        this.init();
      }
      // Allow non-pagination widgets to reset the offset parameter.
      if (start !== undefined) {
        this.store.get('start').val(start);
      }
      if (servlet === undefined) {
        servlet = this.servlet;
      }
      this.store.save();
      for (var widgetId in this.widgets) {
        if (this.widgets.hasOwnProperty(widgetId)){
          if ((widgetId == "clusters") && !cluster){
            continue;
          }
          this.widgets[widgetId].beforeRequest();
        }
      }
      this.executeRequest(start,servlet, cluster);
    },

    executeRequest: function (start, servlet, cluster) {
      var self = this,
          query = {dataType: 'json'},
          string_query = this.store.get("q").val(),
          string_fq = this.stringFq(this.store.values("fq")),
          string_options = this.store.string() + this.rows,
          date = "&facet.range=date";

        console.log(string_options);

      var handler = function (data) {
        var result = $('#result');
        var no_result = $('#no_result');
        var status = data.responseHeader.status;
        no_result.empty();
        result.hide();
        if (status == 0){ //Successful!
          if (data.response.numFound > 0){  //Found documents
            result.show();
            self.handleResponse(data, cluster);
          }
          else{//No documents found
            var not_found = data.responseHeader.params.q;
            no_result.append($('<p style="color:darkred">Looks like the query: <b>"'+ not_found +'"</b> has not returned any results!</p>'));
          }
        }
      };

      date = this.dateQuery(date);

      if (this.queryOptions){
        string_query = "q=full_text:(" + string_query + ")&";
      }
      else{
        string_query = "q=" + string_query + "&";
      }
      if (this.proxyUrl) {
        query.url = this.proxyUrl;
        query.data = {query: string};
        query.type = 'POST';
      }
      else {
        query.url = this.solrUrl + servlet + '?' + string_query + string_options + string_fq + date + '&wt=json&json.wrf=?';
      }
      console.log(query.url);
      jQuery.ajax(query).success(handler);

    },

    /**
     * This method is executed after the Solr response data arrives. Allows each
     * widget to handle Solr's response separately.
     *
     * @param {Object} data The Solr response.
     * @param {Boolean} cluster Whether to cluster or not
     */
    handleResponse: function (data, cluster) {
      var self = this;
      if (data){
        this.response = data;
        for (var widgetId in this.widgets) {
          this.widgets[widgetId].afterRequest();
        }
      }
      if (cluster){
        var servlet = "clustering",
            string_query = "q=" + this.store.get("q").val()+ "&",
            query_options = this.store.string(),
            query = {dataType: 'json'},
            clusterOptions = this.clusterOptions.rows + this.clusterOptions.baseCount;

        for (var i in this.clusterOptions){
          String += this.clusterOptions[i];
        }
        if (this.proxyUrl) {
          query.url = this.proxyUrl;
          query.data = {query: string_query +query_options};
          query.type = 'POST';
        }
        else {
          query.url = this.solrUrl + servlet + '?' + string_query + query_options + clusterOptions + '&wt=json&json.wrf=?';
          console.log(query.url);
        }
        jQuery.ajax(query).success(function(data){
          self.handleClusters(data);
        });

      }
    },

    handleClusters: function(data){
      this.response.clusters = data.clusters;
      this.widgets["clusters"].afterClusters();
    },

    requestClusterDocs: function(IDs){
      this.widgets["result"].beforeRequest();
      this.clustersDocs = []; //resetting

      var self = this,
          query = {dataType: 'json'},
          string,
          clusterArray = [],
          promises = [];

      while(IDs.length > 0){
        var chunk = IDs.splice(0, 25);
        clusterArray.push(chunk);
        string = "&q=pmid:(";
        for (var i = 0; i< chunk.length; i++){
          if (i == chunk.length -1){
            string += chunk[i] + ")";
          }
          else{
            string += chunk[i] + " OR ";
          }
        }
        query.url = this.solrUrl + 'select?' + string + '&wt=json&json.wrf=?';
        var promise = jQuery.ajax(query).success(function(data){
          for (var i =0; i<data.response.docs.length; i++){
            self.clustersDocs.push(data.response.docs[i]);
          }
        });
        promises.push(promise)
      }
      $.when.apply($, promises)
          .done(function() {
            for (var widgetID in self.widgets){
              self.widgets[widgetID].clusterResults();
            }
          });
    },

    debug: function(){
      console.log("during request");
    }
});

}));
