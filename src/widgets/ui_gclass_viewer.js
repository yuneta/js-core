/***********************************************************************
 *          ui_gclass_viewer.js
 *
 *          GClass Viewer
 *
 *          Copyright (c) 2020 Niyamaka.
 *          All Rights Reserved.
 *
 *
 *  Version
 *  -------
 *  1.0     Initial release
 *
 *
 ***********************************************************************/
(function (exports) {
    'use strict';

    /********************************************
     *      Configuration (C attributes)
     ********************************************/
    var CONFIG = {
        title: "",
        with_top_toolbar: false,
        with_hidden_btn: false,
        with_fullscreen_btn: false,
        with_resize_btn: false,

        schema: null,

        ui_properties: null,
        $ui: null,
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
        if(empty_string(self.gobj_name())) {
            if(!self._uuid_name) {
                self._uuid_name = get_unique_id(self.gobj_gclass_name());
            }
            return self._uuid_name + "-" + name;
        }
        return self.gobj_escaped_short_name() + "-" + name;
    }

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
        var top_toolbar = {
            view:"toolbar",
            id: build_name(self, "top_toolbar"),
            hidden: self.config.with_top_toolbar?false:true,
            css: "toolbar2color",
            height: 30,
            cols: [
                {},
                {
                    view: "label",
                    id: build_name(self, "top_toolbar_title"),
                    label: self.config.title,
                    click: function() {
                    }
                },
                {},
                {
                    view:"icon",
                    hidden: self.config.with_resize_btn?false:true,
                    icon: "far fa-expand-alt",
                    click: function() {
                        var gravity = self.config.$ui.config.gravity;
                        gravity++;
                        self.config.$ui.define({gravity:gravity});
                        if(self.config.$ui.refresh) {
                            self.config.$ui.refresh();
                        } else if(self.config.$ui.resize) {
                            self.config.$ui.resize();
                        }
                    }
                },
                {
                    view:"icon",
                    hidden: self.config.with_resize_btn?false:true,
                    icon: "far fa-compress-alt",
                    click: function() {
                        var gravity = self.config.$ui.config.gravity;
                        gravity--;
                        if(gravity>0) {
                            self.config.$ui.define({gravity:gravity});
                            if(self.config.$ui.refresh) {
                                self.config.$ui.refresh();
                            } else if(self.config.$ui.resize) {
                                self.config.$ui.resize();
                            }
                        }
                    }
                },
                {
                    view:"icon",
                    hidden: self.config.with_fullscreen_btn?false:true,
                    icon: "fas fa-expand-wide",
                    click: function() {
                        $$(build_name(self, "top_toolbar")).hide();
                        webix.fullscreen.set(
                            self.config.$ui,
                            {
                                head: {
                                    view:"toolbar",
                                    height: 40,
                                    elements: [
                                        {
                                            view: "button",
                                            type: "icon",
                                            icon: "fas fa-chevron-left",
                                            autowidth: true,
                                            label: t("exit full screen"),
                                            click: function() {
                                                webix.fullscreen.exit();
                                                $$(build_name(self, "top_toolbar")).show();
                                            }
                                        },
                                        {}
                                    ]
                                }
                            }
                        );
                    }
                },
                {
                    view:"icon",
                    hidden: self.config.with_hidden_btn?false:true,
                    icon:"far fa-window-minimize",
                    click: function() {
                        if(this.getTopParentView().config.fullscreen) {
                            webix.fullscreen.exit();
                        }
                        this.getParentView().getParentView().hide();
                    }
                }
            ]
        };

        var form = {
            view: "form",
            id: build_name(self, "form"),
            scroll: true,
            margin: 0,
            padding: 10,
            elementsConfig: {
                labelAlign: "left",
                labelWidth: 140
            },
            elements: [
                {
                    view: "text",
                    name: "id",
                    label: t("id"),
                    readonly: true
                },
                {
                    view: "text",
                    name: "base",
                    label: t("base"),
                    readonly: true
                },
                {
                    view: "text",
                    name: "gcflag",
                    label: t("gcflag"),
                    readonly: true
                },
                {
                    view: "text",
                    name: "priv_size",
                    label: t("priv_size"),
                    readonly: true
                },
                {
                    view: "text",
                    name: "attrs",
                    label: t("attrs"),
                    readonly: true
                },
                {
                    view: "text",
                    name: "commands",
                    label: t("commands"),
                    readonly: true
                },
                {
                    view: "text",
                    name: "global_methods",
                    label: t("global_methods"),
                    readonly: true
                },
                {
                    view: "text",
                    name: "local_methods",
                    label: t("local_methods"),
                    readonly: true
                },
                {
                    view: "text",
                    name: "FSM",
                    label: t("FSM"),
                    readonly: true
                },
                {
                    view: "text",
                    name: "ACL",
                    label: t("ACL"),
                    readonly: true
                },
                {
                    view: "text",
                    name: "info_global_trace",
                    label: t("info_global_trace"),
                    readonly: true
                },
                {
                    view: "text",
                    name: "info_gclass_trace",
                    label: t("info_gclass_trace"),
                    readonly: true
                },
                {
                    view: "text",
                    name: "gclass_trace_level",
                    label: t("gclass_trace_level"),
                    readonly: true
                },
                {
                    view: "text",
                    name: "gclass_no_trace_level",
                    label: t("gclass_no_trace_level"),
                    readonly: true
                },
                {
                    view: "text",
                    name: "instances",
                    label: t("instances"),
                    readonly: true
                },
                {
                    view: "text",
                    name: "gobjs",
                    label: t("gobjs"),
                    readonly: true
                }

            ],
            on: {
                onChange: function(new_v, old_v) {
//                     var changed = $$(build_name(self, "update_form")).isDirty();
//                     if(changed) {
//                         var btn = $$(build_name(self, "update_record"));
//                         webix.html.addCss(btn.getNode(), "icon_color_submmit");
//                         btn = $$(build_name(self, "undo_record"));
//                         webix.html.addCss(btn.getNode(), "icon_color_cancel");
//                     }
                }
            }
        };

        /*
         *  UI
         */
        self.config.$ui = webix.ui({
            rows: [
                top_toolbar,
                form
            ]
        });
        self.config.$ui.gobj = self;

        if(self.config.ui_properties) {
            self.config.$ui.define(self.config.ui_properties);
            if(self.config.$ui.refresh) {
                self.config.$ui.refresh();
            }
        }
    }




            /***************************
             *      Actions
             ***************************/




    /********************************************
     *
     ********************************************/
    function ac_load_data(self, event, kw, src)
    {
        $$(build_name(self, "form")).parse(kw.data);
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
    function ac_refresh(self, event, kw, src)
    {
        rebuild(self);
        return 0;
    }

    /********************************************
     *
     ********************************************/
    function ac_select(self, event, kw, src)
    {
        return 0;
    }




            /***************************
             *      GClass/Machine
             ***************************/




    var FSM = {
        "event_list": [
            "EV_LOAD_DATA",
            "EV_CLEAR_DATA",
            "EV_REFRESH",
            "EV_SELECT"
        ],
        "state_list": [
            "ST_IDLE"
        ],
        "machine": {
            "ST_IDLE":
            [
                ["EV_LOAD_DATA",                ac_load_data,               undefined],
                ["EV_CLEAR_DATA",               ac_clear_data,              undefined],
                ["EV_REFRESH",                  ac_refresh,                 undefined],
                ["EV_SELECT",                   ac_select,                  undefined]
            ]
        }
    };

    var Ui_gclass_viewer = GObj.__makeSubclass__();
    var proto = Ui_gclass_viewer.prototype; // Easy access to the prototype
    proto.__init__= function(name, kw) {
        GObj.prototype.__init__.call(
            this,
            FSM,
            CONFIG,
            name,
            "Ui_gclass_viewer",
            kw,
            0
        );
        return this;
    };
    gobj_register_gclass(Ui_gclass_viewer, "Ui_gclass_viewer");




            /***************************
             *      Framework Methods
             ***************************/




    /************************************************
     *      Framework Method create
     ************************************************/
    proto.mt_create = function(kw)
    {
        var self = this;

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
    exports.Ui_gclass_viewer = Ui_gclass_viewer;

})(this);
