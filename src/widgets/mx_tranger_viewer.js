/***********************************************************************
 *          mx_tranger_viewer.js
 *
 *          TimeRanger Viewer with mxgrah, jsoneditor and formtable
 *
 *          "Container Panel"
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

        top_overlay_icon_size: 24,
        bottom_overlay_icon_size: 16,

        image_topic_json_graph: null,
        image_formtable: null,
        image_data_in_disk: null,
        image_data_in_memory: null,
        image_data_on_moving: null,

        tranger: null,
        layer_title_height: 30,
        locked: true,

        layers: [
            {
                id: "raws",
                title: "Raw Topics",
                y: 0,
                cy_sep: 40,
                cx: 250
            },
            {
                id: "msg2dbs",
                title: "Msg2Db Topics",
                y: 0,
                cy_sep: 60,
                cx: 250
            },
            {
                id: "treedbs",
                title: "TreeDb Topics",
                y: 0,
                cy_sep: 60,
                cx: 400
            }
        ],
        _mxgraph: null,

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
     *
     ************************************************************/
    function load_icons(self)
    {
        /*
         *  Load control button images
         *
         *  datos historicos, datos en disco,
         *  datos en memoria, datos en tiempo real
         *
         *  diskette: datos en disco (diskette refleja fragilidad, necesidad de mantener copias)
         *  pull_down: datos en memoria (snap, flash) Organización jerárquica en memoria
         *             los de arriba empujan, organizan, controlan, monitorizan, a los de abajo.
         *             Imagen, instantanea del momento en el que se recoge.
         *  bacteria: datos en movimiento (realtime), los datos estaticos, para que valen?
         *            los datos están para moverse. O para estar quietos en paz?
         *            los datos moviéndose y reproduciéndose
         *                  acaso no es eso una bacteria, un virus?
         */

        self.config.image_topic_json_graph = new mxImage(
            '/static/app/images/yuneta/json_graph.svg',
            self.config.top_overlay_icon_size, self.config.top_overlay_icon_size
        );
        self.config.image_formtable = new mxImage(
            '/static/app/images/yuneta/formtable.svg',
            self.config.top_overlay_icon_size, self.config.top_overlay_icon_size
        );
        self.config.image_data_in_disk = new mxImage(
            '/static/app/images/yuneta/threads.svg',
            self.config.top_overlay_icon_size, self.config.top_overlay_icon_size
        );
        self.config.image_data_in_memory = new mxImage(
            '/static/app/images/yuneta/pull_down.svg',
            self.config.top_overlay_icon_size, self.config.top_overlay_icon_size
        );
        self.config.image_data_on_moving = new mxImage(
            '/static/app/images/yuneta/sequence.svg',
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
                        url:'/static/app/images/yuneta/topic_schema.svg',
                        help: "Show topic schema"
                    },
                    {
                        url:'/static/app/images/yuneta/threads.svg',
                        help: "View data in disk (historic)"
                    },
                    {
                        url:'/static/app/images/yuneta/pull_down.svg',
                        help: "View data in memory (snap)"
                    },
                    {
                        url:'/static/app/images/yuneta/sequence.svg',
                        help: "View data on moving (realtime)"
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
                    view:"button",
                    type: "icon",
                    icon: "fad fa-compress-arrows-alt",
                    css: "webix_transparent btn_icon_toolbar_16",
                    maxWidth: 120,
                    label: t("reset view"),
                    click: function() {
                        var graph = self.config._mxgraph;
                        graph.view.scaleAndTranslate(1, graph.border/2, graph.border/2);
                        //graph.getView().translate = new mxPoint(graph.border/2, graph.border/2);
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
     *  Create root and layers
     ********************************************/
    function create_root_and_layers(self)
    {
        var graph = self.config._mxgraph;
        var layers = self.config.layers;
        var root = null;

        if(layers && layers.length) {
            var x = 0;
            var cx = 0;

            /*
             *  Create the root
             */
            root = new mxCell();
            root.setId("__mx_root__");

            for(var i=0; i<layers.length; i++) {
                var layer = layers[i];

                /*
                 *  Create a layer
                 */
                cx = kw_get_int(layer, "cx", 200, false);
                var __layer__ = new mxCell(
                    kw_get_str(layer, "value", "", false),
                    new mxGeometry(x, 0, cx, 100),
                    ""
                );
                x += cx;

                root.insert(__layer__);

                // Set reference
                layer["__layer__"] = __layer__;

                var id = kw_get_str(layer, "id", "", false);
                if(id) {
                    __layer__.setId(id);
                }
            }
        } else {
            root = graph.getModel().createRoot()
        }

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
    function get_layer_record(self, layer_id)
    {
        var layers = self.config.layers;
        for(var i=0; i<layers.length; i++) {
            if(layers[i].id == layer_id) {
                return layers[i];
            }
        }
        return null;
    }

    /************************************************************
     *
     ************************************************************/
    function get_layer(self, layer_id)
    {
        var layers = self.config.layers;
        for(var i=0; i<layers.length; i++) {
            if(layers[i].id == layer_id) {
                return layers[i].__layer__;
            }
        }
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
                return "treedbs";
            }
            if(kw_has_key(lists[0], "msg2db_name")) {
                return "msg2dbs";
            }
        }

        return "raws";
    }

    /************************************************************
     *
     ************************************************************/
    function add_overlays(self, graph, cell)
    {
        if(cell.style == "title") {
            return;
        }

        var model = graph.getModel();
        model.beginUpdate();
        try {
            var offsy = self.config.top_overlay_icon_size/2;
            var offsx = self.config.top_overlay_icon_size + 5;

            if(cell.value && cell.value.cols &&  Object.keys(cell.value.cols).length > 0) {
                var overlay_role = new mxCellOverlay(
                    self.config.image_topic_json_graph,
                    "Show Topic Json Graph",        // tooltip
                    mxConstants.ALIGN_LEFT,     // horizontal align ALIGN_LEFT,ALIGN_CENTER,ALIGN_RIGH>
                    mxConstants.ALIGN_TOP,      // vertical align  ALIGN_TOP,ALIGN_MIDDLE,ALIGN_BOTTOM
                    new mxPoint(1*offsx - offsy, -offsy),    // offset
                    "pointer"                   // cursor
                );
                graph.addCellOverlay(cell, overlay_role);

                // Installs a handler for clicks on the overlay
                overlay_role.addListener(mxEvent.CLICK, function(sender, evt2) {
                    var topic = evt2.getProperty('cell').value;
                    self.parent.gobj_send_event(
                        "EV_MX_SHOW_TOPIC_JSON_GRAPH",
                        {
                            topic_name: topic.topic_name,
                            image: self.config.image_topic_json_graph.src,
                            topic: topic
                        },
                        self
                    );
                });

                var overlay_role = new mxCellOverlay(
                    self.config.image_formtable,
                    "Show Topic Schema FormTable",    // tooltip
                    mxConstants.ALIGN_LEFT,     // horizontal align ALIGN_LEFT,ALIGN_CENTER,ALIGN_RIGH>
                    mxConstants.ALIGN_TOP,      // vertical align  ALIGN_TOP,ALIGN_MIDDLE,ALIGN_BOTTOM
                    new mxPoint(2*offsx - offsy, -offsy),   // offset
                    "pointer"                   // cursor
                );
                graph.addCellOverlay(cell, overlay_role);

                // Installs a handler for clicks on the overlay
                overlay_role.addListener(mxEvent.CLICK, function(sender, evt2) {
                    var topic = evt2.getProperty('cell').value;
                    self.parent.gobj_send_event(
                        "EV_MX_SHOW_TOPIC_SCHEMA_FORM",
                        {
                            topic_name: topic.topic_name,
                            image: self.config.image_formtable.src,
                            topic: topic
                        },
                        self
                    );
                });
            }

            if(1) {
                var overlay_instance = new mxCellOverlay(
                    self.config.image_data_in_disk,
                    "View data in disk (historic)",        // tooltip
                    mxConstants.ALIGN_RIGH,     // horizontal align ALIGN_LEFT,ALIGN_CENTER,ALIGN_RIGH>
                    mxConstants.ALIGN_TOP,      // vertical align  ALIGN_TOP,ALIGN_MIDDLE,ALIGN_BOTTOM
                    new mxPoint(-offsx*3 + offsy, -offsy),   // offset
                    "pointer"                   // cursor
                );
                graph.addCellOverlay(cell, overlay_instance);

                // Installs a handler for clicks on the overlay
                overlay_instance.addListener(mxEvent.CLICK, function(sender, evt2) {
                    var topic = evt2.getProperty('cell').value;
                    self.parent.gobj_send_event(
                        "EV_MX_VIEW_DATA_IN_DISK",
                        topic,
                        self
                    );
                });
            }

            if(1) {
                var overlay_instance = new mxCellOverlay(
                    self.config.image_data_in_memory,
                    "View data in memory (snap)",        // tooltip
                    mxConstants.ALIGN_RIGH,     // horizontal align ALIGN_LEFT,ALIGN_CENTER,ALIGN_RIGH>
                    mxConstants.ALIGN_TOP,      // vertical align  ALIGN_TOP,ALIGN_MIDDLE,ALIGN_BOTTOM
                    new mxPoint(-offsx*2 + offsy, -offsy),   // offset
                    "pointer"                   // cursor
                );
                graph.addCellOverlay(cell, overlay_instance);

                // Installs a handler for clicks on the overlay
                overlay_instance.addListener(mxEvent.CLICK, function(sender, evt2) {
                    var topic = evt2.getProperty('cell').value;
                    self.parent.gobj_send_event(
                        "EV_MX_VIEW_DATA_IN_MEMORY",
                        topic,
                        self
                    );
                });
            }

            if(1) {
                var overlay_instance = new mxCellOverlay(
                    self.config.image_data_on_moving,
                    "View data on moving (realtime)",        // tooltip
                    mxConstants.ALIGN_RIGH,     // horizontal align ALIGN_LEFT,ALIGN_CENTER,ALIGN_RIGH>
                    mxConstants.ALIGN_TOP,      // vertical align  ALIGN_TOP,ALIGN_MIDDLE,ALIGN_BOTTOM
                    new mxPoint(-offsx*1 + offsy, -offsy),   // offset
                    "pointer"                   // cursor
                );
                graph.addCellOverlay(cell, overlay_instance);

                // Installs a handler for clicks on the overlay
                overlay_instance.addListener(mxEvent.CLICK, function(sender, evt2) {
                    var topic = evt2.getProperty('cell').value;
                    self.parent.gobj_send_event(
                        "EV_MX_VIEW_DATA_ON_MOVING",
                        topic,
                        self
                    );
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
            "raws",
            "text;html=1;strokeColor=#d6b656;fillColor=#fff2cc;align=left;verticalAlign=top;whiteSpace=wrap;overflow=hidden;gradientColor=#ffffff;shadow=1;spacingLeft=10;spacingTop=5;fontSize=12;"
        );
        create_graph_style(
            graph,
            "msg2dbs",
            "text;html=1;strokeColor=#82b366;fillColor=#d5e8d4;align=left;verticalAlign=top;whiteSpace=wrap;overflow=hidden;gradientColor=#ffffff;shadow=1;spacingLeft=10;spacingTop=5;fontSize=12;"
        );
        create_graph_style(
            graph,
            "treedbs",
            "text;html=1;strokeColor=#6c8ebf;fillColor=#dae8fc;align=left;verticalAlign=top;whiteSpace=wrap;overflow=hidden;gradientColor=#ffffff;shadow=1;spacingLeft=10;spacingTop=5;fontSize=12;"
        );
        create_graph_style(
            graph,
            "title",
            "text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=top;whiteSpace=wrap;rounded=0;shadow=1;glass=0;sketch=0;fontSize=16;fontColor=orange;spacingLeft=10;spacingTop=5;fontStyle=1;"
        );

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
                        t += "rows: <pre style='display:inline'>" +
                            cell.value.__last_rowid__ +
                            "</pre><br/>";
                    }

                    if(kw_has_key(cell.value, "topic_version")) {
                        t += "topic_version: <pre style='display:inline'>" +
                            cell.value.topic_version +
                            "</pre><br/>";
                        if(cell.value.schema_modified) {
                            var id = "btn_save_topic_schema-" + cell.value.topic_name;
                            t += "<input " +
                                "id='" + id + "' " +
                                "style='cursor:default' " +
                                "type='image' src='" +
                                "/static/app/images/yuneta/save.svg" +
                                "' alt='Submit' " +
                                "width='" +
                                self.config.top_overlay_icon_size +
                                "' " +
                                "height='" +
                                self.config.top_overlay_icon_size +
                                "'>"
                        }
                    }
                    if(kw_has_key(cell.value, "schema_version")) {
                        t += "schema_version: <pre style='display:inline'>" +
                            cell.value.schema_version +
                            "</pre><br/>";
                        if(cell.value.schema_modified) {
                            var id = "btn_save_all_schemas-" + cell.value.schema_name;
                            t += "<input " +
                                "id='" + id + "' " +
                                "type='image' src='" +
                                "/static/app/images/yuneta/save.svg" +
                                "' alt='Submit' " +
                                "width='" +
                                self.config.top_overlay_icon_size +
                                "' " +
                                "height='" +
                                self.config.top_overlay_icon_size +
                                "'>"
                        }
                    }
                }
                switch(cell.style) {
                    case "raws":
                        break;
                    case "msg2dbs":
                        break;
                    case "treedbs":
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
        graph.getTooltipForCell = function(cell) {
            var tip = null;
            if (cell != null && cell.getTooltip != null) {
                tip = cell.getTooltip();
            } else {
                if(cell.value.topic_name) {
                    return cell.value.topic_name;
                }
            }
            return tip;
        };

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
                        add_overlays(self, graph, cell);
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
    function get_schema_version(self, tranger, type)
    {
        var dbs = tranger[type];
        for(var name in dbs) {
            if(!dbs.hasOwnProperty(name)) {
                continue;
            }
            // TODO by now only one db by type, return the first
            var db = dbs[name];
            if(kw_has_key(db, "__schema_version__")) {
                return [name, db.__schema_version__];
            }
        }
    }

    /************************************************************
     *
     ************************************************************/
    function load_title_layers(self, graph, tranger)
    {
        var layers = self.config.layers;

        for(var i=0; i<layers.length; i++) {
            var layer_record = layers[i];
            var cx = kw_get_int(layer_record, "cx", 200, false);

            switch(layer_record.id) {
                case "treedbs":
                    var schema_node = get_schema_version(self, tranger, layer_record.id);
                    var schema_name = schema_node[0];
                    var schema_version = schema_node[1];
                    var cy = self.config.layer_title_height*2;
                    graph.insertVertex(
                        layer_record.__layer__,                 // group
                        layer_record.title,                     // id
                        {                                       // value
                            schema_type: layer_record.id,
                            schema_name: schema_name,
                            schema_version: schema_version
                        },
                        0, layer_record.y,                      // x,y
                        cx-20, cy,                              // width,height
                        "title",                                // style
                        false                                   // relative
                    );
                    layer_record.y += cy + layer_record.cy_sep;
                    break;

                case "msg2dbs":
                    var schema_node = get_schema_version(self, tranger, layer_record.id);
                    var schema_name = schema_node[0];
                    var schema_version = schema_node[1];
                    var cy = self.config.layer_title_height*2;
                    graph.insertVertex(
                        layer_record.__layer__,                 // group
                        layer_record.title,                     // id
                        {                                       // value
                            schema_type: layer_record.id,
                            schema_name: schema_name,
                            schema_version: schema_version
                        },
                        0, layer_record.y,                      // x,y
                        cx-20, cy,                              // width,height
                        "title",                                // style
                        false                                   // relative
                    );
                    layer_record.y += cy + layer_record.cy_sep;
                    break;

                case "raws":
                default:
                    var cy = self.config.layer_title_height;
                    graph.insertVertex(
                        layer_record.__layer__,                 // group
                        layer_record.title,                     // id
                        {                                       // value
                        },
                        0, layer_record.y,                      // x,y
                        cx-20, cy,                              // width,height
                        "title",                                // style
                        false                                   // relative
                    );
                    layer_record.y += cy + layer_record.cy_sep;
            }
        }
    }

    /************************************************************
     *
     ************************************************************/
    function load_topics(self, graph, topics)
    {
        var model = graph.getModel();

        var raw_cx = 200;
        var msg2db_cx = 200;
        var treedb_cx = 200;

        var raw_cy = 80;
        var msg2db_cy = 130;
        var treedb_cy = 110;

        for(var topic_name in topics) {
            if(!topics.hasOwnProperty(topic_name)) {
                continue;
            }
            var topic = topics[topic_name];
            var topic_type = get_topic_type(topic);
            var layer_record = get_layer_record(self, topic_type);
            switch(topic_type) {
                case "treedbs":
                    var cx = treedb_cx;
                    var cy = treedb_cy;
                    graph.insertVertex(
                        layer_record.__layer__, // group
                        topic.topic_name,       // id
                        topic,                  // value
                        0, layer_record.y,      // x,y
                        cx, cy,                 // width,height
                        topic_type,             // style
                        false                   // relative
                    );
                    layer_record.y += cy + layer_record.cy_sep;;
                    break;

                case "msg2dbs":
                    var cx = msg2db_cx;
                    var cy = msg2db_cy;
                    graph.insertVertex(
                        layer_record.__layer__, // group
                        topic.topic_name,       // id
                        topic,                  // value
                        0, layer_record.y,      // x,y
                        cx, cy,                 // width,height
                        topic_type,             // style
                        false                   // relative
                    );
                    layer_record.y += cy + layer_record.cy_sep;;
                    break;

                case "raws":
                default:
                    var cx = raw_cx;
                    var cy = raw_cy;
                    graph.insertVertex(
                        layer_record.__layer__, // group
                        topic.topic_name,       // id
                        topic,                  // value
                        0, layer_record.y,      // x,y
                        cx, cy,                 // width,height
                        topic_type,             // style
                        false                   // relative
                    );
                    layer_record.y += cy + layer_record.cy_sep;;
                    break;
            }
        }
    }

    /************************************************************
     *
     ************************************************************/
    function load_tranger(self, tranger_name, data, layer)
    {
        // HACK is already in a beginUpdate/endUpdate
        var graph = self.config._mxgraph;

        self.config.tranger = data;
        load_title_layers(self, graph, data);
        load_topics(self, graph, data.topics);
        graph.view.setTranslate(graph.border/2, graph.border/2);
    }




            /***************************
             *      Actions
             ***************************/




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

        var layers = self.config.layers;
        for(var i=0; i<layers.length; i++) {
            layers[i].y = 0;
        }

        return 0;
    }

    /********************************************
     *
     ********************************************/
    function ac_schema_modified(self, event, kw, src)
    {
        var graph = self.config._mxgraph;
        var cell = graph.model.getCell(kw.id);
        if(cell) {
            graph.setSelectionCell(cell); // Callback mxEvent.CHANGE will be called

            var topic = self.config.tranger.topics[cell.value.topic_name];
            var topic_type = get_topic_type(topic);
            var layer_record = get_layer_record(self, topic_type);
            var cell_title = graph.model.getCell(layer_record.title);
            cell_title.value["schema_modified"] = true;
            graph.refresh(cell_title);

            var elem = document.getElementById("btn_save_topic_schema-" + topic.topic_name);
            elem.onclick = function() {
                // FUTURE when schema will be in treedb then individual topi schema could be saved
                //self.parent.gobj_send_event(
                //    "EV_MX_SAVE_TOPIC_SCHEMA",
                //    {
                //        topic: cell.value
                //    },
                //    self
                //);
            }
            var elem = document.getElementById(
                "btn_save_all_schemas-" + cell_title.value.schema_name
            );
            elem.onclick = function() {
                self.parent.gobj_send_event(
                    "EV_MX_SAVE_TRANGER_SCHEMA",
                    cell_title.value,
                    self
                );
            }
        }

        return 0;
    }

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
        var graph = self.config._mxgraph;
        var cell = graph.model.getCell(kw.id);
        if(cell) {
            graph.setSelectionCell(cell); // Callback mxEvent.CHANGE will be called
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
            "EV_LOAD_DATA",
            "EV_CLEAR_DATA",
            "EV_SCHEMA_MODIFIED",
            "EV_CLICK_ITEM",
            "EV_SELECT_ITEM",
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
                ["EV_LOAD_DATA",            ac_load_data,       undefined],
                ["EV_CLEAR_DATA",           ac_clear_data,      undefined],
                ["EV_SCHEMA_MODIFIED",      ac_schema_modified, undefined],
                ["EV_CLICK_ITEM",           ac_click_item,      undefined],
                ["EV_SELECT_ITEM",          ac_select_item,     undefined],
                ["EV_SELECT",               ac_select,          undefined],
                ["EV_REFRESH",              ac_refresh,         undefined],
                ["EV_REBUILD_PANEL",        ac_rebuild_panel,   undefined]
            ]
        }
    };

    var Mx_tranger_viewer = GObj.__makeSubclass__();
    var proto = Mx_tranger_viewer.prototype; // Easy access to the prototype
    proto.__init__= function(name, kw) {
        GObj.prototype.__init__.call(
            this,
            FSM,
            CONFIG,
            name,
            "Mx_tranger_viewer",
            kw,
            0
        );
        return this;
    };
    gobj_register_gclass(Mx_tranger_viewer, "Mx_tranger_viewer");




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
    exports.Mx_tranger_viewer = Mx_tranger_viewer;

})(this);
