/*********************************************************************************
 *        Auxiliary functions
 *  Ni puta idea de javascript.
 *  La parte para simular clases es copiado. Casi acierto a la primera oye.
 *  Lo siento, solo quería crear una clase, pero ha salido esta cosa.
 *  Con poder programar con mis gobjs tengo suficiente.
 *
 *  Last revision:
 *      20 Junio 2014 - Upgraded to yuneta api. Nothing to do.
 *      15 Julio 2015 - Upgraded to yuneta 1.0.0.
 *
 *********************************************************************************/

/**************************************************************************
 *        Utils
 **************************************************************************/
(function (exports) {
    'use strict';

    Function.prototype.__makeSubclass__ = function() {
        'use strict';

        function Class() {
            if (!(this instanceof Class)) {
                  throw('Constructor called without "new"');
            }
            if ('__init__' in this) {
                this.__init__.apply(this, arguments);
            }
        }
        Function.prototype.__makeSubclass__.nonconstructor.prototype= this.prototype;
        Class.prototype= new Function.prototype.__makeSubclass__.nonconstructor();
        return Class;
    };
    Function.prototype.__makeSubclass__.nonconstructor= function() {};

    /*
     *  Clona arrays y objects, remains return the same.
     */
    function __clone__(obj) {
        'use strict';

        var copy;

        // Handle the 3 simple types, and null or undefined
        if (null == obj || "object" != typeof obj) return obj;

        // Handle Date
        if (obj instanceof Date) {
            copy = new Date();
            copy.setTime(obj.getTime());
            return copy;
        }

        // Handle Array
        if (obj instanceof Array) {
            copy = [];
            for (var i = 0, len = obj.length; i < len; i++) {
                copy[i] = __clone__(obj[i]);
            }
            return copy;
        }

        // Handle Object
        if (obj instanceof Object) {
            copy = {};
            for (var attr in obj) {
                if (obj.hasOwnProperty(attr)) copy[attr] = __clone__(obj[attr]);
            }
            return copy;
        }

        throw new Error("Unable to copy obj! Its type isn't supported.");
    }

    /* Update a dict with another dict: ONLY existing items!! (NOT recursive) */
    function __update_dict__(destination, source) {
        'use strict';
        for (var property in source) {
            if (source.hasOwnProperty(property) && destination.hasOwnProperty(property)) {
                destination[property] = source[property];
            }
        }
        return destination;
    }
    /*
     *  Extend a dict with another dict (NOT recursive),
     *  adding new keys and overwriting existing keys.
     */
    function __extend_dict__(destination, source) {
        'use strict';
        for (var property in source) {
            if (source.hasOwnProperty(property)) {
                destination[property] = source[property];
            }
        }
        return destination;
    }


    /**
     * Finds the index of the element in the array.
     *
     * @param {Function} elm Element to look for.
     * @param {Function[]} list Array to search through.
     * @return {Number} Index of the specified elm, -1 if not found
     */
    function index_of_list(elm, list) {
        'use strict';
        // Existence of a native index
        var nativeIndexOf = list.indexOf? true : false;

        // Return the index via the native method if possible
        if(nativeIndexOf) {
            return list.indexOf(elm);
        }

        // There is no native method
        // Use a manual loop to find the index
        var i = list.length;
        while(i--) {
            // If the elm matches, return it's index
            if(list[i] === elm) {
                return i;
            }
        }

        // Default to returning -1
        return -1;
    }

    function elm_in_list(elm, list) {
        'use strict';
        if(!list) {
            throw "ERROR: elm_in_list() list empty";
        }
        for(var i=0; i<list.length; i++) {
            if(elm === list[i]) {
                return true;
            }
        }
        return false;
    }

    function index_in_list(list, elm) {
        'use strict';
        if(!list) {
            throw "ERROR: index_in_list() list empty";
        }
        for(var i=0; i<list.length; i++) {
            if(elm === list[i]) {
                return i;
            }
        }
        return -1;
    }

    function id_index_in_obj_list(list, id) {
        'use strict';
        if(!list) {
            return -1;
        }
        for(var i=0; i<list.length; i++) {
            if(list[i] && list[i].id === id) {
                return i;
            }
        }
        return -1;
    }

    function get_object_from_list(list, id) {
        'use strict';

        if(!list) {
            return null;
        }
        for(var i=0; i<list.length; i++) {
            if(list[i] && list[i].id == id) {
                return list[i];
            }
        }
        return null;
    }

    function none_in_list(list) {
        'use strict';
        for(var i=0; i<list.length; i++) {
            if(!list[i]) {
                return true;
            }
        }
        return false;
    }

    function delete_from_list(list, elm) {
        'use strict';
        for(var i=0; i<list.length; i++) {
            if(elm === list[i]) {
                list.splice(i, 1);
                return true;
            }
        }
        return false; // elm doesn't exist!
    }

    function same_list(arrA, arrB) {
        'use strict';
        //check if lengths are different
        if(arrA.length !== arrB.length) {
            return false;
        }

        //slice so we do not effect the orginal
        //sort makes sure they are in order
        var cA = arrA.slice().sort();
        var cB = arrB.slice().sort();

        for(var i=0;i<cA.length; i++) {
            if(cA[i]!==cB[i]) {
                return false;
            }
        }
        return true;
    }

    function __strip__(s){
        'use strict';
        return ( s || '' ).replace( /^\s+|\s+$/g, '' );
    }

    function __set__(arr) {
        'use strict';
        var seen = {},
            result = [];
        var len = arr.length;
        for (var i = 0; i < len; i++) {
            var el = arr[i];
            if (!seen[el]) {
                seen[el] = true;
                result.push(el);
            }
        }
        return result;
    }

    function get_function_name(func) {
        'use strict';
        var fName = null;
        if (typeof func === "function" || typeof func === "object") {
            fName = ("" + func).match(/function\s*([\w\$]*)\s*\(/);
        }
        if (fName !== null) {
            return fName[1] + '()';
        }
        return '';
    }

    /************************************************************
     *      Array Remove - By John Resig (MIT Licensed)
     *      Same as utils.delete_from_list() ?
     ************************************************************/
    Array.prototype.remove = function(from, to) {
      var rest = this.slice((to || from) + 1 || this.length);
      this.length = from < 0 ? this.length + from : from;
      return this.push.apply(this, rest);
    };

    /************************************************************
     *      String repeat
     *      http://stackoverflow.com/questions/202605/repeat-string-javascript
     ************************************************************/
    String.prototype.repeat = function(count) {
        if (count < 1) return '';
        var result = '', pattern = this.valueOf();
        while (count > 1) {
            if (count & 1) result += pattern;
            count >>= 1, pattern += pattern;
        }
        result += pattern;
        return result;
    };

    /************************************************************
     *      Like C functions
     ************************************************************/
    function strncmp (str1, str2, lgth)
    {
        // Binary safe string comparison
        //
        // version: 909.322
        // discuss at: http://phpjs.org/functions/strncmp
        // +      original by: Waldo Malqui Silva
        // +         input by: Steve Hilder
        // +      improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
        // +       revised by: gorthaur
        // + reimplemented by: Brett Zamir (http://brett-zamir.me)
        // *     example 1: strncmp('aaa', 'aab', 2);
        // *     returns 1: 0
        // *     example 2: strncmp('aaa', 'aab', 3 );
        // *     returns 2: -1
        var s1 = (str1+'').substr(0, lgth);
        var s2 = (str2+'').substr(0, lgth);

        return ( ( s1 == s2 ) ? 0 : ( ( s1 > s2 ) ? 1 : -1 ) );
    }


    // Return if a value is an object
    function is_object(a)
    {
        return (!!a) && (a.constructor === Object);
    }

    // Return if a value is an array
    function is_array(a)
    {
        return (!!a) && (a.constructor === Array);
    }

    // Return if a value is a string
    function is_string(value)
    {
        return typeof value === 'string' || value instanceof String;
    }

    // Return if a value is really a number
    function is_number(value) {
        return typeof value === 'number' && isFinite(value);
    }

    function empty_string(s)
    {
        'use strict';
        if(!s || typeof(s) !== 'string') {
            return true;
        }

        if(s.length == 0) {
            return true;
        }
        return false;
    }

    function match_dict_list_by_kw(set, __filter__)
    {
        if(!__filter__) {
            return [];
        }
        return set.filter(function (entry) {
            return Object.keys(__filter__).every(function (key) {
                if(!entry.hasOwnProperty(key)) {
                    return false;
                }
                return entry[key] === __filter__[key];
            });
        });
    }

    function kw_is_identical(kw1, kw2)
    {
        var kw1_ = JSON.stringify(kw1);
        var kw2_ = JSON.stringify(kw2);
        return (kw1_ == kw2_)? true: false;
    }

    // TODO cambia kw_simple_match()
    function kw_match(kw, __filter__)
    {
        if(!__filter__ || !kw) {
         // Si no hay filtro pasan todos.
           return true;
        }
        for (var key in __filter__) {
            if (!kw.hasOwnProperty(key)) {
                return false; // si el filtro no exite en kw, fuera
            }
            if(kw[key] != __filter__[key]) {
                return false;
            }
        }
        return true;
    }

    /*
     *  From a list of objects (dict_list),
     *  get a new list with the same objects with only attributes in keylist
     */
    function filter_dict(dict, keylist)
    {
        var new_dict = {};
        for(var j=0; j<keylist.length; j++) {
            var key = keylist[j];
            if(dict.hasOwnProperty(key)) {
                new_dict[key] = dict[key];
            }
        }
        return new_dict;
    }

    /*
     *  From a list of objects (dict_list),
     *  get a new list with the same objects with only attributes in keylist
     */
    function filter_dictlist(dict_list, keylist)
    {
        var new_dictlist = [];
        for(var i=0; i<dict_list.length; i++) {
            var new_dict = filter_dict(dict_list[i], keylist)
            new_dictlist.push(new_dict);
        }
        return new_dictlist;
    }

    /*
     *  From a list of objects (dict_list),
     *  get a new list with the value of the `key` attribute
     */
    function filter_list(dict_list, key)
    {
        var new_list = [];
        for(var i=0; i<dict_list.length; i++) {
            var dict = dict_list[i];
            if(dict.hasOwnProperty(key)) {
                new_list.push(dict[key]);
            }
        }
        return new_list;
    }

    /************************************************************
     *  DEPRECATED change by kw_get_subdict_value
     ************************************************************/
    function msg_read_MIA_key(kw, key, create, default_value) // TODO create, default_value
    {
        try {
            var __md_iev__ = kw["__md_iev__"];
            if(__md_iev__) {
                return __md_iev__[key];
            }
        } catch (e) {
            return undefined;
        }
        return undefined;
    }

    /************************************************************
     *  DEPRECATED change by kw_set_subdict_value
     ************************************************************/
    function msg_write_MIA_key(kw, key, value)
    {
        var __md_iev__ = kw["__md_iev__"];
        if(!__md_iev__) {
            __md_iev__ = {};
            kw["__md_iev__"] = __md_iev__;
        }
        __md_iev__[key] = value;
    }

    /************************************************************
     *
     ************************************************************/
    function msg_delete_MIA_key(kw, key)
    {
        var __md_iev__ = kw["__md_iev__"];
        if(!__md_iev__) {
            // log error?
            return;
        }
        if(!kw_has_key(__md_iev__, key)) {
            // log error?
            return;
        }
        delete __md_iev__[key];
    }

    /************************************************************
     *
     ************************************************************/
    function msg_delete_MIA(kw, key)
    {
        var __md_iev__ = kw["__md_iev__"];
        if(!__md_iev__) {
            // log error?
            return;
        }
        delete kw["__md_iev__"];
    }

    /************************************************************
     *  Apply answer filters
     ************************************************************/
    var message_area_filters = [];
    function msg_iev_add_answer_filter(gobj, field_name, answer_filter_cb)
    {
        var len = message_area_filters.length;
        for(var i=0; i<len; i++) {
            var name = message_area_filters[i].field_name;
            if(name == field_name) {
                return 0; // already registered
            }
        }
        var filter = {
            field_name: field_name,
            answer_filter_fn: answer_filter_cb,
            gobj: gobj
        }
        message_area_filters.push(filter);
    }

    /************************************************************
     *  Apply answer filters
     ************************************************************/
    function msg_apply_answer_filters(kw_answer, __md_iev__, src)
    {
        var len = message_area_filters.length;
        for(var i=0; i<len; i++) {
            var name = message_area_filters[i].field_name;
            var cb = message_area_filters[i].answer_filter_fn;
            var gobj = message_area_filters[i].gobj;
            if(kw_has_key(__md_iev__, name)) {
                /*
                 *  Filter
                 */
                var value = kw_get_dict_value(__md_iev__, name, 0);
                (cb)(gobj, kw_answer, name, value, src);
            }
        }
    }

    /************************************************************
     *  Build the answer message
     *  with the id area of the request message
     ************************************************************/
    function msg_iev_answer(gobj, kw, kw_answer)
    {
        try {
            var __md_iev__ = kw["__md_iev__"];
            if(__md_iev__) {
                var new_msg_area = Object(__md_iev__); // WARNING new_msg_area is not a clone, is the same obj
                kw_answer["__md_iev__"] = new_msg_area;
                msg_apply_answer_filters(kw_answer, new_msg_area, gobj);
            }
        } catch (e) {
        }

        return kw_answer;
    }

    /************************************************************
     *
     ************************************************************/
    function msg_iev_push_stack(kw, stack, user_info)
    {
        if(!kw) {
            return;
        }

        var jn_stack = msg_read_MIA_key(kw, stack);
        if(!jn_stack) {
            jn_stack = [];
            msg_write_MIA_key(kw, stack, jn_stack);
        }
        jn_stack.unshift(user_info);
    }

    /************************************************************
     *
     ************************************************************/
    function msg_iev_get_stack(kw, stack)
    {
        if(!kw) {
            return null;
        }

        var jn_stack = msg_read_MIA_key(kw, stack);
        if(!jn_stack) {
            return 0;
        }

        if(jn_stack.length == 0) {
            return null;
        }
        return jn_stack[0];
    }

    /************************************************************
     *
     ************************************************************/
    function msg_iev_pop_stack(kw, stack)
    {
        if(!kw) {
            return null;
        }

        var jn_stack = msg_read_MIA_key(kw, stack);
        if(!jn_stack) {
            return 0;
        }

        if(jn_stack.length == 0) {
            return null;
        }
        var user_info = jn_stack.shift();
        if(jn_stack.length == 0) {
            msg_delete_MIA_key(kw, stack);
        }
        return user_info;
    }

    /************************************************************
     *
     ************************************************************/
    var msg_type_list = [
        "__order__",
        "__request__",
        "__answer__",
        "__publishing__",
        "__subscribing__",
        "__unsubscribing__"
    ];

    function msg_set_msg_type(kw, msg_type)
    {
        if(!elm_in_list(msg_type, msg_type_list)) {
            return;
        }
        msg_write_MIA_key(kw, '__msg_type__', msg_type)
    }

    /************************************************************
     *
     ************************************************************/
    function msg_get_msg_type(kw)
    {
        return msg_read_MIA_key(kw, '__msg_type__')
    }

    /************************************************************
     *
     ************************************************************/
    function kw_has_key(kw, key)
    {
        if(key in kw) {
            if (kw.hasOwnProperty(key)) {
                return true;
            }
        }
        return false;
    }

    /************************************************************
     *
     ************************************************************/
    function kw_get_bool(kw, key, default_value, create)
    {
        if(!(kw === Object(kw))) {
            return default_value?true:false;
        }
        var b = kw[key];
        if(b == undefined) {
            if(create) {
                kw[key] = default_value?true:false;
            }
            return default_value?true:false;
        }
        return b?true:false;
    }

    /************************************************************
     *
     ************************************************************/
    function kw_get_int(kw, key, default_value, create)
    {
        if(!(kw === Object(kw))) {
            return parseInt(default_value);
        }
        var i = kw[key];
        if(i == undefined) {
            if(create) {
                kw[key] = parseInt(default_value);
            }
            return parseInt(default_value);
        }
        return parseInt(i);
    }

    /************************************************************
     *
     ************************************************************/
    function kw_get_str(kw, key, default_value, create)
    {
        if(!(kw === Object(kw))) {
            return default_value.toString();
        }
        var str = kw[key];
        if(str == undefined) {
            if(create) {
                kw[key] = default_value.toString();
            }
            return default_value.toString();
        }
        return str.toString();
    }

    /************************************************************
     *
     ************************************************************/
    function kw_get_dict_value(kw, key, default_value, create)
    {
        if(!(kw === Object(kw))) {
            return default_value;
        }
        var v = kw[key];
        if(v == undefined) {
            if(create) {
                kw[key] = default_value;
            }
            return default_value;
        }
        return v;
    }

    /************************************************************
     *  TODO implement path,
     *  and change key by path in all kw_get_...() functions
     ************************************************************/
    function kw_set_dict_value(kw, path, value)
    {
        if(!(kw === Object(kw))) {
            return -1;
        }
        var v = kw[key];
        if(v == undefined) {
            kw[key] = value;
        }
        return 0;
    }

    /************************************************************
     *
     ************************************************************/
    var unique_id = 0;

    function get_unique_id(prefix)
    {
        if(!prefix) {
            prefix = 'random-id-';
        }
        ++unique_id;
        return prefix + unique_id;
    }

    /************************************************************
     *          log function
     ************************************************************/
    function trace_msg(msg)
    {
        exports._logger(msg);
    }

    /************************************************************
     *          low level log function
     ************************************************************/
    function _logger(msg)
    {
        console.log(msg);
    }

    /************************************************************
     *          Load json file from server
     ************************************************************/
    function load_json_file(url, on_success, on_error)
    {
        var req = new XMLHttpRequest();
        req.open('GET', url, true);
        req.setRequestHeader('Accept', 'application/json');

        req.onreadystatechange = function () {
            if (req.readyState == 4) {
                if (req.status == 200 || fileLoaded(req)) {
                    var json = JSON.parse(req.responseText);
                    on_success(json);
                } else {
                    if(on_error) {
                        on_error(req.status);
                    }
                }
            }
        };

        req.send();
    }

    /************************************************************
     *
     ************************************************************/
    function strstr(haystack, needle, bool)
    {
        // Finds first occurrence of a string within another
        //
        // version: 1103.1210
        // discuss at: http://phpjs.org/functions/strstr
        // +   original by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
        // +   bugfixed by: Onno Marsman
        // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
        // *     example 1: strstr(‘Kevin van Zonneveld’, ‘van’);
        // *     returns 1: ‘van Zonneveld’
        // *     example 2: strstr(‘Kevin van Zonneveld’, ‘van’, true);
        // *     returns 2: ‘Kevin ‘
        // *     example 3: strstr(‘name@example.com’, ‘@’);
        // *     returns 3: ‘@example.com’
        // *     example 4: strstr(‘name@example.com’, ‘@’, true);
        // *     returns 4: ‘name’
        var pos = 0;

        haystack += "";
        pos = haystack.indexOf(needle); if (pos == -1) {
            return false;
        } else {
            if (bool) {
                return haystack.substr(0, pos);
            } else {
                return haystack.slice(pos);
            }
        }
    }

    /************************************************************
     *   Init json database
     ************************************************************/
    function jdb_init(jdb)
    {
        var type = kw_get_dict_value(jdb, "type", [], 1);
        var hook = kw_get_str(jdb, "hook", "data", 1);
        var schema = kw_get_dict_value(jdb, "schema", {}, 1);
        var topics = kw_get_dict_value(jdb, "topics", {}, 1);

        // Create topics defined in schema
        for(var key in schema) {
            kw_get_dict_value(topics, key, __clone__(type), 1);
        }
    }

    /********************************************
     *
     ********************************************/
    function jdb_update(jdb, topic_name, path, kw)
    {
        var topics = kw_get_dict_value(jdb, "topics", null, 0);
        var topic = kw_get_dict_value(topics, topic_name, null, 0);
        if(!topic) {
            log_error("Topic not found: " + topic_name);
            return null;
        }
        if(empty_string(kw["id"])) {
            log_error("Record without id: " + kw);
            return null;
        }

        var ids = path.split('`');

        var id;
        var v = topic;
        while((id = ids.shift())) {
            if(empty_string(id) || !v) {
                break;
            }
            if(is_object(v)) {
                v = kw_get_dict_value(v, jdb.hook, [], 1);
            }
            v = _jdb_get(v, null, id, false);
        }

        if(ids.length==0 && v) {
            if(is_array(v)) {
                v.push(kw);
            } else {
                if(v["id"]==kw["id"]) {
                    Object.assign(v, kw);
                } else {
                    var v_ = kw_get_dict_value(v, jdb.hook, [], 1);
                    var v__ = _jdb_get(v_, jdb.hook, kw["id"], false);
                    if(v__) {
                        Object.assign(v__, kw);
                    } else {
                        v_.push(kw);
                    }
                }
            }
        }

        //trace_msg(JSON.stringify(topic, null, 4));

        return topic;
    }

    /********************************************
     *
     ********************************************/
    function jdb_delete(jdb, topic_name, path, kw)
    {
        var topics = kw_get_dict_value(jdb, "topics", null, 0);
        var topic = kw_get_dict_value(topics, topic_name, null, 0);
        if(!topic) {
            log_error("Topic not found: " + topic_name);
            return null;
        }
        if(empty_string(kw["id"])) {
            log_error("Record without id: " + kw);
            return null;
        }

        var ids = path.split('`');

        var id;
        var v = topic;
        while((id = ids.shift())) {
            if(empty_string(id) || !v) {
                break;
            }
            if(is_object(v)) {
                v = kw_get_dict_value(v, jdb.hook, null, 0);
            }
            v = _jdb_get(v, null, id, false);
        }

        if(ids.length==0 && v) {
            if(is_array(v)) {
                var idx = id_index_in_obj_list(v, kw["id"]);
                if(idx >= 0) {
                    v.splice(idx, 1);
                }
            } else {
                var v_ = kw_get_dict_value(v, jdb.hook, null, 0);
                var idx = id_index_in_obj_list(v_, kw["id"]);
                if(idx >= 0) {
                    v_.splice(idx, 1);
                }
            }
        }

        //trace_msg(JSON.stringify(topic, null, 4));

        return topic;
    }

    /********************************************
     *
     ********************************************/
    function jdb_get(jdb, topic_name, id)
    {
        var topics = kw_get_dict_value(jdb, "topics", null, 0);
        var topic = kw_get_dict_value(topics, topic_name, null, 0);
        if(!topic) {
            log_error("Topic not found: " + topic_name);
            return null;
        }
        return _jdb_get(topic, jdb.hook, id, true);
    }

    /**************************************************
     *  Busca el id en el arbol.
     *  Los id deben ser únicos, como requiere webix
     **************************************************/
    function _jdb_get(v, hook, id, recursive)
    {
        if(!v) {
            return null;
        }
        var j;
        var ln = v.length;
        for(j=0; j<ln; j++) {
            var v_ = v[j];
            if(v_) {
                var id_ = v_["id"];
                if(id_ && (id_ == id)) {
                    return v_;
                }
                if(recursive) {
                    if(kw_has_key(v_, hook)) {
                        var v__ = _jdb_get(v_[hook], hook, id, recursive);
                        if(v__) {
                            return v__;
                        }
                    }
                }
            }
        }
        return null;
    }

    //=======================================================================
    //      Expose the class via the global object
    //=======================================================================
    exports.__clone__ = __clone__;
    exports.__update_dict__ = __update_dict__;
    exports.__extend_dict__ = __extend_dict__;
    exports.index_of_list = index_of_list;
    exports.elm_in_list = elm_in_list;
    exports.index_in_list = index_in_list;
    exports.delete_from_list = delete_from_list;
    exports.__strip__ = __strip__;
    exports.__set__ = __set__;
    exports.get_function_name = get_function_name;
    exports.same_list = same_list;
    exports.none_in_list = none_in_list;
    exports.id_index_in_obj_list = id_index_in_obj_list;
    exports.get_object_from_list = get_object_from_list;
    exports.strncmp = strncmp;
    exports.is_object = is_object;
    exports.is_array = is_array;
    exports.is_string = is_string;
    exports.is_number = is_number;
    exports.empty_string = empty_string;
    exports.kw_is_identical = kw_is_identical;
    exports.kw_match = kw_match;
    exports.match_dict_list_by_kw = match_dict_list_by_kw;
    exports.filter_dictlist = filter_dictlist;
    exports.filter_dict = filter_dict;
    exports.filter_list = filter_list;

    exports.msg_read_MIA_key = msg_read_MIA_key;
    exports.msg_write_MIA_key = msg_write_MIA_key;
    exports.msg_iev_add_answer_filter = msg_iev_add_answer_filter;
    exports.msg_iev_answer = msg_iev_answer;
    exports.msg_iev_push_stack = msg_iev_push_stack;
    exports.msg_iev_get_stack = msg_iev_get_stack;
    exports.msg_iev_pop_stack = msg_iev_pop_stack;
    exports.msg_set_msg_type = msg_set_msg_type;
    exports.msg_get_msg_type = msg_get_msg_type;
    exports.kw_has_key = kw_has_key;
    exports.kw_get_bool = kw_get_bool;
    exports.kw_get_int = kw_get_int;
    exports.kw_get_str = kw_get_str;
    exports.kw_get_dict_value = kw_get_dict_value;
    exports.get_unique_id = get_unique_id;
    exports._logger = _logger;
    exports.trace_msg = trace_msg;
    exports.load_json_file = load_json_file;
    exports.strstr = strstr;

    exports.jdb_init = jdb_init;
    exports.jdb_update = jdb_update;
    exports.jdb_delete = jdb_delete;
    exports.jdb_get = jdb_get;

})(this);
