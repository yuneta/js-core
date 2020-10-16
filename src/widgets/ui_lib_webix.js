/***********************************************************************
 *          ui_lib_webix.js
 *
 *          Webix Helpers
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
     *
     ********************************************/
    function setup_webix(config)
    {
        /*
         *  Multicombo propio
         *  HACK recuerda pasar también options como options_
         */
        webix.protoUI({
            name: "multicombo2",
            setValue: function(value) {
                if(webix.isArray(value)) {
                    var temp = [];
                    for (var i = 0; i < value.length; i++) {
                        if(value[i].id) {
                            temp.push(value[i].id);
                        }
                    }
                    value = temp;
                }
                return webix.ui.multicombo.prototype.setValue.call(this, value);
            },
            getValue: function() {
                var value = webix.ui.multicombo.prototype.getValue.call(this);
                var new_value = kwid_collect(
                    this.config.options_,
                    value.split(","),
                    null, null
                );
                if(new_value.length) {
                    return new_value;
                } else {
                    return value;
                }
            }
        }, webix.ui.multicombo);

        /*
         *  Combo propio
         *  HACK recuerda pasar también options como options_
         */
        webix.protoUI({
            name: "combo2",
            setValue: function(value) {
                if(is_object(value)) {
                    value = value.id;
                }
                return webix.ui.combo.prototype.setValue.call(this, value);
            },
            getValue: function() {
                var value = webix.ui.combo.prototype.getValue.call(this);
                var new_value = kwid_collect(
                    this.config.options_,
                    value,
                    null, null
                );
                if(new_value.length) {
                    return new_value[0];
                } else {
                    return value;
                }
            }
        }, webix.ui.combo);

        /*
         *  Contador de rows para las tablas
         */
        webix.ui.datafilter.countColumn = webix.extend({
            refresh: function (master, node, value) {
                var result = 0;
                master.mapCells(null, value.columnId, null, 1, function (value) {
                    result++;
                    return value;
                });

                node.firstChild.innerHTML = result;
            }
        }, webix.ui.datafilter.summColumn);

        /*
         *  Esc key to close modal windows
         */
        // las window que llaman a close() se quedan mal con Esc
        //webix.UIManager.addHotKey("esc", function(view) {
        //    if (view) {
        //        var top = view.getTopParentView();
        //        if (top && top.setPosition)
        //        top.hide();
        //    }
        //});

        /*
         *  Habilita scroll de webix, mas delgada
         */
        if(!webix.env.touch && webix.env.scrollSize) {
            webix.CustomScroll.init();
        }

        /*
         *  Habilita full screen
         */
        if(config && config.full_screen) {
            webix.ui.fullScreen();
        }
    }

    //=======================================================================
    //      Expose the class via the global object
    //=======================================================================
    exports.setup_webix = setup_webix;

})(this);



