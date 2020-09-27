/***********************************************************************
 *          ui_pinhold.js
 *
 *          Hold of pin
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
        elements: [],
        pinhold_button_id: "",

        ui_properties: null,
        $ui: null,

        views_opened: {
        },

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

    /************************************************************
     *   Webix UI
     ************************************************************/
    function build_webix(self)
    {
        var mode = self.config.mode;

        var toolbar = {
            view: "toolbar",
            id: build_name(self, "pinhold_toolbar"),
            css: "toolbar2color"
        };
        var scrollview = {
            view: "scrollview",
            body: toolbar
        };
        if(mode == "vertical") {
            toolbar["width"] = 40;
            toolbar["rows"] = self.config.elements;
            toolbar["scroll"] = "y";

        } else {
            toolbar["height"] = 40;
            toolbar["cols"] = self.config.elements;
            toolbar["scroll"] = "x";
        }
        self.config.$ui = webix.ui(scrollview);
        self.config.$ui.gobj = self;

        if(self.config.ui_properties) {
            self.config.$ui.define(self.config.ui_properties);
            if(self.config.$ui.refresh) {
                self.config.$ui.refresh();
            }
        }

        self.parent.gobj_write_attr("$ui_pinhold", self.config.$ui);
    }




            /***************************
             *      Actions
             ***************************/




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
            "EV_SELECT",
            "EV_REFRESH"
        ],
        "state_list": [
            "ST_IDLE"
        ],
        "machine": {
            "ST_IDLE":
            [
                ["EV_SELECT",               ac_select,          undefined],
                ["EV_REFRESH",              ac_refresh,         undefined]
            ]
        }
    };

    var Ui_pinhold = GObj.__makeSubclass__();
    var proto = Ui_pinhold.prototype; // Easy access to the prototype
    proto.__init__= function(name, kw) {
        GObj.prototype.__init__.call(
            this,
            FSM,
            CONFIG,
            name,
            "Ui_pinhold",
            kw,
            0
        );
        return this;
    };
    gobj_register_gclass(Ui_pinhold, "Ui_pinhold");




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

        // TODO hay que añadir un button
        //$$(build_name(self, "pinhold_toolbar")).addView(child.config.$ui);
        child.config.$ui.show();
    }

    /************************************************
     *  Framework Method mt_child_added
     ************************************************/
    proto.mt_child_removed = function(child)
    {
        var self = this;

        // TODO hay que quitar un button
        //$$(build_name(self, "pinhold_toolbar")).removeView(child.config.$ui);
        delete self.config.views_opened[child.gobj_escaped_short_name()];

        if(self.config.$ui.getChildViews() == 0) {
            var $btn = $$(self.config.pinhold_button_id);
            if($btn) {
                $btn.define("image", "");
                $btn.refresh();
                $btn.hide();
            }
        }
    }

    //=======================================================================
    //      Common code for pinhold panels
    //=======================================================================
    function get_pinhold_panel_top_toolbar(self)
    {
        /*------------------------------------------*
         *      Top Toolbar of "Container Panel"
         *------------------------------------------*/
        var top_toolbar = {
            view:"toolbar",
            id: build_name(self, "top_toolbar"),
            css: "toolbar2color",
            height: 30,
            cols: [
                {
                    view: "button",
                    type: "image",
                    hidden: true, // FUTURE by the moment hide
                    image: "/static/app/images/yuneta/pin.svg",
                    autowidth: true,
                    css: "webix_transparent btn_icon_toolbar_16",
                    tooltip: t("Pin the window"),
                    click: function() {
                        var x = self.gobj_escaped_short_name();
                        if(self.parent.config.views_opened[x]) {
                            delete self.parent.config.views_opened[x];
                            this.define("image", "/static/app/images/yuneta/pin.svg");
                        } else {
                            self.parent.config.views_opened[x] = true;
                            this.define("image", "/static/app/images/yuneta/pin-push.svg");
                        }
                        this.refresh();

                        var $btn = $$(self.parent.config.pinhold_button_id);
                        if($btn) {
                            if(json_object_size(self.parent.config.views_opened)==0) {
                                $btn.define("image", "/static/app/images/yuneta/pin.svg");
                                $btn.refresh();
                                $btn.hide();
                            } else {
                                $btn.define("image", "/static/app/images/yuneta/pin-push.svg");
                                $btn.refresh();
                                $btn.show();
                            }
                        }
                    }
                },
                {gravity: 1},
                {
                    view: "label",
                    gravity: 20,
                    label: self.config.window_title
                },
                {gravity: 1},
                {
                    view:"icon",
                    icon: "fas fa-expand-wide",
                    tooltip: t("fullscreen"),
                    click: function() {
                        //$$(build_name(self, "top_toolbar")).hide();
                        webix.fullscreen.set(
                            self.config.$ui_fullscreen,
                            {
                                head: {
                                    view:"toolbar",
                                    height: 40,
                                    elements: [
                                        {
                                            view: "icon",
                                            icon: "fas fa-chevron-left",
                                            tooltip: t("exit fullscreen"),
                                            click: function() {
                                                webix.fullscreen.exit();
                                                $$(build_name(self, "top_toolbar")).show();
                                                self.parent.gobj_send_event(
                                                    "EV_REFRESH", {}, self
                                                );
                                            }
                                        },
                                        {},
                                        {
                                            view: "label",
                                            label: self.config.window_title
                                        },
                                        {}
                                    ]
                                }
                            }
                        );
                        self.parent.gobj_send_event("EV_REFRESH", {}, self);
                    }
                },
                {
                    view:"icon",
                    icon:"far fa-window-minimize",
                    tooltip: t("minimize"),
                    click: function() {
                        if(this.getTopParentView().config.fullscreen) {
                            webix.fullscreen.exit();
                        }
                        __yuno__.gobj_destroy(self);
                    }
                }
            ]
        };
        return top_toolbar;
    }

    //=======================================================================
    //      Expose the class via the global object
    //=======================================================================
    exports.Ui_pinhold = Ui_pinhold;
    exports.get_pinhold_panel_top_toolbar = get_pinhold_panel_top_toolbar;

})(this);

