/***********************************************************************
 *          Ka_button.js
 *
 *          Button
 *
 *          Copyright (c) 2022 Niyamaka.
 *          All Rights Reserved.
 ***********************************************************************/
(function (exports) {
    'use strict';

    /********************************************
     *      Configuration (C attributes)
     ********************************************/
    let CONFIG = {
        //////////////// Public Attributes //////////////////
        subscriber: null,   // subscriber of publishing messages (Child model: if null will be the parent)
        layer: null,        // Konva layer

        //------------ Own Attributes ------------//
        text: "",
        icon: "",
        fontStyle: "normal",
        align: "center",
        verticalAlign: "middle",
        wrap: "char",

        x: 100,
        y: 100,
        width: 150,
        height: 150,
        padding: 10,
        background_color: "#FFF7E0",

        visible: true,
        draggable: false,       // Enable (outer dragging) dragging

        fontFamily: "sans-serif", // "OpenSans"
        icon_size: 30,  // Wanted size, but change by checking pixels in browser (_icon_size will be used)
        text_size: 18,  // it's different in mobile with text size larger (_text_size will be used)

        kw_border_shape: { /* Border shape */
            strokeWidth: 2,
            stroke: "#f5c211ff",
            cornerRadius: 10,
            shadowBlur: 0,
            shadowColor: "black",
            shadowForStrokeEnabled: false // HTML5 Canvas Optimizing Strokes Performance Tip
        },
        kw_border_shape_actived: {
            stroke: "#1a5fb4ff",
            shadowBlur: 0,
            shadowColor: "#FFB659"
        },

        quick_display: false,   // For debugging, draw quickly

        //////////////// Private Attributes /////////////////
        _icon_size: 0,      // Calculated by checking browser
        _text_size: 0,      // Calculated by checking browser
        _line_height: 1,

        _ka_container: null
    };




                /***************************
                 *      Local Methods
                 ***************************/




    /************************************************
     *
     ************************************************/
    function adjust_text_and_icon_size(self) {
        self.private._text_size = adjust_font_size(self.config.text_size, self.config.fontFamily);
        if (self.config.text_size > self.private._text_size) {
            self.private._line_height = 1.2;
        }
        self.private._icon_size = adjust_font_size(self.config.icon_size, self.config.fontFamily);
    }

    /********************************************
     *
     ********************************************/
    function create_shape(self, kw) {
        let width = self.config.width;
        let height = self.config.height;

        /*
         *  Container (Group)
         */
        let ka_container = self.private._ka_container = new Konva.Group({
            id: self.gobj_short_name(),
            name: "ka_container",
            x: self.config.x,
            y: self.config.y,
            width: self.config.width,
            height: self.config.height,
            visible: self.config.visible,
            draggable: self.config.draggable,
            listening: true
        });
        ka_container.gobj = self; // cross-link

        /*
         *  Border
         */
        let kw_border_shape = __duplicate__(
            kw_get_dict(self.config, "kw_border_shape", {}, false, false)
        );
        json_object_update(
            kw_border_shape,
            {
                name: "ka_border_rect",
                x: 0,
                y: 0,
                width: width,
                height: height,
                fill: kw_get_str(self.config, "background_color", null, false, false)
            }
        );
        self.private._ka_border_rect = new Konva.Rect(kw_border_shape);
        ka_container.add(self.private._ka_border_rect);

        create_label(self,
            ka_container,
            "EV_BUTTON_CLICKED",
            kw
        );

        if (self.config.draggable) {
            ka_container.on('dragstart', function (ev) {
                ev.cancelBubble = true;
                self.gobj_publish_event("EV_MOVING", ka_container.position());
            });
            ka_container.on('dragmove', function (ev) {
                ev.cancelBubble = true;
                document.body.style.cursor = 'pointer';
                self.gobj_publish_event("EV_MOVING", ka_container.position());
            });
            ka_container.on('dragend', function (ev) {
                ev.cancelBubble = true;
                document.body.style.cursor = 'default';
                self.gobj_publish_event("EV_MOVED", ka_container.position());
            });
        }

        return ka_container;
    }

    /********************************************
     *
     ********************************************/
    function create_label(self, ka_parent, event, kw) {
        let kw_element = { // Common fields
            id: event,
            text: kw_get_str(kw, "text", "???"),
            fill: self.config.items_color,
            opacity: 1,
            fontFamily: self.config.fontFamily,
            fontSize: self.private._text_size,
            lineHeight: self.private._line_height,
            width: self.config.width,
            height: self.config.height,
            padding: self.config.padding,

            fontStyle: self.config.fontStyle,
            align: self.config.align,
            verticalAlign: self.config.verticalAlign,
            wrap: self.config.wrap,

            listening: true
        };
        json_object_update(kw_element, kw);

        let element = new Konva.Text(kw_element);

        if (!empty_string(event)) {
            //element.filters([Konva.Filters.RGBA]);

            element.on("mouseenter", function (e) {
                let stage = self.config.layer.getStage();
                stage.container().style.cursor = "pointer";
            });

            element.on("mouseleave", function (e) {
                let stage = self.config.layer.getStage();
                stage.container().style.cursor = "default";
            });

            element.on("pointerdown", function (e) {
                if (self.is_tracing()) {
                    log_warning(sprintf("%s.%s ==> (%s), cancelBubble: %s, gobj: %s, ka_id: %s, ka_name: %s",
                        "nd_machine", "element",
                        e.type,
                        (e.cancelBubble) ? "Y" : "N",
                        self.gobj_short_name(),
                        kw_get_str(e.target.attrs, "id", ""),
                        kw_get_str(e.target.attrs, "name", "")
                    ));
                }
            });
            element.on("pointerup", function (e) {
                e.cancelBubble = false;
                e.gobj = self;
                if (self.is_tracing()) {
                    log_warning(sprintf("%s.%s ==> (%s), cancelBubble: %s, gobj: %s, ka_id: %s, ka_name: %s",
                        "nd_machine", "element",
                        e.type,
                        (e.cancelBubble) ? "Y" : "N",
                        self.gobj_short_name(),
                        kw_get_str(e.target.attrs, "id", ""),
                        kw_get_str(e.target.attrs, "name", "")
                    ));
                }
                /*
                 *  WARNING If action provoke deleting the konva node then the event is not bubbled!
                 *  Don't worry, if the konva node is closed, and the event don't arrive to stage listener,
                 *  the window will send a EV_DEACTIVATE and the window will be deactive,
                 *  so for the activation service will work well.
                 *  BE CAREFUL with service needing bubbling.
                 */
                self.gobj_send_event(event, {element: element}, self);
            });
        }

        ka_parent.add(element);

        return element;
    }




            /***************************
             *      Actions
             ***************************/




    /********************************************
     *  Button clicked
     ********************************************/
    function ac_button_clicked(self, event, kw, src)
    {
        let __ka_main__ = self.yuno.gobj_find_service("__ka_main__", true);

        __ka_main__.gobj_send_event("EV_ACTIVATE", {}, self);

        get_list_realms(self);

        // TODO comandos para recoger información pendientes
        // __yuno__.__remote_service__.gobj_command(
        //     "command-agent",
        //     {
        //         "agent_id": agent_id,
        //         "cmd2agent": "list-realms"
        //     },
        //     self
        // );
        //command=command-agent cmd2agent="command-agent service=__yuno__ gobj=__yuno__ command=view-attrs"
        // info-cpus
        // info-ifs
        // info-os
        //console.dir(kw);
        // TODO
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
        ka_container.size({
            width: self.config.width,
            height: self.config.height
        });

        /*
         *  Resize background rect
         */
        let _ka_border_rect = self.private._ka_border_rect;
        _ka_border_rect.size({
            width: self.config.width,
            height: self.config.height
        });

        return 0;
    }

    /********************************************
     *  Return dimensions (position and size)
     *  kw: {
     *      x:
     *      y:
     *      width:
     *      height:
     *  }
     *
     ********************************************/
    function ac_get_dimension(self, event, kw, src)
    {
        if(!is_object(kw)) {
            log_error(sprintf("%s: get_dimension(): kw not an object, from %s",
                self.gobj_short_name(), src.gobj_short_name()
            ));
            return -1;
        }
        kw["x"] = self.config.x;
        kw["y"] = self.config.y;
        kw["width"] = self.config.width;
        kw["height"] = self.config.height;

        kw["absolute_dimension"] = self.private._ka_border_rect.getClientRect();

        return 0;
    }

    /********************************************
     *
     ********************************************/
    function ac_resize(self, event, kw, src)
    {
        return 0;
    }

    /************************************************
     *
     ************************************************/
    function ac_timeout(self, event, kw, src)
    {
        return 0;
    }




            /***************************
             *      GClass/Machine
             ***************************/




    let FSM = {
        "event_list": [
            "EV_BUTTON_CLICKED",
            "EV_POSITION",
            "EV_SIZE",
            "EV_GET_DIMENSION",
            "EV_MOVING: output no_warn_subs",
            "EV_MOVED: output no_warn_subs",
            "EV_TIMEOUT",
            "EV_RESIZE"
        ],
        "state_list": [
            "ST_IDLE"
        ],
        "machine": {
            "ST_IDLE":
            [
                ["EV_BUTTON_CLICKED",       ac_button_clicked,      undefined],
                ["EV_POSITION",             ac_position,            undefined],
                ["EV_SIZE",                 ac_size,                undefined],
                ["EV_GET_DIMENSION",        ac_get_dimension,       undefined],
                ["EV_TIMEOUT",              ac_timeout,             undefined],
                ["EV_RESIZE",               ac_resize,              undefined]
            ]
        }
    };

    let Ka_button = GObj.__makeSubclass__();
    let proto = Ka_button.prototype; // Easy access to the prototype
    proto.__init__= function(name, kw) {
        GObj.prototype.__init__.call(
            this,
            FSM,
            CONFIG,
            name,
            "Ka_button",
            kw,
            0
        );
        return this;
    };
    gobj_register_gclass(Ka_button, "Ka_button");




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

        adjust_text_and_icon_size(self);

        create_shape(self, kw); // WARNING added to layer in mt_child_added of parent
    };

    /************************************************
     *      Framework Method destroy
     *      In this point, all childs
     *      and subscriptions are already deleted.
     ************************************************/
    proto.mt_destroy = function()
    {
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
    exports.Ka_button = Ka_button;

})(this);
