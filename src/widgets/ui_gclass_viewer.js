/***********************************************************************
 *          ui_gclass_viewer.js
 *
 *          GClass Viewer
 *
 *          Copyright (c) 2020 Niyamaka.
 *          All Rights Reserved.
 *
 *
 *  Version
 *  -------
 *  1.0     Initial release
 *
 *
 ***********************************************************************/
(function (exports) {
    'use strict';

    /********************************************
     *      Configuration (C attributes)
     ********************************************/
    var CONFIG = {
        topic_name: "",
        schema: null,
        with_hide_btn: false,
        with_fullscreen_btn: false,

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
        if(empty_string(self.gobj_name())) {
            if(!self._uuid_name) {
                self._uuid_name = get_unique_id(self.gobj_gclass_name());
            }
            return self._uuid_name + "-" + name;
        }
        return self.gobj_escaped_short_name() + "-" + name;
    }

    /************************************************************
     *   Rebuild
     ************************************************************/
    function rebuild(self)
    {
        if(self.config.$ui) {
            self.config.$ui.destructor();
            self.config.$ui = 0;
        }
        build_webix(self);
    }

    /************************************************************
     *   Webix UI
     ************************************************************/
    function build_webix(self)
    {
        var form = {
            view: "form",
            id: build_name(self, "update_form"),
            scroll:true,
            minWidth: 400,
            elementsConfig: {
                labelAlign:"left",
                labelWidth: 160
            },
            elements: [],
            on: {
                onChange: function(new_v, old_v) {
//                     var changed = $$(build_name(self, "update_form")).isDirty();
//                     if(changed) {
//                         var btn = $$(build_name(self, "update_record"));
//                         webix.html.addCss(btn.getNode(), "icon_color_submmit");
//                         btn = $$(build_name(self, "undo_record"));
//                         webix.html.addCss(btn.getNode(), "icon_color_cancel");
//                     }
                }
            }
        }

        /*
         *  UI
         */
        self.config.$ui = webix.ui({
            view: "form",
            scroll:true,
            elements: [
                { view:"text", label:"Email" },
                { view:"text", type:"password", label:"Password" },
                {cols:[
                    { view:"button", value:"Login", css:"webix_primary" },
                    { view:"button", value:"Cancel" }
                ]}
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




            /***************************
             *      Actions
             ***************************/




    /********************************************
     *
     ********************************************/
    function ac_load_data(self, event, kw, src)
    {
        return 0;
    }

    /********************************************
     *
     ********************************************/
    function ac_clear_data(self, event, kw, src)
    {
        return 0;
    }

    /********************************************
     *
     ********************************************/
    function ac_refresh(self, event, kw, src)
    {
        rebuild(self);
        return 0;
    }

    /********************************************
     *
     ********************************************/
    function ac_select(self, event, kw, src)
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
            "EV_REFRESH",
            "EV_SELECT"
        ],
        "state_list": [
            "ST_IDLE"
        ],
        "machine": {
            "ST_IDLE":
            [
                ["EV_LOAD_DATA",                ac_load_data,               undefined],
                ["EV_CLEAR_DATA",               ac_clear_data,              undefined],
                ["EV_REFRESH",                  ac_refresh,                 undefined],
                ["EV_SELECT",                   ac_select,                  undefined]
            ]
        }
    };

    var Ui_gclass_viewer = GObj.__makeSubclass__();
    var proto = Ui_gclass_viewer.prototype; // Easy access to the prototype
    proto.__init__= function(name, kw) {
        GObj.prototype.__init__.call(
            this,
            FSM,
            CONFIG,
            name,
            "Ui_gclass_viewer",
            kw,
            0
        );
        return this;
    };
    gobj_register_gclass(Ui_gclass_viewer, "Ui_gclass_viewer");




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
    exports.Ui_gclass_viewer = Ui_gclass_viewer;

})(this);
