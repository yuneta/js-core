/***********************************************************************
 *          ui_gclass_viewer.js
 *
 *          GClass Viewer
 *
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
            "attributes": [
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
            "gclass_methods": [
                "mt_create",
                ...
            ],
            "internal_methods": [],
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
        panel_properties: {},   // creator can set "Container Panel" properties
        ui_properties: null,

        $ui: null,

        gclass: null,
        node_gclass: null,
        locked: true,

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
                    layout.nodeDistance = 20;
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

        __writable_attrs__: [
            "layout_selected"
        ]
    };

    /************************************************************
     *   Schemas
     ************************************************************/
    var attrs_cols = [
        {
            "id": "id",
            "header": "Attribute",
            "fillspace": 15,
            "type": "string",
            "flag": [
                "persistent",
                "required"
            ]
        },
        {
            "id": "type",
            "header": "Type",
            "fillspace": 10,
            "type": "string",
            "flag": [
                "persistent",
                "required"
            ]
        },
        {
            "id": "default_value",
            "header": "Default Value",
            "fillspace": 15,
            "type": "string",
            "flag": [
                "persistent",
                "required"
            ]
        },
        {
            "id": "flag",
            "header": "Flag",
            "fillspace": 15,
            "type": "string",
            "flag": [
                "persistent",
                "required"
            ]
        },
        {
            "id": "description",
            "header": "Description",
            "fillspace": 30,
            "type": "string",
            "flag": [
                "persistent",
                "required"
            ]
        }
    ];

    var commands_cols = [
        {
            "id": "id",
            "header": "Command",
            "fillspace": 15,
            "type": "string",
            "flag": [
                "persistent",
                "required"
            ]
        },
        {
            "id": "alias",
            "header": "Alias",
            "fillspace": 10,
            "type": "string",
            "flag": [
                "persistent",
                "required"
            ]
        },
        {
            "id": "description",
            "header": "Description",
            "fillspace": 30,
            "type": "string",
            "flag": [
                "persistent",
                "required"
            ]
        },
        {
            "id": "usage",
            "header": "Usage",
            "fillspace": 30,
            "type": "string",
            "flag": [
                "persistent",
                "required"
            ]
        },
        {
            "id": "parameters",
            "header": "Parameters",
            "fillspace": 30,
            "type": "string",
            "flag": [
                "persistent",
                "required"
            ]
        }
    ];

    var input_events_cols = [
        {
            "id": "id",
            "header": "Event",
            "fillspace": 30,
            "type": "string",
            "flag": [
                "persistent",
                "required"
            ]
        },
        {
            "id": "flag",
            "header": "Flag",
            "fillspace": 30,
            "type": "string",
            "flag": [
                "persistent",
                "required"
            ]
        },
        {
            "id": "permission",
            "header": "Permission",
            "fillspace": 30,
            "type": "string",
            "flag": [
                "persistent",
                "required"
            ]
        },
        {
            "id": "description",
            "header": "Description",
            "fillspace": 30,
            "type": "string",
            "flag": [
                "persistent",
                "required"
            ]
        }
    ];
    var output_events_cols = input_events_cols;

    var states_cols = [
        {
            "id": "id",
            "header": "Method",
            "fillspace": 30,
            "type": "string",
            "flag": [
                "persistent",
                "required"
            ]
        }
    ];
    var state_cols = [
        {
            "id": "id",
            "header": "Event",
            "fillspace": 30,
            "type": "string",
            "flag": [
                "persistent",
                "required"
            ]
        },
        {
            "id": "action",
            "header": "Action",
            "fillspace": 30,
            "type": "string",
            "flag": [
                "persistent",
                "required"
            ]
        },
        {
            "id": "next_state",
            "header": "Next State",
            "fillspace": 30,
            "type": "string",
            "flag": [
                "persistent",
                "required"
            ]
        }
    ];
    var gclass_methods_cols = [
        {
            "id": "id",
            "header": "Method",
            "fillspace": 30,
            "type": "string",
            "flag": [
                "persistent",
                "required"
            ]
        }
    ];
    var trace_level_info_cols = [
        {
            "id": "id",
            "header": "Level",
            "fillspace": 30,
            "type": "string",
            "flag": [
                "persistent",
                "required"
            ]
        },
        {
            "id": "description",
            "header": "Description",
            "fillspace": 30,
            "type": "string",
            "flag": [
                "persistent",
                "required"
            ]
        }
    ];



            /***************************
             *      Internal Methods
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
        create_root_and_layers(self);
        rebuild_layouts(self);
    }

    /************************************************************
     *   Webix UI
     ************************************************************/
    function build_webix(self)
    {
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
                {
                    view:"button",
                    type: "icon",
                    icon: self.config.locked? "far fa-lock-alt":"far fa-lock-open-alt",
                    css: "webix_transparent icon_toolbar_16",
                    autosize: true,
                    label: self.config.locked? t("unlock vertices"):t("lock vertices"),
                    click: function() {
                        var graph = self.config._mxgraph;
                        if(graph.isCellsLocked()) {
                            graph.setCellsLocked(false);

                            graph.rubberband.setEnabled(true);
                            graph.panningHandler.useLeftButtonForPanning = false;

                            self.config.locked = false;
                            this.define("icon", "far fa-lock-open-alt");
                            this.define("label", t("lock vertices"));
                        } else {
                            graph.setCellsLocked(true);

                            graph.rubberband.setEnabled(false);
                            graph.panningHandler.useLeftButtonForPanning = true;

                            self.config.locked = true;
                            this.define("icon", "far fa-lock-alt");
                            this.define("label", t("unlock vertices"));
                        }
                        this.refresh();
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
                get_container_panel_top_toolbar(self),
                {
                    view: "mxgraph",
                    id: build_name(self, "mxgraph"),
                    events: [
                        mxEvent.CLICK
                    ],
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
         *  Inform of panel viewed to "Container Panel"
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
    function execute_layout(self)
    {
        var graph = self.config._mxgraph;
        var group = get_layer(self, "layer?");

        var cur_layout = kwid_collect(
            self.config.layout_options,
            self.config.layout_selected,
            null, null
        )[0];
        if(!cur_layout) {
            cur_layout = self.config.layout_options[0];
        }

        var locked = graph.isCellsLocked();
        if(locked) {
            graph.setCellsLocked(false);
        }

        if(cur_layout && cur_layout.exe) {
            graph.getModel().beginUpdate();
            try {
                cur_layout.exe.execute(group);
            } catch (e) {
                log_error(e);
            } finally {
                graph.getModel().endUpdate();
            }
        }

        if(locked) {
            graph.setCellsLocked(true);
        }
    }

    /********************************************
     *  Create root and layers
     ********************************************/
    function create_root_and_layers(self)
    {
        var graph = self.config._mxgraph;
        var root = null;

        root = new mxCell();
        root.setId("__mx_root__");

        // Create the layer
        var __mx_cell__ = root.insert(new mxCell());

        graph.getModel().beginUpdate();
        try {
            graph.getModel().setRoot(root);
        } catch (e) {
            log_error(e);
        } finally {
            graph.getModel().endUpdate();
        }
    }

    /************************************************************
     *
     ************************************************************/
    function get_layer(self, layer)
    {
        return self.config._mxgraph.getDefaultParent();
    }

    /********************************************
     *
     ********************************************/
    function create_graph_style(graph, name, s)
    {
        var style = {};
        var list = s.split(";");
        for(var i=0; i<list.length; i++) {
            var sty = list[i];
            if(empty_string(sty)) {
                continue;
            }
            var key_value = sty.split("=");
            if(key_value.length==1) {
                // Without = must be the shape
                style["shape"] = key_value[0];
            } else if(key_value.length==2) {
                style[key_value[0]] = key_value[1];
            } else {
                log_error("create_graph_style() bad style: " + sty);
            }
        }
        graph.getStylesheet().putCellStyle(name, style);
    }

    /*********************************************************
     *  HACK una cell está compuesta gráficamente de:
     *      - Shape de la celda
     *      - Label     (Contenido a pintar en la celda)
     *      - Overlays  (Cells extras)
     *      - Control   (folding icon) + deleteControl?
     *********************************************************/
    function initialize_mxgraph(self)
    {
        var graph = self.config._mxgraph;

        mxEvent.disableContextMenu(graph.container);

        graph.border = 30;
        graph.view.setTranslate(graph.border, graph.border);

        // Enables rubberband selection
        graph.rubberband = new mxRubberband(graph);
        graph.rubberband.setEnabled(false);

        graph.setPanning(true);
        graph.panningHandler.useLeftButtonForPanning = true;

        // Negative coordenates?
        graph.allowNegativeCoordinates = false;

        // Multiple connections between the same pair of vertices.
        graph.setMultigraph(true);

        // Avoids overlap of edges and collapse icons
        graph.keepEdgesInBackground = false;

        graph.setAutoSizeCells(true);

        /*---------------------------*
         *      PERMISOS
         *---------------------------*/
        // Enable/Disable cell handling
        graph.setEnabled(true);
        graph.setHtmlLabels(true);
        graph.setTooltips(true);

        graph.setConnectable(false); // Crear edges/links
        graph.setCellsDisconnectable(false); // Modificar egdes/links
        mxGraphHandler.prototype.setCloneEnabled(false); // Ctrl+Drag will clone a cell
        graph.setCellsLocked(self.config.locked);
        graph.setPortsEnabled(true);
        graph.setCellsEditable(false);

        mxGraph.prototype.isCellSelectable = function(cell) {
            return true;
        };

        /*
         *  HACK Por defecto si los hijos salen un overlap del 50%
         *  se quitan del padre y pasan al default
         */
        graph.graphHandler.setRemoveCellsFromParent(false); // HACK impide quitar hijos
        mxGraph.prototype.isAllowOverlapParent = function(cell) { return true;}
        mxGraph.prototype.defaultOverlap = 1; // Permite a hijos irse tan lejos como quieran

        /*
         *  General Vertex Style
         */
        var style = graph.getStylesheet().getDefaultVertexStyle();
//         style[mxConstants.STYLE_FONTFAMILY] = 'monospace, "dejavu sans mono", "droid sans mono", consolas, monaco, "lucida console", sans-serif, "courier new", courier';
        style[mxConstants.STYLE_FONTSIZE] = '14';
        style[mxConstants.STYLE_FONTSTYLE] = '0';

        /*
         *  General Edge Style
         */
        style = graph.getStylesheet().getDefaultEdgeStyle();
        style[mxConstants.STYLE_ROUNDED] = true;
        style[mxConstants.STYLE_STROKEWIDTH] = '1';

        // style[mxConstants.STYLE_EDGE] = mxEdgeStyle.ElbowConnector;
        // style[mxConstants.STYLE_EDGE] = mxEdgeStyle.EntityRelation;
        // style[mxConstants.STYLE_EDGE] = mxEdgeStyle.Loop;
        // style[mxConstants.STYLE_EDGE] = mxEdgeStyle.SideToSide;
        // style[mxConstants.STYLE_EDGE] = mxEdgeStyle.TopToBottom;
        // style[mxConstants.STYLE_EDGE] = mxEdgeStyle.OrthConnector;
        // style[mxConstants.STYLE_EDGE] = mxEdgeStyle.SegmentConnector;

        create_graph_style(
            graph,
            "gclass_container",
            "rounded=1;whiteSpace=wrap;html=1;shadow=1;fillColor=#dae8fc;strokeColor=#6c8ebf;align=left;labelPosition=center;verticalLabelPosition=middle;verticalAlign=top;horizontal=1;spacingLeft=10;spacingTop=10;glass=0;sketch=0;gradientColor=#ffffff;fontColor=#000000;"
        );
        create_graph_style(
            graph,
            "attributes",
            "ellipse;whiteSpace=wrap;html=1;aspect=fixed;fillColor=#fff2cc;strokeColor=#d6b656;gradientColor=#ffd966;fontColor=#000000;"
        );
        create_graph_style(
            graph,
            "commands",
            "ellipse;whiteSpace=wrap;html=1;aspect=fixed;fillColor=#ffcd28;strokeColor=#d79b00;gradientColor=#ffa500;fontColor=#000000;"
        );
        create_graph_style(
            graph,
            "FSM",
            "ellipse;whiteSpace=wrap;html=1;aspect=fixed;gradientColor=#97d077;fillColor=#d5e8d4;strokeColor=#82b366;fontColor=#000000;"
        );
        create_graph_style(
            graph,
            "input_events",
            "ellipse;whiteSpace=wrap;html=1;aspect=fixed;fillColor=#f8cecc;strokeColor=#b85450;gradientColor=#ea6b66;fontColor=#000000;"
        );
        create_graph_style(
            graph,
            "output_events",
            "ellipse;whiteSpace=wrap;html=1;aspect=fixed;gradientColor=#d5739d;fillColor=#e6d0de;strokeColor=#996185;fontColor=#000000;"
        );
        create_graph_style(
            graph,
            "states",
            "ellipse;whiteSpace=wrap;html=1;aspect=fixed;fillColor=#d5e8d4;strokeColor=#82b366;gradientColor=#53D081;fontColor=#000000;"
        );
        create_graph_style(
            graph,
            "state",
            "ellipse;whiteSpace=wrap;html=1;aspect=fixed;fillColor=#d5e8d4;strokeColor=#82b366;gradientColor=#CCFF99;fontColor=#000000;"
        );
        create_graph_style(
            graph,
            "event",
            "ellipse;whiteSpace=wrap;html=1;aspect=fixed;strokeColor=#b85450;fillColor=#F8EBE7;gradientColor=#EAA09A;fontColor=#000000;"
        );
        create_graph_style(
            graph,
            "gclass_methods",
            "ellipse;whiteSpace=wrap;html=1;aspect=fixed;fillColor=#dae8fc;strokeColor=#6c8ebf;gradientColor=#7ea6e0;fontColor=#000000;"
        );
        create_graph_style(
            graph,
            "internal_methods",
            "ellipse;whiteSpace=wrap;html=1;aspect=fixed;fillColor=#ffe6cc;strokeColor=#d79b00;shadow=1;fontColor=#000000;"
        );
        create_graph_style(
            graph,
            "ACL",
            "ellipse;whiteSpace=wrap;html=1;aspect=fixed;fillColor=#ffe6cc;strokeColor=#d79b00;shadow=1;fontColor=#000000;"
        );
        create_graph_style(
            graph,
            "trace_levels_info",
            "ellipse;whiteSpace=wrap;html=1;aspect=fixed;fillColor=#f5f5f5;strokeColor=#666666;gradientColor=#b3b3b3;fontColor=#000000;"
        );

        /*
         *  Own getLabel
         */
        graph.getLabel = function(cell) {
            if (this.getModel().isVertex(cell)) {
                switch(cell.style) {
                    case "gclass_container":
                        var t = "<b>" + cell.id + "</b><br/>";
                        if(is_object(cell.value)) {
                            for(var key in cell.value) {
                                var v = cell.value[key];
                                t += key + ": <pre style='display:inline'><i>" +
                                    v +
                                    "</i></pre><br/>";
                            }
                        }
                        return t;
                    default:
                        var t = "<b>" + cell.id + "</b><br/>";
                        var len = 0;
                        if(is_object(cell.value)) {
                            len = json_object_size(cell.value);
                        } else if(is_array(cell.value)) {
                            len = cell.value.length;
                        }
                        t += "<span>(" + len + ")</span><br/>";
                        return t;
                }
            }
            return "";
        };


        /*
         *  Tooltip
         */
        graph.getTooltipForCell = function(cell) {
            var tip = null;
            if (cell != null && cell.getTooltip != null) {
                tip = cell.getTooltip();
            } else {
                if(cell.id && cell.isVertex()) {
                    return cell.id;
                }
            }
            return tip;
        };

        /*
         *  Cursor pointer
         */
        graph.getCursorForCell = function(cell) {
            if(this.model.isVertex(cell)) {
                switch(cell.style) {
                    case "gclass_container":
                        return 'default';
                    case "attributes":
                    case "commands":
                    case "gclass_methods":
                    case "internal_methods":
                    case "ACL":
                    case "trace_levels_info":
                    case "input_events":
                    case "output_events":
                    case "states":
                    case "state":
                        return 'pointer';
                    default:
                    case "FSM":
                        return 'default';
                }
            } else {
                return 'default';
            }
        };
    }

    /************************************************************
     *
     ************************************************************/
    function show_view1(self, graph, layer, gclass)
    {
        /*
         *  HACK is already in a beginUpdate/endUpdate
         */
        var cx = 120;
        var cy = 120;

        /*-------------------------------*
         *      GClass container
         *-------------------------------*/
        var class_attrs = {
            "id": gclass.id,
            "base": gclass.base,
            "priv_size": gclass.priv_size,
            "gcflag": gclass.gcflag,
            "gclass_trace_level": gclass.gclass_trace_level,
            "gclass_no_trace_level": gclass.gclass_no_trace_level,
            "instances": gclass.instances
        }
        self.config.node_gclass = graph.insertVertex(
            layer,          // parent
            gclass.id,      // id
            class_attrs,    // value
            0, 0, 250, 200, // x,y,width,height
            "gclass_container", // style
            false           // relative
        );

        /*-------------------------------*
         *      Attrs
         *-------------------------------*/
        var attrs_node = graph.insertVertex(
            layer,                  // parent
            "Attributes",           // id
            gclass.attrs,           // value
            0, 0, cx, cy,           // x,y,width,height
            "attributes",                // style
            false                   // relative
        );

        graph.insertEdge(
            layer,          // parent
            null,                       // id
            '',                         // value
            self.config.node_gclass,    // source
            attrs_node,                 // target
            null                        // style
        );

        /*-------------------------------*
         *      Commands
         *-------------------------------*/
        var commands_node = graph.insertVertex(
            layer,                  // parent
            "Commands",             // id
            gclass.commands,        // value
            0, 0, cx, cy,           // x,y,width,height
            "commands",             // style
            false                   // relative
        );

        graph.insertEdge(
            layer,                      // parent
            null,                       // id
            '',                         // value
            self.config.node_gclass,    // source
            commands_node,              // target
            null                        // style
        );

        /*-------------------------------*
         *      FSM
         *-------------------------------*/
        var FSM_node = graph.insertVertex(
            layer,       // parent
            "FSM",       // id
            gclass.FSM,  // value
            0, 0, cx, cy,           // x,y,width,height
            "FSM",       // style
            false                   // relative
        );

        graph.insertEdge(
            layer,                      // parent
            null,                       // id
            '',                         // value
            self.config.node_gclass,    // source
            FSM_node,                   // target
            null                        // style
        );

        /*-------------------------------*
         *      FSM input_events
         *-------------------------------*/
        var input_events_node = graph.insertVertex(
            layer,                  // parent
            "Input Events",         // id
            gclass.FSM.input_events,// value
            0, 0, cx, cy,           // x,y,width,height
            "input_events",         // style
            false                   // relative
        );

        graph.insertEdge(
            layer,                      // parent
            null,                       // id
            '',                         // value
            FSM_node,                   // source
            input_events_node,          // target
            null                        // style
        );

        /*-------------------------------*
         *      FSM output_events
         *-------------------------------*/
        var output_events_node = graph.insertVertex(
            layer,                      // parent
            "Output Events",            // id
            gclass.FSM.output_events,   // value
            0, 0, cx, cy,               // x,y,width,height
            "output_events",            // style
            false                       // relative
        );

        graph.insertEdge(
            layer,                      // parent
            null,                       // id
            '',                         // value
            FSM_node,                   // source
            output_events_node,         // target
            null                        // style
        );

        /*-------------------------------*
         *      FSM states
         *-------------------------------*/
        var states_node = graph.insertVertex(
            layer,                      // parent
            "States",                   // id
            gclass.FSM.states,          // value
            0, 0, cx, cy,               // x,y,width,height
            "states",                   // style
            false                       // relative
        );

        graph.insertEdge(
            layer,                      // parent
            null,                       // id
            '',                         // value
            FSM_node,                   // source
            states_node,                // target
            null                        // style
        );

        for(var state_name in gclass.FSM.states) {
            var state = gclass.FSM.states[state_name];

            var state_node = graph.insertVertex(
                layer,                      // parent
                state_name,                 // id
                state,                      // value
                0, 0, cx, cy,               // x,y,width,height
                "state",                    // style
                false                       // relative
            );

            graph.insertEdge(
                layer,                      // parent
                null,                       // id
                '',                         // value
                states_node,                // source
                state_node,                 // target
                null                        // style
            );
        }

        /*-------------------------------*
         *      GClass Methods
         *-------------------------------*/
        var gclass_methods_node = graph.insertVertex(
            layer,                  // parent
            "GClass Methods",       // id
            gclass.gclass_methods,  // value
            0, 0, cx, cy,           // x,y,width,height
            "gclass_methods",       // style
            false                   // relative
        );

        graph.insertEdge(
            layer,                      // parent
            null,                       // id
            '',                         // value
            self.config.node_gclass,    // source
            gclass_methods_node,        // target
            null                        // style
        );

        /*-------------------------------*
         *      Internal Methods
         *-------------------------------*/
        if(0) {
            var internal_methods_node = graph.insertVertex(
                layer,                  // parent
                "Internal Methods",       // id
                gclass.internal_methods,  // value
                0, 0, cx, cy,           // x,y,width,height
                "internal_methods",       // style
                false                   // relative
            );

            graph.insertEdge(
                layer,                      // parent
                null,                       // id
                '',                         // value
                self.config.node_gclass,    // source
                internal_methods_node,         // target
                null                        // style
            );
        }

        /*-------------------------------*
         *      Info trace levels
         *-------------------------------*/
        if(1) {
            var info_trace_levels_info_node = graph.insertVertex(
                layer,                  // parent
                "Trace Level Info",     // id
                {                       // value
                    info_global_trace: gclass.info_global_trace,
                    info_gclass_trace: gclass.info_gclass_trace
                },
                0, 0, cx, cy,           // x,y,width,height
                "trace_levels_info",    // style
                false                   // relative
            );
            graph.insertEdge(
                layer,                      // parent
                null,                       // id
                '',                         // value
                self.config.node_gclass,    // source
                info_trace_levels_info_node,     // target
                null                        // style
            );

            var info_gclass_trace_node = graph.insertVertex(
                layer,                  // parent
                "GClass Trace Levels",     // id
                gclass.info_gclass_trace,
                0, 0, cx, cy,           // x,y,width,height
                "trace_levels_info",    // style
                false                   // relative
            );
            graph.insertEdge(
                layer,                      // parent
                null,                       // id
                '',                         // value
                info_trace_levels_info_node,// source
                info_gclass_trace_node,     // target
                null                        // style
            );

            var info_gclass_trace_node = graph.insertVertex(
                layer,                  // parent
                "Global Trace Levels",     // id
                gclass.info_global_trace,
                0, 0, cx, cy,           // x,y,width,height
                "trace_levels_info",    // style
                false                   // relative
            );
            graph.insertEdge(
                layer,                      // parent
                null,                       // id
                '',                         // value
                info_trace_levels_info_node,// source
                info_gclass_trace_node,     // target
                null                        // style
            );

        }

        /*-------------------------------*
         *      ACL
         *-------------------------------*/
        if(0) {
            var acl_node = graph.insertVertex(
                layer,       // parent
                "ACL",       // id
                gclass.ACL,  // value
                0, 0, cx, cy,// x,y,width,height
                "ACL",       // style
                false                   // relative
            );

            graph.insertEdge(
                layer,                      // parent
                null,                       // id
                '',                         // value
                self.config.node_gclass,    // source
                acl_node,        // target
                null                        // style
            );
        }

    }

    /********************************************
     *
     ********************************************/
    function formtable_factory(self, title, schema)
    {
        var gobj = self.yuno.gobj_create(
            get_unique_id(),
            Ui_formtable,
            {
                subscriber: self,  // HACK get all output events

                ui_properties: {
                    gravity: 3,
                    minWidth: 360,
                    minHeight: 500
                },

                topic_name: title,
                schema: schema,
                is_topic_schema: false,
                with_checkbox: false,
                with_textfilter: true,
                with_sort: true,
                with_top_title: true,
                with_footer: true,
                with_navigation_toolbar: true,
                update_mode_enabled: true,
                create_mode_enabled: false,
                delete_mode_enabled: false,

                panel_properties: {
                    with_panel_top_toolbar: true,
                    with_panel_title: "'" + self.config.gclass.id + "' " + title,
                    with_panel_hidden_btn: true,
                    with_panel_fullscreen_btn: true,
                    with_panel_resize_btn: true
                },
                window_properties: {
                    without_window_pin_btn: true,
                    without_window_fullscreen_btn: false,
                    without_window_hidden_btn: false
                },
                is_pinhold_window: true,
                window_title: "'" + self.config.gclass.id + "' " + title,
                window_image: "",
                width: 1000,
                height: 600
            },
            __yuno__.__pinhold__
        );
        return gobj;
    }

    /********************************************
     *
     ********************************************/
    function show_formtable_attrs(self, kw)
    {
        var gobj = formtable_factory(self, "GClass Attributes", attrs_cols);
        gobj.gobj_send_event(
            "EV_LOAD_DATA",
            kw,
            self
        );

        return 0;
    }

    /********************************************
     *
     ********************************************/
    function show_formtable_commands(self, kw)
    {
        var gobj = formtable_factory(self, "GClass Commands", commands_cols);
        gobj.gobj_send_event(
            "EV_LOAD_DATA",
            kw,
            self
        );

        return 0;
    }

    /********************************************
     *
     ********************************************/
    function show_formtable_input_events(self, kw)
    {
        var gobj = formtable_factory(self, "Input Events", input_events_cols);
        gobj.gobj_send_event(
            "EV_LOAD_DATA",
            kw,
            self
        );

        return 0;
    }

    /********************************************
     *
     ********************************************/
    function show_formtable_output_events(self, kw)
    {
        var gobj = formtable_factory(self, "Output Events", output_events_cols);
        gobj.gobj_send_event(
            "EV_LOAD_DATA",
            kw,
            self
        );

        return 0;
    }

    /********************************************
     *
     ********************************************/
    function show_formtable_states(self, kw)
    {
        var data = [];
        for(var key in kw) {
            data.push({id: key});
        }

        var gobj = formtable_factory(self, "States", states_cols);
        gobj.gobj_send_event(
            "EV_LOAD_DATA",
            data,
            self
        );

        return 0;
    }

    /********************************************
     *
     ********************************************/
    function show_formtable_state(self, kw)
    {
        var data = [];
        for(var i=0; i<kw.length; i++) {
            data.push({id: kw[i][0], action:kw[i][1], next_state:kw[i][2]});
        }

        var gobj = formtable_factory(self, "States", state_cols);
        gobj.gobj_send_event(
            "EV_LOAD_DATA",
            data,
            self
        );

        return 0;
    }

    /********************************************
     *
     ********************************************/
    function show_formtable_gclass_methods(self, kw)
    {
        var data = [];
        for(var i=0; i<kw.length; i++) {
            data.push({id: kw[i]});
        }

        var gobj = formtable_factory(self, "GClass Methods", gclass_methods_cols);
        gobj.gobj_send_event(
            "EV_LOAD_DATA",
            data,
            self
        );

        return 0;
    }

    /********************************************
     *
     ********************************************/
    function show_formtable_trace_level_info(self, kw)
    {
        var data = [];

        data.push(
            {
                id: "GCLASS LEVELS",
                description: ""
            });
        var dict = kw.info_gclass_trace;
        for(var key in dict) {
            var value = dict[key];
            data.push(
                {
                    id: key,
                    description: value
                });
        }
        data.push(
            {
                id: "GLOBAL LEVELS",
                description: ""
            });
        var dict = kw.info_global_trace;
        for(var key in dict) {
            var value = dict[key];
            data.push(
                {
                    id: key,
                    description: value
                });
        }

        var gobj = formtable_factory(self, "Trace Level Info", trace_level_info_cols);
        gobj.gobj_send_event(
            "EV_LOAD_DATA",
            data,
            self
        );

        return 0;
    }

    /********************************************
     *
     ********************************************/
    function show_formtable_gclass_trace_levels(self, kw)
    {
        var data = [];

        var dict = kw;
        for(var key in dict) {
            var value = dict[key];
            data.push(
                {
                    id: key,
                    description: value
                });
        }

        var gobj = formtable_factory(self, "Global Trace Levels", trace_level_info_cols);
        gobj.gobj_send_event(
            "EV_LOAD_DATA",
            data,
            self
        );

        return 0;
    }

    /********************************************
     *
     ********************************************/
    function show_formtable_global_trace_levels(self, kw)
    {
        var data = [];

        var dict = kw;
        for(var key in dict) {
            var value = dict[key];
            data.push(
                {
                    id: key,
                    description: value
                });
        }

        var gobj = formtable_factory(self, "Global Trace Levels", trace_level_info_cols);
        gobj.gobj_send_event(
            "EV_LOAD_DATA",
            data,
            self
        );

        return 0;
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

        self.config.gclass = data;

        var graph = self.config._mxgraph;
        var layer = get_layer(self, layer);
        var model = self.config._mxgraph.getModel();
        model.beginUpdate();
        try {
            show_view1(self, graph, layer, data);
            graph.view.setTranslate(graph.border, graph.border);
            execute_layout(self);

        } catch (e) {
            log_error(e);
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
        if(idx < 0) {
            return -1;
        }
        var visible = self.parent.config.views_opened?
            self.parent.config.views_opened[self.name]:true;
        self.config.$container_parent.removeView(self.config.$ui);
        rebuild(self);
        self.config.$container_parent.addView(self.config.$ui, idx);
        if(visible) {
            self.config.$ui.show();
        } else {
            self.config.$ui.hide();
        }

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
     *  Refresh, order from container
     *  provocado por entry/exit de fullscreen
     *  o por redimensionamiento del panel, propio o de hermanos
     *
     *  Tasks:
     *      - Centra node_gclass
     *
     *************************************************************/
    function ac_refresh(self, event, kw, src)
    {
        if(1 || !self.config.node_gclass) {
            return 0; // No centres nada
        }

        var margin = 10;
        var graph = self.config._mxgraph;
        var win_cx = self.config.$ui.$width;
        var win_cy = self.config.$ui.$height;
        var geo = graph.getCellGeometry(self.config.node_gclass);
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

        graph.getModel().beginUpdate();
        try {
            var cells = [self.config.node_gclass];
            graph.moveCells(cells, -dx, -dy);
            graph.refresh();
        } catch (e) {
            log_error(e);
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
    function ac_mx_click(self, event, kw, src)
    {
        switch(kw.id) {
            case "Attributes":
                show_formtable_attrs(self, kw.value);
                break;
            case "Commands":
                show_formtable_commands(self, kw.value);
                break;
            case "GClass Methods":
                show_formtable_gclass_methods(self, kw.value);
                break;
            case "Input Events":
                show_formtable_input_events(self, kw.value);
                break;
            case "Output Events":
                show_formtable_output_events(self, kw.value);
                break;
            case "States":
                show_formtable_states(self, kw.value);
                break;
            case "Trace Level Info":
                show_formtable_trace_level_info(self, kw.value);
                break;

            case "GClass Trace Levels":
                show_formtable_gclass_trace_levels(self, kw.value);
                break;

            case "Global Trace Levels":
                show_formtable_global_trace_levels(self, kw.value);
                break;

            case "State":
            default:
                show_formtable_state(self, kw.value);
                break;
        }
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
            "MX_" + mxEvent.CLICK
        ],
        "state_list": [
            "ST_IDLE"
        ],
        "machine": {
            "ST_IDLE":
            [
                ["EV_LOAD_DATA",                ac_load_data,               undefined],
                ["EV_CLEAR_DATA",               ac_clear_data,              undefined],
                ["MX_" + mxEvent.CLICK,         ac_mx_click,                undefined],
                ["EV_REBUILD_PANEL",            ac_rebuild_panel,           undefined],
                ["EV_SELECT",                   ac_select,                  undefined],
                ["EV_REFRESH",                  ac_refresh,                 undefined]
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
