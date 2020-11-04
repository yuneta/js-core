/***********************************************************************
 *          ui_gobj_tree_c.js
 *
 *          C Gobj's tree UI (i.e. a yuno)
 *
 *
 *  Version
 *  -------
 *  1.0     Initial release
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
        /*
         *  Funciones que debe suministrar el padre
         */
        info_wait: function() {},
        info_no_wait: function() {},

        /*
         *  gobj_remote_yuno: Remote service to ask data,
         *  if it's not a connected service then you must suply ON_OPEN/ON_CLOSE events
         */
        gobj_remote_yuno: null,

        gobj_container: null,
        gobj_je_gclass: null,
        gobj_mx_gobj_tree: null,
        gobj_formtable: null,
        gobj_gclass_viewer: null,
        timeout_request: 1000,
        data: null, // copia local de los datos visualizándose

        last_id_selected: null,

        ui_properties: null,
        $ui: null,

        __writable_attrs__: [
            "last_id_selected"
        ]
    };

    /************************************************************
     *   Schema
     ************************************************************/
    var attrs_cols = [
        {
            "id": "name",
            "header": "Name",
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
            "fillspace": 8,
            "type": "string",
            "flag": [
                "persistent",
                "required"
            ]
        },
        {
            "id": "value",
            "header": "Value",
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
            "id": "stats",
            "header": "Stats",
            "fillspace": 5,
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




    /********************************************
     *
     ********************************************/
    function build_toolbar(self, mode)
    {
        var elements = [
            {
                view:"button",
                type: "icon",
                icon: "fas fa-border-center-v",
                autowidth: true,
                css: "webix_transparent btn_icon_toolbar_16",
                tooltip: t("view mode: horizontal/vertical"),
                label: t("view mode"),
                click: function() {
                    self.config.gobj_container.gobj_send_event(
                        "EV_CHANGE_MODE",
                        {
                        },
                        self
                    );
                    refresh_gobj_tree(self);
                    if(self.config.gobj_container.gobj_read_attr("mode") == "horizontal") {
                        this.define("icon", "fas fa-border-center-v");
                    } else {
                        this.define("icon", "fas fa-border-center-h");
                    }
                    this.refresh();
                }
            },
            {
                view: "button",
                type: "icon",
                icon: "fas fa-sync",
                autowidth: true,
                css: "webix_transparent btn_icon_toolbar_16",
                tooltip: t("refresh"),
                label: t("refresh"),
                click: function() {
                    refresh_gobj_tree(self);
                }
            },
            {
                view: "button",
                type: "icon",
                icon: "fas fa-sitemap",
                autowidth: true,
                css: "webix_transparent btn_icon_toolbar_16",
                tooltip: t("Yuno"),
                label: t("Yuno"),
                click: function() {
                    /*-----------------------------------------*
                     *  Toggle panel view, "Container Panel"
                     *-----------------------------------------*/
                    toggle_container_panel(self.config.gobj_mx_gobj_tree);
                }
            },
            {
                view: "button",
                type: "image",
                image: "/static/app/images/yuneta/circle_red.svg",
                autowidth: true,
                css: "webix_transparent btn_icon_toolbar_16",
                tooltip: t("GClass"),
                label: t("GClass"),
                click: function() {
                    /*-----------------------------------------*
                     *  Toggle panel view, "Container Panel"
                     *-----------------------------------------*/
                    toggle_container_panel(self.config.gobj_gclass_viewer);
                }
            },
            {
                view: "button",
                type: "image",
                image: "/static/app/images/yuneta/circle_yellow.svg",
                autowidth: true,
                css: "webix_transparent btn_icon_toolbar_16",
                tooltip: t("attributes"),
                label: t("attributes"),
                click: function() {
                    /*-----------------------------------------*
                     *  Toggle panel view, "Container Panel"
                     *-----------------------------------------*/
                    toggle_container_panel(self.config.gobj_formtable);
                }
            },
            {
                view: "button",
                type: "icon",
                icon: "fas fa-folder-tree",
                autowidth: true,
                css: "webix_transparent btn_icon_toolbar_16",
                tooltip: t("TimeRanger"),
                label: t("TimeRanger"),
                click: function() {
                    /*-----------------------------------------*
                     *  Toggle panel view, "Container Panel"
                     *-----------------------------------------*/
                    toggle_container_panel(self.config.gobj_je_gclass);
                }
            }
        ];

        var toolbar = {
            view: "toolbar"
            //css: "toolbar2color"
        };
        if(mode == "vertical") {
            toolbar["width"] = 40;
            toolbar["rows"] = elements;
        } else {
            toolbar["height"] = 40;
            toolbar["cols"] = elements;
        }
        return toolbar;
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

        self.config.gobj_remote_yuno.gobj_command(
            command,
            kw_req,
            self
        );
    }

    /********************************************
     *
     ********************************************/
    function refresh_gobj_tree(self)
    {
        self.config.gobj_je_gclass.gobj_send_event(
            "EV_CLEAR_DATA",
            {
            },
            self
        );
        self.config.gobj_mx_gobj_tree.gobj_send_event(
            "EV_CLEAR_DATA",
            {
            },
            self
        );
        self.config.gobj_formtable.gobj_send_event(
            "EV_CLEAR_DATA",
            {
            },
            self
        );

        send_command_to_remote_yuno(self, "view-gobj-treedb", "__root__");
    }

    /********************************************
     *
     ********************************************/
    function get_gobj_formtable(self, kw)
    {
        self.config.gobj_formtable.gobj_send_event(
            "EV_CLEAR_DATA",
            {
            },
            self
        );

        send_command_to_remote_yuno(self, "view-attrs2", "__root__", {gobj_name:kw.id});
    }

    /********************************************
     *
     ********************************************/
    function get_gobj_gclass_viewer(self, kw)
    {
        self.config.gobj_gclass_viewer.gobj_send_event(
            "EV_CLEAR_DATA",
            {
            },
            self
        );

        send_command_to_remote_yuno(
            self, "view-gclass", "__root__", {gclass_name:kw.gclass_name}
        );
    }

    /********************************************
     *
     ********************************************/
    function process_view_gobj_treedb(self, data)
    {
        self.config.gobj_mx_gobj_tree.gobj_send_event(
            "EV_LOAD_DATA",
            {
                type: "gobj-tree",
                data: data
            },
            self
        );

        if(self.config.last_id_selected) {
            self.config.gobj_mx_gobj_tree.gobj_send_event(
                "EV_CLICK_ITEM",
                {id: self.config.last_id_selected},
                self
            );
        }
    }

    /********************************************
     *
     ********************************************/
    function process_view_instance(self, data)
    {
        self.config.gobj_formtable.gobj_send_event(
            "EV_LOAD_DATA",
            data,
            self
        );
    }

    /********************************************
     *
     ********************************************/
    function process_view_role(self, schema, data)
    {
        self.config.gobj_je_gclass.gobj_send_event(
            "EV_LOAD_DATA",
            {
                data: data
            },
            self
        );
        self.config.gobj_gclass_viewer.gobj_send_event(
            "EV_LOAD_DATA",
            {
                data: data
            },
            self
        );
    }




            /***************************
             *      Actions
             ***************************/




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
            case "view-gobj-treedb":
                process_view_gobj_treedb(self, data);
                break;

            case "view-attrs2":
                process_view_instance(self, data);
                break;

            case "view-gclass":
                process_view_role(self, schema, data);
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
        self.config.gobj_mx_gobj_tree.gobj_send_event(
            "EV_SELECT_ITEM",
            {id:id},
            self
        );

        if(self.config.gobj_gclass_viewer.gobj_read_attr("$ui").isVisible() ||
            self.config.gobj_je_gclass.gobj_read_attr("$ui").isVisible()
        ) {

            self.config.last_id_selected = id;
            if(self.gobj_is_unique()) {
                self.gobj_save_persistent_attrs();
            }
            get_gobj_gclass_viewer(self, kw);
        }
        if(self.config.gobj_formtable.gobj_read_attr("$ui").isVisible()) {
            get_gobj_formtable(self, kw);
        }

        return 0;
    }

    /********************************************
     *
     ********************************************/
    function ac_mx_role_class_clicked(self, event, kw, src)
    {
        // Show role viewer
        self.config.gobj_gclass_viewer.gobj_read_attr("$ui").show();

        get_gobj_gclass_viewer(self, kw);

        return 0;
    }

    /********************************************
     *
     ********************************************/
    function ac_mx_role_instance_clicked(self, event, kw, src)
    {
        // Show instance viewer
        self.config.gobj_formtable.gobj_read_attr("$ui").show();

        get_gobj_formtable(self, kw);

        return 0;
    }

    /********************************************
     *
     ********************************************/
    function ac_mx_overlay_clicked(self, event, kw, src)
    {
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
            "EV_MT_COMMAND_ANSWER",
            "EV_MX_VERTEX_CLICKED",
            "EV_MX_EDGE_CLICKED",
            "EV_MX_ROLE_CLASS_CLICKED",
            "EV_MX_ROLE_INSTANCE_CLICKED",
            "EV_MX_RUNNING_CLICKED",
            "EV_MX_STOPPED_CLICKED",
            "EV_MX_PLAYING_CLICKED",
            "EV_MX_SERVICE_CLICKED",
            "EV_MX_UNIQUE_CLICKED",
            "EV_MX_DISABLED_CLICKED",
            "EV_MX_TRACING_CLICKED",
            "EV_SELECT",
            "EV_REFRESH"
        ],
        "state_list": [
            "ST_IDLE"
        ],
        "machine": {
            "ST_IDLE":
            [
                ["EV_MT_COMMAND_ANSWER",        ac_mt_command_answer,       undefined],
                ["EV_MX_VERTEX_CLICKED",        ac_mx_vertex_clicked,       undefined],
                ["EV_MX_EDGE_CLICKED",          undefined,                  undefined],
                ["EV_MX_ROLE_CLASS_CLICKED",    ac_mx_role_class_clicked,   undefined],
                ["EV_MX_ROLE_INSTANCE_CLICKED", ac_mx_role_instance_clicked,undefined],
                ["EV_MX_RUNNING_CLICKED",       ac_mx_overlay_clicked,      undefined],
                ["EV_MX_STOPPED_CLICKED",       ac_mx_overlay_clicked,      undefined],
                ["EV_MX_PLAYING_CLICKED",       ac_mx_overlay_clicked,      undefined],
                ["EV_MX_SERVICE_CLICKED",       ac_mx_overlay_clicked,      undefined],
                ["EV_MX_UNIQUE_CLICKED",        ac_mx_overlay_clicked,      undefined],
                ["EV_MX_DISABLED_CLICKED",      ac_mx_overlay_clicked,      undefined],
                ["EV_MX_TRACING_CLICKED",       ac_mx_overlay_clicked,      undefined],
                ["EV_SELECT",                   ac_select,                  undefined],
                ["EV_REFRESH",                  ac_refresh,                 undefined]
            ]
        }
    };

    var Ui_gobj_tree_c = GObj.__makeSubclass__();
    var proto = Ui_gobj_tree_c.prototype; // Easy access to the prototype
    proto.__init__= function(name, kw) {
        GObj.prototype.__init__.call(
            this,
            FSM,
            CONFIG,
            name,
            "Ui_gobj_tree_c",
            kw,
            0
        );
        return this;
    };
    gobj_register_gclass(Ui_gobj_tree_c, "Ui_gobj_tree_c");




            /***************************
             *      Framework Methods
             ***************************/




    /************************************************
     *      Framework Method create
     ************************************************/
    proto.mt_create = function(kw)
    {
        var self = this;

        /*
         *  Create container
         */
        self.config.gobj_container = self.yuno.gobj_create_unique(
            self.name + ".ct",
            Ui_container,
            {
                mode: "horizontal"
            },
            self
        );
        self.config.$ui = self.config.gobj_container.gobj_read_attr("$ui");

        /*
         *  Add toolbar
         */
        self.config.gobj_container.gobj_send_event(
            "EV_ADD_TOOLBAR",
            {
                type: "container_right_toolbar",
                toolbar: build_toolbar(self, "vertical")
            },
            self
        );

        /*
         *  Create mxgraph c gobj tree
         */
        self.config.gobj_mx_gobj_tree = self.yuno.gobj_create_unique(
            self.name + ".gt",
            Mx_gobj_tree,
            {
                ui_properties: {
                    gravity: 4,
                    minWidth: 360,
                    minHeight: 500
                },

                panel_properties: {
                    with_panel_top_toolbar: true,
                    with_panel_title: t("GObj Tree"),
                    with_panel_hidden_btn: true,
                    with_panel_fullscreen_btn: true,
                    with_panel_resize_btn: true
                }
            },
            self.config.gobj_container
        );

        /*
         *  Create attributes table
         */
        self.config.gobj_gclass_viewer = self.yuno.gobj_create_unique(
            self.name + ".cv",
            Ui_gclass_viewer,
            {
                ui_properties: {
                    hidden:true,
                    gravity: 3,
                    minWidth: 360,
                    minHeight: 500
                },

                panel_properties: {
                    with_panel_top_toolbar: true,
                    with_panel_title: t("GClass Viewer"),
                    with_panel_hidden_btn: true,
                    with_panel_fullscreen_btn: true,
                    with_panel_resize_btn: true
                }
            },
            self.config.gobj_container
        );

        /*
         *  Create attributes table
         */
        self.config.gobj_formtable = self.yuno.gobj_create_unique(
            self.name + ".ob",
            Ui_formtable,
            {
                ui_properties: {
                    hidden:true,
                    gravity: 2,
                    minWidth: 360,
                    minHeight: 500
                },
                schema: attrs_cols,
                with_checkbox: false,
                with_textfilter: false,
                with_sort: true,
                with_footer: true,

                panel_properties: {
                    with_panel_top_toolbar: true,
                    with_panel_title: t("GObj Attrs"),
                    with_panel_hidden_btn: true,
                    with_panel_fullscreen_btn: true,
                    with_panel_resize_btn: true
                }
            },
            self.config.gobj_container
        );

        /*
         *  Create gclass json
         */
        self.config.gobj_je_gclass = self.yuno.gobj_create_unique(
            self.name + ".tr",
            Je_viewer,
            {
                ui_properties: {
                    gravity: 4,
                    minWidth: 360,
                    minHeight: 500
                },

                panel_properties: {
                    with_panel_top_toolbar: true,
                    with_panel_title: t("GClass Json"),
                    with_panel_hidden_btn: true,
                    with_panel_fullscreen_btn: true,
                    with_panel_resize_btn: true
                }
            },
            self.config.gobj_container
        );

        self.config.gobj_container.gobj_start_tree();
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

        refresh_gobj_tree(self);
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
    exports.Ui_gobj_tree_c = Ui_gobj_tree_c;

})(this);

