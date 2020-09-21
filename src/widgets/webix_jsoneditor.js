/*******************************************************************
 *  webix_jsoneditor.js
 *
 *  Widget for jsoneditor: https://github.com/josdejong/jsoneditor/
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
    name: "jsoneditor",
    defaults: {
        background_color: "#FFFFFF"
    },

    $init: function() {
        this.$view.innerHTML =
            "<div class='webix_jsoneditor_content' style='width:100%;height:100%;background:" + this.config.background_color + ";'></div>";
        this._contentobj = this.$view.firstChild;

        this.$ready.push(this.render);

        // do not call Webix Touch handlers
        webix.event(this.$view, "touchstart", function(e) {
            e.cancelBubble = true;
        });
    },

    render: function() {
        // Create the jsoneditor
        this._jsoneditor = new JSONEditor(
            this._contentobj,
            {
                mode: "form",
                modes: ["form","view","tree","code","text","preview"],
                indentation: 4,
                mainMenuBar: true,
                navigationBar: true,
                statusBar: true,
                timestampTag: function({field, value, path}) {
                    if (field === '__t__' || field === '__tm__' || field === 'tm' ||
                        field === 'from_t' || field === 'to_t' || field === 't' ||
                        field === 'from_tm' || field === 'to_tm'
                    ) {
                        return true;
                    }
                    return false;
                },
                timestampFormat: function({field, value, path}) {
                    if (field === '__t__' || field === '__tm__' || field === 'tm' ||
                        field === 'from_t' || field === 'to_t' || field === 't' ||
                        field === 'from_tm' || field === 'to_tm'
                    ) {
                        return new Date(value*1000).toISOString();
                    }
                    return null;
                }
            }
        );
    },

    getJsoneditor: function() {
        return this._jsoneditor;
    },

    getContainer: function() {
        return this._contentobj;
    },

    $setSize:function(x,y) {
        webix.ui.view.prototype.$setSize.call(this,x,y);
        if(this._jsoneditor) {
            this._jsoneditor.refresh();
        }
    }
}, webix.ui.view, webix.EventSystem);

