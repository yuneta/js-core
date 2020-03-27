/*******************************************************************
 *  GBox.js
 *  Copyright 2014 Niyamaka
 *  MIT license.
 *
 *  If the parent is a GLayout gobj then the size and position
 *  are managed by the parent.
 *
 *  See glayout.js for some documentation.
 *
 *  Los gbox son de tamaño fijo, posición absoluta y sin scrollbars.
 *
 *  Si el padre es un glayout, éste controla su tamaño y posición.
 *
 *  Si el padre no es un glayout, entonces los puedes usar
 *  para contener svg's paper.
 *
 *  Para meter contenido dentro de un gbox debes crear dentro del gbox un gcontainer,
 *  que sí tiene scrollbars y es de position relative.
 *
 *  Debería quitar el paper de aquí y crear un widget específico?
 *
 *******************************************************************/

/**************************************************************************
 *        GBox
 **************************************************************************/
;(function (exports) {
    'use strict';

    /*****************************************************************
     *      Default config
     *****************************************************************/
    var GBOX_CONFIG = {
        layout_type: '',    // inherit from parent glayout, don't touch.

        with_paper: false,  // true if you want a svg paper
        paper_attr: null,   // must be an object {}
        paper_css: null,    // must be an object {}

        // config values (flexible areas have negative values)
        x: 0,
        y: 0,
        w: 40,
        h: 40,

        _x: 0,      // dynamic values
        _y: 0,
        _w: 40,
        _h: 40,

        extra_cls: '',
        extra_data: '',
        vertical_box_cls: 'gbox_vertical_layout_box',
        horizontal_box_cls: 'gbox_horizontal_layout_box',
        // Id of dom element parent. It has preference over parent gobj.
        parent_dom_id: ''
    };




                /**************************
                 *      Local methods
                 **************************/




                /**************************
                 *      Actions
                 **************************/




    /************************************************************
     *  resize widget
     ************************************************************/
    function ac_resize(self, event, kw, src)
    {
        self.config._x = kw.x;
        self.config._y = kw.y;
        self.config._w = kw.w;
        self.config._h = kw.h;

        var sx =  kw.x + 'px';
        var sy =  kw.y + 'px';
        var sw =  kw.w + 'px';
        var sh =  kw.h + 'px';

        /*
         *  Fix the new size.
         */
        self.$outer_box.css('left',   sx);
        self.$outer_box.css('top',    sy);
        self.$outer_box.css('width',  sw);
        self.$outer_box.css('height', sh);

        if(self.config.with_paper) {
            self.paper.attr({
                'width': sw,
                'height': sh
            });
        }

        /*
         *  Publish the new size. A GLayout can be our child.
         */
        self.gobj_publish_event(event, {x:0, y:0, w:kw.w, h:kw.h});
        return 0;
    }

    /************************************************************
     *      initial paint
     ************************************************************/
    function ac_initial_paint(self, event, kw, src)
    {
        /*--------------------------------*
         *      Draw the outer box
         *--------------------------------*/
        self.$outer_box = $([
            '<div id="',
            self.name,
            '"',
            self.config.extra_data? ' ' + self.config.extra_data + ' ': ' ',
            'class="',
            self.config.layout_type=='vertical'?
                self.config.vertical_box_cls:
                self.config.horizontal_box_cls,
            self.config.extra_cls? ' ' + self.config.extra_cls: '',
            '"/>'
        ].join(''));

        var sx =  self.config.x + 'px';
        var sy =  self.config.y + 'px';
        var sw =  self.config.w + 'px';
        var sh =  self.config.h + 'px';

        self.$outer_box.css('left',   sx);
        self.$outer_box.css('top',    sy);
        self.$outer_box.css('width',  sw);
        self.$outer_box.css('height', sh);

        self.$head_insert_point = self.$outer_box;
        self.$tail_insert_point = self.$outer_box;

        self.build_jquery_link_list();

        /*-------------------------------------*
         *      Draw the optional svg paper
         *-------------------------------------*/
        if(self.config.with_paper) {
            var paper_name = 'paper-' + self.name;
            var paper = self.paper = Snap(sw, sh);
            if(!self.paper) {
                log_error("Snap() FAILED");
            }
            paper.attr({
                'id': paper_name,
            });
            $(paper.node).css({
                'z-index': 'inherit',
                'position': 'absolute'
            });
            document.getElementById(self.name).appendChild(
                document.getElementById(paper_name)
            );
//             paper.attr({
//                 'width': sw,
//                 'height': sh
//             });
            if(self.config.paper_attr) {
                paper.attr(self.config.paper_attr);
            }
            if(self.config.paper_css) {
                paper.css(self.config.paper_css);
            }

        } else {
            self.paper = null;
        }

        return 0;
    }

    /************************************************************
     *      Automata
     ************************************************************/
    var GBOX_FSM = {
        'event_list': [
            'EV_PAINT',
            'EV_RESIZE: input output'
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
    var GBox = GObj.__makeSubclass__();
    var proto = GBox.prototype; // Easy access to the prototype
    proto.__init__= function(name, kw) {
        this.name = name || '';  // set before super(), to put the same smachine name
        this.gclass_name = 'GBox';
        GObj.prototype.__init__.call(this, GBOX_FSM, GBOX_CONFIG);
        __update_dict__(this.config, kw || {});
        return this;
    };

    /************************************************************
     *          Framework method: mt_create
     ************************************************************/
    proto.mt_create = function(kw)
    {
        /*-------------------------------------------------*
         *  Initial paint
         *  Paint will set $head and $tail insert point.
         *  Build jquery link list.
         *-------------------------------------------------*/
        this.config.layout_type = this.parent.config.layout_type;
        this.gobj_send_event(this, 'EV_PAINT');
    }

    /************************************************************
     *          Framework method: mt_subscription_added
     ************************************************************/
    proto.mt_subscription_added = function(event, kw, subscriptor)
    {
        if(kw && kw.__first_shot__) {
            subscriptor.gobj_send_event(
                'EV_RESIZE',
                {
                    x: 0,
                    y: 0,
                    w: this.config._w,
                    h: this.config._h
                },
                subscriptor
            );
        }
    }




                /**************************
                 *  High level functions
                 **************************/




    /************************************************************
     *
     ************************************************************/
    proto.hide = function()
    {
        var self = this;
        self.$outer_box.hide();
    }

    /************************************************************
     *
     ************************************************************/
    proto.show = function()
    {
        var self = this;
        self.$outer_box.show();
    }

    /************************************************
     *          Expose to the global object
     ************************************************/
    exports.GBox = GBox;

}(this));
