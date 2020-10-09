/*******************************************************************
 *  webix_mxgraph.js
 *
 *  Widget for mxgraph: https://github.com/jgraph/mxgraph
 *
 *  Version
 *  -------
 *  1.0     Initial release
 *
 *
 *  Copyright 2020 Niyamaka
 *  MIT license.
 *******************************************************************/
webix.protoUI({
    name: "mxgraph",
    defaults: {
        gobj: null
    },

    $init: function(config) {
        var background_color = "#FFFFFF";
        if(config.background_color) {
            background_color = config.background_color;
        }
        this.$view.innerHTML =
            "<div class='webix_mxgraph_content' style='background-color:" + background_color + ";position:relative;width:100%;height:100%;overflow:auto;'></div>";
        this._contentobj = this.$view.firstChild;

        this.$ready.push(this.render);

        // do not call Webix Touch handlers
        webix.event(this.$view, "touchstart", function(e) {
            e.cancelBubble = true;
        });
    },

    render: function() {
        // Create the graph
        this._mxgraph = new mxGraph(this._contentobj);
    },

    getMxgraph: function() {
        return this._mxgraph;
    },

    getContainer: function() {
        return this._contentobj;
    },

    $setSize:function(x,y) {
        webix.ui.view.prototype.$setSize.call(this,x,y);
        if(this._mxgraph) {
            this._mxgraph.doResizeContainer(x, y);
        }
    }
}, webix.ui.view, webix.EventSystem);
