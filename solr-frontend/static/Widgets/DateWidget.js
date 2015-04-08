(function ($) {

    AjaxSolr.DateWidget = AjaxSolr.AbstractFacetWidget.extend({
        begin : "&f.date.facet.range.start=NOW-50YEARS",
        finish: "&f.date.facet.range.end=NOW",
        gap: "&f.date.facet.range.gap=%2B1YEAR",


        afterRequest: function (){
            return;
            var w = $("#general").width() * 0.25;
            // Generate a Bates distribution of 10 random variables.
            var values = this.formatValues(this.manager.response.facet_counts.facet_ranges.date);
                xmin = d3.min(values),
                xmax = d3.max(values);



        // A formatter for counts.
            var formatCount = d3.format("0f");

            var margin = {top: 10, right: 30, bottom: 30, left: 30},
                width = w - margin.left - margin.right,
                height = w - margin.top - margin.bottom;

            // This scale is for determining the widths of the histogram bars
            var x = d3.scale.linear()
                .domain([xmin -1, xmax + 1])
                .range([0, width]);

            //scale for placement of bars
            //var x2 = d3.scale.linear()
            //    .domain([xmin, xmax])
            //    .range([0, width]);

        // Generate a histogram using uniformly-spaced bins.
            var data = d3.layout.histogram()
                .bins(x.ticks(xmax - xmin))
            (values);

            console.log(data);

            var y = d3.scale.linear()
                .domain([0, d3.max(data, function(d) { return d.y; })])
                .range([height, 0]);

            var xAxis = d3.svg.axis()
                .scale(x)
                .orient("bottom")
                .ticks(10);

            var svg = d3.select("#calendar").append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            var bar = svg.selectAll(".bar")
                .data(data)
                .enter().append("g")
                .attr("class", "bar")
                .attr("transform", function(d) { return "translate(" + x(d.x) + "," + y(d.y) + ")"; });

            bar.append("rect")
                .attr("x", -5)
                .attr("width", 17) //x(data[0].dx) - 1
                .attr("height", function(d) {
                    return height - y(d.y);
                });

            //bar.append("text")
            //    .attr("dy", ".75em")
            //    .attr("y", 6)
            //    .attr("x", 2)// x(data[0].dx) / 2
            //    .attr("text-anchor", "middle")
            //    .text(function(d) { return d.y; }); //format count

            svg.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + height + ")")
                .call(xAxis);

        },

        clusterResults: function () {
        },

        formatValues: function(array) {
            console.log(array);
            return [2004,2010,2008]
        },

        tagClick: function(facet, field, manager){
            var self = this;
            return function(){
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
