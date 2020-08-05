/***********************************************************************
 *          ui_mxgraph.js
 *
 *          Wrapper for mxGraph
 *
 *          Copyright (c) 2020 Niyamaka
 *          All Rights Reserved.
 ***********************************************************************/
(function (exports) {
    'use strict';

    /********************************************
     *      Configuration (C attributes)
     ********************************************/
    var CONFIG = {
        layers: null,
        back_layers: null,
        graph: null,
        model: null,
        cx: null,
        cy: null,

        timeout_idle: 1                 // idle timeout, in seconds
    };




            /***************************
             *      Local Methods
             ***************************/




    /********************************************
     *  Create the entries in the popupmenu
     ********************************************/
    function createPopupMenu(graph, menu, cell, evt)
    {
        if (cell != null)
        {
            menu.addItem('Cell Item', null, function()
            {
                mxUtils.alert('MenuItem1');
            });
        }
        else
        {
            menu.addItem('No-Cell Item', null, function()
            {
                mxUtils.alert('MenuItem2');
            });
        }
        menu.addSeparator();
        menu.addItem('MenuItem3', null, function()
        {
            mxUtils.alert('MenuItem3: '+graph.getSelectionCount()+' selected');
        });
    }


    /********************************************
     *  Configure graph
     ********************************************/
    function configure_graph(self, graph)
    {
        // Disables all built-in interactions,
        // basic selection and cell handling
        //graph.setEnabled(false);

        // Highlights the vertices when the mouse enters
        var highlight = new mxCellTracker(graph, '#C8DCFF');

        graph.setPanning(true);
        graph.setTooltips(true);
//         graph.setConnectable(true);

        // Enables rubberband (marquee) selection and a handler
        // for basic keystrokes (eg. return, escape during editing).
        var rubberband = new mxRubberband(graph);
        var keyHandler = new mxKeyHandler(graph);

        // Installs a custom tooltip for cells
//         graph.getTooltipForCell = function(cell)
//         {
//             return 'Ops!';
//         }

        // Disables built-in context menu WARNING falla en la segunda pestaña
        //mxEvent.disableContextMenu(container);

        // Installs a popupmenu handler using local function (see below).
//         graph.popupMenuHandler.factoryMethod = function(menu, cell, evt)
//         {
//             return createPopupMenu(graph, menu, cell, evt);
//         };

        // Handles clicks on cells
//         graph.addListener(mxEvent.CLICK, function(sender, evt)
//         {
//             var cell = evt.getProperty('cell');
//
//             if (cell != null)
//             {
//                 webix.message('KK');
//             }
//         });

        // Changes the default vertex style in-place
        var style = graph.getStylesheet().getDefaultVertexStyle();
        style[mxConstants.STYLE_SHAPE] = mxConstants.SHAPE_RECTANGLE;
        style[mxConstants.STYLE_PERIMETER] = mxPerimeter.RectanglePerimeter;
        style[mxConstants.STYLE_GRADIENTCOLOR] = 'white';
        style[mxConstants.STYLE_PERIMETER_SPACING] = 0;
        style[mxConstants.STYLE_ROUNDED] = true;
        style[mxConstants.STYLE_SHADOW] = true;


        // Changes the default vertex style in-place
//         var style = graph.getStylesheet().getDefaultVertexStyle();
//         style[mxConstants.STYLE_SHAPE] = mxConstants.SHAPE_ELLIPSE;
//         style[mxConstants.STYLE_PERIMETER] = mxPerimeter.EllipsePerimeter;
//         style[mxConstants.STYLE_GRADIENTCOLOR] = 'white';
//         style[mxConstants.STYLE_FONTSIZE] = '10';

// Con estos estilos puedo crear una nube para el vertex.
//         style[mxConstants.STYLE_SHAPE] = 'label';
//         style[mxConstants.STYLE_VERTICAL_ALIGN] = 'bottom';
//         style[mxConstants.STYLE_INDICATOR_SHAPE] = 'ellipse';
//         style[mxConstants.STYLE_INDICATOR_WIDTH] = 34;
//         style[mxConstants.STYLE_INDICATOR_HEIGHT] = 34;
//         style[mxConstants.STYLE_IMAGE_VERTICAL_ALIGN] = 'top'; // indicator v-alignment
//         style[mxConstants.STYLE_IMAGE_ALIGN] = 'center';
//         style[mxConstants.STYLE_INDICATOR_COLOR] = 'green';
//         delete style[mxConstants.STYLE_STROKECOLOR]; // transparent
//         delete style[mxConstants.STYLE_FILLCOLOR]; // transparent

        // Sets the default edge style
//         style = graph.getStylesheet().getDefaultEdgeStyle();
//         style[mxConstants.STYLE_ROUNDED] = true;
        //style[mxConstants.STYLE_EDGE] = mxEdgeStyle.ElbowConnector;

        // Enables snapping waypoints to terminals
        //mxEdgeHandler.prototype.snapToTerminals = true;


        // Ports are not used as terminals for edges, they are
        // only used to compute the graphical connection point
        graph.isPort = function(cell)
        {
            var geo = this.getCellGeometry(cell);

            return (geo != null) ? geo.relative : false;
        };

        // Removes the folding icon and disables any folding
        graph.isCellFoldable = function(cell)
        {
            return false;
        };

        // Enables moving of vertex labels
        graph.vertexLabelsMovable = true;
        graph.edgeLabelsMovable = false;

        return graph;
    }

    /********************************************
     *
     ********************************************/
    function create_graph(self, cx, cy, layers)
    {
        var layer_width = cx/layers.length;
        var root = new mxCell();
        for(var i=0; i<layers.length; i++) {
            var layer = layers[i];
            layer.x_org = layer_width * i;
            layer.y_org = 50;
            var id = kw_get_str(layer, "id", null);
            if(id) {
                var hv_layer = root.insert(new mxCell());
                hv_layer.setId(id);
                layer["hv_layer"] = hv_layer;
            }
        }
        var model = new mxGraphModel(root);
        var container = document.getElementById(self.name);
        var graph = new mxGraph(container, model);
        graph["gobj"] = self;
        graph["layout"] = new mxGraphLayout(graph);
        configure_graph(self, graph);

        /*
         *  Crea los elementos huerfanos
         */
        var model = graph.getModel();
        model.beginUpdate();
        try {
            for(var i=0; i<layers.length; i++) {
                var layer = layers[i];
                var hv_layer = layer.hv_layer;
                if(hv_layer) {
                    var hv_huerfano = layer["hv_huerfano"] = graph.insertVertex(
                        hv_layer,
                        "huerfano-" + hv_layer.getId(),
                        hv_layer.getId(),
                        layer.x_org+40, 20, 4, 4,
                        "fontSize=12;" +
                        "verticalLabelPosition=top;verticalAlign=bottom;"
                        //"shape=image;image=images/icons48/keys.png;"
                        //"labelPosition=left;align=right;" ONLY with images?
                        //"labelPosition=right;align=left;"
                        //"verticalLabelPosition=bottom;verticalAlign=top;"
                        //"verticalLabelPosition=top;verticalAlign=bottom;"
                    );
                }
            }
        } finally {
            // Updates the display
            model.endUpdate();
        }
        self.config.graph = graph;
        self.config.model = model;
        return graph;
    }

    /********************************************
     *
     ********************************************/
    function insert_hardcoded_components(self, layers)
    {
        for(var i=0; i<layers.length; i++) {
            var layer = layers[i];
            recoloca_components(self, layer);
            var components = kw_get_dict_value(layer, "components", null);
            if(components && (components instanceof Array)) {
                for(var j=0; j<components.length; j++) {
                    var component = components[j];
                    create_component(self, layer, component, null);
                }
            }
        }
    }

    /********************************************
     *
     ********************************************/
    function recoloca_components(self, layer)
    {
        var graph = self.config.graph;
        var model = graph.getModel();

        var model = self.config.graph.getModel();
        model.beginUpdate();
        try {
            var y = layer.y_org;
            var components = kw_get_dict_value(layer, "components", null);
            if(components && (components instanceof Array)) {
                for(var j=0; j<components.length; j++) {
                    var component = components[j];
                    var x = layer.x_org;
                    var cy = kw_get_int(component, "cy", kw_get_int(layer, "cy", 50));
                    var top_margin = kw_get_int(component, "top_margin", kw_get_int(layer, "top_margin", 20));;
                    y += top_margin;

                    component["x"] = x;
                    component["y"] = y;
                    if(component.hv_component) {
                        // Esto no me funciona
                        //var cell = model.getCell(component.id);
                        //graph.moveCells([cell], x, y);
                    }

                    y += cy;
                }
            }
        } finally {
            // Updates the display
            model.endUpdate();
        }

    }

    /********************************************
     *
     ********************************************/
    function find_layer(self, attributes)
    {
        var layers = self.config.layers;
        for(var i=0; i<layers.length; i++) {
            var layer = layers[i];
            var layer_attributes = kw_get_dict_value(layer, "attributes", null);
            if(layer_attributes && kw_match(
                    attributes,             // kw
                    layer_attributes        // filter
              )) {
                return layer;
            }
        }
        return null;
    }

    /********************************************
     *
     ********************************************/
    function find_component(self, components, attributes)
    {
        for(var i=0; i<components.length; i++) {
            var component = components[i];
            var component_attributes = kw_get_dict_value(component, "attributes", null);
            if(component_attributes && kw_match(
                    component_attributes,       // kw
                    attributes                  // filter
              )) {
                return component;
            }
        }
        return null;
    }

    /********************************************
     *
     ********************************************/
    function find_output_sockname(self, peername)
    {
        var port = null;
        var layers = self.config.layers;
        for(var i=0; i<layers.length; i++) {
            var layer = layers[i];
            var components = kw_get_dict_value(layer, "components", null);
            if(components && (components instanceof Array)) {
                for(var j=0; j<components.length; j++) {
                    var component = components[j];
                    var output_ports = component.__output_side__;
                    for (var key in output_ports) {
                        if (output_ports.hasOwnProperty(key)) {
                            port = output_ports[key];
                            if(peername == port.sockname) {
                                return port;
                            }
                        }
                    }
                }
            }
        }
        return null;
    }

    /********************************************
     *
     ********************************************/
    function find_input_peername(self, sockname)
    {
        var port = null;
        var layers = self.config.layers;
        for(var i=0; i<layers.length; i++) {
            var layer = layers[i];
            var components = kw_get_dict_value(layer, "components", null);
            if(components && (components instanceof Array)) {
                for(var j=0; j<components.length; j++) {
                    var component = components[j];
                    var input_ports = component.__input_side__;
                    for (var key in input_ports) {
                        if (input_ports.hasOwnProperty(key)) {
                            port = input_ports[key];
                            if(sockname == port.peername) {
                                return port;
                            }
                        }
                    }
                }
            }
        }
        return null;
    }

    /********************************************
     *
     ********************************************/
    function create_component(self, layer, component, data)
    {
        /*
         *  Que el hijo conozca al padre.
         */
        component["layer"] = layer;

        /*
         *  El texto del vertex son los atributos
         */
        var attributes = kw_get_dict_value(component, "attributes", kw_get_dict_value(layer, "attributes", null));
        var text = '';
        if(attributes) {
            for(var key in attributes) {
                var t = attributes[key];
                text += key + ': ' + t + '\n';
            }
        }

        /*
         *  El id del vertex, sino existe, son los atributos (separados por -)
         */
        var new_id =  text.split('\n').join('-');
        var id = kw_get_str(component, "id", new_id);
        component["id"] = id;
        if(empty_string(text)) {
            text = id;
        }

        /*
         *  Valores para pintar
         */
        var style = kw_get_str(component, "style", kw_get_str(layer, "style", ""));
        var x = kw_get_int(component, "x", 0);
        var y = kw_get_int(component, "y", 0);
        var cx = kw_get_int(component, "cx", kw_get_int(layer, "cx", 50));
        var cy = kw_get_int(component, "cy", kw_get_int(layer, "cy", 50));
        var port_cx = kw_get_int(component, "port_cx", kw_get_int(layer, "port_cx", 30));
        var port_cy = kw_get_int(component, "port_cy", kw_get_int(layer, "port_cy", 30));
        var port_sep = kw_get_int(component, "port_sep", kw_get_int(layer, "port_sep", 30));

        /*
         *  El tamaño del component aumenta con los puertos.
         */
        var inputs = null;
        var input_size = 0;
        var outputs = null;
        var output_size = 0;
        if(data) {
            inputs = match_dict_list_by_kw(data, {"__parent__": "__input_side__"});
            input_size = inputs.length;
            outputs = match_dict_list_by_kw(data, {"__parent__": "__output_side__"});
            output_size = outputs.length;
            var items = Math.max(input_size, output_size);
            cy = (items+0)*(port_cy+port_sep)+30;
        }

        var is_input_group = kw_get_int(layer, "input_group", 0);
        if(inputs && inputs.length > 0 && is_input_group) {
            input_size = 1;
        }
        var is_output_group = kw_get_int(layer, "output_group", 0);
        if(outputs && outputs.length > 0 && is_output_group) {
            output_size = 1;
        }

        var model = self.config.graph.getModel();
        model.beginUpdate();
        try {
            /*
             *  Crea el vertice del component
             */
            var hv_component = component["hv_component"] = self.config.graph.insertVertex(
                layer.hv_layer,
                id,
                text,
                x, y, cx, cy,
                style
            );

            /*
             *  Crea el port para mostrar datos del component
             */
            if(data) { // FUTURE
                var hv_data = component["hv_data"] = self.config.graph.insertVertex(
                    hv_component,
                    null,
                    "",
                    1, 1, 50, 20,
                    ""
                );
                hv_data.geometry.offset = new mxPoint(-110, -cy-20);
                hv_data.geometry.relative = true;
            }

            /*
             *  Crea los ports del component
             */
    /*
            {
                    "id": "YDbwriter^6000`IOGate^__input_side__`Channel^6000-1",
                    "disabled": 0,
                    "opened": 1,
                    "txMsgsec": 0,
                    "rxMsgsec": 0,
                    "sockname": "127.0.0.1:6000",
                    "peername": "127.0.0.1:47712",
                    "__name__": "6000-1",
                    "__state__": "ST_CONNECTED",
                    "__parent__": "__input_side__",
                    "__trace_level__": 0,
                    "__running__": 1,
                    "__playing__": 0
                },

    */
            var input_ports = component["__input_side__"] = {};
            for(var i=0; i<input_size; i++) {
                /*
                 *  Dibuja el port vertex
                 */
                var input = inputs[i];

                var port_id = null;
                if(is_input_group) {
                    port_id = parseInt(input.__name__);
                    if(!port_id || isNaN(port_id)) {
                        port_id = 0;
                    }
                    port_id = port_id.toString();
                } else {
                    port_id = input.__name__;
                }

                var hv_input_port = self.config.graph.insertVertex(hv_component,
                    port_id,
                    input.__name__,
                    1, 1, port_cx, port_cy,
                    "shape=ellipse;perimeter=ellipsePerimeter;fillColor=Lavender;strokeColor=gray;"
                );
                hv_input_port.geometry.offset = new mxPoint(-cx - port_cx/2, -cy + 15 + (port_cy+port_sep)*(i+0));
                hv_input_port.geometry.relative = true;

                input_ports[port_id] = {
                    hv_port: hv_input_port,
                    sockname: '',
                    peername: ''
                };
            }

            var output_ports = component["__output_side__"] = {};
            for(var i=0; i<output_size; i++) {
                /*
                 *  Dibuja el port vertex
                 */
                var output = outputs[i];

                var port_id = null;
                if(is_output_group) {
                    port_id = parseInt(input.__name__);
                    if(!port_id || isNaN(port_id)) {
                        port_id = 0;
                    }
                    port_id = port_id.toString();
                } else {
                    port_id = output.__name__;
                }

                var hv_output_port = self.config.graph.insertVertex(hv_component,
                    port_id,
                    output.__name__,
                    1, 1, port_cx, port_cy,
                    "shape=ellipse;perimeter=ellipsePerimeter;fillColor=Lavender;strokeColor=gray;"
                );
                hv_output_port.geometry.offset = new mxPoint(-port_cx/2, -cy + 15 + (port_cy+port_sep)*(i+0));
                hv_output_port.geometry.relative = true;

                output_ports[port_id] = {
                    hv_port: hv_output_port,
                    sockname: '',
                    peername: ''
                };
            }
        } finally {
            // Updates the display
            model.endUpdate();
        }

        return hv_component;
    }


    /********************************************
     *  HACK
     *
     *  Soy input, servidor.
     *  Busca en los sockname de salida, lo que tengo en mi peername.
     *
     *  Client          Me
     *  ----------      ---
     *  sock: ?         sock: 4000
     *  peer:4000       peer: his sock
     *
     *  Soy output, cliente.
     *  Busca en los peername de entrada, lo que tengo en mi sockname.
     *
     *                  Me              Server
     *                  ----------      ------
     *                  sock: ?         sock: 4000
     *                  peer:4000       peer: my sock
     *
        {
            "id": "YDbwriter^6000`IOGate^__input_side__`Channel^6000-1",
            "disabled": 0,
            "opened": 1,
            "txMsgsec": 0,
            "rxMsgsec": 0,
            "sockname": "127.0.0.1:6000",
            "peername": "127.0.0.1:47712",
            "__name__": "6000-1",
            "__state__": "ST_CONNECTED",
            "__parent__": "__input_side__",
            "__trace_level__": 0,
            "__running__": 1,
            "__playing__": 0
        }
     *
     ********************************************/
    function update_ports(self, layer, component, data)
    {
        var inputs = null;
        var input_size = 0;
        var outputs = null;
        var output_size = 0;
        if(data) {
            inputs = match_dict_list_by_kw(data, {"__parent__": "__input_side__"});
            input_size = inputs.length;
            outputs = match_dict_list_by_kw(data, {"__parent__": "__output_side__"});
            output_size = outputs.length;
        }
        var is_input_group = kw_get_int(layer, "input_group", 0);
        var is_output_group = kw_get_int(layer, "output_group", 0);
        var input_ports = component["__input_side__"];
        var output_ports = component["__output_side__"];
        var fix_output_side = kw_get_int(layer, "output_side", 0);
        var fix_input_side = kw_get_int(layer, "input_side", 0);

        /*-------------------------------------*
         *  Actualiza los sock/peer
         *-------------------------------------*/
        for(var i=0; i<input_size; i++) {
            var input = inputs[i];
            var port = null;

            /*
             *  Busca el input (server) port
             */
            if(is_input_group) {
                port = Object.keys(input_ports)[0];
            } else {
                port = input_ports[input.__name__];
            }
            if(!port) {
                continue; // TODO debería refrescar todo?
            }
            if(input.opened) {
                // My listening sock
                port.sockname = component.attributes.node + ":" + input.sockname.split(':')[1];

                // The X client sock
                var h = input.peername.split(':')[0];
                var p = input.peername.split(':')[1];
                if(strncmp(h, "127.", 4)==0) {
                    // Si estoy conectado desde una 127. por cojones que soy yo.
                    h = component.attributes.node;
                }
                port.peername = h + ":" + p;

            } else {
                port.sockname = '';
                port.peername = '';
            }
        }

        for(var i=0; i<output_size; i++) {
            var output = outputs[i];
            var port = null;

            /*
             *  Busca el output (client) port
             */
            if(is_output_group) {
                port = output_ports[Object.keys(output_ports)[0]];
            } else {
                port = output_ports[output.__name__];
            }
            if(!port) {
                continue; // TODO debería refrescar todo?
            }
            if(output.opened) {
                // The server sock
                var h = output.peername.split(':')[0];
                var p = output.peername.split(':')[1];
                if(strncmp(h, "127.", 4)==0) {
                    // Si estoy conectado a una 127. por cojones que soy yo.
                    h = component.attributes.node;
                }
                port.peername = h + ":" + p;

                // My X sock
                port.sockname = component.attributes.node + ":" + output.sockname.split(':')[1];

            } else {
                port.sockname = '';
                port.peername = '';
            }
        }


        /*-------------------------------------*
         *  Dibuja los link
         *-------------------------------------*/
        var graph = self.config.graph;
        var model = graph.getModel();
        model.beginUpdate();
        try {
            /*
             *  Input side (servidor)
             */
            for(var i=0; i<input_size; i++) {
                var input = inputs[i];
                var port = null;

                /*
                 *  Busca el port
                 */
                if(is_input_group) {
                    port = input_ports[Object.keys(input_ports)[0]];
                } else {
                    port = input_ports[input.__name__];
                }
                if(!port) {
                    continue; // TODO debería refrescar todo?
                    // Para borrar todo:
                    // graph.removeCells(graph.getChildVertices(graph.getDefaultParent()))
                }

                // Soy servidor, el vertex destino soy yo.
                var hv_port_dst = port.hv_port;

                /*
                 *  Busca el vertex source
                 */
                var hv_port_src = null;

                /*
                 *  Si existe input_size, no busques mas, ese es el source
                 */
                if(fix_input_side) {
                    hv_port_src = model.getCell(fix_input_side);
                } else {
                    // Busca en los sockname de salida, lo que tengo en mi peername.
                    if(port.peername) {
                        var port_src = find_output_sockname(self, port.peername);
                        if(port_src) {
                            hv_port_src = port_src.hv_port;
                        }
                    }
                }

                /*
                 * Usa el huerfano si falta algún vertex
                 */
                if(!hv_port_dst) {
                    hv_port_dst = layer.hv_huerfano;
                }
                if(!hv_port_src) {
                    hv_port_src = layer.hv_huerfano;
                }

                var hv_link = port["hv_link"];
                if(hv_link) {
                    /*
                     *  Ya existe link
                     */
                    /*
                     *  Borra el link si está closed.
                     */
                    if(!input.opened) {
                        model.remove(hv_link);
                        hv_link = port.hv_link = null;
                    } else {
                        /*
                         *  Comprueba que tiene los mismos origen/destino
                         */
                        var src = model.getTerminal(hv_link, true);
                        var dst = model.getTerminal(hv_link, false);
                        if(!(src == hv_port_src && dst == hv_port_dst)) {
                            // Han cambiado los org/dst, borra el link
                            //graph.removeCells([hv_link], false);
                            model.remove(hv_link);
                            hv_link = port.hv_link = null;
                        }
                    }

                }

                if(!hv_link) {
                    if(input.opened) {
                        hv_link = port["hv_link"] = graph.insertEdge(
                            port.hv_port,
                            'link-' + hv_port_src.id + '-' + hv_port_dst.id,
                            '',
                            hv_port_src,
                            hv_port_dst,
                            ''
                            + 'strokeWidth=' + 2 + ';'
                            + 'strokeColor=lightgreen;'
                            + 'selectable=0;movable=0;'
                            + "startArrow=node;endArrow=block;"
                            + "labelBackgroundColor=white;"
                            //sourcePerimeterSpacing=4;startFill=0;endFill=0;"
                        );
                        model.setTerminals(hv_link, hv_port_src, hv_port_dst);
                        //hv_link.geometry.relative = true;
                        //hv_link.geometry.offset = new mxPoint(-50, -10);
                    }
                }
                if(hv_link) {
                    model.setValue(hv_link,
                        "" + input.txMsgsec + "⏪  ⏩" + input.rxMsgsec
                    );
                }
            }

            /*
             *  Output side (cliente)
             */
            for(var i=0; i<output_size; i++) {
                var output = outputs[i];
                var port = null;

                /*
                 *  Busca el port
                 */
                if(is_output_group) {
                    port = Object.keys(output_ports)[0];
                } else {
                    port = output_ports[output.__name__];
                }
                if(!port) {
                    continue; // TODO debería refrescar todo?
                    // Para borrar todo:
                    // graph.removeCells(graph.getChildVertices(graph.getDefaultParent()))
                }

                // Soy cliente, el vertex source soy yo.
                var hv_port_src = port.hv_port;

                /*
                 *  Busca el vertex destino
                 */
                var hv_port_dst = null;

                /*
                 * Si existe output_size, no busques mas, ese es el destino
                 */
                if(fix_output_side) {
                    hv_port_dst = model.getCell(fix_output_side);
                } else {
                    // Busca en los peername de entrada, lo que tengo en mi sockname.
                    if(port.sockname) {
                        var port_dst = find_input_peername(self, port.sockname);
                        if(port_dst) {
                            hv_port_dst = port_dst.hv_port;
                        }
                    }
                }

                /*
                 * Usa el huerfano si falta algún vertex
                 */
                if(!hv_port_dst) {
                    hv_port_dst = layer.hv_huerfano;
                }
                if(!hv_port_src) {
                    hv_port_src = layer.hv_huerfano;
                }

                var hv_link = port["hv_link"];
                if(hv_link) {
                    /*
                     *  Ya existe link
                     */
                    /*
                     *  Borra el link si está closed.
                     */
                    if(!output.opened) {
                        model.remove(hv_link);
                        hv_link = port.hv_link = null;
                    } else {
                        /*
                         *  Comprueba que tiene los mismos origen/destino
                         */
                        var src = model.getTerminal(hv_link, true);
                        var dst = model.getTerminal(hv_link, false);
                        if(!(src == hv_port_src && dst == hv_port_dst)) {
                            // Han cambiado los org/dst, borra el link
                            //graph.removeCells([hv_link], false);
                            model.remove(hv_link);
                            hv_link = port.hv_link = null;
                        }
                    }
                }

                if(!hv_link) {
                    if(output.opened) {
                        hv_link = port["hv_link"] = graph.insertEdge(
                            port.hv_port,
                            'link-' + hv_port_src.id + '-' + hv_port_dst.id,
                            '',
                            hv_port_src,
                            hv_port_dst,
                            ''
                            + 'strokeWidth=' + 2 + ';'
                            + 'strokeColor=lightgreen;'
                            + 'selectable=0;movable=0;'
                            + "startArrow=oval;endArrow=none;"
                            + "labelBackgroundColor=white;"
                        );
                        model.setTerminals(hv_link, hv_port_src, hv_port_dst);
                        //hv_link.geometry.relative = true;
                        //hv_link.geometry.offset = new mxPoint(-50, -10);
                    }
                }
                if(hv_link) {
                    if(fix_output_side) {
                        model.setValue(hv_link,
                            "" + output.txMsgsec + "⏪  ⏩" + output.rxMsgsec
                        );
                    }
                }
            }
        } finally {
            // Updates the display
            model.endUpdate();
        }
    }

    /********************************************
     *
     ********************************************/
    function update_list_childs(self, data, __md_iev__)
    {
        /*
         *  Build the attributes of income message
         */
        var __component__ = kw_get_dict_value(__md_iev__, "__component__", null);
        var __yuno__ = kw_get_dict_value(__md_iev__, "__md_yuno__", null);
        var attributes = __duplicate__(__component__);
        __extend_dict__(attributes, __yuno__);

        /*
         *  Find the layer
         */
        var layer = find_layer(self, attributes);
        if(!layer) {
            return; // alamerde
        }

        /*
         *  Get components
         */
        var components = kw_get_dict_value(layer, "components", null);
        if(!components) {
            components = [];
            layer["components"] = components;
        }

        /*
         *  Get the component (create if not exists).
         */
        var component = find_component(self, components, attributes);
        if(!component) {
            var cy = kw_get_int(component, "cy", kw_get_int(layer, "cy", 50));
            component = {
                attributes: attributes
            };
            layer.components.push(component);
            recoloca_components(self, layer);
            create_component(self, layer, component, data);
        }

        update_ports(self, layer, component, data);
    }

    /********************************************
     *  Gradiente color verde-amarillo-rojo
     *  en 10 pasos
     ********************************************/

    var gradiente_cpu = [
        '#45FF2E',
        '#70FF2D',
        '#9CFF2C',
        '#C9FF2C',
        '#F5FF2B',
        '#FFDB2B',
        '#FFAE2A',
        '#FF812A',
        '#FF5329',
        '#FF282C',
        '#FF282C'
    ];

    /********************************************
     *
     ********************************************/
    function update_stats(self, data, __md_iev__)
    {
        /*
         *  Build the attributes of income message
         */
        var __component__ = kw_get_dict_value(__md_iev__, "__component__", null);
        var __yuno__ = kw_get_dict_value(__md_iev__, "__md_yuno__", null);
        var attributes = __duplicate__(__component__);
        __extend_dict__(attributes, __yuno__);

        /*
         *  Find the layer
         */
        var layer = find_layer(self, attributes);
        if(!layer) {
            return; // alamerde
        }

        /*
         *  Get components
         */
        var components = kw_get_dict_value(layer, "components", null);
        if(!components) {
            return; // alamerde
        }

        /*
         *  Get the component (create if not exists).
         */
        var component = find_component(self, components, attributes);
        if(!component) {
            return; // alamerde
        }
        var hv_data = component.hv_data;
        if(hv_data) {
            var model = self.config.graph.getModel();
            model.beginUpdate();
            try {
                model.setValue(hv_data,
                    "" + data.cpu + " %"
                );
                var idx = Math.min(data.cpu, 100);
                idx = Math.floor(idx/10);
                var color = gradiente_cpu[idx];
                self.config.graph.setCellStyles(mxConstants.STYLE_FILLCOLOR, color, [component.hv_data]);
            } finally {
                model.endUpdate();
            }
        }
    }

    /********************************************
     *
     ********************************************/
    function poll_data(self, layers)
    {
        if(!layers) {
            return;
        }
        var gobj_yunos = self.yuno.gobj_find_unique_gobj('yunos');
        var nodes = gobj_yunos.gobj_match_childs({
            __gclass_name__: 'Node'
        });

        /*---------------------------*
         *  Loop nodes/layers
         *---------------------------*/
        for(var n=0; n<nodes.length; n++) {
            var node = nodes[n];
            // Check state
            if(!node.gobj_in_this_state("ST_CONNECTED")) {
                continue;
            }

            if(!node.programa_counters) {
                node.programa_counters = 1;
                /* NO CAMBIES interval/window
                var ev1 = "EV_CHANGE_TRAFFIC_INTERVAL";
                var $button = $$(ev1);
                var value = $button.getValue();
                self.gobj_send_event(
                    ev1,
                    {
                        value: value
                    },
                    self
                );

                var ev2 = "EV_CHANGE_TRAFFIC_MESSAGES";
                var $button = $$(ev2);
                var value = $button.getValue();
                self.gobj_send_event(
                    ev2,
                    {
                        value: value
                    },
                    self
                );*/
            }


            // Check role name, must match the graph name
            var node_name = node.config.role.toUpperCase();
            var my_name = self.name.toUpperCase();
            if(node_name != my_name) {
                continue;
            }
            for(var i=0; i<layers.length; i++) {
                var layer = layers[i];
                var kw_req = kw_get_dict_value(layer, "attributes", null);
                if(!kw_req) {
                    continue;
                }
                var kw_req1 = __duplicate__(kw_req);
                var req = {
                    "node": node.config.host
                };
                __extend_dict__(req, kw_req1);
                msg_write_MIA_key(kw_req1, "__component__",  req);

                msg_write_MIA_key(kw_req1, "__command__", "list-childs");
                node.config.gobj_agent.gobj_command( // return 0 on asychronous response.
                    "command-yuno service=__yuno__ command=list-childs" +
                    " gobj_name='__input_side__ __output_side__' child_gclass=Channel" +
                    " attributes='opened txMsgsec rxMsgsec disabled sockname peername'",
                    kw_req1,
                    self
                );

                var kw_req2 = __duplicate__(kw_req);
                req = {
                    "node": node.config.host
                };
                __extend_dict__(req, kw_req2);
                msg_write_MIA_key(kw_req2, "__component__",  req);

                msg_write_MIA_key(kw_req2, "__command__", "stats-yuno");
                node.config.gobj_agent.gobj_command( // return 0 on asychronous response.
                    "stats-yuno service=__yuno__ stats=cpu",
                    kw_req2,
                    self
                );
            }
        }
    }

    /********************************************
     *
     ********************************************/
    function display_webix_message(self, webix_msg)
    {
        try {
            var result = webix_msg['result'];
            var comment = webix_msg['comment'];
            var schema = webix_msg['schema'];
            var data = webix_msg['data'];
            var __md_iev__ = webix_msg['__md_iev__'];
        } catch (e) {
            log_error(e);
            return;
        }
        if(result < 0) {
            display_error_message(comment);
        } else {
//             if(comment) {
//                 display_ok_message(comment);
//             } else {
//                 display_ok_message('');
//             }
        }

        if(data && data.length>0) {
            /*--------------------------------------------*
             *  Carga datos
             *--------------------------------------------*/
            var command = msg_read_MIA_key(webix_msg, "__command__");
            if(command == "list-childs") {
                update_list_childs(self, data, __md_iev__);
            } else if(command == "change-interval") {
            } else if(command == "change-messages") {
            }
        }
    }

    /********************************************
     *
     ********************************************/
    function display_stats_message(self, webix_msg)
    {
        try {
            var result = webix_msg['result'];
            var comment = webix_msg['comment'];
            var schema = webix_msg['schema'];
            var data = webix_msg['data'];
            var __md_iev__ = webix_msg['__md_iev__'];
        } catch (e) {
            log_error(e);
            return;
        }
        if(result < 0) {
            display_error_message(comment);
        } else {
//             if(comment) {
//                 display_ok_message(comment);
//             } else {
//                 display_ok_message('');
//             }
            update_stats(self, data, __md_iev__);
        }
    }



            /***************************
             *      Actions
             ***************************/




    /********************************************
     *  Remote response
     ********************************************/
    function ac_mt_command_answer(self, event, kw, src)
    {
        display_webix_message(self, kw);
        return 0;
    }

    /********************************************
     *  Remote response
     ********************************************/
    function ac_mt_stats_answer(self, event, kw, src)
    {
        display_stats_message(self, kw);
        return 0;
    }

    /********************************************
     *
     ********************************************/
    function ac_refresh(self, event, kw, src)
    {
        var container = document.getElementById(self.name);
        container.innerHTML = "";
        //delete container;

        self.config.graph = null;
        self.config.model = null;
        self.config.layers = null;
        self.config.layers = JSON.parse(JSON.stringify(self.config.back_layers));
        create_graph(self, self.config.cx, self.config.cy, self.config.layers);
        insert_hardcoded_components(self, self.config.layers);
        poll_data(self, self.config.layers);
        self.set_timeout(self.config.timeout_idle*1000);
        return 0;
    }

    /********************************************
     *
     ********************************************/
    function ac_change_interval(self, event, kw, src)
    {
        var gobj_yunos = self.yuno.gobj_find_unique_gobj('yunos');
        var nodes = gobj_yunos.gobj_match_childs({
            __gclass_name__: 'Node'
        });

        /*---------------------------*
         *  Loop nodes/layers
         *---------------------------*/
        var value = kw_get_int(kw, "value", 1000);
        for(var n=0; n<nodes.length; n++) {
            var node = nodes[n];
            // Check state
            if(!node.gobj_in_this_state("ST_CONNECTED")) {
                continue;
            }
            // Check role name, must match the graph name
            var node_name = node.config.role.toUpperCase();
            var my_name = self.name.toUpperCase();
            if(node_name != my_name) {
                continue;
            }

            var kw_req = {
            };
            var req = {
                "node": node.config.host
            };
            msg_write_MIA_key(kw_req, "__component__",  req);

            msg_write_MIA_key(kw_req, "__command__", "change-interval");
            node.config.gobj_agent.gobj_command( // return 0 on asychronous response.
                "command-yuno yuno_role=emu_gps service=__yuno__ command=write-number" +
                " gobj_name='__default_service__' attribute=interval value=" + value,
                kw_req,
                self
            );
        }
        return 0;
    }

    /********************************************
     *
     ********************************************/
    function ac_change_messages(self, event, kw, src)
    {
        var gobj_yunos = self.yuno.gobj_find_unique_gobj('yunos');
        var nodes = gobj_yunos.gobj_match_childs({
            __gclass_name__: 'Node'
        });

        /*---------------------------*
         *  Loop nodes/layers
         *---------------------------*/
        var value = kw_get_int(kw, "value", 1);
        for(var n=0; n<nodes.length; n++) {
            var node = nodes[n];
            // Check state
            if(!node.gobj_in_this_state("ST_CONNECTED")) {
                continue;
            }
            // Check role name, must match the graph name
            var node_name = node.config.role.toUpperCase();
            var my_name = self.name.toUpperCase();
            if(node_name != my_name) {
                continue;
            }

            var kw_req = {
            };
            var req = {
                "node": node.config.host
            };
            msg_write_MIA_key(kw_req, "__component__",  req);

            msg_write_MIA_key(kw_req, "__command__", "change-messages");
            node.config.gobj_agent.gobj_command( // return 0 on asychronous response.
                "command-yuno yuno_role=emu_gps service=__yuno__ command=write-number" +
                " gobj_name='__default_service__' attribute=window value=" + value,
                kw_req,
                self
            );
        }
        return 0;
    }

    /********************************************
     *
     ********************************************/
    function ac_timeout(self, event, kw, src)
    {
        if(!__no_poll__) { // TEST a true para poder debuggear la consola del browser
            poll_data(self, self.config.layers);
            self.set_timeout(self.config.timeout_idle*1000);
        }
        return 0;
    }




            /***************************
             *      GClass/Machine
             ***************************/




    var FSM = {
        "event_list": [
            "EV_MT_COMMAND_ANSWER",
            "EV_MT_STATS_ANSWER",
            "EV_REFRESH",
            "EV_CHANGE_TRAFFIC_INTERVAL",
            "EV_CHANGE_TRAFFIC_MESSAGES",
            "EV_TIMEOUT"
        ],
        "state_list": [
            "ST_IDLE"
        ],
        "machine": {
            "ST_IDLE":
            [
                ["EV_MT_COMMAND_ANSWER",        ac_mt_command_answer,   undefined],
                ["EV_MT_STATS_ANSWER",          ac_mt_stats_answer,     undefined],
                ["EV_REFRESH",                  ac_refresh,             undefined],
                ["EV_CHANGE_TRAFFIC_INTERVAL",  ac_change_interval,     undefined],
                ["EV_CHANGE_TRAFFIC_MESSAGES",  ac_change_messages,     undefined],
                ["EV_TIMEOUT",                  ac_timeout,             undefined]
            ]
        }
    };

    var Architecture = GObj.__makeSubclass__();
    var proto = Architecture.prototype; // Easy access to the prototype
    proto.__init__= function(name, kw)
    {
        GObj.prototype.__init__.call(
            this,
            FSM,
            CONFIG,
            name,
            'Architecture',
            kw,
            0
        );
        return this;
    };




            /***************************
             *      Framework Methods
             ***************************/




    /************************************************
     *      Framework Method create
     ************************************************/
    proto.mt_create = function(kw)
    {
        var self = this;
        self.set_timeout(self.config.timeout_idle*1000);
        var layers = kw_get_dict_value(kw, "layers", null);
        self.config.cx = kw_get_int(kw, "cx", 1200);
        self.config.cy = kw_get_int(kw, "cy", 800);
        if (is_array(layers)) {
            self.config.back_layers = JSON.parse(JSON.stringify(layers));
            self.config.layers = JSON.parse(JSON.stringify(self.config.back_layers));

            create_graph(self, self.config.cx, self.config.cy, self.config.layers);
            insert_hardcoded_components(self, self.config.layers);
        }
    }

    /************************************************
     *      Framework Method destroy
     ************************************************/
    proto.mt_destroy= function()
    {
    }

    /************************************************
     *      Framework Method start
     ************************************************/
    proto.mt_start = function(kw)
    {
    }

    /************************************************
     *      Framework Method stop
     ************************************************/
    proto.mt_stop = function(kw)
    {
    }


    //=======================================================================
    //      Expose the class via the global object
    //=======================================================================
    exports.Architecture = Architecture;

    if(typeof GLOBAL !== 'undefined') {
        GLOBAL.Architecture = Architecture;
    }

})(this);
