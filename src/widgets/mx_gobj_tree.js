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
                layout: tree_layout
            },
            {
                id: "organic_layout",
                value: "Organic Layout",
                layout: organic_layout
            },
            {
                id: "circle_layout",
                value: "Circle Layout",
                layout: circle_layout
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
     *  Tree layout
     ********************************************/
    function tree_layout(layout_option, graph)
    {
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

    /********************************************
     *  Organic layout
     ********************************************/
    function organic_layout(layout_option, graph)
    {
        var layout = new mxFastOrganicLayout(graph);
        return layout;
    }

    /********************************************
     *  Circle layout
     ********************************************/
    function circle_layout(layout_option, graph)
    {
        var layout = new mxCircleLayout(graph);
        return layout;
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

        // Enable/Disable tooltips
        graph.setTooltips(true);

        // Adds a highlight on the cell under the mousepointer
        new mxCellTracker(graph);

        graph.setHtmlLabels(true);

        // Enable/Disable basic selection and cell handling
        graph.setEnabled(true);

        // Celdas seleccionables? (marco de redimensionamiento)
        graph.setCellsSelectable(true);

        // Avoids overlap of edges and collapse icons
        graph.keepEdgesInBackground = true;

        // Enables automatic sizing for vertices after editing
        graph.setAutoSizeCells(true);

        // Creates the default style for vertices
        var style = [];
        style[mxConstants.STYLE_SHAPE] = mxConstants.SHAPE_RECTANGLE;
        style[mxConstants.STYLE_PERIMETER] = mxPerimeter.RectanglePerimeter;
        style[mxConstants.STYLE_STROKECOLOR] = 'gray';
        style[mxConstants.STYLE_ROUNDED] = true;
        style[mxConstants.STYLE_FILLCOLOR] = '#D2E3EF';
        style[mxConstants.STYLE_GRADIENTCOLOR] = 'white';
        style[mxConstants.STYLE_FONTCOLOR] = '#774400';
        style[mxConstants.STYLE_ALIGN] = mxConstants.ALIGN_CENTER;
        style[mxConstants.STYLE_VERTICAL_ALIGN] = mxConstants.ALIGN_MIDDLE;
        style[mxConstants.STYLE_FONTSIZE] = '12';
        style[mxConstants.STYLE_FONTSTYLE] = 1;
        graph.getStylesheet().putDefaultVertexStyle(style);

        // Handles clicks on cells
        graph.addListener(mxEvent.CLICK, click_handler);

        graph.getLabel = function(cell) {
            if (this.getModel().isVertex(cell)) {
                return br(cell.value.shortname);
            }
        };

    }

    /************************************************************
     *
     ************************************************************/
    function br(short_name)
    {
        var n = short_name.split('^');
        return n[0] + "^<br/>" + n[1];
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
                cx = (cx/5)*3;
                cy = (cy/5)*3;
            }
            if(empty_string(record.name)) {
                cx = cx/2;
                cy = cy/2;
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
