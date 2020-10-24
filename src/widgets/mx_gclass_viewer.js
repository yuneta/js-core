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
        panel_properties: {},   // creator can set "Container Panel" properties
        ui_properties: null,

        $ui: null,

        gclass: null,
        mxnode_gclass: null,
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

        __writable_attrs__: [
            "layout_selected"
        ]
    };

    /************************************************************
     *   Schema
     ************************************************************/
    var attrs_cols = [
        {
            "id": "id",
            "header": "Id",
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
            "rounded=1;whiteSpace=wrap;html=1;shadow=1;fillColor=#dae8fc;strokeColor=#6c8ebf;align=left;labelPosition=center;verticalLabelPosition=middle;verticalAlign=top;horizontal=1;spacingLeft=10;spacingTop=10;glass=0;sketch=0;gradientColor=#ffffff;"
        );
        create_graph_style(
            graph,
            "attrs",
            "ellipse;whiteSpace=wrap;html=1;aspect=fixed;fillColor=#ffe6cc;strokeColor=#d79b00;shadow=1;"
        );


        // Handles clicks on cells
//         graph.addListener(mxEvent.CLICK, function(sender, evt) {
//             var cell = evt.getProperty('cell');
//             if (cell != null) {
//                 var id = evt.properties.cell.id;
//                 if(cell.isVertex()) {
//                     self.gobj_publish_event("EV_MX_JSON_ITEM_CLICKED", {id:id});
//                 }
//             }
//         });

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
                    case "attrs":
                        return 'pointer';
                    default:
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
        var win_cx = self.config.$ui.$width;
        var win_cy = self.config.$ui.$height;
        var sep = 60;

        var cx_ctr = 300;    // Container
        var cy_ctr = 600;

        var cx_box = 400;    // Content Box
        var cy_box = 200;

        /*-------------------------------*
         *      GClass container
         *-------------------------------*/
        var class_attrs = {
            "id": gclass.id,
            "base": gclass.base,
            "priv_size": gclass.priv_size,
            "instances": gclass.instances,
            "gcflag": gclass.gcflag,
            "gclass_trace_level": gclass.gclass_trace_level,
            "gclass_no_trace_level": gclass.gclass_no_trace_level
        }
        self.config.mxnode_gclass = graph.insertVertex(
            layer,          // parent
            gclass.id,      // id
            class_attrs,    // value
            0, 0, 250, 200, // x,y,width,height
            "gclass_container", // style
            false           // relative
        );

        /*-------------------------------*
         *      Obj attrs
         *-------------------------------*/
//             "attrs": [
//                 {
//                     "id": "persistent_channels",
//                     "type": "signed32",
//                     "default_value": 0,
//                     "description": "Set True to do channels persistent (in sqlite database).",
//                     "flag": "SDF_RD"
//                 },
//                 ...
//             ],

        /*
         *  Obj attrs Button, inside of container
         */
        var button_obj_attrs = graph.insertVertex(
            layer,                  // parent
            "Attrs",                // id
            gclass.attrs,           // value
            0, 0, 100, 100,         // x,y,width,height
            "attrs",                // style
            false                   // relative
        );

        graph.insertEdge(
            layer,          // parent
            null,                       // id
            '',                         // value
            self.config.mxnode_gclass,  // source
            button_obj_attrs,           // target
            null                        // style
        );

//         /*-------------------------------*
//          *      Commands
//          *-------------------------------*/
// //             "commands": [
// //                 {
// //                     "id": "help",
// //                     "alias": [
// //                         "h",
// //                         "?"
// //                     ],
// //                     "description": "Available commands or help about a command.",
// //                     "usage": "help  [cmd='?'] [level='?']",
// //                     "parameters": [
// //                         {
// //                             "id": "cmd",
// //                             "type": "string",
// //                             "default_value": "",
// //                             "description": "command about you want help.",
// //                             "flag": ""
// //                         },
// //                         ...
// //                     ]
// //                 },
// //             ],
//         var commands = gclass.commands;
//
//         /*
//          *  Commands Button, inside of container
//          */
//         var button_commands = graph.insertVertex(
//             self.config.mxnode_gclass,              // parent
//             "Commands Button",                      // id
//             "Commands",                             // value
//             20, 20+60*2, cx_ctr - cx_ctr/8, 50,     // x,y,width,height
//             "shape=rectangle;"+                     // style
//             "fillColor=white;"+
//             "fontColor=black;strokeColor=black;"+
//             "foldable=1;resizable=0;",
//             false
//         );                                          // relative
//
//         /*
//          *  Commands Content
//          */
//         var content_commands = graph.insertVertex(
//             button_commands,                        // parent
//             "Commands Content",                     // id
//             commands,                               // value
//             cx_ctr+sep, -20, cx_box*2, cy_box,      // x,y,width,height
//             "shape=rectangle;"+                     // style
//             "fillColor=white;"+
//             "rounded=0;json=1;resizable=1;foldable=1;",
//             false
//         );                                          // relative
//
//         /*
//          *  Link between "Commands Button" y "Commands Content"
//          */
//         graph.insertEdge(
//             button_commands,            // parent
//             null,                       // id
//             '',                         // value
//             button_commands,            // source
//             content_commands,           // target
//             null                        // style
//         );
//
//         /*-------------------------------*
//          *      Global Methods
//          *-------------------------------*/
// //             "global_methods": [
// //                 "mt_create",
// //                 ...
// //             ],
//         var global_methods = gclass.global_methods;
//
//         /*
//          *  Global Methods Button, inside of container
//          */
//         var button_global_methods = graph.insertVertex(
//             self.config.mxnode_gclass,              // parent
//             "Global Methods Button",                // id
//             "Global Methods",                       // value
//             20, 20+60*3, cx_ctr - cx_ctr/8, 50,     // x,y,width,height
//             "shape=rectangle;"+                     // style
//             "fillColor=white;"+
//             "fontColor=black;strokeColor=black;"+
//             "foldable=1;resizable=0;",
//             false
//         );                                          // relative
//
//         /*
//          *  Global Methods Content
//          */
//         var content_global_methods = graph.insertVertex(
//             button_global_methods,                  // parent
//             "Global Methods Content",               // id
//             global_methods,                         // value
//             cx_ctr+sep, 140, cx_box, cy_box,        // x,y,width,height
//             "shape=rectangle;"+                     // style
//             "fillColor=white;"+
//             "rounded=0;json=1;resizable=1;foldable=1;",
//             false
//         );                                          // relative
//
//         /*
//          *  Link between "Global Methods Button" y "Global Methods Content"
//          */
//         graph.insertEdge(
//             button_global_methods,      // parent
//             null,                       // id
//             '',                         // value
//             button_global_methods,      // source
//             content_global_methods,     // target
//             null                        // style
//         );
//
//         /*-------------------------------*
//          *      Local Methods
//          *-------------------------------*/
// //             "local_methods": [],
//         var local_methods = gclass.local_methods;
//
//         /*
//          *  Local Methods Button, inside of container
//          */
//         var button_local_methods = graph.insertVertex(
//             self.config.mxnode_gclass,              // parent
//             "Local Methods Button",                 // id
//             "Local Methods",                        // value
//             20, 20+60*4, cx_ctr - cx_ctr/8, 50,     // x,y,width,height
//             "shape=rectangle;"+                     // style
//             "fillColor=white;"+
//             "fontColor=black;strokeColor=black;"+
//             "foldable=1;resizable=0;",
//             false
//         );                                          // relative
//
//         /*-------------------------------*
//          *      FSM
//          *-------------------------------*/
// //             "FSM": {
// //                 "input_events": [
// //                     {
// //                         "event": "EV_IEV_MESSAGE",
// //                         "permission": "",
// //                         "description": ""
// //                     },
// //                     ...
// //                 ],
// //                 "output_events": [
// //                     {
// //                         "event": "EV_ON_MESSAGE",
// //                         "permission": "",
// //                         "description": "Message received"
// //                     },
// //                     ...
// //                 ],
// //                 "states": {
// //                     "ST_IDLE": [
// //                         [
// //                             "EV_ON_MESSAGE",
// //                             "ac_action",
// //                             0
// //                         ],
// //                         ...
// //                     ],
// //                     ...
// //                 }
// //             },
//         var fsm = gclass.FSM;
//
//         /*
//          *  FSM Button, inside of container
//          */
//         var button_fsm = graph.insertVertex(
//             self.config.mxnode_gclass,              // parent
//             "FSM Button",                           // id
//             "FSM",                                  // value
//             20, 20+60*5, cx_ctr - cx_ctr/8, 50,     // x,y,width,height
//             "shape=rectangle;"+                     // style
//             "fillColor=white;"+
//             "fontColor=black;strokeColor=black;"+
//             "foldable=1;resizable=0;",
//             false
//         );                                          // relative
//
//         /*
//          *  FSM Content
//          */
//         var content_fsm = graph.insertVertex(
//             button_fsm,                             // parent
//             "FSM Content",                          // id
//             fsm,                                    // value
//             cx_ctr+sep+cx_box+20, 20, cx_box*2, cy_box,   // x,y,width,height
//             "shape=rectangle;"+                     // style
//             "fillColor=white;"+
//             "rounded=0;json=1;resizable=1;foldable=1;",
//             false
//         );                                          // relative
//
//         /*
//          *  Link between "FSM Button" y "FSM Content"
//          */
//         graph.insertEdge(
//             button_fsm,                 // parent
//             null,                       // id
//             '',                         // value
//             button_fsm,                 // source
//             content_fsm,                // target
//             null                        // style
//         );
//
//         /*-------------------------------*
//          *      ACL
//          *-------------------------------*/
// //             "ACL": [],
//         var acl = gclass.ACL;
//
//         /*
//          *  ACL Button, inside of container
//          */
//         var button_acl = graph.insertVertex(
//             self.config.mxnode_gclass,              // parent
//             "ACL Button",                           // id
//             "ACL",                                  // value
//             20, 20+60*6, cx_ctr - cx_ctr/8, 50,     // x,y,width,height
//             "shape=rectangle;"+                     // style
//             "fillColor=white;"+
//             "fontColor=black;strokeColor=black;"+
//             "foldable=1;resizable=0;",
//             false
//         );                                          // relative
//
//         /*-------------------------------*
//          *      Info Global traces
//          *-------------------------------*/
// //             "info_global_trace": {
// //                 "machine": "Trace machine",
// //                 ...
// //             },
//         var info_global_trace = gclass.info_global_trace;
//
//         /*
//          *  Info Global Trace Button, inside of container
//          */
//         var button_info_global_trace = graph.insertVertex(
//             self.config.mxnode_gclass,              // parent
//             "Info Global Trace Button",             // id
//             "Info Global Trace",                    // value
//             20, 20+60*7, cx_ctr - cx_ctr/8, 50,     // x,y,width,height
//             "shape=rectangle;"+                     // style
//             "fillColor=white;"+
//             "fontColor=black;strokeColor=black;"+
//             "foldable=1;resizable=0;",
//             false
//         );                                          // relative
//
//         /*
//          *  Info Global Trace Content
//          */
//         var content_info_global_trace = graph.insertVertex(
//             button_info_global_trace,               // parent
//             "Info Global Trace Content",            // id
//             info_global_trace,                      // value
//             cx_ctr+sep, 120, cx_box*2, cy_box,      // x,y,width,height
//             "shape=rectangle;"+                     // style
//             "fillColor=white;"+
//             "rounded=0;json=1;resizable=1;foldable=1;",
//             false
//         );                                          // relative
//
//         /*
//          *  Link between "Info Global Trace Button" y "Info Global Trace Content"
//          */
//         graph.insertEdge(
//             button_info_global_trace,   // parent
//             null,                       // id
//             '',                         // value
//             button_info_global_trace,   // source
//             content_info_global_trace,  // target
//             null                        // style
//         );
//
//         /*-------------------------------*
//          *      Info Class traces
//          *-------------------------------*/
// //             "info_gclass_trace": {
// //                 "connection": "Trace connections of iogates",
// //                 ...
// //             },
//         var info_gclass_trace = gclass.info_gclass_trace;
//
//         /*
//          *  Info GClass Trace Button, inside of container
//          */
//         var button_info_gclass_trace = graph.insertVertex(
//             self.config.mxnode_gclass,              // parent
//             "Info GClass Trace Button",             // id
//             "Info GClass Trace",                    // value
//             20, 20+60*8, cx_ctr - cx_ctr/8, 50,     // x,y,width,height
//             "shape=rectangle;"+                     // style
//             "fillColor=white;"+
//             "fontColor=black;strokeColor=black;"+
//             "foldable=1;resizable=0;",
//             false
//         );                                          // relative
//
//         /*
//          *  Info GClass Trace Content
//          */
//         var content_info_gclass_trace = graph.insertVertex(
//             button_info_gclass_trace,               // parent
//             "Info GClass Trace Content",            // id
//             info_gclass_trace,                      // value
//             cx_ctr+sep, 280, cx_box*2, cy_box,      // x,y,width,height
//             "shape=rectangle;"+                     // style
//             "fillColor=white;"+
//             "rounded=0;json=1;resizable=1;foldable=1;",
//             false
//         );                                          // relative
//
//         /*
//          *  Link between "Info GClass Trace Button" y "Info GClass Trace Content"
//          */
//         graph.insertEdge(
//             button_info_gclass_trace,   // parent
//             null,                       // id
//             '',                         // value
//             button_info_gclass_trace,   // source
//             content_info_gclass_trace,  // target
//             null                        // style
//         );

    }

    /********************************************
     *
     ********************************************/
    function show_formtable_attrs(self, kw)
    {
        var gobj = self.yuno.gobj_create(
            name,
            Ui_formtable,
            {
                subscriber: self,  // HACK get all output events

                ui_properties: {
                    gravity: 3,
                    minWidth: 360,
                    minHeight: 500
                },

                topic_name: kw.topic_name,
                schema: attrs_cols ,
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
                    with_panel_title: self.config.gclass.id + " Attrs",
                    with_panel_hidden_btn: true,
                    with_panel_fullscreen_btn: true,
                    with_panel_resize_btn: true
                },
                is_pinhold_window: true,
                window_title: self.config.gclass.id + " Attrs",
                window_image: "",
                width: 800,
                height: 600
            },
            __yuno__.__pinhold__
        );

        gobj.gobj_send_event(
            "EV_LOAD_DATA",
            kw,
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
     *      - Centra mxnode_gclass
     *
     *************************************************************/
    function ac_refresh(self, event, kw, src)
    {
        if(1 || !self.config.mxnode_gclass) {
            return 0; // No centres nada
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

        graph.getModel().beginUpdate();
        try {
            var cells = [self.config.mxnode_gclass];
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
            case "Attrs":
                show_formtable_attrs(self, kw.value);
                break;
            default:
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
