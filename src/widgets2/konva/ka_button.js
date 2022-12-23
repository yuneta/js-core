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
        id: "",         // unique id (not really). If id is empty id=action if action is a string
        value: "",      // text of item
        icon: "",
        action: null,   // function(item) | string (event to publish when hit item),
        icon_position: "left", /* position of icon combined with text: "top", "bottom", "left", "right" */
        // disabled: false, TODO
        // selected: false, TODO

        x: 0,
        y: 0,
        width: 150,
        height: 40,
        background_color: "#FFF7E0",

        visible: true,
        draggable: false,       // Enable (outer dragging) dragging

        icon_size: 30,  // Wanted size, but change by checking pixels in browser (_icon_size will be used)
        text_size: 18,  // it's different in mobile with text size larger (_text_size will be used)
        autosize: false,    // Change dimension to size of font text

        kw_text_font_properties: {
            // fontSize:    // Override if you don't want it was calculated internally (_text_size)
            // lineHeight:  // Override if you don't want it was calculated internally (_line_height)
            fontFamily: "sans-serif", // "OpenSans"
            fontStyle: "normal",
            padding: 10,
            align: "center",
            verticalAlign: "middle",
            wrap: "char"
        },
        kw_icon_font_properties: {
            // fontSize:    // Override if you don't want it was calculated internally (_icon_size)
            // lineHeight:  // Override if you don't want it was calculated internally (_line_height)
            fontFamily: "yuneta-icons-font",
            fontStyle: "normal",
            padding: 10,
            align: "center",
            verticalAlign: "middle",
            wrap: "char"
        },


        kw_border_shape: { /* Border shape */
            cornerRadius: 10,
            strokeWidth: 2,
            stroke: "#f5c211ff",
            opacity: 1,
            shadowBlur: 0,
            shadowColor: "black",
            shadowForStrokeEnabled: false // HTML5 Canvas Optimizing Strokes Performance Tip
        },

        quick_display: false,       // For debugging, draw quickly

        //////////////// Private Attributes /////////////////
        _icon_size: 0,      // Calculated by checking browser
        _text_size: 0,      // Calculated by checking browser
        _line_height: 1.2,    // Calculated internally

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
            self.private._line_height = 1.4;
        }
        self.private._icon_size = adjust_font_size(self.config.icon_size, self.config.fontFamily);
    }

    /********************************************
     *
     ********************************************/
    function create_shape(self) {
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

        if(self.config.quick_display) {
            if(self.config.layer) {
                self.config.layer.add(ka_container);
                ka_container.draw();
            }
        }

        let label = create_label(self);
        ka_container.add(label);

        if(self.config.autosize) {
            let font_dimension = label.getClientRect();
            self.private._ka_border_rect.size(font_dimension);
            let ka_container_dimension = ka_container.getClientRect();
            self.config.width = ka_container_dimension.width;
            self.config.height = ka_container_dimension.height;
        }

        ka_container.add(label);

        if(self.config.quick_display) {
            if(self.config.layer) {
                self.config.layer.add(ka_container);
                ka_container.draw();
            }
        }

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
                ev.cancelBubble = true;
                if (!empty_string(self.config.event)) {
                    self.config.layer.getStage().container().style.cursor = "pointer";
                } else {
                    self.config.layer.getStage().container().style.cursor = "default";
                }
                self.gobj_publish_event("EV_MOVED", ka_container.position());
            });
        }

        let id = kw_get_str(self.config, "id", null);
        let action = kw_get_dict_value(self.config, "action", null);

        if(is_null(id)) {
            if(is_string(item.action)) {
                self.config.id = action;
            }
        }

        if(is_string(action)) {
            let event = action;
            self.config.action = function(_id) {
                self.gobj_publish_event(event, {"id": _id});
            };
        } else if(action && !is_function(action)) {
            log_error("action must be a string or function");
            return ka_container;
        }

        if (is_function(self.config.action)) {
            ka_container.on("mouseenter", function (e) {
                self.config.layer.getStage().container().style.cursor = "pointer";
            });

            ka_container.on("mouseleave", function (e) {
                self.config.layer.getStage().container().style.cursor = "default";
            });

            ka_container.on("pointerdown", function (e) {
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
            ka_container.on("pointerup", function (e) {
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
                self.config.action(self.config.id);
            });
        }

        return ka_container;
    }

    /********************************************
     *
     ********************************************/
    function create_label(self) {
        let text = self.config.value;
        let icon = self.config.icon;

        let container = new Konva.Group({
        });

        if(!empty_string(text) && !empty_string(icon)) {
            let icon_element, text_element;
            let icon_position = self.config.icon_position;
            switch(icon_position) {
                case "top": {
                    let kw_icon = { // Common fields
                        text: icon,
                        x: 0,
                        y: 0,
                        lineHeight: self.private._line_height,
                        fontSize: self.private._icon_size
                    };
                    json_object_update(kw_icon, self.config.kw_icon_font_properties);
                    icon_element = new Konva.Text(kw_icon);
                    container.add(icon_element);

                    let kw_text = { // Common fields
                        text: text,
                        x: 0,
                        y: icon_element.height() -
                            kw_get_int(self.config.kw_text_font_properties, "padding", 0),
                        lineHeight: icon_element.lineHeight(),
                        fontSize: self.private._text_size
                    };
                    json_object_update(kw_text, self.config.kw_text_font_properties);
                    text_element = new Konva.Text(kw_text);
                    container.add(text_element);

                    let max_width = Math.max(icon_element.width(), text_element.width());
                    icon_element.width(max_width);
                    text_element.width(max_width);
                }
                break;

                case "bottom": {
                    let kw_text = { // Common fields
                        text: text,
                        x: 0,
                        y: 0,
                        lineHeight: self.private._line_height,
                        fontSize: self.private._text_size
                    };
                    json_object_update(kw_text, self.config.kw_text_font_properties);
                    text_element = new Konva.Text(kw_text);
                    container.add(text_element);

                    let kw_icon = { // Common fields
                        text: icon,
                        x: 0,
                        y: text_element.height() -
                            kw_get_int(self.config.kw_text_font_properties, "padding", 0),
                        lineHeight: text_element.lineHeight(),
                        fontSize: self.private._icon_size
                    };
                    json_object_update(kw_icon, self.config.kw_icon_font_properties);
                    icon_element = new Konva.Text(kw_icon);
                    container.add(icon_element);

                    let max_width = Math.max(icon_element.width(), text_element.width());
                    icon_element.width(max_width);
                    text_element.width(max_width);
                }
                break;

                case "left": {
                    let kw_icon = { // Common fields
                        text: icon,
                        x: 0,
                        y: 0,
                        lineHeight: self.private._line_height,
                        fontSize: self.private._icon_size
                    };
                    json_object_update(kw_icon, self.config.kw_icon_font_properties);
                    icon_element = new Konva.Text(kw_icon);
                    container.add(icon_element);

                    let kw_text = { // Common fields
                        text: text,
                        x: icon_element.width() -
                            kw_get_int(self.config.kw_text_font_properties, "padding", 0),
                        y: 0,
                        lineHeight: icon_element._line_height,
                        fontSize: self.private._text_size
                    };
                    json_object_update(kw_text, self.config.kw_text_font_properties);
                    text_element = new Konva.Text(kw_text);
                    container.add(text_element);

                    let max_height = Math.max(icon_element.height(), text_element.height());
                    icon_element.height(max_height);
                    text_element.height(max_height);
                }
                break;

                case "right": {
                    let kw_text = { // Common fields
                        text: text,
                        x: 0,
                        y: 0,
                        lineHeight: self.private._line_height,
                        fontSize: self.private._text_size
                    };
                    json_object_update(kw_text, self.config.kw_text_font_properties);
                    text_element = new Konva.Text(kw_text);
                    container.add(text_element);

                    let kw_icon = { // Common fields
                        text: icon,
                        x: text_element.width() -
                            kw_get_int(self.config.kw_text_font_properties, "padding", 0),
                        y: 0,
                        lineHeight: self.private._line_height,
                        fontSize: self.private._icon_size
                    };
                    json_object_update(kw_icon, self.config.kw_icon_font_properties);
                    icon_element = new Konva.Text(kw_icon);
                    container.add(icon_element);

                    let max_height = Math.max(icon_element.height(), text_element.height());
                    icon_element.height(max_height);
                    text_element.height(max_height);
                }
                break;
            }

        } else if(!empty_string(icon)) {
            let kw_icon = { // Common fields
                text: icon,
                x: 0,
                y: 0,
                width: self.config.width,
                height: self.config.height,
                lineHeight: self.private._line_height,
                fontSize: self.private._icon_size
            };
            json_object_update(kw_icon, self.config.kw_icon_font_properties);
            let icon_element = new Konva.Text(kw_icon);
            container.add(icon_element);

        } else if(!empty_string(text)) {
            let kw_text = { // Common fields
                text: text,
                x: 0,
                y: 0,
                width: self.config.width,
                height: self.config.height,
                lineHeight: self.private._line_height,
                fontSize: self.private._text_size
            };
            json_object_update(kw_text, self.config.kw_text_font_properties);
            let text_element = new Konva.Text(kw_text);
            container.add(text_element);

        }
        return container;
    }




            /***************************
             *      Actions
             ***************************/




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
            gcflag_no_check_output_events
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

        create_shape(self); // WARNING added to layer in mt_child_added of parent
    };

    /************************************************
     *      Framework Method destroy
     *      In this point, all childs
     *      and subscriptions are already deleted.
     ************************************************/
    proto.mt_destroy = function()
    {
        if(self.private._ka_container) {
            self.private._ka_container.destroy();
            self.private._ka_container = null;
        }
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
