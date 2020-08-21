/***********************************************************************
 *          ui_tree.js
 *
 *          Tree
 *
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
     *      Configuration (C attributes)
     ********************************************/
    var CONFIG = {
        tree_item_selected_event_name: "EV_TREE_ITEM_SELECTED",
        ui_properties: null,
        $ui: null
    };




            /***************************
             *      Local Methods
             ***************************/




    /************************************************************
     *   Build name
     ************************************************************/
    function build_name(self, name)
    {
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
        var webix_tree = {
            id: build_name(self, "webix_tree"),
            view: "tree",
            scroll:"xy",
            type:"lineTree",
            select:true,
            on:{
                onAfterSelect:function(id) {
                    self.parent.gobj_send_event(
                        self.config.tree_item_selected_event_name,
                        {
                            id: id,
                            item: this.getItem(id)
                        },
                        self
                    );
                }
            }
        };

        var toolbar = {
            view:"toolbar",
            height: 30,
            css: "toolbar2color",
            cols:[
                {
                    view:"button",
                    type: "icon",
                    icon: "far fa-plus-square",
                    css: "webix_transparent btn_icon_toolbar_16",
                    label: t("expand"),
                    click: function() {
                        $$(build_name(self, "webix_tree")).openAll();
                    }
                },
                {
                    view:"button",
                    type: "icon",
                    icon: "far fa-minus-square",
                    css: "webix_transparent icon_toolbar_16",
                    label: t("collapse"),
                    click: function() {
                        $$(build_name(self, "webix_tree")).closeAll();
                    }
                },
                { view:"label", label: ""}
            ]
        };

        /*---------------------------------------*
         *      UI
         *---------------------------------------*/
        if(self.config.$ui) {
            self.config.$ui.destructor();
            self.config.$ui = 0;
        }
        self.config.$ui = webix.ui({
            id: self.gobj_name(),
            rows: [
                webix_tree,
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




            /***************************
             *      Actions
             ***************************/




    /********************************************
     *
     ********************************************/
    function ac_select_item(self, event, kw, src)
    {
        var $tree = $$(build_name(self, "webix_tree"));
        $tree.select(kw.id);
    }

    /********************************************
     *
     ********************************************/
    function ac_load_data(self, event, kw, src)
    {
        var data = __duplicate__(kw.data);
        var $tree = $$(build_name(self, "webix_tree"));
        $tree.clearAll();
        $tree.parse(data);
        $tree.openAll(); // TODO configura el openAll

        return 0;
    }

    /********************************************
     *
     ********************************************/
    function ac_clear_data(self, event, kw, src)
    {
        var $tree = $$(build_name(self, "webix_tree"));
        $tree.clearAll();

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
        rebuild(self);
        return 0;
    }




            /***************************
             *      GClass/Machine
             ***************************/




    var FSM = {
        "event_list": [
            "EV_SELECT_ITEM",
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
                ["EV_SELECT_ITEM",          ac_select_item,     undefined],
                ["EV_LOAD_DATA",            ac_load_data,       undefined],
                ["EV_CLEAR_DATA",           ac_clear_data,      undefined],
                ["EV_SELECT",               ac_select,          undefined],
                ["EV_REFRESH",              ac_refresh,         undefined]
            ]
        }
    };

    var Ui_tree = GObj.__makeSubclass__();
    var proto = Ui_tree.prototype; // Easy access to the prototype
    proto.__init__= function(name, kw) {
        GObj.prototype.__init__.call(
            this,
            FSM,
            CONFIG,
            name,
            "Ui_tree",
            kw,
            0
        );
        return this;
    };
    gobj_register_gclass(Ui_tree, "Ui_tree");




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
    exports.Ui_tree = Ui_tree;

})(this);
