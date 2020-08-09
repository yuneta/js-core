/***********************************************************************
 *          mx_tree.js
 *
 *          Tree with mxgrah
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
        cx_graph: 400,
        cy_graph: 200,
        layers: [
            {
                id: "__mx_default_layer__"
            }
        ],
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
        return self.gobj_escaped_short_name() + "-"+ name;
    }

    /************************************************************
     *
     ************************************************************/
    function resize_container(self, rect)
    {
        return;
        self.config._mxgraph.view.setTranslate(0, 0);
        trace_msg(rect);
        var w = rect.width;
        if(rect.x<0) {
            w += -rect.x;
        } else {
            w += rect.x;
        }
        var h = rect.y + rect.height;
        if(rect.y<0) {
            h += -rect.y;
        } else {
            h += rect.y;
        }
        trace_msg("w: " + w + ", h: " + h);
        $$(build_name(self, "mxgraph")).define("width", w+10);
        $$(build_name(self, "mxgraph")).define("height", h+10);
        $$(build_name(self, "mxgraph")).resize();
    }

    /************************************************************
     *   Webix UI
     ************************************************************/
    function build_webix(self)
    {
        var toolbar = {
            view:"toolbar",
            height: 30,
            css: "toolbar2color",
            cols:[
                {
                    view:"button",
                    type: "icon",
                    icon: "far fa-expand",
                    css: "webix_transparent btn_icon_toolbar_16",
                    maxWidth: 120,
                    label: t("reset view"),
                    click: function() {
                        self.config._mxgraph.view.scaleAndTranslate(1, 0, 0);
                    }
                },
                {
                    view:"button",
                    type: "icon",
                    icon: "fas fa-expand-arrows-alt",
                    css: "webix_transparent btn_icon_toolbar_16",
                    maxWidth: 120,
                    label: t("fit"),
                    click: function() {
                        self.config._mxgraph.fit();
                    }
                },
                {
                    view:"button",
                    type: "icon",
                    icon: "far fa-plus",
                    css: "webix_transparent btn_icon_toolbar_16",
                    maxWidth: 120,
                    label: t("zoom in"),
                    click: function() {
                        self.config._mxgraph.zoomIn();
                        self.config._mxgraph.view.setTranslate(0, 0);
                    }
                },
                {
                    view:"button",
                    type: "icon",
                    icon: "far fa-minus",
                    css: "webix_transparent icon_toolbar_16",
                    maxWidth: 120,
                    label: t("zoom out"),
                    click: function() {
                        self.config._mxgraph.zoomOut();
                        self.config._mxgraph.view.setTranslate(0, 0);
                    }
                },
                { view:"label", label: ""}
            ]
        };

        /*---------------------------------------*
         *      UI
         *---------------------------------------*/
        self.config.$ui = webix.ui({
            id: self.gobj_name(),
            rows: [
                {
                    view: "mxgraph",
                    id: build_name(self, "mxgraph"),
                    gobj: self
                },
                toolbar
            ]
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
        var layers = self.config.layers;
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
            self.config._mxgraph.insertVertex(
                parent,
                data.id,
                data.value,
                x+cx+10, y+cy+10, cx, cy,
                style
            );
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
//         if(self.config._mxgraph) {
//             self.config._mxgraph.destroy();
//             self.config._mxgraph = null;
//         }
        // TODO crea de nuevo
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
            "EV_CLEAR_DATA",
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
                ["EV_SELECT",               ac_select,                  undefined],
                ["EV_REFRESH",              ac_refresh,                 undefined]
            ]
        }
    };

    var Mx_tree = GObj.__makeSubclass__();
    var proto = Mx_tree.prototype; // Easy access to the prototype
    proto.__init__= function(name, kw) {
        GObj.prototype.__init__.call(
            this,
            FSM,
            CONFIG,
            name,
            "Mx_tree",
            kw,
            0
        );
        return this;
    };
    gobj_register_gclass(Mx_tree, "Mx_tree");




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

        /*
         *  Initialize mxgraph
         */
        var _mxgraph = self.config._mxgraph = $$(build_name(self, "mxgraph")).getMxgraph();
        _mxgraph["__mx_layout__"] = new mxGraphLayout(_mxgraph);
        _mxgraph.setPanning(true);
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
        mxEvent.disableContextMenu(
            $$(build_name(self, "mxgraph")).getNode()
        );
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
    exports.Mx_tree = Mx_tree;

})(this);
