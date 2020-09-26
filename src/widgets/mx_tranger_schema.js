/***********************************************************************
 *          mx_tranger_schema.js
 *
 *          TimeRanger Schema with mxgrah
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
        panel_properties: {},   // creator can set Container Panel properties
        ui_properties: null,    // creator can set webix properties

        $ui: null,

        top_overlay_icon_size: 24,
        bottom_overlay_icon_size: 16,
        image_running: null,
        image_playing: null,
        image_service: null,
        image_unique: null,
        image_disabled: null,

        vertex_cx: 160,
        vertex_cy: 60,

        layers: [
            {
                id: "raw_topic",
                value: "Raw Topics"
            },
            {
                id: "msg2db_topic",
                value: "Msg2Db Topics"
            },
            {
                id: "treedb_topic",
                value: "TreeDb Topics"
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
         */
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
        var width = self.config.$ui.$width;
        var root = null;

        if(layers && layers.length) {
            var x = 0;
            var cx = width/(layers.length+1);

            root = new mxCell();
            root.setId("__mx_root__");

            for(var i=0; i<layers.length; i++) {
                var layer = layers[i];

                // Create the layer

                var __mx_cell__ = new mxCell(
                    kw_get_str(layer, "value", null, false),
                    new mxGeometry(x, 0, cx, 100),
                    ""
                );
                x += cx;

                root.insert(__mx_cell__);

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
            log_error(e);
        } finally {
            graph.getModel().endUpdate();
        }
    }

    /************************************************************
     *
     ************************************************************/
    function resize_layers(self)
    {
        var width = self.config.$ui.$width;
        var height = self.config.$ui.$height;
        var graph = self.config._mxgraph;
        var model = graph.getModel();
        var layers = self.config.layers;

        if(layers && layers.length) {
            var x = 0;
            var cx = width/(layers.length+1);

            model.beginUpdate();
            try {
                for(var i=0; i<layers.length; i++) {
                    var layer = layers[i];
                    var cell = layer["__mx_cell__"];

                    var geo = graph.getCellGeometry(cell).clone();
                    geo.x = x;
                    geo.width = cx;
                    model.setGeometry(cell, geo);
                    x += cx;
                }
                graph.view.setTranslate(graph.border/2, graph.border/2);

            } catch (e) {
                log_error(e);
            } finally {
                model.endUpdate();
            }
        }
    }

    /************************************************************
     *
     ************************************************************/
    function get_layer(self, layer)
    {
        var layers = self.config.layers;
        for(var i=0; i<layers.length; i++) {
            if(layers[i].id == layer) {
                return layers[i].__mx_cell__;
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
                return "treedb_topic";
            }
            if(kw_has_key(lists[0], "msg2db_name")) {
                return "msg2db_topic";
            }
        }

        return "raw_topic";
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

        // Set stylesheet options
        create_graph_style(
            graph,
            "raw_topic",
            "text;html=1;strokeColor=#d6b656;fillColor=#fff2cc;align=center;verticalAlign=middle;whiteSpace=wrap;overflow=hidden;gradientColor=#ffffff;shadow=1;fontSize=13;"
        );
        create_graph_style(
            graph,
            "msg2db_topic",
            "text;html=1;strokeColor=#82b366;fillColor=#d5e8d4;align=center;verticalAlign=middle;whiteSpace=wrap;overflow=hidden;gradientColor=#ffffff;shadow=1;fontSize=13;"
        );
        create_graph_style(
            graph,
            "treedb_topic",
            "text;html=1;strokeColor=#6c8ebf;fillColor=#dae8fc;align=center;verticalAlign=middle;whiteSpace=wrap;overflow=hidden;gradientColor=#ffffff;shadow=1;fontSize=13;"
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
        graph.setHtmlLabels(true);
        graph.getLabel = function(cell) {
            if (this.getModel().isVertex(cell)) {
                return cell.id;
            }
            return "";
        };

        /*
         *  Own getTooltip
         */
        graph.setTooltips(true);
        graph.getTooltip = function(state) {
            if(state.cell.value.topic_name) {
                return state.cell.value.topic_name;
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
    }

    /************************************************************
     *
     ************************************************************/
    function load_topics(self, graph, tranger_name, topics)
    {
        var model = graph.getModel();
        var cx = self.config.vertex_cx;
        var cy = self.config.vertex_cy;
        var raw_y = 0;
        var treedb_y = 0;
        var msg2db_y = 0;
        var cy_sep = 40;

        for(var topic_name in topics) {
            if(!topics.hasOwnProperty(topic_name)) {
                continue;
            }
            var topic = topics[topic_name];
            var topic_type = get_topic_type(topic);
            switch(topic_type) {
                case "treedb_topic":
                    graph.insertVertex(
                        get_layer(self, topic_type),    // group
                        topic.topic_name,       // id
                        topic,                  // value
                        0, treedb_y,            // x,y
                        cx, cy,                 // width,height
                        topic_type,             // style
                        false                   // relative
                    );
                    treedb_y += cy + cy_sep;
                    break;

                case "msg2db_topic":
                    graph.insertVertex(
                        get_layer(self, topic_type),    // group
                        topic.topic_name,       // id
                        topic,                  // value
                        0, msg2db_y,            // x,y
                        cx, cy,                 // width,height
                        topic_type,             // style
                        false                   // relative
                    );
                    msg2db_y += cy + cy_sep;
                    break;

                case "raw_topic":
                default:
                    graph.insertVertex(
                        get_layer(self, topic_type),    // group
                        topic.topic_name,       // id
                        topic,                  // value
                        0, raw_y,               // x,y
                        cx, cy,                 // width,height
                        topic_type,             // style
                        false                   // relative
                    );
                    raw_y += cy + cy_sep;
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

        var topics = data.topics;
        load_topics(self, graph, tranger_name, topics);
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
        self.config.$container_parent.removeView(self.config.$ui);
        rebuild(self);
        self.config.$container_parent.addView(self.config.$ui, idx);
        self.config.$ui.show();
        resize_layers(self)

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
        resize_layers(self);
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

    var Mx_tranger_schema = GObj.__makeSubclass__();
    var proto = Mx_tranger_schema.prototype; // Easy access to the prototype
    proto.__init__= function(name, kw) {
        GObj.prototype.__init__.call(
            this,
            FSM,
            CONFIG,
            name,
            "Mx_tranger_schema",
            kw,
            0
        );
        return this;
    };
    gobj_register_gclass(Mx_tranger_schema, "Mx_tranger_schema");




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
    exports.Mx_tranger_schema = Mx_tranger_schema;

})(this);
