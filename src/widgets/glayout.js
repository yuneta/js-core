/*******************************************************************
 *  GLayout.js
 *  Copyright 2014 Niyamaka
 *  MIT license.
 *
 *  GLayout se caracteriza por admitir el evento de entrada EV_RESIZE.
 *  GBox se caracteriza por admitir el evento de entrada EV_RESIZE.
 *
 *  La diferencia entre ambos es que GLayout adopta el nuevo size que recibe
 *  por el evento EV_RESIZE, recalcula los sizes que deben tener
 *  sus hijos, y luego reenvia el evento EV_RESIZE a todos sus hijos,
 *  con el nuevo size que debe tener cada uno.
 *
 *  GBox simplemente recibe el evento EV_RESIZE y adopta el nuevo size.
 *  También hace un publish_event del evento EV_RESIZE por si algún hijo es
 *  otro GLayout.
 *
 *  Los GLayout tendrán que reajustar los sizes de sus hijos a partir de cada
 *  nuevo hijo.


Main Layout ($(window).width(), $(window).height())
┌────────────────────────────────────────┐
│             Menu (100%, 40px)          │
├────────────────────────────────────────┤
│             Toolbar (100%, 40px)       │
├────────────────────────────────────────┤
│                                        │
│             Edit Layout                │
│             (100%, 1flex)              │
│┌──────────────────────────────────────┐│
││                                   ▴  ││
││                                   ║  ││      Layout vertical:
││                                   ║  ││      compuesto de div-block hijos.
││                                   ║  ││      como bloques de piso,
││            TWedit                 ║  ││      cada bloque ocupa una planta
││                                   ║  ││      la variable es 'cy' (height),
││                                   ║  ││      eje y.
││                                   ▾  ││
││ ◂════════════════════════════════▸   ││
│└──────────────────────────────────────┘│
├────────────────────────────────────────┤
│             Sessions (100%, 40px)      │
├────────────────────────────────────────┤
│             Status (100%, 40px)        │
└────────────────────────────────────────┘


Main Layout ($(window).width(), $(window).height())
┌─────────────────────────────────────────┐
│           Menu (100%, 40px)             │
├─────────────────────────────────────────┤
│           Toolbar (100%, 40px)          │
├─────────────────────────────────────────┤
│                                         │
│           Edit Layout                   │
│           (100%, 1flex)                 │
│                                         │ Edit: Layout horizontal.
│┌──────────────────╥──────────────────┐  │ compuesto de inline-block hijos.
││                  ║                  │  │ como habitaciones en un piso,
││                  ║                  │  │ la variable es 'cx' (width),
││                  ║                  │  │ eje x.
││                  ║                  │  │
││ TWedit           ║ TWedit           │  │ El espacio sobrante del padre
││ (x1, 100%)       ║ 1flex, 100%)     │  │ se reparte en los (p)flex que haya,
││                  ║                  │  │ siendo p la proporción que coge
││                  ║                  │  │ un hijo del espacio a repartir.
││                  ║                  │  │
││                  ║                  │  │
│└──────────────────╨──────────────────┘  │
│                   x1                    │
│                                         │
├─────────────────────────────────────────┤
│           Sessions (100%, 40px)         │
├─────────────────────────────────────────┤
│           Status (100%, 40px)           │
└─────────────────────────────────────────┘

Los hijos de un GLayout deben ser GBox u otro GLayout.
Los GLayout tienen la propiedad de estar escuchando el evento resize,
para reajustar a todos sus hijos en cada redimensión.
Los GBox no tienen porqué trabajar todos con dimensiones en %,
es decir, que el redraw no será un trabajo hecho automáticamente por el browser.
Los GBox pueden trabajar con espacios flexibles además de los fijos,
por lo que el espacio flexible tiene que ser reajustado en los hijos
en cada redimensión del padre.
Los GBox hijos, se adaptan al tipo de layout del padre (vertical u horizontal),
por lo que habrá que llevar cuidado en la configuración de cada tipo de GBox:

    - en los layout verticales, la variable es height, mientras que width es
    fijo siempre al 100%.
    - en los layout horizontales la variable es width, mientras que height es
    fijo siempre al 100%.

El layout padre, forzará en los hijos, la dimensión flexible en la variable
que corresponde a cada tipo de layout (vertical u horizontal).

 *
 *  Version 1.0.0
 *
 *******************************************************************/

/**************************************************************************
 *        GLayout
 **************************************************************************/
;(function (exports) {
    'use strict';

    /*****************************************************************
     *  layout_type: 'vertical' -> the elements are blocks
     *               'horizontal' -> the elements are inline-blocks
     *
     *  vertical layout:
     *   ┌────────────┐⇑
     *   │            │║
     *   ├────────────┤║    overflow-x: hidden
     *   │            │║    overflow-y: auto
     *   ├────────────┤║
     *   │            │║
     *   └────────────┘⇩
     *
     *  horizontal layout:
     *  ┌───────╥──────╥───────┐
     *  │       ║      ║       │    overflow-x: auto
     *  │       ║      ║       │    overflow-y: hidden
     *  └───────╨──────╨───────┘
     *  ⇦══════════════════════⇨
     *
     *
     *  vertical layout:
     *      - witdh:    100%
     *      - height:   fixed pixels
     *
     *  horizontal layout:
     *      - witdh:    fixed pixels
     *      - height:   100%
     *
     *****************************************************************/
    var GLAYOUT_CONFIG = {
        layout_type: 'vertical',    // 'vertical' or 'horizontal'
        window_onresize: false, // True if it must bind the window resize event.
        fill_full: false, // True if it used full area

        x: 0,       /* config values */
        y: 0,
        w: 100,
        h: 100,

        extra_cls: '',
        extra_data: '',
        vertical_layout_cls: 'glayout_vertical_layout',
        horizontal_layout_cls: 'glayout_horizontal_layout',
        // Id of dom element parent. It has preference over parent gobj.
        parent_dom_id: ''
    };




                /**************************
                 *      Local methods
                 **************************/




    /************************************************************
     *  Calculate and fix the position and size of childs
     *
     *  Sum up all fixed child sizes.
     *  The total size minus the above value,
     *  it's the amount to deal among all flexible childs.
     ************************************************************/
    function fix_child_sizes(self)
    {
        var ln = self.gobj_child_size();
        if(!ln) {
            return 0;
        }
        var width_flexs = new Array(ln);
        var height_flexs = new Array(ln);
        var total_fixed_height = 0;
        var total_fixed_width = 0;
        var total_flexs_height = 0;
        var total_flexs_width = 0;

        // Get the current layout size.
        var parent_width = self.config.w;
        var parent_height = self.config.h;

        for(var i=0; i<ln; i++) {
            var child = self.gobj_child_by_index(i);
            var child_width = child.config.w;
            var child_height = child.config.h;

            /*
             *  height
             */
            if(child_height < 0) {
                height_flexs[i] = -child_height;
                total_flexs_height += -child_height;
            } else {
                height_flexs[i] = 0;
                total_fixed_height += child_height;
            }

            /*
             *  width
             */
            if(child_width < 0) {
                width_flexs[i] = -child_width;
                total_flexs_width += -child_width;
            } else {
                width_flexs[i] = 0;
                total_fixed_width += child_width;
            }
        }

        if (elm_in_list(self.config.layout_type, ['vertical'])) {
            var free_height = parent_height - total_fixed_height;
            var arepartir = free_height/total_flexs_height;
            var partial_height = 0;
            for(var i=0; i<ln; i++) {
                var child = self.gobj_child_by_index(i);
                var new_height, new_width;
                if (height_flexs[i]) {
                    new_height = arepartir * height_flexs[i];
                } else {
                    new_height = child.config.h;
                }
                new_width = parent_width;
                child.gobj_send_event(
                    'EV_RESIZE',
                    {
                        x: 0,
                        y: partial_height,
                        w: new_width,
                        h: new_height
                    },
                    self
                );
                partial_height += new_height;
            }
        } else if (elm_in_list(self.config.layout_type, ['horizontal'])) {
            var free_width = parent_width - total_fixed_width;
            var arepartir = free_width/total_flexs_width;
            var partial_width = 0;
            for(var i=0; i<ln; i++) {
                var child = self.gobj_child_by_index(i);
                var new_height, new_width;
                if (width_flexs[i]) {
                    new_width = arepartir * width_flexs[i];
                } else {
                    new_width = child.config.w;
                }
                new_height = parent_height;
                child.gobj_send_event('EV_RESIZE', {
                    x: partial_width,
                    y: 0,
                    w: new_width,
                    h: new_height
                }, self);
                partial_width += new_width;
            }
        } else {
            var msg = "ERROR layout_type MUST be vertical or horizontal, no '" + this.config.layout_type + "'";
            self.yuno.logger(msg);
            throw msg;
        }
        return ln;
    }




                /**************************
                 *      Actions
                 **************************/




    /************************************************************
     *      resize widget
     ************************************************************/
    function ac_resize(self, event, kw, src)
    {
        self.config.x = kw.x;
        self.config.y = kw.y;
        self.config.w = kw.w;
        self.config.h = kw.h;

        /*
         *  Fix the new size.
         */
        self.$outer_box.css('left', kw.x + 'px');
        self.$outer_box.css('top', kw.y + 'px');
        self.$outer_box.css('height', kw.h + 'px');
        self.$outer_box.css('width', kw.w + 'px');

        /*
         *  Fix the child sizes.
         */
        fix_child_sizes(self);
        return 0;
    }

    /************************************************************
     *      initial paint
     ************************************************************/
    function ac_initial_paint(self, event, kw, src)
    {
        var layout_cls;
        if(self.config.layout_type === 'vertical')
            layout_cls = self.config.vertical_layout_cls;
        else if(self.config.layout_type === 'horizontal')
            layout_cls = self.config.horizontal_layout_cls;

        self.$outer_box = $([
            '<div id="',
            self.name,
            '"',
            self.config.extra_data? ' ' + self.config.extra_data + ' ': ' ',
            'class="',
            layout_cls,
            self.config.extra_cls? ' ' + self.config.extra_cls: '',
            '"/>'
        ].join(''));

        if(self.config.fill_full) {
            self.$outer_box.css('overflow', 'hidden');
        }

        self.$head_insert_point = self.$outer_box;
        self.$tail_insert_point = self.$outer_box;

        self.build_jquery_link_list();

        return 0;
    }

    /************************************************************
     *      Automata
     ************************************************************/
    var GLAYOUT_FSM = {
        'event_list': [
            'EV_PAINT',
            'EV_RESIZE'
        ],
        'state_list': [
            'ST_IDLE'
            ],
        'machine': {
            'ST_IDLE':
            [
                ['EV_PAINT',        ac_initial_paint,   'ST_IDLE'],
                ['EV_RESIZE',       ac_resize,          'ST_IDLE']
            ]
        }
    }

    /************************************************************
     *      GClass
     ************************************************************/
    var GLayout = GObj.__makeSubclass__();
    var proto = GLayout.prototype; // Easy access to the prototype
    proto.__init__= function(name, kw) {
        this.name = name || '';  // set before super(), to put the same smachine name
        this.gclass_name = 'GLayout';
        GObj.prototype.__init__.call(this, GLAYOUT_FSM, GLAYOUT_CONFIG);
        __update_dict__(this.config, kw || {});
        return this;
    };

    /************************************************************
     *          Framework method: mt_create
     ************************************************************/
    proto.mt_create= function()
    {
        var self = this;

        /*-------------------------------------------------*
         *  Initial paint
         *  Paint will set $head and $tail insert point.
         *  Build jquery link list.
         *-------------------------------------------------*/
        if (self.config.window_onresize) {
            self.config.x = 0;
            self.config.y = 0;
            self.config.w = $(window).width();
            self.config.h = $(window).height();
        }
        self.gobj_send_event('EV_PAINT', null, self);
        self.resizeEvt = -1;

        /*--------------------------------*
         *      Set DOM events
         *--------------------------------*/
        if (self.config.window_onresize) {
            // I am the root layout.
            if(self.config.fill_full) {
                $('body').css('overflow', 'hidden');
            }
            var root_resize = function(event) {
                var gobj = event.data;

                if(self.resizeEvt != -1) {
                    clearTimeout(self.resizeEvt);
                    self.resizeEvt = -1;
                }
                self.resizeEvt = setTimeout(
                    function()
                    {
                        //code to do after window is resized
                        /*
                        * Get size of screen
                        * Checked: it returns valid area, without scrollbar area. IE too!
                        */
                        gobj.gobj_send_event('EV_RESIZE', {
                            x: 0,
                            y: 0,
                            w: $(window).width(),
                            h: $(window).height()
                            //w: window.innerWidth,
                            //h: window.innerHeight
                        }, self);
                    },
                    250
                );
            }
            $(window).on('resize.' + self.name, self, root_resize);
            self.gobj_send_event('EV_RESIZE', {
                x: 0,
                y: 0,
                w: $(window).width(),
                h: $(window).height()
            }, self);

        } else {
            // I am a second level layout.
            /*-------------------------------------*
             *  Subscribe to resize event
             *-------------------------------------*/
            if(self.parent.gclass_name != 'GBox') {
                var msg = "ERROR parent of 2ºlevel GLayout must be GBox gclass";
                log_error(msg);
            } else {
                self.parent.gobj_subscribe_event(
                    'EV_RESIZE',
                    {'__first_shot__': true},
                    self
                );
            }
        }
        return 0;
    }

    /************************************************************
     *          Framework method: mt_child_added
     ************************************************************/
    proto.mt_child_added = function(child)
    {
        /*
         *  Fix the child sizes.
         */
        fix_child_sizes(this);
        return 0;
    }

    /************************************************
     *          Expose to the global object
     ************************************************/
    exports.GLayout = GLayout;

}(this));
