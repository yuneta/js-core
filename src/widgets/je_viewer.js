/***********************************************************************
 *          je_viewer.js
 *
 *          jsoneditor viewer
 *          "Container Panel"
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
        panel_properties: {},   // creator can set Container Panel properties
        ui_properties: null,    // creator can set webix properties

        $ui: null,

        _jsoneditor: null,

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
        // We need unique names
        if(empty_string(self.gobj_name())) {
            if(!self._uuid_name) {
                self._uuid_name = get_unique_id(self.gobj_gclass_name());
            }
            return self._uuid_name + "-" + name;
        }
        return self.gobj_escaped_short_name() + "-"+ name;
    }

    /************************************************************
     *   Rebuild
     ************************************************************/
    function rebuild(self)
    {
        // Destroy UI, Build UI
        if(self.config.$ui) {
            self.config.$ui.destructor();
            self.config.$ui = 0;
        }
        if(self.config._jsoneditor) {
            self.config._jsoneditor.destroy();
            self.config._jsoneditor = null;
        }
        build_webix(self);
        self.config._jsoneditor = $$(build_name(self, "jsoneditor")).getJsoneditor();

        initialize_jsoneditor(self);
    }

    /************************************************************
     *   Webix UI
     ************************************************************/
    function build_webix(self)
    {
        /*---------------------------------------*
         *      Bottom Toolbar
         *---------------------------------------*/
        var bottom_toolbar = {
            view:"toolbar",
            height: 30,
            css: "toolbar2color",
            cols:[
            ]
        };

        /*---------------------------------------*
         *      UI
         *---------------------------------------*/
        self.config.$ui = webix.ui({
            id: self.gobj_name(),
            rows: [
                get_container_panel_top_toolbar(self),
                {
                    view: "jsoneditor",
                    id: build_name(self, "jsoneditor"),
                    gobj: self
                },
                bottom_toolbar
            ]
        });

        self.config.$ui.gobj = self;
        if(self.config.ui_properties) {
            self.config.$ui.define(self.config.ui_properties);
            if(self.config.$ui.refresh) {
                self.config.$ui.refresh();
            }
        }

        /*----------------------------------------------*
         *  Inform of view viewed to "Container Panel"
         *----------------------------------------------*/
        self.config.$ui.attachEvent("onViewShow", function() {
            self.parent.gobj_send_event("EV_ON_VIEW_SHOW", self, self);
        });
    }

    /********************************************
     *
     ********************************************/
    function initialize_jsoneditor(self)
    {
        var jsoneditor = self.config._jsoneditor;
    }




            /***************************
             *      Actions
             ***************************/




    /********************************************
     *  Return true if field is editable
     *  kw: {path, field, value}
     ********************************************/
    function ac_je_is_field_editable(self, event, kw, src)
    {
        return false;
    }

    /********************************************
     *  kw: {path, field, value, event}
     *  value undefined when is over key
     ********************************************/
    function ac_je_click(self, event, kw, src)
    {
        trace_msg(kw);
        return 0;
    }

    /********************************************
     *
     ********************************************/
    function ac_load_data(self, event, kw, src)
    {
        self.config._jsoneditor.set(kw.data);

        return 0;
    }

    /********************************************
     *
     ********************************************/
    function ac_clear_data(self, event, kw, src)
    {
        // Get current index, remove UI from parent, re-build UI, add UI to parent with same idx.
        var idx = self.config.$container_parent.index(self.config.$ui);
        self.config.$container_parent.removeView(self.config.$ui);
        rebuild(self);
        self.config.$container_parent.addView(self.config.$ui, idx);

        return 0;
    }

    /********************************************
     *
     ********************************************/
    function ac_select(self, event, kw, src)
    {

        return 0;
    }

    /*************************************************************
     *  Refresh, order from container
     *  provocado por entry/exit de fullscreen
     *  o por redimensionamiento del panel, propio o de hermanos
     *
     *************************************************************/
    function ac_refresh(self, event, kw, src)
    {
        return 0;
    }

    /********************************************
     *  "Container Panel"
     *  Order from container (parent): re-create
     ********************************************/
    function ac_rebuild_panel(self, event, kw, src)
    {
        rebuild(self);
        return 0;
    }




            /***************************
             *      GClass/Machine
             ***************************/




    var FSM = {
        "event_list": [
            "JE_IS_FIELD_EDITABLE",
            "JE_CLICK",
            "EV_LOAD_DATA",
            "EV_CLEAR_DATA",
            "EV_SELECT",
            "EV_REFRESH",
            "EV_REBUILD_PANEL"
        ],
        "state_list": [
            "ST_IDLE"
        ],
        "machine": {
            "ST_IDLE":
            [
                ["JE_IS_FIELD_EDITABLE",    ac_je_is_field_editable,    undefined],
                ["JE_CLICK",                ac_je_click,                undefined],
                ["EV_LOAD_DATA",            ac_load_data,               undefined],
                ["EV_CLEAR_DATA",           ac_clear_data,              undefined],
                ["EV_SELECT",               ac_select,                  undefined],
                ["EV_REFRESH",              ac_refresh,                 undefined],
                ["EV_REBUILD_PANEL",        ac_rebuild_panel,           undefined]
            ]
        }
    };

    var Je_viewer = GObj.__makeSubclass__();
    var proto = Je_viewer.prototype; // Easy access to the prototype
    proto.__init__= function(name, kw) {
        GObj.prototype.__init__.call(
            this,
            FSM,
            CONFIG,
            name,
            "Je_viewer",
            kw,
            0
        );
        return this;
    };
    gobj_register_gclass(Je_viewer, "Je_viewer");




            /***************************
             *      Framework Methods
             ***************************/




    /************************************************
     *      Framework Method create
     ************************************************/
    proto.mt_create = function(kw)
    {
        var self = this;

        rebuild(self);
    }

    /************************************************
     *      Framework Method destroy
     *      In this point, all childs
     *      and subscriptions are already deleted.
     ************************************************/
    proto.mt_destroy = function()
    {
        var self = this;
        if(self.config._jsoneditor) {
            self.config._jsoneditor.destroy();
            self.config._jsoneditor = null;
        }
        if(self.config.$ui) {
            self.config.$ui.destructor();
            self.config.$ui = 0;
        }
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
    exports.Je_viewer = Je_viewer;

})(this);

