/***********************************************************************
 *          ui_container.js
 *
 *          Container of widgets
 *
 *  Version
 *  -------
 *  1.0     Initial release
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
        toolbar_size: 40,
        mode: "horizontal",     // "horizontal" or "vertical"
        ui_properties: null,
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
        if(self.config.mode == "horizontal") {
            self.config.$ui = webix.ui({
                view: "layout",
                id: self.gobj_name(),
                rows: [
                    {
                        template: "top_toolbar",
                        id: build_name(self, "top_toolbar"),
                        height: self.config.toolbar_size,
                        hidden: false
                    },
                    {
                        view: "layout",
                        id: build_name(self, "cols"),
                        cols: [
                            {
                                template: "left_toolbar",
                                id: build_name(self, "left_toolbar"),
                                width: self.config.toolbar_size,
                                hidden: false
                            },
                            {
                                view: "scrollview",
                                id: build_name(self, "scrollview"),
                                scroll: "auto",
                                body: {
                                    view: "layout",
                                    id: build_name(self, "work_place"),
                                    type: "space",
                                    cols: []
                                }
                            },
                            {
                                template: "right_toolbar",
                                id: build_name(self, "right_toolbar"),
                                width: self.config.toolbar_size,
                                hidden: false
                            }
                        ]
                    },
                    {
                        template: "bottom_toolbar",
                        id: build_name(self, "bottom_toolbar"),
                        height: self.config.toolbar_size,
                        hidden: false
                    }
                ]
            });
        } else {
            self.config.$ui = webix.ui({
                view: "layout",
                id: self.gobj_name(),
                rows: [
                    {
                        template: "top_toolbar",
                        id: build_name(self, "top_toolbar"),
                        height: self.config.toolbar_size,
                        hidden: false
                    },
                    {
                        view: "layout",
                        id: build_name(self, "cols"),
                        cols: [
                            {
                                template: "left_toolbar",
                                id: build_name(self, "left_toolbar"),
                                width: self.config.toolbar_size,
                                hidden: false
                            },
                            {
                                view: "scrollview",
                                id: build_name(self, "scrollview"),
                                scroll: "auto",
                                body: {
                                    view: "layout",
                                    id: build_name(self, "work_place"),
                                    type: "space",
                                    rows: []
                                }
                            },
                            {
                                template: "right_toolbar",
                                id: build_name(self, "right_toolbar"),
                                width: self.config.toolbar_size,
                                hidden: false
                            }
                        ]
                    },
                    {
                        template: "bottom_toolbar",
                        id: build_name(self, "bottom_toolbar"),
                        height: self.config.toolbar_size,
                        hidden: false
                    }
                ]
            });
        }

        self.config.$ui.gobj = self;

        if(self.config.ui_properties) {
            self.config.$ui.define(self.config.ui_properties);
            if(self.config.$ui.refresh) {
                self.config.$ui.refresh();
            }
        }

        /*---------------------------------------*
         *      Automatic Resizing
         *---------------------------------------*/
        function automatic_resizing_cb()
        {
            var window_width = window.innerWidth;
            var window_height = window.innerHeight;

            var childs = self.gobj_match_childs({});
            for(var i=0; i < childs.length; i++) {
                var child = childs[i];
                var $ui = child.gobj_read_attr("$ui");
                $ui.define("minWidth", window_width);
                $ui.resize();
            }
        }

        //webix.event(window, "resize", automatic_resizing_cb);
    }




            /***************************
             *      Actions
             ***************************/




    /********************************************
     *  type: ["top_toolbar",
     *          "bottom_toolbar",
     *          "left_toolbar",
     *          "right_toolbar"
     *      ]
     *  toolbar: webix ui
     ********************************************/
    function ac_add_toolbar(self, event, kw, src)
    {
        var type = kw.type;
        if(!elm_in_list(type, ["top_toolbar", "bottom_toolbar", "left_toolbar", "right_toolbar"])) {
            log_error("bad toolbar type: " + toolbar);
            return -1;
        }
        var toolbar = kw.toolbar;
        if(!toolbar) {
            log_error("no toolbar def");
            return -1;
        }
        toolbar = __duplicate__(toolbar);

        if(elm_in_list(type, ["top_toolbar", "bottom_toolbar"])) {
            if(!kw_has_key(toolbar, "height")) {
                toolbar["height"] = self.config.toolbar_size;
            }
            webix.ui(toolbar, $$(self.gobj_name()), $$(build_name(self, type)));
        } else {
            if(!kw_has_key(toolbar, "width")) {
                toolbar["width"] = self.config.toolbar_size;
            }
            webix.ui(toolbar, $$(build_name(self, "cols")), $$(build_name(self, type)));
        }
        return 0;
    }

    /********************************************
     *
     ********************************************/
    function ac_change_mode(self, event, kw, src)
    {
        var work_place = null;

        var childs = self.gobj_match_childs({});
        for(var i=0; i < childs.length; i++) {
            var child = childs[i];

            if(child.config.$parent) {
                child.config.$parent.removeView(child.config.$ui);
                child.config.$parent = null;
            }
        }

        if(self.config.mode == "horizontal") {
            work_place = {
                view: "layout",
                id: build_name(self, "work_place"),
                type: "space",
                rows: []
            };
            self.config.mode = "vertical";
        } else {
            work_place = {
                view: "layout",
                id: build_name(self, "work_place"),
                type: "space",
                cols: []
            };
            self.config.mode = "horizontal";
        }

        webix.ui(work_place, $$(build_name(self, "scrollview")), $$(build_name(self, "work_place")));

        var $parent = $$(build_name(self, "work_place"));
        for(var i=0; i < childs.length; i++) {
            var child = childs[i];
            child.gobj_send_event("EV_REFRESH", {}, self);
            $parent.addView(child.config.$ui);
            child.config.$parent = $parent;
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
            "EV_CHANGE_MODE",
            "EV_ADD_TOOLBAR",
            "EV_SELECT",
            "EV_REFRESH"
        ],
        "state_list": [
            "ST_IDLE"
        ],
        "machine": {
            "ST_IDLE":
            [
                ["EV_CHANGE_MODE",          ac_change_mode,     undefined],
                ["EV_ADD_TOOLBAR",          ac_add_toolbar,     undefined],
                ["EV_SELECT",               ac_select,          undefined],
                ["EV_REFRESH",              ac_refresh,         undefined]
            ]
        }
    };

    var Ui_container = GObj.__makeSubclass__();
    var proto = Ui_container.prototype; // Easy access to the prototype
    proto.__init__= function(name, kw) {
        GObj.prototype.__init__.call(
            this,
            FSM,
            CONFIG,
            name,
            "Ui_container",
            kw,
            0
        );
        return this;
    };
    gobj_register_gclass(Ui_container, "Ui_container");




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
    }

    /************************************************
     *      Framework Method stop
     ************************************************/
    proto.mt_stop = function(kw)
    {
        var self = this;
    }

    /************************************************
     *      Framework Method inject_event
     ************************************************/
    proto.mt_inject_event = function(event, kw, src)
    {
        var self = this;
        kw = kw || {};
        return self.parent.gobj_send_event(event, kw, src);
    }

    /************************************************
     *  Framework Method mt_child_added
     ************************************************/
    proto.mt_child_added = function(child)
    {
        var self = this;

        var $parent = $$(build_name(self, "work_place"));
        $parent.addView(child.config.$ui);
        child.config.$parent = $parent;
    }

    /************************************************
     *  Framework Method mt_child_added
     ************************************************/
    proto.mt_child_removed = function(child)
    {
        var self = this;
        if(child.config.$parent) {
            child.config.$parent.removeView(child.config.$ui);
            child.config.$parent = null;
        }
    }


    //=======================================================================
    //      Expose the class via the global object
    //=======================================================================
    exports.Ui_container = Ui_container;

})(this);
