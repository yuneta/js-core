/***********************************************************************
 *          ui_mxgraph.js
 *
 *          MxGraph GObj
 *
 *          Copyright (c) 2020 Niyamaka.
 *          All Rights Reserved.
 ***********************************************************************/
(function (exports) {
    'use strict';

    /********************************************
     *      Configuration (C attributes)
     ********************************************/
    var CONFIG = {
        mxgraph_options: {
            //layers: []
        },
        _mxgraph: null,
        ui_properties: null,
        $ui: null,
        __writable_attrs__: [
        ]
    };




            /***************************
             *      Local Methods
             ***************************/




    /************************************************************
     *   Build name
     ************************************************************/
    function build_name(self, name)
    {
        return self.gobj_escaped_short_name() + name;
    }

    /************************************************************
     *   Webix UI
     ************************************************************/
    function build_webix(self)
    {
        self.config.$ui = webix.ui({
            view: "scrollview",
            id: self.gobj_name(),
            scroll: "auto",
            body: {
                view: "mxgraph",
                id: build_name(self, "mxgraph"),
                gobj: self,
                mxgraph_options: self.config.mxgraph_options
            }
        });
        self.config.$ui.gobj = self;

        if(self.config.ui_properties) {
            self.config.$ui.define(self.config.ui_properties);
            if(self.config.$ui.refresh) {
                self.config.$ui.refresh();
            }
        }
    }

    /************************************************************
     *
     ************************************************************/
    function get_layer(self, layer)
    {
        var layers = self.config.mxgraph_options.layers;
        for(var i=0; i<layers.length; i++) {
            if(layers[i].id == layer) {
                return layers[i].__mx_cell__;
            }
        }
        var x = self.config._mxgraph.getModel().getCell(layer);
        return self.config._mxgraph.getDefaultParent();
    }

    /************************************************************
     *
     ************************************************************/
    function _load_webix_tree(self, parent, data)
    {
        var x=0, y=0, cx=100, cy=100;
        var style = "";
        for(var i=0; i<data.length; i++) {
            self.config._mxgraph.insertVertex(
                parent,
                data.id,
                data.value,
                x, y, cx, cy,
                style
            );
        }
    }

    /************************************************************
     *
     ************************************************************/
    function load_webix_tree(self, data, layer)
    {
        var layer = get_layer(self, layer);
        _load_webix_tree(self, layer, data);
    }




            /***************************
             *      Actions
             ***************************/




    /********************************************
     *
     ********************************************/
    function ac_load_data(self, event, kw, src)
    {
        switch(kw.type) {
            case "webix-tree":
            default:
                load_webix_tree(self, kw.data, kw.layer);
                break;
        }
        return 0;
    }

    /********************************************
     *
     ********************************************/
    function ac_clear_data(self, event, kw, src)
    {
        $$(build_name(self, "mxgraph")).destructor();
        if(self.config._mxgraph) {
            self.config._mxgraph.destroy();
        }

        var $new_mx = webix.ui({
            view: "mxgraph",
            id: build_name(self, "mxgraph"),
            gobj: self,
            mxgraph_options: self.config.mxgraph_options
        });
        $$(self.gobj_name()).addView($new_mx);

        return 0;
    }

    /********************************************
     *
     ********************************************/
    function ac_mxgraph_initialized(self, event, kw, src)
    {
        self.config._mxgraph = kw._mxgraph;
        return 0;
    }

    /********************************************
     *
     ********************************************/
    function ac_select(self, event, kw, src)
    {

        return 0;
    }

    /********************************************
     *
     ********************************************/
    function ac_refresh(self, event, kw, src)
    {

        return 0;
    }




            /***************************
             *      GClass/Machine
             ***************************/




    var FSM = {
        "event_list": [
            "EV_LOAD_DATA",
            "EV_MXGRAPH_INITIALIZED",
            "EV_SELECT",
            "EV_REFRESH"
        ],
        "state_list": [
            "ST_IDLE"
        ],
        "machine": {
            "ST_IDLE":
            [
                ["EV_LOAD_DATA",            ac_load_data,               undefined],
                ["EV_CLEAR_DATA",           ac_clear_data,              undefined],
                ["EV_MXGRAPH_INITIALIZED",  ac_mxgraph_initialized,     undefined],
                ["EV_SELECT",               ac_select,                  undefined],
                ["EV_REFRESH",              ac_refresh,                 undefined]
            ]
        }
    };

    var Ui_mxgraph = GObj.__makeSubclass__();
    var proto = Ui_mxgraph.prototype; // Easy access to the prototype
    proto.__init__= function(name, kw) {
        GObj.prototype.__init__.call(
            this,
            FSM,
            CONFIG,
            name,
            "Ui_mxgraph",
            kw,
            0
        );
        return this;
    };
    gobj_register_gclass(Ui_mxgraph, "Ui_mxgraph");




            /***************************
             *      Framework Methods
             ***************************/




    /************************************************
     *      Framework Method create
     ************************************************/
    proto.mt_create = function(kw)
    {
        var self = this;

        build_webix(self);
    }

    /************************************************
     *      Framework Method destroy
     *      In this point, all childs
     *      and subscriptions are already deleted.
     ************************************************/
    proto.mt_destroy = function()
    {
        var self = this;
        if(self.config._mxgraph) {
            self.config._mxgraph.destroy();
        }
        $$(self.gobj_name()).destructor();
    }

    /************************************************
     *      Framework Method start
     ************************************************/
    proto.mt_start = function(kw)
    {
        var self = this;

    }

    /************************************************
     *      Framework Method stop
     ************************************************/
    proto.mt_stop = function(kw)
    {
        var self = this;
    }


    //=======================================================================
    //      Expose the class via the global object
    //=======================================================================
    exports.Ui_mxgraph = Ui_mxgraph;

})(this);
