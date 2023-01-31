/***********************************************************************
 *          Ka_link.js
 *
 *          Node's Link
 *          Link two gobj's
 *
 *          HACK: GObj's to be linked must support:
 *              - publishing of EV_MOVING/EV_MOVED events
 *              - input event EV_GET_DIMENSION
 *          See ka_button.js example
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

        // source_port/target_port must support EV_MOVING/EV_MOVED/EV_GET_DIMENSION events
        // these gobj/ports can be strings or gobjs
        // gobj of port's is the goal parameter, but you can pass the parent/child pair as string or gobj
        source_port: null,
        target_port: null,
        source_gobj: null,
        target_gobj: null,

        //------------ Own Attributes ------------//
        background_color: "black",

        visible: true,
        draggable: false,   // Enable (outer dragging) dragging

        fontFamily: "sans-serif", // "OpenSans"
        icon_size: 30,  // Wanted size, but change by checking pixels in browser (_icon_size will be used)
        text_size: 18,  // it's different in mobile with text size larger (_text_size will be used)

        kw_border_shape: { /* Border shape */
            strokeWidth: 2,
            stroke: "black",
            shadowBlur: 0,
            shadowColor: "black",
            shadowForStrokeEnabled: false // HTML5 Canvas Optimizing Strokes Performance Tip
        },

        timeout_retry: 5,       // timeout retry, in seconds
        timeout_idle: 5,        // idle timeout, in seconds

        //////////////// Private Attributes /////////////////
        _icon_size: 0,      // Calculated by checking browser
        _text_size: 0,      // Calculated by checking browser

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
    function get_port_gobj(self, parent, port)
    {
        if(is_gobj(port)) {
            return port;
        }
        if(!is_string(port)) {
            log_error(sprintf("ka_link: port must be a string or gobj: '%s'",port));
            return null;
        }
        let gobj = parent;
        if(is_string(parent)) {
            gobj = self.yuno.gobj_find_unique_gobj(parent, false);
            if(!gobj) {
                log_error(sprintf("ka_link: gobj must be a unique gobj: '%s'", parent));
                return null;
            }
        }
        if(!is_gobj(gobj)) {
            log_error("ka_link: parent gobj not found");
            return null;
        }
        let child = gobj.gobj_child_by_name(port);
        if(!child) {
            log_error(sprintf("ka_link: child gobj not found: '%s' -> '%s'", gobj.gobj_name(), port));
            return null;
        }
        return child;
    }

    /********************************************
     *
     ********************************************/
    function getConnectorPoints(type, from, to)
    {
        let to_x, from_x, to_y, from_y;

        switch(type) {
            case "center":
            default:
                from_x = from.absolute_dimension.x + from.absolute_dimension.width/2;
                from_y = from.absolute_dimension.y + from.absolute_dimension.height/2;
                to_x = to.absolute_dimension.x + to.absolute_dimension.width/2;
                to_y = to.absolute_dimension.y + to.absolute_dimension.height/2;
        }

        const dx = to_x - from_x;
        const dy = to_y - from_y;
        let angle = Math.atan2(-dy, dx);

        const radius = 0;

        return [
            from_x + -radius * Math.cos(angle + Math.PI),
            from_y + radius * Math.sin(angle + Math.PI),
            to_x + -radius * Math.cos(angle),
            to_y + radius * Math.sin(angle),
        ];
    }

    /********************************************
     *
     ********************************************/
    function update_link_path(self)
    {
        let target_gobj = self.config.target_gobj;
        let source_gobj = self.config.source_gobj;

        let kw_source_dim = {};
        let kw_target_dim = {};
        source_gobj.gobj_send_event("EV_GET_DIMENSION", kw_source_dim, self);
        target_gobj.gobj_send_event("EV_GET_DIMENSION", kw_target_dim, self);
        const points = getConnectorPoints(
            "center",
            kw_source_dim,
            kw_target_dim
        );
        self.private._ka_border_arrow.points(points);
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
        self.config.layer.add(ka_container);

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
        self.private._ka_border_arrow = new Konva.Arrow(kw_border_shape);
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
    }




            /***************************
             *      Actions
             ***************************/




    /********************************************
     *
     ********************************************/
    function ac_moving(self, event, kw, src)
    {
        update_link_path(self); // Draw the arrow
        return 0;
    }

    /********************************************
     *
     ********************************************/
    function ac_moved(self, event, kw, src)
    {
        update_link_path(self); // Draw the arrow
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

        create_shape(self);

        let source_port = self.private._source_port = get_port_gobj(
            self, self.config.source_gobj, self.config.source_port
        );
        let target_port = self.private._target_port = get_port_gobj(
            self, self.config.target_gobj, self.config.target_port
        );
        if(source_port && target_port) {
            source_port.gobj_subscribe_event("EV_MOVING", {}, self);
            target_port.gobj_subscribe_event("EV_MOVING", {}, self);
            source_port.gobj_subscribe_event("EV_MOVED", {}, self);
            target_port.gobj_subscribe_event("EV_MOVED", {}, self);
            update_link_path(self); // Draw the arrow
        } else {
            log_error("ka_link: source_port or target port not found");
        }
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
