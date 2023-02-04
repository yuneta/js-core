/***********************************************************************
 *          Ne_base.js
 *
 *          Node basic
 *
 *          Mixin of ka_scrollview and ka_button
 *


                                ┌── Top Ports 'top'
        Button 'top_left'       │                   ┌──────── Button 'top_right'
              │                 ▼                   ▼
              │      ┌─────┬──┬──┬──┬──┬──┬──┬──┬─────┐
              └────► │     │  │  │  │  │  │  │  │     │
                     ├─────┼──┴──┴──┴──┴──┴──┴──┼─────┤
                     │     │     'title'        │     │
                     ├─────┤                    ├─────┤
           ┌───────► │     │                    │     │ ─────► Output Ports 'output'
           │         ├─────┤     Scrollview     ├─────┤
 Input Ports 'input' │     │     'center'       │     │
                     ├─────┤                    ├─────┤
                     │     │                    │     │
                     ├─────┤                    ├─────┤
                     │     │                    │     │
                     ├─────┼──┬──┬──┬──┬──┬──┬──┼─────┤
                     │     │  │  │  │  │  │  │  │     │
                     └─────┴──┴──┴──┴──┴──┴──┴──┴─────┘
                      ▲         ▲                    ▲
   Button             │         │                    │
      'bottom_left' ──┘         │                    └─────── Button 'bottom_right'
                                └─── Bottom Ports 'bottom'


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
        x: 0,
        y: 0,
        width: 400,
        height: 250,
        shape: "rect",      /* "rect" or "circle" */

        padding: 30,        /* Padding: left space to ports */
        offset: 5,          /* Offset for ports position */

        background_color: "#FFF7E0",
        color: "red",       /* Default color for texts */

        visible: true,
        draggable: true,   // Enable (outer dragging) dragging

        top_on_activate: false,     // Move node to the top of its siblings on activation

        disabled: false,    // When True the button is disabled, managed by EV_DISABLE/EV_ENABLE too
        selected: false,    // When True the button is selected, managed by EV_SELECT/EV_UNSELECT too
        unlocked: false,    // When True designing is enabled, managed by EV_UNLOCK/EV_LOCK too

        kw_border_shape: { /* Border shape */
            cornerRadius: 10,
            strokeWidth: 2,
            stroke: "#f5c211ff",
            opacity: 1,
            shadowBlur: 0,
            shadowColor: "black",
            shadowForStrokeEnabled: false // HTML5 Canvas Optimizing Strokes Performance Tip
        },
        kw_border_shape_actived: { /* Border shape for active windows */
            // Only used: stroke, opacity, shadowBlur, shadowColor
        },

        //------------ Components ------------//
        title: { // HACK See shape_label_with_icon attributes
            height: 40
        },
        input: {
            width: 15,
            height: 15,
            radius: 15,
        },
        output: {
            width: 15,
            height: 15,
            radius: 15,
        },
        top: {
            width: 15,
            height: 15,
            radius: 15,
        },
        bottom: {
            width: 15,
            height: 15,
            radius: 15,
        },

        top_left: {},
        top_right: {},
        bottom_left: {},
        bottom_right: {},
        center: {},

        //////////////// Private Attributes /////////////////
        _ka_container: null,
        _ka_border_shape: null,
        _ka_title: null,
    };




            /***************************
             *      Local Methods
             ***************************/




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
        let source_port = get_child_gobj(
            self, self, kw_get_dict_value(kw, "source_port", id)
        );
        let target_port = get_child_gobj(
            self, target_gobj, kw_get_dict_value(kw, "target_port", id)
        );
        if(!source_gobj || !target_gobj || !source_port || !target_port) {
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
                log_error(sprintf("get_unique_gobj(): gobj must be an unique gobj: '%s'",name));
                return null;
            }
        } else if (is_gobj(name)) {
            target_gobj = name;
        } else {
            target_gobj = null;
            log_error(sprintf("get_unique_gobj(): name must be an string or gobj"));
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
                    sprintf("get_child_gobj(): child_gobj not found: parent '%s', child '%s'",
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
            log_error(sprintf("get_child_gobj(): child_gobj must be an string or gobj"));
        }

        return child_gobj;
    }

    /********************************************
     *
     ********************************************/
    function create_shape(self)
    {
        let width = self.config.width;
        let height = self.config.height;

        /*----------------------------*
         *  Container (Group)
         *----------------------------*/
        let ka_container = self.private._ka_container = new Konva.Group({
            id: self.gobj_short_name(),
            name: "ka_container",
            x: self.config.x,
            y: self.config.y,
            width: width,
            height: height,
            visible: self.config.visible,
            draggable: self.config.draggable
        });
        ka_container.gobj = self; // cross-link

        /*----------------------------*
         *  Border
         *----------------------------*/
        let kw_border_shape = __duplicate__(
            kw_get_dict(self.config, "kw_border_shape", {}, false, false)
        );
        json_object_update(
            kw_border_shape,
            {
                name: "ka_border_shape",
                x: 0,
                y: 0,
                width: width,
                height: height,
                fill: kw_get_str(self.config, "background_color", null)
            }
        );
        self.private._ka_border_shape = new Konva.Rect(kw_border_shape);
        ka_container.add(self.private._ka_border_shape);

        /*----------------------------*
         *  Control of positions
         *----------------------------*/
        let padding = kw_get_int(self.config, "padding", 0);
        let offset = kw_get_int(self.config, "offset", 0);

        /*----------------------------*
         *  Title
         *----------------------------*/
        let kw_title = __duplicate__(
            kw_get_dict(self.config, "title", {}, false, false)
        );
        let title_width = kw_get_int(kw_title, "width", width) - 2*padding;
        let title_height = kw_get_int(kw_title, "height", height);
        json_object_update(
            kw_title,
            {
                name: "ka_title",
                x: padding,
                y: padding,
                width: title_width,
                height: title_height
            }
        );
        let kw_text_font_properties = kw_get_dict(kw_title, "kw_text_font_properties", {}, true);
        kw_text_font_properties.width = title_width;
        kw_text_font_properties.height = title_height;

        self.private._ka_title = create_shape_label_with_icon(kw_title);
        ka_container.add(self.private._ka_title);

        /*----------------------------*
         *  Ports: input
         *----------------------------*/
        let kw_input = __duplicate__(
            kw_get_dict(self.config, "input", {}, false, false)
        );
        let input_width = kw_get_int(kw_input, "width", width);
        let input_height = kw_get_int(kw_input, "height", height);
        json_object_update(
            kw_input,
            {
                name: "ka_input",
                x: offset,
                y: offset,
                width: input_width,
                height: input_height
            }
        );
        kw_text_font_properties = kw_get_dict(kw_input, "kw_text_font_properties", {}, true);
        kw_text_font_properties.width = input_width;
        kw_text_font_properties.height = input_height;

        self.private._ka_input = create_shape_label_with_icon(kw_input);
        ka_container.add(self.private._ka_input);


        /*----------------------------*
         *  Ports: output
         *----------------------------*/
        // TODO

        /*----------------------------*
         *  Ports: top
         *----------------------------*/
        // TODO

        /*----------------------------*
         *  Ports: bottom
         *----------------------------*/
        // TODO

        /*----------------------------*
         *  Corner Button: top_left
         *----------------------------*/
        // TODO

        /*----------------------------*
         *  Corner Button: top_right
         *----------------------------*/
        // TODO

        /*-------------------------------*
         *  Corner Button: bottom_left
         *-------------------------------*/
        // TODO

        /*--------------------------------*
         *  Corner Button: bottom_right
         *--------------------------------*/
        // TODO

        /*--------------------------------------------*
         *  Scrollview: center
         *--------------------------------------------*/
        // TODO

        /*----------------------------*
         *  Dragg events
         *----------------------------*/
        if (self.config.draggable) {
            ka_container.on('dragstart', function (ev) {
                ev.cancelBubble = true;
                self.config.layer.getStage().container().style.cursor = "move";
                self.gobj_publish_event("EV_MOVING", ka_container.position());
            });
            ka_container.on('dragmove', function (ev) {
                ev.cancelBubble = true;
                self.config.layer.getStage().container().style.cursor = "move";
                self.gobj_publish_event("EV_MOVING", ka_container.position());
            });
            ka_container.on('dragend', function (ev) {
                ka_container.opacity(1);
                ev.cancelBubble = true;
                if (self.config.action) {
                    self.config.layer.getStage().container().style.cursor = "pointer";
                } else {
                    self.config.layer.getStage().container().style.cursor = "default";
                }
                self.gobj_publish_event("EV_MOVED", ka_container.position());
            });
        }

        return ka_container;
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
     *  EV_ADD_PORT {
     *      "ports": [{id:, gclass:, kw: }, ...]
     *      or
     *      "ports": [gobj, ...]
     *  }
     *
     *  You can use "name" instead of "id"
     *
     ********************************************/
    function ac_add_port(self, event, kw, src)
    {
        let ports = kw_get_dict_value(kw, "ports", null, false, false);

        let toolbar_container = self.private._gobj_ka_scrollport.get_konva_container();

        let x=0,y=0,k=null;

        for(let port of ports) {
            let gobj_node = null;
            if(is_gobj(port)) {
                gobj_node = port;
                k = gobj_node.get_konva_container();
            } else if(is_object(port)) {
                let kw_port = kw_get_dict(port, "kw", {});
                json_object_update(kw_port, {
                    subscriber: self.config.subscriber,
                    x: x,
                    y: y
                });
                gobj_node = self.yuno.gobj_create(
                    kw_get_str(port, "id", kw_get_str(port, "name", "")),
                    kw_get_dict_value(port, "gclass", null),
                    kw_port,
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
                continue; // goes recurrent ac_add_port() by mt_child_added()
            } else {
                log_error("What is it?" + port);
                continue;
            }

            self.private._gobj_ka_scrollport.gobj_send_event(
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
     *  EV_REMOVE_PORT {
     *      "ports": ["id", ...]
     *      or
     *      "ports": [{id: "id", }, ...]
     *      or
     *      "ports": [gobj, ...]
     *  }
     ********************************************/
    function ac_remove_port(self, event, kw, src)
    {
        let ports = kw_get_dict_value(kw, "ports", null, false, false);

        for(let port of ports) {
            let childs = null;
            if(is_string(port)) {
                let name = port;
                childs = self.gobj_match_childs({__gobj_name__: name});
            } else if(is_object(port)) {
                let name = kw_get_str(port, "id", kw_get_str(port, "name", ""));
                childs = self.gobj_match_childs({__gobj_name__: name});
            } else if(is_gobj(port)) {
                childs = [port];
            } else {
                log_error("What is?" + port);
                continue;
            }

            for(let child in childs) {
                let k = child.get_konva_container();
                self.private._gobj_ka_scrollport.gobj_send_event(
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
        if(self.config.top_on_activate) {
            self.private._ka_container.moveToTop();
        }

        /*
         *  Only used: stroke, opacity, shadowBlur, shadowColor
         */
        let kw_rect = self.config.kw_border_shape_actived;

        let stroke = kw_get_str(kw_rect,"stroke",null);
        if(!is_null(stroke)) {
            self.private._ka_border_rect.stroke(stroke);
        }

        let opacity = kw_get_real(kw_rect, "opacity", null);
        if(!is_null(opacity)) {
            self.private._ka_border_rect.opacity(opacity);
        }

        let shadowBlur = kw_get_int(kw_rect, "shadowBlur", null);
        if(!is_null(shadowBlur)) {
            self.private._ka_border_rect.shadowBlur(shadowBlur);
        }

        let shadowColor = kw_get_str(kw_rect, "shadowColor", null);
        if(!is_null(shadowColor)) {
            self.private._ka_border_rect.shadowColor(shadowColor);
        }

        return 0;
    }

    /********************************************
     *  Order from __ka_main__
     *  Please be idempotent
     ********************************************/
    function ac_deactivate(self, event, kw, src)
    {
        /*
         *  Only used: stroke, opacity, shadowBlur, shadowColor
         */
        let kw_rect = self.config.kw_border_shape;

        let stroke = kw_get_str(kw_rect,"stroke",null);
        if(!is_null(stroke)) {
            self.private._ka_border_rect.stroke(stroke);
        }

        let opacity = kw_get_real(kw_rect, "opacity", null);
        if(!is_null(opacity)) {
            self.private._ka_border_rect.opacity(opacity);
        }

        let shadowBlur = kw_get_int(kw_rect, "shadowBlur", null);
        if(!is_null(shadowBlur)) {
            self.private._ka_border_rect.shadowBlur(shadowBlur);
        }

        let shadowColor = kw_get_str(kw_rect, "shadowColor", null);
        if(!is_null(shadowColor)) {
            self.private._ka_border_rect.shadowColor(shadowColor);
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
        let name = kw_get_str(kw, "id", kw_get_str(kw, "name", ""));
        if(!empty_string(name)) {
            if(event === "EV_SHOW") {
                let gobj = self.gobj_child_by_name(name);
                if(gobj) {
                    gobj.get_konva_container().moveToTop();
                    __ka_main__.gobj_send_event("EV_ACTIVATE", {}, gobj);
                }
            }
            return 0;
        }

        /*-----------------------------*
         *  Show/Hide self
         *-----------------------------*/
        switch(event) {
            case "EV_TOGGLE":
                if(self.private._ka_container.isVisible()) {
                    self.private._ka_container.hide();
                } else {
                    self.private._ka_container.show();
                }
                break;
            case "EV_SHOW":
                self.private._ka_container.show();
                break;
            case "EV_HIDE":
                self.private._ka_container.hide();
                break;
        }

        if(self.private._ka_container.isVisible()) {
            self.gobj_publish_event("EV_SHOWED", {});

            /*
             *  Window visible
             */
            __ka_main__.gobj_send_event("EV_ACTIVATE", {}, self); // TODO is necessary?

        } else {
            self.gobj_publish_event("EV_HIDDEN", {});

            __ka_main__.gobj_send_event("EV_DEACTIVATE", {}, self); // TODO is necessary?
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

        /*
         *  Move container
         */
        let ka_container = self.private._ka_container;
        ka_container.position({
            x: self.config.x,
            y: self.config.y
        });

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

        /*
         *  Resize container
         */
        let ka_container = self.private._ka_container;
        shape_label_size(ka_container, {
            width: self.config.width,
            height: self.config.height
        });

        return 0;
    }

    /********************************************
     *  Top order
     ********************************************/
    function ac_resize(self, event, kw, src)
    {
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




            /***************************
             *      GClass/Machine
             ***************************/




    let FSM = {
        "event_list": [
            "EV_MOVING: output no_warn_subs",
            "EV_MOVED: output no_warn_subs",
            "EV_KEYDOWN",
            "EV_ADD_PORT",
            "EV_REMOVE_PORT",
            "EV_ACTIVATE",
            "EV_DEACTIVATE",
            "EV_TOGGLE",
            "EV_SHOW",
            "EV_HIDE",
            "EV_POSITION",
            "EV_SIZE",
            "EV_RESIZE",

            "EV_LINK",
            "EV_UNLINK"
        ],
        "state_list": [
            "ST_IDLE"
        ],
        "machine": {
            "ST_IDLE":
            [
                ["EV_KEYDOWN",          ac_keydown,             undefined],
                ["EV_ADD_PORT",         ac_add_port,            undefined],
                ["EV_REMOVE_PORT",      ac_remove_port,         undefined],

                ["EV_ACTIVATE",         ac_activate,            undefined],
                ["EV_DEACTIVATE",       ac_deactivate,          undefined],

                ["EV_TOGGLE",           ac_show_or_hide,        undefined],
                ["EV_SHOW",             ac_show_or_hide,        undefined],
                ["EV_HIDE",             ac_show_or_hide,        undefined],
                ["EV_POSITION",         ac_position,            undefined],
                ["EV_SIZE",             ac_size,                undefined],
                ["EV_RESIZE",           ac_resize,              undefined],

                ["EV_LINK",             ac_link,                undefined],
                ["EV_UNLINK",           ac_unlink,              undefined]
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

        create_shape(self);

        // TODO ??? self.gobj_send_event("EV_ADD_VIEW", {views: self.config.views}, self);
        // if(self.config.visible) {
        //     self.gobj_send_event("EV_SHOW", {}, self);
        // }
    };

    /************************************************
     *      Framework Method destroy
     *      In this point, all childs
     *      and subscriptions are already deleted.
     ************************************************/
    proto.mt_destroy = function()
    {
        let self = this;

        if(self.private._ka_container) {
            self.private._ka_container.destroy();
            self.private._ka_container = null;
        }
        // TODO algo más habrá que destroy() no?
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
     *      Framework Method writing
     ************************************************/
    proto.mt_writing = function(name)
    {
        let self = this;
        // TODO if(name == "disabled" "selected" "unlocked")
        // Simulate events:
        //     "EV_SELECT",
        //     "EV_UNSELECT",
        //     "EV_ENABLE",
        //     "EV_DISABLE",
        //     "EV_LOCK",
        //     "EV_UNLOCK",
    };

    /************************************************
     *      Local Method
     ************************************************/
    proto.get_konva_container = function()
    {
        let self = this;
        return self.private._ka_container;
    };

    //=======================================================================
    //      Expose the class via the global object
    //=======================================================================
    exports.Ne_base = Ne_base;

})(this);
