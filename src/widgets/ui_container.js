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

        gobj_name_in_fullscreen: null,

        ui_properties: null,
        $ui: null,

        views_opened: {
        },
        views_gravity: {
        },

        __writable_attrs__: [
            "gobj_name_in_fullscreen",
            "views_opened",
            "views_gravity",
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
     *  Panel View is showing, save their state
     ********************************************/
    function ac_on_view_show(self, event, kw, src)
    {
        var visible = src.config.$ui.isVisible();
        self.config.views_opened[src.gobj_name()] = visible;

        /*
         *  Save persistent attrs
         */
        if(self.gobj_is_unique()) {
            self.gobj_save_persistent_attrs();
        }
        return 0;
    }

    /********************************************
     *  Panel View enter in fullscreen
     ********************************************/
    function ac_set_fullscreen(self, event, kw, src)
    {
//         var visible = src.config.$ui.isVisible();
//         self.config.views_opened[src.gobj_name()] = visible; // TODO salva el fullscreen
        if(self.config.gobj_name_in_fullscreen) {
            log_warning("Already in fullscreen: " + self.config.gobj_name_in_fullscreen);
            return -1;
        }

        $$(build_name(src, "top_toolbar")).hide();
        webix.fullscreen.set(
            src.config.$ui,
            {
                head: {
                    view:"toolbar",
                    height: 40,
                    elements: [
                        {
                            view: "icon",
                             // TODO opcional, que no se vea en presentaciones fullscreen
                            icon: "fas fa-chevron-left",
                            tooltip: t("exit fullscreen"),
                            click: function() {
                                webix.fullscreen.exit();
                                $$(build_name(src, "top_toolbar")).show(); // TODO guarda el gobj en full screen, solo puede haber uno
                            }
                        },
                        {},
                        {
                            view: "label",
                            label: kw.with_panel_title? kw.with_panel_title:"",
                        },
                        {}
                    ]
                }
            }
        );

        /*
         *  Save persistent attrs
         */
//         if(self.gobj_is_unique()) {
//             self.gobj_save_persistent_attrs();
//         }
        return 0;
    }

    /********************************************
     *  Panel View exit of fullscreen
     ********************************************/
    function ac_exit_fullscreen(self, event, kw, src)
    {

                      if(this.getTopParentView().config.fullscreen) {
                            webix.fullscreen.exit();
                        }

//         var visible = src.config.$ui.isVisible(); // TODO save not fullscreen
//         self.config.views_opened[src.gobj_name()] = visible;
//
//         /*
//          *  Save persistent attrs
//          */
//         if(self.gobj_is_unique()) {
//             self.gobj_save_persistent_attrs();
//         }
        return 0;
    }

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
        if(!elm_in_list(type, [
                "top_toolbar",
                "bottom_toolbar",
                "left_toolbar",
                "right_toolbar"])) {
            log_error("bad toolbar type: " + toolbar);
            return -1;
        }
        var toolbar = kw.toolbar;
        if(!toolbar) {
            log_error("no toolbar def");
            return -1;
        }
        toolbar = __duplicate__(toolbar);

        if(elm_in_list(type, [
                "top_toolbar",
                "bottom_toolbar"])) {
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
    function ac_select(self, event, kw, src)
    {

        return 0;
    }

    /********************************************
     *  Some gravity or other has changed,
     *  refresh all container's pannel
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

        /*
         *  Get gravity of childs to save persistent attrs
         */
        self.config.views_gravity = {};

        for(var i=0; i<childs.length; i++) {
            var child = childs[i];
            var gravity = child.config.$ui.config.gravity;
            self.config.views_gravity[child.gobj_name()] = gravity;
        }

        /*
         *  Save persistent attrs
         */
        if(self.gobj_is_unique()) {
            self.gobj_save_persistent_attrs();
        }
        return 0;
    }




            /***************************
             *      GClass/Machine
             ***************************/




    var FSM = {
        "event_list": [
            "EV_ON_VIEW_SHOW",
            "EV_SET_FULLSCREEN",
            "EV_EXIT_FULLSCREEN",
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
                ["EV_ON_VIEW_SHOW",         ac_on_view_show,        undefined],
                ["EV_SET_FULLSCREEN",       ac_set_fullscreen,      undefined],
                ["EV_EXIT_FULLSCREEN",      ac_exit_fullscreen,     undefined],
                ["EV_CHANGE_MODE",          ac_change_mode,         undefined],
                ["EV_ADD_TOOLBAR",          ac_add_toolbar,         undefined],
                ["EV_SELECT",               ac_select,              undefined],
                ["EV_REFRESH",              ac_refresh,             undefined]
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

        if(kw_has_key(self.config.views_gravity, child.gobj_name())) {
            var gravity = self.config.views_gravity[child.gobj_name()];
            child.config.ui_properties["gravity"] = gravity;
            child.config.$ui.define({gravity:gravity});
        }

        if(!child.config.panel_properties.with_panel_hidden_btn ) {
            self.config.views_opened[child.gobj_name()] = true;
            child.config.$ui.hide();
            child.config.$ui.show();
        } else if(!kw_has_key(self.config.views_opened, child.gobj_name())) {
            //self.config.views_opened[child.gobj_name()] = true;
            child.config.$ui.show();
            child.config.$ui.hide();

        } else {
            if(self.config.views_opened[child.gobj_name()]) {
                child.config.$ui.show();
            } else {
                child.config.$ui.hide();
            }
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
    //      Common code for container panels
    //=======================================================================
    function toggle_container_panel(gobj_panel)
    {
        var $ui = gobj_panel.config.$ui;
        if(!$ui) {
            log_error(gobj_panel.gobj_short_name() + ": toggle_container_panel() $ui NULL");
            return;
        }
        if($ui.isVisible()) {
            $ui.hide();
        } else {
            $ui.show();
        }

        /*----------------------------------------------*
         *  Inform of view state to "Container Panel"
         *----------------------------------------------*/
        gobj_panel.parent.gobj_send_event("EV_ON_VIEW_SHOW", {}, gobj_panel);
    }

    function get_container_panel_top_toolbar(self)
    {
        /*------------------------------------------*
         *      Top Toolbar of "Container Panel"
         *------------------------------------------*/
        var top_toolbar = {
            view:"toolbar",
            id: build_name(self, "top_toolbar"),
            hidden: self.config.panel_properties.with_panel_top_toolbar?false:true,
            css: "toolbar2color",
            height: 30,
            cols: [
                {
                    view:"icon",
                    hidden: self.config.panel_properties.with_panel_resize_btn?false:true,
                    icon: "far fa-expand-alt",
                    tooltip: t("enlarge"),
                    click: function() {
                        var gravity = self.config.$ui.config.gravity;
                        gravity++;
                        self.config.ui_properties["gravity"] = gravity;

                        self.config.$ui.define({gravity:gravity});
                        if(self.config.$ui.refresh) {
                            self.config.$ui.refresh();
                        } else if(self.config.$ui.resize) {
                            self.config.$ui.resize();
                        }
                        self.parent.gobj_send_event("EV_REFRESH", {}, self);
                    }
                },
                {
                    view:"icon",
                    hidden: self.config.panel_properties.with_panel_resize_btn?false:true,
                    icon: "far fa-compress-alt",
                    tooltip: t("narrow"),
                    click: function() {
                        var gravity = self.config.$ui.config.gravity;
                        gravity--;

                        if(gravity>0) {
                            self.config.ui_properties["gravity"] = gravity;
                            self.config.$ui.define({gravity:gravity});
                            if(self.config.$ui.refresh) {
                                self.config.$ui.refresh();
                            } else if(self.config.$ui.resize) {
                                self.config.$ui.resize();
                            }
                        }
                        self.parent.gobj_send_event("EV_REFRESH", {}, self);
                    }
                },
                {gravity:1},
                {
                    view: "label",
                    gravity: 10,
                    hidden: self.config.panel_properties.with_panel_title?false:true,
                    label: self.config.panel_properties.with_panel_title?
                        self.config.panel_properties.with_panel_title:"",
                    click: function() {
                    }
                },
                {gravity:1},
                {
                    view:"icon",
                    hidden: self.config.panel_properties.with_panel_fullscreen_btn?false:true,
                    icon: "fas fa-expand-wide",
                    tooltip: t("fullscreen"),
                    click: function() {
                        self.parent.gobj_send_event(
                            "EV_SET_FULLSCREEN",
                            {
                                with_panel_title: self.config.panel_properties.with_panel_title
                            },
                            self
                        );
                    }
                },
                {
                    view:"icon",
                    hidden: self.config.panel_properties.with_panel_hidden_btn?false:true,
                    icon:"far fa-window-minimize",
                    tooltip: t("minimize"),
                    click: function() {
                        /*----------------------------*
                         *  Minimize, hide the panel
                         *----------------------------*/
                        this.getParentView().getParentView().hide();

                        /*----------------------------------------------*
                         *  Inform of view state to "Container Panel"
                         *----------------------------------------------*/
                        self.parent.gobj_send_event("EV_ON_VIEW_SHOW", {}, self);
                    }
                }
            ]
        };
        return top_toolbar;
    }

    //=======================================================================
    //      Expose the class via the global object
    //=======================================================================
    exports.Ui_container = Ui_container;
    exports.get_container_panel_top_toolbar = get_container_panel_top_toolbar;
    exports.toggle_container_panel = toggle_container_panel;

})(this);
