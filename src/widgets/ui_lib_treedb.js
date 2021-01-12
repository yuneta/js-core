/***********************************************************************
 *          ui_lib_treedb.js
 *
 *          Treedb common helpers
 *
 *  Version
 *  -------
 *  1.0     Initial release
 *
 *          Copyright (c) 2020 Niyamaka.
 *          All Rights Reserved.
 ***********************************************************************/
(function (exports) {
    'use strict';

    /********************************************
     *      Data
     ********************************************/
    var treedb_register = { // Dictionary with data of registered global topics
    };

    /********************************************
     *
     ********************************************/
    function treedb_register_data(treedb_name, topic_name, data)
    {
        var treedb = kw_get_dict_value(treedb_register, treedb_name, {}, true);
        treedb[topic_name] = data; // Se supone que es un array global que no cambia
    }

    /********************************************
     *
     ********************************************/
    function treedb_list_nodes(treedb_name, topic_name)
    {
        var treedb = kw_get_dict_value(treedb_register, treedb_name, {}, false);
        return kw_get_dict_value(treedb, topic_name, [], false);
    }

    /************************************************************
     *  fkey can be:
     *
     *      "$id"
     *
     *      "$topic_name^$id^$hook_name
     *
     *      {
     *          topic_name: $topic_name,
     *          id: $id,
     *          hook_name: $hook_name
     *      }
     *
     *  Return
     *      {
     *          topic_name:
     *          id:
     *          hook_name:
     *      }
     ************************************************************/
    function decoder_fkey(col, fkey)
    {
        if(is_string(fkey)) {
            if(fkey.indexOf("^") == -1) {
                // "$id"
                var fkey_desc = col.fkey;
                if(json_object_size(fkey_desc)!=1) {
                    log_error("bad fkey 1");
                    log_error(col);
                    log_error(fkey);
                    return null;
                }

                for(var k in fkey_desc) {
                    var topic_name = k;
                    var hook_name = fkey_desc[k];
                    break;
                }

                return {
                    topic_name: topic_name,
                    id: fkey,
                    hook_name: hook_name
                };

            } else {
                // "$topic_name^$id^$hook_name
                var tt = fkey.split("^");
                if(tt.length != 3) {
                    log_error("bad fkey 2");
                    log_error(col);
                    log_error(fkey);
                    return null;
                }
                return {
                    topic_name: tt[0],
                    id: tt[1],
                    hook_name: tt[2]
                };
            }

        } else if(is_object(fkey)) {
            return {
                topic_name: fkey.topic_name,
                id: fkey.id,
                hook_name: fkey.hook_name
            };

        } else {
            log_error("bad fkey 3");
            log_error(col);
            log_error(fkey);
            return null;
        }
    }

    /********************************************
     *  hook can be:
     *
     *      "$id"
     *
     *      "$topic_name^$id
     *
     *      {
     *          topic_name: $topic_name,
     *          id: $id
     *      }
     *
     *  Return
     *      {
     *          topic_name:
     *          id:
     *      }
     ********************************************/
    function decoder_hook(col, hook)
    {
        if(is_string(hook)) {
            if(hook.indexOf("^") == -1) {
                // "$id"
                var hook_desc = col.hook;
                if(json_object_size(hook_desc)!=1) {
                    log_error("bad hook 1");
                    log_error(col);
                    log_error(hook);
                    return null;
                }

                for(var k in hook_desc) {
                    var topic_name = k;
                    var fkey_name = hook_desc[k];
                    break;
                }

                return {
                    topic_name: topic_name,
                    id: hook
                };

            } else {
                // "$topic_name^$id
                var tt = hook.split("^");
                if(tt.length != 2) {
                    log_error("bad hook 2");
                    log_error(col);
                    log_error(hook);
                    return null;
                }
                return {
                    topic_name: tt[0],
                    id: tt[1]
                };
            }

        } else if(is_object(hook)) {
            return {
                topic_name: hook.topic_name,
                id: hook.id
            };

        } else {
            log_error("bad hook 3");
            log_error(col);
            log_error(hook);
            return null;
        }
    }


    //=======================================================================
    //      Expose the class via the global object
    //=======================================================================
    exports.treedb_register_data = treedb_register_data;
    exports.treedb_list_nodes = treedb_list_nodes;
    exports.decoder_fkey = decoder_fkey;
    exports.decoder_hook = decoder_hook;

})(this);



