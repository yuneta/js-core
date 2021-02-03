/***********************************************************************
 *          ui_treedb_graph_new.js
 *
 *          Mix "Container Panel" & "Pinhold Window"
 *
 *          Manage treedb topics with mxgraph
 *
 *          HACK the parent MUST be a pinhold handler if the role is "Pinhold Window"
 *               or MUST be a container if the role is "Container Panel"
 *
 *          HACK But you can redirect the output events to "subscriber" gobj
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
        //////////////// Common Attributes //////////////////
        subscriber: null,       // Subscriber of published events, by default the parent.
        is_pinhold_window: true,// By default it's a Pinhold window
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
       with_treedb_tables: true,

        /*
         *  Funciones que debe suministrar el padre
         */
        info_wait: function() {},
        info_no_wait: function() {},

        /*
         *  GClass Manager/Viewer of hook data
         */
        hook_data_viewer: null,

        /*
         *  gobj_remote_yuno: Remote yuno to ask data,
         *  If it's not a connected service then you must suply ON_OPEN/ON_CLOSE events
         */
        gobj_remote_yuno: null,
        treedb_name: null,
        topics: [],
        descs: [],

        gobj_container: null,
        gobj_nodes_tree: null,
        gobj_treedb_tables: null,


        $ui: null,              // $ui from container

        //////////////////////////////////
        __writable_attrs__: [
            ////// Common /////
            "window_title",
            "window_image",
            "left",
            "top",
            "width",
            "height",
            "pinpushed"

            ////// Particular /////
        ]
    };




            /***************************
             *      Local Methods
             ***************************/




    /************************************************************
     *   Rebuild
     ************************************************************/
    function rebuild(self)
    {
        if(self.config.$ui) {
            self.config.$ui.destructor();
            self.config.$ui = 0;
        }
        build_webix(self);
    }

    /************************************************************
     *   Webix UI
     ************************************************************/
    function build_webix(self)
    {
        /*---------------------------------------*
         *      Particular UI code
         *---------------------------------------*/
        var row1 = {"template": "Container Panel Sample"};
        var row2 = {"template": "Container Panel Sample"};
        var row3 = {"template": "Container Panel Sample"};

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
                id: self.gobj_escaped_short_name(), // HACK can be a global gobj, use gclass_name+name
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
                        row1,
                        button,
                        row2,
                        row3,
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
                    row1,
                    button,
                    row2,
                    row3,
                ]
                ////////////////// webix code /////////////////
            });
        }
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
     *
     ********************************************/
    function build_toolbar(self, mode)
    {
        var elements = [
            {
                view: "button",
                type: "icon",
                icon: "fas fa-sync",
                autowidth: true,
                css: "webix_transparent icon_toolbar_16",
                tooltip: t("refresh"),
                label: t("refresh"),
                click: function() {
                    refresh_treedb(self);
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
    function treedb_descs(self, treedb_name)
    {
        if(!self.config.gobj_remote_yuno) {
            log_error(self.gobj_short_name() + ": No gobj_remote_yuno defined");
            return;
        }

        var command = "descs";

        var kw = {
            service: treedb_name
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
    function treedb_link_nodes(
        self,
        treedb_name,
        parent_ref,
        child_ref,
        options
    )
    {
        if(!self.config.gobj_remote_yuno) {
            log_error(self.gobj_short_name() + ": No gobj_remote_yuno defined");
            return;
        }

        var command = "link-nodes";

        var kw = {
            service: treedb_name,
            parent_ref: parent_ref,
            child_ref: child_ref,
            options: options || {}
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
    function treedb_unlink_nodes(
        self,
        treedb_name,
        parent_ref,
        child_ref,
        options
    )
    {
        if(!self.config.gobj_remote_yuno) {
            log_error(self.gobj_short_name() + ": No gobj_remote_yuno defined");
            return;
        }

        var command = "unlink-nodes";

        var kw = {
            service: treedb_name,
            parent_ref: parent_ref,
            child_ref: child_ref,
            options: options || {}
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
    function refresh_treedb(self)
    {
        self.config.gobj_nodes_tree.gobj_send_event(
            "EV_CLEAR_DATA",
            {
            },
            self
        );

        treedb_descs(self, self.config.treedb_name);

        var options = {
            list_dict: true
        };

        for(var i=0; i<self.config.topics.length; i++) {
            var topic = self.config.topics[i];
            var topic_name = topic.topic_name;

            treedb_nodes(self,
                self.config.treedb_name,
                topic_name,
                options
            );
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
                "EV_TREEDB_NODE_CREATED",
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




            /***************************
             *      Actions
             ***************************/




    /********************************************
     *  Remote response
     ********************************************/
    function ac_mt_command_answer(self, event, kw, src)
    {
        self.config.info_no_wait();

        try {
            var result = kw.result;
            var comment = kw.comment;
            var schema = kw.schema;
            var data = kw.data;
            var __md_iev__ = kw.__md_iev__;
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
                    self.config.descs = data;
                    process_descs(self);
                    self.config.gobj_nodes_tree.gobj_send_event(
                        "EV_DESCS",
                        data,
                        self
                    );
                }
                break;
            case "nodes":
                if(result >= 0) {
                    self.config.gobj_nodes_tree.gobj_send_event(
                        "EV_LOAD_DATA",
                        {
                            schema: schema,
                            data: data
                        },
                        self
                    );
                }
                break;

            case "create-node":
            case "update-node":
            case "delete-node":
            case "link-nodes":
            case "unlink-nodes":
                // Don't process by here, process on subscribed events.
                break;

            default:
                log_error(self.gobj_short_name() + " Command unknown: " + __md_iev__.__command__);
        }

        return 0;
    }

    /********************************************
     *  Remote subscription response
     ********************************************/
    function ac_treedb_node_created(self, event, kw, src)
    {
        var treedb_name = kw_get_str(kw, "treedb_name", "", 0);
        var topic_name = kw_get_str(kw, "topic_name", "", 0);
        var node = kw_get_dict_value(kw, "node", null, 0);

        if(treedb_name != self.config.treedb_name) {
            log_error("It's not my treedb_name: " + treedb_name);
            return 0;
        }

        var schema = self.config.descs[topic_name];

        self.config.gobj_nodes_tree.gobj_send_event(
            "EV_NODE_CREATED",
            {
                schema: schema,
                topic_name: topic_name,
                node: node
            },
            self
        );

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

        if(treedb_name != self.config.treedb_name) {
            log_error("It's not my treedb_name: " + treedb_name);
            return 0;
        }

        self.config.gobj_nodes_tree.gobj_send_event(
            "EV_NODE_UPDATED",
            {
                topic_name: topic_name,
                node: node
            },
            self
        );

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

        if(treedb_name != self.config.treedb_name) {
            log_error("It's not my treedb_name: " + treedb_name);
            return 0;
        }

        self.config.gobj_nodes_tree.gobj_send_event(
            "EV_NODE_DELETED",
            {
                topic_name: topic_name,
                node: node
            },
            self
        );

        return 0;
    }

    /********************************************
     *
     ********************************************/
    function ac_refresh_treedb(self, event, kw, src)
    {
        refresh_treedb(self);
        return 0;
    }

    /********************************************
     *  Event from Mx_nodes_tree
     *  kw: {
     *      treedb_name
     *      parent_topic_name,
     *      child_topic_name,
     *      child_field_name,
     *      child_field_value,
     *      x,
     *      y
     *  }
     ********************************************/
    function ac_show_hook_data(self, event, kw, src)
    {
        var treedb_name = kw.treedb_name;
        var parent_topic_name = kw.parent_topic_name;
        var child_topic_name = kw.child_topic_name;
        var child_field_name = kw.child_field_name;
        var child_field_value = kw.child_field_value;
        var click_x = kw.click_x;
        var click_y = kw.click_y;

        if(!self.config.hook_data_viewer) {
            trace_msg(kw);
            return 0;
        }

        var name = "Graph Hook>" + treedb_name + ">" +
            parent_topic_name + ">" +
            child_topic_name + ">" +
            child_field_name + ">" +
            child_field_value;
        var gobj = __yuno__.gobj_find_unique_gobj(name);
        if(!gobj) {
            gobj = self.yuno.gobj_create_unique(
                name,
                self.config.hook_data_viewer,
                kw,
                __yuno__.__pinhold__
            );
            gobj.gobj_start();
        } else {
            gobj.gobj_send_event("EV_TOGGLE", {}, self);
        }

        return 0;
    }

    /********************************************
     *  Event from Mx_nodes_tree
     ********************************************/
    function ac_show_treedb_topic(self, event, kw, src)
    {
        var topic_name = kw.topic_name;
        var gobj_topic_formtable = self.config.gobj_treedb_tables.gobj_send_event(
            "EV_GET_TOPIC_FORMTABLE",
            {
                topic_name: topic_name
            },
            self
        );
        gobj_topic_formtable.gobj_send_event("EV_TOGGLE", {}, self);

        return 0;
    }

    /********************************************
     *  Event from Mx_nodes_tree
     *  kw: {
     *      treedb_name
     *      topic_name,
     *      record
     *  }
     ********************************************/
    function ac_mx_vertex_clicked(self, event, kw, src)
    {
        //trace_msg(kw);
        return 0;
    }

    /********************************************
     *  Event from Mx_nodes_tree
     *  kw: {
     *      child_topic_name,
     *      child_topic_id,
     *      child_fkey,
     *      parent_topic_name,
     *      parent_topic_id,
     *      parent_hook
     * }
     ********************************************/
    function ac_mx_edge_clicked(self, event, kw, src)
    {
        //trace_msg(kw);
        return 0;
    }

    /********************************************
     *  Message from Mx_nodes_tree
     *  Send to backend, speaking of node
     ********************************************/
    function ac_create_record(self, event, kw, src)
    {
        var treedb_name = kw.treedb_name;
        var topic_name = kw.topic_name;
        var record = kw.record;
        var options = kw.options || {};

        return treedb_create_node(
            self,
            treedb_name,
            topic_name,
            record,
            options
        );
    }

    /********************************************
     *  Message from Mx_nodes_tree
     *  Send to backend, speaking of node
     ********************************************/
    function ac_update_record(self, event, kw, src)
    {
        var treedb_name = kw.treedb_name;
        var topic_name = kw.topic_name;
        var record = kw.record;
        var options = kw.options || {};

        return treedb_update_node(
            self,
            treedb_name,
            topic_name,
            record,
            options
        );
    }

    /********************************************
     *  Message from Mx_nodes_tree
     *  Send to backend, speaking of node
     ********************************************/
    function ac_delete_record(self, event, kw, src)
    {
        var treedb_name = kw.treedb_name;
        var topic_name = kw.topic_name;
        var record = kw.record;
        var options = kw.options || {};

        return treedb_delete_node(
            self,
            treedb_name,
            topic_name,
            record,
            options
        );
    }

    /********************************************
     *  Message from Mx_nodes_tree
     *  Send to backend, speaking of node
     ********************************************/
    function ac_link_records(self, event, kw, src)
    {
        var treedb_name = kw.treedb_name;
        var parent_ref = kw.parent_ref;
        var child_ref = kw.child_ref;
        var options = kw.options || {};

        return treedb_link_nodes(
            self,
            treedb_name,
            parent_ref,
            child_ref,
            options
        );
    }

    /********************************************
     *  Message from Mx_nodes_tree
     *  Send to backend, speaking of node
     ********************************************/
    function ac_unlink_records(self, event, kw, src)
    {
        var treedb_name = kw.treedb_name;
        var parent_ref = kw.parent_ref;
        var child_ref = kw.child_ref;
        var options = kw.options || {};

        return treedb_unlink_nodes(
            self,
            treedb_name,
            parent_ref,
            child_ref,
            options
        );
    }

    /********************************************
     *  Message from Mx_nodes_tree
     ********************************************/
    function ac_run_node(self, event, kw, src)
    {
        var treedb_name = kw.treedb_name;
        var topic_name = kw.topic_name;
        var record = kw.record;
        var options = kw.options || {};
        var is_topic_schema = kw.is_topic_schema;

        var url = record.url;
        var dst_role = record.dst_role;
        var dst_service = record.dst_service;
        var dst_yuno = record.dst_yuno;
        var viewer_engine = record.viewer_engine;

        var gclass = gobj_find_gclass(viewer_engine);
        if(!gclass) {
            log_error("Viewer engine (gclass) not found: " + viewer_engine);
            return -1;
        }

        var name = viewer_engine + ">" + url + ">" + dst_role + ">" + dst_service;
        var gobj = __yuno__.gobj_find_unique_gobj(name);
        if(!gobj) {
            gobj = __yuno__.gobj_create_unique(
                name,
                gclass,
                {
                    is_pinhold_window: true,
                    window_title: name,
                    window_image: "", // TODO /static/app/images/yuneta/topic_schema.svg",

                    dst_role: dst_role,
                    dst_service: dst_service,
                    dst_yuno: dst_yuno,
                    url: url
                },
                __yuno__.__pinhold__
            );
            gobj.gobj_start();
        } else {
            gobj.gobj_send_event("EV_TOGGLE", {}, self);
        }

        return 0;
    }

    /********************************************
     *  Pinhold to inform of window close
     *  Publish
     *  kw
     *      {destroying: true}   Window destroying
     *      {destroying: false}  Window minifying
     ********************************************/
    function ac_close_window(self, event, kw, src)
    {
        // TODO publish if you want
        // self.gobj_publish_event(event, kw, self);
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
        rebuild(self);
        return 0;
    }




            /***************************
             *      GClass/Machine
             ***************************/




    var FSM = {
        "event_list": [
            "EV_MT_COMMAND_ANSWER",
            "EV_TREEDB_NODE_CREATED",
            "EV_TREEDB_NODE_UPDATED",
            "EV_TREEDB_NODE_DELETED",
            "EV_REFRESH_TREEDB",
            "EV_SHOW_HOOK_DATA",
            "EV_SHOW_TREEDB_TOPIC",
            "EV_MX_VERTEX_CLICKED",
            "EV_MX_EDGE_CLICKED",
            "EV_CREATE_RECORD",
            "EV_DELETE_RECORD",
            "EV_UPDATE_RECORD",
            "EV_LINK_RECORDS",
            "EV_UNLINK_RECORDS",
            "EV_RUN_NODE",
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
                ["EV_MT_COMMAND_ANSWER",        ac_mt_command_answer,       undefined],
                ["EV_TREEDB_NODE_CREATED",      ac_treedb_node_created,     undefined],
                ["EV_TREEDB_NODE_UPDATED",      ac_treedb_node_updated,     undefined],
                ["EV_TREEDB_NODE_DELETED",      ac_treedb_node_deleted,     undefined],
                ["EV_REFRESH_TREEDB",           ac_refresh_treedb,          undefined],
                ["EV_SHOW_HOOK_DATA",           ac_show_hook_data,          undefined],
                ["EV_SHOW_TREEDB_TOPIC",        ac_show_treedb_topic,       undefined],
                ["EV_MX_VERTEX_CLICKED",        ac_mx_vertex_clicked,       undefined],
                ["EV_MX_EDGE_CLICKED",          ac_mx_edge_clicked,         undefined],
                ["EV_CREATE_RECORD",            ac_create_record,           undefined],
                ["EV_DELETE_RECORD",            ac_delete_record,           undefined],
                ["EV_UPDATE_RECORD",            ac_update_record,           undefined],
                ["EV_LINK_RECORDS",             ac_link_records,            undefined],
                ["EV_UNLINK_RECORDS",           ac_unlink_records,          undefined],
                ["EV_RUN_NODE",                 ac_run_node,                undefined],
                ["EV_CLOSE_WINDOW",             ac_close_window,            undefined],
                ["EV_TOGGLE",                   ac_toggle,                  undefined],
                ["EV_SHOW",                     ac_show,                    undefined],
                ["EV_HIDE",                     ac_hide,                    undefined],
                ["EV_SELECT",                   ac_select,                  undefined],
                ["EV_REFRESH",                  ac_refresh,                 undefined],
                ["EV_REBUILD_PANEL",            ac_rebuild_panel,           undefined]
            ]
        }
    };

    var Ui_treedb_graph_new = GObj.__makeSubclass__();
    var proto = Ui_treedb_graph_new.prototype; // Easy access to the prototype
    proto.__init__= function(name, kw) {
        GObj.prototype.__init__.call(
            this,
            FSM,
            CONFIG,
            name,
            "Ui_treedb_graph_new",
            kw,
            0
        );
        return this;
    };
    gobj_register_gclass(Ui_treedb_graph_new, "Ui_treedb_graph_new");




            /***************************
             *      Framework Methods
             ***************************/




    /************************************************
     *      Framework Method create
     ************************************************/
    proto.mt_create = function(kw)
    {
        var self = this;

        var subscriber = self.gobj_read_attr("subscriber");
        if(!subscriber)
            subscriber = self.gobj_parent();
        self.gobj_subscribe_event(null, null, subscriber);

        /*
         *  Create container
         */
        self.config.gobj_container = self.yuno.gobj_create_unique(
            build_name(self, "ct"),
            Ui_container,
            {
                mode: "horizontal"
            },
            self
        );
        self.config.$ui = self.config.gobj_container.gobj_read_attr("$ui");

        /*
         *  Add container toolbar
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
         *  Nodes tree panel
         */
        self.config.gobj_nodes_tree = self.yuno.gobj_create_unique(
            build_name(self, "systems-tree"),
            Mx_nodes_tree,
            {
                info_wait: self.config.info_wait,
                info_no_wait: self.config.info_no_wait,
                is_pinhold_window: false,
                with_treedb_tables: self.config.with_treedb_tables,
                ui_properties: {
                    gravity: 1,
                    minWidth: 300,
                    minHeight: 300
                },
                panel_properties: {
                    with_panel_top_toolbar: true,
                    with_panel_title: "Treedb " + self.config.treedb_name,
                    with_panel_hidden_btn: false,
                    with_panel_fullscreen_btn: true,
                    with_panel_resize_btn: false
                },
                subscriber: self,
                treedb_name: self.config.treedb_name,
                topics: self.config.topics,
                hook_port_position: "bottom",
                fkey_port_position: "top"
            },
            self.config.gobj_container
        );

        /*
         *  Treedb tables
         */
        if(self.config.with_treedb_tables) {
            self.config.gobj_treedb_tables = self.yuno.gobj_create_unique(
                build_name(self, "Topics"),
                Ui_treedb_tables,
                {
                    subscriber: self,
                    with_treedb_tables: self.config.with_treedb_tables,
                    hook_data_viewer: Ui_hook_viewer_popup,
                    gobj_remote_yuno: self.config.gobj_remote_yuno,
                    treedb_name: self.config.treedb_name,
                    topics: self.config.topics,
                    info_wait: self.config.info_wait,
                    info_no_wait: self.config.info_no_wait
                },
                self
            );
        }

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

        self.config.gobj_nodes_tree.gobj_start();
        if(self.config.gobj_treedb_tables) {
            self.config.gobj_treedb_tables.gobj_start();
        }

        if(self.config.gobj_remote_yuno) {
            refresh_treedb(self);
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
    exports.Ui_treedb_graph_new = Ui_treedb_graph_new;

})(this);

