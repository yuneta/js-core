/***********************************************************************
 *          mx_json_viewer.js
 *
 *          Json with mxgrah
 *          "Pinhold Window"
 *
 *          HACK the parent MUST be a pinhold handler
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
        ui_properties: null,    // creator can set webix properties

        $ui: null,
        $ui_fullscreen: null,   // What part of window will be fullscreened "Pinhold Window" HACK

        pinpushed: false,       // Handle by pinhold top toobar "Pinhold Window" HACK
        window_image: "",       // Used by pinhold_panel_top_toolbar "Pinhold Window" HACK
        window_title: "",       // Used by pinhold_panel_top_toolbar "Pinhold Window" HACK

        left: 0,
        top: 0,
        width: 600,
        height: 500,

        top_overlay_icon_size: 24,
        bottom_overlay_icon_size: 16,

        image_topic_schema: null,

        vertex_cx: 200,
        vertex_cy: 90,
        vertex_cy_sep: 40,

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

        _mxgraph: null,

        __writable_attrs__: [
            "window_title",
            "window_image",
            "left",
            "top",
            "width",
            "height",
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
        self.config.image_topic_schema = new mxImage(
            '/static/app/images/yuneta/topic_schema.svg',
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
                        var graph = self.config._mxgraph;
                        graph.view.scaleAndTranslate(1, graph.border/2, graph.border/2);
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
                        var graph = self.config._mxgraph;
                        graph.fit();
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
                        var graph = self.config._mxgraph;
                        graph.zoomIn();
                        graph.view.setTranslate(0, 0);
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
                        var graph = self.config._mxgraph;
                        graph.zoomOut();
                        graph.view.setTranslate(0, 0);
                    }
                }
            ]
        };

        /*---------------------------------------*
         *      UI
         *---------------------------------------*/
        self.config.$ui = webix.ui({
            view: "window",
            id: self.gobj_escaped_short_name(),
            top: self.config.top,
            left: self.config.left,
            width: self.config.width,
            height: self.config.height,
            hidden: self.config.pinpushed?true:false,
            move: true,
            resize: true,
            position: (self.config.left==0 && self.config.top==0)?"center":null,
            head: get_pinhold_window_top_toolbar(self),
            body: {
                id: build_name(self, "fullscreen"),
                rows: [
                    {
                        view: "mxgraph",
                        id: build_name(self, "mxgraph"),
                        gobj: self
                    },
                    bottom_toolbar
                ]
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

        self.config.$ui.gobj = self;
        if(self.config.ui_properties) {
            self.config.$ui.define(self.config.ui_properties);
            if(self.config.$ui.refresh) {
                self.config.$ui.refresh();
            }
        }

        automatic_resizing_cb(); // Adapt window size to device

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
            var window_width = window.innerWidth-8;
            var window_height = window.innerHeight-8;
            automatic_resizing(self.gobj_escaped_short_name(), window_width, window_height);
        }

        // webix.event(window, "resize", automatic_resizing_cb); // Don't use, the win will died
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

    /********************************************
     *
     ********************************************/
    function get_topic_type(topic)
    {
        var lists = kw_get_dict_value(topic, "lists", [], 0);
        for(var i=0; i<lists.length; i++) {
            if(kw_has_key(lists[0], "treedb_name")) {
                return "treedb_topic";
            }
            if(kw_has_key(lists[0], "msg2db_name")) {
                return "msg2db_topic";
            }
        }

        return "raw_topic";
    }

    /************************************************************
     *
     ************************************************************/
    function add_tranger_overlays(self, graph, cell)
    {
        var model = graph.getModel();
        model.beginUpdate();
        try {
            var offsy = self.config.top_overlay_icon_size/2;
            var offsx = self.config.top_overlay_icon_size + 5;

            if(cell.value && cell.value.cols &&  Object.keys(cell.value.cols).length > 0) {
                var overlay_role = new mxCellOverlay(
                    self.config.image_topic_schema,
                    "Show Topic Schema",        // tooltip
                    mxConstants.ALIGN_LEFT,     // horizontal align ALIGN_LEFT,ALIGN_CENTER,ALIGN_RIGH>
                    mxConstants.ALIGN_TOP,      // vertical align  ALIGN_TOP,ALIGN_MIDDLE,ALIGN_BOTTOM
                    new mxPoint(offsy, -offsy),    // offset
                    "pointer"                   // cursor
                );
                graph.addCellOverlay(cell, overlay_role);

                // Installs a handler for clicks on the overlay
                overlay_role.addListener(mxEvent.CLICK, function(sender, evt2) {
                    var topic = evt2.getProperty('cell').value;
// TODO                    self.parent.gobj_send_event(
//                         "EV_MX_SHOW_TOPIC_SCHEMA",
//                         topic,
//                         self
//                     );
                });
            }


        } catch (e) {
            log_error(e);
        } finally {
            model.endUpdate();
        }
    }

    /********************************************
     *
     ********************************************/
    function initialize_mxgraph(self)
    {
        var graph = self.config._mxgraph;

        mxEvent.disableContextMenu(graph.container);

        graph.border = 40;
        graph.view.setTranslate(graph.border/2, graph.border/2);

        graph.setPanning(true);
        graph.panningHandler.useLeftButtonForPanning = true;

        // Negative coordenates?
        graph.allowNegativeCoordinates = false;

        // Multiple connections between the same pair of vertices.
        graph.setMultigraph(true);

        // Avoids overlap of edges and collapse icons
        graph.keepEdgesInBackground = true;

        /*---------------------------*
         *      PERMISOS
         *---------------------------*/
        // Enable/Disable cell handling
        graph.setEnabled(true);

        graph.setConnectable(false); // Crear edges/links
        graph.setCellsDisconnectable(false); // Modificar egdes/links
        mxGraphHandler.prototype.setCloneEnabled(false); // Ctrl+Drag will clone a cell
        graph.setCellsLocked(true);
        graph.setPortsEnabled(true);
        graph.setCellsEditable(false);

        mxGraph.prototype.isCellSelectable = function(cell) {
            return true;
        };

        /*
         *  Set stylesheet options
         */
        create_graph_style(
            graph,
            "raw_topic",
            "text;html=1;strokeColor=#d6b656;fillColor=#fff2cc;align=left;verticalAlign=top;whiteSpace=wrap;overflow=hidden;gradientColor=#ffffff;shadow=1;spacingLeft=10;spacingTop=5;fontSize=12;"
        );
        create_graph_style(
            graph,
            "msg2db_topic",
            "text;html=1;strokeColor=#82b366;fillColor=#d5e8d4;align=left;verticalAlign=top;whiteSpace=wrap;overflow=hidden;gradientColor=#ffffff;shadow=1;spacingLeft=10;spacingTop=5;fontSize=12;"
        );
        create_graph_style(
            graph,
            "treedb_topic",
            "text;html=1;strokeColor=#6c8ebf;fillColor=#dae8fc;align=left;verticalAlign=top;whiteSpace=wrap;overflow=hidden;gradientColor=#ffffff;shadow=1;spacingLeft=10;spacingTop=5;fontSize=12;"
        );
        create_graph_style(
            graph,
            "title",
            "text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=top;whiteSpace=wrap;rounded=0;shadow=1;glass=0;sketch=0;fontSize=16;fontColor=#095C86;spacingLeft=10;spacingTop=5;fontStyle=1;"
        );

        // Handles clicks on cells
        graph.addListener(mxEvent.CLICK, function(sender, evt) {
            var cell = evt.getProperty('cell');
            if (cell != null) {
                var record = evt.properties.cell.value;
//   TODO              if(cell.isVertex()) {
//                     self.parent.gobj_send_event("EV_MX_VERTEX_CLICKED", record, self);
//                 } else {
//                     self.parent.gobj_send_event("EV_MX_EDGE_CLICKED", record, self);
//                 }
            }
        });

        /*
         *  Own getLabel
         */
        graph.setHtmlLabels(true);
        graph.getLabel = function(cell) {
            if (this.getModel().isVertex(cell)) {
                var t = "<b>" + cell.id + "</b><br/>";
                if(is_object(cell.value)) {
                    if(!empty_string(cell.value.pkey)) {
                        t += "pkey: <pre style='display:inline'><i>" +
                            cell.value.pkey +
                            "</i></pre><br/>";
                    }
                    if(!empty_string(cell.value.pkey2)) {
                        t += "pkey2: <pre style='display:inline'><i>" +
                            cell.value.pkey2 +
                            "</i></pre><br/>";
                    }
                    if(!empty_string(cell.value.tkey)) {
                        t += "tkey: <pre style='display:inline'><i>" +
                            cell.value.tkey +
                            "</i></pre><br/>";
                    }
                    if(kw_has_key(cell.value, "__last_rowid__")) {
                        t += "size: <pre style='display:inline'>" +
                            cell.value.__last_rowid__ +
                            "</pre><br/>";
                    }
                }
                switch(cell.style) {
                    case "raw_topic":
                        break;
                    case "msg2db_topic":
                        break;
                    case "treedb_topic":
                        break;
                    default:
                        break;
                }
                return t;
            }
            return "";
        };

        /*
         *  Tooltip
         */
        graph.setTooltips(true);

        /*
         *  Cursor pointer
         */
        graph.getCursorForCell = function(cell) {
            if(this.model.isEdge(cell)) {
                return 'default';
            } else {
                return 'default';
            }
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
                        add_tranger_overlays(self, graph, cell);
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
    function load_topics(self, graph, tranger_name, topics)
    {
        var cx = self.config.vertex_cx;
        var cy = self.config.vertex_cy;
        var vertex_cy_sep = self.config.vertex_cy_sep;

        var model = graph.getModel();
// TODO        graph.insertVertex(
//             get_layer(self, topic_type),    // group
//             topic.topic_name,       // id
//             topic,                  // value
//             0, 0,            // x,y
//             cx + cx/2, cy,          // width,height
//             topic_type,             // style
//             false                   // relative
//         );

    }

    /************************************************************
     *
     ************************************************************/
    function load_tranger(self, tranger_name, data, layer)
    {
        // HACK is already in a beginUpdate/endUpdate
        var graph = self.config._mxgraph;

        var topics = data.topics;
        load_topics(self, graph, tranger_name, topics);
        graph.view.setTranslate(graph.border/2, graph.border/2);
        execute_layout(self);
    }




            /***************************
             *      Actions
             ***************************/




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
        var layer = undefined;
        var model = self.config._mxgraph.getModel();
        model.beginUpdate();
        try {
            switch(kw.type) {
                case "tranger":
                default:
                    load_tranger(self, kw.name, kw.data, layer);
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
    }

    /********************************************
     *
     ********************************************/
    function ac_show(self, event, kw, src)
    {
        self.config.$ui.show();
    }

    /********************************************
     *
     ********************************************/
    function ac_hide(self, event, kw, src)
    {
        self.config.$ui.hide();
    }




            /***************************
             *      GClass/Machine
             ***************************/




    var FSM = {
        "event_list": [
            "EV_SELECT_ITEM",
            "EV_LOAD_DATA",
            "EV_CLEAR_DATA",
            "EV_TOGGLE",
            "EV_SHOW",
            "EV_HIDE"
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
                ["EV_TOGGLE",               ac_toggle,          undefined],
                ["EV_SHOW",                 ac_show,            undefined],
                ["EV_HIDE",                 ac_hide,            undefined]
            ]
        }
    };

    var Mx_json_viewer = GObj.__makeSubclass__();
    var proto = Mx_json_viewer.prototype; // Easy access to the prototype
    proto.__init__= function(name, kw) {
        GObj.prototype.__init__.call(
            this,
            FSM,
            CONFIG,
            name,
            "Mx_json_viewer",
            kw,
            0
        );
        return this;
    };
    gobj_register_gclass(Mx_json_viewer, "Mx_json_viewer");




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
    exports.Mx_json_viewer = Mx_json_viewer;

})(this);

