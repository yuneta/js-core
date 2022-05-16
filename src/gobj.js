/*********************************************************************************
 *  Objects with a simple Finite State Machine.
 *
 *  Author: Niyamaka
 *  Email: Niyamaka at yuneta.io
 *  Licence: MIT (http://www.opensource.org/licenses/mit-license)
 *
 *  Last revision:
 *      20 Junio 2014 - Upgraded to yuneta api.
 *          - changes in send_inter_event.
 *          - removed Event class. The even now is a simple string like C Yuneta.
 *
 *      15 Julio 2015 - Upgraded to yuneta 1.0.0.
 *
 *********************************************************************************/

/**************************************************************************
 *        GObj
 **************************************************************************/
__inside_event_loop__ = 0;

(function(exports) {
    // Place the script in strict mode
    "use strict";

    /************************************************************
     *        Get current "fecha"
     ************************************************************/
    function get_current_datetime() // TODO revisa
    {
        var currentTime = new Date();
        var month = currentTime.getMonth() + 1;
        if (month < 10) {
            month = "0" + month;
        }
        var day = currentTime.getDate();
        if (day < 10) {
            day = "0" + day;
        }
        var year = currentTime.getFullYear();
        var fecha = year + "/" + month + "/" + day;

        var hours = currentTime.getHours();
        if (hours < 10) {
            hours = "0" + hours;
        }
        var minutes = currentTime.getMinutes();
        if (minutes < 10) {
            minutes = "0" + minutes;
        }
        var seconds = currentTime.getSeconds();
        if (seconds < 10) {
            seconds = "0" + seconds;
        }
        var hora = hours + ":" + minutes + ":" + seconds;
        return fecha + " " + hora;
    }

    /************************************************************
     *      GObj class.
     ************************************************************/
    var GObj = Object.__makeSubclass__();
    var proto = GObj.prototype; // Easy access to the prototype

    proto.__init__ = function(fsm_desc, config, name, gclass_name, kw, gcflag) {
        this.name = name || '';
        this.gclass_name = gclass_name || '';
        this.config = __duplicate__(config);
        __update_dict__(this.config, kw || {});
        this.gcflag = gcflag;

        this.user_data = {};
        this.yuno = undefined;
        this.parent = undefined;
        this.dl_subscriptions = [];
        this.dl_childs = [];
        this.tracing = 0;
        this.trace_timer = 0;
        this.running = false;
        this._destroyed = false;
        this.timer_id = -1; // for now, only one timer per fsm, and hardcoded.
        this.timer_event_name = "EV_TIMEOUT";
        this.fsm_create(fsm_desc); // Create this.fsm

        return this;
    };

    /************************************************************
     *
     ************************************************************/
    proto.gobj_start = function()
    {
        if(this.running) {
            log_error("gobj_start() ALREADY RUNNING");
            return -1;
        }
        this.running = true;
        if(this.mt_start) {
            return this.mt_start();
        }
        return 0;
    };

    /************************************************************
     *
     ************************************************************/
    proto.gobj_stop = function()
    {
        if(!this.running) {
            log_error("gobj_stop() NOT RUNNING");
            return -1;
        }
        this.running = false;
        if(this.mt_stop) {
            return this.mt_stop();
        }
        if(this.__volatil__)
        return 0;
    };

    /************************************************************
     *
     ************************************************************/
    proto.gobj_is_running = function()
    {
        return this.running;
    };

    /************************************************************
     *
     ************************************************************/
    proto.gobj_start_tree = function()
    {
        if(!this.running) {
            this.gobj_start();
        }
        var set = this.dl_childs;
        for(var i=0; i<set.length; i++) {
            var child = set[i];
            if(child) {
                child.gobj_start_tree();
            }
        }

        return 0;
    };

    /************************************************************
     *
     ************************************************************/
    proto.gobj_stop_tree = function()
    {
        if(this.running) {
            this.gobj_stop();
        }
        var set = this.dl_childs;
        for(var i=0; i<set.length; i++) {
            var child = set[i];
            if(child) {
                child.gobj_stop_tree();
            }
        }
        return 0;
    };

    /************************************************************
     *        add child.
     ************************************************************/
    proto._add_child = function(gobj) {
        if (gobj.parent) {
            log_error("GObj._add_child(): ALREADY HAS PARENT");
        }
        this.dl_childs.push(gobj);
        gobj.parent = this;
    };

    /************************************************************
     *        remove child
     ************************************************************/
    proto._remove_child = function(gobj) {
        var index = index_in_list(this.dl_childs, gobj);
        if (index >= 0) {
            this.dl_childs.remove(index);
        }
    }

    /************************************************************
     *      Return child in index position
     ************************************************************/
    proto.gobj_child_by_index = function(index) {
        return this.dl_childs[index];
    };

    /************************************************************
     *      Return the size of childs of gobj
     ************************************************************/
    proto.gobj_child_size = function()
    {
        return this.dl_childs.length;
    };

    /************************************************************
     *
     ************************************************************/
    proto.gobj_is_service = function()
    {
        return this.config.__service__;
    };

    /************************************************************
     *  HACK Los servicios se registran como únicos
     ************************************************************/
    proto.gobj_is_unique = function()
    {
        return this.config.__unique__ || this.config.__service__;
    };

    /************************************************************
     *
     ************************************************************/
    proto.gobj_is_volatil = function()
    {
        return this.config.__volatil__;
    };

    /************************************************************
     *
     ************************************************************/
    proto.gobj_load_persistent_attrs = function()
    {
        if(this.gobj_is_service() || this.gobj_is_unique()) {
            if(this.yuno.__global_load_persistent_attrs_fn__) {
                return this.yuno.__global_load_persistent_attrs_fn__(this);
            }
        }
        return -1;
    };

    /************************************************************
     *
     ************************************************************/
    proto.gobj_save_persistent_attrs = function()
    {
        if(this.gobj_is_service() || this.gobj_is_unique()) {
            if(this.yuno.__global_save_persistent_attrs_fn__) {
                return this.yuno.__global_save_persistent_attrs_fn__(this);
            }
        }
        return -1;
    };

    /************************************************************
     *
     ************************************************************/
    proto.gobj_remove_persistent_attrs = function(recursive)
    {
        if(!this.yuno.__global_remove_persistent_attrs_fn__) {
            return -1;
        }
        this.yuno.__global_remove_persistent_attrs_fn__(this, recursive);

        if(recursive)  {
            var set = this.dl_childs;
            for(var i=0; i<set.length; i++) {
                var child = set[i];
                if(child) {
                    child.gobj_remove_persistent_attrs(recursive);
                }
            }
        }

        return 0;
    };

    /************************************************************
     *
     ************************************************************/
    proto.gobj_get_writable_attrs = function()
    {
        // TODO tabla de atributos como en C. De momento una lista aparte
        if(this.config && this.config.__writable_attrs__) {
            return this.config.__writable_attrs__;
        } else {
            return [];
        }
    }

    /************************************************************
     *
     ************************************************************/
    proto.gobj_update_writable_attrs = function(attrs)
    {
        if(this.config && this.config.__writable_attrs__) {
            for(var attr in attrs) {
                if(elm_in_list(attr, this.config.__writable_attrs__)) {
                    var new_value = attrs[attr];
                    this.config[attr] = new_value;
                }
            }
        }
    }

    /************************************************************
     *
     ************************************************************/
    proto.gobj_write_attr = function(key, value)
    {
        // TODO implement inherited attributes
        // TODO if attribute not found then find in bottom gobj
        if(key in this.config) {
            if (this.config.hasOwnProperty(key)) {
                this.config[key] = value;

                if(this.mt_writing) {
                    this.mt_writing(key);
                }
                return 0;
            }
        }
        return -1;
    };

    /************************************************************
     *
     ************************************************************/
    proto.gobj_read_attr = function(key)
    {
        // TODO implement inherited attributes
        // TODO if attribute not found then find in bottom gobj
        if(key in this.config) {
            if(this.config.hasOwnProperty(key)) {
                var value = this.config[key];
                if(this.mt_reading) {
                    return this.mt_reading(key, value);
                }
                return value;
            }
        }
        return null;
    };

    /************************************************************
     *
     ************************************************************/
    proto.gobj_write_user_data = function(key, value)
    {
        this.user_data[key] = value;
    };

    /************************************************************
     *
     ************************************************************/
    proto.gobj_kw_set_user_data = function(path, value)
    {
        return kw_set_dict_value(this.user_data, path, value)
    };

    /************************************************************
     *
     ************************************************************/
    proto.gobj_read_user_data = function(key)
    {
        return this.user_data[key];
    };

    /************************************************************
     *
     ************************************************************/
    proto.gobj_kw_get_user_data = function(path, default_value, create)
    {
        return kw_get_dict_value(this.user_data, path, default_value, create)
    };

    /************************************************************
     *
     ************************************************************/
    proto.gobj_has_attr = function(key)
    {
        if(key in this.config) {
            if (this.config.hasOwnProperty(key)) {
                return true;
            }
        }
        return false;
    };

    /************************************************************
     *  Match child.
     ************************************************************/
    proto._match_child = function(properties)
    {
        var __gclass_name__ = properties.__gclass_name__;
        var __gobj_name__ = properties.__gobj_name__;
        var __prefix_gobj_name__ = properties.__prefix_gobj_name__;
        var __state__ = properties.__state__;

        /*
         *  Check the system keys of the jn_filter used in find loop
         */
        if(__gclass_name__) {
            if(__gclass_name__ != this.gclass_name) {
                return false;
            }
        }
        if(__gobj_name__) {
            if(__gobj_name__ != this.name) {
                return false;
            }
        }
        if(__prefix_gobj_name__) {
            var l = __prefix_gobj_name__.length;
            var name = this.name.substring(0, l);
            if(__prefix_gobj_name__ != name) {
                return false;
            }
        }
        if(__state__) {
            var state = this.gobj_current_state();
            if(__state__ != state) {
                return false;
            }
        }

        for(var key in properties) {
            if(key == "__gclass_name__" ||
                    key == "__gobj_name__" ||
                    key == "__prefix_gobj_name__" ||
                    key == "__state__") {
                continue;
            }
            if(this.gobj_has_attr(key)) {
                if(this.config[key] != properties[key]) {
                    return false;
                }
            }
        }
        return true;
    };

    /************************************************************
     *  Returns the first matched child.
     ************************************************************/
    proto.gobj_find_child = function(kw)
    {
        var set = this.dl_childs;
        for(var i=0; i<set.length; i++) {
            var child = set[i];
            if(child._match_child(kw)) {
                return child;
            }
        }
        return null;
    };

    /************************************************************
     *  Return child's list matched with kw attributes
     ************************************************************/
    proto.gobj_match_childs = function(kw)
    {
        var childs = [];
        var set = this.dl_childs;
        for(var i=0; i<set.length; i++) {
            var child = set[i];
            if(child._match_child(kw)) {
                childs.push(child);
            }
        }
        return childs;
    };

    /************************************************************
     *  Format
     ************************************************************/
    proto.gobj_build_webix_answer = function(
        gobj,
        result,
        comment,
        schema,
        data,
        kw        // to extract ONLY __md_iev__ of source kw.
    ) {
        var webix = {
            "result": result,
            "comment": comment,
            "schema": schema,
            "data": data
        };
        var webix_answer = msg_iev_answer(gobj, kw, webix);
        return webix_answer;
    };

    /************************************************************
     *  Exec gobj command. Return a webixof
     ************************************************************/
    proto.gobj_command = function(command, kw, src) {
        if(this.mt_command) {
            var tracing = this.is_tracing();
            if (tracing) {
                var hora = get_current_datetime();
                var msg = hora + this._tab() + "!> cmd: " +
                    this.gclass_name + ":" + this.name +
                    ", cmd: '" + command + "'";
                if(tracing > 1) {
                    try {
                        var kw_ = JSON.stringify(kw, replacer);
                    } catch (e) {
                        kw_ = kw;
                    }
                    msg += ', kw: ' + kw_;
                } else {
                    msg += ', kw: ' + kw;
                }
                if(src) {
                    msg += ', src: ' + src.gclass_name + '^' + src.name;
                } else {
                    msg += ', src: undefined';
                }
                log_debug(msg);
            }
            return this.mt_command(command, kw, src);
        }
        return this.gobj_build_webix_answer(
            this,
            -1,
            this.gobj_short_name() + " has no mt_command method.",
            null,
            null,
            kw
        );
    };

    /************************************************************
     *  Exec gobj stats. Return a webixof
     ************************************************************/
    proto.gobj_stats = function(stat, kw, src) {
        if(this.mt_stats) {
            return this.mt_stats(stat, kw, src);
        }
        return this.gobj_build_webix_answer(
            this,
            -1,
            this.gobj_short_name() + " has no mt_stats method.",
            null,
            null,
            kw
        );
    };

    /************************************************************
     *        set tracing for this gobj.
     ************************************************************/
    proto.set_machine_trace = function(value)
    {
        this.tracing = value;
    };
    proto.is_tracing = function(event)
    {
        if(event && event == this.timer_event_name &&
                (this.yuno && !this.yuno.config.trace_timer)) {
            return false;
        }
        return this.tracing || (this.yuno && this.yuno.config.tracing);
    };

    /************************************************************
     *        Timeout functions
     ************************************************************/
    proto.set_timeout = function(msec)
    {
        var gobj = this;
        if (this.timer_id !== -1) {
            clearTimeout(this.timer_id);
            this.timer_id = -1;
        }
        if(msec !== -1) {
            this.timer_id = setTimeout(
                function() {
                    gobj.timer_id = -1;
                    gobj.inject_event(gobj.timer_event_name);
                },
                msec
            );
        }
    };
    proto.clear_timeout = function()
    {
        if (this.timer_id !== -1) {
            clearTimeout(this.timer_id);
            this.timer_id = -1;
        }
    };

    /************************************************************
     *      send_event
     ************************************************************/
    proto.gobj_send_event = function(event, kw, src)
    {
        if(!src) {
            // Let events without src, from yuneta outside world.
            //log_error("gobj_send_event('" + event + "') with no src");
        }
        if(!kw) {
            kw = {};
        }
        if(this.mt_inject_event) {
            if(!this.gobj_event_in_input_event_list(event)) {
                var tracing = this.is_tracing();
                if(tracing) {
                    var hora = get_current_datetime();
                    var kw_ = kw;
                    if(tracing > 1) {
                        try {
                            var kw_ = JSON.stringify(kw);
                        } catch (e) {
                            kw_ = kw;
                        }
                    }
                    var msg = hora + '+> mach: ' +
                        this.gclass_name + '^' + this.name +
                        ', ev: ' + event +
                        ', kw: ' + kw_;

                    if(src) {
                        msg += ', src: ' + src.gclass_name + '^' + src.name;
                    } else {
                        msg += ', src: undefined';
                    }
                    log_debug(msg);
                }

                return this.mt_inject_event(event, kw, src);
            }
        }

        return this.inject_event(event, kw, src);
    };

    /************************************************************
     *
     ************************************************************/
    proto.gobj_event_in_input_event_list = function(event)
    {
        var input_events = this.get_input_event_list();

        return elm_in_list(event, input_events);
    };

    /************************************************************
     *  only to childs supporting the event
     ************************************************************/
    proto.gobj_send_event_to_childs = function(event, kw, src)
    {
        var set = this.dl_childs;
        for(var i=0; i<set.length; i++) {
            var child = set[i];
            if(child) {
                if(child.gobj_event_in_input_event_list(event)) {
                    child.gobj_send_event(event, kw, src);
                }
            }
        }
    }

    /************************************************************
     *      _Subscription class.
     ************************************************************/
    function _Subscription(publisher, event, kw, subscriber) {
        this.publisher = publisher;
        this.subscriber = subscriber;
        this.event = event;
        this.renamed_event = null;
        this.hard_subscription = false;
        this.__config__ = null;
        this.__global__ = null;
        this.__filter__ = null;
        this.__service__ = null;

        if(kw) {
            var __global__ = kw["__global__"];
            var __config__ = kw["__config__"];
            var __filter__ = kw["__filter__"];
            var __service__ = kw["__service__"];

            if(__global__) {
                this.__global__ = __duplicate__(__global__);
            }
            if(__config__) {
                this.__config__ = __duplicate__(__config__);
                if(kw_has_key(this.__config__, "__rename_event_name__")) {
                    var renamed_event = kw_get_str(this.__config__, "__rename_event_name__", 0);
                    this.renamed_event = renamed_event;
                    delete this.__config__["__rename_event_name__"];

                    // Get/Create __global__
                    var kw_global = this.__global__;
                    if(!kw_global) {
                        kw_global = {};
                        this.__global__ = kw_global;
                    }
                    kw_global["__original_event_name__"] = event;
                }
                if(kw_has_key(this.__config__, "__hard_subscription__")) {
                    this.hard_subscription = kw_get_bool(this.__config__, "__hard_subscription__", 0);
                    delete this.__config__["__hard_subscription__"];
                }
            }
            if(__filter__) {
                this.__filter__ = __duplicate__(__filter__);
            }
            if(__service__) {
                this.__service__ = __service__;
            }
        }
    };

    /************************************************************
     *  Return a iter of subscriptions (sdata),
     *  filtering by matching:
     *      event,kw (__config__, __global__, __filter__),subscriber
     ************************************************************/
    function _find_subscription(dl_subs, publisher, event, kw, subscriber)
    {
        var sub_list = [];

        var __global__ = null;
        var __config__ = null;
        var __filter__ = null;
        if(kw) {
            var __global__ = kw["__global__"];
            var __config__ = kw["__config__"];
            var __filter__ = kw["__filter__"];
        }

        for(var i=0; i<dl_subs.length; i++) {
            var subs = dl_subs[i];
            var match = true;

            if(subscriber) {
                if(subscriber != subs.subscriber) {
                    match = false;
                }
            }

            if(event) {
                if(event != subs.event) {
                    match = false;
                }
            }

            if(__config__) {
                var kw_config = subs["__config__"];
                if(kw_config) {
                    if(!kw_is_identical(kw_config, __config__)) {
                        match = false;
                    }
                } else {
                    match = false;
                }
            }
            if(__global__) {
                var kw_global = subs["__global__"];
                if(kw_global) {
                    if(!kw_is_identical(kw_global, __global__)) {
                        match = false;
                    }
                } else {
                    match = false;
                }
            }
            if(__filter__) {
                var kw_filter = subs["__filter__"];
                if(kw_filter) {
                    if(!kw_is_identical(kw_filter, __filter__)) {
                        match = false;
                    }
                } else {
                    match = false;
                }
            }

            if(match) {
                sub_list.push(subs);
            }
        }
        return sub_list;
    };

    /************************************************************
     *  Return a iter of subscriptions (sdata),
     *  filtering by matching:
     *      event,kw (__config__, __global__, __filter__),subscriber
     ************************************************************/
    proto.gobj_find_subscriptions = function(event, kw, subscriber)
    {
        return _find_subscription(this.dl_subscriptions, this, event, kw, subscriber);
    };

    /************************************************************
     *  Delete subscription
     ************************************************************/
    proto._delete_subscription = function(subs, force)
    {
        if(subs.hard_subscription) {
            if(!force) {
                return;
            }
        }

        /*-----------------------------*
         *  Trace
         *-----------------------------*/
        // TODO tracea subs

        /*
         *  Avisa de la unsubscription si quieren
         */
        if(this.mt_subscription_deleted) {
            this.mt_subscription_deleted(subs);
        }
        delete_from_list(this.dl_subscriptions, subs);
    };

    /************************************************************
     *      subscribe_event
     *  event can be string or string's list.
     *
     *  Possible values for **kw** arguments:
            __config__,
            __global__,
            __filter__
     *
     ************************************************************/
    proto.gobj_subscribe_event = function(event, kw, subscriber)
    {
        /*
         *  Check subscriber
         */
        if(!subscriber) {
            log_error("GObj.gobj_subscribe_event(): subscriber NULL");
            return;
        }

        /*
         *  Si el subscriber es un string, búsca su object
         */
        if (!(typeof subscriber === 'string' || subscriber instanceof GObj)) {
            log_error("GObj.gobj_subscribe_event(): BAD TYPE subscriber");
        }

        if (typeof subscriber === 'string') {
            var new_subscriber = this.yuno.gobj_find_unique_gobj(subscriber);
            if (!new_subscriber) {
                log_error("GObj.gobj_subscribe_event(): '" + subscriber + "' gobj NOT FOUND");
                return;
            }
            subscriber = new_subscriber;
        } else if(subscriber instanceof GObj) {
        } else {
            log_error("GObj.gobj_subscribe_event(): BAD TYPE subscriber");
            return;
        }

        /*
         *  Comprueba que el evento está declarado en output_event_list,
         *  solo para warning, no cortes el procedimiento.
         */
        var output_events = this.get_output_event_list();
        /*
         *  Event can be null or undefined
         */
        if(event) {
            if (!(typeof event === 'string')) {
                var msg = "GObj.gobj_subscribe_event('" +
                    this.gobj_short_name() +
                    "') from " + subscriber.gobj_short_name() + ": '"
                    + event + "' is not a string";
                log_error(msg);
                return 0;
            }

            if(!(this.gcflag & gcflag_no_check_ouput_events)) {
                if (!elm_in_list(event, output_events)) {
                    var msg = "GObj.gobj_subscribe_event('" +
                        this.gobj_short_name() +
                        "') from " + subscriber.gobj_short_name() + ": '"
                        + event + "' not in output-event list";
                    log_error(msg);
                    return 0;
                }
            }
        }

        /*------------------------------*
         *  Find repeated subscription
         *------------------------------*/
        var dl_subs = this.gobj_find_subscriptions(event, kw, subscriber);
        if(dl_subs.length > 0) {
            return 0;
        }

        /*
         *  Crea una instancia de subscription
         */
        var subscription = new _Subscription(this, event, kw, subscriber);
        this.dl_subscriptions.push(subscription);

        /*-----------------------------*
         *  Trace
         *-----------------------------*/
        // TODO tracea subs

        /*
         *  Avisa de la nueva subscription si quieren
         */
        if(this.mt_subscription_added) {
            this.mt_subscription_added(subscription);
        }

        return subscription;
    };

    /************************************************************
     *  Delete subscription by name and subscriber gobj
     *  event must be the original string or string's list.
     ************************************************************/
    proto.gobj_unsubscribe_event = function(event, kw, subscriber)
    {
        var sub_list = this.gobj_find_subscriptions(event, kw, subscriber);
        if(sub_list.length) {
            for (var i=0; i<sub_list.length; i++) {
                this._delete_subscription(sub_list[i], false)
            }
        } else {
            log_error("GObj.gobj_unsubscribe_event(): sub '" + event + "' NOT FOUND");
            return -1;
        }
        return 0;
    };

    /************************************************************
     *  Delete subscription by hander
     *  (handler returned by subscribe_event()
     ************************************************************/
    proto.gobj_unsubscribe_event2 = function(hsub)
    {
        return this._delete_subscription(hsub, false);
    };

    /************************************************************
     *  Delete subscription list
     *  (handler returned by gobj_find_subscriptions)
     ************************************************************/
    proto.gobj_unsubscribe_list = function(dl_subs, force)
    {
        if(dl_subs.length) {
            for (var i=0; i<dl_subs.length; i++) {
                this._delete_subscription(dl_subs[i], force)
            }
        }
    };

    /************************************************************
     *      publish_event
     ************************************************************/
    proto.gobj_publish_event = function(event, kw)
    {
        var ret_sum = 0;
        var sent_count = 0;

        if(!kw) {
            kw = {};
        }
        if(empty_string(event)) {
            var msg = "GObj.gobj_publish_event('" +
                this.gobj_short_name() +
                "'): '"
                + event + "' event NULL";
            log_error(msg);
            return -1;
        }

        /*
         *  Chequea que el evento existe en la output_event_list
         */
        var output_events = this.get_output_event_list();
        if(!(this.gcflag & gcflag_no_check_ouput_events)) {
            if (!elm_in_list(event, output_events)) {
                var msg = "GObj.gobj_publish_event('" +
                    this.gobj_short_name() +
                    "'): '"
                    + event + "' not in output-event list";
                log_error(msg);
                return -1;
            }
        }

        var tracing = this.is_tracing(event);
        if (tracing) {
            var hora = get_current_datetime();
            var fsm = this.fsm;
            var event_id = fsm.event_index[event] || 0;
            try {
                var msg = hora + this._tab() + '**> mach: ' +
                    this.gclass_name + '^' + this.name +
                    ', st: ' + fsm.state_list[fsm.current_state-1] +
                    ', ev: ' + fsm.event_list[event_id - 1];
                if(tracing > 1) {
                    try {
                        var kw_ = JSON.stringify(kw, replacer);
                    } catch (e) {
                        kw_ = kw;
                    }
                    msg += ', kw: ' + kw_;
                } else {
                    msg += ', kw: ' + kw;
                }

            } catch (e) {
                log_error("tracing: " + e);

                var msg = hora + this._tab() + '-> mach: ' +
                    this.gclass_name + '^' + this.name +
                    ', st: ' + fsm.state_list[fsm.current_state-1] +
                    ', ev: ' + fsm.event_list[event_id - 1] +
                    ', kw: ' + kw;
            }
            log_debug(msg);
        }

        /*---------------------------*
         *  Own publication method
         *---------------------------*/
        if(this.mt_publish_event) {
            var topublish = this.mt_publish_event(event, kw);
            if(!topublish) {
                return 0;
            }
        }

        /*--------------------------------------------------------------*
         *  Default publication method
         *--------------------------------------------------------------*/
        var subscriptions = this.dl_subscriptions;
        var len = subscriptions.length;
        for(var i=0; i<len; i++) {
            var subs = subscriptions[i];
            if(!subs) {
                continue;
            }
            if(this.mt_publication_pre_filter) {
                var topublish = this.mt_publication_pre_filter(subs, event, kw);
                if(!topublish) {
                    continue;
                }
            }
            var subscriber = subs.subscriber;

            /*
             *  Check if event null or event in event_list
             */
            if (subs.event===null ||subs.event===undefined || event === subs.event) {

                var kw2publish = null;
                var __global__ = subs.__global__;
                var __filter__ = subs.__filter__;

                /*
                 *  Check renamed_event
                 */
                var event_name = subs.renamed_event;
                if (empty_string(event_name)) {
                    event_name = event;
                }

                /*
                 *  If kw_global exists then clone and update over it the kw content
                 *  (__extend_dict__): add new keys and overwrite existing keys.
                 */
                if(__global__) {
                    kw2publish = __clone(__global__);
                    __extend_dict__(kw2publish, kw);
                } else {
                    kw2publish = __duplicate__(kw);
                }

                /*
                 *  User filter or configured filter
                 */
                var topublish = true;
                if(this.mt_publication_filter) {
                    topublish = this.mt_publication_filter(
                        this,
                        event,
                        kw2publish,  // not owned
                        subscriber
                    );
                } else if(__filter__) {
                    topublish = kw_match_simple(kw2publish , __filter__);
                }
                if(!topublish) {
                    continue;
                }

                /*
                 *  Send event
                 */
                ret_sum += subscriber.gobj_send_event(
                    event_name,
                    kw2publish,
                    this
                );
                sent_count++;
            }
        }

        if(!sent_count) {
            var event_id = this.fsm.event_index[event] || 0;
            var attrs = this.fsm.event_attrs[event_id-1];
            if(!elm_in_list("no_warn_subs", attrs)) {
                if(!this._destroyed) {
                    log_warning(
                        "Publish event WITHOUT subscribers: " +
                        this.gobj_short_name() + ", " + event
                    );
                }
            }
        }
        return ret_sum;
    };


    /************************************************************
     *      get parent
     ************************************************************/
    proto.gobj_parent = function()
    {
        return this.parent;
    };

    /************************************************************
     *      Get full name
     ************************************************************/
    proto.gobj_full_name = function()
    {
        var self=this;

        var full_name = self.gobj_short_name();
        var parent = self.parent;
        while(parent) {
            var prefix = parent.gobj_short_name();
            full_name = prefix + '`' + full_name;
            parent = parent.parent;
        }
        return full_name;
    };

    /************************************************************
     *      get short name (gclass^name)
     ************************************************************/
    proto.gobj_short_name = function()
    {
        return this.gclass_name + '^' + this.name;
    };

    /************************************************************
     *      get escape short name (gclass-name)
     ************************************************************/
    proto.gobj_escaped_short_name = function()
    {
        return this.gclass_name + '-' + this.name;
    };

    /************************************************************
     *
     ************************************************************/
    proto.gobj_gclass_name = function()
    {
        return this.gclass_name;
    };

    /************************************************************
     *
     ************************************************************/
    proto.gobj_name = function()
    {
        return this.name;
    };


    /************************************************************
     *          Automata create
     ************************************************************/
    proto.fsm_create = function(fsm_desc)
    {
        var self = this.fsm = {};
        self.event_list = fsm_desc.event_list || [];
        self.event_attrs = [];
        self.state_list = fsm_desc.state_list || [];
        self.states = [];
        self.last_state = 0;
        self.current_state = 1;

        // check state names
        var state_names = __duplicate__(self.state_list); // dup list
        for (var st_name in fsm_desc.machine) {
            if (elm_in_list(st_name, state_names)) {
                delete_from_list(state_names, st_name);
            } else {
                log_error(
                    this.gclass_name + ": machine state: " + st_name + " is NOT in state-list"
                );
            }
        }
        if (state_names.length > 0) {
            log_error(this.gclass_name + ": state-list OVERFILLED: " + state_names);
        }

        // remove attributes from event_list and move attrs to _event_attr list
        var event_list = [];
        var event_attrs = [];
        for (var i=0; i<self.event_list.length; i++) {
            var ev = self.event_list[i];
            var name = ev.split(":");
            var ev_name = name[0];
            ev_name = __strip__(ev_name);
            event_list.push(ev_name);

            var ev_attrs = name[1];
            ev_attrs = __strip__(ev_attrs);
            var attrs_list = ev_attrs.split(" "); // TODO
            event_attrs.push(attrs_list);
        }
        self.event_list = event_list;
        self.event_attrs = event_attrs;

        // build _output_events from event attributes
        var output_events = []; //__set__()
        for(var idx=0; idx < self.event_list.length; idx++) {
            var ev_name = self.event_list[idx];
            var attrs = self.event_attrs[idx];
            if (elm_in_list("output", attrs)) {
                output_events.push(ev_name);
            }
        }
        self.output_events = __set__(output_events);

        // check event names
        var event_names = __duplicate__(self.event_list);
        var set_event_names = __duplicate__(self.output_events);  // start with output_events!
        for (var st in fsm_desc.machine) {
            if (fsm_desc.machine.hasOwnProperty(st)) {
                var st_desc = fsm_desc.machine[st];
                var len = st_desc.length;
                for (var idx=0; idx < len; idx++) {
                    var ev_ac_nt = st_desc[idx];
                    if (!ev_ac_nt) {
                        // In IE the last comma in a list [] include a new undefined element.
                        continue;
                    }
                    var ev_name = ev_ac_nt[0];
                    var ac = ev_ac_nt[1];
                    var nt = ev_ac_nt[2];

                    if (elm_in_list(ev_name, event_names)) {
                        set_event_names.push(ev_name);
                    } else {
                        log_error(this.gclass_name + ": event NOT in event-list: " + ev_name);
                    }
                }
              }
        }
        set_event_names = __set__(set_event_names);
        if (event_names.length !== set_event_names.length) {
            log_error(this.gclass_name + ": event-list OVERFILLED: /" + event_names + " /" + set_event_names);
        }

        // check next state names and actions
        state_names = __duplicate__(self.state_list);
        for (var st in fsm_desc.machine) {
            if (fsm_desc.machine.hasOwnProperty(st)) {
                var st_desc = fsm_desc.machine[st];
                var len = st_desc.length;
                for (var idx=0; idx < len; idx++) {
                    var ev_ac_nt = st_desc[idx];
                    if (!ev_ac_nt) {
                        // In IE the last comma in a list [] include a new undefined element.
                        continue;
                    }
                    var ev_name = ev_ac_nt[0];
                    var ac = ev_ac_nt[1];
                    var nt = ev_ac_nt[2];

                    if (nt && !elm_in_list(nt, state_names)) {
                        log_error(this.gclass_name + ": next statename: "+ nt + " is NOT in state-list");
                    }
                    if(ac && typeof ac !== 'function') {
                        log_error(this.gclass_name + ": action: "+ ac + " is NOT a FUNCTION");
                    }
                }
            }
        }

        // Build constant names (like C enum) for states: dict of name:id
        self.state_index = {'': 0};
        for(var i=0; i<self.state_list.length; i++) {
            var elm = self.state_list[i];
            self.state_index[elm] = i+1;
        }

        // Build constant names (like C enum) for events: dict of name:id
        self.event_index = {'': 0};
        for(var i=0; i<self.event_list.length; i++) {
            var elm = self.event_list[i];
            self.event_index[elm] = i+1;
        }

        /*
        #   Build list of states
        #   self._states is organized as:
        #
        #   [0]
        #       [0] [1] [2]... [n.events-1]
        #   [1]
        #       [0] [1] [2]... [n.events-1]
        #   [2]
        #       [0] [1] [2]... [n.events-1]
        #   ...
        #   [n.states-1]
        #       [0] [1] [2]... [n.events-1]
        #            |
        #            `--> [action, next_state]
        #
        #
        #   If a event is defined in a state, then,
        #   the element is a list([action,next_state]) instead of int.
        #
        #   This organization occupies more memory than necessary,
        #   but the execution is faster.
        #
        */

        self.states = new Array(self.state_list.length+1);
        for(var i=0; i<self.state_list.length; i++) {
            var st = self.state_list[i];
            var st_idx = self.state_index[st];
            var st_desc = fsm_desc.machine[st];
            self.states[st_idx] = new Array(self.event_list.length + 1);

            for(var j=0; j<st_desc.length; j++) {
                var ev_ac_nt = st_desc[j];
                if (!ev_ac_nt) {
                    // In IE the last comma in a list [] include a new undefined element.
                    continue;
                }

                var iev = self.event_index[ev_ac_nt[0]];
                // Get the action
                var ac = ev_ac_nt[1];
                // Save the next state
                var next_state_id;
                if (ev_ac_nt[2]) {
                    next_state_id = self.state_index[ev_ac_nt[2]];
                } else {
                    next_state_id = undefined;
                }
                // Save action/next-state
                self.states[st_idx][iev] = [ac, next_state_id];
            }
        }
    };

    /************************************************************
     *        State functions
     ************************************************************/
    proto.gobj_in_this_state = function(state)
    {
        if(this.gobj_current_state() == state) {
            return true;
        }
        return false;
    };

    /************************************************************
     *        public change_state
     ************************************************************/
    proto.gobj_change_state = function(new_state)
    {
        var state_id = this.fsm.state_index[new_state] || 0;
        if (state_id <= 0) {
            log_error(this.gclass_name + ": change_state() state UNKNOWN: " + new_state);
            return;
        }
        this._change_state(state_id);
    };

    /************************************************************
     *        private change_state
     ************************************************************/
    proto._change_state = function(state_id)
    {
        var fsm = this.fsm;

        if (state_id <= 0 || state_id > fsm.state_list.length) {
            log_error(this.gclass_name + ": _change_state() state_id INVALID " + state_id);
        }
        var tracing = this.is_tracing();
        fsm.last_state = fsm.current_state;
        fsm.current_state = state_id;
        if (tracing) {
            if (fsm.last_state !== state_id) {
                var hora = get_current_datetime();
                var msg = hora + this._tab(fsm) + ' - mach: ' + this.gclass_name + ":" + this.name +
                    ', new_st: ' + fsm.state_list[state_id-1];
                log_debug(msg);
            }
        }
    };

    /************************************************************
     *        Return the name of the current state.
     ************************************************************/
    proto.gobj_current_state = function()
    {
        var fsm = this.fsm;
        if (fsm.current_state <= 0 || fsm.state_list.length == 0) {
            return null;
        }
        return fsm.state_list[fsm.current_state - 1];
    }

    /************************************************************
     *        Inject event.
     ************************************************************/
    function replacer(key, value)
    {
        if (value && typeof value === "object") {
            if("__init__" in value) {
                return value.gclass_name + '^' + value.name;
            }
        }
        return value;
    }

    /************************************************************
     *        Inject event.
     ************************************************************/
    proto.inject_event = function(event, kw, src)
    {
        var fsm = this.fsm;
        var result;
        var action;

        if (typeof event !== 'string') {
            log_error("inject_event() invalid event TYPE");
            return -1;  //# EventNotAcceptedError
        }

        var event_id = fsm.event_index[event] || 0;
        if (event_id <= 0) {
            try {
                var kw_ = JSON.stringify(__duplicate__(kw));
            } catch (e) {
                kw_ = kw;
            }

            log_error(
                this.gobj_short_name() +
                " inject_event() event UNKNOWN: "  +
                event +
                " kw:" +
                kw_
            );
            return -1;  //# EventNotAcceptedError
        }

        this._increase_inside();

        if (fsm.states) {
            action = fsm.states[fsm.current_state][event_id];
        }

        var tracing = this.is_tracing(event);

        var hora = null;
        if (tracing) {
            hora = get_current_datetime();
        }

        if (!action) {
            if (!hora) {
                hora = get_current_datetime();
            }

            var msg = hora + this._tab() + '<> mach: ' +
                this.gclass_name + '^' + this.name +
                ', st: ' + fsm.state_list[fsm.current_state-1] +
                ', ev: ' + event + " (REFUSED, no match action)";
            log_warning(msg);
            this._decrease_inside();
            return -1;  //# EventNotAcceptedError
        }

        if (tracing) {
            var action_name = '';
            if (action[0]) {
                action_name = get_function_name(action[0]);
            }
            try {
                var msg = hora + this._tab() + '-> mach: ' +
                    this.gclass_name + '^' + this.name +
                    ', st: ' + fsm.state_list[fsm.current_state-1] +
                    ', ev: ' + fsm.event_list[event_id - 1] +
                    ', ac: ' + action_name;
                if(tracing > 1) {
                    try {
                        var kw_ = JSON.stringify(kw, replacer);
                    } catch (e) {
                        kw_ = kw;
                    }
                    msg += ', kw: ' + kw_;
                } else {
                    msg += ', kw: ' + kw;
                }

                if(src) {
                    msg += ', src: ' + src.gclass_name + '^' + src.name;
                } else {
                    msg += ', src: undefined';
                }

            } catch (e) {
                log_error("tracing: " + e);

                var msg = hora + this._tab() + '-> mach: ' +
                    this.gclass_name + '^' + this.name +
                    ', st: ' + fsm.state_list[fsm.current_state-1] +
                    ', ev: ' + fsm.event_list[event_id - 1] +
                    ', ac: ' + action_name +
                    ', kw: ' + kw;
                if(src) {
                    msg += ', src: ' + src.gclass_name + '^' + src.name;
                } else {
                    msg += ', src: undefined';
                }
            }
            log_debug(msg);
        }

        if (action[1]) {
            this._change_state(action[1]);
        }

        if(tracing) {
            // In develop is better not to catch the interrupt for have more info.
            if (action[0]) {
                //# Action found, execute
                result = action[0](this, event, kw, src);
            }
        } else {
            try {
                if (action[0]) {
                    //# Action found, execute
                    result = action[0](this, event, kw, src);
                }
            } catch (e) {
                log_error(e);
            }
        }

        if (tracing) {
                var msg = hora + this._tab() + '<- mach: ' +
                    this.gclass_name + '^' + this.name +
                    ', st: ' + fsm.state_list[fsm.current_state-1] +
                    ', ret: ' + result;
                log_debug(msg);
            }

        this._decrease_inside();
        return result;
    };

    /************************************************************
     *        get event lists.
     ************************************************************/
    proto.get_input_event_list = function()
    {
        return this.fsm.event_list || [];
    };

    proto.get_output_event_list = function()
    {
        return this.fsm.output_events || [];
    };

    /************************************************************
     *        return current indent.
     ************************************************************/
    proto.current_state = function()
    {
        if (this.fsm.current_state <= 0 || this.fsm.state_list.length === 0) {
            return undefined;
        }
        return this.fsm.state_list[this.fsm.current_state - 1];
    };

    /************************************************************
     *        indentation functions.
     ************************************************************/
    proto._tab = function()
    {
        var spaces, pad;
        if (__inside_event_loop__ <= 0) {
            spaces = 1;
        } else {
            spaces = __inside_event_loop__ * 2;
        }
        pad = '';
        while (spaces--) {
            pad += ' ';
        }
        return pad;
    };

    proto._increase_inside = function()
    {
        __inside_event_loop__ += 1;
    };
    proto._decrease_inside = function()
    {
        __inside_event_loop__ -= 1;
    };

    var gcflag_manual_start = 0x0001;   // gobj_start_tree() don't start gobjs of this gclass.
    var gcflag_no_check_ouput_events = 0x0002;   // When publishing don't check events in output_event_list.


    //=======================================================================
    //      Expose the class via the global object
    //=======================================================================
    exports.GObj = GObj;
    exports.get_current_datetime = get_current_datetime;
    exports.gcflag_manual_start = gcflag_manual_start;
    exports.gcflag_no_check_ouput_events = gcflag_no_check_ouput_events;
})(this);
