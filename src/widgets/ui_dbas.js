/***********************************************************************
 *          ui_dbas.js
 *
 *          Timeranger Database manager
 *
 *  Version
 *  -------
 *  1.0     Initial release
 *  1.1     Quito mx example
 *          Relleno formtable con el schema del topic seleccionado
 *          Movido a yuneta widgets
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
        /*
         *  Funciones que debe suministrar el padre
         */
        info_wait: function() {},
        info_no_wait: function() {},

        /*
         *
         */
        remote_service: null, // Servicio remoto al que pedir los datos
        tranger: null,
        expanded: true,
        lists_limit: 50,
        dicts_limit: 50,

        /*
         *  ui_properties to container
         */
        ui_properties: null,

        gobj_container: null,
        gobj_je_tranger: null,
        gobj_tranger_viewer: null,
        gobj_mx_example: null,
        gobj_formtable: null,

        $ui: null,              // $ui from container

        last_id_selected: null,

        __writable_attrs__: [
            "last_id_selected"
        ]
    };

    /************************************************************
     *   Schema
     ************************************************************/
    var attrs_cols = [
        {
            "id": "id",
            "header": "Id",
            "fillspace": 10,
            "type": "string",
            "flag": [
                "required"
            ]
        },
        {
            "id": "header",
            "header": "Header",
            "fillspace": 10,
            "type": "string",
            "flag": []
        },
        {
            "id": "fillspace",
            "header": "Fillspace",
            "fillspace": 4,
            "type": "integer",
            "flag": []
        },
        {
            "id": "type",
            "header": "Type",
            "fillspace": 10,
            "type": "enum",
            "enum": [
                "string",
                "integer",
                "object",
                "dict",
                "array",
                "list",
                "real",
                "boolean",
                "enum",
                "blob"
            ],
            "flag": [
                "required",
                "notnull"
            ]
        },
        {
            "id": "flag",
            "header": "Flag",
            "fillspace": 10,
            "type": "enum",
            "enum": [
                "",
                "persistent",
                "required",
                "fkey",
                "hook",
                "uuid",
                "notnull",
                "wild",
                "rowid",
                "inherit",
                "readable",
                "writable",
                "stats",
                "rstats",
                "pstats",
                "password",
                "email",
                "url"
            ],
            "flag": []
        },
        {
            "id": "default",
            "header": "Default",
            "fillspace": 10,
            "type": "blob",
            "flag": []
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
                css: "webix_transparent btn_icon_toolbar_20",
                tooltip: t("view mode: horizontal/vertical"),
                label: t("view mode"),
                click: function() {
                    self.config.gobj_container.gobj_send_event(
                        "EV_CHANGE_MODE",
                        {
                        },
                        self
                    );
                    refresh_tranger(self);
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
                css: "webix_transparent btn_icon_toolbar_18",
                tooltip: t("refresh"),
                label: t("refresh"),
                click: function() {
                    refresh_tranger(self);
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
                    toggle_container_panel(self.config.gobj_je_tranger);
                }
            },
            {
                view: "button",
                type: "icon",
                icon: "fas fa-project-diagram",
                autowidth: true,
                css: "webix_transparent btn_icon_toolbar_16",
                tooltip: t("Treedb Schema"),
                label: t("Treedb Schema"),
                click: function() {
                    /*-----------------------------------------*
                     *  Toggle panel view, "Container Panel"
                     *-----------------------------------------*/
                    toggle_container_panel(self.config.gobj_tranger_viewer);
                }
            },
            {
                view: "button",
                type: "icon",
                icon: "fal fa-table",
                autowidth: true,
                css: "webix_transparent btn_icon_toolbar_20",
                tooltip: t("FormTable"),
                label: t("FormTable"),
                click: function() {
                    /*-----------------------------------------*
                     *  Toggle panel view, "Container Panel"
                     *-----------------------------------------*/
                    toggle_container_panel(self.config.gobj_formtable);
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
    function send_command_to_remote_service(self, service, command, kw)
    {
        if(!self.config.remote_service) {
            log_error(self.gobj_short_name() + ": No remote_service defined");
            return;
        }
        var kw_req = {
            service: service
        };
        if(kw) {
            __extend_dict__(kw_req, kw);
        }
        msg_write_MIA_key(kw_req, "__command__", command);

        self.config.info_wait();

        var ret = self.config.remote_service.gobj_command(
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
    function refresh_tranger(self)
    {
        self.config.gobj_je_tranger.gobj_send_event(
            "EV_CLEAR_DATA",
            {
            },
            self
        );
        self.config.gobj_tranger_viewer.gobj_send_event(
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

        send_command_to_remote_service(
            self,
            "__root__",
            "get-2key-value",
            {
                key1: "tranger",
                key2: self.config.tranger,
                expanded: self.config.expanded,
                lists_limit: self.config.lists_limit,
                dicts_limit: self.config.dicts_limit
            }
        );
    }

    /********************************************
     *
     ********************************************/
    function process_get_2key_value(self, data, clear)
    {
        self.config.gobj_je_tranger.gobj_send_event(
            "EV_LOAD_DATA",
            {
                data: data
            },
            self
        );
        self.config.gobj_tranger_viewer.gobj_send_event(
            "EV_LOAD_DATA",
            {
                name: 'TimeRanger<b><br/>' + self.name + '</b>',
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
            log_error(comment);
        } else {
            if(comment) {
                log_warning(comment);
            }
        }

        switch(__md_iev__.__command__) {
            case "get-2key-value":
                process_get_2key_value(self, data);
                break;

            case "get-2key-subvalue":
//                 process_get_2key_subvalue(self, data);
//                 break;

            default:
                log_error(self.gobj_short_name() + " Command unknown: " + __md_iev__.__command__);
        }

        return 0;
    }

    /********************************************
     *
     ********************************************/
    function ac_mx_vertex_clicked(self, event, kw, src)
    {
        var schema = kwid_collect(kw.cols, null, null, null);

        self.config.gobj_formtable.gobj_send_event(
            "EV_CLEAR_DATA",
            {
            },
            self
        );
        self.config.gobj_formtable.gobj_send_event(
            "EV_LOAD_DATA",
            schema,
            self
        );
        return 0;
    }

    /********************************************
     *
     ********************************************/
    function ac_mx_show_topic_json_graph(self, event, kw, src)
    {
        var name = src.gobj_escaped_short_name() + "-json-" + kw.topic_name;

        var gobj_schema_viewer = self.yuno.gobj_find_unique_gobj(name);
        if(gobj_schema_viewer) {
            gobj_schema_viewer.gobj_send_event("EV_TOGGLE", {}, self);
            return 0;
        }
        gobj_schema_viewer = self.yuno.gobj_create_unique(
            name,
            Mx_json_viewer,
            {
                window_title: "Json View of " + kw.topic_name,
                window_image: kw.image,
                width: 800,
                height: 600
            },
            __yuno__.__pinhold__
        );
        gobj_schema_viewer.gobj_send_event(
            "EV_LOAD_DATA",
            {
                path: "topics`" + kw.topic_name, // HACK path hardcoded
                data: kw.topic
            },
            self
        );


        return 0;
    }

    /********************************************
     *
     ********************************************/
    function ac_mx_show_topic_schema_form(self, event, kw, src)
    {
        var name = src.gobj_escaped_short_name() + "-formtable-" + kw.topic_name;

        var gobj_schema_viewer = self.yuno.gobj_find_unique_gobj(name);
        if(gobj_schema_viewer) {
            gobj_schema_viewer.gobj_send_event("EV_TOGGLE", {}, self);
            return 0;
        }
        gobj_schema_viewer = self.yuno.gobj_create_unique(
            name,
            Ui_formtable,
            {
                ui_properties: {
                    gravity: 3,
                    minWidth: 360,
                    minHeight: 500
                },

                schema: attrs_cols,
                with_checkbox: false,
                with_textfilter: true,
                with_sort: true,
                with_top_title: true,
                with_footer: true,
                with_navigation_toolbar: true,
                update_mode_enabled: true,
                create_mode_enabled: true,
                delete_mode_enabled: true,

                panel_properties: {
                    with_panel_top_toolbar: true,
                    with_panel_title: "FormTable " + kw.topic_name, //self.name,
                    with_panel_hidden_btn: true,
                    with_panel_fullscreen_btn: true,
                    with_panel_resize_btn: true
                },
                is_pinhold_window: true,
                window_title: "FormTable of " + kw.topic_name,
                window_image: kw.image,
                width: 800,
                height: 600
            },
            __yuno__.__pinhold__
        );

        var schema = kwid_collect(kw.topic.cols, null, null, null);

        gobj_schema_viewer.gobj_send_event(
            "EV_CLEAR_DATA",
            {
            },
            self
        );
        gobj_schema_viewer.gobj_send_event(
            "EV_LOAD_DATA",
            schema,
            self
        );


        return 0;
    }

    /********************************************
     *
     ********************************************/
    function ac_mx_view_data_in_disk(self, event, kw, src)
    {

        var $img = webix.ui({
            view: "button",
            type: "image",
            image: "",
            css: "webix_transparent",
            maxWidth: 110,
            click: function() {
            }
        });
        return 0;
    }

    /********************************************
     *
     ********************************************/
    function ac_mx_view_data_in_memory(self, event, kw, src)
    {
        return 0;
    }

    /********************************************
     *
     ********************************************/
    function ac_mx_view_data_on_moving(self, event, kw, src)
    {
        return 0;
    }

    /********************************************
     *
     ********************************************/
    function ac_on_open(self, event, kw, src)
    {
        refresh_tranger(self);
        return 0;
    }

    /********************************************
     *
     ********************************************/
    function ac_on_close(self, event, kw, src)
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
            "EV_MX_SHOW_TOPIC_JSON_GRAPH",
            "EV_MX_SHOW_TOPIC_SCHEMA_FORM",
            "EV_MX_VIEW_DATA_IN_DISK",
            "EV_MX_VIEW_DATA_IN_MEMORY",
            "EV_MX_VIEW_DATA_ON_MOVING",
            "EV_ON_OPEN",
            "EV_ON_CLOSE",
            "EV_SELECT",
            "EV_REFRESH"
        ],
        "state_list": [
            "ST_IDLE"
        ],
        "machine": {
            "ST_IDLE":
            [
                ["EV_MT_COMMAND_ANSWER",            ac_mt_command_answer,           undefined],
                ["EV_MX_VERTEX_CLICKED",            ac_mx_vertex_clicked,           undefined],
                ["EV_MX_SHOW_TOPIC_JSON_GRAPH",     ac_mx_show_topic_json_graph,    undefined],
                ["EV_MX_SHOW_TOPIC_SCHEMA_FORM",    ac_mx_show_topic_schema_form,   undefined],
                ["EV_MX_VIEW_DATA_IN_DISK",         ac_mx_view_data_in_disk,        undefined],
                ["EV_MX_VIEW_DATA_IN_MEMORY",       ac_mx_view_data_in_memory,      undefined],
                ["EV_MX_VIEW_DATA_ON_MOVING",       ac_mx_view_data_on_moving,      undefined],
                ["EV_ON_OPEN",                      ac_on_open,                     undefined],
                ["EV_ON_CLOSE",                     ac_on_close,                    undefined],
                ["EV_SELECT",                       ac_select,                      undefined],
                ["EV_REFRESH",                      ac_refresh,                     undefined]
            ]
        }
    };

    var Ui_dbas = GObj.__makeSubclass__();
    var proto = Ui_dbas.prototype; // Easy access to the prototype
    proto.__init__= function(name, kw) {
        GObj.prototype.__init__.call(
            this,
            FSM,
            CONFIG,
            name,
            "Ui_dbas",
            kw,
            0
        );
        return this;
    };
    gobj_register_gclass(Ui_dbas, "Ui_dbas");




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
         *  Create TimeRanger
         */
        self.config.gobj_je_tranger = self.yuno.gobj_create_unique(
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
                    with_panel_title: "Tranger JSON " + self.name,
                    with_panel_hidden_btn: true,
                    with_panel_fullscreen_btn: true,
                    with_panel_resize_btn: true
                }
            },
            self.config.gobj_container
        );

        /*
         *  Create Treedb Schema
         */
        self.config.gobj_tranger_viewer = self.yuno.gobj_create_unique(
            self.name + ".sch",
            Mx_tranger_viewer,
            {
                ui_properties: {
                    gravity: 4,
                    minWidth: 360,
                    minHeight: 500
                },

                panel_properties: {
                    with_panel_top_toolbar: true,
                    with_panel_title: "Tranger " + self.name,
                    with_panel_hidden_btn: false,
                    with_panel_fullscreen_btn: true,
                    with_panel_resize_btn: true
                }
            },
            self.config.gobj_container
        );

        /*
         *  Create FormTable
         */
        self.config.gobj_formtable = self.yuno.gobj_create_unique(
            self.name + ".ft",
            Ui_formtable,
            {
                ui_properties: {
                    gravity: 3,
                    minWidth: 360,
                    minHeight: 500
                },
                schema: attrs_cols,

                panel_properties: {
                    with_panel_top_toolbar: true,
                    with_panel_title: "FormTable " + self.name,
                    with_panel_hidden_btn: true,
                    with_panel_fullscreen_btn: true,
                    with_panel_resize_btn: true
                }
            },
            self.config.gobj_container
        );

    }

    /************************************************
     *      Framework Method destroy
     *      In this point, all childs
     *      and subscriptions are already deleted.
     ************************************************/
    proto.mt_destroy = function()
    {
    }

    /************************************************
     *      Framework Method start
     ************************************************/
    proto.mt_start = function(kw)
    {
        var self = this;

        if(self.config.remote_service) {
            refresh_tranger(self);
        }
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
    exports.Ui_dbas = Ui_dbas;

})(this);
