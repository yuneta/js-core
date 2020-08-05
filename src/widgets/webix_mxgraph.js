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
        gobj: null,
        _mxgraph_options: {
            layers: [
                {
                    id: "__mx_default_layer__"
                }
            ]
        },
        mxgraph_options: {
        }
    },

    $init: function() {
        this.$view.innerHTML =
            "<div class='webix_mxgraph_content' style='width:100%;height:100%;'></div>";
        this._contentobj = this.$view.firstChild;

        this._waitMxGraph = webix.promise.defer();
        this.$ready.push(this.render);

        // do not call Webix Touch handlers
        webix.event(this.$view, "touchstart", function(e){
            e.cancelBubble = true;
        });
    },

    render: function() {
        webix.require([
            "/static/mxgraph/mxClient.js"
        ])
        .then(
            webix.bind(this._initMxGraph, this)
        ).catch(function(e){
            log_error(e);
        });
    },

    _initMxGraph: function(define) {
        var c = this.config;

        if(this.isVisible(c.id)) {
            json_object_update_missing(c.mxgraph_options, c._mxgraph_options);

            var layers = kw_get_dict_value(c.mxgraph_options, "layers", [], false);
            if(!layers.length) {
                log_error("No layers defined");
                return;
            }

            // Create the mx root
            var root = new mxCell();
            root.setId("__mx_root__");

            // Create layers
            for(var i=0; i<layers.length; i++) {
                var layer = layers[i];

                // Create the layer
                var __mx_cell__ = root.insert(new mxCell({gobj:c.gobj}));

                // Set reference
                layer["__mx_cell__"] = __mx_cell__;

                var id = kw_get_str(layer, "id", null, false);
                if(id) {
                    __mx_cell__.setId(id);
                }
            }

            // Create the graph
            this._mxgraph = new mxGraph(this._contentobj, new mxGraphModel(root));
            this._mxgraph["gobj"] = c.gobj;
            this._mxgraph["__mx_layout__"] = new mxGraphLayout(this._mxgraph);

            this._waitMxGraph.resolve(this._mxgraph);
            var self = c.gobj;
            if(self) {
                self.gobj_send_event("EV_MXGRAPH_INITIALIZED", {_mxgraph: this._mxgraph}, self);
            }
        }
    },

    $setSize: function(w, h) {
        webix.ui.view.prototype.$setSize.apply(this, arguments);
        if(this._mxgraph) {
            this._mxgraph.doResizeContainer(w, h);
        }
    }
}, webix.ui.view, webix.EventSystem);
