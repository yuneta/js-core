/***********************************************************************
 *          mx_example.js
 *
 *          Mxgrah example
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

        layout_options: [
            {
                id: "tree_layout",
                value: "Compact Tree Layout",
                layout: function(layout_option, graph) {
                    // Enables automatic layout on the graph and installs
                    // a tree layout for all groups who's children are
                    // being changed, added or removed.
                    var layout = new mxCompactTreeLayout(graph, false);
                    layout.useBoundingBox = false;
                    layout.edgeRouting = false;
                    layout.levelDistance = 30;
                    layout.nodeDistance = 10;
                    return layout;
                }
            },

            {
                id: "edgeLabel_layout",
                value: "EdgeLabel Layout",
                layout: function(layout_option, graph) {
                    var layout = new mxEdgeLabelLayout(graph);
                    return layout;
                }
            },
            {
                id: "parallelEdge_layout",
                value: "ParallelEdge Layout",
                layout: function(layout_option, graph) {
                    var layout = new mxParallelEdgeLayout(graph);
                    return layout;
                }
            },
            {
                id: "partition_layout",
                value: "Partition Layout",
                layout: function(layout_option, graph) {
                    var layout = new mxPartitionLayout(graph);
                    return layout;
                }
            },
            {
                id: "radial_layout",
                value: "Radial Layout",
                layout: function(layout_option, graph) {
                    var layout = new mxRadialTreeLayout(graph);
                    return layout;
                }
            },
            {
                id: "stack_layout",
                value: "Stack Layout",
                layout: function(layout_option, graph) {
                    var layout = new  mxStackLayout(graph);
                    return layout;
                }
            },
            {
                id: "swimlane_layout",
                value: "Swimlane Layout",
                layout: function(layout_option, graph) {
                    var layout = new mxSwimlaneLayout(graph);
                    return layout;
                }
            },


            {
                id: "herarchical_layout",
                value: "Herarchical Layout",
                layout: function(layout_option, graph) {
                    var layout = new mxHierarchicalLayout(graph);
                    return layout;
                }
            },
            {
                id: "fastorganic_layout",
                value: "FastOrganic Layout",
                layout: function(layout_option, graph) {
                    var layout = new mxFastOrganicLayout(graph);
                    return layout;
                }
            },
            {
                id: "circle_layout",
                value: "Circle Layout",
                layout: function(layout_option, graph) {
                    var layout = new mxCircleLayout(graph);
                    return layout;
                }
            }

        ],

        vertex_cx: 140,
        vertex_cy: 100,

        layers: [
            {
                id: "__mx_default_layer__"
            }
        ],
        _mxgraph: null,

        layout_selected: "herarchical_layout",

        __writable_attrs__: [
            "layout_selected"
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
        if(self.config._mxgraph) {
            self.config._mxgraph.destroy();
            self.config._mxgraph = null;
        }
        build_webix(self);
        self.config._mxgraph = $$(build_name(self, "mxgraph")).getMxgraph();

        initialize_mxgraph(self);
        rebuild_layouts(self);
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
                {
                    view: "richselect",
                    id: build_name(self, "layout_options"),
                    tooltip: t("Select layout"),
                    width: 180,
                    options: self.config.layout_options,
                    value: self.config.layout_selected,
                    label: "",
                    on: {
                        onChange(newVal, oldVal) {
                            var cur_layout = kwid_collect(
                                self.config.layout_options,
                                newVal,
                                null, null
                            )[0];
                            if(!cur_layout) {
                                cur_layout = self.config.layout_options[0];
                            }
                            self.config.layout_selected = cur_layout.id;

                            execute_layout(self);

                            if(self.gobj_is_unique()) {
                                self.gobj_save_persistent_attrs();
                            }
                        }
                    }
                },
                {
                    view:"button",
                    type: "icon",
                    icon: "fad fa-compress-arrows-alt",
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
                    icon: "fad fa-expand-arrows-alt",
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
                    icon: "far fa-search-plus",
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
                    icon: "far fa-search-minus",
                    css: "webix_transparent icon_toolbar_16",
                    maxWidth: 120,
                    label: t("zoom out"),
                    click: function() {
                        self.config._mxgraph.zoomOut();
                        self.config._mxgraph.view.setTranslate(0, 0);
                    }
                }
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
                    view: "mxgraph",
                    id: build_name(self, "mxgraph"),
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
         *  Inform of panel viewed to "Container Panel"
         *----------------------------------------------*/
        self.config.$ui.attachEvent("onViewShow", function() {
            self.parent.gobj_send_event("EV_ON_VIEW_SHOW", self, self);
        });
    }

    /********************************************
     *  Rebuild layouts
     ********************************************/
    function rebuild_layouts(self)
    {
        for(var i=0; i<self.config.layout_options.length; i++) {
            var layout = self.config.layout_options[i];
            layout.exe = layout.layout(layout, self.config._mxgraph);
        }
    }

    /********************************************
     *  Execute layout
     ********************************************/
    function execute_layout(self)
    {
        var graph = self.config._mxgraph;
        var group = get_layer(self, "layer?");

        var cur_layout = kwid_collect(
            self.config.layout_options,
            self.config.layout_selected,
            null, null
        )[0];
        if(!cur_layout) {
            cur_layout = self.config.layout_options[0];
        }

        if(cur_layout) {
            graph.getModel().beginUpdate();
            try {
                cur_layout.exe.execute(group);
            } catch (e) {
                log_error(e);
            } finally {
                graph.getModel().endUpdate();
            }
        }
    }

    /********************************************
     *  Create root and layers
     ********************************************/
    function create_root_and_layers(graph, layers)
    {
        var root = null;
        if(layers && layers.length) { // TODO
            root = new mxCell();
            root.setId("__mx_root__");

            for(var i=0; i<layers.length; i++) {
                var layer = layers[i];

                // Create the layer
                var __mx_cell__ = root.insert(new mxCell());

                // Set reference
                layer["__mx_cell__"] = __mx_cell__;

                var id = kw_get_str(layer, "id", null, false);
                if(id) {
                    __mx_cell__.setId(id);
                }
            }
        } else {
            root = graph.getModel().createRoot()
        }

        graph.getModel().beginUpdate();
        try {
            graph.getModel().setRoot(root);
        } catch (e) {
            log_error(e);
        } finally {
            graph.getModel().endUpdate();
        }
    }

    /********************************************
     *
     ********************************************/
    function initialize_mxgraph(self)
    {
        var graph = self.config._mxgraph;
        var model = graph.getModel();

        // Defines an icon for creating new connections in the connection handler.
        // This will automatically disable the highlighting of the source vertex.
        mxConnectionHandler.prototype.connectImage = new mxImage(
            '/static/app/images/yuneta/circle_red.svg', 16, 16
        );

        // Auto-resizes the container
        graph.border = 80;
        graph.getView().translate = new mxPoint(graph.border/2, graph.border/2);
//         graph.setResizeContainer(true);
        graph.graphHandler.setRemoveCellsFromParent(false);

        // Changes the default vertex style in-place
        var style = graph.getStylesheet().getDefaultVertexStyle();
        style[mxConstants.STYLE_SHAPE] = mxConstants.SHAPE_SWIMLANE;
        style[mxConstants.STYLE_VERTICAL_ALIGN] = 'middle';
        style[mxConstants.STYLE_LABEL_BACKGROUNDCOLOR] = 'white';
        style[mxConstants.STYLE_FONTSIZE] = 11;
        style[mxConstants.STYLE_STARTSIZE] = 22;
        style[mxConstants.STYLE_HORIZONTAL] = false;
        style[mxConstants.STYLE_FONTCOLOR] = 'black';
        style[mxConstants.STYLE_STROKECOLOR] = 'black';
        delete style[mxConstants.STYLE_FILLCOLOR];

        style = mxUtils.clone(style);
        style[mxConstants.STYLE_SHAPE] = mxConstants.SHAPE_RECTANGLE;
        style[mxConstants.STYLE_FONTSIZE] = 10;
        style[mxConstants.STYLE_ROUNDED] = true;
        style[mxConstants.STYLE_HORIZONTAL] = true;
        style[mxConstants.STYLE_VERTICAL_ALIGN] = 'middle';
        delete style[mxConstants.STYLE_STARTSIZE];
        style[mxConstants.STYLE_LABEL_BACKGROUNDCOLOR] = 'none';
        graph.getStylesheet().putCellStyle('process', style);

        style = mxUtils.clone(style);
        style[mxConstants.STYLE_SHAPE] = mxConstants.SHAPE_ELLIPSE;
        style[mxConstants.STYLE_PERIMETER] = mxPerimeter.EllipsePerimeter;
        delete style[mxConstants.STYLE_ROUNDED];
        graph.getStylesheet().putCellStyle('state', style);

        style = mxUtils.clone(style);
        style[mxConstants.STYLE_SHAPE] = mxConstants.SHAPE_RHOMBUS;
        style[mxConstants.STYLE_PERIMETER] = mxPerimeter.RhombusPerimeter;
        style[mxConstants.STYLE_VERTICAL_ALIGN] = 'top';
        style[mxConstants.STYLE_SPACING_TOP] = 40;
        style[mxConstants.STYLE_SPACING_RIGHT] = 64;
        graph.getStylesheet().putCellStyle('condition', style);

        style = mxUtils.clone(style);
        style[mxConstants.STYLE_SHAPE] = mxConstants.SHAPE_DOUBLE_ELLIPSE;
        style[mxConstants.STYLE_PERIMETER] = mxPerimeter.EllipsePerimeter;
        style[mxConstants.STYLE_SPACING_TOP] = 28;
        style[mxConstants.STYLE_FONTSIZE] = 14;
        style[mxConstants.STYLE_FONTSTYLE] = 1;
        delete style[mxConstants.STYLE_SPACING_RIGHT];
        graph.getStylesheet().putCellStyle('end', style);

        style = graph.getStylesheet().getDefaultEdgeStyle();
        style[mxConstants.STYLE_EDGE] = mxEdgeStyle.ElbowConnector;
        style[mxConstants.STYLE_ENDARROW] = mxConstants.ARROW_BLOCK;
        style[mxConstants.STYLE_ROUNDED] = true;
        style[mxConstants.STYLE_FONTCOLOR] = 'black';
        style[mxConstants.STYLE_STROKECOLOR] = 'black';

        style = mxUtils.clone(style);
        style[mxConstants.STYLE_DASHED] = true;
        style[mxConstants.STYLE_ENDARROW] = mxConstants.ARROW_OPEN;
        style[mxConstants.STYLE_STARTARROW] = mxConstants.ARROW_OVAL;
        graph.getStylesheet().putCellStyle('crossover', style);

        // Installs double click on middle control point and
        // changes style of edges between empty and this value
        graph.alternateEdgeStyle = 'elbow=vertical';

        // Adds automatic layout and various switches if the
        // graph is enabled
        if (graph.isEnabled())
        {
            // Allows new connections but no dangling edges
            graph.setConnectable(true);
            graph.setAllowDanglingEdges(false);

            // End-states are no valid sources
            var previousIsValidSource = graph.isValidSource;

            graph.isValidSource = function(cell)
            {
                if (previousIsValidSource.apply(this, arguments))
                {
                    var style = this.getModel().getStyle(cell);

                    return style == null || !(style == 'end' || style.indexOf('end') == 0);
                }

                return false;
            };

            // Start-states are no valid targets, we do not
            // perform a call to the superclass function because
            // this would call isValidSource
            // Note: All states are start states in
            // the example below, so we use the state
            // style below
            graph.isValidTarget = function(cell)
            {
                var style = this.getModel().getStyle(cell);

                return !this.getModel().isEdge(cell) && !this.isSwimlane(cell) &&
                    (style == null || !(style == 'state' || style.indexOf('state') == 0));
            };

            // Allows dropping cells into new lanes and
            // lanes into new pools, but disallows dropping
            // cells on edges to split edges
            graph.setDropEnabled(true);
            graph.setSplitEnabled(false);

            // Returns true for valid drop operations
            graph.isValidDropTarget = function(target, cells, evt)
            {
                if (this.isSplitEnabled() && this.isSplitTarget(target, cells, evt))
                {
                    return true;
                }

                var model = this.getModel();
                var lane = false;
                var pool = false;
                var cell = false;

                // Checks if any lanes or pools are selected
                for (var i = 0; i < cells.length; i++)
                {
                    var tmp = model.getParent(cells[i]);
                    lane = lane || this.isPool(tmp);
                    pool = pool || this.isPool(cells[i]);

                    cell = cell || !(lane || pool);
                }

                return !pool && cell != lane && ((lane && this.isPool(target)) ||
                    (cell && this.isPool(model.getParent(target))));
            };

            // Adds new method for identifying a pool
            graph.isPool = function(cell)
            {
                var model = this.getModel();
                var parent = model.getParent(cell);

                return parent != null && model.getParent(parent) == model.getRoot();
            };

            // Changes swimlane orientation while collapsed
            graph.model.getStyle = function(cell)
            {
                var style = mxGraphModel.prototype.getStyle.apply(this, arguments);

                if (graph.isCellCollapsed(cell))
                {
                    if (style != null)
                    {
                        style += ';';
                    }
                    else
                    {
                        style = '';
                    }

                    style += 'horizontal=1;align=left;spacingLeft=14;';
                }

                return style;
            };

            // Keeps widths on collapse/expand
            var foldingHandler = function(sender, evt)
            {
                var cells = evt.getProperty('cells');

                for (var i = 0; i < cells.length; i++)
                {
                    var geo = graph.model.getGeometry(cells[i]);

                    if (geo.alternateBounds != null)
                    {
                        geo.width = geo.alternateBounds.width;
                    }
                }
            };

            graph.addListener(mxEvent.FOLD_CELLS, foldingHandler);
        }

        // Applies size changes to siblings and parents
//         new mxSwimlaneManager(graph);

        // Creates a stack depending on the orientation of the swimlane
        var layout = new mxStackLayout(graph, false);

        // Makes sure all children fit into the parent swimlane
        layout.resizeParent = true;

        // Applies the size to children if parent size changes
        layout.fill = true;

        // Only update the size of swimlanes
        layout.isVertexIgnored = function(vertex)
        {
            return !graph.isSwimlane(vertex);
        }

        // Keeps the lanes and pools stacked
        var layoutMgr = new mxLayoutManager(graph);

        layoutMgr.getLayout = function(cell)
        {
            if (!model.isEdge(cell) && graph.getModel().getChildCount(cell) > 0 &&
                (model.getParent(cell) == model.getRoot() || graph.isPool(cell)))
            {
                layout.fill = graph.isPool(cell);

                return layout;
            }

            return null;
        };

        // Gets the default parent for inserting new cells. This
        // is normally the first child of the root (ie. layer 0).
        var parent = graph.getDefaultParent();

        // Adds cells to the model in a single step
        model.beginUpdate();
        try
        {
            var pool1 = graph.insertVertex(parent, null, 'Pool 1', 0, 0, 640, 0);
            pool1.setConnectable(false);

            var lane1a = graph.insertVertex(pool1, null, 'Lane A', 0, 0, 640, 110);
            lane1a.setConnectable(false);

            var lane1b = graph.insertVertex(pool1, null, 'Lane B', 0, 0, 640, 110);
            lane1b.setConnectable(false);

            var pool2 = graph.insertVertex(parent, null, 'Pool 2', 0, 0, 640, 0);
            pool2.setConnectable(false);

            var lane2a = graph.insertVertex(pool2, null, 'Lane A', 0, 0, 640, 140);
            lane2a.setConnectable(false);

            var lane2b = graph.insertVertex(pool2, null, 'Lane B', 0, 0, 640, 110);
            lane2b.setConnectable(false);

            var start1 = graph.insertVertex(lane1a, null, null, 40, 40, 30, 30, 'state');
            var end1 = graph.insertVertex(lane1a, null, 'A', 560, 40, 30, 30, 'end');

            var step1 = graph.insertVertex(lane1a, null, 'Contact\nProvider', 90, 30, 80, 50, 'process');
            var step11 = graph.insertVertex(lane1a, null, 'Complete\nAppropriate\nRequest', 190, 30, 80, 50, 'process');
            var step111 = graph.insertVertex(lane1a, null, 'Receive and\nAcknowledge', 385, 30, 80, 50, 'process');

            var start2 = graph.insertVertex(lane2b, null, null, 40, 40, 30, 30, 'state');

            var step2 = graph.insertVertex(lane2b, null, 'Receive\nRequest', 90, 30, 80, 50, 'process');
            var step22 = graph.insertVertex(lane2b, null, 'Refer to Tap\nSystems\nCoordinator', 190, 30, 80, 50, 'process');

            var step3 = graph.insertVertex(lane1b, null, 'Request 1st-\nGate\nInformation', 190, 30, 80, 50, 'process');
            var step33 = graph.insertVertex(lane1b, null, 'Receive 1st-\nGate\nInformation', 290, 30, 80, 50, 'process');

            var step4 = graph.insertVertex(lane2a, null, 'Receive and\nAcknowledge', 290, 20, 80, 50, 'process');
            var step44 = graph.insertVertex(lane2a, null, 'Contract\nConstraints?', 400, 20, 50, 50, 'condition');
            var step444 = graph.insertVertex(lane2a, null, 'Tap for gas\ndelivery?', 480, 20, 50, 50, 'condition');

            var end2 = graph.insertVertex(lane2a, null, 'B', 560, 30, 30, 30, 'end');
            var end3 = graph.insertVertex(lane2a, null, 'C', 560, 84, 30, 30, 'end');

            var e = null;

            graph.insertEdge(lane1a, null, null, start1, step1);
            graph.insertEdge(lane1a, null, null, step1, step11);
            graph.insertEdge(lane1a, null, null, step11, step111);

            graph.insertEdge(lane2b, null, null, start2, step2);
            graph.insertEdge(lane2b, null, null, step2, step22);
            graph.insertEdge(parent, null, null, step22, step3);

            graph.insertEdge(lane1b, null, null, step3, step33);
            graph.insertEdge(lane2a, null, null, step4, step44);
            graph.insertEdge(lane2a, null, 'No', step44, step444, 'verticalAlign=bottom');
            graph.insertEdge(parent, null, 'Yes', step44, step111, 'verticalAlign=bottom;horizontal=0;labelBackgroundColor=white;');

            graph.insertEdge(lane2a, null, 'Yes', step444, end2, 'verticalAlign=bottom');
            e = graph.insertEdge(lane2a, null, 'No', step444, end3, 'verticalAlign=top');
            e.geometry.points = [new mxPoint(step444.geometry.x + step444.geometry.width / 2,
                end3.geometry.y + end3.geometry.height / 2)];

            graph.insertEdge(parent, null, null, step1, step2, 'crossover');
            graph.insertEdge(parent, null, null, step3, step11, 'crossover');
            e = graph.insertEdge(lane1a, null, null, step11, step33, 'crossover');
            e.geometry.points = [new mxPoint(step33.geometry.x + step33.geometry.width / 2 + 20,
                        step11.geometry.y + step11.geometry.height * 4 / 5)];
            graph.insertEdge(parent, null, null, step33, step4);
            graph.insertEdge(lane1a, null, null, step111, end1);
        }
        finally
        {
            // Updates the display
            model.endUpdate();
        }
    }

    /************************************************************
     *
     ************************************************************/
    function get_layer(self, layer)
    {
// TODO        var layers = self.config.layers;
//         for(var i=0; i<layers.length; i++) {
//             if(layers[i].id == layer) {
//                 return layers[i].__mx_cell__;
//             }
//         }
//         var x = self.config._mxgraph.getModel().getCell(layer);
        return self.config._mxgraph.getDefaultParent();
    }




            /***************************
             *      Actions
             ***************************/




    /********************************************
     *
     ********************************************/
    function ac_click_item(self, event, kw, src)
    {
        var graph = self.config._mxgraph;

        var cell = graph.model.getCell(kw.id);
        if(cell) {
            /*
             *  Simula un click !!!
             */
            graph.fireEvent(
                new mxEventObject(
                    mxEvent.CLICK, 'event', {}, 'cell', cell
                ),
                cell
            );
        }
    }

    /********************************************
     *
     ********************************************/
    function ac_select_item(self, event, kw, src)
    {
        var cell = self.config._mxgraph.model.getCell(kw.id);
        self.config._mxgraph.setSelectionCell(cell);

        return 0;
    }

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
        // Get current index, remove UI from parent, re-build UI, add UI to parent with same idx.
        var idx = self.config.$container_parent.index(self.config.$ui);
        if(idx < 0) {
            return -1;
        }
        self.config.$container_parent.removeView(self.config.$ui);
        rebuild(self);
        self.config.$container_parent.addView(self.config.$ui, idx);
        self.config.$ui.show();

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
            "EV_SELECT_ITEM",
            "EV_LOAD_DATA",
            "EV_CLEAR_DATA",
            "EV_CLICK_ITEM",
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
                ["EV_SELECT_ITEM",          ac_select_item,     undefined],
                ["EV_LOAD_DATA",            ac_load_data,       undefined],
                ["EV_CLEAR_DATA",           ac_clear_data,      undefined],
                ["EV_CLICK_ITEM",           ac_click_item,      undefined],
                ["EV_SELECT",               ac_select,          undefined],
                ["EV_REFRESH",              ac_refresh,         undefined],
                ["EV_REBUILD_PANEL",        ac_rebuild_panel,   undefined]
            ]
        }
    };

    var Mx_example = GObj.__makeSubclass__();
    var proto = Mx_example.prototype; // Easy access to the prototype
    proto.__init__= function(name, kw) {
        GObj.prototype.__init__.call(
            this,
            FSM,
            CONFIG,
            name,
            "Mx_example",
            kw,
            0
        );
        return this;
    };
    gobj_register_gclass(Mx_example, "Mx_example");




            /***************************
             *      Framework Methods
             ***************************/




    /************************************************
     *      Framework Method create
     ************************************************/
    proto.mt_create = function(kw)
    {
        var self = this;

        var cur_layout = kwid_collect(
            self.config.layout_options,
            self.config.layout_selected,
            null, null
        )[0];
        if(!cur_layout) {
            cur_layout = self.config.layout_options[0];
        }
        self.config.layout_selected = cur_layout.id;

        rebuild(self);

        $$(build_name(self, "layout_options")).define("options", self.config.layout_options);
        $$(build_name(self, "layout_options")).setValue(cur_layout.id);
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
            self.config._mxgraph = null;
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
    exports.Mx_example = Mx_example;

})(this);
