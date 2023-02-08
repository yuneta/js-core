/***********************************************************************
 *          Ka_link.js
 *
 *          Node's Link
 *          Link two nodes through their ports
 *
 *          source_node             target_node
 *                  ▼                       ▼
 *              source_port ──────────► target_port
 *
 *          A node must be an unique gobj supporting the events:
 *              - publishing of EV_MOVING/EV_MOVED events
 *              - input event EV_GET_DIMENSION
 *
 *          A node is a gobj publishing their movements that has child gobjs with the role of ports.
 *          A node is a gobj that can be connected with another gobj through their ports.
 *
 *          Based in KonvA
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

        // source_node/target_node must support EV_MOVING/EV_MOVED/EV_GET_DIMENSION events
        // these gobj/ports can be strings or gobjs
        source_node: null,  // unique gobj (or his name) with 'node' role
        source_port: null,  // child gobj of source_node with 'port' role
        target_node: null,  // unique gobj (or his name) with 'node' role
        target_port: null,  // child gobj or target_node with 'port' role

        //------------ Own Attributes ------------//
        shape: "bezier",  /* "bezier", "arrow", "line" */
        connection_point: "center",
        connection_margin: 0,
        background_color: "black",

        visible: true,
        draggable: false,   // Enable (outer dragging) dragging

        fontFamily: "sans-serif", // "OpenSans"
        icon_size: 30,  // Wanted size, but change by checking pixels in browser (_icon_size will be used)
        text_size: 18,  // it's different in mobile with text size larger (_text_size will be used)

        kw_border_shape: { /* Border shape */
            strokeWidth: 4,
            stroke: "#00000070",
            pointerLength: 5,
            pointerWidth: 5,
            pointerAtBeginning: false,
            pointerAtEnding: true,
            shadowBlur: 0,
            shadowColor: "black",
            shadowForStrokeEnabled: false // HTML5 Canvas Optimizing Strokes Performance Tip
        },

        timeout_retry: 5,       // timeout retry, in seconds
        timeout_idle: 5,        // idle timeout, in seconds

        //////////////// Private Attributes /////////////////
        _icon_size: 0,      // Calculated by checking browser
        _text_size: 0,      // Calculated by checking browser
        _source_node: null,
        _source_port: null,
        _target_node: null,
        _target_port: null,

        _ka_container: null
    };




            /***************************
             *      Local Methods
             ***************************/




    /************************************************
     *
     ************************************************/
    function adjust_text_and_icon_size(self)
    {
        self.private._text_size = adjust_font_size(self.config.text_size, self.config.fontFamily);
        self.private._icon_size = adjust_font_size(self.config.icon_size, self.config.fontFamily);
    }

    /********************************************
     *
     ********************************************/
    function get_control_points(from, to)
    {
        let x1 = 0;
        let y1 = 0;
        let x2 = 0;
        let y2 = 0;

        switch(from.position) {
            case "left":
                switch(to.position) {
                    case "left":
                        break;
                    case "right":
                        break;
                    case "top":
                        break;
                    case "bottom":
                        break;
                }
                break;
            case "right":
                switch(to.position) {
                    case "left":
                        x1 = from.x + (to.x - from.x)/3 * 2;
                        y1 = from.y;
                        x2 = from.x + (to.x - from.x)/3;
                        y2 = to.y;
                        break;
                    case "right":
                        break;
                    case "top":
                        break;
                    case "bottom":
                        break;
                }
                break;
            case "top":
                switch(to.position) {
                    case "left":
                        break;
                    case "right":
                        break;
                    case "top":
                        break;
                    case "bottom":
                        break;
                }
                break;
            case "bottom":
                switch(to.position) {
                    case "left":
                        break;
                    case "right":
                        break;
                    case "top":
                        break;
                    case "bottom":
                        break;
                }
                break;
        }

        return {
            x1: x1,
            y1: y1,
            x2: x2,
            y2: y2
        };
    }

    /********************************************
     *
     ********************************************/
    function getConnectorPoints(self, from, to)
    {
        let from_x, from_y, to_x, to_y;

        const radius = self.config.connection_margin;

        switch(self.config.connection_point) {
            case "center":
            default:
                from_x = from.absolute_dimension.x + from.absolute_dimension.width/2;
                from_y = from.absolute_dimension.y + from.absolute_dimension.height/2;
                to_x = to.absolute_dimension.x + to.absolute_dimension.width/2;
                to_y = to.absolute_dimension.y + to.absolute_dimension.height/2;
        }

        switch(self.config.shape) {
            case "bezier": {
                const dx = to_x - from_x;
                const dy = to_y - from_y;
                let angle = Math.atan2(-dy, dx);
                let from_ = {
                    x: from_x + -radius * Math.cos(angle + Math.PI),
                    y: from_y + radius * Math.sin(angle + Math.PI),
                    position: from.position
                };
                let to_ = {
                    x: to_x + -radius * Math.cos(angle),
                    y: to_y + radius * Math.sin(angle),
                    position: to.position
                };

                let control_points = get_control_points(from_, to_);

                return [
                    from_.x,
                    from_.y,
                    control_points.x1,
                    control_points.y1,
                    control_points.x2,
                    control_points.y2,
                    to_.x,
                    to_.y
                ];
            }

            case "arrow":
            case "line":
            default: {
                const dx = to_x - from_x;
                const dy = to_y - from_y;
                let angle = Math.atan2(-dy, dx);

                return [
                    from_x + -radius * Math.cos(angle + Math.PI),
                    from_y + radius * Math.sin(angle + Math.PI),
                    to_x + -radius * Math.cos(angle),
                    to_y + radius * Math.sin(angle)
                ];
            }
        }
    }

    /********************************************
     *
     ********************************************/
    function update_link_path(self)
    {
        self.config.layer.draw(); // TODO TEST quitalo

        let source_port = self.private._source_port;
        let target_port = self.private._target_port;

        let kw_source_dim = {};
        let kw_target_dim = {};
        source_port.gobj_send_event("EV_GET_DIMENSION", kw_source_dim, self);
        target_port.gobj_send_event("EV_GET_DIMENSION", kw_target_dim, self);

        kw_source_dim.position = source_port.config.position;
        kw_target_dim.position = target_port.config.position;

        const points = getConnectorPoints(
            self,
            kw_source_dim,
            kw_target_dim
        );

        self.private._ka_border_arrow.points(points);

        self.config.layer.draw(); // TODO TEST quitalo
    }

    /************************************************
     *
     ************************************************/
    function link_ports(self)
    {
        let name = self.config.source_node;
        self.private._source_node = get_unique_gobj(self, name);
        if(!self.private._source_node) {
            log_error(sprintf("%s: unique source node not found: '%s'",
                self.gobj_short_name(),
                is_gobj(name)?name.gobj_short_name():name
            ));
            return null;
        }

        name = self.config.target_node;
        self.private._target_node = get_unique_gobj(self, name);
        if(!self.private._target_node) {
            log_error(sprintf("%s: unique target node not found: '%s'",
                self.gobj_short_name(),
                is_gobj(name)?name.gobj_short_name():name
            ));
            return null;
        }

        name = self.config.source_port;
        self.private._source_port = get_child_gobj(
            self,
            self.private._source_node,
            name
        );
        if(!self.private._source_port) {
            log_error(sprintf("%s: source port not found: '%s'",
                self.gobj_short_name(),
                is_gobj(name)?name.gobj_short_name():name
            ));
            return null;
        }

        name = self.config.target_port;
        self.private._target_port = get_child_gobj(
            self,
            self.private._target_node,
            name
        );
        if(!self.private._target_port) {
            log_error(sprintf("%s: target port not found: '%s'",
                self.gobj_short_name(),
                is_gobj(name)?name.gobj_short_name():name
            ));
            return null;
        }

        self.private._source_node.gobj_subscribe_event("EV_MOVING", {}, self);
        self.private._source_node.gobj_subscribe_event("EV_MOVED", {}, self);
        self.private._target_node.gobj_subscribe_event("EV_MOVING", {}, self);
        self.private._target_node.gobj_subscribe_event("EV_MOVED", {}, self);

        update_link_path(self); // Update the arrow
    }

    /********************************************
     *  Return the unique gobj, null if error
     ********************************************/
    function get_unique_gobj(self, name)
    {
        let node;

        if (is_string(name)) {
            node = self.yuno.gobj_find_unique_gobj(name);
            if (!node) {
                return null;
            }
        } else if(is_gobj(name)) {
            node = name;
            if(!node.gobj_is_unique(node)) {
                node = null;
            }
        } else {
            node = null;
        }

        return node;
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
                return null;
            }
        } else if (is_gobj(name)) {
            child_gobj = name;
            if(!gobj_parent.gobj_child_by_name(child_gobj.gobj_name())) {
                child_gobj = null;
            }
        } else {
            child_gobj = null;
        }

        return child_gobj;
    }
    /********************************************
     *
     ********************************************/
    function create_shape(self)
    {
        /*
         *  Container (Group)
         */
        let ka_container = self.private._ka_container = new Konva.Group({
            id: self.gobj_short_name(),
            name: "ka_container",
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
                name: "ka_border_arrow",
                fill: kw_get_str(self.config, "background_color", null, false, false)
            }
        );
        switch(self.config.shape) {
            case "bezier":
                json_object_update(
                    kw_border_shape,
                    {
                        bezier: true
                    }
                );
                self.private._ka_border_arrow = new Konva.Line(kw_border_shape);
                break;

            case "line":
                self.private._ka_border_arrow = new Konva.Line(kw_border_shape);
                break;

            case "arrow":
            default:
                self.private._ka_border_arrow = new Konva.Arrow(kw_border_shape);
                break;
        }
        ka_container.add(self.private._ka_border_arrow);

        if (self.config.draggable) {
            // TODO cuando editar los link desde el grafo hay que entrar por aquí
            // ka_container.on('dragstart', function (ev) {
            //     ev.cancelBubble = true;
            //     self.gobj_publish_event("EV_MOVING", ka_container.position());
            // });
            // ka_container.on('dragmove', function (ev) {
            //     ev.cancelBubble = true;
            //     document.body.style.cursor = 'pointer';
            //     self.gobj_publish_event("EV_MOVING", ka_container.position());
            // });
            // ka_container.on('dragend', function (ev) {
            //     ev.cancelBubble = true;
            //     document.body.style.cursor = 'default';
            //     self.gobj_publish_event("EV_MOVED", ka_container.position());
            // });
        }
self.config.layer.draw(); // TODO TEST quitalo
    }




            /***************************
             *      Actions
             ***************************/




    /********************************************
     *
     ********************************************/
    function ac_moving(self, event, kw, src)
    {
        update_link_path(self); // Update the arrow
        return 0;
    }

    /********************************************
     *
     ********************************************/
    function ac_moved(self, event, kw, src)
    {
        update_link_path(self); // Update the arrow
        return 0;
    }




            /***************************
             *      GClass/Machine
             ***************************/




    let FSM = {
        "event_list": [
            "EV_MOVING",
            "EV_MOVED"
        ],
        "state_list": [
            "ST_IDLE"
        ],
        "machine": {
            "ST_IDLE":
            [
                ["EV_MOVING",               ac_moving,              undefined],
                ["EV_MOVED",                ac_moved,               undefined]
            ]
        }
    };

    let Ka_link = GObj.__makeSubclass__();
    let proto = Ka_link.prototype; // Easy access to the prototype
    proto.__init__= function(name, kw) {
        GObj.prototype.__init__.call(
            this,
            FSM,
            CONFIG,
            name,
            "Ka_link",
            kw,
            0
        );
        return this;
    };
    gobj_register_gclass(Ka_link, "Ka_link");




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
self.config.layer.draw(); // TODO TEST quitalo
        create_shape(self);
self.config.layer.draw(); // TODO TEST quitalo
        link_ports(self);
self.config.layer.draw(); // TODO TEST quitalo
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
    };

    /************************************************
     *      Framework Method start
     ************************************************/
    proto.mt_start = function(kw)
    {
        let self = this;
        // self.set_timeout(1*1000);
    };

    /************************************************
     *      Framework Method stop
     ************************************************/
    proto.mt_stop = function(kw)
    {
        let self = this;
        // self.clear_timeout();
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
    exports.Ka_link = Ka_link;

})(this);
