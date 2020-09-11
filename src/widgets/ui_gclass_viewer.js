/***********************************************************************
 *          ui_gclass_viewer.js
 *
 *          GClass Viewer
 *          "Container Panel"
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
        /*
         *  Top Toolbar of "Container Panel"
         */
        title: "",
        with_top_toolbar: false,
        with_hidden_btn: false,
        with_fullscreen_btn: false,
        with_resize_btn: false,

        view_handler: "view1", // "json", "view1",... TODO
        mxnode_gclass: null,

        layout_options: [
            {
                id: "no_layout",
                value: "No Layout",
                layout: function(layout_option, graph) {
                    return null;
                }
            },
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

        layout_selected: "no_layout",

        ui_properties: null,
        $ui: null,

        __writable_attrs__: [
            "layout_selected"
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
         *      Top Toolbar of "Container Panel"
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
                        self.parent.gobj_send_event("EV_REFRESH", {}, self);
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
                        self.parent.gobj_send_event("EV_REFRESH", {}, self);
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
                                                self.parent.gobj_send_event("EV_REFRESH", {}, self);
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
                        self.parent.gobj_send_event("EV_REFRESH", {}, self);
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

                        /*----------------------------------------------*
                         *  Inform of view viewed to "Container Panel"
                         *----------------------------------------------*/
                        self.parent.gobj_send_event("EV_ON_VIEW_SHOW", self, self);
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
                    hidden: true, // HACK own layout
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

                            if(self.gobj_is_unique()) {
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
            view: "layout",
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
            if(self.config.$ui.resize) {
                self.config.$ui.resize();
            }
        }

        /*----------------------------------------------*
         *  Inform of view viewed to "Container Panel"
         *----------------------------------------------*/
        self.config.$ui.attachEvent("onViewShow", function() {
            self.parent.gobj_send_event("EV_ON_VIEW_SHOW", self, self);
        });
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
    function execute_layout(self, group)
    {
        var graph = self.config._mxgraph;
        if(group) {
            group = get_layer(self, "layer?");
        }

        var cur_layout = kwid_collect(
            self.config.layout_options,
            self.config.layout_selected,
            null, null
        )[0];
        if(!cur_layout) {
            cur_layout = self.config.layout_options[0];
        }

        if(cur_layout && cur_layout.exe) {
            graph.getModel().beginUpdate();
            try {
                cur_layout.exe.execute(group);
            } catch (e) {
                log_error(JSON.stringify(e));
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
        } catch (e) {
            log_error(JSON.stringify(e));
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

        graph.setConnectable(false);    // (true) Crear edges/links, update mxConnectionHandler.enabled
        graph.cellsDisconnectable = false;  // (true) Override by isCellDisconnectable()
        graph.cellsLocked = false;      // (false)  Override by isCellsLocked()
        graph.portsEnabled = true;      // (true)   Override by isPortsEnabled()
        graph.cellsEditable = false;    // (true)   Override by isCellEditable()
        graph.cellsResizable = false;   // (true)   Override by isCellResizable()
        graph.setCellsMovable = true;   // (true)   Override by isCellMovable()
        graph.disconnectOnMove = false; // (true)   Override by isDisconnectOnMove()
        graph.constrainChildren = false;// (true)   Override by isConstrainChildren()
        graph.extendParents = false;    // (true)   Override by isExtendParents()
        graph.extendParentsOnAdd = false;// (true)  Override by isExtendParentsOnAdd()
        graph.extendParentsOnMove = false; // (false) Override by isExtendParentsOnMove()
        graph.foldingEnabled = false;   // (true) General para todos, sin Override
        graph.dropEnabled = false;      // (false)  Override by isDropEnabled()

        // HACK Por defecto si los hijos salen un overlap del 50% se quitan del padre y pasan al default
        graph.graphHandler.setRemoveCellsFromParent(false); // HACK impide quitar hijos

        graph.graphHandler.setCloneEnabled(false); // Ctrl+Drag will clone a cell

        mxGraph.prototype.isAllowOverlapParent = function(cell) { return true;}
        mxGraph.prototype.defaultOverlap = 1; // Permite a hijos irse tan lejos como quieran

        /*
         *  Enable/Disable basic selection (se activa marco de redimensionamiento o movible)
         *  Si se cambia isCellSelectable() entonces es lo que prima.
         *  Seleccionable, se puede activar:
         *      - el marco de redimensionamiento (setCellsResizable a true)
         *      - el marco de movimiento
         */
        graph.cellsSelectable = false; // Default: true, Override by isCellSelectable()
        mxGraph.prototype.isCellSelectable = function(cell) {
            if(cell.isVertex()) {
                return true;
            }
            return false; // edges no selectable
        };

        // Set stylesheet options
        var style = graph.getStylesheet().getDefaultVertexStyle();
        style[mxConstants.STYLE_SHAPE] = mxConstants.SHAPE_RECTANGLE;

        style[mxConstants.STYLE_FILLCOLOR] = '#FBB5CA';
        style[mxConstants.STYLE_STROKECOLOR] = '#F8CECC';

        style[mxConstants.STYLE_GRADIENTCOLOR] = '#FBD5E4';
        style[mxConstants.STYLE_SHADOW] = true;
        style[mxConstants.STYLE_ROUNDED] = true;
        style[mxConstants.STYLE_FONTFAMILY] = "Arial";
        style[mxConstants.STYLE_FONTSTYLE] = '0';
        style[mxConstants.STYLE_FONTSIZE] = '12';

        style = graph.getStylesheet().getDefaultEdgeStyle();
        style[mxConstants.STYLE_EDGE] = mxEdgeStyle.TopToBottom;
        style[mxConstants.STYLE_ROUNDED] = true;

        /*
         *  Own getLabel
         */
        graph.setHtmlLabels(true);
        graph.getLabel = function(cell) {
            switch(cell.id) {
                case 'class_attrs':
                    return html(self, cell.value);
                    break;
                default:
                    if(cell.value.label) {
                        return cell.value.label;
                    }
                    break;
            }
            return null;
        };

        /*
         *  Own getTooltip
         */
        graph.setTooltips(true);
        graph.getTooltip = function(state) {
            if(state.cell.value.tooltip) {
                return state.cell.value.tooltip;
            }
            return null;
        };

        // Defines the condition for showing the folding icon
        graph.isCellFoldable = function(cell, collapse)
        {
            return false;
        };

        graph.getCursorForCell = function(cell) {
            if(this.model.isEdge(cell)) {
                return 'default';
            } else {
                return 'default';
            }
        };

        setup_events(self, graph);
    }

    /************************************************************
     *
     ************************************************************/
    function setup_events(self, graph)
    {
        var events = [
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
        for(var i=0; i<events.length; i++) {
            var ev = events[i];
            graph.addListener(ev, function(sender, evt) {
                self.gobj_send_event("MX_" + evt.name, evt.properties, self);
            });
        }
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
    function load_gclass(self, data, layer)
    {
        /*
         *  HACK is already in a beginUpdate/endUpdate
         */
        var graph = self.config._mxgraph;
        var group = get_layer(self, layer);

        switch(self.config.view_handler) {
            case "viewer1":
            default:
                show_view1(self, graph, group, data);
                break;
        }

        execute_layout(self, group);
    }

    /************************************************************
     *
     ************************************************************/
    function html(self, record)
    {
        return JSON.stringify(record);
    }

    /************************************************************
     *
     ************************************************************/
    function show_view1(self, graph, group, record)
    {
        var win_cx = self.config.$ui.$width;
        var win_cy = self.config.$ui.$height;
        var margin = 10;

        var cx = 300;
        var cy = 500;

        var x = (win_cx > cx)? (win_cx - cx)/2 : margin;
        var y = margin;

        self.config.mxnode_gclass = graph.insertVertex(
            group,
            record.id,
            record,
            x, y, cx, cy,
            ""
        );

        var class_attrs = graph.insertVertex(
            self.config.mxnode_gclass,
            'class_attrs',
            {
                "name": record.id,
                "base": record.base,
                "priv_size": record.priv_size,
                "instances": record.instances
            },
            20, 20, cx - cx/8, 50,
            'shape=rectangle;fontSize=10;'+
            'spacingLeft=12;fillColor=white;'+
            'fontColor=black;strokeColor=black;',
            false
        );


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
        } catch (e) {
            log_error(JSON.stringify(e));
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
    function ac_select(self, event, kw, src)
    {
        return 0;
    }

    /*************************************************************
     *  Refresh,
     *  provocado por entry/exit de fullscreen
     *  o por redimensionamiento del panel, propio o de hermanos
     *
     *  Centra mxnode_gclass
     *************************************************************/
    function ac_refresh(self, event, kw, src)
    {
        if(!self.config.mxnode_gclass) {
            return 0;
        }
        var margin = 10;
        var graph = self.config._mxgraph;
        var win_cx = self.config.$ui.$width;
        var win_cy = self.config.$ui.$height;
        var geo = graph.getCellGeometry(self.config.mxnode_gclass);
        var new_x = geo.x;
        var new_y = geo.y;
        var cx = geo.width;
        var cy = geo.height;

        if(cx >= win_cx) {
            new_x = margin;
        } else {
            new_x = (win_cx - cx)/2
        }
        if(cy >= win_cy) {
            new_y = margin;
        }

        var dx = geo.x - new_x;
        var dy = geo.y - new_y;

        try {
            var cells = [self.config.mxnode_gclass];
            graph.moveCells(cells, -dx, -dy);
            graph.refresh();
        } catch (e) {
            log_error(JSON.stringify(e));
        } finally {
            graph.getModel().endUpdate();
        }

        return 0;
    }

    /********************************************
     *  "Container Panel"
     *  Order from container (parent): re-create
     ********************************************/
    function ac_rebuild_panel(self, event, kw, src)
    {
        rebuild(self);
        return 0;
    }

    /********************************************
     *
     ********************************************/
    function ac_mx_event(self, event, kw, src)
    {
        //trace_msg("mx event: " + event );
        //trace_msg(kw);
        return 0;
    }




            /***************************
             *      GClass/Machine
             ***************************/




    var FSM = {
        "event_list": [
            "EV_LOAD_DATA",
            "EV_CLEAR_DATA",
            "EV_SELECT",
            "EV_REFRESH",
            "EV_REBUILD_PANEL",
            "MX_" + mxEvent.ROOT,
            "MX_" + mxEvent.ALIGN_CELLS,
            "MX_" + mxEvent.FLIP_EDGE,
            "MX_" + mxEvent.ORDER_CELLS,
            "MX_" + mxEvent.CELLS_ORDERED,
            "MX_" + mxEvent.GROUP_CELLS,
            "MX_" + mxEvent.UNGROUP_CELLS,
            "MX_" + mxEvent.REMOVE_CELLS_FROM_PARENT,
            "MX_" + mxEvent.ADD_CELLS,
            "MX_" + mxEvent.CELLS_ADDED,
            "MX_" + mxEvent.REMOVE_CELLS,
            "MX_" + mxEvent.CELLS_REMOVED,
            "MX_" + mxEvent.SPLIT_EDGE,
            "MX_" + mxEvent.TOGGLE_CELLS,
            "MX_" + mxEvent.FOLD_CELLS,
            "MX_" + mxEvent.CELLS_FOLDED,
            "MX_" + mxEvent.UPDATE_CELL_SIZE,
            "MX_" + mxEvent.RESIZE_CELLS,
            "MX_" + mxEvent.CELLS_RESIZED,
            "MX_" + mxEvent.MOVE_CELLS,
            "MX_" + mxEvent.CELLS_MOVED,
            "MX_" + mxEvent.CONNECT_CELL,
            "MX_" + mxEvent.CELL_CONNECTED,
            "MX_" + mxEvent.REFRESH,
            "MX_" + mxEvent.CLICK,
            "MX_" + mxEvent.DOUBLE_CLICK,
            "MX_" + mxEvent.GESTURE,
            "MX_" + mxEvent.TAP_AND_HOLD,
            "MX_" + mxEvent.FIRE_MOUSE_EVENT,
            "MX_" + mxEvent.SIZE,
            "MX_" + mxEvent.START_EDITING,
            "MX_" + mxEvent.EDITING_STARTED,
            "MX_" + mxEvent.EDITING_STOPPED,
            "MX_" + mxEvent.LABEL_CHANGED,
            "MX_" + mxEvent.ADD_OVERLAY,
            "MX_" + mxEvent.REMOVE_OVERLAY
        ],
        "state_list": [
            "ST_IDLE"
        ],
        "machine": {
            "ST_IDLE":
            [
                ["EV_LOAD_DATA",                ac_load_data,               undefined],
                ["EV_CLEAR_DATA",               ac_clear_data,              undefined],
                ["EV_REBUILD_PANEL",            ac_rebuild_panel,           undefined],
                ["EV_SELECT",                   ac_select,                  undefined],
                ["EV_REFRESH",                  ac_refresh,                 undefined],
                ["MX_" + mxEvent.ROOT,          ac_mx_event,                undefined],
                ["MX_" + mxEvent.ALIGN_CELLS,   ac_mx_event,                undefined],
                ["MX_" + mxEvent.FLIP_EDGE,     ac_mx_event,                undefined],
                ["MX_" + mxEvent.ORDER_CELLS,   ac_mx_event,                undefined],
                ["MX_" + mxEvent.CELLS_ORDERED, ac_mx_event,                undefined],
                ["MX_" + mxEvent.GROUP_CELLS,   ac_mx_event,                undefined],
                ["MX_" + mxEvent.UNGROUP_CELLS, ac_mx_event,                undefined],
                ["MX_" + mxEvent.REMOVE_CELLS_FROM_PARENT, ac_mx_event,     undefined],
                ["MX_" + mxEvent.ADD_CELLS,     ac_mx_event,                undefined],
                ["MX_" + mxEvent.CELLS_ADDED,   ac_mx_event,                undefined],
                ["MX_" + mxEvent.REMOVE_CELLS,  ac_mx_event,                undefined],
                ["MX_" + mxEvent.CELLS_REMOVED, ac_mx_event,                undefined],
                ["MX_" + mxEvent.SPLIT_EDGE,    ac_mx_event,                undefined],
                ["MX_" + mxEvent.TOGGLE_CELLS,  ac_mx_event,                undefined],
                ["MX_" + mxEvent.FOLD_CELLS,    ac_mx_event,                undefined],
                ["MX_" + mxEvent.CELLS_FOLDED,  ac_mx_event,                undefined],
                ["MX_" + mxEvent.UPDATE_CELL_SIZE, ac_mx_event,             undefined],
                ["MX_" + mxEvent.RESIZE_CELLS,  ac_mx_event,                undefined],
                ["MX_" + mxEvent.CELLS_RESIZED, ac_mx_event,                undefined],
                ["MX_" + mxEvent.MOVE_CELLS,    ac_mx_event,                undefined],
                ["MX_" + mxEvent.CELLS_MOVED,   ac_mx_event,                undefined],
                ["MX_" + mxEvent.CONNECT_CELL,  ac_mx_event,                undefined],
                ["MX_" + mxEvent.CELL_CONNECTED,ac_mx_event,                undefined],
                ["MX_" + mxEvent.REFRESH,       ac_mx_event,                undefined],
                ["MX_" + mxEvent.CLICK,         ac_mx_event,                undefined],
                ["MX_" + mxEvent.DOUBLE_CLICK,  ac_mx_event,                undefined],
                ["MX_" + mxEvent.GESTURE,       ac_mx_event,                undefined],
                ["MX_" + mxEvent.TAP_AND_HOLD,  ac_mx_event,                undefined],
                ["MX_" + mxEvent.FIRE_MOUSE_EVENT,ac_mx_event,              undefined],
                ["MX_" + mxEvent.SIZE,          ac_mx_event,                undefined],
                ["MX_" + mxEvent.START_EDITING, ac_mx_event,                undefined],
                ["MX_" + mxEvent.EDITING_STARTED,ac_mx_event,               undefined],
                ["MX_" + mxEvent.EDITING_STOPPED,ac_mx_event,               undefined],
                ["MX_" + mxEvent.LABEL_CHANGED, ac_mx_event,                undefined],
                ["MX_" + mxEvent.ADD_OVERLAY,   ac_mx_event,                undefined],
                ["MX_" + mxEvent.REMOVE_OVERLAY,ac_mx_event,                undefined]
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
