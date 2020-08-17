/***********************************************************************
 *          ui_formtable.js
 *
 *          Manage table and form
 *          Child Gadget gobj
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
        update_mode_enabled: false,
        create_mode_enabled: false,
        delete_mode_enabled: false,
        update_record_event_name: "EV_UPDATE_RECORD",
        create_record_event_name: "EV_CREATE_RECORD",
        delete_record_event_name: "EV_DELETE_RECORD",
        refresh_data_event_name: "EV_REFRESH",
        row_checked_event_name: "EV_ROW_CHECKED",
        fields_enabled: null,
        with_drag: false,
        with_checkbox: false,
        with_radio: false,
        with_webix_id: false,   // Set true when your id is repeated
        with_textfilter: false,
        with_sort: false,
        with_navigation: false,
        with_top_title: false,
        with_total_in_title: false,

        _writable_fields: null, // automatic built

        current_mode: null,
        page_size: 0,
        page: 0,            // current page
        record_idx: 0,      // current idx of selected record
        total: 0,           // total of record in datatable

        ui_properties: null,
        $ui: null,
        __writable_attrs__: [
            "page_size"
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
        return self.gobj_escaped_short_name() + "-" + name;
    }

    /************************************************************
     *   Webix UI
     ************************************************************/
    function build_webix(self)
    {
        var top_table_toolbar = {
            view:"toolbar",
            id: build_name(self, "top_table_toolbar"),
            hidden: self.config.with_top_title?false:true,
            css: "toolbar2color",
            cols: [
                {},
                {
                    view: "label",
                    id: build_name(self, "top_table_toolbar_title"),
                    click: function() {
                    }
                },
                {
                    view: "label",
                    hidden: self.config.with_total_in_title?false:true,
                    id: build_name(self, "top_table_toolbar_total")
                },
                {}
            ]
        };

        var segmented_tooltip = t("list");
        if(self.config.update_mode_enabled) {
            segmented_tooltip += " | " + t("update");
        }
        if(self.config.create_mode_enabled) {
            segmented_tooltip += " | " + t("create");
        }

        var segmented_size = 60;
        var show_segmented = false;
        var segmented_options = [
            {
                id: "list",
                value: "<span style='font-size:22px;' class='fal fa-table'>&nbsp;</span>"
            }
        ];
        if(self.config.update_mode_enabled) {
            show_segmented = true;
            segmented_size += 60;
            segmented_options.push(
                {
                    id: "update",
                    value: "<span style='font-size:22px;' class='far fa-money-check'>&nbsp;</span>"
                }
            );
        }
        if(self.config.create_mode_enabled) {
            show_segmented = true;
            segmented_size += 60;
            segmented_options.push(
                {
                    id: "create",
                    value: "<span style='font-size:22px;' class='far fa-rectangle-landscape'>&nbsp;</span>"
                }
            );
        }

        var navigation_table_toolbar = {
            view: "scrollview",
            height: 70,
            scroll: "auto",
            hidden: self.config.with_navigation?false:true,
            body: {
                view:"toolbar",
                css: "toolbar2color",
                cols: [
                    {
                        view: "segmented",
                        id: build_name(self, "segmented"),
                        width: segmented_size,
                        value: "list",
                        hidden: show_segmented?false:true,
                        tooltip: segmented_tooltip,
                        options: segmented_options,
                        click: function(id, ev) {
                            var view_mode = this.getValue();
                            if(view_mode == "list") {
                                self.gobj_send_event("EV_LIST_MODE", {}, self);
                            } else if(view_mode == "update") {
                                self.gobj_send_event("EV_UPDATE_MODE", {}, self);
                            } else if(view_mode == "create") {
                                self.gobj_send_event("EV_CREATE_MODE", {}, self);
                            }
                        }
                    },
                    {
                        view: "button",
                        type: "icon",
                        icon: "far fa-arrow-to-left",
                        css: "webix_transparent btn_icon_toolbar_16",
                        tooltip: t("first_record"),
                        width: 50,
                        click: function() {
                            self.gobj_send_event("EV_FIRST_RECORD", {}, self);
                        }
                    },
                    {
                        view: "button",
                        type: "icon",
                        icon: "far fa-angle-double-left",
                        css: "webix_transparent btn_icon_toolbar_16",
                        tooltip: t("prev_page"),
                        width: 50,
                        click: function() {
                            self.gobj_send_event("EV_PREVIOUS_PAGE", {}, self);
                        }
                    },
                    {
                        view: "button",
                        type: "icon",
                        icon: "far fa-angle-left",
                        css: "webix_transparent btn_icon_toolbar_16",
                        tooltip: t("prev_record"),
                        width: 50,
                        click: function() {
                            self.gobj_send_event("EV_PREVIOUS_RECORD", {}, self);
                        }
                    },
                    {
                        view: "button",
                        type: "icon",
                        icon: "far fa-angle-right",
                        css: "webix_transparent btn_icon_toolbar_16",
                        tooltip: t("next_record"),
                        width: 50,
                        click: function() {
                            self.gobj_send_event("EV_NEXT_RECORD", {}, self);
                        }
                    },
                    {
                        view: "button",
                        type: "icon",
                        icon: "far fa-angle-double-right",
                        css: "webix_transparent btn_icon_toolbar_16",
                        width: 50,
                        click: function() {
                            self.gobj_send_event("EV_NEXT_PAGE", {}, self);
                        }
                    },
                    {
                        view: "button",
                        type: "icon",
                        icon: "far fa-arrow-to-right",
                        css: "webix_transparent btn_icon_toolbar_16",
                        tooltip: t("last_record"),
                        width: 50,
                        click: function() {
                            self.gobj_send_event("EV_LAST_RECORD", {}, self);
                        }
                    },
                    {
                        view: "text",
                        id: build_name(self, "record_idx"),
                        minWidth: 100,
                        format: "1" + webix.i18n.groupDelimiter + "111",
                        label: t("record_idx"),
                        tooltip: t("record_idx"),
                        value: self.config.record_idx,
                        labelPosition: "top",
                        on: {
                            onChange(newVal, oldVal) {
                                newVal = Number(newVal);
                                if(self.config.record_idx != newVal) {
                                    self.gobj_send_event(
                                        "EV_RECORD_BY_IDX", {record_idx:newVal}, self
                                    );
                                }
                            }
                        }
                    },
                    {
                        view: "text",
                        id: build_name(self, "page"),
                        minWidth: 100,
                        format: "1" + webix.i18n.groupDelimiter + "111",
                        label: t("page"),
                        tooltip: t("page"),
                        value: self.config.page,
                        labelPosition: "top",
                        on: {
                            onChange(newVal, oldVal) {
                                newVal = Number(newVal);
                                if(self.config.page != newVal) {
                                    self.gobj_send_event("EV_PAGE", {page:newVal}, self);
                                }
                            }
                        }
                    },
                    {
                        view: "text",
                        id: build_name(self, "total"),
                        minWidth: 100,
                        format: "1" + webix.i18n.groupDelimiter + "111",
                        label: t("total"),
                        readonly: true,
                        tooltip: t("total"),
                        value: self.config.total,
                        labelPosition: "top"
                    },
                    {
                        view: "text",
                        id: build_name(self, "page_size"),
                        minWidth: 100,
                        format: "1" + webix.i18n.groupDelimiter + "111",
                        label: t("page_size"),
                        tooltip: t("page_size"),
                        value: self.config.page_size,
                        labelPosition: "top",
                        on: {
                            onChange(newVal, oldVal) {
                                newVal = Number(newVal);
                                if(self.config.page_size != newVal) {
                                    self.config.page_size = newVal;
                                    self.gobj_save_persistent_attrs();
                                }
                            }
                        }
                    },
                    {
                        view: "button",
                        type: "icon",
                        icon: "far fa-sync",
                        css: "webix_transparent btn_icon_toolbar_16",
                        tooltip: t("refresh"),
                        width: 50,
                        click: function() {
                            self.gobj_send_event("EV_REFRESH", {}, self);
                        }
                    }
                ]
            }
        };

        var update_toolbar = {
            view:"toolbar",
            id: build_name(self, "update_toolbar"),
            width: 60,
            css: "toolbar2color",
            rows: [
                {
                    view: "icon",
                    id: build_name(self, "update_record"),
                    icon: "far fa-save",
                    css: "webix_transparent icon_toolbar_34",
                    tooltip: t("update record"),
                    click: function() {
                        var $form = $$(build_name(self, "update_form"));
                        var changed = $form.isDirty();
                        if(changed) {
                            self.gobj_send_event("EV_UPDATE_RECORD", $form.getValues(), self);
                        }
                    }
                },
                {
                    view: "icon",
                    id: build_name(self, "undo_record"),
                    icon: "far fa-undo",
                    css: "webix_transparent icon_toolbar_34",
                    tooltip: t("undo"),
                    click: function() {
                        self.gobj_send_event("EV_UNDO_RECORD", {}, self);
                    }
                }
            ]
        };

        var create_toolbar = {
            view:"toolbar",
            id: build_name(self, "create_toolbar"),
            width: 60,
            css: "toolbar2color",
            rows: [
                {
                    view: "icon",
                    id: build_name(self, "create_record"),
                    icon: "far fa-save",
                    css: "webix_transparent icon_toolbar_34",
                    tooltip: t("save record"),
                    click: function() {
                        var $new = $$(build_name(self, "create_form"));
                        var changed = $new.isDirty();
                        if(changed) {
                            self.gobj_send_event("EV_CREATE_RECORD", $new.getValues(), self);
                        }
                    }
                },
                {
                    view: "icon",
                    id: build_name(self, "cancel_record"),
                    icon: "fal fa-trash-alt",
                    css: "webix_transparent icon_toolbar_34",
                    tooltip: t("cancel"),
                    click: function() {
                        self.gobj_send_event("EV_CANCEL_RECORD", {}, self);
                    }
                }
            ]
        };

        var list_table = {
            view: "datatable",
            id: build_name(self, "list_table"),
            tooltip: true,
            select: true,
            navigation: true,
            resizeColumn: true,
            resizeRow: true,
            fixedRowHeight: false,
            drag: self.config.with_drag? "source":false, // TODO let "target" too?
            gobj: self, // HACK needed for factory. Available in config.gobj
            on: {
                onCheck: function(rowId, colId, state){
                    var $table = $$(build_name(self, "list_table"));
                    var record = $table.getItem(rowId);
                    self.parent.gobj_send_event(
                        self.config.row_checked_event_name,
                        {
                            record: record,
                            checked: state
                        },
                        self
                    );
                },
                onItemDblClick: function(id) {
                    if(self.config.update_mode_enabled) {
                        $$(build_name(self, "segmented")).setValue("update");
                        self.gobj_send_event("EV_UPDATE_MODE", {}, self);
                    }
                },
                onAfterSelect: function(selection, preserve) {
                    set_current_table_record(self);
                }
            }
        };

        var update_form_window = {
            view: "scrollview",
            id: build_name(self, "update_form_window"),
            scroll: "auto",
            hidden: true,
            body: {
                cols: [
                    {
                        view: "form",
                        id: build_name(self, "update_form"),
                        scroll:true,
                        minWidth: 400,
                        elementsConfig:{
                            labelAlign:"left",
                            labelWidth: 160
                        },
                        elements: [],
                        on: {
                            onChange: function(new_v, old_v) {
                                var changed = $$(build_name(self, "update_form")).isDirty();
                                if(changed) {
                                    var btn = $$(build_name(self, "update_record"));
                                    webix.html.addCss(btn.getNode(), "icon_color_submmit");
                                    btn = $$(build_name(self, "undo_record"));
                                    webix.html.addCss(btn.getNode(), "icon_color_cancel");
                                }
                            }
                        }
                    },
                    update_toolbar
                ]
            }
        };

        var create_form_window = {
            view: "scrollview",
            id: build_name(self, "create_form_window"),
            scroll: "auto",
            hidden: true,
            body: {
                cols: [
                    {
                        view: "form",
                        id: build_name(self, "create_form"),
                        scroll:true,
                        minWidth: 400,
                        elementsConfig:{
                            labelAlign:"left",
                            labelWidth: 160
                        },
                        elements: [],
                        on: {
                            onChange: function(create_v, old_v) {
                                var changed = $$(build_name(self, "create_form")).isDirty();
                                if(changed) {
                                    var btn = $$(build_name(self, "create_record"));
                                    webix.html.addCss(btn.getNode(), "icon_color_submmit");
                                    btn = $$(build_name(self, "cancel_record"));
                                    webix.html.addCss(btn.getNode(), "icon_color_cancel");
                                }
                            }
                        }
                    },
                    create_toolbar
                ]
            }
        };

        self.config.$ui = webix.ui({
            rows: [
                top_table_toolbar,
                {
                    animate: false,
                    cells: [
                        list_table,
                        update_form_window,
                        create_form_window
                    ]
                },
                navigation_table_toolbar
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

    /********************************************
     *
     ********************************************/
    function cols2webix_table_cols(self, schema)
    {
        var webix_schema = [];
        if(self.config.with_checkbox) {
            webix_schema.push(
                {
                    id: "row",
                    header: { content:"masterCheckbox", css: "doublecheckbox" },
                    checkValue: true,
                    uncheckValue: false,
                    template: "{common.checkbox()}",
                    width: 50,
                    css: "doublecheckbox"
                }
            );
        } else if(self.config.with_radio) {
            webix_schema.push(
                {
                    id: "row",
                    header: "",
                    checkValue: true,
                    uncheckValue: false,
                    template: "{common.radio()}",
                    width: 50,
                    css: "doubleradio"
                }
            );
        }

        for(var i=0; schema && i<schema.length; i++) {
            var webix_col = null;
            var tranger_col = schema[i];
            if(tranger_col.id.charAt(0)=='_') {
                continue;
            }

            webix_col = {
                id: self.config.with_webix_id?
                    (tranger_col.id==="id"?"id_":tranger_col.id):tranger_col.id,
                header: self.config.with_textfilter?
                    [t(tranger_col.header), {content:"textFilter"}]:t(tranger_col.header),

                sort: self.config.with_sort?
                    tranger_col.type === 'integer'? "int":"string":false,
                minWidth: tranger_col.fillspace * 10,
                fillspace: tranger_col.fillspace
            }

            switch(tranger_col.type) {
                case "string":
                    break;
                case "integer":
                    break;
                case "object":
                    break;
                case "dict":
                    break;
                case "array":
                    break;
                case "list":
                    break;
                case "real":
                    break;
                case "boolean":
                    webix_col["template"] = "{common.checkbox()}";
                    break;
                case "enum":
                    break;
                case "blob":
                    break;
                default:
                    log_error("col type unknown:" + tranger_col.type);
                    break;
            }
            if(tranger_col.template) {
                webix_col["template"] = tranger_col.template;
            }
            if(!self.config.fields_enabled ||
                    elm_in_list(webix_col.id, self.config.fields_enabled)) {
                webix_schema.push(webix_col);
            }
        }
        return webix_schema;
    }

    /********************************************
     *
     ********************************************/
    function build_list_table(self, schema)
    {
        var $table = $$(build_name(self, "list_table"));
        $table.clearAll();

        // redefine columns
        $table.config.columns = cols2webix_table_cols(self, schema);
        $table.refreshColumns();

        return $table;
    }

    /********************************************
     *
     ********************************************/
    function cols2webix_form_elements(self, schema, mode)
    {
        var _writable_fields = [];
        var webix_rules = {};
        var webix_elements = [
            {
                view:"text",
                name: "id",
                hidden: self.config.with_webix_id?false:true,
                label: "Webix Id",
                css: "input_font_fijo",
                readonly: true,
                type: "string"
            }
        ];

        for(var i=0; schema && i<schema.length; i++) {
            var webix_element = null;
            var tranger_col = schema[i];
            if(tranger_col.id.charAt(0)=='_') {
                continue;
            }

            var id = self.config.with_webix_id?
                    (tranger_col.id==="id"?"id_":tranger_col.id):tranger_col.id;
            var flag = tranger_col.flag;
            var is_hook = elm_in_list("hook", flag);
            var is_fkey = elm_in_list("fkey", flag);
            var is_required = elm_in_list("required", flag);
            var is_persistent = elm_in_list("persistent", flag);
            var is_password = elm_in_list("password", flag);
            var is_email = elm_in_list("email", flag);
            var is_url = elm_in_list("url", flag);
            var is_writable = elm_in_list("writable", flag);

            switch(mode) {
                case "create":
                    if(is_required || is_persistent || is_writable) {
                        is_writable = true;
                        _writable_fields.push(id);

                        if(is_required) {
                            webix_rules[id] = webix.rules.isNotEmpty;
                        }
                        if(is_email) {
                            webix_rules[id] = webix.rules.isEmail;
                        }
                    }
                    break;
                case "update":
                default:
                    if(is_writable) {
                        _writable_fields.push(id);

                        if(is_required) {
                            webix_rules[id] = webix.rules.isNotEmpty;
                        }
                        if(is_email) {
                            webix_rules[id] = webix.rules.isEmail;
                        }
                    }
                    break;
            }

            switch(tranger_col.type) {
                case "string":
                    var type = "text";
                    if(tranger_col.id.indexOf("email")>=0) {
                        type = "email";
                    }
                    if(is_email) {
                        type = "email";
                    }
                    if(is_url) {
                        type = "url";
                    }
                    if(is_password) {
                        type = "password";
                    }
                    webix_element = {
                        view:"text",
                        name: id,
                        label: t(tranger_col.header),
                        css: "input_font_fijo",
                        readonly: is_writable?false:true,
                        type: type
                    };
                    break;
                case "integer":
                    webix_element = {
                        view:"text",
                        name: id,
                        label: t(tranger_col.header),
                        css: "input_font_fijo",
                        readonly: is_writable?false:true,
                        type: "number"
                    };
                    if(is_writable) {
                        webix_rules[id] = webix.rules.isNumber;
                    }
                    break;
                case "object":
                    webix_element = {
                        view:"text",
                        name: id,
                        label: t(tranger_col.header),
                        css: "input_font_fijo",
                        readonly: is_writable?false:true,
                        type: "text"
                    };
                    break;
                case "dict":
                    webix_element = {
                        view:"text",
                        name: id,
                        label: t(tranger_col.header),
                        css: "input_font_fijo",
                        readonly: is_writable?false:true,
                        type: "text"
                    };
                    break;
                case "array":
                    webix_element = {
                        view:"text",
                        name: id,
                        label: t(tranger_col.header),
                        css: "input_font_fijo",
                        readonly: is_writable?false:true,
                        type: "text"
                    };
                    break;
                case "list":
                    webix_element = {
                        view:"text",
                        name: id,
                        label: t(tranger_col.header),
                        css: "input_font_fijo",
                        readonly: is_writable?false:true,
                        type: "text"
                    };
                    break;
                case "real":
                    webix_element = {
                        view:"text",
                        name: id,
                        label: t(tranger_col.header),
                        css: "input_font_fijo",
                        readonly: is_writable?false:true,
                        type: "number"
                    };
                    if(is_writable) {
                        webix_rules[id] = webix.rules.isNumber;
                    }
                    break;
                case "boolean":
                    webix_element = {
                        view:"checkbox",
                        name: id,
                        label: t(tranger_col.header),
                        css: "input_font_fijo",
                        readonly: is_writable?false:true
                    };
                    break;
                case "enum":
                    webix_element = {
                        view:"text",
                        name: id,
                        label: t(tranger_col.header),
                        css: "input_font_fijo",
                        readonly: is_writable?false:true,
                        type: "text"
                    };
                    break;
                case "blob":
                    webix_element = {
                        view:"text",
                        name: id,
                        label: t(tranger_col.header),
                        css: "input_font_fijo",
                        readonly: is_writable?false:true,
                        type: "text"
                    };
                    break;
                default:
                    log_error("col type unknown:" + tranger_col.type);
                    break;
            }
            if(webix_element) {
                webix_elements.push(webix_element);
            }
        }

        return [webix_elements, webix_rules, _writable_fields];
    }

    /********************************************
     *
     ********************************************/
    function build_update_form(self, schema)
    {
        var $form = $$(build_name(self, "update_form"));
        $form.clear();

        var eles = cols2webix_form_elements(self, schema, "update");

        // redefine elements
        $form.define("elements", eles[0]);

        // redefine rules
        $form.define("rules", eles[1]);

        self.config._writable_fields = eles[2];

        $form.reconstruct();
        return $form;
    }

    /********************************************
     *
     ********************************************/
    function build_create_form(self, schema)
    {
        var $form = $$(build_name(self, "create_form"));
        $form.clear();

        var eles = cols2webix_form_elements(self, schema, "create");

        // redefine elements
        $form.define("elements", eles[0]);

        // redefine rules
        $form.define("rules", eles[1]);

        self.config._writable_fields = eles[2];

        $form.reconstruct();
        return $form;
    }

    /********************************************
     *
     ********************************************/
    function set_total(self, $table)
    {
        var data = $table.data.pull;
        var total = 0;
        if(is_object(data)) {
            total = json_object_size(data);
        } else if(is_array(data)) {
            total = data.length;
        }

        self.config.total = total;
        $$(build_name(self, "total")).setValue(total);

        $$(build_name(self, "top_table_toolbar_total")).setHTML(
            "(" + total + ")"
        );
    }

    /********************************************
     *
     ********************************************/
    function set_current_table_record(self)
    {
        var $table = $$(build_name(self, "list_table"));

        var record = $table.getSelectedItem();
        var id = $table.getSelectedId();
        var idx = $table.getIndexById(id);
        self.config.record_idx = idx + 1;
        $$(build_name(self, "record_idx")).setValue(self.config.record_idx);

        if(self.config.page_size>0) {
            self.config.page = Math.floor(idx / self.config.page_size) + 1;
            $$(build_name(self, "page")).setValue(self.config.page);
        }
    }

    /********************************************
     *
     ********************************************/
    function build_table(self)
    {
        var topic_name = self.config.topic_name;
        var schema = self.config.schema;

        /*
         *  Set topic_name in top toolbar
         */
        $$(build_name(self, "top_table_toolbar_title")).setHTML(
            "&nbsp;&nbsp;&nbsp;" + topic_name + "&nbsp;"
        );

        /*
         *  Tabla
         */
        var $table = build_list_table(self, schema);

        /*
         *  Form update
         */
        var $update = build_update_form(self, schema);

        /*
         *  Bind form to table
         */
        $update.bind($table);

        /*
         *  Form create
         */
        var $create = build_create_form(self, schema);

        /*
         *  Set table mode
         */
        self.gobj_send_event("EV_LIST_MODE", {}, self);
    }

    /********************************************
     *
     ********************************************/
    function webix_dt_collect($table, kw)
    {
        var collection = [];
        $table.eachRow(function(row) {
            var record = $table.getItem(row);
            if(kw_match_simple(record, kw)) {
                collection.push(row);
            }
        });
        return collection;
    }



            /***************************
             *      Actions
             ***************************/




    /********************************************
     *
     ********************************************/
    function ac_load_data(self, event, kw, src)
    {
        var data = kw;

        var $table = $$(build_name(self, "list_table"));

        if(self.config.with_webix_id) {
            // HACK change id by id_, in webix id is key primary, in yuneta id can be repeated.
            for(var i=0; i<data.length; i++) {
                data[i]["id_"] = data[i].id;
                delete data[i]["id"];
            }
        }
        $table.parse(data);

        if(data.length == 1) {
            if(!self.config.with_webix_id) {
                self.gobj_send_event("EV_RECORD_BY_ID", {id:data[0].id}, self);
            }
        } else if(data.length > 1) {
            self.gobj_send_event("EV_FIRST_RECORD", {}, self);
        }

        set_total(self, $table);

        return 0;
    }

    /********************************************
     *
     ********************************************/
    function ac_get_data(self, event, kw, src)
    {
        var data = [];
        var $widget = $$(build_name(self, "list_table"));

        // TODO pongo filtros?
        var ids = kwid_get_ids(kw.id);
        for(var i=0; i<ids.length; i++) {
            var id = ids[i];
            var record = $widget.getItem(id);
            data.push(record);
        }
        return data;
    }

    /********************************************
     *
     ********************************************/
    function ac_get_checked_data(self, event, kw, src)
    {
        var data = [];
        var $widget = $$(build_name(self, "list_table"));

        if(self.config.with_checkbox) {
            $widget.data.each(function(obj){
                if(obj.row) {
                    data.push(obj);
                }
            });
        }
        return data;
    }

    /********************************************
     *
     ********************************************/
    var update_check_invalid_fields = false;
    function ac_update_record(self, event, kw, src)
    {
        var $form = $$(build_name(self, "update_form"));
        if($form.validate()) {
            if(update_check_invalid_fields) {
                log_info("");
                update_check_invalid_fields = false;
            }
            var btn = $$(build_name(self, "update_record"));
            webix.html.removeCss(btn.getNode(), "icon_color_submmit");
            btn = $$(build_name(self, "undo_record"));
            webix.html.removeCss(btn.getNode(), "icon_color_cancel");
            var new_kw = filter_dict(kw, self.config._writable_fields);

            if(self.config.with_webix_id) {
                new_kw["id"] = kw["id_"];
                delete new_kw["id_"];
            }
            self.parent.gobj_send_event(
                self.config.update_record_event_name,
                new_kw,
                self
            );
            //$form.save(); update asynchronously by backend
        } else {
            update_check_invalid_fields = true;
            log_warning(t("check invalid fields"));
        }
        return 0;
    }

    /********************************************
     *
     ********************************************/
    function ac_undo_record(self, event, kw, src)
    {
        var $form = $$(build_name(self, "update_form"));
        if(update_check_invalid_fields) {
            log_info("");
            update_check_invalid_fields = false;
        }

        $form.clearValidation();

        var $widget = $$(build_name(self, "list_table"));
        var id = $widget.getSelectedId();
        if(id) {
            $widget.unselectAll();
            $widget.select(id);
        }
        var btn = $$(build_name(self, "update_record"));
        webix.html.removeCss(btn.getNode(), "icon_color_submmit");
        btn = $$(build_name(self, "undo_record"));
        webix.html.removeCss(btn.getNode(), "icon_color_cancel");

        return 0;
    }

    /********************************************
     *
     ********************************************/
    var create_check_invalid_fields = false;
    function ac_create_record(self, event, kw, src)
    {
        var $form = $$(build_name(self, "create_form"));
        if($form.validate()) {
            if(create_check_invalid_fields) {
                log_info("");
                create_check_invalid_fields = false;
            }
            var new_kw = filter_dict(kw, self.config._writable_fields);
            if(self.config.with_webix_id) {
                new_kw["id"] = kw["id_"];
                delete new_kw["id_"];
            }
            self.parent.gobj_send_event(
                self.config.create_record_event_name,
                new_kw,
                self
            );

            var btn = $$(build_name(self, "create_record"));
            webix.html.removeCss(btn.getNode(), "icon_color_submmit");
            btn = $$(build_name(self, "cancel_record"));
            webix.html.removeCss(btn.getNode(), "icon_color_cancel");
            $form.clearValidation();
            $form.clear();

            //$form.save(); new asynchronously by backend
        } else {
            create_check_invalid_fields = true;
            log_warning(t("check invalid fields"));
        }
        return 0;
    }

    /********************************************
     *
     ********************************************/
    function ac_cancel_record(self, event, kw, src)
    {
        var $form = $$(build_name(self, "create_form"));
        if(create_check_invalid_fields) {
            log_info("");
            create_check_invalid_fields = false;
        }

        $form.clearValidation();
        $form.clear();

        var btn = $$(build_name(self, "create_record"));
        webix.html.removeCss(btn.getNode(), "icon_color_submmit");
        btn = $$(build_name(self, "cancel_record"));
        webix.html.removeCss(btn.getNode(), "icon_color_cancel");

        // TODO refresh
        return 0;
    }

    /********************************************
     *
     ********************************************/
    function ac_list_mode(self, event, kw, src)
    {
        self.config.current_mode = "list";

        $$(build_name(self, "list_table")).show();

        return 0;
    }

    /********************************************
     *
     ********************************************/
    function ac_update_mode(self, event, kw, src)
    {
        self.config.current_mode = "update";

        $$(build_name(self, "update_form_window")).show();

        return 0;
    }

    /********************************************
     *
     ********************************************/
    function ac_create_mode(self, event, kw, src)
    {
        self.config.current_mode = "create";

        $$(build_name(self, "create_form_window")).show();

        return 0;
    }

    /********************************************
     *
     ********************************************/
    function ac_first_record(self, event, kw, src)
    {
        var $widget = $$(build_name(self, "list_table"));
        var id = $widget.getFirstId();
        if(id) {
            $widget.select(id);
        }

        return 0;
    }

    /********************************************
     *
     ********************************************/
    function ac_previous_page(self, event, kw, src)
    {
        if(self.config.page_size>0) {
            var page = self.config.page;
            page--;
            if(page > 0) {
                self.gobj_send_event("EV_PAGE", {page:page}, self);
            }
        }
        return 0;
    }

    /********************************************
     *
     ********************************************/
    function ac_previous_record(self, event, kw, src)
    {
        var $widget = $$(build_name(self, "list_table"));
        var id = $widget.getPrevId($widget.getSelectedId());
        if(id) {
            $widget.select(id);
        }
        return 0;
    }

    /********************************************
     *
     ********************************************/
    function ac_next_record(self, event, kw, src)
    {
        var $widget = $$(build_name(self, "list_table"));
        var id = $widget.getNextId($widget.getSelectedId());
        if(id) {
            $widget.select(id);
        }
        return 0;
    }

    /********************************************
     *
     ********************************************/
    function ac_next_page(self, event, kw, src)
    {
        if(self.config.page_size>0) {
            var page = self.config.page;
            page++;
            if(page <= self.config.total/self.config.page_size) {
                self.gobj_send_event("EV_PAGE", {page:page}, self);
            }
        }
        return 0;
    }

    /********************************************
     *
     ********************************************/
    function ac_last_record(self, event, kw, src)
    {
        var $widget = $$(build_name(self, "list_table"));
        var id = $widget.getLastId();
        if(id) {
            $widget.select(id);
        }
        return 0;
    }

    /********************************************
     *
     ********************************************/
    function ac_record_by_idx(self, event, kw, src)
    {
        var $widget = $$(build_name(self, "list_table"));
        var idx = kw.record_idx -1;

        if(idx >= 0 && idx < self.config.total) {
            var id = $widget.getIdByIndex(idx);
            $widget.select(id);
        } else {
            var id = $widget.getSelectedId();
            $widget.unselectAll();
            $widget.select(id);
        }
        return 0;
    }

    /********************************************
     *
     ********************************************/
    function ac_record_by_id(self, event, kw, src)
    {
        var $widget = $$(build_name(self, "list_table"));
        $widget.select(kw.id);
        $widget.showItem(kw.id);
        return 0;
    }

    /********************************************
     *
     ********************************************/
    function ac_page(self, event, kw, src)
    {
        var $widget = $$(build_name(self, "list_table"));
        var page = kw.page;

        var idx = ((page-1) * self.config.page_size);

        if(idx >= 0 && idx < self.config.total) {
            var id = $widget.getIdByIndex(idx);
            self.config.page = page;
            $widget.select(id);
        } else {
            var id = $widget.getSelectedId();
            $widget.unselectAll();
            $widget.select(id);
        }
        return 0;
    }

    /********************************************
     *
     ********************************************/
    function ac_rebuild_table(self, event, kw, src)
    {
        if(kw_has_key(kw, "topic_name")) {
            // Parameters can be passed here as event's attrs
            //  or with previously attributes writing
            self.config.topic_name = kw_get_str(kw, "topic_name", "", 0);
            self.config.schema = kw_get_dict_value(kw, "schema", [], 0);
        }
        build_table(self);
        return 0;
    }

    /********************************************
     *
     ********************************************/
    function ac_clear_data(self, event, kw, src)
    {
        var $table = $$(build_name(self, "list_table"));
        if(json_object_size(kw)==0) {
            $table.clearAll();
        } else {
            var collection = webix_dt_collect($table, kw);
            $table.remove(collection);
        }

        self.gobj_send_event("EV_UNDO_RECORD", {}, self);
        self.gobj_send_event("EV_CANCEL_RECORD", {}, self);

        set_total(self, $table);

        return 0;
    }

    /********************************************
     *
     ********************************************/
    function ac_refresh(self, event, kw, src)
    {
        var $table = $$(build_name(self, "list_table"));
        $table.clearAll();

        self.gobj_send_event("EV_UNDO_RECORD", {}, self);
        self.gobj_send_event("EV_CANCEL_RECORD", {}, self);

        self.parent.gobj_send_event(
            self.config.refresh_data_event_name,
            {},
            self
        );

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
            "EV_UPDATE_RECORD",
            "EV_UNDO_RECORD",
            "EV_GET_DATA",
            "EV_GET_CHECKED_DATA",
            "EV_CREATE_RECORD",
            "EV_CANCEL_RECORD",
            "EV_LIST_MODE",
            "EV_UPDATE_MODE",
            "EV_CREATE_MODE",
            "EV_FIRST_RECORD",
            "EV_PREVIOUS_PAGE",
            "EV_PREVIOUS_RECORD",
            "EV_NEXT_RECORD",
            "EV_NEXT_PAGE",
            "EV_LAST_RECORD",
            "EV_RECORD_BY_IDX",
            "EV_RECORD_BY_ID",
            "EV_PAGE",
            "EV_REBUILD_TABLE",
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
                ["EV_UPDATE_RECORD",            ac_update_record,           undefined],
                ["EV_UNDO_RECORD",              ac_undo_record,             undefined],
                ["EV_GET_DATA",                 ac_get_data,                undefined],
                ["EV_GET_CHECKED_DATA",         ac_get_checked_data,        undefined],
                ["EV_CREATE_RECORD",            ac_create_record,           undefined],
                ["EV_CANCEL_RECORD",            ac_cancel_record,           undefined],
                ["EV_LIST_MODE",                ac_list_mode,               undefined],
                ["EV_UPDATE_MODE",              ac_update_mode,             undefined],
                ["EV_CREATE_MODE",              ac_create_mode,             undefined],
                ["EV_FIRST_RECORD",             ac_first_record,            undefined],
                ["EV_PREVIOUS_PAGE",            ac_previous_page,           undefined],
                ["EV_PREVIOUS_RECORD",          ac_previous_record,         undefined],
                ["EV_NEXT_RECORD",              ac_next_record,             undefined],
                ["EV_NEXT_PAGE",                ac_next_page,               undefined],
                ["EV_LAST_RECORD",              ac_last_record,             undefined],
                ["EV_RECORD_BY_IDX",            ac_record_by_idx,           undefined],
                ["EV_RECORD_BY_ID",             ac_record_by_id,            undefined],
                ["EV_PAGE",                     ac_page,                    undefined],
                ["EV_REBUILD_TABLE",            ac_rebuild_table,           undefined],
                ["EV_REFRESH",                  ac_refresh,                 undefined],
                ["EV_SELECT",                   ac_select,                  undefined]
            ]
        }
    };

    var Ui_formtable = GObj.__makeSubclass__();
    var proto = Ui_formtable.prototype; // Easy access to the prototype
    proto.__init__= function(name, kw) {
        GObj.prototype.__init__.call(
            this,
            FSM,
            CONFIG,
            name,
            "Ui_formtable",
            kw,
            0
        );
        return this;
    };
    gobj_register_gclass(Ui_formtable, "Ui_formtable");




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
        build_table(self);
    }

    /************************************************
     *      Framework Method destroy
     *      In this point, all childs
     *      and subscriptions are already deleted.
     ************************************************/
    proto.mt_destroy = function()
    {
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
    exports.Ui_formtable = Ui_formtable;

})(this);
