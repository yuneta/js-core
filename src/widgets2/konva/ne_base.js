/***********************************************************************
 *          Ne_base.js
 *
 *          Node basic
 *
 *          Mixin of ka_scrollview and ka_button
 *


                                ┌── Ports top
        Button top-left         │                   ┌──────── Button top-right
              │                 ▼                   ▼
              │      ┌─────┬──┬──┬──┬──┬──┬──┬──┬─────┐
              └────► │     │  │  │  │  │  │  │  │     │
                     ├─────┼──┴──┴──┴──┴──┴──┴──┼─────┤
                     │     │                    │     │
                     ├─────┤                    ├─────┤
           ┌───────► │     │                    │     │ ─────► Ports output
           │         ├─────┤     Scrollview     ├─────┤
    Ports input      │     │     center         │     │
                     ├─────┤                    ├─────┤
                     │     │                    │     │
                     ├─────┤                    ├─────┤
                     │     │                    │     │
                     ├─────┼──┬──┬──┬──┬──┬──┬──┼─────┤
                     │     │  │  │  │  │  │  │  │     │
                     └─────┴──┴──┴──┴──┴──┴──┴──┴─────┘
                      ▲         ▲                    ▲
Button bottom-left ───┘         │                    └─────── Button bottom-right
                                └─── Ports bottom


 *          Copyright (c) 2023 Niyamaka.
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
        subscriber: null,       // subscriber of publishing messages (Child model: if null will be the parent)
        layer: null,            // Konva layer
        gobj_links_root: null,  // Root gobj of links

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
        padding: 2,
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
            stroke: null,
            opacity: 1,
            shadowColor: null,
            shadowBlur: 0
        },
        kw_border_shape_actived: { /* Border shape for active windows */
            // Only used: stroke, opacity, shadowBlur, shadowColor
        },

        //////////////// Private Attributes /////////////////
        _gobj_ka_scrollview: null
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

    /************************************************
     *  Return the link gobj, null if error
     ************************************************/
    function create_link(self, kw)
    {
        let source_gobj = self; // source gobj is self
        let id = kw_get_str(kw, "id", kw_get_str(kw, "name", ""));

        /*
         *  Check if link exists
         */
        let gobj_link = self.yuno.gobj_find_unique_gobj(id);
        if(gobj_link) {
            log_error(sprintf("ne_base: link already exists '%s'", id));
            return null;
        }

        let target_gobj = get_unique_gobj(self, kw_get_dict_value(kw, "target_gobj", null));
        let source_port = get_child_gobj(self, self, kw_get_dict_value(kw, "source_port", id));
        let target_port = get_child_gobj(self, target_gobj, kw_get_dict_value(kw, "target_port", id));
        if(!target_gobj || !source_port || !target_port) {
            // Error already logged
            return null;
        }

        return self.yuno.gobj_create(
            id,
            Ka_link,
            {
                source_gobj: source_gobj,
                source_port: source_port,
                target_gobj: target_gobj,
                target_port: target_port
            },
            self.config.gobj_links_root
        );
    }

    /********************************************
     *  Return the unique gobj, null if error
     ********************************************/
    function get_unique_gobj(self, name)
    {
        let target_gobj;

        if (is_string(name)) {
            target_gobj = self.yuno.gobj_find_unique_gobj(name);
            if (!target_gobj) {
                log_error("ne_base: target_gobj must be an unique gobj: " + name);
                return null;
            }
        } else if (is_gobj(name)) {
            target_gobj = name;
        } else {
            target_gobj = null;
            log_error(sprintf("ne_base: name must be an string or gobj"));
        }

        return target_gobj;
    }

    /********************************************
     *  Return the child gobj, null if error
     ********************************************/
    function get_child_gobj(self, gobj_parent, name)
    {
        let child_gobj;

        if (is_string(name)) {
            child_gobj = gobj_parent.gobj_child_by_name(name);
            if (!child_gobj) {
                log_error(
                    sprintf("ne_base: child_gobj not found: parent '%s', child '%s'",
                        gobj_parent.gobj_short_name(),
                        name
                    )
                );
                return null;
            }
        } else if (is_gobj(name)) {
            child_gobj = name;
        } else {
            child_gobj = null;
            log_error(sprintf("ne_base: child_gobj must be an string or gobj"));
        }

        return child_gobj;
    }




            /***************************
             *      Actions
             ***************************/




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
     *  EV_ADD_VIEW {
     *      "views": [{id:, gclass:, kw: }, ...]
     *      or
     *      "views": [gobj, ...]
     *  }
     *
     *  You can use "name" instead of "id"
     *
     ********************************************/
    function ac_add_view(self, event, kw, src)
    {
        let views = kw_get_dict_value(kw, "views", null, false, false);

        let toolbar_container = self.private._gobj_ka_scrollview.get_konva_container();

        let x=0,y=0,k=null;

        for(let view of views) {
            let gobj_node = null;
            if(is_gobj(view)) {
                gobj_node = view;
                k = gobj_node.get_konva_container();
            } else if(is_object(view)) {
                let kw_view = kw_get_dict(view, "kw", {});
                json_object_update(kw_view, {
                    subscriber: self.config.subscriber,
                    x: x,
                    y: y
                });
                gobj_node = self.yuno.gobj_create(
                    kw_get_str(view, "id", kw_get_str(view, "name", "")),
                    kw_get_dict_value(view, "gclass", null),
                    kw_view,
                    self
                );
                if(!gobj_node) {
                    continue;
                }
                k = gobj_node.get_konva_container();
                let dim = k.getClientRect({skipShadow:true, skipStroke:true});
                switch(self.config.orientation) {
                    case "vertical":
                        // TODO ajusta tamaño a la toolbar y posiciona
                        // EV_SIZE
                        //width,height

                        // TODO
                        // EV_POSITION
                        //x,y

                        x = 0;  // TODO toolbar padding
                        y += dim.height;
                        break;

                    default:
                    case "horizontal":
                        // TODO ajusta tamaño a la toolbar y posiciona
                        x += dim.width;
                        y = 0;  // TODO toolbar padding
                        break;
                }
                continue; // goes recurrent ac_add_view() by mt_child_added()
            } else {
                log_error("What is it?" + view);
                continue;
            }

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
     *  EV_REMOVE_VIEW {
     *      "views": ["id", ...]
     *      or
     *      "views": [{id: "id", }, ...]
     *      or
     *      "views": [gobj, ...]
     *  }
     ********************************************/
    function ac_remove_view(self, event, kw, src)
    {
        let views = kw_get_dict_value(kw, "views", null, false, false);

        for(let view of views) {
            let childs = null;
            if(is_string(view)) {
                let name = view;
                childs = self.gobj_match_childs({__gobj_name__: name});
            } else if(is_object(view)) {
                let name = kw_get_str(view, "id", kw_get_str(view, "name", ""));
                childs = self.gobj_match_childs({__gobj_name__: name});
            } else if(is_gobj(view)) {
                childs = [view];
            } else {
                log_error("What is?" + view);
                continue;
            }

            for(let child in childs) {
                let k = child.get_konva_container();
                self.private._gobj_ka_scrollview.gobj_send_event(
                    "EV_REMOVE_ITEMS",
                    {
                        items: [k]
                    },
                    self
                );
                if(!child.gobj_is_destroying()) {
                    self.yuno.gobj_destroy(child);
                }
            }
        }

        return 0;
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
        let name = kw_get_str(kw, "id", kw_get_str(kw, "name", ""));
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
     *  Link supported
     *
     *  Pass next parameters directly in kw (single links) or in a 'links' array (multiple links)
     *
     *  id/name:
     *      name of link gobj, and name of source_port/target_port if they are empty.
     *
     *  target_gobj:
     *      - string: name of target gobj (unique or service gobj)
     *      - gobj: target gobj, must be an unique gobj.
     *
     *  source_port: Use `id` if source_port is an empty string
     *      - string: name of source port gobj, must be a child of self
     *      - gobj: source port gobj, must be a child of self
     *
     *  target_port: Use `id` if target_port is an empty string
     *      - string: name of target port gobj, must be a child of target_gobj
     *      - gobj: target port gobj, must be a child of target_gobj
     *
     ********************************************/
    function ac_link(self, event, kw, src)
    {
        let links = kw_get_list(kw, "links", null);
        if(!links) {
            /*
             *  Single link
             */
            return create_link(self, kw);
        } else {
            for(let link in links) {
                create_link(self, link);
            }
        }

        return 0;
    }

    /********************************************
     *  Link supported
     ********************************************/
    function ac_unlink(self, event, kw, src)
    {
        let source_gobj = kw_get_dict_value(kw, "source_gobj", src);
        // TODO
        return 0;
    }

    /********************************************
     *  Child panning/panned
     ********************************************/
    function ac_panning(self, event, kw, src)
    {
        if(src === self.private._gobj_ka_scrollview) {
            // Self panning
        }
        return 0;
    }

    /********************************************
     *  Child moving/moved
     ********************************************/
    function ac_moving(self, event, kw, src)
    {
        if(src === self.private._gobj_ka_scrollview) {
            // Self moving
        } else {
            // Child moving
            if(strcmp(event, "EV_MOVED")===0) {
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
            "EV_ADD_VIEW",
            "EV_REMOVE_VIEW",
            "EV_ACTIVATE",
            "EV_DEACTIVATE",
            "EV_TOGGLE",
            "EV_POSITION",
            "EV_SIZE",
            "EV_SHOW",
            "EV_HIDE",
            "EV_RESIZE",

            "EV_LINK",
            "EV_UNLINK",

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
                ["EV_ADD_VIEW",         ac_add_view,            undefined],
                ["EV_REMOVE_VIEW",      ac_remove_view,         undefined],

                ["EV_ACTIVATE",         ac_activate,            undefined],
                ["EV_DEACTIVATE",       ac_deactivate,          undefined],

                ["EV_TOGGLE",           ac_show_or_hide,        undefined],
                ["EV_SHOW",             ac_show_or_hide,        undefined],
                ["EV_HIDE",             ac_show_or_hide,        undefined],
                ["EV_POSITION",         ac_position,            undefined],
                ["EV_SIZE",             ac_size,                undefined],
                ["EV_RESIZE",           ac_resize,              undefined],

                ["EV_LINK",             ac_link,                undefined],
                ["EV_UNLINK",           ac_unlink,              undefined],

                ["EV_PANNING",          ac_panning,             undefined],
                ["EV_PANNED",           ac_panning,             undefined],
                ["EV_MOVING",           ac_moving,              undefined],
                ["EV_MOVED",            ac_moving,              undefined],
                ["EV_SHOWED",           ac_showed,              undefined],
                ["EV_HIDDEN",           ac_hidden,              undefined],
            ]
        }
    };

    let Ne_base = GObj.__makeSubclass__();
    let proto = Ne_base.prototype; // Easy access to the prototype
    proto.__init__= function(name, kw) {
        GObj.prototype.__init__.call(
            this,
            FSM,
            CONFIG,
            name,
            "Ne_base",
            kw,
            0 //gcflag_no_check_output_events
        );
        return this;
    };
    gobj_register_gclass(Ne_base, "Ne_base");




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
        if(!self.config.gobj_links_root) {
            self.config.gobj_links_root = self.yuno.gobj_find_service("__links_root__", true);
            if(!self.config.gobj_links_root) {
                log_error("gobj_links_root MISSING");
            }
        }

        calculate_dimension(self);

        let visible = self.config.visible;

        self.private._gobj_ka_scrollview = self.yuno.gobj_create(
            self.gobj_name(),
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

        self.gobj_send_event("EV_ADD_VIEW", {views: self.config.views}, self);
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
                "EV_ADD_VIEW",
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
            "EV_REMOVE_VIEW",
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
    exports.Ne_base = Ne_base;

})(this);
