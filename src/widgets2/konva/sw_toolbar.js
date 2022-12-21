/***********************************************************************
 *          Sw_toolbar.js
 *
 *          Toolbar
 *          Based in ScrollvieW
 *
 *          Copyright (c) 2022 Niyamaka.
 *          All Rights Reserved.
 ***********************************************************************/
(function (exports) {
    'use strict';

    /********************************************
     *  Configuration (C attributes)
     *  Attributes without underscore prefix
     *      will be set in self.config
     *  Attributes with underscore ("_") prefix:
     *      will be set in self.private
     ********************************************/
    let CONFIG = {
        //////////////// Public Attributes //////////////////
        subscriber: null,   // subscriber of publishing messages (Child model: if null will be the parent)
        layer: null,        // Konva layer

        //------------ Own Attributes ------------//
        orientation: "horizontal", /* "vertical" or "horizontal" */
        wide: 40,
        long: 0,        /* 0 = adjust to screen */
        views: [],

        //------- Ka_scrollview Attributes --- HACK use ka_scrollview directly ---------//
        x: 0,
        y: 0,
        width: 0,       // Calculated inside (based in orientation/wide/long)
        height: 0,      // Calculated inside (based in orientation/wide/long)
        padding: 10,
        background_color: "#EEEEEE",

        visible: true,
        panning: true,          // Enable (inner dragging) panning
        draggable: false,       // Enable (outer dragging) dragging

        fix_dimension_to_screen: false,

        enable_vscroll: false,  // Calculated inside
        enable_hscroll: false,  // Calculated inside

        quick_display: false,   // For debugging, draw quickly

        kw_border_shape: { /* Border shape */
            strokeWidth: 0,
            opacity: 1,
            shadowBlur: 0
        },
        kw_border_shape_actived: { /* Border shape for active windows */
            stroke: null,
            opacity: 1,
            shadowColor: null,
            shadowBlur: null
        },

        //////////////// Private Attributes /////////////////
        _gobj_ka_scrollview: null,
        // TODO debería usar los child gobj y sus funciones y no la extra find_gobj_in_list()
        _views: []  // list of view's gobjs
    };




            /***************************
             *      Local Methods
             ***************************/




    /************************************************
     *
     ************************************************/
    function calculate_dimension(self)
    {
        switch(self.config.orientation) {
            case "vertical":
                if(self.config.long === 0) {
                    self.config.long = self.gobj_parent().gobj_read_attr("height");
                }
                self.config.width = self.config.wide;
                self.config.height = self.config.long;
                self.config.enable_vscroll = true;
                self.config.enable_hscroll = false;
                break;
            default:
            case "horizontal":
                if(self.config.long === 0) {
                    self.config.long = self.gobj_parent().gobj_read_attr("width");
                }
                self.config.width = self.config.long;
                self.config.height = self.config.wide;
                self.config.enable_vscroll = false;
                self.config.enable_hscroll = true;
                break;
        }
    }




            /***************************
             *      Actions
             ***************************/




    /********************************************
     *  EV_ADD_VIEWS {
     *      "views": [{id:, gclass:, kw: }, ...]
     *      or
     *      "views": [gobj, ...]
     *  }
     ********************************************/
    function ac_add_views(self, event, kw, src)
    {
        let views = kw_get_dict_value(kw, "views", null, false, false);

        for(let view of views) {
            let gobj_node = null;
            if(is_gobj(view)) {
                gobj_node = view;
            } else if(is_object(view)) {
                gobj_node = self.yuno.gobj_create(
                    kw_get_str(view, "id", kw_get_str(view, "name", "")),
                    kw_get_dict_value(view, "gclass", null),
                    kw_get_dict(view, "kw", {}),
                    self
                );
                if(!gobj_node) {
                    continue;
                }
            } else {
                log_error("What is it?" + view);
                continue;
            }

            self.private._views.push(gobj_node); // TODO no deberían ser simplemente hijos?, esto unuseful

            let k = gobj_node.get_konva_container();
            self.private._gobj_ka_scrollview.gobj_send_event(
                "EV_ADD_ITEMS",
                {
                    items: [k]
                },
                self
            );
        }

        return 0;
    }

    /********************************************
     *  EV_REMOVE_VIEWS {
     *      "views": ["id", ...]
     *      or
     *      "views": [{id: "id", }, ...]
     *      or
     *      "views": [gobj, ...]
     *  }
     ********************************************/
    function ac_remove_views(self, event, kw, src)
    {
        let views = kw_get_dict_value(kw, "views", null, false, false);

        for(let view of views) {
            let gobj = null;
            if(is_string(view)) {
                let name = view;
                gobj = find_gobj_in_list(self.private._views, name);
            } else if(is_object(view)) {
                let name = kw_get_str(view, "id", kw_get_str(view, "name", null));
                gobj = find_gobj_in_list(self.private._views, name);
            } else if(is_gobj(view)) {
                gobj = gobj;
            } else {
                log_error("What f*ck is?" + view);
                continue;
            }

            let idx = index_of_list(gobj, self.private._views);
            if(idx < 0) {
                log_error("gobj not found: ", gobj.gobj_name());
                continue;
            }

            let k = gobj.get_konva_container();
            self.private._gobj_ka_scrollview.gobj_send_event(
                "EV_REMOVE_ITEMS",
                {
                    items: [k]
                },
                self
            );

            self.private._views.splice(idx, 1);

            self.yuno.gobj_destroy(gobj);
        }

        return 0;
    }

    /********************************************
     *  To show a view of multiview:
     *      {
     *          "id":
     *          or
     *          "name:
     *      }
     *  else (to show or hide the multiview self):
     *      {
     *          x:
     *          y:
     *      }
     ********************************************/
    function ac_show_or_hide(self, event, kw, src)
    {
        let __ka_main__ = self.yuno.gobj_find_service("__ka_main__", true);

        /*--------------------------------------*
         *  Check if it's the show for a view
         *--------------------------------------*/
        let name = kw_get_str(kw, "id", kw_get_str(kw, "name", null));
        if(!empty_string(name)) {
            if(event === "EV_SHOW") {
                let gobj = find_gobj_in_list(self.private._views, name);
                if(gobj) {
                    gobj.get_konva_container().moveToTop();
                    __ka_main__.gobj_send_event("EV_ACTIVATE", {}, gobj);
                }
            }
            return 0;
        }

        /*-----------------------------*
         *  Show/Hide self multiview
         *-----------------------------*/
        let position = kw;
        let node_dimension = {};
        self.private._gobj_ka_scrollview.gobj_send_event("EV_GET_DIMENSION", node_dimension, self);

        self.config.x = kw_get_int(position, "x", node_dimension.x, true, false);
        self.config.y = kw_get_int(position, "y", node_dimension.y, true, false);
        self.private._gobj_ka_scrollview.gobj_send_event("EV_POSITION", position, self);
        self.private._gobj_ka_scrollview.gobj_send_event(event, kw, self);

        /*
         *  Global event to close popup window when hit outside
         */
        if(self.private._gobj_ka_scrollview.isVisible()) {
            /*
             *  Window visible
             */
            __ka_main__.gobj_send_event("EV_ACTIVATE", {}, self);

        } else {
            __ka_main__.gobj_send_event("EV_DEACTIVATE", {}, self);
        }

        return 0;
    }

    /********************************************
     *
     ********************************************/
    function ac_keydown(self, event, kw, src)
    {
        let ret = 0;
        /*
         * Retorna -1 si quieres poseer el evento (No será subido hacia arriba).
         */
        return ret;
    }

    /********************************************
     *  Order from __ka_main__
     *  Please be idempotent
     ********************************************/
    function ac_activate(self, event, kw, src)
    {
        self.get_konva_container().moveToTop();
        self.private._gobj_ka_scrollview.gobj_send_event("EV_ACTIVATE", {}, self);

        return 0;
    }

    /********************************************
     *  Order from __ka_main__
     *  Please be idempotent
     ********************************************/
    function ac_deactivate(self, event, kw, src)
    {
        self.private._gobj_ka_scrollview.gobj_send_event("EV_DEACTIVATE", {}, self);

        return 0;
    }

    /********************************************
     *  kw: {
     *      x:
     *      y:
     *  }
     ********************************************/
    function ac_position(self, event, kw, src)
    {
        self.config.x = kw_get_int(kw, "x", self.config.x, false, false);
        self.config.y = kw_get_int(kw, "y", self.config.y, false, false);

        let position = {
            x: self.config.x,
            y: self.config.y
        };

        self.private._gobj_ka_scrollview.gobj_send_event(event, position, self);
        return 0;
    }

    /********************************************
     *  kw: {
     *      width:
     *      height:
     *  }
     ********************************************/
    function ac_size(self, event, kw, src)
    {
        self.config.width = kw_get_int(kw, "width", self.config.width, false, false);
        self.config.height = kw_get_int(kw, "height", self.config.height, false, false);

        let size = {
            width: self.config.width,
            height: self.config.height
        };

        self.private._gobj_ka_scrollview.gobj_send_event(event, size, self);
        return 0;
    }

    /********************************************
     *  Top order
     ********************************************/
    function ac_resize(self, event, kw, src)
    {
        self.config.x = kw_get_int(kw, "x", self.config.x);
        self.config.y = kw_get_int(kw, "y", self.config.y);
        self.config.wide = kw_get_int(kw, "wide", self.config.wide);
        self.config.long = kw_get_int(kw, "long", self.config.long);

        calculate_dimension(self);

        self.private._gobj_ka_scrollview.gobj_send_event(
            "EV_RESIZE",
            {
                x: self.config.x,
                y: self.config.y,
                width: self.config.width,
                height: self.config.height
            },
            self
        );

        return 0;
    }

    /********************************************
     *  Child panning/panned
     ********************************************/
    function ac_panning(self, event, kw, src)
    {
        if(src == self.private._gobj_ka_scrollview) {
            // Self panning
        }
        return 0;
    }

    /********************************************
     *  Child moving/moved
     ********************************************/
    function ac_moving(self, event, kw, src)
    {
        if(src == self.private._gobj_ka_scrollview) {
            // Self moving
        } else {
            // Child moving
            if(strcmp(event, "EV_MOVED")==0) {
                if(kw.x < 0 || kw.y < 0) {
                    // Refuse negative logic
                    if(kw.x < 0) {
                        kw.x = 0;
                    }
                    if(kw.y < 0) {
                        kw.y = 0;
                    }
                    src.gobj_send_event("EV_POSITION", kw, self);
                }
                self.private._gobj_ka_scrollview.gobj_send_event(
                    "EV_RESIZE",
                    {
                    },
                    self
                );
            }
        }
        return 0;
    }

    /********************************************
     *  Child showed
     ********************************************/
    function ac_showed(self, event, kw, src)
    {
        return 0;
    }

    /********************************************
     *  Child hidden
     ********************************************/
    function ac_hidden(self, event, kw, src)
    {
        return 0;
    }




            /***************************
             *      GClass/Machine
             ***************************/




    let FSM = {
        "event_list": [
            "EV_KEYDOWN",
            "EV_ADD_VIEWS",
            "EV_REMOVE_VIEWS",
            "EV_ACTIVATE",
            "EV_DEACTIVATE",
            "EV_TOGGLE",
            "EV_POSITION",
            "EV_SIZE",
            "EV_SHOW",
            "EV_HIDE",
            "EV_RESIZE",

            "EV_PANNING",
            "EV_PANNED",
            "EV_MOVING",
            "EV_MOVED",
            "EV_SHOWED",
            "EV_HIDDEN"
        ],
        "state_list": [
            "ST_IDLE"
        ],
        "machine": {
            "ST_IDLE":
            [
                ["EV_KEYDOWN",          ac_keydown,             undefined],
                ["EV_ADD_VIEWS",        ac_add_views,           undefined],
                ["EV_REMOVE_VIEWS",     ac_remove_views,        undefined],
                ["EV_ACTIVATE",         ac_activate,            undefined],
                ["EV_DEACTIVATE",       ac_deactivate,          undefined],

                ["EV_TOGGLE",           ac_show_or_hide,        undefined],
                ["EV_SHOW",             ac_show_or_hide,        undefined],
                ["EV_HIDE",             ac_show_or_hide,        undefined],
                ["EV_POSITION",         ac_position,            undefined],
                ["EV_SIZE",             ac_size,                undefined],
                ["EV_RESIZE",           ac_resize,              undefined],

                ["EV_PANNING",          ac_panning,             undefined],
                ["EV_PANNED",           ac_panning,             undefined],
                ["EV_MOVING",           ac_moving,              undefined],
                ["EV_MOVED",            ac_moving,              undefined],
                ["EV_SHOWED",           ac_showed,              undefined],
                ["EV_HIDDEN",           ac_hidden,              undefined],
            ]
        }
    };

    let Sw_toolbar = GObj.__makeSubclass__();
    let proto = Sw_toolbar.prototype; // Easy access to the prototype
    proto.__init__= function(name, kw) {
        GObj.prototype.__init__.call(
            this,
            FSM,
            CONFIG,
            name,
            "Sw_toolbar",
            kw,
            0 //gcflag_no_check_output_events
        );
        return this;
    };
    gobj_register_gclass(Sw_toolbar, "Sw_toolbar");




            /***************************
             *      Framework Methods
             ***************************/




    /************************************************
     *      Framework Method create
     ************************************************/
    proto.mt_create = function(kw)
    {
        let self = this;

        /*
         *  CHILD subscription model
         */
        let subscriber = self.gobj_read_attr("subscriber");
        if(!subscriber) {
            subscriber = self.gobj_parent();
        }
        self.gobj_subscribe_event(null, null, subscriber);

        if(!self.config.layer) {
            self.config.layer = self.gobj_parent().config.layer;
        }

        calculate_dimension(self);

        let visible = self.config.visible;

        self.private._gobj_ka_scrollview = self.yuno.gobj_create(
            "ka_scrollview",
            Ka_scrollview,
            {
                layer: self.config.layer,

                x: self.config.x,
                y: self.config.y,
                width: self.config.width,
                height: self.config.height,
                padding: self.config.padding,
                background_color: self.config.background_color,

                visible: visible,
                panning: self.config.panning,       // Enable (inner dragging) panning
                draggable: self.config.draggable,   // Enable (outer dragging) dragging

                autosize: false,
                fix_dimension_to_screen: self.config.fix_dimension_to_screen,
                center: false,
                show_overflow: false,

                enable_vscroll: self.config.enable_vscroll,
                enable_hscroll: self.config.enable_hscroll,
                scroll_by_step: true,
                hide_hscrollbar: true,     // Don't show horizontal (auto) scrollbar
                hide_vscrollbar: true,     // Don't show vertical (auto) scrollbar

                quick_display: self.config.quick_display,

                kw_border_shape: __duplicate__(
                    kw_get_dict(self.config, "kw_border_shape", {})
                ),
                kw_border_shape_actived: __duplicate__(
                    kw_get_dict(self.config, "kw_border_shape_actived", {})
                )
            },
            self
        );
        self.private._gobj_ka_scrollview.get_konva_container().gobj = self; // cross-link

        self.gobj_send_event("EV_ADD_VIEWS", {views: self.config.views}, self);
        if(visible) {
            self.gobj_send_event("EV_SHOW", {}, self);
        }
    };

    /************************************************
     *      Framework Method destroy
     *      In this point, all childs
     *      and subscriptions are already deleted.
     ************************************************/
    proto.mt_destroy = function()
    {
        let self = this;
    };

    /************************************************
     *      Framework Method start
     ************************************************/
    proto.mt_start = function(kw)
    {
        let self = this;
    };

    /************************************************
     *      Framework Method stop
     ************************************************/
    proto.mt_stop = function(kw)
    {
        let self = this;
    };

    /************************************************
     *  Framework Method mt_child_added
     ************************************************/
    proto.mt_child_added = function(child)
    {
        let self = this;
        if(self.private._gobj_ka_scrollview) {
            self.gobj_send_event(
                "EV_ADD_VIEWS",
                {
                    views: [child]
                },
                self
            );
        }
    };

    /************************************************
     *  Framework Method mt_child_added
     ************************************************/
    proto.mt_child_removed = function(child)
    {
        let self = this;
        self.gobj_send_event(
            "EV_REMOVE_VIEWS",
            {
                views: [child]
            },
            self
        );
    };

    /************************************************
     *      Local Method
     ************************************************/
    proto.get_konva_container = function()
    {
        let self = this;
        return self.private._gobj_ka_scrollview.get_konva_container();
    };

    //=======================================================================
    //      Expose the class via the global object
    //=======================================================================
    exports.Sw_toolbar = Sw_toolbar;

})(this);
