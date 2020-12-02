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

    //=======================================================================
    //      Expose the class via the global object
    //=======================================================================
    exports.treedb_register_data = treedb_register_data;
    exports.treedb_list_nodes = treedb_list_nodes;

})(this);



