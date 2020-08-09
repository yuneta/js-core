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
        layers: [
            {
                id: "__mx_default_layer__"
            }
        ]
    },

    $init: function() {
        this.$view.innerHTML =
            "<div class='webix_mxgraph_content' style='width:100%;height:100%;overflow:auto;'></div>";
        this._contentobj = this.$view.firstChild;

        this.$ready.push(this.render);
        // do not call Webix Touch handlers
        webix.event(this.$view, "touchstart", function(e){
            e.cancelBubble = true;
        });
    },

    render: function() {
        // Create the mx root
        var root = new mxCell();
        root.setId("__mx_root__");

        // Create layers
        var layers = this.config.layers;
        for(var i=0; i<layers.length; i++) {
            var layer = layers[i];

            // Create the layer
            var __mx_cell__ = root.insert(new mxCell());

            // Set reference
            layer["__mx_cell__"] = __mx_cell__;

            var id = kw_get_str(layer, "id", null, false);
            if(id) {
                __mx_cell__.setId(id);
            }
        }

        // Create the graph
        this._mxgraph = new mxGraph(this._contentobj, new mxGraphModel(root));
        this._mxgraph["gobj"] = this.config.gobj;
    },

    getMxgraph: function() {
        return this._mxgraph;
    },

    $setSize:function(x,y) {
        webix.ui.view.prototype.$setSize.call(this,x,y);
        if(this._mxgraph) {
            this._mxgraph.doResizeContainer(x, y);
        }
    }
}, webix.ui.view, webix.EventSystem);
