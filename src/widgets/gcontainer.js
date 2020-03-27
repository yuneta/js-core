/*******************************************************************
 *  GContainer.js
 *  Copyright 2014 Niyamaka
 *  MIT license.
 *******************************************************************/

/**************************************************************************
 *        GContainer
 **************************************************************************/
;(function (exports) {
    'use strict';

    /*****************************************************************
     *      Default config
     *****************************************************************/
    var GCONTAINER_CONFIG = {
        with_paper: false,  // true if you want a svg paper
        paper_attr: null,   // must be an object {}
        paper_css: null,    // must be an object {}

        x: 0,
        y: 0,
        w: 40,
        h: 40,

        extra_cls: '',
        extra_data: '',
        container_cls: 'gcontainer_container',
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
        self.config.x = kw.x;
        self.config.y = kw.y;
        self.config.w = kw.w;
        self.config.h = kw.h;

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
//             self.paper.attr({
//                 'width': sw,
//                 'height': sh
//             });
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
            self.config.container_cls,
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
            var paper = self.paper = Snap(1200, 900);
            if(!self.paper) {
                log_error("Snap() FAILED");
            }
            paper.attr({
                'id': paper_name
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
    var GCONTAINER_FSM = {
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
    var GContainer = GObj.__makeSubclass__();
    var proto = GContainer.prototype; // Easy access to the prototype
    proto.__init__= function(name, kw) {
        this.name = name || '';  // set before super(), to put the same smachine name
        this.gclass_name = 'GContainer';
        GObj.prototype.__init__.call(this, GCONTAINER_FSM, GCONTAINER_CONFIG);
        __update_dict__(this.config, kw || {});
        return this;
    };

    /************************************************************
     *          Framework method: mt_create
     ************************************************************/
    proto.mt_create = function(kw)
    {
        var self = this;
        /*-------------------------------------------------*
         *  Initial paint
         *  Paint will set $head and $tail insert point.
         *  Build jquery link list.
         *-------------------------------------------------*/
        self.gobj_send_event('EV_PAINT', null, self);

        /*-------------------------------------*
            *  Subscribe to resize event
            *-------------------------------------*/
        if(self.parent.gclass_name != 'GBox') {
            log_error("parent must be GBox gclass");
        } else {
            self.parent.gobj_subscribe_event(
                'EV_RESIZE',
                {'__first_shot__': true},
                self
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
    exports.GContainer = GContainer;

}(this));


/*
jQuery(function($) {
    function resize_callback(eventObject) {
        // this: dom element
        var boxlist_width;
        var section_width;

        elm = "#skills-boxlist";
        boxlist_width = $(elm).width();
        if(boxlist_width > 0) {
            var x;
            var section_width;
            x = $.scrollbarWidth();
            section_width = (boxlist_width - x)/3;
            $(".grid-container-class-33").width(section_width);
        }
    }

    $(function() {
        // Document is ready
        $(window).resize(resize_callback);
    });

    $(window).load(function () {
        resize_callback();
    });
});
*/
