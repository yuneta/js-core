/***********************************************************************
 *          Ne_base.js
 *
 *          Node basic
 *          A node is a gobj publishing their movements that has child gobjs with the role of ports.
 *          A node is a gobj that can be connected with another gobj through their ports.
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
        port_width: 15,
        port_height: 15,
        port_radius: 15,

        title: { // HACK See shape_label_with_icon attributes
            height: 40
        },
        input: {
        },
        output: {
        },
        top: {
        },
        bottom: {
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
        let id = kw_get_str(kw, "id", kw_get_str(kw, "name", ""));

        /*
         *  Check if link exists
         */
        let gobj_link = self.yuno.gobj_find_unique_gobj(id);
        if(gobj_link) {
            log_error(sprintf("%s: link already exists '%s'", self.gobj_short_name(), id));
            return null;
        }

        kw["source_node"] = self; // source node is self

        // 'id' or 'name' can be use as all port names
        kw["source_port"] = kw_get_dict_value(kw, "source_port", id);
        kw["target_port"] = kw_get_dict_value(kw, "target_port", id);

        return self.yuno.gobj_create(id, Ka_link, kw, self.config.gobj_links_root);
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
        let kw_title = kw_get_dict(self.config, "title", {}, false, false);
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
     *
     *  {
     *      input: {
     *          ports: [
     *              {
     *              }
     *          ]
     *      },
     *      output: {
     *          ports: [
     *              {
     *              }
     *          ]
     *      },
     *      top: {
     *          ports: [
     *              {
     *              }
     *          ]
     *      },
     *      bottom: {
     *          ports: [
     *              {
     *              }
     *          ]
     *      }
     *  }
     ********************************************/
    function ac_add_port(self, event, kw, src)
    {
        let width = self.config.width;
        let height = self.config.height;
        let title_height = self.private._ka_title.height();

        /*----------------------------*
         *  Control of positions
         *----------------------------*/
        let padding = kw_get_int(self.config, "padding", 0);
        let offset = kw_get_int(self.config, "offset", 0);

        /*----------------------------*
         *  Ports: input
         *----------------------------*/
        let kw_input = kw_get_dict(kw, "input", {}, false, false);
        let input_ports = kw_get_list(kw_input, "ports", []);
        let input_size = (height - (padding + title_height))/(input_ports.length + 2);
        let input_y = padding + title_height + input_size;

        let input_width = kw_get_int(kw_input, "width", self.config.port_width);
        let input_height = kw_get_int(kw_input, "height", self.config.port_height);
        let input_radius = kw_get_int(kw_input, "radius", self.config.port_radius);
        json_object_update(
            kw_input,
            {
                layer: self.config.layer,
                subscriber: self.config.subscriber,
                x: kw_get_int(kw_input, "x", offset),
                y: input_y,
                width: input_width,
                height: input_height,
                radius: input_radius
            }
        );

        for(let i=0; i<input_ports.length; i++) {
            let kw_port = input_ports[i];
            json_object_update_missing(kw_port, kw_input);
            kw_port.y = input_y;
            self.yuno.gobj_create(
                kw_get_str(kw_port, "id", kw_get_str(kw_port, "name", "")),
                Ka_port,
                kw_port,
                self
            );
            input_y += input_size;
        }

        /*----------------------------*
         *  Ports: output
         *----------------------------*/
        let kw_output = kw_get_dict(kw, "output", {}, false, false);
        let output_ports = kw_get_list(kw_output, "ports", []);
        let output_size = (height - (padding + title_height))/(output_ports.length + 2);
        let output_y = padding + title_height + output_size;

        let output_width = kw_get_int(kw_output, "width", self.config.port_width);
        let output_height = kw_get_int(kw_output, "height", self.config.port_height);
        let output_radius = kw_get_int(kw_output, "radius", self.config.port_radius);
        json_object_update(
            kw_output,
            {
                layer: self.config.layer,
                subscriber: self.config.subscriber,
                x: width - (padding - offset) + kw_get_int(kw_output, "x", 0),
                y: output_y,
                width: output_width,
                height: output_height,
                radius: output_radius
            }
        );

        for(let i=0; i<output_ports.length; i++) {
            let kw_port = output_ports[i];
            json_object_update_missing(kw_port, kw_output);
            kw_port.y = output_y;
            self.yuno.gobj_create(
                kw_get_str(kw_port, "id", kw_get_str(kw_port, "name", "")),
                Ka_port,
                kw_port,
                self
            );
            output_y += output_size;
        }

        /*----------------------------*
         *  Ports: top
         *----------------------------*/
        // TODO

        /*----------------------------*
         *  Ports: bottom
         *----------------------------*/
        // TODO




        return 0;
    }

    /********************************************
     *
     ********************************************/
    function ac_remove_port(self, event, kw, src)
    {
        // TODO
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
     *  target_node:
     *      - string: name of target gobj (unique or service gobj)
     *      - gobj: target gobj, must be an unique gobj.
     *
     *  source_port: Use `id` if source_port is an empty string
     *      - string: name of source port gobj, must be a child of self
     *      - gobj: source port gobj, must be a child of self
     *
     *  target_port: Use `id` if target_port is an empty string
     *      - string: name of target port gobj, must be a child of target_node
     *      - gobj: target port gobj, must be a child of target_node
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
            for(let i=0; i<links.length; i++) {
                let link =  links[i];
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
        let source_node = kw_get_dict_value(kw, "source_node", src);
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

        self.gobj_send_event("EV_ADD_PORT", self.config, self);
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
     *  Framework Method mt_child_added
     ************************************************/
    proto.mt_child_added = function(child)
    {
        let self = this;

        self.private._ka_container.add(child.get_konva_container());
    };

    /************************************************
     *  Framework Method mt_child_added
     ************************************************/
    proto.mt_child_removed = function(child)
    {
        let self = this;
        // TODO remove child container
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
