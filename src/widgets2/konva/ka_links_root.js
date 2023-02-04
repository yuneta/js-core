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

        let source_gobj = get_unique_gobj(
            self,
            kw_get_dict_value(kw, "source_gobj", null)
        );

        let source_port_name = kw_get_dict_value(kw, "source_port", id);
        let source_port = get_child_gobj(
            self, source_gobj, source_port_name
        );
        if(!source_port) {
            log_error(sprintf("%s: source_port not found '%s'", self.gobj_short_name(), source_port_name));
            return null;
        }

        let target_gobj = get_unique_gobj(
            self,
            kw_get_dict_value(kw, "target_gobj", null)
        );
        let target_port_name = kw_get_dict_value(kw, "target_port", id);
        let target_port = get_child_gobj(
            self, target_gobj, target_port_name
        );
        if(!target_port) {
            log_error(sprintf("ne_base: target_port not found '%s'", target_port_name));
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
            self
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




            /***************************
             *      Actions
             ***************************/




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
        let source_gobj = kw_get_dict_value(kw, "source_gobj", src);
        // TODO
        return 0;
    }




            /***************************
             *      GClass/Machine
             ***************************/




    let FSM = {
        "event_list": [
            "EV_LINK",
            "EV_UNLINK"
        ],
        "state_list": [
            "ST_IDLE"
        ],
        "machine": {
            "ST_IDLE":
            [
                ["EV_LINK",             ac_link,                undefined],
                ["EV_UNLINK",           ac_unlink,              undefined]
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
        // TODO donde se hace el destroy() del konva item
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
