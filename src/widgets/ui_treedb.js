/***********************************************************************
 *          ui_treedb.js
 *
 *          Treedb
 *
 *          Copyright (c) 2021 Niyamaka.
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
         *  If it's not a connected service then you must suply ON_OPEN/ON_CLOSE events
         */
        gobj_remote_yuno: null,
        treedb_name: null,
        topics: null,

        descs: null,

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

    /********************************************
     *
     ********************************************/
    function get_gobj_formtable(self, topic_name)
    {
        for(var i=0; i<self.config.topics.length; i++) {
            var topic = self.config.topics[i];
            if(topic_name == topic.topic_name) {
                return topic.gobj_formtable;
            }
        }
        return null;
    }

    /********************************************
     *
     ********************************************/
    function treedb_nodes(self, treedb_name, topic_name, options)
    {
        if(!self.config.gobj_remote_yuno) {
            log_error(self.gobj_short_name() + ": No gobj_remote_yuno defined");
            return;
        }

        var command = "nodes";

        var kw = {
            service: treedb_name,
            topic_name: topic_name,
            options: options || {}
        }

        msg_write_MIA_key(kw, "__topic_name__", topic_name);
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
    function treedb_create_node(self, treedb_name, topic_name, record, options)
    {
        if(!self.config.gobj_remote_yuno) {
            log_error(self.gobj_short_name() + ": No gobj_remote_yuno defined");
            return;
        }

        var command = "create-node";

        var kw = {
            service: treedb_name,
            topic_name: topic_name,
            record: record,
            options: options || {}
        }

        msg_write_MIA_key(kw, "__topic_name__", topic_name);
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
    function treedb_update_node(self, treedb_name, topic_name, record, options)
    {
        if(!self.config.gobj_remote_yuno) {
            log_error(self.gobj_short_name() + ": No gobj_remote_yuno defined");
            return;
        }

        var command = "update-node";

        var kw = {
            service: treedb_name,
            topic_name: topic_name,
            record: record,
            options: options || {}
        }

        msg_write_MIA_key(kw, "__topic_name__", topic_name);
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
    function treedb_delete_node(self, treedb_name, topic_name, record, options)
    {
        if(!self.config.gobj_remote_yuno) {
            log_error(self.gobj_short_name() + ": No gobj_remote_yuno defined");
            return;
        }

        var command = "delete-node";

        var kw = {
            service: treedb_name,
            topic_name: topic_name,
            record: record,
            options: options || {}
        }

        msg_write_MIA_key(kw, "__topic_name__", topic_name);
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
    function refresh_treedb(self)
    {
        for(var i=0; i<self.config.topics.length; i++) {
            var topic = self.config.topics[i];
            var topic_name = topic.topic_name;

            topic.gobj_formtable.gobj_send_event(
                "EV_CLEAR_DATA",
                {
                },
                self
            );

            treedb_nodes(
                self,
                self.config.treedb_name,
                topic_name,
                {}
            );
        }
    }

    /********************************************
     *
     ********************************************/
    function treedb_descs(self)
    {
        if(!self.config.gobj_remote_yuno) {
            log_error(self.gobj_short_name() + ": No gobj_remote_yuno defined");
            return;
        }

        var command = "descs";

        var kw = {
            service: self.config.treedb_name
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

    /************************************************************
     *
     ************************************************************/
    function create_topics_formtable(self)
    {
        for(var i=0; i<self.config.topics.length; i++) {
            var topic = self.config.topics[i];
            var topic_name = topic.topic_name;
            var label = topic.label;

            topic["gobj_formtable"] = __yuno__.gobj_create_unique(
                build_name(self, topic_name + " formtable"),
                Ui_formtable,
                {
                    subscriber: self,  // HACK get all output events

                    ui_properties: {
                        hidden: true
                    },

                    treedb_name: self.config.treedb_name,
                    topic_name: topic_name,
                    cols: null, // later, when arriving data
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
                    window_title: label,
                    window_image: "",
                    width: 950,
                    height: 600
                },
                __yuno__.__pinhold__
            );

            topic["gobj_formtable"].gobj_start();
        }
    }

    /************************************************************
     *
     ************************************************************/
    function process_descs(self)
    {
        for(var i=0; i<self.config.topics.length; i++) {
            var topic_name = self.config.topics[i].topic_name;
            var desc = self.config.descs[topic_name];
            if(!desc) {
                log_error("topic desc unknown: " + topic_name);
                continue;
            }

            self.config.gobj_remote_yuno.gobj_subscribe_event(
                "EV_TREEDB_NODE_UPDATED",
                {
                    __service__: self.config.treedb_name,
                    __filter__: {
                        "treedb_name": self.config.treedb_name,
                        "topic_name": topic_name
                    }
                },
                self
            );
            self.config.gobj_remote_yuno.gobj_subscribe_event(
                "EV_TREEDB_NODE_DELETED",
                {
                    __service__: self.config.treedb_name,
                    __filter__: {
                        "treedb_name": self.config.treedb_name,
                        "topic_name": topic_name
                    }
                },
                self
            );
        }
    }

    /************************************************************
     *  Update treedb tables options that have topic_name ref
     *
     *  reg {
     *      data: {
     *          "$topic_name": {
     *              "$id": {}
     *           }
     *      },
     *
     *      gobjs: {
     *          "$gobj_unique_name":  "$gobj"
     *      }
     *  }
     *
     ************************************************************/
    function update_options(self, updated_topic_name)
    {
        var data = treedb_get_topic_data(self.config.treedb_name, updated_topic_name)
        if(json_object_size(data)==0) {
            return;
        }

        var reg = treedb_get_register(self.config.treedb_name);
        var tables2update = {};
        for(var topic_name in self.config.descs) {
            var desc = self.config.descs[topic_name];
            var cols = desc.cols;
            for(var i=0; i<cols.length; i++) {
                var col = cols[i];
                if(kw_has_key(col, "hook")) {
                    for(var k in col.hook) {
                        if(k == updated_topic_name) {
                            var t = kw_get_dict_value(tables2update, topic_name, {}, true);
                            t[col.id] = true;
                            //trace_msg("update " + topic_name + ", hook " + col.id);
                        }
                    }
                }
                if(kw_has_key(col, "fkey")) {
                    for(var k in col.fkey) {
                        if(k == updated_topic_name) {
                            var t = kw_get_dict_value(tables2update, topic_name, {}, true);
                            t[col.id] = true;
                            //trace_msg("update " + topic_name + ", fkey " + col.id);
                        }
                    }
                }
            }
        }

        for(var topic_name in tables2update) {
            var cols = tables2update[topic_name];
            for(var gobj_name in reg.gobjs) {
                var gobj = reg.gobjs[gobj_name];
                if(topic_name != gobj.gobj_read_attr("topic_name")) {
                    continue;
                }
                gobj.gobj_send_event(
                    "EV_UPDATE_OPTIONS",
                    {
                        // No hace falta, se reconstruye entero
                        //cols: cols,
                        //data: data
                    },
                    self
                );
            }
        }
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
            info_user_warning(comment);
            // HACK don't return, pass errors when need it.
        } else {
            if(comment) {
                // log_info(comment); No pintes
            }
        }

        switch(__md_iev__.__command__) {
            case "descs":
                if(result >= 0) {
                    self.config.descs = data; // TODO
                    process_descs(self);
                }
                break;

            case "nodes":
                if(result >= 0) {
                    treedb_register_nodes(
                        self.config.treedb_name,
                        schema.topic_name,
                        data
                    );

                    var gobj_formtable = get_gobj_formtable(self, schema.topic_name);
                    gobj_formtable.gobj_send_event(
                        "EV_REBUILD_TABLE",
                        {
                            topic_name: schema.topic_name,
                            cols: schema.cols
                        },
                        self
                    );

                    gobj_formtable.gobj_send_event(
                        "EV_LOAD_DATA",
                        data,
                        self
                    );
                    update_options(self, schema.topic_name);
                }
                break;

            case "create-node":
                if(result >= 0) {
                    var gobj_formtable = get_gobj_formtable(self, schema.topic_name);
                    gobj_formtable.gobj_send_event(
                        "EV_LOAD_DATA",
                        [data],
                        self
                    );
                }
                break;

            case "update-node":
                if(result >= 0) {
                    var gobj_formtable = get_gobj_formtable(self, schema.topic_name);
                    gobj_formtable.gobj_send_event(
                        "EV_LOAD_DATA",
                        [data],
                        self
                    );
                }
                break;

            case "delete-node":
                if(result >= 0) {
                    var gobj_formtable = get_gobj_formtable(self, schema.topic_name);
                    gobj_formtable.gobj_send_event(
                        "EV_DELETE_DATA",
                        [data],
                        self
                    );
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

        if(treedb_name == self.config.treedb_name) {
            treedb_register_update_node(
                self.config.treedb_name,
                topic_name,
                node
            );

            var gobj_formtable = get_gobj_formtable(self, topic_name);
            gobj_formtable.gobj_send_event(
                "EV_LOAD_DATA",
                [node],
                self
            );

            update_options(self, topic_name);
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

        if(treedb_name == self.config.treedb_name) {
            treedb_register_del_node(
                self.config.treedb_name,
                topic_name,
                node
            );

            var gobj_formtable = get_gobj_formtable(self, topic_name);
            gobj_formtable.gobj_send_event(
                "EV_DELETE_DATA",
                [node],
                self
            );

            update_options(self, topic_name);
        }

        return 0;
    }

    /********************************************
     *  From formtable
     ********************************************/
    function ac_create_record(self, event, kw, src)
    {
        var topic_name = src.gobj_read_attr("topic_name");

        return treedb_create_node(
            self,
            self.config.treedb_name,
            topic_name,
            kw.record,
            {} // "list-dict": true TODO
        );
    }

    /********************************************
     *  From formtable
     ********************************************/
    function ac_update_record(self, event, kw, src)
    {
        var topic_name = src.gobj_read_attr("topic_name");

        return treedb_update_node(
            self,
            self.config.treedb_name,
            topic_name,
            kw.record,
            {} // "list-dict": true TODO
        );
    }

    /********************************************
     *  From formtable
     ********************************************/
    function ac_delete_record(self, event, kw, src)
    {
        var topic_name = src.gobj_read_attr("topic_name");

        return treedb_delete_node(
            self,
            self.config.treedb_name,
            topic_name,
            kw.record,
            {
                force: true
            }
        );
    }

    /********************************************
     *  From formtable, wants refresh
     ********************************************/
    function ac_refresh_table(self, event, kw, src)
    {
        treedb_nodes(
            self,
            self.config.treedb_name,
            kw.topic_name,
            {}
        );

        return 0;
    }

    /********************************************
     *  From formtable,
     *  when window is destroying or minififying
     *  kw
     *      treedb_name
     *      topic_name
     *      {destroying: true}   Window destroying
     *      {destroying: false}  Window minifying
     ********************************************/
    function ac_close_formtable(self, event, kw, src)
    {
        if(kw.destroying) {
            treedb_unregister_formtable(self.config.treedb_name, kw.topic_name);
        }
        return 0;
    }

    /********************************************
     *  Return gobj of topic's formtable
     ********************************************/
    function ac_get_topic_formtable(self, event, kw, src)
    {
        var topic_name = kw.topic_name;

        for(var i=0; i<self.config.topics.length; i++) {
            var topic = self.config.topics[i];
            if(topic_name == topic.topic_name) {
                return topic.gobj_formtable;
            }
        }
        return null;
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
            "EV_CREATE_RECORD",
            "EV_UPDATE_RECORD",
            "EV_DELETE_RECORD",
            "EV_REFRESH_TABLE",
            "EV_CLOSE_WINDOW",
            "EV_GET_TOPIC_FORMTABLE",
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
                ["EV_CREATE_RECORD",        ac_create_record,       undefined],
                ["EV_UPDATE_RECORD",        ac_update_record,       undefined],
                ["EV_DELETE_RECORD",        ac_delete_record,       undefined],
                ["EV_REFRESH_TABLE",        ac_refresh_table,       undefined],
                ["EV_CLOSE_WINDOW",         ac_close_formtable,     undefined],
                ["EV_GET_TOPIC_FORMTABLE",  ac_get_topic_formtable, undefined],
                ["EV_SELECT",               ac_select,              undefined],
                ["EV_REFRESH",              ac_refresh,             undefined]
            ]
        }
    };

    var Ui_treedb = GObj.__makeSubclass__();
    var proto = Ui_treedb.prototype; // Easy access to the prototype
    proto.__init__= function(name, kw) {
        GObj.prototype.__init__.call(
            this,
            FSM,
            CONFIG,
            name,
            "Ui_treedb",
            kw,
            0
        );
        return this;
    };
    gobj_register_gclass(Ui_treedb, "Ui_treedb");




            /***************************
             *      Framework Methods
             ***************************/




    /************************************************
     *      Framework Method create
     ************************************************/
    proto.mt_create = function(kw)
    {
        var self = this;

        create_topics_formtable(self);
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

        treedb_descs(self);
        refresh_treedb(self);
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
    exports.Ui_treedb = Ui_treedb;

})(this);
