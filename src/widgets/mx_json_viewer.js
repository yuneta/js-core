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

        json_data: null,

        left: 0,
        top: 0,
        width: 600,
        height: 500,

        top_overlay_icon_size: 24,
        image_topic_schema: null,

        vertex_cx: 60,
        vertex_cy: 60,
        vertex_cx_sep: 40,
        vertex_cy_sep: 10,

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
            "layout_selected",
            "json_data"
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
                    hidden: false,
                    tooltip: t("Select layout"),
                    minWidth: 180,
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
                    autosize: true,
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
                    autosize: true,
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
                    autosize: true,
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
                    autosize: true,
                    label: t("zoom out"),
                    click: function() {
                        var graph = self.config._mxgraph;
                        graph.zoomOut();
                        graph.view.setTranslate(0, 0);
                    }
                },
                {
                    view:"button",
                    type: "icon",
                    icon: "far fa-lock-alt",
                    css: "webix_transparent icon_toolbar_16",
                    autosize: true,
                    label: t("unlock vertices"),
                    click: function() {
                        var graph = self.config._mxgraph;
                        if(graph.isCellsLocked()) {
                            graph.setCellsLocked(false);
                            this.define("icon", "far fa-lock-open-alt");
                            this.define("label", t("lock vertices"));
                        } else {
                            graph.setCellsLocked(true);
                            this.define("icon", "far fa-lock-alt");
                            this.define("label", t("unlock vertices"));
                        }
                        this.refresh();
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

        // Enables rubberband selection
        new mxRubberband(graph);

        graph.setPanning(true);
        //graph.panningHandler.useLeftButtonForPanning = true;

        // Negative coordenates?
        graph.allowNegativeCoordinates = false;

        // Multiple connections between the same pair of vertices.
        graph.setMultigraph(true);

        // Avoids overlap of edges and collapse icons
        graph.keepEdgesInBackground = true;

        graph.setAutoSizeCells(true);

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
         *  HACK Por defecto si los hijos salen un overlap del 50%
         *  se quitan del padre y pasan al default
         */
        graph.graphHandler.setRemoveCellsFromParent(false); // HACK impide quitar hijos
        mxGraph.prototype.isAllowOverlapParent = function(cell) { return true;}
        mxGraph.prototype.defaultOverlap = 1; // Permite a hijos irse tan lejos como quieran

        /*
         *  Set stylesheet options
         */
        // Set stylesheet options
        var style = graph.getStylesheet().getDefaultVertexStyle();
        style[mxConstants.STYLE_FONTFAMILY] = 'monospace, "dejavu sans mono", "droid sans mono", consolas, monaco, "lucida console", sans-serif, "courier new", courier';
        style[mxConstants.STYLE_FONTSIZE] = '14';
        style[mxConstants.STYLE_FONTSTYLE] = '0';

        create_graph_style(
            graph,
            "string",
            "text;html=1;strokeColor=none;fillColor=none;align=left;whiteSpace=nowrap;rounded=0;shadow=1;glass=0;sketch=0;fontColor=#1A1A1A;"
        );
        create_graph_style(
            graph,
            "number",
            "text;html=1;strokeColor=none;fillColor=none;align=left;whiteSpace=nowrap;rounded=0;shadow=1;glass=0;sketch=0;fontColor=#1A1A1A;"
        );
        create_graph_style(
            graph,
            "boolean",
            "text;html=1;strokeColor=none;fillColor=none;align=left;whiteSpace=nowrap;rounded=0;shadow=1;glass=0;sketch=0;fontColor=#1A1A1A;"
        );
        create_graph_style(
            graph,
            "null",
            "text;html=1;strokeColor=none;fillColor=none;align=left;whiteSpace=nowrap;rounded=0;shadow=1;glass=0;sketch=0;fontColor=#1A1A1A;"
        );
        create_graph_style(
            graph,
            "list",
            "text;html=1;strokeColor=none;fillColor=none;align=left;whiteSpace=nowrap;rounded=0;shadow=1;glass=0;sketch=0;fontColor=#1A1A1A;"
        );
        create_graph_style(
            graph,
            "dict",
            "text;html=1;strokeColor=none;fillColor=none;align=left;whiteSpace=nowrap;rounded=0;shadow=1;glass=0;sketch=0;fontColor=#1A1A1A;"
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
                // #006000 verde string
                // #EE422E rojo number
                // #FF8C00 naranja boolean
                // #475ED0 azul null
                var color = "black";
                var value = cell.value;
                var prefix = "";
                switch(cell.style) {
                    case "string":
                        color = "#006000";
                        value = '"' + cell.value + '"';
                        break;
                    case "number":
                        color = "#EE422E";
                        break;
                    case "boolean":
                        color = "#FF8C00";
                        value = cell.value?"true":"false";
                        break;
                    case "null":
                        color = "#475ED0";
                        value = "null";
                        break;
                    case "list":
                        color = "#475ED0";
                        value = "[" + cell.value.length+ "]";
                        break;
                    case "dict":
                        color = "#475ED0";
                        value = "{" + json_object_size(cell.value) + "}";
                        break;
                    default:
                        color = "black";
                        break;
                }
                var t = "";
                if(cell.id) {
                    if(cell.value) {
                        prefix = "•";
                    }
                    t += "<span style='display:inline;color:#1A1A1A'>" +
                    prefix + " " + cell.id +
                    ": </span>";
                    if(cell.value) {
                        t += "<span style='display:inline;color:" +
                        color + "'>" + cell.value +
                        "</span>";
                    }
                } else if(cell.value) {
                    t += "<span style='display:inline;color:" +
                    color + "'>" + cell.value +
                    "</span>";
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
    function _load_json(self, x, y, kw, parent)
    {
        // HACK is already in a beginUpdate/endUpdate
        var graph = self.config._mxgraph;
        var model = graph.getModel();
        var layer = get_layer(self);

        var cx = 100;
        var cy = 16; // 14 fontSize
        var cy_sep = 4;

        var cells = [];

        /*------------------------------------------------------------*
         *      First Step: all keys (simple an complex) in a group
         *------------------------------------------------------------*/

        /*-----------------------------------------------*
         *      Firstly simple data
         *  HACK initially all cells belongs to layer,
         *  when grouping will belong to the group
         *-----------------------------------------------*/
        if(is_object(kw)) {
            for(var k in kw) {
                var v = kw[k];
                if(is_object(v) || is_array(v) || v["__mx_cell__"]) {
                    continue;
                }

                var style = "string";
                if(is_null(v)) {
                    style = "null";
                } else if(is_number(v)) {
                    style = "number";
                } else if(is_boolean(v)) {
                    style = "boolean";
                }

                var cell = graph.insertVertex(
                    layer,              // group
                    k,                  // id
                    v,                  // value
                    x, y,               // x,y
                    cx, cy,             // width,height
                    style,              // style
                    false               // relative
                );
                y += cy + cy_sep;
                graph.autoSizeCell(cell);
                cells.push(cell);
            }
        } else if(is_array(kw)) {
            for(var i=0; i<kw.length; i++) {
                var v = kw[i];
                if(is_object(v) || is_array(v) || v["__mx_cell__"]) {
                    continue;
                }

                var style = "string";
                if(is_null(v)) {
                    style = "null";
                } else if(is_number(v)) {
                    style = "number";
                } else if(is_boolean(v)) {
                    style = "boolean";
                }

                var cell = graph.insertVertex(
                    layer,              // group
                    k,                  // id
                    v,                  // value
                    x, y,               // x,y
                    cx, cy,             // width,height
                    style,              // style
                    false               // relative
                );
                y += cy + cy_sep;
                graph.autoSizeCell(cell);
                cells.push(cell);
            }
        }

        /*-------------------------------*
         *      First step
         *      Secondly complex data
         *-------------------------------*/
        if(is_object(kw)) {
            for(var k in kw) {
                var v = kw[k];
                if(!(is_object(v) || is_array(v)) || v["__mx_cell__"]) {
                    continue;
                }
                var cell = graph.insertVertex(
                    layer,              // group
                    k,                  // id
                    v,                  // value
                    x, y,               // x,y
                    cx, cy,             // width,height
                    "dict",             // style
                    false               // relative
                );
                y += cy + cy_sep;
                graph.autoSizeCell(cell);
                cells.push(cell);

                // Aki debe ir, pero no tengo el grupo todavia! TODO
                // TODO y el group?
                _load_json(self, x, y+group.geometry.height, v, cell)

            }
        } else if(is_array(kw)) {
            for(var i=0; i<kw.length; i++) {
                var v = kw[i];
                if(!(is_object(v) || is_array(v)) || v["__mx_cell__"]) {
                    continue;
                }
                var cell = graph.insertVertex(
                    layer,              // group
                    k,                  // id
                    v,                  // value
                    x, y,               // x,y
                    cx, cy,             // width,height
                    "list",             // style
                    false               // relative
                );
                y += cy + cy_sep;
                graph.autoSizeCell(cell);
                cells.push(cell);

                // Aki debe ir, pero no tengo el grupo todavia! TODO
                // TODO y el group?
                _load_json(self, x, y+group.geometry.height, v, cell)
            }
        }

        /*--------------------------------------------------------------*
         *      Create the group for all fields, simples and complexes
         *--------------------------------------------------------------*/
        var group = new mxCell("Yy", new mxGeometry(), // HACK no uses create_graph_style(), falla
            "whiteSpace=nowrap;html=1;fillColor=none;strokeColor=#006658;fontColor=#5C5C5C;dashed=1;rounded=1;labelPosition=center;verticalLabelPosition=top;align=left;verticalAlign=bottom;spacingTop=0;strokeWidth=1;"
        );
        group.setId("");
        group.setVertex(true);
        group.setConnectable(false);
        graph.groupCells(group, 15, cells);

        /*------------------------------------------------------------*
         *      Second Step: create the link of group (complex json)
         *      with our parent
         *------------------------------------------------------------*/
        /*------------------------------------------------------------*
         *      Third Step: recursive over complex data
         *------------------------------------------------------------*/
        if(is_object(kw)) {
            for(var k in kw) {
                var v = kw[k];
                if(!(is_object(v) || is_array(v))) {
                    continue;
                }
                // TODO y la cell?
                _load_json(self, x, y+group.geometry.height, v, cell)
            }
        } else if(is_array(kw)) {
            for(var i=0; i<kw.length; i++) {
                var v = kw[i];
                if(!(is_object(v) || is_array(v))) {
                    continue;
                }
                // TODO y la cell?
                _load_json(self, x, y+group.geometry.height, v, cell)
            }
        }
    }


    /************************************************************
     *
     ************************************************************/
    function load_json(self)
    {
        var json = __duplicate__(self.config.json_data);
        if(!json) {
            return;
        }

        var graph = self.config._mxgraph;
        var model = graph.getModel();
//         model.beginUpdate(); //TODO TEST para que pinte inmediatamente en debug
//         try {
            _load_json(self, 0, 0, json, get_layer(self));

//         } catch (e) {
//             log_error(e);
//         } finally {
//             model.endUpdate();
//         }
//
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
        self.config.json_data = kw;
        load_json(self);

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
        load_json(self);
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

