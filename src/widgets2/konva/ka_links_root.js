/***********************************************************************
 *          Ka_links_root.js
 *
 *          Root of link's gobjs
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

        //------------ Own Attributes ------------//
        visible: true,
        draggable: true,       // Enable (outer dragging) dragging

        fontFamily: "sans-serif", // "OpenSans"
        icon_size: 30,  // Wanted size, but change by checking pixels in browser (_icon_size will be used)
        text_size: 18,  // it's different in mobile with text size larger (_text_size will be used)

        //////////////// Private Attributes /////////////////
        _icon_size: 0,      // Calculated by checking browser
        _text_size: 0,      // Calculated by checking browser

        _ka_container: null
    };




            /***************************
             *      Local Methods
             ***************************/




    /********************************************
     *
     ********************************************/
    function sample_local(self)
    {
    }




            /***************************
             *      Actions
             ***************************/




    /********************************************
     *
     ********************************************/
    function ac_timeout(self, event, kw, src)
    {
        trace_msg("ac_timeout");
        //self.set_timeout(self.config.timeout * 1000);
        return 0;
    }




            /***************************
             *      GClass/Machine
             ***************************/




    let FSM = {
        "event_list": [
            "EV_TIMEOUT"
        ],
        "state_list": [
            "ST_IDLE"
        ],
        "machine": {
            "ST_IDLE":
            [
                ["EV_TIMEOUT",              ac_timeout,             undefined]
            ]
        }
    };

    let Ka_links_root = GObj.__makeSubclass__();
    let proto = Ka_links_root.prototype; // Easy access to the prototype
    proto.__init__= function(name, kw) {
        GObj.prototype.__init__.call(
            this,
            FSM,
            CONFIG,
            name,
            "Ka_links_root",
            kw,
            0
        );
        return this;
    };
    gobj_register_gclass(Ka_links_root, "Ka_links_root");




            /***************************
             *      Framework Methods
             ***************************/




    /************************************************
     *      Framework Method create
     ************************************************/
    proto.mt_create = function(kw)
    {
        let self = this;

        if(!self.config.layer) {
            log_error(sprintf("%s: What layer?", self.gobj_short_name()));
        }

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

        if (self.config.draggable) {
            // TODO edición global de links
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
        // TODO ??? self.private._ka_container.remove(child.get_konva_container());
        // TODO donde se hace el destroy() del konva node
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
    exports.Ka_links_root = Ka_links_root;

})(this);
