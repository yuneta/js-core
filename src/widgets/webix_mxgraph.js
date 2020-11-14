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
        editor: false,
        events: [],
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
        if(this.config.editor) {
            // Sets the graph container and configures the editor
            this._mxeditor = new mxEditor();
            this._mxeditor.setGraphContainer(this._contentobj);
            this._mxgraph = this._mxeditor.graph;
        } else {
            // Create the graph
            this._mxgraph = new mxGraph(this._contentobj);
        }

        this._mxgraph.gobj = this.config.gobj;
        this._events = [
            mxEvent.ROOT,
            mxEvent.ALIGN_CELLS,
            mxEvent.FLIP_EDGE,
            mxEvent.ORDER_CELLS,
            mxEvent.CELLS_ORDERED,
            mxEvent.GROUP_CELLS,
            mxEvent.UNGROUP_CELLS,
            mxEvent.REMOVE_CELLS_FROM_PARENT,
            mxEvent.ADD_CELLS,
            mxEvent.CELLS_ADDED,
            mxEvent.REMOVE_CELLS,
            mxEvent.CELLS_REMOVED,
            mxEvent.SPLIT_EDGE,
            mxEvent.TOGGLE_CELLS,
            mxEvent.FOLD_CELLS,
            mxEvent.CELLS_FOLDED,
            mxEvent.UPDATE_CELL_SIZE,
            mxEvent.RESIZE_CELLS,
            mxEvent.CELLS_RESIZED,
            mxEvent.MOVE_CELLS,
            mxEvent.CELLS_MOVED,
            mxEvent.CONNECT_CELL,
            mxEvent.CELL_CONNECTED,
            mxEvent.REFRESH,
            mxEvent.CLICK,
            mxEvent.DOUBLE_CLICK,
            mxEvent.GESTURE,
            mxEvent.TAP_AND_HOLD,
            //mxEvent.FIRE_MOUSE_EVENT, too much events
            mxEvent.SIZE,
            mxEvent.START_EDITING,
            mxEvent.EDITING_STARTED,
            mxEvent.EDITING_STOPPED,
            mxEvent.LABEL_CHANGED,
            mxEvent.ADD_OVERLAY,
            mxEvent.REMOVE_OVERLAY
        ];

        var model = this._mxgraph.getModel();
        if(model.updateLevel < 0) {
            log_error("mxGraph beginUpdate/endUpdate NEGATIVE: " + model.updateLevel);
        }

        for(var i=0; i<this.config.events.length; i++) {
            var ev = this.config.events[i];
            if(elm_in_list(ev, this._events)) {
                this._mxgraph.addListener(ev, function(sender, evt) {
                    var gobj = sender.gobj;
                    var cell = evt.getProperty('cell');
                    if (cell != null) {
                        gobj.gobj_send_event(
                            "MX_" + evt.name,
                            {id: cell.id, value: cell.value, cell: cell},
                            gobj
                        )
                    }

                });
            }
        }
    },

    getMxgraph: function() {
        return this._mxgraph;
    },

    getEditor: function() {
        return this._mxeditor;
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
