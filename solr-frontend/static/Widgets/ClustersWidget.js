/**
 * Created by Jorge Lazo on 2/25/15.
 */
(function ($) {
    /**
     * A widget in charge of presenting the cluster data and initiate further cluster requests.
     */

    AjaxSolr.ClustersWidget = AjaxSolr.AbstractWidget.extend({
        width: 900,
        height: 900,
        "force": undefined,
        "all_fixed": false,

        init: function(){
            var tab2 = $('#tab2');
            var tab1 = $('#tab1');
            tab2.click(this.expandView);
            tab1.click(this.contractView);
        },

        /**
         * Method called before Manager.doRequest finishes.
         */
        beforeRequest: function () {
            $(this.target).empty();
            this.all_fixed = false;
            $(this.target).append($('<p>Clustering Documents...</p>'));
            $(this.target).append($('<img id="Loading">').attr('src', '/static/images/Loading.gif'));
        },
        /**
         * Helper functions, changes css for a full view when opening clusters.
         */
        expandView: function(){
            var sidebar = $('#sidebar');
            sidebar.css('width', "45%");
        },
        contractView: function(){
            var sidebar = $('#sidebar');
            sidebar.css('width', "30%");
        },

        /**
         * Method called immediately after cluster data comes back. Renders the data as well as the settings
         *
         */
        afterClusters: function(){
            $(this.target).empty();
            var self = this,
                clusters = this.manager.response.clusters,
                reset = $("<span id='reset'>Recluster Documents</span>").button().click(function(){
                    self.beforeRequest();
                    self.manager.handleResponse(undefined,true);
                }),
                normalize = $("<span id='normalize'>Make grid</span>").button().click(function(){return self.normalize(data_nodes)});

            var text_rows = $("<p id='text_rows'>Clustering "+ this.manager.clusterOptions.rows.substring(6) +" docs </p>"),
                slider_rows = $("<div id='slider_rows'></div>").slider({
                    orientation: "horizontal",
                    min: 20,
                    max: 300,
                    value: parseInt(self.manager.clusterOptions.rows.substring(6)),
                    range: "min",
                    slide: function( event, ui ) {
                        self.manager.clusterOptions.rows = "&rows=" + ui.value;
                        $( "#text_rows" ).text("Clustering " + ui.value + " docs");
                    }
                });

            var text_count = $("<p id='text_count'>Base count "+ this.manager.clusterOptions.baseCount.substring(50) +" clusters </p>"),
                slider_count = $("<div id='slider_count'></div>").slider({
                orientation: "horizontal",
                min: 2,
                max: 50,
                value: parseInt(self.manager.clusterOptions.baseCount.substring(50)),
                range: "min",
                slide: function( event, ui ) {
                    self.manager.clusterOptions.baseCount = "&LingoClusteringAlgorithm.desiredClusterCountBase=" + ui.value;
                    $( "#text_count" ).text("Base count " + ui.value + " clusters");
                }
            });

            var leftOptions = $("<div style='width:30%;float:left;'></div>").append([reset,normalize]);
            var rightOptions = $("<div style='width:70%;float:left;'></div>").append([text_rows,slider_rows]);
            rightOptions = rightOptions.append([text_count,slider_count]);
            var clusterOptions = $("<div class='cluster-options'></div>").append(leftOptions).append(rightOptions);
            $(this.target).append(clusterOptions);

            if(clusters.slice(-1)[0].labels[0] == "Other Topics" && clusters.length > 1){clusters.pop();} //Removing other topics

            var data_nodes = this.nodeify(clusters);
            this.renderNodeGraph(data_nodes);
        },

        /**
         * Method to create a d3 cluster node graph. This method also accounts for
         * other interactive effects, such as selecting a cluster (to request the documents).
         *
         * @param graph the JSON object passed, needs to be curated first (from nodeify)
         */
        renderNodeGraph: function(graph) {
            var self = this;
            var width = $("#general").width() * 0.35,
                height = this.height,
                ctrlKey,
                grav,
                charge,
                rig;

            grav = graph.links.length;
            grav = (grav >= 700) ? 0.7: (grav<= 50) ? 0.05 : grav/1000;
            charge = graph.links.length;
            charge = (charge >= 400) ? -350: (charge <= 100) ? -150 : charge*-1.5;
            rig = graph.links.length;
            rig = (rig >= 1000) ? 0.95: (rig <= 100) ? 0.4 : rig/1000;

            this.force = d3.layout.force()
                .size([width, height])
                .charge(charge)     //sets the repulsion/attraction strength to the specified value. def=-30
                .chargeDistance(750)//sets the maximum distance over which charge forces are applied. def= inf
                .theta(0.5)         //sets the Barnes–Hut approximation criterion to the specified value. def=0.8
                .linkDistance(3)    //sets the target distance between linked nodes to the specified value. def=20
                .linkStrength(rig)  //sets the strength (rigidity) of links to the specified value in the range [0,1]. def=1
                .gravity(grav)      //sets the gravitational strength to the specified numerical value. def=0.1
                .friction(0.9)      //sets the friction coefficient, approximates velocity decay. def= 0.9
                .alpha(0.1)         //cooling parameter, if >0 restarts force layout, if <0 ends it. def=0.1
                .on("tick", tick);
            $("#clusters").append($("<div style='clear:left' id='checkbox'>Toggle folders</div>").button());

            var svg = d3.select("#clusters").append("svg")
                .attr("id", "cluster-svg")
                .attr("width", "100%")
                .attr("height", height);

            this.force
                .nodes(graph.nodes)
                .links(graph.links)
                .start();

            var link = svg.selectAll(".link").data(graph.links)
                .enter().append("line")
                .attr("class", "link");


            var  node = svg.selectAll(".node")
                .data(graph.nodes)
                .enter().append("g")
                .attr("class", "cluster")
                .attr("id", function(d){
                    if (d.name) return d.name;
                    if (d.cluster) return d.cluster;
                    else return "tombstone"})
                .call(self.force.drag);

            node.append("circle")
                .attr("class", function(d){
                    if (d.nucleus && d.cluster){
                        return "nucleus " + d.cluster[0]
                    }
                    if (d.cluster){
                        var l = d.cluster.length,
                            result = "node";
                        while(l > 0){
                            result+= " " + d.cluster[l-1];
                            l--;
                        }
                        return result;
                    }
                    else{
                        return "tombstone"
                    }})
                .attr("id", function(d){
                    if(d.name) return d.name
                })
                .attr("r", function(d){
                    if (d.nucleus){
                        return 9
                    }
                    return 4
                })
                .on("click", toggle);

            node.append("text")
                .attr("class", "cluster-text")
                .attr("dx", function(d){
                    if (d.nucleus){
                       return (-4 * (d.nucleus.length));
                    }
                })
                .attr("dy", -20)
                .text(function(d){
                    if (d.nucleus){
                        return d.nucleus + " (" + d.weight + ")"
                    }
                })
                .on("mouseover", function(d){d3.select(this).style("fill", "red")
                })
                .on("mouseout", function(d){d3.select(this).style("fill", "black")});

            /**
             * D3 Method, handles the movement behaviour of every node at each tick (every fraction of a second)
             */
            function tick() {
                link.attr("x1", function(d) {
                    if (d.source.x < 8){ return 10;}
                    if (d.source.x > (width * 1.2)){ return (width * 1.2);}
                    return d.source.x;
                })
                    .attr("y1", function(d) {
                        if (d.source.y < 8){ return 8;}
                        if (d.source.y > (height - 10)) {return (height - 10);}
                        return d.source.y;
                    })
                    .attr("x2", function(d) {
                        if (d.target.x < 8){ return 10;}
                        if (d.target.x > (width * 1.2)){ return (width * 1.2);}
                        return d.target.x;
                    })
                    .attr("y2", function(d) {
                        if (d.target.y < 8){ return 8;}
                        if (d.target.y > (height - 10)) {return (height - 10);}
                        return d.target.y;
                    });

                node.attr("transform", function(d) {
                    var d_x = d.x,
                        d_y = d.y;
                    if (d.x < 8){ d_x = 10;}
                    if (d.x > (width * 1.2)){ d_x = width * 1.2;}
                    if (d.y < 8){ d_y = 10;}
                    if (d.y > (height - 10)) {d_y = height - 10;}
                    return "translate(" +  d_x + "," + d_y + ")";
                });
            }

            /**
             * D3 Method, handles a click to a node (both css effects, as well as initiating a manager.doRequest
             * @param d a single data point.
             */
            function toggle(d) {
                ctrlKey = d3.event.ctrlKey;
                if (ctrlKey){
                    if (d.fixed){
                        for (var k = 0; k< d.cluster.length; k++){d3.selectAll("." + d.cluster[k]).classed( d.fixed = false);}
                    }
                    else{
                        for (var i = 0; i< d.cluster.length; i++){d3.selectAll("." + d.cluster[i]).classed( d.fixed = true);}}
                }
                else{
                    self.manager.clusterLabels = []; //resetting
                    $("circle").css("fill", "#50c1cc");
                    var IDs = [];
                    for (var l = 0; l < d.cluster.length; l++) {
                        $("." + d.cluster[l]).css("fill", "#ff3c1f").each(function(){
                            var text =$(this).next().text();
                            if (text.length > 0){
                                self.manager.clusterLabels.push(text);
                            }
                            if(this.id)IDs.push(this.id);
                        });
                    }
                    self.manager.requestClusterDocs(IDs);
                }
            }
            var folders = self.create_folders(graph.nodes);

            var $checkbox = $('#checkbox');
            $checkbox.tooltipster({
                width: 500,
                theme: 'tooltipster-noir',
                content: folders,
                interactive: true,
                trigger: 'click',
                arrow: false,
                position: "right",
                offsetY: -80
            });
        },

        /**
         * This method takes the cluster data and creates an array of nodes and links to be used by D3.
         *
         * @param clusters
         * @returns {{nodes: Array, links: Array, nuclei: Array}}
         */
        nodeify: function(clusters){
            var graph = { "nodes": [], "links": [], "nuclei": [] };//results
            var list = { "docs": [], "group": []}, //for intersection
                index = 0, //for nucleus
                total = 0; // nodes

            for (var i=0; i< clusters.length; i++){ //for each cluster
                graph["nodes"].push( {"nucleus": clusters[i].labels[0], "cluster": ["clust"+ i], "selected": false}); //push its nucleus
                graph["nuclei"].push({"name":clusters[i].labels[0], index: total});
                list["docs"].push(i);
                list["group"].push(index);
                var child = {"name": undefined, "cluster": []};

                for (var k=0; k< clusters[i].docs.length; k++){
                    child = {"name": clusters[i].docs[k], "cluster": ["clust"+i], "selected": false}; //create a node
                    var intersection = list["docs"].indexOf(child.name); //is it found in any other cluster?
                    list["docs"].push(child.name);
                    list["group"].push(index);
                    total++;

                    if(intersection > -1){
                        graph["links"].push({"source": intersection, "target": list["group"][total]}); // create link from intersection

                        graph["nodes"][intersection]["cluster"].push("clust" + i);
                        graph["nodes"].push({"fixed": true, "x": -30}); //tombstone node quick fix
                        continue;
                        }
                    graph["nodes"].push(child); //add the node
                    graph["links"].push({"source": index, "target": total}); //create links within each cluster

                }
                total++;
                index = total;
            }
            return  graph;
        },

        /**
         * Helper function to render the cluster folders.
         * @param nodes list of nodes.
         * @returns {HTMLElement}
         */
        create_folders: function(nodes){
        var table = $("<form></form>"),
            row1 = $("<div style='float:left'></div>"),
            row2 = $("<div style='float:left'></div>");

        var index = 0,
            self = this;
        for (var i =0; i< nodes.length; i++){
            if (!nodes[i].nucleus){continue;}
            if (index % 2 == 0){
                row1.append($("<label><input id=folder_" + index + " type='radio' name='folder'>" + nodes[i].nucleus + " (" + nodes[i].weight + ")</label><br>").change(self.folderHandler(nodes[i], index, self)));
            }
            else{
                row2.append($("<label><input id=folder_" + index + " type='radio' name='folder'>" + nodes[i].nucleus + " (" + nodes[i].weight + ")</label><br>").change(self.folderHandler(nodes[i], index, self)));
            }
            table.append(row1).append(row2);
            index++;
        }
        return table;
    },
        /**
         * Helper function when selecting a folder, calls requestClusterDocs on manager.
         * @param node The node selected (array element).
         * @param clust the cluster number to color.
         * @param self self to call manager.
         * @returns {Function}
         */
        folderHandler: function(node, clust, self){
            return function(){
                self.manager.clusterLabels = []; //resetting
                var label = node.nucleus + " (" + node.weight + ")";
                if(self.manager.clusterLabels.indexOf(label) == -1){
                    self.manager.clusterLabels.push(label);
                    var selector = $(".clust" + clust);
                    $("circle").css("fill", "#50c1cc");
                    var IDs = [];
                    selector.css("fill", "#ff3c1f").each(function(){
                        var text =$(this).next().text();
                        if (text.length > 0){
                        }
                        if(this.id)IDs.push(this.id);
                    });
                    self.manager.requestClusterDocs(IDs);
                }
            }
        },

        /**
         * Method called to create a grid of clusters (cosmetic effect only)
         * @param data_nodes list of all nodes
         */
        normalize: function(data_nodes){
            var nodes = data_nodes["nodes"];

            if (this.all_fixed) {
                for (var k = 0; k < nodes.length; k++) {
                    if (nodes[k].nucleus) {
                        nodes[k].fixed = false;
                    }
                }
                this.all_fixed = false;
            }
            else{
                var MaxW = $("#sidebar").width() * 0.9,
                    MaxH = this.height;
                    Min = 80;
                var scaleMax = Math.ceil(Math.sqrt(data_nodes["nuclei"].length)), //finds the range according to input clusters
                    scaleMin = 0;

                var indexX = 1,
                    indexY = 1;
                for (var i=0; i< nodes.length; i++){
                    if (nodes[i].nucleus){
                        var percentX = ((indexX % scaleMax) - scaleMin) / (scaleMax - scaleMin);
                        var outputX = percentX * (MaxW - Min) + Min;
                        var percentY = ((indexY % scaleMax) - scaleMin) / (scaleMax - scaleMin);
                        if (indexX % 2 == 0) percentY += 0.5/scaleMax;
                        var outputY = percentY * (MaxH - Min) + Min;
                        nodes[i].fixed = true;
                        nodes[i].px = outputX;
                        nodes[i].py = outputY;
                        if (indexX % scaleMax == 0){indexY++}
                        indexX++;
                    }
                }
                this.all_fixed = true;
            }
            this.force.alpha(0.1);
        },

        /**
         * Helper function to remove a specific value on an array and preserve list order.
         * @param arr
         * @param item
         */
        remove: function(arr, item) {
            for(var i = arr.length; i--;) {
                if(arr[i] === item) {
                    arr.splice(i, 1);
                }
            }
        },


    clusterResults: function(){
        /**
         * Placeholder function. Not used
         */
        }

    });
})(jQuery);