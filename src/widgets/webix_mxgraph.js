/*******************************************************************
 *  webix_mxgraph.js
 *
 *  Widget for mxgraph: https://github.com/jgraph/mxgraph
 *
 *  Version
 *  -------
 *  1.0     Initial release
 *
 *
 *  Copyright 2020 Niyamaka
 *  MIT license.
 *******************************************************************/
webix.protoUI({
    name: "mxgraph",
    defaults: {
        gobj: null
    },

    $init: function() {
        this.$view.innerHTML =
            "<div class='webix_mxgraph_content' style='position:relative;width:100%;height:100%;overflow:auto;'></div>";
        this._contentobj = this.$view.firstChild;

        this.$ready.push(this.render);

        // do not call Webix Touch handlers
        webix.event(this.$view, "touchstart", function(e) {
            e.cancelBubble = true;
        });

// TODO scrollbar dentro de otra scrollbar, no consigo que sean independientes
//         webix.event(this._contentobj, "mousewheel", function(e) {
//             // stop propagation
//                 e.cancelBubble = true;
//                 e.defaultPrevented = true;
//                 e.originalEvent.preventDefault();
//                 e.originalEvent.stopPropagation();
//         });
//         webix.event(this._contentobj, "scroll", function(e) {
//             // stop propagation
//             e.stopPropagation();
//             e.preventDefault();
//             e.returnValue = false;
//             return false;
//         });
    },

    render: function() {
        // Create the graph
        this._mxgraph = new mxGraph(this._contentobj);
    },

    getMxgraph: function() {
        return this._mxgraph;
    },

    getContainer: function() {
        return this._contentobj;
    },

    $setSize:function(x,y) {
        webix.ui.view.prototype.$setSize.call(this,x,y);
        if(this._mxgraph) {
            this._mxgraph.doResizeContainer(x, y);
        }
    }
}, webix.ui.view, webix.EventSystem);
