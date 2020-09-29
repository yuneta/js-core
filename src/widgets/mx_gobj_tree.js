/***********************************************************************
 *          mx_gobj_tree.js
 *
 *          Yuneta GObj Tree with mxgrah
 *          "Container Panel"
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
        panel_properties: {},   // creator can set "Container Panel" properties
        ui_properties: null,    // creator can set webix properties

        $ui: null,

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
     *
     ************************************************************/
    function load_icons(self)
    {
        /*
         *  Load control button images
         */
        self.config.image_role_class = new mxImage('/static/app/images/yuneta/circle_red.svg',
            self.config.top_overlay_icon_size, self.config.top_overlay_icon_size
        );
        self.config.image_role_instance =new mxImage('/static/app/images/yuneta/circle_yellow.svg',
            self.config.top_overlay_icon_size, self.config.top_overlay_icon_size
        );

        self.config.image_running = new mxImage('/static/app/images/yuneta/instance_running.svg',
            self.config.bottom_overlay_icon_size, self.config.bottom_overlay_icon_size
        );
        self.config.image_stopped = new mxImage('/static/app/images/yuneta/instance_stopped.svg',
            self.config.bottom_overlay_icon_size, self.config.bottom_overlay_icon_size
        );
        self.config.image_playing = new mxImage('/static/app/images/yuneta/instance_playing.svg',
            self.config.bottom_overlay_icon_size, self.config.bottom_overlay_icon_size
        );
        self.config.image_service = new mxImage('/static/app/images/yuneta/instance_service.svg',
            self.config.bottom_overlay_icon_size, self.config.bottom_overlay_icon_size
        );
        self.config.image_unique = new mxImage('/static/app/images/yuneta/instance_unique.svg',
            self.config.bottom_overlay_icon_size, self.config.bottom_overlay_icon_size
        );
        self.config.image_disabled = new mxImage('/static/app/images/yuneta/instance_disabled.svg',
            self.config.bottom_overlay_icon_size, self.config.bottom_overlay_icon_size
        );
        self.config.image_tracing = new mxImage('/static/app/images/yuneta/instance_tracing.svg',
            self.config.bottom_overlay_icon_size, self.config.bottom_overlay_icon_size
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
         *      Ventana help
         *---------------------------------------*/
        if($$(build_name(self, "help_window"))) {
            $$(build_name(self, "help_window")).destructor();
        }
        webix.ui({
            view: "window",
            id: build_name(self, "help_window"),
            width: 500,
            height: 400,
            move: true,
            resize: true,
            position: "center",
            head:{
                cols:[
                    { view:"label", align:"center", label:t("help")},
                    { view:"icon", icon:"wxi-close", click:function() {
                        this.getTopParentView().hide();
                    }}
                ]
            },
            body: {
                view: "list",
                select: false,
                borderless:true,
                template: '<div style="cursor:default;display:table;height:40px;"><img src="#url#" alt="#help#" width="24" height="24"><span style="display:table-cell;vertical-align:middle;padding-left:10px;width:100%;">#help#</span></div>',
                data: [
                    {
                        url:'/static/app/images/yuneta/circle_red.svg',
                        help: "Open GClass (Role, Class) window"
                    },
                    {
                        url:'/static/app/images/yuneta/circle_yellow.svg',
                        help: "Open GObj (instance, object) window"
                    },
                    {
                        url:'/static/app/images/yuneta/instance_running.svg',
                        help: "gobj is running"
                    },
                    {
                        url:'/static/app/images/yuneta/instance_stopped.svg',
                        help: "gobj is stopped"
                    },
                    {
                        url:'/static/app/images/yuneta/instance_playing.svg',
                        help: "gobj is playing"
                    },
                    {
                        url:'/static/app/images/yuneta/instance_service.svg',
                        help: "gobj is service (public service)"
                    },
                    {
                        url:'/static/app/images/yuneta/instance_unique.svg',
                        help: "gobj is unique (internal service)"
                    },
                    {
                        url:'/static/app/images/yuneta/instance_disabled.svg',
                        help: "gobj is disabled"
                    },
                    {
                        url:'/static/app/images/yuneta/instance_tracing.svg',
                        help: "gobj is tracing"
                    }
                ]
            }
        });

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
                get_container_panel_top_toolbar(self),
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

        /*----------------------------------------------*
         *  Inform of panel viewed to "Container Panel"
         *----------------------------------------------*/
        self.config.$ui.attachEvent("onViewShow", function() {
            self.parent.gobj_send_event("EV_ON_VIEW_SHOW", self, self);
        });

        /*---------------------------------------*
         *      Automatic Resizing
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
            var window_width = window.innerWidth;
            var window_height = window.innerHeight;
            automatic_resizing(build_name(self, "help_window"), window_width, window_height);
        }

        webix.event(window, "resize", automatic_resizing_cb);
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
     *
     ********************************************/
    function initialize_mxgraph(self)
    {
        var graph = self.config._mxgraph;

        mxEvent.disableContextMenu(graph.container);

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
                return br(cell.value.shortname);
            }
            return "";
        };

        /*
         *  Own getTooltip
         */
        graph.setTooltips(true);
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
                        add_state_overlays(self, graph, cell, cell.value);
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
                        add_state_overlays(self, graph, cell, cell.value);
                        add_class_overlays(self, graph, cell, cell.value);
                    }
                }
            } catch (e) {
                info_user_error(e);
            }
        });

        if(0) {
            /*
             *  Sample of Context Menu
             */
            // Configures automatic expand on mouseover
            graph.popupMenuHandler.autoExpand = true;

            // Installs context menu
            graph.popupMenuHandler.factoryMethod = function(menu, cell, evt)
            {
                menu.addItem('Item 1', null, function()
                {
                    alert('Item 1');
                });

                menu.addItem('Item 2', null, function()
                {
                    alert('Item 2');
                });

                menu.addSeparator();
            };
        }
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
        return "<b>" + n[0] + "</b>^<br/>" + n[1];
    }

    /************************************************************
     *
     ************************************************************/
    function get_layer(self, layer)
    {
        return self.config._mxgraph.getDefaultParent();
    }

    /************************************************************
     *
     ************************************************************/
    function add_class_overlays(self, graph, cell, record)
    {
        var model = graph.getModel();
        model.beginUpdate();
        try {
            var offs = self.config.top_overlay_icon_size/2;

            var overlay_role = new mxCellOverlay(
                self.config.image_role_class,
                "Role Class",               // tooltip
                mxConstants.ALIGN_LEFT,     // horizontal align ALIGN_LEFT,ALIGN_CENTER,ALIGN_RIGH>
                mxConstants.ALIGN_TOP,      // vertical align  ALIGN_TOP,ALIGN_MIDDLE,ALIGN_BOTTOM
                new mxPoint(offs, offs),    // offset
                "pointer"                   // cursor
            );
            graph.addCellOverlay(cell, overlay_role);

            // Installs a handler for clicks on the overlay
            overlay_role.addListener(mxEvent.CLICK, function(sender, evt2) {
                var record = evt2.getProperty('cell').value;
                self.parent.gobj_send_event("EV_MX_ROLE_CLASS_CLICKED", record, self);
            });

            var overlay_instance = new mxCellOverlay(
                self.config.image_role_instance,
                "Role Instance",            // tooltip
                mxConstants.ALIGN_RIGH,     // horizontal align ALIGN_LEFT,ALIGN_CENTER,ALIGN_RIGH>
                mxConstants.ALIGN_TOP,      // vertical align  ALIGN_TOP,ALIGN_MIDDLE,ALIGN_BOTTOM
                new mxPoint(-offs, offs),   // offset
                "pointer"                   // cursor
            );
            graph.addCellOverlay(cell, overlay_instance);

            // Installs a handler for clicks on the overlay
            overlay_instance.addListener(mxEvent.CLICK, function(sender, evt2) {
                var record = evt2.getProperty('cell').value;
                self.parent.gobj_send_event("EV_MX_ROLE_INSTANCE_CLICKED", record, self);
            });

        } catch (e) {
            log_error(e);
        } finally {
            model.endUpdate();
        }
    }

    /************************************************************
     *
     ************************************************************/
    function add_state_overlays(self, graph, cell, record)
    {
        var model = graph.getModel();
        model.beginUpdate();
        try {
            var bottom_overlay_icon_size = self.config.bottom_overlay_icon_size;
            var x = 10;
            var y = -10;
            var i = 0;

            if(record.running) {
                var overlay = new mxCellOverlay(
                    self.config.image_running,
                    "object running",           // tooltip
                    mxConstants.ALIGN_LEFT,     // horizontal align ALIGN_LEFT,ALIGN_CENTER,ALIGN_RIGH>
                    mxConstants.ALIGN_BOTTOM,   // vertical align  ALIGN_TOP,ALIGN_MIDDLE,ALIGN_BOTTOM
                    new mxPoint(x + bottom_overlay_icon_size*i, y),   // offset
                    "default"                           // cursor
                );
                graph.addCellOverlay(cell, overlay);
                i++;

                // Installs a handler for clicks on the overlay
                overlay.addListener(mxEvent.CLICK, function(sender, evt2) {
                    var record = evt2.properties.cell.value;
                    self.parent.gobj_send_event("EV_MX_RUNNING_CLICKED", record, self);
                });
            } else {
                var overlay = new mxCellOverlay(
                    self.config.image_stopped,
                    "object stopped",           // tooltip
                    mxConstants.ALIGN_LEFT,     // horizontal align ALIGN_LEFT,ALIGN_CENTER,ALIGN_RIGH>
                    mxConstants.ALIGN_BOTTOM,   // vertical align  ALIGN_TOP,ALIGN_MIDDLE,ALIGN_BOTTOM
                    new mxPoint(x + bottom_overlay_icon_size*i, y),   // offset
                    "default"                           // cursor
                );
                graph.addCellOverlay(cell, overlay);
                i++;

                // Installs a handler for clicks on the overlay
                overlay.addListener(mxEvent.CLICK, function(sender, evt2) {
                    var record = evt2.properties.cell.value;
                    self.parent.gobj_send_event("EV_MX_STOPPED_CLICKED", record, self);
                });
            }

            if(record.playing) {
                var overlay = new mxCellOverlay(
                    self.config.image_playing,
                    "object playing",           // tooltip
                    mxConstants.ALIGN_LEFT,     // horizontal align ALIGN_LEFT,ALIGN_CENTER,ALIGN_RIGH>
                    mxConstants.ALIGN_BOTTOM,   // vertical align  ALIGN_TOP,ALIGN_MIDDLE,ALIGN_BOTTOM
                    new mxPoint(x + bottom_overlay_icon_size*i, y),   // offset
                    "default"                           // cursor
                );
                graph.addCellOverlay(cell, overlay);
                i++;

                // Installs a handler for clicks on the overlay
                overlay.addListener(mxEvent.CLICK, function(sender, evt2) {
                    var record = evt2.properties.cell.value;
                    self.parent.gobj_send_event("EV_MX_PLAYING_CLICKED", record, self);
                });
            }

            if(record.service) {
                var overlay = new mxCellOverlay(
                    self.config.image_service,
                    "object service",           // tooltip
                    mxConstants.ALIGN_LEFT,     // horizontal align ALIGN_LEFT,ALIGN_CENTER,ALIGN_RIGH>
                    mxConstants.ALIGN_BOTTOM,   // vertical align  ALIGN_TOP,ALIGN_MIDDLE,ALIGN_BOTTOM
                    new mxPoint(x + bottom_overlay_icon_size*i, y),   // offset
                    "default"                           // cursor
                );
                graph.addCellOverlay(cell, overlay);
                i++;

                // Installs a handler for clicks on the overlay
                overlay.addListener(mxEvent.CLICK, function(sender, evt2) {
                    var record = evt2.properties.cell.value;
                    self.parent.gobj_send_event("EV_MX_SERVICE_CLICKED", record, self);
                });
            }

            if(record.unique) {
                var overlay = new mxCellOverlay(
                    self.config.image_unique,
                    "object unique",            // tooltip
                    mxConstants.ALIGN_LEFT,     // horizontal align ALIGN_LEFT,ALIGN_CENTER,ALIGN_RIGH>
                    mxConstants.ALIGN_BOTTOM,   // vertical align  ALIGN_TOP,ALIGN_MIDDLE,ALIGN_BOTTOM
                    new mxPoint(x + bottom_overlay_icon_size*i, y),   // offset
                    "default"                           // cursor
                );
                graph.addCellOverlay(cell, overlay);
                i++;

                // Installs a handler for clicks on the overlay
                overlay.addListener(mxEvent.CLICK, function(sender, evt2) {
                    var record = evt2.properties.cell.value;
                    self.parent.gobj_send_event("EV_MX_UNIQUE_CLICKED", record, self);
                });
            }

            if(record.disabled) {
                var overlay = new mxCellOverlay(
                    self.config.image_disabled,
                    "object disabled",          // tooltip
                    mxConstants.ALIGN_LEFT,     // horizontal align ALIGN_LEFT,ALIGN_CENTER,ALIGN_RIGH>
                    mxConstants.ALIGN_BOTTOM,   // vertical align  ALIGN_TOP,ALIGN_MIDDLE,ALIGN_BOTTOM
                    new mxPoint(x + bottom_overlay_icon_size*i, y),   // offset
                    "default"                           // cursor
                );
                graph.addCellOverlay(cell, overlay);
                i++;

                // Installs a handler for clicks on the overlay
                overlay.addListener(mxEvent.CLICK, function(sender, evt2) {
                    var record = evt2.properties.cell.value;
                    self.parent.gobj_send_event("EV_MX_DISABLED_CLICKED", record, self);
                });
            }

            if(record.gobj_trace_level) {
                var overlay = new mxCellOverlay(
                    self.config.image_tracing,
                    "object tracing",           // tooltip
                    mxConstants.ALIGN_LEFT,     // horizontal align ALIGN_LEFT,ALIGN_CENTER,ALIGN_RIGH>
                    mxConstants.ALIGN_BOTTOM,   // vertical align  ALIGN_TOP,ALIGN_MIDDLE,ALIGN_BOTTOM
                    new mxPoint(x + bottom_overlay_icon_size*i, y),   // offset
                    "default"                           // cursor
                );
                graph.addCellOverlay(cell, overlay);
                i++;

                // Installs a handler for clicks on the overlay
                overlay.addListener(mxEvent.CLICK, function(sender, evt2) {
                    var record = evt2.properties.cell.value;
                    self.parent.gobj_send_event("EV_MX_TRACING_CLICKED", record, self);
                });
            }
        } catch (e) {
            log_error(e);
        } finally {
            model.endUpdate();
        }
    }

    /************************************************************
     *
     ************************************************************/
    function _load_gobj_treedb(self, graph, group, data)
    {
        var x_acc = [];
        var x = 0;
        var y = 0; // si meto separación aparece scrollbar al ajustar
        var sep = self.config.vertex_sep;
        var model = graph.getModel();

        // HACK with layout this x,y,w,h are ignored
        // WARNING without a built-in layout, the graph is horrible.
        for(var i=0; i<data.length; i++) {
            var record = data[i];
            var parent = record.parent_id?model.getCell(record.parent_id):null;

            // HACK protege contra demasiados nodos
            if(i > 0) {
                var x = model.isVertex(parent);
                var y = graph.getConnections(parent).length;
                if(!parent || x && y > 10) {
                    continue;
                }
            }

            var cx = self.config.vertex_cx;
            var cy = self.config.vertex_cy;
            if(!(record.service || record.unique)) {
                cx = (cx*5)/8;
                cy = (cy*6)/8;
            }
            if(empty_string(record.name)) {
                cx = (cx*4)/8;
                cy = (cy*6)/8;
            }

            y = record.id.split("`");
            y = Number(y.length) - 1;
            if(!x_acc[y]) {
                x_acc[y] = (y>0)?x_acc[y-1]-1:0;
            }

            x = (x_acc[y]) * (cx+sep);
            (x_acc[y])++;

            var child = graph.insertVertex(
                group,          // parent
                record.id,      // id
                record,         // value
                x,              // x,y,width,height
                (y)*(cy+sep),
                cx, cy,
                "",             // style
                false           // relative
            );

            graph.removeCellOverlays(child); // Delete all previous overlays
            add_state_overlays(self, graph, child, record);

            if(parent) {
                graph.insertEdge(
                    group,          // parent
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
        // HACK is already in a beginUpdate/endUpdate
        var graph = self.config._mxgraph;
        var group = get_layer(self, layer);
        _load_gobj_treedb(self, graph, group, data);

        execute_layout(self);
    }




            /***************************
             *      Actions
             ***************************/




    /********************************************
     *
     ********************************************/
    function ac_click_item(self, event, kw, src)
    {
        var graph = self.config._mxgraph;

        var cell = graph.model.getCell(kw.id);
        if(cell) {
            /*
             *  Simula un click !!!
             */
            graph.fireEvent(
                new mxEventObject(
                    mxEvent.CLICK, 'event', {}, 'cell', cell
                ),
                cell
            );
        }
    }

    /********************************************
     *
     ********************************************/
    function ac_select_item(self, event, kw, src)
    {
        var cell = self.config._mxgraph.model.getCell(kw.id);
        self.config._mxgraph.setSelectionCell(cell);

        return 0;
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
            "EV_SELECT_ITEM",
            "EV_LOAD_DATA",
            "EV_CLEAR_DATA",
            "EV_CLICK_ITEM",
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
                ["EV_SELECT_ITEM",          ac_select_item,     undefined],
                ["EV_LOAD_DATA",            ac_load_data,       undefined],
                ["EV_CLEAR_DATA",           ac_clear_data,      undefined],
                ["EV_CLICK_ITEM",           ac_click_item,      undefined],
                ["EV_SELECT",               ac_select,          undefined],
                ["EV_REFRESH",              ac_refresh,         undefined],
                ["EV_REBUILD_PANEL",        ac_rebuild_panel,   undefined]
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

        load_icons(self);

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
