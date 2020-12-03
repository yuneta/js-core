/***********************************************************************
 *          mx_nodes_tree.js
 *
 *          Mix "Container Panel" & "Pinhold Window"
 *
 *          Treedb's Nodes Tree Manager
 *
 *          HACK the parent MUST be a pinhold handler if the role is "Pinhold Window"
 *               or MUST be a container if the role is "Container Panel"
 *
 *          HACK But you can redirect the output events to "subscriber" gobj
 *
 *
 *
 *  Each Vertex Cell contains in his value a node of a treedb topic:

    {
        cell_name: null,        // cell id: treedb_name`topic_name^record_id, null in new records
        schema: schema,         // Schema of topic
        record: null,           // Data of node
        tosave_red: true,       // Pending to save with not fixed errors
        tosave_green: false     // Pending to save with good data
    },

 *
 *
 *
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
        //////////////// Common Attributes //////////////////
        subscriber: null,       // Subscriber of published events, by default the parent.
        is_pinhold_window: false, // By default it's a Container Panel
        panel_properties: {},   // creator can set "Container Panel" properties
        window_properties: {},  // creator can set "Pinhold Window" properties
        ui_properties: null,    // creator can set webix properties
        $ui: null,
        $ui_fullscreen: null,   // Which part of window will be fullscreened "Pinhold Window"
        resizing_event_id: null,// Used by pinhold_panel_top_toolbar "Pinhold Window"
        pinpushed: false,       // Handle by pinhold top toobar "Pinhold Window"
        window_image: "",       // Used by pinhold_panel_top_toolbar "Pinhold Window"
        window_title: "",       // Used by pinhold_panel_top_toolbar "Pinhold Window"
        left: 0,                // Used by pinhold_panel_top_toolbar "Pinhold Window"
        top: 0,                 // Used by pinhold_panel_top_toolbar "Pinhold Window"
        width: 600,             // Used by pinhold_panel_top_toolbar "Pinhold Window"
        height: 500,            // Used by pinhold_panel_top_toolbar "Pinhold Window"

        //////////////// Particular Attributes //////////////////
        descs: null,        // all treedb topic's desc
        treedb_name: null,  // treedb editing
        topics_name: null,  // topics_name editing
        graph_styles: null,

        locked: false, // TODO dejalo en true inicialmente
        fitted: false,
        collapsed: true,
        foldable_icon_size: 16,
        top_overlay_icon_size: 24,
        image_json_graph: null,
        image_formtable: null,
        image_data_in_disk: null,
        image_data_in_memory: null,
        image_data_on_moving: null,
        image_save_red: null,
        image_save_green: null,
        image_delete: null,
        image_collapsed: null,
        image_expanded: null,

        // port_position: top, bottom, left, right
        hook_port_position: "bottom",
        fkey_port_position: "top",
        hook_port_cx: 20,
        hook_port_cy: 20,
        fkey_port_cx: 20,
        fkey_port_cy: 20,

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
                    layout.levelDistance = 50;
                    layout.nodeDistance = 30;
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

        //////////////////////////////////
        __writable_attrs__: [
            ////// Common /////
            "window_title",
            "window_image",
            "left",
            "top",
            "width",
            "height",
            "pinpushed",

            ////// Particular /////
            "layout_selected",
            "fitted",
            "collapsed"
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
     *
     ************************************************************/
    function build_cell_name(self, topic_name, id)
    {
        return self.config.treedb_name + "'" + topic_name + "'" + id;
    }

    /************************************************************
     *
     ************************************************************/
    function load_icons(self)
    {
        /*
         *  Load control button images
         */
        self.config.image_folder_tree = new mxImage(
            '/static/app/images/yuneta/folder-tree.svg',
            self.config.top_overlay_icon_size, self.config.top_overlay_icon_size
        );
        self.config.image_json_graph = new mxImage(
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
        self.config.image_save_green = new mxImage(
            '/static/app/images/yuneta/save_green.svg',
            self.config.top_overlay_icon_size, self.config.top_overlay_icon_size
        );
        self.config.image_save_red = new mxImage(
            '/static/app/images/yuneta/save_red.svg',
            self.config.top_overlay_icon_size, self.config.top_overlay_icon_size
        );
        self.config.image_delete = new mxImage(
            '/static/app/images/yuneta/delete.svg',
            self.config.top_overlay_icon_size, self.config.top_overlay_icon_size
        );
        self.config.image_collapsed = new mxImage(
            '/static/app/images/yuneta/plus-square.svg',
            self.config.foldable_icon_size, self.config.foldable_icon_size
        );
        self.config.image_expanded = new mxImage(
            '/static/app/images/yuneta/minus-square.svg',
            self.config.foldable_icon_size, self.config.foldable_icon_size
        );
    }

    /************************************************************
     *   Rebuild
     ************************************************************/
    function rebuild(self)
    {
        if($$(build_name(self, "create_menu_popup"))) {
            $$(build_name(self, "create_menu_popup")).destructor();
        }

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
   }

    /************************************************************
     *   Webix UI
     ************************************************************/
    function build_webix(self)
    {
        /*---------------------------------------*
         *      Particular UI code
         *---------------------------------------*/
        /*
         *  Once inside a fullscreen, you CANNOT set fullscreen AGAIN
         *  You can check if it's already in fullscreen with:

            if(this.getTopParentView().config.fullscreen) {
                // En fullscreen es un desastre si reconstruimos webix
                // o volvemos a poner en fullscreen.
                // Solo puede existir un $ui en fullscreen a la vez!!
            }
         */

        /*---------------------------------------*
         *      Menu "account" (user)
         *---------------------------------------*/
        webix.ui({
            view: "popup",
            id: build_name(self, "create_menu_popup"),
            width: 200,
            body: {
                id: build_name(self, "create_menu"),
                view: "menu",
                layout: "y",
                template: "#value#",
                autoheight: true,
                select: true,
                click: function(id, e, node) {
                    this.hide();
                    self.gobj_send_event("EV_CREATE_VERTEX", {topic_name: id}, self);
                }
            },
            on: {
                "onShow": function(e) {
                    $$(build_name(self, "create_menu")).unselectAll();
                }
            }
        }).hide();

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
                    icon: "fas fa-layer-plus",
                    css: "webix_transparent icon_toolbar_16",
                    label: t("create"),
                    popup: build_name(self, "create_menu_popup")
                },
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

                            self.gobj_save_persistent_attrs();
                        }
                    }
                },
                {
                    view:"button",
                    type: "icon",
                    icon: "",
                    icon: self.config.fitted? "fad fa-compress-arrows-alt":"fad fa-expand-arrows-alt",
                    css: "webix_transparent icon_toolbar_16",
                    maxWidth: 120,
                    label: self.config.fitted? t("reset view"):t("fit"),
                    click: function() {
                        var graph = self.config._mxgraph;
                        if(self.config.fitted) {
                            self.config.fitted = false;
                            graph.view.scaleAndTranslate(1, graph.border, graph.border);
                            this.define("icon", "fad fa-expand-arrows-alt");
                            this.define("label", t("fit"));
                        } else {
                            graph.fit();
                            self.config.fitted = true;
                            this.define("icon", "fad fa-compress-arrows-alt");
                            this.define("label",  t("reset view"));
                        }
                        this.refresh();
                        self.gobj_save_persistent_attrs();
                    }
                },
                {
                    view:"button",
                    type: "icon",
                    icon: "",
                    icon: self.config.collapsed? "far fa-plus-square":"far fa-minus-square",
                    css: "webix_transparent icon_toolbar_16",
                    maxWidth: 120,
                    label: self.config.collapsed? t("expand"):t("collapse"),
                    click: function() {
                        if(self.config.collapsed) {
                            self.config.collapsed = false;
                            this.define("icon", "far fa-minus-square");
                            this.define("label", t("collapse"));
                        } else {
                            self.config.collapsed = true;
                            this.define("icon", "far fa-plus-square");
                            this.define("label", t("expand"));
                        }
                        this.refresh();
                        self.gobj_save_persistent_attrs();
                        collapse_edition(self, self.config.collapsed);
                    }
                },
                {
                    view:"button",
                    type: "icon",
                    icon: "far fa-search-plus",
                    css: "webix_transparent icon_toolbar_16",
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
                            unlock_graph(self, graph);
                            this.define("icon", "far fa-lock-open-alt");
                            this.define("label", t("lock vertices"));
                        } else {
                            lock_graph(self, graph);
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
                    icon: "fas fa-folder-tree",
                    css: "webix_transparent icon_toolbar_16",
                    maxWidth: 120,
                    label: t("Mxgraph"),
                    click: function() {
                        var n = "Json Mxgraph Inside: " + self.name;
                        var gobj_je = __yuno__.gobj_find_unique_gobj(n);
                        if(!gobj_je) {
                            gobj_je = __yuno__.gobj_create_unique(
                                n,
                                Je_viewer,
                                {
                                    window_title: n,
                                    width: 900,
                                    height: 600
                                },
                                __yuno__.__pinhold__
                            );
                            gobj_je.gobj_start();
                        }
                        gobj_je.gobj_send_event(
                            "EV_SHOW",
                            {},
                            self
                        );
                        gobj_je.gobj_send_event(
                            "EV_CLEAR_DATA",
                            {},
                            self
                        );
                        gobj_je.gobj_send_event(
                            "EV_LOAD_DATA",
                            {data: mxgraph2json(self.config._mxgraph)},
                            self
                        );
                    }
                },
                {
                    view:"button",
                    type: "icon",
                    icon: "far fa-question",
                    css: "webix_transparent icon_toolbar_16",
                    maxWidth: 120,
                    label: t("help"),
                    click: function() {
                        var $help_window = $$(build_name(self, "help_window"));
                        if($help_window) {
                            if($help_window.isVisible()) {
                                $help_window.hide();
                            } else {
                                $help_window.show();
                            }
                        }
                    }
                }
            ]
        };

        var mx_events = [
            mxEvent.CLICK,
            mxEvent.MOVE_CELLS,
            mxEvent.RESIZE_CELLS,
            mxEvent.ADD_CELLS,
            mxEvent.CONNECT_CELL
        ];

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
                // HACK can be a global gobj, use gclass_name+name
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
                    ////////////////// REPEATED webix code /////////////////
                    // WARNING Please, put your code outside, here only simple variable names
                    rows: [
                        {
                            view: "mxgraph",
                            id: build_name(self, "mxgraph"),
                            events: mx_events,
                            gobj: self
                        },
                        bottom_toolbar
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
                    {
                        view: "mxgraph",
                        id: build_name(self, "mxgraph"),
                        all_events: false,
                        events: mx_events,
                        gobj: self
                    },
                    bottom_toolbar
                ]
                ////////////////// webix code /////////////////
            });
        }
        self.config.$ui.gobj = self;
        // $$("cmenu").attachTo($$(build_name(self, "mx_tree"))); TODO

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
                self.parent.gobj_send_event("EV_ON_VIEW_SHOW", self, self);
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
        var model = graph.getModel();
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
            model.beginUpdate();
            try {
                cur_layout.exe.execute(group);
            } catch (e) {
                log_error(e);
            } finally {
                model.endUpdate();
            }
        }

        if(self.config.fitted) {
            graph.fit();
        } else {
            graph.view.scaleAndTranslate(1, graph.border, graph.border);
        }
        if(locked) {
            graph.setCellsLocked(true);
        }
    }

    /********************************************
     *
     ********************************************/
    function collapse_edition(self, collapse)
    {
        var graph = self.config._mxgraph;
        var model = graph.getModel();
        var layer = get_layer(self, layer);

        var cells = kw_collect(layer.children, {vertex:true});
        model.beginUpdate();
        try {
            graph.clearSelection();
            graph.foldCells(collapse, false, cells, true);

        } catch (e) {
            log_error(e);
        } finally {
            model.endUpdate();
        }
    }

    /********************************************
     *  Create root and layers
     ********************************************/
    function create_root_and_layers(self)
    {
        var graph = self.config._mxgraph;
        var layers = self.config.layers;
        var root = null;

        root = graph.getModel().createRoot()

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
    function get_layer(self, layer_id)
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

//         style[mxConstants.STYLE_EDGE] = mxEdgeStyle.ElbowConnector;
//         style[mxConstants.STYLE_EDGE] = mxEdgeStyle.EntityRelation;
//         style[mxConstants.STYLE_EDGE] = mxEdgeStyle.Loop;
//         style[mxConstants.STYLE_EDGE] = mxEdgeStyle.SideToSide;
//         style[mxConstants.STYLE_EDGE] = mxEdgeStyle.TopToBottom;
//         style[mxConstants.STYLE_EDGE] = mxEdgeStyle.OrthConnector;
//         style[mxConstants.STYLE_EDGE] = mxEdgeStyle.SegmentConnector;

        style[mxConstants.STYLE_EDGE] = mxEdgeStyle.TopToBottom;
        style[mxConstants.STYLE_STROKEWIDTH] = '2';
        style[mxConstants.STYLE_STROKECOLOR] = 'black';

        style[mxConstants.STYLE_ROUNDED] = true;
        style[mxConstants.STYLE_CURVED] = "1";
    };

    /********************************************
     *
     ********************************************/
    function unlock_graph(self, graph)
    {
        graph.clearSelection();
        graph.setConnectable(true);         // Crear edges/links
        graph.setCellsDisconnectable(true); // Modificar egdes/links
        graph.setCellsLocked(false);
        graph.rubberband.setEnabled(true);  // selection with mouse

        // Enables panning
        graph.setPanning(false);
        graph.panningHandler.useLeftButtonForPanning = false;

        graph.setCellsLocked(false);

        self.config.locked = false;
    }

    /********************************************
     *
     ********************************************/
    function lock_graph(self, graph)
    {
        graph.clearSelection();
        graph.setConnectable(false);            // Crear edges/links
        graph.setCellsDisconnectable(false);    // Modificar egdes/links
        graph.setCellsLocked(true);
        graph.rubberband.setEnabled(false);     // selection with mouse

        // Enables panning
        graph.setPanning(true);
        graph.panningHandler.useLeftButtonForPanning = true;

        graph.setCellsLocked(true);

        self.config.locked = true;
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

        create_root_and_layers(self);
        rebuild_layouts(self);

        mxEvent.disableContextMenu(graph.container);

        graph.border = 30;
        graph.view.setTranslate(graph.border, graph.border);

        // Assigns some global constants for general behaviour, eg. minimum
        // size (in pixels) of the active region for triggering creation of
        // new connections, the portion (100%) of the cell area to be used
        // for triggering new connections, as well as some fading options for
        // windows and the rubberband selection.
        mxConstants.MIN_HOTSPOT_SIZE = 16;
        mxConstants.DEFAULT_HOTSPOT = 1;

        /*---------------------------*
         *      PERMISOS
         *---------------------------*/
        // Enable/Disable cell handling
        graph.setHtmlLabels(true);
        graph.setTooltips(true);

        graph.setPortsEnabled(true);
        mxGraphHandler.prototype.setCloneEnabled(false); // Ctrl+Drag will clone a cell
        graph.setCellsEditable(false);
        graph.setAllowDanglingEdges(false); // not allow dangling edges

        // Enables guides
        mxGraphHandler.prototype.guidesEnabled = true;

        // Enables snapping waypoints to terminals
        mxEdgeHandler.prototype.snapToTerminals = true;

        mxGraph.prototype.ordered = false;

        graph.border = 40;
        graph.view.setTranslate(graph.border/2, graph.border/2);

        // Enables rubberband selection
        graph.rubberband = new mxRubberband(graph);

        // Multiple connections between the same pair of vertices.
        graph.setMultigraph(false);

        if(0) { // TODO TEST
            // Removes cells when [DELETE] is pressed
            var keyHandler = new mxKeyHandler(graph);
            keyHandler.bindKey(46, function(evt) {
                if(!graph.isCellsLocked()) {
                    graph.removeCells();
                }
            });
        }

        // Installs automatic validation (use editor.validation = true
        // if you are using an mxEditor instance)
        if(0) {
            var listener = function(sender, evt)
            {
                graph.validateGraph();
            };

            graph.getModel().addListener(mxEvent.CHANGE, listener);
        }

        // Negative coordenates?
        graph.allowNegativeCoordinates = false;

        // Avoids overlap of edges and collapse icons
        graph.keepEdgesInBackground = true;

        /*
         *  HACK Por defecto si los hijos salen un overlap del 50%
         *  se quitan del padre y pasan al default
         */
        if(1) {
            graph.graphHandler.setRemoveCellsFromParent(false); // HACK impide quitar hijos
            mxGraph.prototype.isAllowOverlapParent = function(cell) { return true;}
            mxGraph.prototype.defaultOverlap = 1; // Permite a hijos irse tan lejos como quieran
        }

        // Uses the port icon while connections are previewed
        //graph.connectionHandler.getConnectImage = function(state) {
        //    // TODO pon la imagen???
        //    return new mxImage(state.style[mxConstants.STYLE_IMAGE], 16, 16);
        //};

        // Centers the port icon on the target port
        graph.connectionHandler.targetConnectImage = true;

        mxGraph.prototype.isCellSelectable = function(cell) {
            return true;
        };


        /*
         *  Foldable
         */
        // Defines new collapsed/expanded images
        // Busca mejores imagenes
        //mxGraph.prototype.collapsedImage = self.config.image_collapsed;
        //mxGraph.prototype.expandedImage = self.config.image_expanded;

        // Defines the condition for showing the folding icon
        graph.isCellFoldable = function(cell) {
            if(cell.value && cell.value.schema) {
                return true;
            }
            return false;
        };

        /*
         *  Unlock/lock
         */
        if(self.config.locked) {
            lock_graph(self, graph);
        } else {
            unlock_graph(self, graph);
        }

        /*
         *  Set stylesheet options
         */
        configureStylesheet(graph);

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
                if(cell.value.hook) {
                    return get_hook_info(cell, true, false);
                } if(cell.value.fkey) {
                    return get_fkey_info(cell, true, false);
                } else if(cell.value.schema) {
                    var topic_name = cell.value.schema.topic_name;
                    var id = cell.value.record? cell.value.record.id: "";

                    var t = topic_name + "^<br/><b>" + id + "</b><br/>";

                    if(cell.value.tosave_red) {
                        t += "<input " +
                        "style='cursor:default' " +
                        "type='image' src='" +
                        "/static/app/images/yuneta/save_red.svg" +
                        "' alt='Fix data to save' " +
                        "width='" +
                        self.config.top_overlay_icon_size +
                        "' " +
                        "height='" +
                        self.config.top_overlay_icon_size +
                        "'>"
                    } else if(cell.value.tosave_green) {
                        t += "<input " +
                        "style='cursor:default' " +
                        "type='image' src='" +
                        "/static/app/images/yuneta/save_green.svg" +
                        "' alt='Save data' " +
                        "width='" +
                        self.config.top_overlay_icon_size +
                        "' " +
                        "height='" +
                        self.config.top_overlay_icon_size +
                        "'>"
                    }
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
                if(this.getModel().isVertex(cell)) {
                    if(cell.value.hook) {
                        return get_hook_info(cell, false, true);
                    } if(cell.value.fkey) {
                        return get_fkey_info(cell, false, true);
                    } else if(cell.value.schema) {
                        var topic_name = cell.value.schema? cell.value.schema.topic_name: "";
                        var id = cell.value.record? cell.value.record.id: "";
                        return topic_name + "^<br/><b>" + id + "</b><br/>";
                    }
                } else if(this.getModel().isEdge(cell)) {
                    if(cell.id) {
                        return "<b>" + cell.id + "</b>";
                    }
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
            var properties = evt.getProperties(); // HACK associative array, merde!!!
            var kw = {};
            for(var k in properties) {
                if(properties.hasOwnProperty(k)) {
                    kw[k] = properties[k];
                }
            }
            self.gobj_send_event(
                "EV_MX_SELECTION_CHANGE",
                kw,
                self
            );
        });
    }

    /************************************************************
     *
     ************************************************************/
    function add_overlays(self, graph, cell)
    {
        var model = graph.getModel();
        model.beginUpdate();
        try {
            var offsy = self.config.top_overlay_icon_size/1.5;
            var offsx = self.config.top_overlay_icon_size + 5;

            if(cell.isVertex() && cell.value && cell.value.schema) {
                /*--------------------------------------*
                 *          Topics
                 *--------------------------------------*/

                /*--------------------------*
                 *  Data Formtable button
                 *--------------------------*/
                if(1) {
                    var overlay_role = new mxCellOverlay(
                        self.config.image_formtable,
                        "Edit data", // tooltip
                        mxConstants.ALIGN_LEFT, // horizontal align ALIGN_LEFT,ALIGN_CENTER,ALIGN_RIGH
                        mxConstants.ALIGN_TOP, // vertical align  ALIGN_TOP,ALIGN_MIDDLE,ALIGN_BOTTOM
                        new mxPoint(1*offsx - offsy, -offsy), // offset
                        "pointer" // cursor
                    );
                    graph.addCellOverlay(cell, overlay_role);
                    overlay_role.addListener(mxEvent.CLICK, function(sender, evt2) {
                        self.gobj_send_event(
                            "EV_SHOW_CELL_DATA_FORM",
                            {
                                cell: cell
                            },
                            self
                        );
                    });
                }

                /*--------------------------*
                 *  Json Inside of cell
                 *--------------------------*/
                if(!self.config.locked) {
                    var overlay_instance = new mxCellOverlay(
                        self.config.image_folder_tree,
                        "Inside Json View", // tooltip
                        mxConstants.ALIGN_LEFT, // horizontal align ALIGN_LEFT,ALIGN_CENTER,ALIGN_RIGH
                        mxConstants.ALIGN_TOP, // vertical align  ALIGN_TOP,ALIGN_MIDDLE,ALIGN_BOTTOM
                        new mxPoint(2*offsx - offsy, -offsy), // offset
                        "pointer" // cursor
                    );
                    graph.addCellOverlay(cell, overlay_instance);
                    overlay_instance.addListener(mxEvent.CLICK, function(sender, evt2) {
                        self.gobj_send_event(
                            "EV_SHOW_CELL_DATA_JSON",
                            {
                                cell: cell
                            },
                            self
                        );
                    });
                }

                /*--------------------------*
                 *  Red/Green Save button
                 *--------------------------*/
                if(cell.value.tosave_red) {
                    var overlay_instance = new mxCellOverlay(
                        self.config.image_save_red,
                        "Fix to save data", // tooltip
                        mxConstants.ALIGN_RIGH, // horizontal align ALIGN_LEFT,ALIGN_CENTER,ALIGN_RIGH
                        mxConstants.ALIGN_TOP,  // vertical align  ALIGN_TOP,ALIGN_MIDDLE,ALIGN_BOTTOM
                        new mxPoint(0*offsx - offsy, -offsy), // offset
                        "pointer" // cursor
                    );
                    graph.addCellOverlay(cell, overlay_instance);
                    overlay_instance.addListener(mxEvent.CLICK, function(sender, evt2) {
                        self.gobj_send_event(
                            "EV_SAVE_RED",
                            {
                                cell: cell
                            },
                            self
                        );
                    });
                } else if(cell.value.tosave_green) {
                    var overlay_instance = new mxCellOverlay(
                        self.config.image_save_green,
                        "Save data", // tooltip
                        mxConstants.ALIGN_RIGH, // horizontal align ALIGN_LEFT,ALIGN_CENTER,ALIGN_RIGH
                        mxConstants.ALIGN_TOP, // vertical align  ALIGN_TOP,ALIGN_MIDDLE,ALIGN_BOTTOM
                        new mxPoint(0*offsx - offsy, -offsy), // offset
                        "pointer" // cursor
                    );
                    graph.addCellOverlay(cell, overlay_instance);
                    overlay_instance.addListener(mxEvent.CLICK, function(sender, evt2) {
                        var topic = evt2.getProperty('cell').value;
                        self.gobj_send_event(
                            "EV_SAVE_GREEN",
                            {
                                cell: cell
                            },
                            self
                        );
                    });
                }

                /*--------------------------*
                 *  Delete button
                 *--------------------------*/
                if(!self.config.locked) {
                    var overlay_instance = new mxCellOverlay(
                        self.config.image_delete,
                        "Delete node", // tooltip
                        mxConstants.ALIGN_RIGH, // horizontal align ALIGN_LEFT,ALIGN_CENTER,ALIGN_RIGH
                        mxConstants.ALIGN_TOP, // vertical align  ALIGN_TOP,ALIGN_MIDDLE,ALIGN_BOTTOM
                        new mxPoint(-1*offsx - offsy, -offsy), // offset
                        "pointer" // cursor
                    );
                    graph.addCellOverlay(cell, overlay_instance);
                    overlay_instance.addListener(mxEvent.CLICK, function(sender, evt2) {
                        webix.confirm(
                            {
                                title: t("warning"),
                                text: t("are you sure"),
                                type:"confirm-warning"
                            }).then(function(result) {
                                self.gobj_send_event(
                                    "EV_DELETE_VERTEX",
                                    {
                                        cell: cell
                                    },
                                    self
                                );
                            }
                        );
                    });
                }

            } else if(cell.isEdge()) {
                /*--------------------------------------*
                 *          Links
                 *--------------------------------------*/

                /*--------------------------*
                 *  Delete button
                 *--------------------------*/
                if(!self.config.locked) {
                    var overlay_instance = new mxCellOverlay(
                        self.config.image_delete,
                        "Delete link",  // tooltip
                        mxConstants.ALIGN_RIGH, // horizontal align ALIGN_LEFT,ALIGN_CENTER,ALIGN_RIGH
                        mxConstants.ALIGN_TOP, // vertical align  ALIGN_TOP,ALIGN_MIDDLE,ALIGN_BOTTOM
                        new mxPoint(-1*offsx - offsy, -offsy), // offset
                        "pointer" // cursor
                    );
                    graph.addCellOverlay(cell, overlay_instance);
                    overlay_instance.addListener(mxEvent.CLICK, function(sender, evt2) {
                        webix.confirm(
                            {
                                title: t("warning"),
                                text: t("are you sure"),
                                type:"confirm-warning"
                            }).then(function(result) {
                                self.gobj_send_event(
                                    "EV_DELETE_EDGE",
                                    {
                                        cell: cell
                                    },
                                    self
                                );
                            }
                        );
                    });
                }
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
    function get_hook_info(cell, inclinado, full)
    {
        var col = cell.value.col;

        var t = "<div class=" + (inclinado?"'inclinado font_fijo'":"'font_fijo'") + ">";

        if(full) {
            t += "<b>" + col.id + "</b>&nbsp;" + "(" + col.header + ")";
        } else {
            t += col.header;
        }

        if(full) {
            t += "<br/>";
            t += "<br/>";
            t += "ref=";
            var dict = col.hook;
            for(var k in dict) {
                var v = dict[k];
                t += k;
                t += ":" + v;
            }
        }
        t+= "</div>";

        return t;
    }

    /********************************************
     *
     ********************************************/
    function get_fkey_info(cell, inclinado, full)
    {
        var col = cell.value.col;

        var t = "<div class=" + (inclinado?"'inclinado font_fijo'":"'font_fijo'") + ">";

        if(full) {
            t += "<b>" + col.id + "</b>&nbsp;" + "(" + col.header + ")";
        } else {
            t += col.header;
        }

        if(full) {
            if(cell.parent.value && cell.parent.value.record) {
                var v = cell.parent.value.record[col.id];
                t += "<br/>";
                t += "<br/>";
                t += "value=" + JSON.stringify(v, 2);
            }

            t += "<br/>";
            t += "<br/>";
            t += "ref=";
            var dict = col.fkey;
            for(var k in dict) {
                var v = dict[k];
                t += k;
                t += ":" + v;
            }
        }

        t+= "</div>";

        return t;
    }

    /********************************************
     *
     ********************************************/
    function build_hook_port_id(self, topic_name, topic_id, col)
    {
        var name = topic_name + "^" + topic_id + "^" + col.id;
        return name;
    }

    /********************************************
     *
     ********************************************/
    function build_fkey_port_id(self, topic_name, topic_id, col)
    {
        var name = topic_name + "^" + topic_id + "^" + col.id;
        return name;
    }

    /********************************************
     *
     ********************************************/
    function get_hook_style(self, col)
    {
        var style = "";

        for(var k in col.hook) {
            if(elm_in_list(k, self.config.topics_name)) {
                return k + "_hook";
            }
        }

        return style;
    }

    /********************************************
     *
     ********************************************/
    function add_hook_fkey_ports(self, cell)
    {
        if(!cell.value.record) {
            return;
        }
        var graph = self.config._mxgraph;
        var model = graph.model;
        var topic_name = cell.value.schema.topic_name;
        var topic_id = cell.value.record.id;
        var cols = cell.value.schema.cols;
        var hook_port_cx = self.config.hook_port_cx;
        var hook_port_cy = self.config.hook_port_cy;
        var fkey_port_cx = self.config.fkey_port_cx;
        var fkey_port_cy = self.config.fkey_port_cy;
        var x, y, slot;

        /*
         *  Get the hooks/fkeys
         */
        var hooks = [];
        var fkeys = [];
        for(var i=0; i<cols.length; i++) {
            var col = cols[i];
            var flag = col.flag;
            var is_writable = elm_in_list("writable", flag);
            var is_hook = elm_in_list("hook", flag);
            var is_fkey = elm_in_list("fkey", flag);
            if(is_writable) {
                if(is_hook) {
                    hooks.push(col);
                }
                if(is_fkey) {
                    fkeys.push(col);
                }
            }
        }

        /*
         *  Draw the hooks ports
         */
        slot = 1/(hooks.length+1);
        switch(self.config.hook_port_position) {
            case "top":
                x = slot - (hook_port_cx/cell.geometry.width)/2;
                y = 0 - (hook_port_cy/cell.geometry.height);
                break;
            case "bottom":
                x = slot - (hook_port_cx/cell.geometry.width)/2;
                y = 1;
                break;
            case "left":
                x = 0 - hook_port_cx/cell.geometry.width;
                y = slot - (hook_port_cy/cell.geometry.height)/2;
                break;
            case "right":
                x = 1;
                y = slot - (hook_port_cy/cell.geometry.height)/2;
                break;
        }
        for(var i=0; i<hooks.length; i++) {
            var col = hooks[i];

            /*
             *  hook types: list, dict, string  // TODO review types
             */
            var hook = kw_get_dict_value(col, "hook", null, false);
            if(hook) {
                /*-----------------------------*
                 *      Draw the hook port
                 *-----------------------------*/
                var cell_id = build_hook_port_id(self, topic_name, topic_id, col);
                if(model.getCell(cell_id)) {
                    log_error("Cell duplicated: " + cell_id);
                }
                var hook_port = graph.insertVertex(
                    cell,                       // group
                    cell_id,                    // id
                    {                           // value
                        topic_name: topic_name,
                        topic_id: topic_id,
                        col: col,
                        hook: hook
                    },
                    x, y,                   // x,y
                    hook_port_cx,           // width
                    hook_port_cy,           // height
                    get_hook_style(self, col), // style
                    true                    // relative
                );

                switch(self.config.hook_port_position) {
                    case "top":
                    case "bottom":
                        x += slot;
                        break;
                    case "left":
                    case "right":
                        y += slot;
                        break;
                }
            }
        }

        /*
         *  Draw the fkeys ports
         */
        slot = 1/(fkeys.length+1);
        switch(self.config.fkey_port_position) {
            case "top":
                x = slot - (fkey_port_cx/cell.geometry.width)/2;
                y = 0 - (fkey_port_cy/cell.geometry.height);
                break;
            case "bottom":
                x = slot - (fkey_port_cx/cell.geometry.width)/2;
                y = 1;
                break;
            case "left":
                x = 0 - (fkey_port_cx)/ cell.geometry.width;
                y = slot - (fkey_port_cy/cell.geometry.height)/2;
                break;
            case "right":
                x = 1;
                y = slot - (fkey_port_cy/cell.geometry.height)/2;
                break;
        }

        for(var i=0; i<fkeys.length; i++) {
            var col = fkeys[i];
            /*
             *  fkey types: list, string        // TODO review types
             */
            var fkey = kw_get_dict_value(col, "fkey", null, false);
            if(fkey) {
                /*-----------------------------*
                 *      Draw the fkey port
                 *-----------------------------*/
                var cell_id = build_fkey_port_id(self, topic_name, topic_id, col);
                if(model.getCell(cell_id)) {
                    log_error("Cell duplicated: " + cell_id);
                }
                var fkey_port_cell = graph.insertVertex(
                    cell,                       // group
                    cell_id,                    // id
                    {                           // value
                        topic_name: topic_name,
                        topic_id: topic_id,
                        col: col,
                        fkey: fkey
                    },
                    x, y,                   // x,y
                    fkey_port_cx,           // width
                    fkey_port_cy,           // height
                    topic_name + "_fkey",   // style
                    true                    // relative
                );

                switch(self.config.fkey_port_position) {
                    case "top":
                    case "bottom":
                        x += slot;
                        break;
                    case "left":
                    case "right":
                        y += slot;
                        break;
                }
            }
        }
    }

    /************************************************************
     *  Draw links
     ************************************************************/
    function draw_links(self, cell)
    {
        var graph = self.config._mxgraph;
        var model = graph.model;

        var topic_name = cell.value.schema.topic_name;
        var topic_id = cell.value.record.id;

        var cols = cell.value.schema.cols;
        for(var i=0; i<cols.length; i++) {
            var col = cols[i];
            if(!col.fkey) {
                continue;
            }

            var fkey_port_name = build_fkey_port_id(self, topic_name, topic_id, col);
            var fkey_port_cell = model.getCell(fkey_port_name);
            var fkeys = cell.value.record[col.id];

            if(is_string(fkeys)) {
                if(col.type != "string") {
                    log_warning("fkey type must be string: " + JSON.stringify(fkeys));
                }
                var fkey = fkeys;
                if(!empty_string(fkey)) {
                    draw_link(self, topic_name, fkey_port_cell, fkey);
                }

            } else if(is_array(fkeys)) {
                if(!(col.type != "array" || col.type != "list")) {
                    log_warning("fkey type must be array: " + JSON.stringify(fkeys));
                }

                for(var j=0; j<fkeys.length; j++) {
                    var fkey = fkeys[j];
                    if(!empty_string(fkey)) {
                        draw_link(self, topic_name, fkey_port_cell, fkey);
                    }
                }

            } else {
                log_error("fkey type unsupported: " + JSON.stringify(fkeys));
            }
        }
    }

    /************************************************************
     *
     ************************************************************/
    function get_col(cols, col_id)
    {
        if(is_array(cols))  {
            for(var i=0; i<cols.length; i++) {
                var col = cols[i];
                if(col.id == col_id) {
                    return col;
                }
            }
        } else if(is_object(cols)) {
            return cols[cold_id];
        }
        return null;
    }

    /************************************************************
     *  Draw link
     ************************************************************/
    function draw_link(self, source_topic_name, fkey_port_cell, ref)
    {
        var graph = self.config._mxgraph;
        var model = graph.model;

        try {
            var tt = ref.split("^");
            var target_topic_name = tt[0];
            var target_topic_id = tt[1];
            var target_hook = tt[2];

            var target_cell_name = build_cell_name(
                self, target_topic_name, target_topic_id
            );
            var target_cell = model.getCell(target_cell_name);
            var targer_hook_col = get_col(target_cell.value.schema.cols, target_hook);

            var target_port_name = build_hook_port_id(
                self,
                target_topic_name,
                target_topic_id,
                targer_hook_col
            );
            var target_port_cell = model.getCell(target_port_name);

            var cell_id = fkey_port_cell.id + " ==> " + target_port_name; // HACK "==>" repeated
            var link_cell = model.getCell(cell_id);
            if(!link_cell) {
                graph.insertEdge(
                    get_layer(self),                // group
                    cell_id,                        // id
                    cell_id,                        // value
                    fkey_port_cell,                 // source
                    target_port_cell,               // target
                    source_topic_name + "_arrow"    // style
                );
            }

        } catch (e) {
            log_error(e);
        }
    }

    /************************************************************
     *  Create topic cell,
     *      - from backend (record not null) or
     *      - new by user (record null)
     ************************************************************/
    function create_topic_cell(self, schema, record)
    {
        var graph = self.config._mxgraph;
        var model = graph.model;
        var cell = null;

        if(!record) {
            /*---------------------------------------------*
             *  Creating new empty cell from user design
             *---------------------------------------------*/
            cell = graph.insertVertex(
                get_layer(self),        // group
                uuidv4(),               // id, temporal if cell_name is null
                {                       // value
                    cell_name: null,
                    schema: schema,
                    record: null,
                    tosave_red: true,
                    tosave_green: false
                },
                40, 40,             // x,y
                250, 200,           // width,height
                schema.topic_name,  // style
                false               // relative
            );
            cell.setConnectable(false);
            cell.geometry.alternateBounds = new mxRectangle(0, 0, 110, 70); // TODO a configuración

        } else {
            /*------------------------------------------*
             *  Creating filled cell from backend data
             *------------------------------------------*/
            var geometry = record._geometry;
            var x = kw_get_int(geometry, "x", 40, false);
            var y = kw_get_int(geometry, "y", 40, false);
            var width = kw_get_int(geometry, "width", 250, false);
            var height = kw_get_int(geometry, "height", 200, false);
            var cell_name = build_cell_name(self, schema.topic_name, record.id);

            if(model.getCell(cell_name)) {
                log_error("Cell duplicated: " + cell_id);
            }
            cell = graph.insertVertex(
                get_layer(self),    // group
                cell_name,          // id
                {                   // value
                    cell_name: cell_name,
                    schema: schema,
                    record: record,
                    tosave_red: false,
                    tosave_green: false
                },
                x, y,               // x,y
                width, height,      // width,height
                schema.topic_name,  // style
                false               // relative
            );
            cell.setConnectable(false);
            cell.geometry.alternateBounds = new mxRectangle(0, 0, 110, 70);
            add_hook_fkey_ports(self, cell);
        }

        return cell;
    }

    /************************************************************
     *  Update topic cell
     *      - from backend (record not null) or
     *      - new by user (record null)
     ************************************************************/
    function update_topic_cell(self, cell, schema, record)
    {
        var graph = self.config._mxgraph;
        var model = graph.model;

        if(!cell || !cell.value) {
            log_error("What cell?");
        }

        /*
         *  value.cell_name to null indicates if it's a user new creating cell
         */
        if(cell.value.cell_name) {
            /*---------------------------------*
             *  Updating existing topic cell
             *---------------------------------*/
            cell.value.schema = schema; // DANGER if schema has changed?
            cell.value.record = record;
            cell.value.tosave_red = false;
            cell.value.tosave_green = false;

        } else {
            /*---------------------------------------------------------*
             *  A new cell from user editing is validated by backend
             *  Update cell_name and cell_id
             *---------------------------------------------------------*/
            var cell_name = build_cell_name(self, schema.topic_name, record.id);

            /*
             *  WARNING changing cell id, re-insert cell in model
             *  HACK see cellAdded in mxClient.js
             */
            delete model.cells[cell.getId()];
            cell.setId(cell_name);
            model.cells[cell.getId()] = cell;

            cell.value.cell_name = cell_name;
            cell.value.schema = schema;  // DANGER if schema has changed?
            cell.value.record = record;
            cell.value.tosave_red = false;
            cell.value.tosave_green = false;

            graph.removeSelectionCell(cell); // To remove overlays icons

            if(cell.value.gobj_cell_formtable) {
                // HACK reference cell <-> gobj_formtable
                cell.value.gobj_cell_formtable.gobj_write_attr("user_data", cell_name);
            }
            add_hook_fkey_ports(self, cell);
        }

        /*
         *  Update formtable if it's opened
         */
        if(cell.value.gobj_cell_formtable) {
            cell.value.gobj_cell_formtable.gobj_send_event(
                "EV_LOAD_DATA",
                [record],
                self
            );
        }

        return cell;
    }




            /***************************
             *      Actions
             ***************************/




    /********************************************
     *  From parent, load data
     ********************************************/
    function ac_load_data(self, event, kw, src)
    {
        var model = self.config._mxgraph.getModel();

        model.beginUpdate();
        try {
            var schema = kw.schema;
            var data = kw.data;
            var cell_id = kw.cell_id;

            if(cell_id) {
                /*--------------------------------------------*
                *  Updating cell (editing or user creating)
                *--------------------------------------------*/
                var graph = self.config._mxgraph;
                var model = graph.getModel();
                var cell = model.getCell(cell_id);

                update_topic_cell(self, cell, schema, data);
                draw_links(self, cell);

            } else {
                /*--------------------------------------------*
                 *  Creating and loading cells from backend
                 *--------------------------------------------*/
                var cells = [];
                for(var i=0; i<data.length; i++) {
                    var record = data[i];
                    var cell = create_topic_cell(self, schema, record);
                    cells.push(cell);
                }

                for(var i=0; i<cells.length; i++) {
                    var cell = cells[i];
                    draw_links(self, cell);
                }
                if(self.config.collapsed) {
                    collapse_edition(self, self.config.collapsed);
                }
                execute_layout(self);
            }

        } catch (e) {
            log_error(e);
        } finally {
            model.endUpdate();
        }


        return 0;
    }

    /********************************************
     *  From parent, clear all
     ********************************************/
    function ac_clear_data(self, event, kw, src)
    {
        var graph = self.config._mxgraph;
        var model = graph.getModel();

        model.beginUpdate();
        try {
            graph.selectCells(
                true,               // vertices
                true,               // edges
                get_layer(self),    // parent
                true                // selectGroups
            );
            graph.removeCells();

        } catch (e) {
            log_error(e);
        } finally {
            model.endUpdate();
        }

        return 0;
    }

    /********************************************
     *  From parent, inform of treedb schemas
     ********************************************/
    function ac_descs(self, event, kw, src)
    {
        self.config.descs = kw;  // save schemas

        /*
         *  Update topics_name menu
         */
        var topics = [];
        for(var i=0; i<self.config.topics_name.length; i++) {
            var topic_name = self.config.topics_name[i];
            var desc = self.config.descs[topic_name];
            if(!desc) {
                log_error("DESC of " + topic_name + " Not found");
                continue;
            }
            topics.push({
                id: desc.topic_name,
                value: desc.topic_name,
                icon: "" // TODO
            });
        }
        $$(build_name(self, "create_menu")).parse(topics);

        return 0;
    }

    /********************************************
     *  Create a cell vertex of topic node
     *  From popup menu
     ********************************************/
    function ac_create_vertex(self, event, kw, src)
    {
        var graph = self.config._mxgraph;
        var model = graph.getModel();
        var topic_name = kw.topic_name;
        var schema = self.config.descs[topic_name];

        model.beginUpdate();
        try {
            create_topic_cell(self, schema, null)

        } catch (e) {
            log_error(e);
        } finally {
            model.endUpdate();
        }

        return 0;
    }

    /********************************************
     *  From vertex's overlay icon
     ********************************************/
    function ac_delete_vertex(self, event, kw, src)
    {
        var graph = self.config._mxgraph;
        var model = graph.getModel();
        var cell = kw.cell;

        model.beginUpdate();
        try {
            if(!cell.value.cell_name) {
                // new vertex in progress, delete
                if(cell.value.gobj_cell_formtable) {
                    __yuno__.gobj_destroy(cell.value.gobj_cell_formtable);
                    cell.value.gobj_cell_formtable = 0;
                }
                graph.removeCells([cell]);
            } else {
                // Wait to EV_NODE_DELETED to delete cell
                if(cell.value.gobj_cell_formtable) {
                    __yuno__.gobj_destroy(cell.value.gobj_cell_formtable);
                    cell.value.gobj_cell_formtable = 0;
                }
                var kw_delete = {
                    treedb_name: self.config.treedb_name,
                    topic_name: cell.value.schema.topic_name,
                    is_topic_schema: false,
                    record: cell.value.record,
                    cell_id: cell.id
                };
                self.gobj_publish_event("EV_DELETE_RECORD", kw_delete, self);
            }

        } catch (e) {
            log_error(e);
        } finally {
            model.endUpdate();
        }

        return 0;
    }

    /********************************************
     *  From edge's overlay icon
     ********************************************/
    function ac_delete_edge(self, event, kw, src)
    {
        var graph = self.config._mxgraph;
        var model = graph.getModel();
        var cell = kw.cell;

        var source_id = cell.source.id;
        var target_id = cell.target.id;

        var source_cell = model.getCell(cell.source.id);
        var target_cell = model.getCell(cell.target.id);
        var parent_cell = null;
        var child_cell = null;

        if(source_cell.value.fkey) {
            child_cell = source_cell;
        } else if(source_cell.value.hook) {
            parent_cell = source_cell;
        }
        if(target_cell.value.fkey) {
            child_cell = target_cell;
        } else if(target_cell.value.hook) {
            parent_cell = target_cell;
        }

        var parent = parent_cell.value.topic_name + "^";
            parent += parent_cell.value.topic_id + "^";
            parent += parent_cell.value.col.id

        var child = child_cell.value.topic_name + "^";
            child += child_cell.value.topic_id;

        var kw_unlink = {
            treedb_name: self.config.treedb_name,
            parent: parent,
            child: child,
            cell_id: cell.id
        };

        // Wait to EV_NODE_DELETED to delete cell
        self.gobj_publish_event("EV_UNLINK_RECORDS", kw_unlink, self);

        return 0;
    }

    /********************************************
     *  From parent, ack to delete record
     ********************************************/
    function ac_node_deleted(self, event, kw, src)
    {
        var graph = self.config._mxgraph;
        var model = graph.getModel();
        var cell = model.getCell(kw.cell_id);
        var result = kw.result;

        model.beginUpdate();
        try {
            if(result >= 0) {
                graph.removeCells([cell]);
            }

        } catch (e) {
            log_error(e);
        } finally {
            model.endUpdate();
        }

        return 0;
    }

    /********************************************
     *  From parent, ack to link records
     ********************************************/
    function ac_nodes_linked(self, event, kw, src)
    {
        var graph = self.config._mxgraph;
        var model = graph.getModel();
        var result = kw.result;

        model.beginUpdate();
        try {
            var cell = model.getCell(kw.cell_id);

            if(result < 0) {
                // operation failed, remove edge
                graph.removeCells([cell]);
            } else {
                /*
                 *  WARNING changing cell id, re-insert cell in model
                 *  HACK see cellAdded in mxClient.js
                 */
                delete model.cells[cell.getId()];
                cell.setId(cell.value);
                model.cells[cell.getId()] = cell;
            }

        } catch (e) {
            log_error(e);
        } finally {
            model.endUpdate();
        }

        return 0;
    }

    /********************************************
     *  From parent, ack to unlink records
     ********************************************/
    function ac_nodes_unlinked(self, event, kw, src)
    {
        var graph = self.config._mxgraph;
        var model = graph.getModel();
        var cell = model.getCell(kw.cell_id);
        var result = kw.result;

        model.beginUpdate();
        try {
            if(result >= 0) {
                graph.removeCells([cell]);
            }

        } catch (e) {
            log_error(e);
        } finally {
            model.endUpdate();
        }

        return 0;
    }

    /********************************************
     *  Create record (topic node)
     *  Event from formtable
     *  kw: {
     *      topic_name,
     *      is_topic_schema,
     *      record
     *      + treedb_name
     *      + cell_id (vertex cell id)
     *  }
     ********************************************/
    function ac_create_record(self, event, kw, src)
    {
        var graph = self.config._mxgraph;
        var model = graph.model;
        var cell_id = src.gobj_read_attr("user_data"); // HACK reference cell <-> gobj_formtable
        var cell = model.getCell(cell_id);

        var kw_create = {
            treedb_name: self.config.treedb_name,
            topic_name: kw.topic_name,
            is_topic_schema: kw.is_topic_schema,
            record: kw.record,
            cell_id: cell_id
        };

        kw_create.record["_geometry"] = filter_dict(
            cell.geometry,
            ["x", "y", "width", "height"]
        );

        self.gobj_publish_event("EV_CREATE_RECORD", kw_create, self);

        return 0;
    }

    /********************************************
     *  Update record (topic node)
     *  Event from formtable
     *  kw: {
     *      + treedb_name
     *      topic_name,
     *      is_topic_schema,
     *      record
     *      + cell_id (vertex cell id)
     *  }
     ********************************************/
    function ac_update_record(self, event, kw, src)
    {
        var graph = self.config._mxgraph;
        var model = graph.model;
        var cell_id = src.gobj_read_attr("user_data"); // HACK reference cell <-> gobj_formtable
        var cell = model.getCell(cell_id);

        var kw_update = {
            treedb_name: self.config.treedb_name,
            topic_name: kw.topic_name,
            is_topic_schema: kw.is_topic_schema,
            record: kw.record,
            cell_id: cell_id
        };

        kw_update.record["_geometry"] = filter_dict(
            cell.geometry,
            ["x", "y", "width", "height"]
        );

        self.gobj_publish_event("EV_UPDATE_RECORD", kw_update, self);

        return 0;
    }

    /********************************************
     *  Show formtable to edit record, from here
     ********************************************/
    function ac_show_cell_data_form(self, event, kw, src)
    {
        var cell = kw.cell;
        var cell_name = cell.value.cell_name; // Null on new nodes
        var schema = cell.value.schema;
        var record = cell.value.record;

        var name = self.gobj_escaped_short_name() + "'" + (cell_name?cell_name:"");

        var gobj_cell_formtable = cell.value.gobj_cell_formtable;
        //if(cell_name) {
        //    gobj_cell_formtable = __yuno__.gobj_find_unique_gobj(name);
        //}
        if(gobj_cell_formtable) {
            gobj_cell_formtable.gobj_send_event("EV_TOGGLE", {}, self);
            return 0;
        }

        var kw_formtable = {
            subscriber: self,  // HACK get all output events
            user_data: cell.getId(),  // HACK reference cell <-> gobj_formtable

            ui_properties: {
                minWidth: 360,
                minHeight: 300
            },

            treedb_name: self.config.treedb_name,
            topic_name: schema.topic_name,
            cols: schema.cols,
            is_topic_schema: false,
            with_checkbox: false,
            with_textfilter: true,
            with_sort: true,
            with_top_title: true,
            with_footer: true,
            with_navigation_toolbar: true,
            without_refresh: true,
            hide_private_fields: true,
            list_mode_enabled: true,
            current_mode: cell_name?"update":"create",
            update_mode_enabled: cell_name?true:false,
            create_mode_enabled: cell_name?false:true,
            delete_mode_enabled: cell_name?true:false,

            window_properties: {
                without_window_pin_btn: true,           // Hide pin button
                without_window_fullscreen_btn: false,   // Hide fullscreen button
                without_window_close_btn: false,        // Hide minimize/destroy button
                without_destroy_window_on_close: false, // No destroy window on close (hide)
                without_create_window_on_start: true,   // Don't create window on start
            },
            is_pinhold_window: true,
            window_title: schema.topic_name,
            window_image: kw.image,
            width: 950,
            height: 600
        };

        if(cell_name) {
            gobj_cell_formtable = __yuno__.gobj_create_unique(
                name,
                Ui_formtable,
                kw_formtable,
                __yuno__.__pinhold__
            );
        } else {
            gobj_cell_formtable = __yuno__.gobj_create(
                name,
                Ui_formtable,
                kw_formtable,
                __yuno__.__pinhold__
            );
        }
        cell.value.gobj_cell_formtable = gobj_cell_formtable;

        gobj_cell_formtable.gobj_send_event(
            "EV_CLEAR_DATA",
            {
            },
            self
        );
        if(record) {
            gobj_cell_formtable.gobj_send_event(
                "EV_LOAD_DATA",
                [record],
                self
            );
        }

        return 0;
    }

    /********************************************
     *  Show inside json of cell
     ********************************************/
    function ac_show_cell_data_json(self, event, kw, src)
    {
        var cell = kw.cell;

        var n = "Json Cell Inside: " + cell.id;
        var gobj_je = __yuno__.gobj_find_unique_gobj(n);
        if(!gobj_je) {
            gobj_je = __yuno__.gobj_create_unique(
                n,
                Je_viewer,
                {
                    window_title: n,
                    width: 900,
                    height: 600
                },
                __yuno__.__pinhold__
            );
            gobj_je.gobj_start();
        }
        gobj_je.gobj_send_event(
            "EV_SHOW",
            {},
            self
        );
        gobj_je.gobj_send_event(
            "EV_CLEAR_DATA",
            {},
            self
        );
        var data = new Object(cell.value);
        delete data.gobj_cell_formtable;
        gobj_je.gobj_send_event(
            "EV_LOAD_DATA",
            {data: cell.value},
            self
        );

        return 0;
    }

    /********************************************
     *
     ********************************************/
    function ac_save_red(self, event, kw, src)
    {
        // TODO

        return 0;
    }

    /********************************************
     *
     ********************************************/
    function ac_save_green(self, event, kw, src)
    {
        // TODO

        return 0;
    }

    /********************************************
     *
     ********************************************/
    function ac_mx_click(self, event, kw, src)
    {
        var cell = kw.cell;
        if(!cell) {
            return -1;
        }
        if(cell.isVertex()) {
            if(cell.value && cell.value.schema) {
                // It's a topic node cell
                var kw_cell = {
                    treedb_name: self.config.treedb_name,
                    topic_name: cell.value.schema.topic_name,
                    is_topic_schema: false,
                    record: cell.value.record,
                    cell_id: cell.id
                }
                self.gobj_publish_event("EV_MX_VERTEX_CLICKED", kw_cell, self);
            }
        } else {
//             if(cell.value && cell.value.schema) {
//                 // It's a topic node cell
//                 var kw_cell = {
//                     treedb_name: self.config.treedb_name,
//                     topic_name: cell.value.schema.topic_name,
//                     is_topic_schema: false,
//                     record: cell.value.record,
//                     cell_id: cell.id
//                 }
//                 self.gobj_publish_event("EV_MX_EDGE_CLICKED", kw_cell, self);
//             }
        }
        return 0;
    }

    /********************************************
     *
     ********************************************/
    function ac_selection_change(self, event, kw, src)
    {
        var graph = self.config._mxgraph;

        /*
         *  HACK "added" vs "removed"
         *  The names are inverted due to historic reasons.  This cannot be changed.
         *
         *  HACK don't change the order, first removed, then added
         */
        try {
            var cells_removed = kw.added;
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
            var cells_added = kw.removed;
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

        return 0;
    }

    /********************************************
     *  Vertices or edges has been added
     ********************************************/
    function ac_mx_addcells(self, event, kw, src)
    {
        var graph = self.config._mxgraph;
        var model = graph.model;

        var cells = kw.cells;

        for(var i=0; i<cells.length; i++) {
            var cell = cells[i];
            if(cell.isVertex()) {
                // IGNORE Vertices, add/remove are controlled by program buttons
                continue;
            }

            if(cell.isEdge()) {
                if(strstr(cell.id, "==>")) {
                    // Not a new link done by user edition
                    continue;
                }

                // New Edges or edges source/target changes are done by user edition
                var source_cell = model.getCell(cell.source.id);
                var target_cell = model.getCell(cell.target.id);
                var parent_cell = null;
                var child_cell = null;

                if(source_cell.value.fkey) {
                    child_cell = source_cell;
                } else if(source_cell.value.hook) {
                    parent_cell = source_cell;
                }
                if(target_cell.value.fkey) {
                    child_cell = target_cell;
                } else if(target_cell.value.hook) {
                    parent_cell = target_cell;
                }

                var future_cell_id = child_cell.id + " ==> " + parent_cell.id; // HACK "==>" repeated
                model.setValue(cell, future_cell_id);

                var parent = parent_cell.value.topic_name + "^";
                    parent += parent_cell.value.topic_id + "^";
                    parent += parent_cell.value.col.id

                var child = child_cell.value.topic_name + "^";
                    child += child_cell.value.topic_id;

                var kw_link = {
                    treedb_name: self.config.treedb_name,
                    parent: parent,
                    child: child,
                    cell_id: cell.id
                };

                self.gobj_publish_event("EV_LINK_RECORDS", kw_link, self);
            }
        }
        return 0;
    }

    /********************************************
     *  An edge has changed his source/target
     ********************************************/
    function ac_mx_connectcell(self, event, kw, src)
    {
        //TODO
        log_error("TODO");
        trace_msg(kw);
        return 0;
    }

    /********************************************
     *
     ********************************************/
    function ac_mx_movecells(self, event, kw, src)
    {
        var cells = kw.cells;

        for(var i=0; i<cells.length; i++) {
            var cell = cells[i];
            if(cell.value.cell_name) {
                /*
                 *  kw: {
                 *      + treedb_name
                 *      topic_name,
                 *      is_topic_schema,
                 *      record
                 *      + cell_id (vertex cell id)
                 *  }
                 */
                __update_dict__(
                    cell.value.record["_geometry"],
                    filter_dict(
                        cell.geometry,
                        ["x", "y"]
                    )
                );
                var kw_update = {
                    treedb_name: self.config.treedb_name,
                    topic_name: cell.value.schema.topic_name,
                    is_topic_schema: false,
                    record: cell.value.record,
                    cell_id: cell.id
                };

                self.gobj_publish_event("EV_UPDATE_RECORD", kw_update, self);
            }
        }

        return 0;
    }

    /********************************************
     *
     ********************************************/
    function ac_mx_resizecells(self, event, kw, src)
    {
        var cells = kw.cells;

        for(var i=0; i<cells.length; i++) {
            var cell = cells[i];
            if(cell.isCollapsed()) {
                continue;
            }
            if(cell.value.cell_name) {
                /*
                 *  kw: {
                 *      + treedb_name
                 *      topic_name,
                 *      is_topic_schema,
                 *      record
                 *      + cell_id (vertex cell id)
                 *  }
                 */

                cell.value.record["_geometry"] = filter_dict(
                    cell.geometry,
                    ["x", "y", "width", "height"]
                );
                var kw_update = {
                    treedb_name: self.config.treedb_name,
                    topic_name: cell.value.schema.topic_name,
                    is_topic_schema: false,
                    record: cell.value.record,
                    cell_id: cell.id
                };

                self.gobj_publish_event("EV_UPDATE_RECORD", kw_update, self);
            }
        }

        return 0;
    }

    /********************************************
     *  From formtable,
     *  when window is destroying or minififying
     ********************************************/
    function ac_close_window(self, event, kw, src)
    {
        var graph = self.config._mxgraph;
        var model = graph.model;
        var cell_id = src.gobj_read_attr("user_data");  // HACK reference cell <-> gobj_formtable
        var cell = model.getCell(cell_id);

        if(kw.destroying) {
            cell.value.gobj_cell_formtable = 0;
        }

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
        if(!self.config.is_pinhold_window) {
            /*
             *  If it's a container panel:
             *      Get current index,
             *      remove UI from parent,
             *      re-build UI,
             *      add UI to parent with same idx.
             */
            var idx = self.config.$container_parent.index(self.config.$ui);
            if(idx < 0) {
                return -1;
            }
            var visible = self.parent.config.views_opened?
                self.parent.config.views_opened[self.name]:true;
            self.config.$container_parent.removeView(self.config.$ui);
        }

        rebuild(self);

        if(!self.config.is_pinhold_window) {
            self.config.$container_parent.addView(self.config.$ui, idx);
            if(visible) {
                self.config.$ui.show();
            } else {
                self.config.$ui.hide();
            }
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
            "EV_DESCS",

            "EV_MX_VERTEX_CLICKED: output",
            "EV_MX_EDGE_CLICKED: output",
            "EV_CREATE_RECORD: output",
            "EV_DELETE_RECORD: output",
            "EV_UPDATE_RECORD: output",
            "EV_LINK_RECORDS: output",
            "EV_UNLINK_RECORDS: output",

            "EV_CREATE_VERTEX",
            "EV_DELETE_VERTEX",
            "EV_DELETE_EDGE",
            "EV_NODE_DELETED",
            "EV_NODES_LINKED",
            "EV_NODES_UNLINKED",
            "EV_SHOW_CELL_DATA_FORM",
            "EV_SHOW_CELL_DATA_JSON",

            "EV_SAVE_RED",
            "EV_SAVE_GREEN",

            "EV_MX_CLICK",
            "EV_MX_SELECTION_CHANGE",
            "EV_MX_ADDCELLS",
            "EV_MX_MOVECELLS",
            "EV_MX_RESIZECELLS",
            "EV_MX_CONNECTCELL",

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
                ["EV_LOAD_DATA",                ac_load_data,               undefined],
                ["EV_CLEAR_DATA",               ac_clear_data,              undefined],
                ["EV_DESCS",                    ac_descs,                   undefined],

                ["EV_CREATE_VERTEX",            ac_create_vertex,           undefined],
                ["EV_DELETE_VERTEX",            ac_delete_vertex,           undefined],
                ["EV_DELETE_EDGE",              ac_delete_edge,             undefined],
                ["EV_NODE_DELETED",             ac_node_deleted,            undefined],
                ["EV_NODES_LINKED",             ac_nodes_linked,            undefined],
                ["EV_NODES_UNLINKED",           ac_nodes_unlinked,          undefined],

                ["EV_SHOW_CELL_DATA_FORM",      ac_show_cell_data_form,     undefined],
                ["EV_SHOW_CELL_DATA_JSON",      ac_show_cell_data_json,     undefined],
                ["EV_CREATE_RECORD",            ac_create_record,           undefined],
                ["EV_UPDATE_RECORD",            ac_update_record,           undefined],

                ["EV_SAVE_RED",                 ac_save_red,                undefined],
                ["EV_SAVE_GREEN",               ac_save_green,              undefined],

                ["EV_MX_CLICK",                 ac_mx_click,                undefined],
                ["EV_MX_SELECTION_CHANGE",      ac_selection_change,        undefined],
                ["EV_MX_ADDCELLS",              ac_mx_addcells,             undefined],
                ["EV_MX_MOVECELLS",             ac_mx_movecells,            undefined],
                ["EV_MX_RESIZECELLS",           ac_mx_resizecells,          undefined],
                ["EV_MX_CONNECTCELL",           ac_mx_connectcell,          undefined],

                ["EV_CLOSE_WINDOW",             ac_close_window,         undefined],
                ["EV_TOGGLE",                   ac_toggle,                  undefined],
                ["EV_SHOW",                     ac_show,                    undefined],
                ["EV_HIDE",                     ac_hide,                    undefined],
                ["EV_SELECT",                   ac_select,                  undefined],
                ["EV_REFRESH",                  ac_refresh,                 undefined],
                ["EV_REBUILD_PANEL",            ac_rebuild_panel,           undefined]
            ]
        }
    };

    var Mx_nodes_tree = GObj.__makeSubclass__();
    var proto = Mx_nodes_tree.prototype; // Easy access to the prototype
    proto.__init__= function(name, kw) {
        GObj.prototype.__init__.call(
            this,
            FSM,
            CONFIG,
            name,
            "Mx_nodes_tree",
            kw,
            0
        );
        return this;
    };
    gobj_register_gclass(Mx_nodes_tree, "Mx_nodes_tree");




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
    exports.Mx_nodes_tree = Mx_nodes_tree;

})(this);

