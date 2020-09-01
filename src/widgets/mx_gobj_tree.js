/***********************************************************************
 *          mx_gobj_tree.js
 *
 *          Yuneta GObj Tree with mxgrah
 *
 *

        Schema
        ------

        Jerarquica Tree with bidirectional link to the same class/rol/object
        (Parent creates the child)

        {
            "id": "1`1",
            "name": "yuno",
            "shortname": "Timer^yuno",
            "fullname": "YFichador^mulesol`Timer^yuno",
            "gclass_name": "Timer",
            "running": true,
            "playing": true,
            "service": false,
            "unique": false,
            "disabled": false,
            "state": "ST_COUNTDOWN",
            "gobj_trace_level": 0,
            "gobj_no_trace_level": 65536,
            "attrs": {
                "msec": 1000,
                "periodic": true,
                "user_data": 0,
                "user_data2": 0,
                "timeout_event_name": "EV_TIMEOUT",
                "stopped_event_name": "EV_STOPPED"
            },
            "parent_id": "1",                           NOTE fkey to self
            "childs": []                                NOTE hook of self
        }

 *
 *          Copyright (c) 2020 Niyamaka.
 *          All Rights Reserved.
 ***********************************************************************/
(function (exports) {
    'use strict';

    /********************************************
     *      Configuration (C attributes)
     ********************************************/
    var CONFIG = {
        layout_options: [
            {
                id: "tree_layout",
                value: "Tree Layout",
                layout: function(layout_option, graph) {
                    // Enables automatic layout on the graph and installs
                    // a tree layout for all groups who's children are
                    // being changed, added or removed.
                    var layout = new mxCompactTreeLayout(graph, false);
                    layout.useBoundingBox = false;
                    layout.edgeRouting = false;
                    layout.levelDistance = 30;
                    layout.nodeDistance = 10;
                    return layout;
                }
            },
            {
                id: "herarchical_layout",
                value: "Herarchical Layout",
                layout: function(layout_option, graph) {
                    var layout = new mxHierarchicalLayout(graph);
                    return layout;
                }
            },
            {
                id: "fastorganic_layout",
                value: "FastOrganic Layout",
                layout: function(layout_option, graph) {
                    var layout = new mxFastOrganicLayout(graph);
                    return layout;
                }
            },
            {
                id: "circle_layout",
                value: "Circle Layout",
                layout: function(layout_option, graph) {
                    var layout = new mxCircleLayout(graph);
                    return layout;
                }
            }
        ],
        layout_selected: "tree_layout",

        vertex_cx: 140,
        vertex_cy: 80,
        vertex_sep: 30,

        layers: [
            {
                id: "__mx_default_layer__"
            }
        ],
        _mxgraph: null,
        ui_properties: null,    // creator can set webix properties
        $ui: null,
        __writable_attrs__: [
        ]
    };




            /***************************
             *      Local Methods
             ***************************/




    /************************************************************
     *   Build name
     ************************************************************/
    function build_name(self, name)
    {
        // We need unique names
        if(empty_string(self.gobj_name())) {
            if(!self._uuid_name) {
                self._uuid_name = get_unique_id(self.gobj_gclass_name());
            }
            return self._uuid_name + "-" + name;
        }
        return self.gobj_escaped_short_name() + "-"+ name;
    }

    /************************************************************
     *   Rebuild
     ************************************************************/
    function rebuild(self)
    {
        // Destroy UI, Build UI
        if(self.config.$ui) {
            self.config.$ui.destructor();
            self.config.$ui = 0;
        }
        if(self.config._mxgraph) {
            self.config._mxgraph.destroy();
            self.config._mxgraph = null;
        }
        build_webix(self);
        self.config._mxgraph = $$(build_name(self, "mxgraph")).getMxgraph();
        initialize_mxgraph(self);
        rebuild_layouts(self);
    }

    /************************************************************
     *   Webix UI
     ************************************************************/
    function build_webix(self)
    {
        var toolbar = {
            view:"toolbar",
            height: 30,
            css: "toolbar2color",
            cols:[
                {
                    view: "richselect",
                    id: build_name(self, "layout_options"),
                    tooltip: t("Select layout"),
                    width: 180,
                    options: self.config.layout_options,
                    value: self.config.layout_selected,
                    label: "",
                    on: {
                        onChange(newVal, oldVal) {
                            var cur_layout = kwid_collect(
                                self.config.layout_options,
                                newVal,
                                null, null
                            )[0];
                            if(!cur_layout) {
                                cur_layout = self.config.layout_options[0];
                            }
                            self.config.layout_selected = cur_layout.id;

                            execute_layout(self);

                            if(self.gobj_is_unique() || self.gobj_is_service()) {
                                self.gobj_save_persistent_attrs();
                            }
                        }
                    }
                },
                {
                    view:"button",
                    type: "icon",
                    icon: "fad fa-compress-arrows-alt",
                    css: "webix_transparent btn_icon_toolbar_16",
                    maxWidth: 120,
                    label: t("reset view"),
                    click: function() {
                        self.config._mxgraph.view.scaleAndTranslate(1, 0, 0);
                    }
                },
                {
                    view:"button",
                    type: "icon",
                    icon: "fad fa-expand-arrows-alt",
                    css: "webix_transparent btn_icon_toolbar_16",
                    maxWidth: 120,
                    label: t("fit"),
                    click: function() {
                        self.config._mxgraph.fit();
                    }
                },
                {
                    view:"button",
                    type: "icon",
                    icon: "far fa-search-plus",
                    css: "webix_transparent btn_icon_toolbar_16",
                    maxWidth: 120,
                    label: t("zoom in"),
                    click: function() {
                        self.config._mxgraph.zoomIn();
                        self.config._mxgraph.view.setTranslate(0, 0);
                    }
                },
                {
                    view:"button",
                    type: "icon",
                    icon: "far fa-search-minus",
                    css: "webix_transparent icon_toolbar_16",
                    maxWidth: 120,
                    label: t("zoom out"),
                    click: function() {
                        self.config._mxgraph.zoomOut();
                        self.config._mxgraph.view.setTranslate(0, 0);
                    }
                },
                { view:"label", label: ""}
            ]
        };

        /*---------------------------------------*
         *      UI
         *---------------------------------------*/
        self.config.$ui = webix.ui({
            id: self.gobj_name(),
            rows: [
                {
                    view: "mxgraph",
                    id: build_name(self, "mxgraph"),
                    gobj: self
                },
                toolbar
            ]
        });

        self.config.$ui.gobj = self;
        if(self.config.ui_properties) {
            self.config.$ui.define(self.config.ui_properties);
            if(self.config.$ui.refresh) {
                self.config.$ui.refresh();
            }
        }
    }

    /********************************************
     *  Rebuild layouts
     ********************************************/
    function rebuild_layouts(self)
    {
        for(var i=0; i<self.config.layout_options.length; i++) {
            var layout = self.config.layout_options[i];
            layout.exe = layout.layout(layout, self.config._mxgraph);
        }
    }

    /********************************************
     *  Execute layout
     ********************************************/
    function execute_layout(self)
    {
        var graph = self.config._mxgraph;
        var group = get_layer(self, "layer?");

        var cur_layout = kwid_collect(
            self.config.layout_options,
            self.config.layout_selected,
            null, null
        )[0];

        if(cur_layout) {
            graph.getModel().beginUpdate();
            try {
                cur_layout.exe.execute(group);
            } finally {
                graph.getModel().endUpdate();
            }
        }
    }

    /********************************************
     *  Create root and layers
     ********************************************/
    function create_root_and_layers(graph, layers)
    {
        var root = null;
        if(layers && layers.length) { // TODO
            root = new mxCell();
            root.setId("__mx_root__");

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
        } else {
            root = graph.getModel().createRoot()
        }

        graph.getModel().beginUpdate();
        try {
            graph.getModel().setRoot(root);
        } finally {
            graph.getModel().endUpdate();
        }
    }

    /********************************************
     *
     ********************************************/
    function initialize_mxgraph(self)
    {
        function click_handler(sender, evt)
        {
            var cell = evt.getProperty('cell');
            if (cell != null) {
                if(cell.isVertex()) {
                    self.parent.gobj_send_event("EV_MX_CELL_CLICKED", cell, self);
                }
            }
        }
        var graph = self.config._mxgraph;
        graph.removeListener(click_handler);

        create_root_and_layers(graph, self.config.layers);

        // Enables rubberband selection
        new mxRubberband(graph);

        // Panning? HACK if panning is set then rubberband selection will not work
        graph.setPanning(false);

        // Negative coordenates?
        graph.allowNegativeCoordinates = false;

        // Multiple connections between the same pair of vertices.
        graph.setMultigraph(true);

        // Avoids overlap of edges and collapse icons
        graph.keepEdgesInBackground = true;

        // Enables automatic sizing for vertices after editing
        graph.setAutoSizeCells(true);

        /*---------------------------*
         *      PERMISOS
         *---------------------------*/
        // Enable/Disable cell handling
        graph.setEnabled(true);

        graph.setConnectable(false); // Crear edges/links
        graph.setCellsDisconnectable(false); // Modificar egdes/links
        graph.setCellsLocked(false);
        graph.setPortsEnabled(true);

// TODO mira si sirve
// graph.disconnectOnMove = false;
// graph.foldingEnabled = false;
// graph.cellsResizable = false;
// graph.extendParents = false;

// // Disables automatic handling of ports. This disables the reset of the
// // respective style in mxGraph.cellConnected. Note that this feature may
// // be useful if floating and fixed connections are combined.
// graph.setPortsEnabled(false);

        // Enable/Disable basic selection (selected = se activa marco de redimensionamiento)
        graph.setCellsSelectable(true);

        mxGraph.prototype.isCellSelectable = function(cell) {
            if(cell.isVertex()) {
                return true;
            }
            return false; // edges no selectable
        };

        // Set stylesheet options
        var style = graph.getStylesheet().getDefaultVertexStyle();
        style[mxConstants.STYLE_SHAPE] = mxConstants.SHAPE_RECTANGLE;
        style[mxConstants.STYLE_SHAPE] = 'treenode';
        style[mxConstants.STYLE_GRADIENTCOLOR] = 'white';
        style[mxConstants.STYLE_SHADOW] = true;
        style[mxConstants.STYLE_ROUNDED] = true;
        style[mxConstants.STYLE_FONTFAMILY] = "Arial";
        style[mxConstants.STYLE_FONTSTYLE] = '0';
        style[mxConstants.STYLE_FONTSIZE] = '12';

        style = graph.getStylesheet().getDefaultEdgeStyle();
        style[mxConstants.STYLE_EDGE] = mxEdgeStyle.TopToBottom;
        style[mxConstants.STYLE_ROUNDED] = true;

        // Handles clicks on cells
        graph.addListener(mxEvent.CLICK, click_handler);

        /*
         *  Own getLabel
         */
        graph.setHtmlLabels(true);
        graph.getLabel = function(cell) {
            if (this.getModel().isVertex(cell)) {
                return br(cell.value.shortname);
            }
        };

        /*
         *  Own getTooltip
         */
        graph.setTooltips(true);
        graph.getTooltip = function(state) {
            if(this.model.isVertex(state.cell)) {
                return br(state.cell.value.shortname);
            }
            return mxGraph.prototype.getTooltip.apply(this, arguments); // "supercall"
        };

        // Defines the condition for showing the folding icon
        graph.isCellFoldable = function(cell)
        {
            return this.model.getOutgoingEdges(cell).length > 0;
        };

        graph.getCursorForCell = function(cell) {
            if(this.model.isEdge(cell)) {
                return 'default';
            } else {
                return 'default';
            }
        };

        // Defines the position of the folding icon
        graph.cellRenderer.getControlBounds = function(state) {
            if (state.control != null) {
                var oldScale = state.control.scale;
                var w = state.control.bounds.width / oldScale;
                var h = state.control.bounds.height / oldScale;
                var s = state.view.scale;

                // 0 = TreeNodeShape.prototype.segment * s
                return new mxRectangle(state.x + state.width / 2 - w / 2 * s,
                    state.y + state.height + 10 - h / 2 * s,
                    w * s, h * s
                );
            }

            return null;
        };

        // Implements the click on a folding icon
        graph.foldCells = function(collapse, recurse, cells) {
            this.model.beginUpdate();
            try {
                toggleSubtree(this, cells[0], !collapse);
                this.model.setCollapsed(cells[0], collapse);

                // Executes the layout for the new graph since
                // changes to visiblity and collapsed state do
                // not trigger a layout in the current manager.

                execute_layout(self);
            } finally {
                this.model.endUpdate();
            }
        };

        // Updates the visible state of a given subtree taking into
        // account the collapsed state of the traversed branches
        function toggleSubtree(graph, cell, show) {
            show = (show != null) ? show : true;
            var cells = [];

            graph.traverse(cell, true, function(vertex)
            {
                if (vertex != cell)
                {
                    cells.push(vertex);
                }

                // Stops recursion if a collapsed cell is seen
                return vertex == cell || !graph.isCellCollapsed(vertex);
            });

            graph.toggleCells(show, cells, true);
        };
    }

    /************************************************************
     *
     ************************************************************/
    function br(short_name)
    {
        var n = short_name.split('^');
        return "<b>" + n[0] + "</b>^<br/>" + n[1];
    }

    /************************************************************
     *
     ************************************************************/
    function get_layer(self, layer)
    {
// TODO        var layers = self.config.layers;
//         for(var i=0; i<layers.length; i++) {
//             if(layers[i].id == layer) {
//                 return layers[i].__mx_cell__;
//             }
//         }
//         var x = self.config._mxgraph.getModel().getCell(layer);
        return self.config._mxgraph.getDefaultParent();
    }

    /************************************************************
     *
     ************************************************************/
    function _load_gobj_treedb(self, group, data)
    {
        var x_acc = [];
        var x = 0;
        var y = 0; // si meto separación aparece scrollbar al ajustar
        var sep = self.config.vertex_sep;
        var style = "";

        // WARNING without a built-in layout, the graph is horrible.
        for(var i=0; i<data.length; i++) {
            var record = data[i];
            var parent = record.parent_id?self.config._mxgraph.model.getCell(record.parent_id):null;

            var cx = self.config.vertex_cx;
            var cy = self.config.vertex_cy;
            if(!(record.service || record.unique)) {
                cx = (cx*5)/8;
                cy = (cy*5)/8;
            }
            if(empty_string(record.name)) {
                cx = (cx*4)/8;
                cy = (cy*4)/8;
            }

            y = record.id.split("`");
            y = Number(y.length) - 1;
            if(!x_acc[y]) {
                x_acc[y] = (y>0)?x_acc[y-1]-1:0;
            }

            x = (x_acc[y]) * (cx+sep);
            (x_acc[y])++;

            var child = self.config._mxgraph.insertVertex(
                group,
                record.id,
                record,
                x,
                (y)*(cy+sep),
                cx, cy,
                style
            );
            if(parent) {
                self.config._mxgraph.insertEdge(
                    group,          // group
                    null,           // id
                    '',             // value
                    parent,         // source
                    child,          // target
                    null            // style
                );
            }
        }
    }

    /************************************************************
     *
     ************************************************************/
    function load_gobj_tree(self, data, layer)
    {
        var group = get_layer(self, layer);
        _load_gobj_treedb(self, group, data);

        var cur_layout = kwid_collect(
            self.config.layout_options,
            self.config.layout_selected,
            null, null
        )[0];

        if(cur_layout) {
            cur_layout.exe.execute(group);
        }
    }




            /***************************
             *      Actions
             ***************************/




    /********************************************
     *
     ********************************************/
    function ac_select_item(self, event, kw, src)
    {
        self.config._mxgraph.setSelectionCell(self.config._mxgraph.model.getCell(kw.id));
    }

    /********************************************
     *
     ********************************************/
    function ac_load_data(self, event, kw, src)
    {
        var layer = kw.layer;
        var data = __duplicate__(kw.data);

        var model = self.config._mxgraph.getModel();
        model.beginUpdate();
        try {
            switch(kw.type) {
                case "gobj-tree":
                default:
                    load_gobj_tree(self, data, layer);
                    break;
            }

        } finally {
            model.endUpdate();
        }

        return 0;
    }

    /********************************************
     *
     ********************************************/
    function ac_clear_data(self, event, kw, src)
    {
        // Get current index, remove UI from parent, re-build UI, add UI to parent with same idx.
        var idx = self.config.$container_parent.index(self.config.$ui);
        self.config.$container_parent.removeView(self.config.$ui);
        rebuild(self);
        self.config.$container_parent.addView(self.config.$ui, idx);

        return 0;
    }

    /********************************************
     *
     ********************************************/
    function ac_select(self, event, kw, src)
    {

        return 0;
    }

    /********************************************
     *  Order from container (parent): re-create
     ********************************************/
    function ac_refresh(self, event, kw, src)
    {
        rebuild(self);
        return 0;
    }




            /***************************
             *      GClass/Machine
             ***************************/




    var FSM = {
        "event_list": [
            "EV_SELECT_ITEM",
            "EV_LOAD_DATA",
            "EV_CLEAR_DATA",
            "EV_SELECT",
            "EV_REFRESH"
        ],
        "state_list": [
            "ST_IDLE"
        ],
        "machine": {
            "ST_IDLE":
            [
                ["EV_SELECT_ITEM",          ac_select_item,     undefined],
                ["EV_LOAD_DATA",            ac_load_data,       undefined],
                ["EV_CLEAR_DATA",           ac_clear_data,      undefined],
                ["EV_SELECT",               ac_select,          undefined],
                ["EV_REFRESH",              ac_refresh,         undefined]
            ]
        }
    };

    var Mx_gobj_tree = GObj.__makeSubclass__();
    var proto = Mx_gobj_tree.prototype; // Easy access to the prototype
    proto.__init__= function(name, kw) {
        GObj.prototype.__init__.call(
            this,
            FSM,
            CONFIG,
            name,
            "Mx_gobj_tree",
            kw,
            0
        );
        return this;
    };
    gobj_register_gclass(Mx_gobj_tree, "Mx_gobj_tree");




            /***************************
             *      Framework Methods
             ***************************/




    /************************************************
     *      Framework Method create
     ************************************************/
    proto.mt_create = function(kw)
    {
        var self = this;

        var cur_layout = kwid_collect(
            self.config.layout_options,
            self.config.layout_selected,
            null, null
        )[0];
        if(!cur_layout) {
            cur_layout = self.config.layout_options[0];
        }
        self.config.layout_selected = cur_layout.id;

        rebuild(self);

        $$(build_name(self, "layout_options")).define("options", self.config.layout_options);
        $$(build_name(self, "layout_options")).setValue(cur_layout.id);
    }

    /************************************************
     *      Framework Method destroy
     *      In this point, all childs
     *      and subscriptions are already deleted.
     ************************************************/
    proto.mt_destroy = function()
    {
        var self = this;
        if(self.config._mxgraph) {
            self.config._mxgraph.destroy();
            self.config._mxgraph = null;
        }
        if(self.config.$ui) {
            self.config.$ui.destructor();
            self.config.$ui = 0;
        }
    }

    /************************************************
     *      Framework Method start
     ************************************************/
    proto.mt_start = function(kw)
    {
        var self = this;
        mxEvent.disableContextMenu(
            $$(build_name(self, "mxgraph")).getNode()
        );
    }

    /************************************************
     *      Framework Method stop
     ************************************************/
    proto.mt_stop = function(kw)
    {
        var self = this;
    }


    //=======================================================================
    //      Expose the class via the global object
    //=======================================================================
    exports.Mx_gobj_tree = Mx_gobj_tree;

})(this);
