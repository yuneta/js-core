/***********************************************************************
 *          ui_lib_konva.js
 *
 *          Konva Helpers
 *
 *  Version
 *  -------
 *  1.0     Initial release
 *
 *          Copyright (c) 2022 Niyamaka.
 *          All Rights Reserved.
 ***********************************************************************/
(function (exports) {
    "use strict";

    /********************************************
     *
     ********************************************/
    function add_children(json, parent)
    {
        if(parent) {
            var children = parent.children;
            if(children) {
                for(var i=0; i<children.length; i++) {
                    var child = children[i];
                    var jn = filter_dict(
                        child,
                        ["id", "vertex", "edge", "connectable", "value"]
                    );
                    json.children.push(jn);

                    if(kw_has_key(child, "children")) {
                        jn["children"] = [];
                        add_children(jn, child);
                    }
                    if(child.edge) {
                        if(kw_has_key(child, "source")) {
                            jn["source"] = filter_dict(
                                child.source,
                                ["id", "edge", "connectable", "value"]
                            );
                        }
                        if(kw_has_key(child, "target")) {
                            jn["target"] = filter_dict(
                                child.target,
                                ["id", "edge", "connectable", "value"]
                            );
                        }
                    }
                }
            }
        }
    }

    /********************************************
     *
     ********************************************/
    function konva2json(layer)
    {
        let root = layer;
        let json = {
            id: root.id,
            name: root.name,
            children: []
        };
        add_children(json, root);
        return json;
    }

    //=======================================================================
    //      Expose the class via the global object
    //=======================================================================
    exports.konva2json = konva2json;

})(this);
