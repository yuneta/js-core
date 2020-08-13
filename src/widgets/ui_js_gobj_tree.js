/***********************************************************************
 *          ui_yuneta_js_gobj_tree.js
 *
 *          JS Gobj's tree UI
 *
 *          Copyright (c) 2020 Niyamaka
 *          All Rights Reserved.
 ***********************************************************************/
(function (exports) {
    'use strict';

    /********************************************
     *      Configuration (C attributes)
     ********************************************/
    var CONFIG = {
        gobj_graph: null,
        timeout_request: 1000,

        // Control anclaje al "app_menu"
        menu_topic_name: null,  // Set by parent
        menu_path: null,        // Set by parent
        multi_view: null,       // Set by parent
        $ui: null
    };




            /***************************
             *      Local Methods
             ***************************/




    /************************************************************
     *   Build name
     ************************************************************/
    function build_name(self, name)
    {
        return self.gobj_escaped_short_name() + "-" + name;
    }

    /************************************************************
     *   Webix UI
     ************************************************************/
    function build_webix(self)
    {
        var webix_tree = {
            id: build_name(self, "webix_tree"),
            view: "tree",
            scroll:"xy",
            type:"lineTree",
            select:true,
            on:{
                onAfterSelect:function(id) {
                    var gobj_id = this.getItem(id).id;
                    var gobj_ijs = __yuno__.gobj_find_unique_gobj(gobj_id);
                    if(!gobj_ijs) {
                        gobj_ijs = __yuno__.gobj_find_gobj(gobj_id);
                    }
                    if(gobj_ijs) {
                        var $dt = $$(build_name(self, "dt_attrs"));
                        $dt.clearAll();
                        var data = __yuno__.gobj_list_gobj_attr(gobj_ijs);
                        $dt.parse(data);
                    } else {
                        log_error("gobj not found: '" + gobj_id + "'");
                    }
                }
            }
        };

        var toolbar = {
            view:"toolbar",
            height: 30,
            css: "toolbar2color",
            cols:[
                {
                    view:"button",
                    type: "icon",
                    icon: "fas fa-sync-alt",
                    css: "webix_transparent btn_icon_toolbar_16",
                    label: "Refresh",
                    click: function() {
                        refresh_gobj_tree(self, true);
                    }
                },
                {
                    view:"button",
                    type: "icon",
                    icon: "far fa-plus-square",
                    css: "webix_transparent btn_icon_toolbar_16",
                    label: t("expand"),
                    click: function() {
                        $$(build_name(self, "webix_tree")).openAll();
                    }
                },
                {
                    view:"button",
                    type: "icon",
                    icon: "far fa-minus-square",
                    css: "webix_transparent icon_toolbar_16",
                    label: t("collapse"),
                    click: function() {
                        $$(build_name(self, "webix_tree")).closeAll();
                    }
                },
                { view:"label", label: ""}
            ]
        };

        var database = {
            id: build_name(self, "dt_attrs"),
            view: "datatable",
            tooltip: true,
            resizeColumn:true,
            resizeRow:false,
            resizeColumn: true,
            resizeRow: true,
            editable: true,
            editaction: "dblclick",
            gravity: 2,
            columns:[
                {
                    id: "id",
                    header: ["Id"],
                    minWidth:40,
                    fillspace:4
                },
                {
                    id: "name",
                    header: ["Attribute Name"],
                    minWidth:200,
                    fillspace:20
                },
                {
                    id: "type",
                    header: ["Type"],
                    minWidth:80,
                    fillspace:8
                },
                {
                    id: "value",
                    header: ["Current Value"],
                    //editor: "text", TODO haz editable los SDF_WR
                    minWidth:150,
                    fillspace:15
                },
                {
                    id: "stats",
                    header: ["Stats"],
                    minWidth:50,
                    fillspace:5
                },
                {
                    id: "description",
                    header: ["Description"],
                    minWidth:100,
                    fillspace: 30
                }
            ]
        };

        /*---------------------------------------*
         *      UI
         *---------------------------------------*/
        self.config.$ui = webix.ui({
            view: "scrollview",
            scroll: "auto",
            id: self.gobj_name(),
            body: {
                id: build_name(self, "work_area"),
                cols: [
                    {
                        rows: [
                            webix_tree,
                            toolbar
                        ]
                    },
                    { view:"resizer" },
                    database,
                    { view:"resizer" }
                ]
            }
        });
        self.config.$ui.gobj = self;
    }

    /************************************************************
     *
     ************************************************************/
    function link_ui(self)
    {
        __yuno__.__ui_main__.gobj_send_event(
            "EV_UPDATE",
            {
                menu_topic_name: self.config.menu_topic_name,
                menu_path: self.config.menu_path,
                record: {
                    id: self.name,
                    value: t("JS GObjs"),
                    icon: "fab fa-js-square",
                    action: function(id) {
                        __yuno__.__ui_main__.gobj_send_event("EV_SELECT", {id:id}, self);
                    }
                }
            },
            self
        );

        if(self.config.multi_view) {
            $$(self.config.multi_view).addView(self.config.$ui);
        }
    }

    /********************************************
     *
     ********************************************/
    function refresh_gobj_tree(self, clear)
    {
        var data = __yuno__.gobj_list_gobj_tree(__yuno__);

        if(clear) {
            self.config.gobj_graph.gobj_send_event(
                "EV_CLEAR_DATA",
                {
                },
                self
            );

        }
        self.config.gobj_graph.gobj_send_event(
            "EV_LOAD_DATA",
            {
                //layer: "",
                type: "webix-tree",
                data: data
            },
            self
        );

        var $tree = $$(build_name(self, "webix_tree"));
        $tree.clearAll();
        $tree.parse(data);
        $tree.openAll();
        $tree.select($tree.getFirstId());
    }




            /***************************
             *      Actions
             ***************************/




    /********************************************
     *
     ********************************************/
    function ac_click_cell(self, event, kw, src)
    {
        $$(build_name(self, "webix_tree")).select(kw.id);
        return 0;
    }

    /********************************************
     *
     ********************************************/
    function ac_timeout_request(self, event, kw, src)
    {
        refresh_gobj_tree(self, false);
        return 0;
    }

    /********************************************
     *
     ********************************************/
    function ac_select(self, event, kw, src)
    {

        return 0;
    }

    /********************************************
     *
     ********************************************/
    function ac_refresh(self, event, kw, src)
    {
        return 0;
    }




            /***************************
             *      GClass/Machine
             ***************************/




    var FSM = {
        "event_list": [
            "EV_CLICK_CELL",
            "EV_TIMEOUT",
            "EV_SELECT",
            "EV_REFRESH"
        ],
        "state_list": [
            "ST_IDLE"
        ],
        "machine": {
            "ST_IDLE":
            [

                ["EV_CLICK_CELL",           ac_click_cell,          undefined],
                ["EV_TIMEOUT",              ac_timeout_request,     undefined],
                ["EV_SELECT",               ac_select,              undefined],
                ["EV_REFRESH",              ac_refresh,             undefined]
            ]
        }
    };

    var Ui_js_gobj_tree = GObj.__makeSubclass__();
    var proto = Ui_js_gobj_tree.prototype; // Easy access to the prototype
    proto.__init__= function(name, kw) {
        GObj.prototype.__init__.call(
            this,
            FSM,
            CONFIG,
            name,
            "Ui_js_gobj_tree",
            kw,
            0
        );
        return this;
    };
    gobj_register_gclass(Ui_js_gobj_tree, "Ui_js_gobj_tree");




            /***************************
             *      Framework Methods
             ***************************/




    /************************************************
     *      Framework Method create
     ************************************************/
    proto.mt_create = function(kw)
    {
        var self = this;

        build_webix(self);

        /*
         *  Create mxgraph js gobj tree
         */
        self.config.gobj_graph = self.yuno.gobj_create(
            "",
            Mx_tree,
            {
                ui_properties: {
                    gravity: 3
                }
            },
            self
        );
        self.config.gobj_graph.gobj_start();
        $$(build_name(self, "work_area")).addView(
            self.config.gobj_graph.gobj_read_attr("$ui"),
            4
        );

    }

    /************************************************
     *      Framework Method destroy
     *      In this point, all childs
     *      and subscriptions are already deleted.
     ************************************************/
    proto.mt_destroy = function()
    {
        var self = this;
    }

    /************************************************
     *      Framework Method start
     ************************************************/
    proto.mt_start = function(kw)
    {
        var self = this;

        link_ui(self);
        self.set_timeout(self.config.timeout_request);
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
    exports.Ui_js_gobj_tree = Ui_js_gobj_tree;

})(this);

