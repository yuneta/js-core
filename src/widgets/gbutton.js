/*******************************************************************
 *  GButton.js
 *
 *  Child GObj.
 *
 *  A button that works with svg.
 *  Mobile style.
 *  Dependencies: Snap.svg and jquery.
 *
 *  Copyright 2014 Niyamaka
 *  MIT license.
 *******************************************************************/

/**************************************************************************
 *        GButton
 **************************************************************************/
;(function (exports) {
    'use strict';

    /*****************************************************************
     *      Default config
     *
     *      type values:
     *      'command_btn'   ->  Estado pressed automatico
     *      'check_btn'     ->  Cada click cambia estado
     *      'radio_btn'     ->  Un click cambia a pressed
     *
     *  Important:
     *      $svg    -> a jquery object that is a clone from a svg element.
     *      snap    -> the snap wrapper over $svg.
     *
     *****************************************************************/
    var GBUTTON_CONFIG = {
        type: 'command_btn',
        svg_id: '',         // id of svg element (with # please) from DOM
        disabled_color: 'LightGrey',
        default_color: 'black',
        active_color: 'DeepSkyBlue',
        x: '0',
        y: '0',
        width: '100%',
        height: '100%',
        extra_cls: '',
        extra_data: '',

        command_event_name: 'EV_COMMAND',
        subscriber: null,
        disabled: false,
        user_data: null,

        // Id of dom element parent. It has preference over parent gobj.
        parent_dom_id: ''
    };




                /**************************
                 *      Local methods
                 **************************/




    /************************************************************
     *
     ************************************************************/
    function paint_disabled(self)
    {
        self.snap.attr({
            'opacity':'0.3',
            'cursor': 'default'
        });
        self.snap.selectAll(".colorable").attr({
           "fill": self.config.disabled_color,
           "fill-opacity":1
        });
    }

    /************************************************************
     *
     ************************************************************/
    function paint_enabled(self)
    {
        self.snap.attr({
            'opacity':'1',
            'cursor': 'pointer'
        });
        self.snap.selectAll(".colorable").attr({
           "fill": self.config.default_color,
           "fill-opacity":1
        });
    }

    /************************************************************
     *
     ************************************************************/
    function paint_pressed(self)
    {
        self.snap.attr({
            'cursor': 'pointer',
            'opacity':'1'
        });
        self.snap.selectAll(".colorable").attr({
           "fill": self.config.active_color,
           "fill-opacity":1
        });
    }




                /**************************
                 *      Actions
                 **************************/




    /************************************************************
     *
     ************************************************************/
    function ac_initial_paint(self, event, kw, src)
    {
        var $t = $(self.config.svg_id);
        if(!$t.length) {
            _logger("ERROR svg_id '" + self.config.svg_id + "'INVALID");
            return -1;
        }
        self.$svg = $t.clone().attr({
            'id': self.name
        });
        if(!self.$svg.length) {
            _logger("ERROR cannot create snap");
            return -1;
        }
        if(self.config.extra_cls) {
            self.$svg.addClass(self.config.extra_cls);
        }
        self.$head_insert_point = self.$svg;
        self.$tail_insert_point = self.$svg;

        /*---------------------------------*
         *      Build jquery link list.
         *---------------------------------*/
        self.build_jquery_link_list();

        /*---------------------------------*
         *      Build snap svg wrapper
         *---------------------------------*/
        self.snap = Snap('#' + self.name);
        if(!self.snap) {
            _logger("ERROR Snap('" + self.name + "') failed");
            return -1;
        }
        self.snap.
            attr({
                "cursor": "pointer",
                "x": self.config.x,
                "y": self.config.y,
                "width": self.config.width,
                "height": self.config.height,
                "padding-left": "5px"
            })
            .data('gobj', self)
            .mousedown(function (event) {
                event.preventDefault();
                event.stopPropagation();
                var self = this.data('gobj');
                self.gobj_send_event('EV_MOUSEDOWN', null, self);

                self.snap.mouseout(function (event) {
                    event.preventDefault();
                    event.stopPropagation();
                    var self = this.data('gobj');
                    self.snap.unmouseout();
                    self.gobj_send_event('EV_MOUSEUP', {inside_element:false}, self);
                });

            })
            .mouseup(function (event) {
                event.preventDefault();
                event.stopPropagation();
                var self = this.data('gobj');
                self.snap.unmouseout();
                self.gobj_send_event('EV_MOUSEUP', {inside_element:true}, self);
            });


        /*---------------------------*
         *     Set state
         *---------------------------*/
        if(!self.config.disabled) {
            self.gobj_change_state('ST_NORMAL')
            self.gobj_send_event('EV_PAINT', null, self);
        }

        return 0;
    }

    /************************************************************
     *
     ************************************************************/
    function ac_normal_paint(self, event)
    {
        paint_enabled(self);
        return 1;
    }

    /************************************************************
     *
     ************************************************************/
    function ac_pressed_paint(self, event)
    {
        paint_pressed(self);
        return 1;
    }

    /************************************************************
     *
     ************************************************************/
    function ac_disabled_paint(self, event)
    {
        paint_disabled(self);
        return 1;
    }

    /************************************************************
     *
     ************************************************************/
    function ac_normal_click_down(self, event, kw)
    {
        switch(self.config.type) {
            case 'check_btn':
            case 'radio_btn':
                self.gobj_change_state('ST_PRESSED');
                self.gobj_send_event('EV_PAINT', null, self);
                self.gobj_publish_event(
                    'EV_COMMAND',
                    {
                        'user_data': self.config.user_data
                    }
                );
                break;
            case 'command_btn':
                self.gobj_change_state('ST_PRESSED');
                self.gobj_send_event('EV_PAINT', null, self);
                break;
        }
        return 1;
    }

    /************************************************************
     *
     ************************************************************/
    function ac_pressed_click_up(self, event, kw)
    {
        switch(self.config.type) {
            case 'command_btn':
            case 'check_btn':
                self.gobj_change_state('ST_NORMAL');
                self.gobj_send_event('EV_PAINT', null, self);
                if(kw.inside_element) {
                    self.gobj_publish_event(
                        'EV_COMMAND',
                        {
                            'user_data': self.config.user_data
                        }
                    );
                }
                break;
            case 'radio_btn':
                break;
        }
        return 1;
    }

    /************************************************************
     *
     ************************************************************/
    function ac_disabled_click(self, event, kw)
    {
        return 1;
    }

    /************************************************************
     *      Automata
     ************************************************************/
    var GBUTTON_FSM = {
        'event_list': [
            'EV_COMMAND: output',
            'EV_PAINT',
            'EV_MOUSEDOWN',
            'EV_MOUSEUP'
        ],
        'state_list': [
            'ST_INIT',                       /* Estado inicial */
            'ST_NORMAL',                     /* button normal */
            'ST_PRESSED',                    /* button pressed */
            'ST_DISABLED'                    /* button disabled */
            ],
        'machine': {
            'ST_INIT':
            [
                ['EV_PAINT',        ac_initial_paint,       undefined]
            ],
            'ST_NORMAL':
            [
                ['EV_PAINT',        ac_normal_paint,        undefined],
                ['EV_MOUSEDOWN',    ac_normal_click_down,   undefined]
            ],
            'ST_PRESSED':
            [
                ['EV_PAINT',        ac_pressed_paint,       undefined],
                ['EV_MOUSEUP',      ac_pressed_click_up,    undefined]
            ],
            'ST_DISABLED':
            [
                ['EV_PAINT',        ac_disabled_paint,      undefined]
            ]
        }
    }

    /************************************************************
     *      GClass
     ************************************************************/
    var GButton = GObj.__makeSubclass__();
    var proto = GButton.prototype; // Easy access to the prototype
    proto.__init__= function(name, kw) {
        this.name = name || '';  // set before super(), to put the same smachine name
        this.gclass_name = 'GButton';
        GObj.prototype.__init__.call(this, GBUTTON_FSM, GBUTTON_CONFIG);
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
         *-------------------------------------------------*/
        self.gobj_send_event('EV_PAINT', null, self);

        /*---------------------------*
         *  Subscribe output event
         *---------------------------*/
        if(!self.config.subscriber) {
            self.config.subscriber = self.parent;
        }
        if (self.config.subscriber) {
            self.gobj_subscribe_event(
                'EV_COMMAND',
                {
                    __rename_event_name__: self.config.command_event_name
                },
                self.config.subscriber
            );
        }
    }




                /**************************
                 *  High level functions
                 **************************/




    /************************************************************
     *
     ************************************************************/
    proto.set_checked = function (checked) {
        var self = this;
        if (checked) {
            var cur_st = self.gobj_current_state();
            if (cur_st !== 'ST_PRESSED') {
                self.gobj_change_state('ST_PRESSED');
                self.gobj_send_event('EV_PAINT', null, self);
            }
        } else {
            var cur_st = self.gobj_current_state();
            if (cur_st !== 'ST_NORMAL') {
                self.gobj_change_state('ST_NORMAL');
                self.gobj_send_event('EV_PAINT', null, self);
            }
        }
    }

    /************************************************************
     *
     ************************************************************/
    proto.enable = function() {
        var self = this;
        self.config.disabled = true;
        self.gobj_change_state('ST_NORMAL');
        self.gobj_send_event('EV_PAINT', null, self);
    }

    /************************************************************
     *
     ************************************************************/
    proto.disable = function() {
        var self = this;
        self.config.disabled = false;
        self.gobj_change_state('ST_DISABLED');
        self.gobj_send_event('EV_PAINT', null, self);
    }

    /************************************************************
     *
     ************************************************************/
    proto.color = function(color) {
        var self = this;
        self.snap.selectAll(".colorable").attr({
           "fill": color,
           "fill-opacity":1
        });
    }

    /************************************************
     *          Expose to the global object
     ************************************************/
    exports.GButton = GButton;

}(this));
