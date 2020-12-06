/***********************************************************************
 *          ui_tb_node.js
 *
 *          Management of Treedb's Node with Formtable
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
         *  gobj_remote_yuno: Remote yuno to ask data,
         *  if it's not a connected service then you must suply ON_OPEN/ON_CLOSE events
         */
        gobj_remote_yuno: null,

        treedb_name: null,
        topic_name: null,

        schema: null,
        gobj_formtable: null,

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
        // We need unique names
        if(empty_string(self.gobj_name())) {
            if(!self._uuid_name) {
                self._uuid_name = get_unique_id(self.gobj_gclass_name());
            }
            return self._uuid_name + "-" + name;
        }
        return self.gobj_escaped_short_name() + "-"+ name;
    }

    /********************************************
     *
     ********************************************/
    function send_command_to_treedb(self, command, service, topic_name, kw)
    {
        if(!self.config.gobj_remote_yuno) {
            log_error(self.gobj_short_name() + ": No gobj_remote_yuno defined");
            return;
        }
        if(service) {
            kw.service = service;
        }
        if(topic_name) {
            kw.topic_name = topic_name;
            msg_write_MIA_key(kw, "__topic_name__", topic_name);
        }
        msg_write_MIA_key(kw, "__command__", command);

        self.config.info_wait();

        var ret = self.config.gobj_remote_yuno.gobj_command(
            command,
            kw,
            self
        );
        if(ret) {
            log_error(ret);
        }
    }

    /********************************************
     *
     ********************************************/
    function refresh_node(self)
    {
        self.config.gobj_formtable.gobj_send_event(
            "EV_CLEAR_DATA",
            {
            },
            self
        );

        send_command_to_treedb(
            self,
            "nodes",
            self.config.treedb_name,
            self.config.topic_name,
            {}
        );
    }




            /***************************
             *      Actions
             ***************************/




    /********************************************
     *
     ********************************************/
    function ac_open_window(self, event, kw, src)
    {
        self.config.gobj_formtable.gobj_send_event("EV_TOGGLE", {}, self);
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
            info_user_warning(comment);
            // HACK don't return, pass errors when need it.
        } else {
            if(comment) {
                // log_info(comment); No pintes
            }
        }

        switch(__md_iev__.__command__) {
            case "nodes":
                if(result >= 0) {
                    self.config.schema = schema;
                    self.config.gobj_formtable.gobj_send_event(
                        "EV_REBUILD_TABLE",
                        {
                            topic_name: schema.topic_name,
                            cols: schema.cols
                        },
                        self
                    );
                    self.config.gobj_formtable.gobj_send_event(
                        "EV_LOAD_DATA",
                        data,
                        self
                    );
                }
                break;

            case "create-node":
                if(result >= 0) {
                    self.config.gobj_formtable.gobj_send_event(
                        "EV_LOAD_DATA",
                        is_object(data)?[data]:data,
                        self
                    );
                }
                break;

            case "update-node":
                self.config.gobj_formtable.gobj_send_event(
                    "EV_LOAD_DATA",
                    is_object(data)?[data]:data,
                    self
                );
                break;

            case "delete-node":
                if(result >= 0) {
                }
                break;

            default:
                log_error(self.gobj_short_name() + " Command unknown: " + __md_iev__.__command__);
        }

        return 0;
    }

    /********************************************
     *  Remote subscription response
     ********************************************/
    function ac_treedb_node_updated(self, event, kw, src)
    {
        var treedb_name = kw_get_str(kw, "treedb_name", "", 0);
        var topic_name = kw_get_str(kw, "topic_name", "", 0);
        var node = kw_get_dict_value(kw, "node", null, 0);

        if(treedb_name == self.config.treedb_name &&
                topic_name == self.config.topic_name) {
            self.config.gobj_formtable.gobj_send_event(
                "EV_LOAD_DATA",
                is_object(node)?[node]:node,
                self
            );
        }

        return 0;
    }

    /********************************************
     *  Remote subscription response
     ********************************************/
    function ac_treedb_node_deleted(self, event, kw, src)
    {
        var treedb_name = kw_get_str(kw, "treedb_name", "", 0);
        var topic_name = kw_get_str(kw, "topic_name", "", 0);
        var node = kw_get_dict_value(kw, "node", null, 0);

        if(treedb_name == self.config.treedb_name &&
                topic_name == self.config.topic_name) {
            self.config.gobj_formtable.gobj_send_event(
                "EV_DELETE_DATA",
                is_object(node)?[node]:node,
                self
            );
        }

        return 0;
    }

    /********************************************
     *
     ********************************************/
    function ac_create_record(self, event, kw, src)
    {
        send_command_to_treedb(
            self,
            "create-node",
            self.config.treedb_name,
            self.config.topic_name,
            {
                record: kw.record
            }
        );
        return 0;
    }

    /********************************************
     *
     ********************************************/
    function ac_update_record(self, event, kw, src)
    {
        send_command_to_treedb(
            self,
            "update-node",
            self.config.treedb_name,
            self.config.topic_name,
            {
                record: kw.record

            }
        );
        return 0;
    }

    /********************************************
     *
     ********************************************/
    function ac_delete_record(self, event, kw, src)
    {
        send_command_to_treedb(
            self,
            "delete-node",
            self.config.treedb_name,
            self.config.topic_name,
            {
                filter: {
                    id: kw.record.id
                }
            }
        );
        return 0;
    }

    /********************************************
     *
     ********************************************/
    function ac_refresh_table(self, event, kw, src)
    {
        refresh_node(self);
        return 0;
    }

    /********************************************
     *  From formtable,
     *  when window is destroying or minififying
     ********************************************/
    function ac_close_formtable(self, event, kw, src)
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
            "EV_TREEDB_NODE_UPDATED",
            "EV_TREEDB_NODE_DELETED",
            "EV_OPEN_WINDOW",
            "EV_CREATE_RECORD",
            "EV_UPDATE_RECORD",
            "EV_DELETE_RECORD",
            "EV_REFRESH_TABLE",
            "EV_CLOSE_WINDOW",
            "EV_SELECT",
            "EV_REFRESH"
        ],
        "state_list": [
            "ST_IDLE"
        ],
        "machine": {
            "ST_IDLE":
            [
                ["EV_MT_COMMAND_ANSWER",    ac_mt_command_answer,   undefined],
                ["EV_TREEDB_NODE_UPDATED",  ac_treedb_node_updated, undefined],
                ["EV_TREEDB_NODE_DELETED",  ac_treedb_node_deleted, undefined],
                ["EV_OPEN_WINDOW",          ac_open_window,         undefined],
                ["EV_CREATE_RECORD",        ac_create_record,       undefined],
                ["EV_UPDATE_RECORD",        ac_update_record,       undefined],
                ["EV_DELETE_RECORD",        ac_delete_record,       undefined],
                ["EV_REFRESH_TABLE",        ac_refresh_table,       undefined],
                ["EV_CLOSE_WINDOW",         ac_close_formtable,     undefined],
                ["EV_SELECT",               ac_select,              undefined],
                ["EV_REFRESH",              ac_refresh,             undefined]
            ]
        }
    };

    var Ui_tb_node = GObj.__makeSubclass__();
    var proto = Ui_tb_node.prototype; // Easy access to the prototype
    proto.__init__= function(name, kw) {
        GObj.prototype.__init__.call(
            this,
            FSM,
            CONFIG,
            name,
            "Ui_tb_node",
            kw,
            0
        );
        return this;
    };
    gobj_register_gclass(Ui_tb_node, "Ui_tb_node");




            /***************************
             *      Framework Methods
             ***************************/




    /************************************************
     *      Framework Method create
     ************************************************/
    proto.mt_create = function(kw)
    {
        var self = this;

        self.config.gobj_formtable = self.yuno.gobj_create_unique(
            build_name(self, "-formtable"),
            Ui_formtable,
            {
                subscriber: self,  // HACK get all output events

                ui_properties: {
                    gravity: 3,
                    minWidth: 200,
                    minHeight: 200
                },

                treedb_name: self.config.treedb_name,
                topic_name: self.config.topic_name,
                cols: null, // later, when arriving data
                global_data: true,
                is_topic_schema: false,
                with_checkbox: false,
                with_textfilter: true,
                with_sort: true,
                with_top_title: true,
                with_footer: true,
                with_navigation_toolbar: true,
                hide_private_fields: false, // TODO TEST dejalo en true, para probar el json
                update_mode_enabled: true,
                create_mode_enabled: true,
                delete_mode_enabled: true,

                window_properties: {
                    without_window_pin_btn: false,
                    without_window_fullscreen_btn: false,
                    without_window_close_btn: false,
                    without_destroy_window_on_close: true,
                    without_create_window_on_start: true
                },
                is_pinhold_window: true,
                window_title: self.config.topic_name,
                window_image: "",
                width: 950,
                height: 600
            },
            __yuno__.__pinhold__
        );
        self.config.gobj_formtable.config.$ui.hide();
    }

    /************************************************
     *      Framework Method destroy
     *      In this point, all childs
     *      and subscriptions are already deleted.
     ************************************************/
    proto.mt_destroy = function()
    {
        var self = this;
        if(self.config.global_data) {
            // TODO unregister
        }
    }

    /************************************************
     *      Framework Method start
     ************************************************/
    proto.mt_start = function(kw)
    {
        var self = this;

        refresh_node(self);

        self.config.gobj_remote_yuno.gobj_subscribe_event(
            "EV_TREEDB_NODE_UPDATED",
            {
                __service__: self.config.treedb_name,
                __filter__: {
                    "topic_name": self.config.topic_name
                }
            },
            self
        );
        self.config.gobj_remote_yuno.gobj_subscribe_event(
            "EV_TREEDB_NODE_DELETED",
            {
                __service__: self.config.treedb_name,
                __filter__: {
                    "topic_name": self.config.topic_name
                }
            },
            self
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
    exports.Ui_tb_node = Ui_tb_node;

})(this);
