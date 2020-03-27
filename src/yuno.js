/*********************************************************************************
 *  The Default Yuno
 *
 *  Author: Niyamaka
 *  Email: Niyamaka at yuneta.io
 *  Licence: MIT (http://www.opensource.org/licenses/mit-license)
 *
 *  Last revision:
 *      20 Junio 2014 - Upgraded to yuneta api.
 *                      changes in send_inter_event.
 *
 *      15 Julio 2015 - Upgraded to yuneta 1.0.0.
 *********************************************************************************/

/**************************************************************************
 *        Yuno
 **************************************************************************/
(function (exports) {
    'use strict';

    /************************************************************
     *      Global system of yunos
     ************************************************************/

    /************************************************************
     *      Yuno class.
     ************************************************************/
    var CONFIG = {
        tracing: 0,
        trace_timer: 0,
        trace_inter_event: false,
        trace_creation: false,
        trace_ievent_callback: null
    };
    var FSM = {
        'event_list': [
            'EV_TIMEOUT: top output'
        ],
        'state_list': ['ST_IDLE'],
        'machine': {
            'ST_IDLE':
            [
                ['EV_TIMEOUT', null, 'ST_IDLE']
            ]
        }
    };
    var _gclass_register = {};

    var Yuno = GObj.__makeSubclass__();
    var proto = Yuno.prototype; // Easy access to the prototype
    proto.__init__= function(yuno_name, yuno_role, yuno_version, kw) {
        GObj.prototype.__init__.call(
            this,
            FSM,
            CONFIG,
            yuno_name,
            "Yuno",
            kw,
            0
        );
        this.yuno_name = yuno_name;
        this.yuno_role = yuno_role;
        this.yuno_version = yuno_version;
        this.parent = null;
        this.yuno = this;
        this._inside = 0;
        this._unique_gobjs = {};
        this._service_gobjs = {};

        this.mt_create();   // auto-create
    };

    proto.mt_create = function(kw)
    {
        /**********************************
         *          Start up
         **********************************/
    };

    /************************************************************
     *      Register gclass
     ************************************************************/
    function gobj_register_gclass(gclass, gclass_name)
    {
        if(!gclass || !gclass_name) {
            var msg = "Yuno.gobj_register_gclass(): gclass undefined";
            log_error(msg);
            throw msg;
            return false;
        }
        var gclass_ = _gclass_register[gclass_name];
        if (gclass_) {
            var msg = "Yuno.gobj_register_gclass(): '" +
                gclass_name +
                "' ALREADY REGISTERED";
            log_error(msg);
            throw msg;
            return false;
        }
        _gclass_register[gclass_name] = gclass;
        return true;
    };

    /************************************************************
     *      Find gclass
     ************************************************************/
    function gobj_find_gclass(gclass_name, verbose)
    {
        try {
            var gclass = _gclass_register[gclass_name];
        } catch (e) {
            if(verbose) {
                this.logger("ERROR Yuno.gobj_find_gclass(): '" + gclass_name + "' gclass not found");
            }
            return null;
        }
        return gclass;
    };

    /************************************************************
     *      gobj_create factory.
     ************************************************************/
    proto.gobj_create = function(name, gclass, kw, parent)
    {
        if (!name) {
            /*
             *  To facilite the work with jquery, I generate all gobjs as named gobjs.
             *  If a gobj has no name, generate a unique name with uniqued_id.
             */
            // force all gobj to have a name.
            // useful to make DOM elements with id depending of his gobj.
            name = get_unique_id('gobj');
        }

        if (!(typeof parent === 'string' || parent instanceof GObj)) {
            log_error("Yuno.gobj_create() BAD TYPE of parent: " + parent);
        }

        if (typeof parent === 'string') {
            // find the named gobj
            parent = this.gobj_find_unique_gobj(parent);
            if (!parent) {
                var msg = "Yuno.gobj_create('" + name + "'): " +
                    "WITHOUT registered named PARENT: '" + parent + "'";
                log_warning(msg);
            }
        }

        if (this.config.trace_creation) {
            log_debug("==========> CREATING " + name);
        }

        var gobj = new gclass(name, kw);
        gobj.yuno = this;
        if (name) {
            // All js gobjs are unique-named!
            this._register_unique_gobj(gobj);
        }
        if (parent) {
            parent._add_child(gobj)
        }
        if (gobj.mt_create) {
            gobj.mt_create(kw);
        }
        if (parent && parent.mt_child_added) {
            parent.mt_child_added(gobj);
        }
        if (this.config.trace_creation) {
            var gclass_name = gobj.gclass_name || '';
            log_debug("<========== CREATED  " + gclass_name + ':' + name);
        }
        return gobj;
    };

    /************************************************************
     *      gobj_create factory.
     ************************************************************/
    proto.gobj_create_service = function(name, gclass, kw, parent)
    {
        var gobj = this.gobj_create(name, gclass, kw, parent);
        if(!gobj)
            return undefined;

        this._register_service_gobj(gobj);
        return gobj;
    };

    /************************************************************
     *        Destroy a gobj
     ************************************************************/
    proto.gobj_destroy = function (gobj) {
        var self = this;

        if (this.config.trace_creation) {
            log_debug("<========== DESTROYING " + gobj.name);
        }
        if (gobj._destroyed) {
            // Already deleted
            log_debug("<========== ALREADY DESTROYED! " + gobj.name);
            return;
        }
        if(gobj.gobj_is_running()) {
            gobj.gobj_stop();
        }
        gobj._destroyed = true;

        if (gobj.parent && gobj.parent.mt_child_removed) {
            gobj.parent.mt_child_removed(gobj);
        }
        if (gobj.parent) {
            gobj.parent._remove_child(gobj)
        }
        if (gobj.name) {
            self._deregister_unique_gobj(gobj);
        }

        var dl_childs = gobj.dl_childs.slice();

        for (var i=0; i < dl_childs.length; i++) {
            var child = dl_childs[i];
            if (!child._destroyed) {
                self.gobj_destroy(child);
            }
        }

        gobj.clear_timeout();

        gobj.gobj_unsubscribe_list(gobj.gobj_find_subscriptions(), true);

        if (gobj.mt_destroy) {
            gobj.mt_destroy();
        }
    }

    /************************************************************
     *        register a unique gobj
     ************************************************************/
    proto._register_unique_gobj = function(gobj) {
        var self = this;
        var named_gobj = self._unique_gobjs[gobj.name];
        if (named_gobj) {
            var msg = "Yuno._register_unique_gobj() ALREADY REGISTERED: " + gobj.name;
            log_error(msg);
            throw msg;
            return false;
        }
        self._unique_gobjs[gobj.name] = gobj;
        return true;
    }

    /************************************************************
     *        deregister a unique gobj
     ************************************************************/
    proto._deregister_unique_gobj = function (gobj) {
        var self = this;
        var named_gobj = self._unique_gobjs[gobj.name];
        if (named_gobj) {
            delete self._unique_gobjs[gobj.name];
            return true
        }
        return false
    }

    /************************************************************
     *        register a service gobj
     ************************************************************/
    proto._register_service_gobj = function(gobj) {
        var self = this;
        var named_gobj = self._service_gobjs[gobj.name];
        if (named_gobj) {
            var msg = "Yuno._register_service_gobj() ALREADY REGISTERED: " + gobj.name;
            log_error(msg);
            throw msg;
            return false;
        }
        self._service_gobjs[gobj.name] = gobj;
        return true;
    }

    /************************************************************
     *        deregister a service gobj
     ************************************************************/
    proto._deregister_service_gobj = function (gobj) {
        var self = this;
        var named_gobj = self._service_gobjs[gobj.name];
        if (named_gobj) {
            delete self._service_gobjs[gobj.name];
            return true
        }
        return false
    }

    /************************************************************
     *        find a unique gobj
     ************************************************************/
    proto.gobj_find_unique_gobj = function (gobj_name)
    {
        try {
            var named_gobj = this._unique_gobjs[gobj_name];
        } catch (e) {
            this.logger("ERROR '" + gobj_name + "' named-gobj not found");
            return null;
        }
        return named_gobj;
    }

    /************************************************************
     *        find a service
     ************************************************************/
    proto.gobj_find_service = function (service_name)
    {
        try {
            var service_gobj = this._service_gobjs[service_name];
        } catch (e) {
            this.logger("ERROR '" + service_name + "' service not found");
            return null;
        }
        return service_gobj;
    }

    /************************************************************
     *
     ************************************************************/
    function its_me(gobj, shortname)
    {
        var n = shortname.split("^");
        var gobj_name =null;
        var gclass_name = null;
        if(n.length == 2) {
            gclass_name = n[0];
            gobj_name = n[1];
            if(gclass_name != gobj.gobj_gclass_name()) {
                return false;
            }
        } else if(n.length == 1){
            gobj_name = n[0];
        } else {
            return false;
        }
        if(gobj_name == gobj.gobj_name()) {
            return true;
        }
        return false;
    }

    /************************************************************
     *
     ************************************************************/
    function _gobj_search_path(gobj, path)
    {
        if(!path) {
            return null;
        }
        /*
         *  Get node and compare with this
         */
        var p = path.split("`");
        var shortname = p[0];
        if(!its_me(gobj, shortname)) {
            return null;
        }
        if(p.length==1) {
            // No more nodes
            return gobj;
        }

        /*
         *  Get next node and compare with childs
         */
        var n = p[1];
        var nn = n.split("^");
        var filter = {};
        if(nn.length == 1) {
            filter.__gobj_name__ = nn;
        } else {
            filter.__gclass_name__ = nn[0];
            filter.__gobj_name__ = nn[1];
        }

        /*
         *  Search in childs
         */
        var child = gobj.gobj_find_child(filter);
        if(!child) {
            return null;
        }
        p.splice(0, 1);
        p = p.join("`");
        return _gobj_search_path(child, p);
    }

    /************************************************************
     *        Find a gobj by path
     ************************************************************/
    proto.gobj_find_gobj = function(path)
    {
        return _gobj_search_path(this, path);
    }

    /************************************************************
     *      find the unique gobj with the public event
     ************************************************************/
    proto.gobj_find_public_event_service = function (event)
    {
        for (var gobj_name in this._unique_gobjs) {
            if (!this._unique_gobjs.hasOwnProperty(gobj_name)) {
                //The current property is not a direct property.
                continue;
            }
            var gobj = this._unique_gobjs[gobj_name];
            if(gobj.gobj_event_in_input_event_list(event)) {
                return gobj;
            }
        }
        return null;
    }

    /************************************************************
     *
     ************************************************************/
    proto.gobj_list_gobj_tree = function (gobj)
    {

        function _add_gobj_to_webix_tree(d, o)
        {
            var content = {
                "id": o.gobj_full_name(),
                "value": o.gobj_short_name()
            }
            d.push(content);
            var dl_childs = o.dl_childs;
            if(dl_childs.length>0) {
                var d2 = [];
                content['data'] = d2;

                for (var i=0; i < dl_childs.length; i++) {
                    var child = dl_childs[i];
                    _add_gobj_to_webix_tree(d2, child);
                }
            }
        }

        var data = [];
        _add_gobj_to_webix_tree(data, gobj);
        return data;
    }

    /************************************************************
     *
     ************************************************************/
    proto.gobj_list_gobj_attr = function (gobj)
    {
        var data = [];
        if(!gobj || !gobj.config) {
            return data;
        }
        var id = 1;
        for (var attr in gobj.config) {
            if (gobj.config.hasOwnProperty(attr)) {
                data.push({
                    id: id,
                    name: attr,
                    type: typeof(gobj.config[attr]),
                    description: '',
                    stats: 0,
                    value: gobj.config[attr]
                });
                id++;
            }
        }

        data.push({
            id: id,
            name: '__state__',
            type: 'string',
            description: '',
            stats: 0,
            value: gobj.gobj_current_state()
        });

        return data;
    }

    /************************************************
     *          Expose to the global object
     ************************************************/
    if(typeof __jsyuneta_version__ === 'undefined') {
        var __jsyuneta_version__ = 'debug_version';
    }
    exports.__jsyuneta_version__ = __jsyuneta_version__ ;  // created via Makefile
    exports.Yuno = Yuno;
    exports.gobj_register_gclass = gobj_register_gclass;
    exports.gobj_find_gclass = gobj_find_gclass;

})(this);
