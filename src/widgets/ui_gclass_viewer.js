/***********************************************************************
 *          ui_gclass_viewer.js
 *
 *          GClass Viewer
 *
 *          Copyright (c) 2020 Niyamaka.
 *          All Rights Reserved.
 *
 *
 *  Version
 *  -------
 *  1.0     Initial release
 *

        {
            "id": "IOGate",
            "base": "",
            "gcflag": [
                "no_check_ouput_events"
            ],
            "priv_size": 72,
            "attrs": [
                {
                    "id": "persistent_channels",
                    "type": "signed32",
                    "default_value": 0,
                    "description": "Set True to do channels persistent (in sqlite database).",
                    "flag": "SDF_RD"
                },
                ...
            ],
            "commands": [
                {
                    "id": "help",
                    "alias": [
                        "h",
                        "?"
                    ],
                    "description": "Available commands or help about a command.",
                    "usage": "help  [cmd='?'] [level='?']",
                    "parameters": [
                        {
                            "id": "cmd",
                            "type": "string",
                            "default_value": "",
                            "description": "command about you want help.",
                            "flag": ""
                        },
                        ...
                    ]
                },
            ],
            "global_methods": [
                "mt_create",
                ...
            ],
            "local_methods": [],
            "FSM": {
                "input_events": [
                    {
                        "event": "EV_IEV_MESSAGE",
                        "permission": "",
                        "description": ""
                    },
                    ...
                ],
                "output_events": [
                    {
                        "event": "EV_ON_MESSAGE",
                        "permission": "",
                        "description": "Message received"
                    },
                    ...
                ],
                "states": {
                    "ST_IDLE": [
                        [
                            "EV_ON_MESSAGE",
                            "ac_action",
                            0
                        ],
                        ...
                    ],
                    ...
                }
            },
            "ACL": [],
            "info_global_trace": {
                "machine": "Trace machine",
                ...
            },
            "info_gclass_trace": {
                "connection": "Trace connections of iogates",
                ...
            },
            "gclass_trace_level": [],
            "gclass_no_trace_level": [],
            "instances": 2
        }
 *
 ***********************************************************************/
(function (exports) {
    'use strict';

    /********************************************
     *      Configuration (C attributes)
     ********************************************/
    var CONFIG = {
        title: "",
        with_top_toolbar: false,
        with_hidden_btn: false,
        with_fullscreen_btn: false,
        with_resize_btn: false,

        layout_options: [
            {
                id: "tree_layout",
                value: "Compact Tree Layout",
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

        ui_properties: null,
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
        if(empty_string(self.gobj_name())) {
            if(!self._uuid_name) {
                self._uuid_name = get_unique_id(self.gobj_gclass_name());
            }
            return self._uuid_name + "-" + name;
        }
        return self.gobj_escaped_short_name() + "-" + name;
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
        /*------------------------------------------*
         *      Top Toolbar of Container panel
         *------------------------------------------*/
        var top_toolbar = {
            view:"toolbar",
            id: build_name(self, "top_toolbar"),
            hidden: self.config.with_top_toolbar?false:true,
            css: "toolbar2color",
            height: 30,
            cols: [
                {
                    view:"icon",
                    hidden: self.config.with_resize_btn?false:true,
                    icon: "far fa-arrow-from-right",
                    tooltip: t("enlarge"),
                    click: function() {
                        var gravity = self.config.$ui.config.gravity;
                        gravity++;
                        self.config.$ui.define({gravity:gravity});
                        if(self.config.$ui.refresh) {
                            self.config.$ui.refresh();
                        } else if(self.config.$ui.resize) {
                            self.config.$ui.resize();
                        }
                    }
                },
                {
                    view:"icon",
                    hidden: self.config.with_resize_btn?false:true,
                    icon: "far fa-arrow-from-left",
                    tooltip: t("narrow"),
                    click: function() {
                        var gravity = self.config.$ui.config.gravity;
                        gravity--;
                        if(gravity>0) {
                            self.config.$ui.define({gravity:gravity});
                            if(self.config.$ui.refresh) {
                                self.config.$ui.refresh();
                            } else if(self.config.$ui.resize) {
                                self.config.$ui.resize();
                            }
                        }
                    }
                },
                {},
                {
                    view: "label",
                    id: build_name(self, "top_toolbar_title"),
                    label: self.config.title,
                    click: function() {
                    }
                },
                {},
                {
                    view:"icon",
                    hidden: self.config.with_fullscreen_btn?false:true,
                    icon: "fas fa-expand-wide",
                    tooltip: t("fullscreen"),
                    click: function() {
                        $$(build_name(self, "top_toolbar")).hide();
                        webix.fullscreen.set(
                            self.config.$ui,
                            {
                                head: {
                                    view:"toolbar",
                                    height: 40,
                                    elements: [
                                        {
                                            view: "icon",
                                            icon: "fas fa-chevron-left",
                                            tooltip: t("exit fullscreen"),
                                            click: function() {
                                                webix.fullscreen.exit();
                                                $$(build_name(self, "top_toolbar")).show();
                                            }
                                        },
                                        {},
                                        {
                                            view: "label",
                                            label: self.config.title,
                                        },
                                        {}
                                    ]
                                }
                            }
                        );
                    }
                },
                {
                    view:"icon",
                    hidden: self.config.with_hidden_btn?false:true,
                    icon:"far fa-window-minimize",
                    tooltip: t("minimize"),
                    click: function() {
                        if(this.getTopParentView().config.fullscreen) {
                            webix.fullscreen.exit();
                        }
                        this.getParentView().getParentView().hide();
                    }
                }
            ]
        };

        /*---------------------------------------*
         *      Bottom Toolbar
         *---------------------------------------*/
        var bottom_toolbar = {
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
                { view:"label", label: ""},
                {
                    view:"button",
                    type: "icon",
                    icon: "far fa-question",
                    css: "webix_transparent icon_toolbar_16",
                    maxWidth: 120,
                    label: t("help"),
                    click: function() {
                        if($$(build_name(self, "help_window")).isVisible()) {
                            $$(build_name(self, "help_window")).hide();
                        } else {
                            $$(build_name(self, "help_window")).show();
                        }
                    }
                }
            ]
        };

        /*---------------------------------------*
         *      UI
         *---------------------------------------*/
        self.config.$ui = webix.ui({
            id: self.gobj_name(),
            rows: [
                top_toolbar,
                {
                    view: "mxgraph",
                    id: build_name(self, "mxgraph"),
                    gobj: self
                },
                bottom_toolbar
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
        var graph = self.config._mxgraph;

        mxEvent.disableContextMenu(graph.container);

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
        mxGraphHandler.prototype.setCloneEnabled(false); // Ctrl+Drag will clone a cell
        graph.setCellsLocked(false);
        graph.setPortsEnabled(true);
        graph.setCellsEditable(false);

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
        graph.addListener(mxEvent.CLICK, function(sender, evt) {
            var cell = evt.getProperty('cell');
            if (cell != null) {
                var record = evt.properties.cell.value;
                if(cell.isVertex()) {
                    self.parent.gobj_send_event("EV_MX_VERTEX_CLICKED", record, self);
                } else {
                    self.parent.gobj_send_event("EV_MX_EDGE_CLICKED", record, self);
                }
            }
        });

        /*
         *  Own getLabel
         */
        graph.setHtmlLabels(true);
        graph.getLabel = function(cell) {
            if (this.getModel().isVertex(cell)) {
                return cell.value.id;
            }
        };

        /*
         *  Own getTooltip
         */
        graph.setTooltips(true);
        graph.getTooltip = function(state) {
            if(state.cell.value.shortname) {
                return state.cell.value.id;
            }
            return mxGraph.prototype.getTooltip.apply(this, arguments); // "supercall"
        };

        // Defines the condition for showing the folding icon
        graph.isCellFoldable = function(cell, collapse)
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
        graph.cellRenderer.getControlBounds = function(state, w, h) {
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

        /*
         *  Add callback: Only cells selected have "class overlays"
         */
        graph.getSelectionModel().addListener(mxEvent.CHANGE, function(sender, evt) {
            /*
             *  HACK "added" vs "removed"
             *  The names are inverted due to historic reasons.  This cannot be changed.
             *
             *  HACK don't change the order, first removed, then added
             */
        });
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
    function _load_gclass(self, graph, group, record)
    {
        var x_acc = [];
        var x = 100;
        var y = 100; // si meto separación aparece scrollbar al ajustar
        var cx = 200;
        var cy = 200;
        var sep = self.config.vertex_sep;


        var child = graph.insertVertex(
            group,
            record.id,
            record,
            x,
            y,
            cx, cy,
            ""
        );

//             "id": "IOGate",
//             "base": "",
//             "priv_size": 72,
//             "instances": 2
    }

    /************************************************************
     *
     ************************************************************/
    function load_gclass(self, data, layer)
    {
        // HACK is already in a beginUpdate/endUpdate
        var graph = self.config._mxgraph;
        var group = get_layer(self, layer);
        _load_gclass(self, graph, group, data);

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
    function ac_load_data(self, event, kw, src)
    {
        var layer = kw.layer;
        var data = __duplicate__(kw.data);

        var model = self.config._mxgraph.getModel();
        model.beginUpdate();
        try {
            switch(kw.type) {
                case "gclass":
                default:
                    load_gclass(self, data, layer);
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
        self.config.$ui.show();

        return 0;
    }

    /********************************************
     *
     ********************************************/
    function ac_refresh(self, event, kw, src)
    {
        rebuild(self);
        return 0;
    }

    /********************************************
     *
     ********************************************/
    function ac_select(self, event, kw, src)
    {
        return 0;
    }




            /***************************
             *      GClass/Machine
             ***************************/




    var FSM = {
        "event_list": [
            "EV_LOAD_DATA",
            "EV_CLEAR_DATA",
            "EV_REFRESH",
            "EV_SELECT"
        ],
        "state_list": [
            "ST_IDLE"
        ],
        "machine": {
            "ST_IDLE":
            [
                ["EV_LOAD_DATA",                ac_load_data,               undefined],
                ["EV_CLEAR_DATA",               ac_clear_data,              undefined],
                ["EV_REFRESH",                  ac_refresh,                 undefined],
                ["EV_SELECT",                   ac_select,                  undefined]
            ]
        }
    };

    var Ui_gclass_viewer = GObj.__makeSubclass__();
    var proto = Ui_gclass_viewer.prototype; // Easy access to the prototype
    proto.__init__= function(name, kw) {
        GObj.prototype.__init__.call(
            this,
            FSM,
            CONFIG,
            name,
            "Ui_gclass_viewer",
            kw,
            0
        );
        return this;
    };
    gobj_register_gclass(Ui_gclass_viewer, "Ui_gclass_viewer");




            /***************************
             *      Framework Methods
             ***************************/




    /************************************************
     *      Framework Method create
     ************************************************/
    proto.mt_create = function(kw)
    {
        var self = this;

        var self = this;

        // TODO load_icons(self);

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
    exports.Ui_gclass_viewer = Ui_gclass_viewer;

})(this);
