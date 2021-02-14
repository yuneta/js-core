/***********************************************************************
 *          ui_treedb_viewer.js
 *
 *          Mix "Container Panel" & "Pinhold Window"
 *
 *          Treedb Viewer Engine
 *
 *          Copyright (c) 2021 Niyamaka.
 *          All Rights Reserved.
 ***********************************************************************/
(function (exports) {
    'use strict';

    /********************************************
     *      Configuration (C attributes)
     ********************************************/
    var CONFIG = {
        //////////////// Common Attributes //////////////////
        is_pinhold_window: true,// CONF: Select default: window or container panel
        panel_properties: {},   // CONF: creator can set "Container Panel" properties
        window_properties: {},  // CONF: creator can set "Pinhold Window" properties
        ui_properties: null,    // CONF: creator can set webix properties
        window_image: "",       // CONF: Used by pinhold_window_top_toolbar "Pinhold Window"
        window_title: "",       // CONF: Used by pinhold_window_top_toolbar "Pinhold Window"
        left: 0,                // CONF: Used by pinhold_window_top_toolbar "Pinhold Window"
        top: 0,                 // CONF: Used by pinhold_window_top_toolbar "Pinhold Window"
        width: 600,             // CONF: Used by pinhold_window_top_toolbar "Pinhold Window"
        height: 500,            // CONF: Used by pinhold_window_top_toolbar "Pinhold Window"

        $ui: null,
        subscriber: null,       // Subscriber of published events, by default the parent.
        $ui_fullscreen: null,   // Which part of window will be fullscreened "Pinhold Window"
        resizing_event_id: null,// Used for automatic_resizing by window
        pinpushed: false,       // Used by pinhold_window_top_toolbar "Pinhold Window"

        //////////////// Particular Attributes //////////////////
        /*
         *  Funciones que debe suministrar el padre
         */
        info_wait: function() {},
        info_no_wait: function() {},

        iev: null,          // IEvent to yuneta node agent

        dst_role: null,
        dst_service: null,
        dst_yuno: null,
        url: null,

        locked: true,
        image_run: null,

        graph_styles: {
            node:
            "ellipse;html=1;strokeColor=#6c8ebf;fillColor=#dae8fc;whiteSpace=wrap;shadow=0;spacingLeft=10;spacingTop=5;fontSize=12;verticalAlign=top;spacingTop=20;opacity=60;"
        },

        layout_options: [
            {
                id: "herarchical_layout",
                value: "Herarchical Layout",
                layout: function(layout_option, graph) {
                    var layout = new mxHierarchicalLayout(graph);
                    return layout;
                }
            }
        ],

        top_overlay_icon_size: 24,
        bottom_overlay_icon_size: 16,
        image_running: null,
        image_playing: null,
        image_service: null,
        image_unique: null,
        image_disabled: null,

        vertex_cx: 140,
        vertex_cy: 90,
        vertex_sep: 30,

        layers: [
            {
                id: "__mx_default_layer__"
            }
        ],
        _mxgraph: null,

        layout_selected: "tree_layout",

        //////////////////////////////////
        __writable_attrs__: [
            ////// Common /////
            "window_title",
            "window_image",
            "left",
            "top",
            "width",
            "height",

            ////// Particular /////
            "layout_selected"
        ]
    };




            /***************************
             *      Local Methods
             ***************************/




    /************************************************************
     *
     ************************************************************/
    function load_icons(self)
    {
        /*
         *  Load control button images
         */
        self.config.image_run = new mxImage(
            '/static/app/images/yuneta/instance_running.svg',
            self.config.top_overlay_icon_size, self.config.top_overlay_icon_size
        );
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
                    hidden: true,
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
                    hidden: true,
                    icon: "far fa-question",
                    css: "webix_transparent icon_toolbar_16",
                    maxWidth: 120,
                    label: t("help"),
                    click: function() {
                        //if($$(build_name(self, "help_window")).isVisible()) {
                        //    $$(build_name(self, "help_window")).hide();
                        //} else {
                        //    $$(build_name(self, "help_window")).show();
                        //}
                    }
                }
            ]
        };

        /*-----------------------*
         *      Bottom header
         *-----------------------*/
        var bottom_header = {
            view:"toolbar",
            height: 30,
            paddingX: 10,
            cols:[
                {   // Connex
                    view: "label",
                    label: self.name,
                    id: build_name(self, "connex")
                }
            ]
        };

        var row1 = {
            view: "mxgraph",
            id: build_name(self, "mxgraph"),
            gobj: self
        };

        /*----------------------------------------------------*
         *                      UI
         *  Common UI of Pinhold Window and Container Panel
         *----------------------------------------------------*/
        if(self.config.is_pinhold_window) {
            /*-------------------------*
             *      Pinhold Window
             *-------------------------*/
            self.config.$ui = webix.ui({
                view: "window",
                id: self.gobj_escaped_short_name(), // HACK can be a global gobj, use gclass_name+name
                top: self.config.top,
                left: self.config.left,
                width: self.config.width,
                height: self.config.height,
                hidden: self.config.pinpushed?true:false,
                move: true,
                resize: true,
                position: (self.config.left==0 && self.config.top==0)?"center":null,
                head: get_window_top_toolbar(self),
                body: {
                    id: build_name(self, "fullscreen"),
                    ////////////////// REPEATED webix code /////////////////
                    // WARNING Please, put your code outside, here only simple variable names
                    rows: [
                        row1,
                        bottom_toolbar,
                        bottom_header
                    ]
                    ////////////////// webix code /////////////////
                },
                on: {
                    "onViewResize": function() {
                        self.config.left = this.gobj.config.$ui.config.left;
                        self.config.top = this.gobj.config.$ui.config.top;
                        self.config.width = this.gobj.config.$ui.config.width;
                        self.config.height = this.gobj.config.$ui.config.height;
                        self.gobj_save_persistent_attrs();
                    },
                    "onViewMoveEnd": function() {
                        self.config.left = this.gobj.config.$ui.config.left;
                        self.config.top = this.gobj.config.$ui.config.top;
                        self.config.width = this.gobj.config.$ui.config.width;
                        self.config.height = this.gobj.config.$ui.config.height;
                        self.gobj_save_persistent_attrs();
                    }
                }
            });
            self.config.$ui_fullscreen = $$(build_name(self, "fullscreen"));

        } else {
            /*-------------------------*
             *      Container Panel
             *-------------------------*/
            self.config.$ui = webix.ui({
                id: self.gobj_name(),
                ////////////////// REPEATED webix code /////////////////
                // WARNING Please, put your code outside, here only simple variable names
                rows: [
                    get_container_panel_top_toolbar(self),
                    row1,
                    bottom_toolbar,
                    bottom_header
                ]
                ////////////////// webix code /////////////////
            });
        }
        self.config.$ui.gobj = self;

        if(self.config.ui_properties) {
            self.config.$ui.define(self.config.ui_properties);
            if(self.config.$ui.refresh) {
                self.config.$ui.refresh();
            }
        }

        /*----------------------------------------------*
         *  Inform of panel viewed to "Container Panel"
         *----------------------------------------------*/
        if(!self.config.is_pinhold_window) {
            self.config.$ui.attachEvent("onViewShow", function() {
                self.gobj_send_event("EV_ON_VIEW_SHOW", self, self);
            });
        }

        /*----------------------------------------------*
         *  Set fullscreen ui in "Pinhold Window"
         *----------------------------------------------*/
        if(self.config.is_pinhold_window) {
            self.config.$ui_fullscreen = $$(build_name(self, "fullscreen"));
            automatic_resizing_cb(); // Adapt window size to device
        }

        /*---------------------------------------*
         *   Automatic Resizing in "Pinhold Window"
         *---------------------------------------*/
        function automatic_resizing(gadget, window_width, window_height)
        {
            var $gadget = $$(gadget);
            var new_width = -1;
            var new_height = -1;
            var new_x = $gadget.config.left;
            var new_y = $gadget.config.top;

            if($gadget.$width + new_x > window_width) {
                new_width = window_width;
                new_x = 0;
            }
            if($gadget.$height + new_y > window_height) {
                new_height = window_height;
                new_y = 0;
            }

            if(new_width < 0 && new_height < 0) {
                return;
            }

            $gadget.config.width = new_width<0? $gadget.$width:new_width,
            $gadget.config.height = new_height<0? $gadget.$height:new_height;
            $gadget.resize();
            $gadget.setPosition(new_x, new_y);
        }

        function automatic_resizing_cb()
        {
            var window_width = window.innerWidth-8;
            var window_height = window.innerHeight-8;
            automatic_resizing(self.gobj_escaped_short_name(), window_width, window_height);
        }

        if(self.config.is_pinhold_window) {
            if(self.config.resizing_event_id) {
                webix.eventRemove(self.config.resizing_event_id);
                self.config.resizing_event_id = 0;
            }
            self.config.resizing_event_id = webix.event(window, "resize", automatic_resizing_cb);
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
        var group = get_layer(self);

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

        if(cur_layout) {
            graph.getModel().beginUpdate();
            try {
                cur_layout.exe.execute(group);
            } catch (e) {
                log_error(e);
            } finally {
                graph.getModel().endUpdate();
            }
        }

        graph.view.setTranslate(graph.border, graph.border);

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

    /********************************************
     *  HACK una cell está compuesta gráficamente de:
     *      - Shape de la celda
     *      - Label     (Contenido a pintar en la celda)
     *      - Overlays  (Cells extras)
     *      - Control   (folding icon) + deleteControl?
     ********************************************/
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
        graph.keepEdgesInBackground = true;

        // Enables automatic sizing for vertices after editing
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

        // Handles clicks on cells
        graph.addListener(mxEvent.CLICK, function(sender, evt) {
            var cell = evt.getProperty('cell');
            if (cell != null) {
                var record = evt.properties.cell.value;
                if(cell.isVertex()) {
                    self.gobj_send_event("EV_MX_VERTEX_CLICKED", record, self);
                } else {
                    self.gobj_send_event("EV_MX_EDGE_CLICKED", record, self);
                }
            }
        });

        /*
         *  Set stylesheet options
         */
        configureStylesheet(graph);

        /*
         *  Create own styles
         */
        for(var style_name in self.config.graph_styles) {
            var style = self.config.graph_styles[style_name];
            create_graph_style(
                graph,
                style_name,
                style
            );
        }
        /*
         *  Own getLabel
         */
        graph.getLabel = function(cell) {
            if (this.getModel().isVertex(cell)) {
                return br(cell.value);
            }
            return "";
        };

        /*
         *  Own getTooltip
         */
        graph.getTooltipForCell = function(cell) {
            var tip = null;
            if (cell != null && cell.getTooltip != null) {
                tip = cell.getTooltip();
            } else {
                if(cell.value.shortname) {
                    return br(cell.value.shortname);
                }
            }
            return tip;
        };

        graph.getCursorForCell = function(cell) {
            if(this.model.isEdge(cell)) {
                return 'default';
            } else {
                return 'default';
            }
        };

        // Defines the condition for showing the folding icon
        graph.isCellFoldable = function(cell, collapse)
        {
            return this.model.getOutgoingEdges(cell).length > 0;
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
            } catch (e) {
                log_error(e);
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
            try {
                var cells_removed = evt.getProperty('added');
                if(cells_removed) {
                    for (var i = 0; i < cells_removed.length; i++) {
                        var cell = cells_removed[i];
                        graph.removeCellOverlays(cell); // Delete all previous overlays
                        add_state_overlays(self, graph, cell);
                    }
                }
            } catch (e) {
                info_user_error(e);
            }

            try {
                var cells_added = evt.getProperty('removed');
                if(cells_added) {
                    for (var i = 0; i < cells_added.length; i++) {
                        var cell = cells_added[i];
                        graph.removeCellOverlays(cell); // Delete all previous overlays
                        if(cell.isVertex()) {
                            add_state_overlays(self, graph, cell);
                        }
                    }
                }
            } catch (e) {
                info_user_error(e);
            }
        });

    }

    /************************************************************
     *
     ************************************************************/
    function br(short_name)
    {
        if(!short_name) {
            return "";
        }
        var n = short_name.split('^');
        return n[0]  + "^<br/><b>" + n[1] + "</b><br/>";
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

    /********************************************
     *
     ********************************************/
    function configureStylesheet(graph) {
        var style = graph.getStylesheet().getDefaultVertexStyle();
        style[mxConstants.STYLE_SHAPE] = mxConstants.SHAPE_RECTANGLE;
        style[mxConstants.STYLE_PERIMETER] = mxPerimeter.RectanglePerimeter;
        style[mxConstants.STYLE_ALIGN] = mxConstants.ALIGN_CENTER;
        style[mxConstants.STYLE_VERTICAL_ALIGN] = mxConstants.ALIGN_MIDDLE;
        style[mxConstants.STYLE_FONTCOLOR] = '#000000';

        style[mxConstants.STYLE_ROUNDED] = true;
        style[mxConstants.STYLE_OPACITY] = '80';
        style[mxConstants.STYLE_FONTSIZE] = '12';
        style[mxConstants.STYLE_FONTSTYLE] = 0;
        style[mxConstants.STYLE_IMAGE_WIDTH] = '48';
        style[mxConstants.STYLE_IMAGE_HEIGHT] = '48';
        style[mxConstants.STYLE_SHADOW] = false;

        style = graph.getStylesheet().getDefaultEdgeStyle();

        style[mxConstants.STYLE_EDGE] = mxEdgeStyle.TopToBottom;
        style[mxConstants.STYLE_STROKEWIDTH] = '2';
        style[mxConstants.STYLE_STROKECOLOR] = 'black';

        style[mxConstants.STYLE_ROUNDED] = true;
        style[mxConstants.STYLE_CURVED] = "1";
    };

    /************************************************************
     *
     ************************************************************/
    function add_state_overlays(self, graph, cell)
    {
        var model = graph.getModel();
        model.beginUpdate();
        try {
            var offsy = self.config.top_overlay_icon_size/1.5;
            var offsx = self.config.top_overlay_icon_size + 5;

            if(cell.isVertex()) {
                /*--------------------------------------*
                 *          Topics
                 *--------------------------------------*/

                /*--------------------------*
                 *  Play button
                 *--------------------------*/
                var overlay_instance = new mxCellOverlay(
                    self.config.image_run,
                    "Run Node", // tooltip
                    mxConstants.ALIGN_CENTER, // horizontal align ALIGN_LEFT,ALIGN_CENTER,ALIGN_RIGH
                    mxConstants.ALIGN_MIDDLE,  // vertical align  ALIGN_TOP,ALIGN_MIDDLE,ALIGN_BOTTOM
                    new mxPoint(0*offsx, 2*offsy), // offset
                    "pointer" // cursor
                );
                graph.addCellOverlay(cell, overlay_instance);
                overlay_instance.addListener(mxEvent.CLICK, function(sender, evt2) {
                    self.gobj_send_event(
                        "EV_RUN_NODE",
                        {
                            cell: cell
                        },
                        self
                    );
                });

            } else if(cell.isEdge()) {
                /*--------------------------------------*
                 *          Links
                 *--------------------------------------*/
            }

        } catch (e) {
            log_error(e);
        } finally {
            model.endUpdate();
        }
    }

    /********************************************
     *  WARNING Don't use this function,
     *  use start_iev() !!
     ********************************************/
    function _do_connect(self)
    {
        var iev = self.yuno.gobj_create(
            build_name(self, self.config.url),
            IEvent,
            {
                timeout_retry: 30,
                remote_yuno_name: self.config.dst_yuno,
                remote_yuno_role: self.config.dst_role,
                remote_yuno_service: self.config.dst_service,
                jwt: __yuno__.__login__.config.jwt,
                urls: [self.config.url]
            },
            self
        );

        /*
         *  Subscribe to IEvent'null, to receive internal events of IEvent
         *      EV_ON_OPEN
         *      EV_ON_CLOSE
         *      EV_IDENTITY_CARD_REFUSED
         */
        iev.gobj_subscribe_event(
            null,
            {
            },
            self
        );

        /*
         *  Start
         */
        iev.gobj_start_tree();

        return iev;
    }

    /********************************************
     *
     ********************************************/
    function start_iev(self)
    {
        var iev = self.config.iev;
        if(iev) {
            iev.gobj_stop();
            __yuno__.gobj_destroy(iev);
        }
        self.config.iev = _do_connect(self);
    }

    /********************************************
     *
     ********************************************/
    function stop_iev(self)
    {
        var iev = self.config.iev;
        if(iev) {
            delete self.config.iev;
            __yuno__.gobj_destroy(iev);
        }
    }

    /********************************************
     *
     ********************************************/
    function send_command_to_remote_yuno(self, command, service, kw)
    {
        var kw_req = {
            service: service
        };
        if(kw) {
            __extend_dict__(kw_req, kw);
        }
        msg_write_MIA_key(kw_req, "__command__", command);

        self.config.info_wait();

        var ret = self.config.iev.gobj_command(
            command,
            kw_req,
            self
        );
        if(ret) {
            log_error(ret);
        }
    }

    /********************************************
     *
     ********************************************/
    function refresh_gobj_tree(self)
    {
        send_command_to_remote_yuno(
            self,
            "services",
            "__root__",
            {
                gclass_name: "Node"
            }
        );
    }

    /********************************************
     *
     ********************************************/
    function process_services(self, data)
    {
        var graph = self.config._mxgraph;
        var group = get_layer(self);
        var model = graph.getModel();

        model.beginUpdate();
        try {
            for(var i=0; i<data.length; i++) {
                var record = data[i];
                var child = graph.insertVertex(
                    group,          // parent
                    record.service, // id
                    record.gobj,    // value
                    0,              // x,y,width,height
                    0,
                    self.config.vertex_cx,
                    self.config.vertex_cy,
                    "node",         // style
                    false           // relative
                );

                add_state_overlays(self, graph, child);
            }
            execute_layout(self);

        } catch (e) {
            log_error(e);
        } finally {
            model.endUpdate();
        }
    }




            /***************************
             *      Actions
             ***************************/




    /********************************************
     *
     ********************************************/
    function ac_on_open(self, event, kw, src)
    {
        var $connex = $$(build_name(self, "connex"));
        webix.html.removeCss($connex.getNode(), "color_green");
        webix.html.removeCss($connex.getNode(), "color_red");
        webix.html.removeCss($connex.getNode(), "color_yellow");
        webix.html.addCss($connex.getNode(), "color_green");

        refresh_gobj_tree(self);

        return 0;
    }

    /********************************************
     *
     ********************************************/
    function ac_id_refused(self, event, kw, src)
    {
        var $connex = $$(build_name(self, "connex"));
        webix.html.removeCss($connex.getNode(), "color_green");
        webix.html.removeCss($connex.getNode(), "color_red");
        webix.html.removeCss($connex.getNode(), "color_yellow");
        webix.html.addCss($connex.getNode(), "color_red");

        return 0;
    }

    /********************************************
     *
     ********************************************/
    function ac_on_close(self, event, kw, src)
    {
        var $connex = $$(build_name(self, "connex"));
        webix.html.removeCss($connex.getNode(), "color_green");
        webix.html.removeCss($connex.getNode(), "color_red");
        webix.html.removeCss($connex.getNode(), "color_yellow");
        webix.html.addCss($connex.getNode(), "color_red");

        return 0;
    }

    /********************************************
     *  Remote response
     ********************************************/
    function ac_mt_command_answer(self, event, kw, src)
    {
        var webix_msg = kw;

        self.config.info_no_wait();

        try {
            var result = webix_msg.result;
            var comment = webix_msg.comment;
            var schema = webix_msg.schema;
            var data = webix_msg.data;
            var __md_iev__ = webix_msg.__md_iev__;
        } catch (e) {
            log_error(e);
            return;
        }
        if(result < 0) {
            info_user_error(comment);
            return;
        } else {
            if(comment) {
                // log_info(comment); No pintes
            }
        }

        switch(__md_iev__.__command__) {
            case "services":
                process_services(self, data);
                break;
            default:
                info_user_error("Command unknown: " + __md_iev__.__command__);
                break;
        }

        return 0;
    }

    /********************************************
     *
     ********************************************/
    function ac_mx_vertex_clicked(self, event, kw, src)
    {
        var id = kw.id;
        var value = kw.value;

        return 0;
    }

    /********************************************
     *  Message from Mx_nodes_tree
     ********************************************/
    function ac_run_node(self, event, kw, src)
    {
        var cell = kw.cell;
        var url = self.config.url; // Estos son datos of this connection
        var dst_role = self.config.dst_role;
        var dst_service = self.config.dst_service;
        var dst_yuno = self.config.dst_yuno;
        var viewer_engine = "Ui_treedb_graph";

        var gclass = gobj_find_gclass(viewer_engine);
        if(!gclass) {
            log_error("Viewer engine (gclass) not found: " + viewer_engine);
            return -1;
        }

        var name = viewer_engine + ">" + url + ">" + dst_role + ">" + dst_service;
        var gobj = __yuno__.gobj_find_unique_gobj(name);
        if(!gobj) {
            gobj = __yuno__.gobj_create_unique(
                name,
                gclass,
                {
                    is_pinhold_window: true,
                    window_title: name,
                    window_image: "", // TODO /static/app/images/yuneta/topic_schema.svg",

                    hook_data_viewer: Ui_hook_viewer_popup,
                    gobj_remote_yuno: self.config.iev,
                    treedb_name: cell.id,
                    with_treedb_tables: true,
                    auto_topics: true

                    // Esto es si fuera para un viewer con conexión autonoma (iev)
                    //dst_role: dst_role,
                    //dst_service: dst_service,
                    //dst_yuno: dst_yuno,
                    //url: url
                },
                self
            );
            gobj.gobj_start();
        } else {
            gobj.gobj_send_event("EV_TOGGLE", {}, self);
        }

        return 0;
    }

    /********************************************
     *  Top toolbar informing of window close
     *  kw
     *      {destroying: true}   Window destroying
     *      {destroying: false}  Window minifying
     ********************************************/
    function ac_close_window(self, event, kw, src)
    {
        return 0;
    }

    /********************************************
     *
     ********************************************/
    function ac_toggle(self, event, kw, src)
    {
        if(self.config.$ui.isVisible()) {
            self.config.$ui.hide();
        } else {
            self.config.$ui.show();
        }
        return 0;
    }

    /********************************************
     *
     ********************************************/
    function ac_show(self, event, kw, src)
    {
        self.config.$ui.show();
        return 0;
    }

    /********************************************
     *
     ********************************************/
    function ac_hide(self, event, kw, src)
    {
        self.config.$ui.hide();
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
     *************************************************************/
    function ac_refresh(self, event, kw, src)
    {
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




            /***************************
             *      GClass/Machine
             ***************************/




    var FSM = {
        "event_list": [
            "EV_ON_OPEN",
            "EV_ON_CLOSE",
            "EV_IDENTITY_CARD_REFUSED",
            "EV_MT_COMMAND_ANSWER",

            "EV_MX_VERTEX_CLICKED",
            "EV_RUN_NODE",

            "EV_CLOSE_WINDOW",
            "EV_TOGGLE",
            "EV_SHOW",
            "EV_HIDE",
            "EV_SELECT",
            "EV_REFRESH",
            "EV_REBUILD_PANEL"
        ],
        "state_list": [
            "ST_IDLE"
        ],
        "machine": {
            "ST_IDLE":
            [
                ["EV_MT_COMMAND_ANSWER",        ac_mt_command_answer,       undefined],
                ["EV_ON_OPEN",                  ac_on_open,                 undefined],
                ["EV_IDENTITY_CARD_REFUSED",    ac_id_refused,              undefined],
                ["EV_ON_CLOSE",                 ac_on_close,                undefined],

                ["EV_MX_VERTEX_CLICKED",        ac_mx_vertex_clicked,       undefined],
                ["EV_RUN_NODE",                 ac_run_node,                undefined],

                ["EV_CLOSE_WINDOW",             ac_close_window,            undefined],
                ["EV_TOGGLE",                   ac_toggle,                  undefined],
                ["EV_SHOW",                     ac_show,                    undefined],
                ["EV_HIDE",                     ac_hide,                    undefined],
                ["EV_SELECT",                   ac_select,                  undefined],
                ["EV_REFRESH",                  ac_refresh,                 undefined],
                ["EV_REBUILD_PANEL",            ac_rebuild_panel,           undefined]
            ]
        }
    };

    var Ui_treedb_viewer = GObj.__makeSubclass__();
    var proto = Ui_treedb_viewer.prototype; // Easy access to the prototype
    proto.__init__= function(name, kw) {
        GObj.prototype.__init__.call(
            this,
            FSM,
            CONFIG,
            name,
            "Ui_treedb_viewer",
            kw,
            0
        );
        return this;
    };
    gobj_register_gclass(Ui_treedb_viewer, "Ui_treedb_viewer");




            /***************************
             *      Framework Methods
             ***************************/




    /************************************************
     *      Framework Method create
     ************************************************/
    proto.mt_create = function(kw)
    {
        var self = this;

        load_icons(self);

        var subscriber = self.gobj_read_attr("subscriber");
        if(!subscriber)
            subscriber = self.gobj_parent();
        self.gobj_subscribe_event(null, null, subscriber);

        rebuild(self);

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
        if(self.config.resizing_event_id) {
            webix.eventRemove(self.config.resizing_event_id);
            self.config.resizing_event_id = 0;
        }
    }

    /************************************************
     *      Framework Method start
     ************************************************/
    proto.mt_start = function(kw)
    {
        var self = this;

        var self = this;
        mxEvent.disableContextMenu(
            $$(build_name(self, "mxgraph")).getNode()
        );

        start_iev(self);
    }

    /************************************************
     *      Framework Method stop
     ************************************************/
    proto.mt_stop = function(kw)
    {
        var self = this;
        stop_iev(self);
    }

    //=======================================================================
    //      Expose the class via the global object
    //=======================================================================
    exports.Ui_treedb_viewer = Ui_treedb_viewer;

})(this);

