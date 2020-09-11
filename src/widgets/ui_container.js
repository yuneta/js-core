/***********************************************************************
 *          ui_container.js
 *
 *          Container of widgets
 *          NOTE search "Container Panel" phrase to locate related code
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
        $ui: null,

        views_opened: {
        },

        __writable_attrs__: [
            "views_opened"
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
                type: "space",
                padding: 5,
                margin: 5,
                rows: [
                    {
                        template: "top_toolbar",
                        id: build_name(self, "top_toolbar"),
                        height: self.config.toolbar_size,
                        hidden: true
                    },
                    {
                        view: "layout",
                        id: build_name(self, "cols"),
                        type: "wide",
                        margin: 5,
                        cols: [
                            {
                                template: "left_toolbar",
                                id: build_name(self, "left_toolbar"),
                                width: self.config.toolbar_size,
                                hidden: true
                            },
                            {
                                view: "scrollview",
                                id: build_name(self, "scrollview"),
                                scroll: "auto", // Si lo quitas la cagas
                                body: {
                                    view: "layout",
                                    id: build_name(self, "work_place"),
                                    type: "wide",
                                    margin: 5,
                                    cols: []
                                }
                            },
                            {
                                template: "right_toolbar",
                                id: build_name(self, "right_toolbar"),
                                width: self.config.toolbar_size,
                                hidden: true
                            }
                        ]
                    },
                    {
                        template: "bottom_toolbar",
                        id: build_name(self, "bottom_toolbar"),
                        height: self.config.toolbar_size,
                        hidden: true
                    }
                ]
            });
        } else {
            self.config.$ui = webix.ui({
                view: "layout",
                id: self.gobj_name(),
                type: "space",
                padding: 5,
                margin: 5,
                rows: [
                    {
                        template: "top_toolbar",
                        id: build_name(self, "top_toolbar"),
                        height: self.config.toolbar_size,
                        hidden: true
                    },
                    {
                        view: "layout",
                        id: build_name(self, "cols"),
                        type: "wide",
                        margin: 5,
                        cols: [
                            {
                                template: "left_toolbar",
                                id: build_name(self, "left_toolbar"),
                                width: self.config.toolbar_size,
                                hidden: true
                            },
                            {
                                view: "scrollview",
                                id: build_name(self, "scrollview"),
                                scroll: "auto",
                                body: {
                                    view: "layout",
                                    id: build_name(self, "work_place"),
                                    type: "wide",
                                    margin: 5,
                                    rows: []
                                }
                            },
                            {
                                template: "right_toolbar",
                                id: build_name(self, "right_toolbar"),
                                width: self.config.toolbar_size,
                                hidden: true
                            }
                        ]
                    },
                    {
                        template: "bottom_toolbar",
                        id: build_name(self, "bottom_toolbar"),
                        height: self.config.toolbar_size,
                        hidden: true
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
            // HACK Dynamic UI Modifications: replace toolbar
            webix.ui(toolbar, $$(self.gobj_name()), $$(build_name(self, type)));
        } else {
            if(!kw_has_key(toolbar, "width")) {
                toolbar["width"] = self.config.toolbar_size;
            }
            // HACK Dynamic UI Modifications: replace toolbar
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

            if(child.config.$container_parent) {
                child.config.$container_parent.removeView(child.config.$ui);
                child.config.$container_parent = null;
            }
        }

        if(self.config.mode == "horizontal") {
            work_place = {
                view: "layout",
                id: build_name(self, "work_place"),
                type: "wide",
                margin: 5,
                rows: []
            };
            self.config.mode = "vertical";
        } else {
            work_place = {
                view: "layout",
                id: build_name(self, "work_place"),
                type: "wide",
                margin: 5,
                cols: []
            };
            self.config.mode = "horizontal";
        }

        // HACK Dynamic UI Modifications: replace "work_place"
        webix.ui(work_place, $$(build_name(self, "scrollview")), $$(build_name(self, "work_place")));

        var $container_parent = $$(build_name(self, "work_place"));
        for(var i=0; i < childs.length; i++) {
            var child = childs[i];
            child.gobj_send_event("EV_REBUILD_PANEL", {}, self); // Before this get new child $ui
            $container_parent.addView(child.config.$ui);
            child.config.$container_parent = $container_parent;
        }

        return 0;
    }

    /********************************************
     *
     ********************************************/
    function ac_on_view_show(self, event, kw, src)
    {
        self.config.views_opened = {};

        var childs = self.gobj_match_childs({});

        for(var i=0; i<childs.length; i++) {
            var child = childs[i];
            if(child.config.$ui.isVisible()) {
                self.config.views_opened[child.gobj_name()] = true;
                child.gobj_send_event("EV_REFRESH", {}, self);
            }
        }

        if(self.gobj_is_unique()) {
            self.gobj_save_persistent_attrs();
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
        var childs = self.gobj_match_childs({});

        for(var i=0; i<childs.length; i++) {
            var child = childs[i];
            if(child.config.$ui.isVisible()) {
                child.gobj_send_event("EV_REFRESH", {}, self);
            }
        }

        return 0;
    }




            /***************************
             *      GClass/Machine
             ***************************/




    var FSM = {
        "event_list": [
            "EV_ON_VIEW_SHOW",
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
                ["EV_ON_VIEW_SHOW",         ac_on_view_show,    undefined],
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

        var $container_parent = $$(build_name(self, "work_place"));
        $container_parent.addView(child.config.$ui);
        child.config.$container_parent = $container_parent;

        if(kw_has_key(self.config.views_opened, child.gobj_name())) {
            child.config.$ui.show();
        }
    }

    /************************************************
     *  Framework Method mt_child_added
     ************************************************/
    proto.mt_child_removed = function(child)
    {
        var self = this;
        if(child.config.$container_parent) {
            child.config.$container_parent.removeView(child.config.$ui);
            child.config.$container_parent = null;
        }
    }


    //=======================================================================
    //      Expose the class via the global object
    //=======================================================================
    exports.Ui_container = Ui_container;

})(this);
