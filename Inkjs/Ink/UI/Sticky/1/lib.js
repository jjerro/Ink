/**
 * @module Ink.UI.Sticky_1
 * @author inkdev AT sapo.pt
 * @version 1
 */
Ink.createModule('Ink.UI.Sticky', '1', ['Ink.UI.Aux_1','Ink.Dom.Event_1','Ink.Dom.Css_1','Ink.Dom.Element_1','Ink.Dom.Selector_1'], function(Aux, Event, Css, Element, Selector ) {
    'use strict';

    /**
     * The Sticky component takes an element and transforms it's behavior in order to, when the user scrolls he sets its position
     * to fixed and maintain it until the user scrolls back to the same place.
     *
     * @class Ink.UI.Sticky
     * @constructor
     * @version 1
     * @param {String|DOMElement} selector
     * @param {Object} [options] Options
     *     @param {Number}     options.offsetBottom       Number of pixels of distance from the bottomElement.
     *     @param {Number}     options.offsetTop          Number of pixels of distance from the topElement.
     *     @param {String}     options.topElement         CSS Selector that specifies a top element with which the component could collide.
     *     @param {String}     options.bottomElement      CSS Selector that specifies a bottom element with which the component could collide.
     * @example
     *      <script>
     *          Ink.requireModules( ['Ink.Dom.Selector_1','Ink.UI.Sticky_1'], function( Selector, Sticky ){
     *              var menuElement = Ink.s('#menu');
     *              var stickyObj = new Sticky( menuElement );
     *          });
     *      </script>
     */
    var Sticky = function( selector, options ){

        if( typeof selector !== 'object' && typeof selector !== 'string'){
            throw '[Sticky] :: Invalid selector defined';
        }

        if( typeof selector === 'object' ){
            this._rootElement = selector;
        } else {
            this._rootElement = Selector.select( selector );
            if( this._rootElement.length <= 0) {
                throw "[Sticky] :: Can't find any element with the specified selector";
            }
            this._rootElement = this._rootElement[0];
        }

        /**
         * Setting default options and - if needed - overriding it with the data attributes and given options
         */
        this._options = Ink.extendObj({
            offsetBottom: 0,
            offsetTop: 0,
            topElement: undefined,
            bottomElement: undefined
        }, options || {},  Element.data( this._rootElement ) );

        this.ORIGINAL = Ink.extendObj({}, this._options);

        if( typeof( this._options.topElement ) !== 'undefined' ){
            this._topElement = Aux.elOrSelector( this._options.topElement, 'Top Element');
        } else {
            this._topElement = Aux.elOrSelector( 'body', 'Top Element');
        }

        if( typeof( this._options.bottomElement ) !== 'undefined' ){
            this._bottomElement = Aux.elOrSelector( this._options.bottomElement, 'Bottom Element');
        } else {
            this._bottomElement = Aux.elOrSelector( 'body', 'Top Element');
        }

        this._computedStyle = window.getComputedStyle ? window.getComputedStyle(this._rootElement, null) : this._rootElement.currentStyle;
        this._dims = {
            height: this._computedStyle.height,
            width: this._computedStyle.width
        };
        this._init();
    };

    Sticky.prototype = {

        /**
         * Init function called by the constructor
         *
         * @method _init
         * @private
         */
        _init: function(){
            Event.observe( document, 'scroll', Event.throttle(Ink.bindEvent(this._onScroll,this), 10 ) );
            Event.observe( window, 'resize', Ink.bindEvent(this._onResize,this) );

            this._calculateOriginalSizes();

            this._calculateOffsets();

        },

        /**
         * Scroll handler.
         *
         * @method _onScroll
         * @private
         */
        _onScroll: Event.throttle(function(){
            var viewport = (document.compatMode === "CSS1Compat") ?  document.documentElement : document.body;
            var elm = this._rootElement;

            if(
                ( ( (Element.elementWidth(this._rootElement)*100)/viewport.clientWidth ) > 90 ) ||
                ( viewport.clientWidth<=649 )
            ){
                if( Element.hasAttribute(elm,'style') ){
                    elm.removeAttribute('style');
                }
                return;  // Do not do anything for mobile
            }


            var elementRect = elm.getBoundingClientRect();
            var topRect = this._topElement && this._topElement.getBoundingClientRect();
            var bottomRect = this._bottomElement && this._bottomElement.getBoundingClientRect();

            var offsetTop = this.ORIGINAL.offsetTop ? parseInt(this.ORIGINAL.offsetTop, 10) : 0;
            var offsetBottom = this.ORIGINAL.offsetBottom ? parseInt(this.ORIGINAL.offsetBottom, 10) : 0;

            var elementHeight = elementRect.bottom - elementRect.top;

            // elementMinTop += parseInt(this.ORIGINAL.offsetTop, 10)
            // elementMaxBottom -= parseInt(this.ORIGINAL.offsetBottom, 10)

            var stickingTo = '';

            if (topRect.bottom > offsetTop && bottomRect.top > elementHeight) {
                stickingTo = 'top'
                elm.style.position = 'static'
                elm.style.top = 'auto'
            } else if (bottomRect.top < elementHeight) {
                stickingTo = 'bottom';
                elm.style.position = 'fixed';
                elm.style.top = bottomRect.top - elementHeight - offsetBottom + 'px'
            } else if (topRect.bottom <= offsetTop) {
                // Stick to screen
                stickingTo = 'screen'
                elm.style.position = 'fixed'
                elm.style.top = offsetTop + 'px'
            }

            if (stickingTo && stickingTo !== this._stickingTo) {
                this._stickingTo = stickingTo
                console.log(stickingTo)
            }

            Css.addRemoveClassName(elm, 'ink-sticky-sticking', stickingTo === 'top');
            Css.addRemoveClassName(elm, 'ink-sticky-sticking-bottom', stickingTo === 'bottom');
        }, 10),

        /**
         * Resize handler
         *
         * @method _onResize
         * @private
         */
        _onResize: function(){

            if( this._resizeTimeout ){
                clearTimeout(this._resizeTimeout);
            }

            this._resizeTimeout = setTimeout(Ink.bind(function(){
                this._rootElement.removeAttribute('style');
                this._calculateOriginalSizes();
                this._calculateOffsets();
            }, this),0);

        },

        /**
         * On each resizing (and in the beginning) the component recalculates the offsets, since
         * the top and bottom element heights might have changed.
         *
         * @method _calculateOffsets
         * @private
         */
        _calculateOffsets: function(){

            /**
             * Calculating the offset top
             */
            if( typeof this._topElement !== 'undefined' ){

                if( this._topElement.nodeName.toLowerCase() !== 'body' ){
                    var
                        topElementHeight = Element.elementHeight( this._topElement ),
                        topElementTop = Element.elementTop( this._topElement )
                    ;

                    this._options.offsetTop = ( parseInt(topElementHeight,10) + parseInt(topElementTop,10) ) + parseInt(this._options.originalOffsetTop,10);
                } else {
                    this._options.offsetTop = parseInt(this._options.originalOffsetTop,10);
                }
            }

            /**
             * Calculating the offset bottom
             */
            if( typeof this._bottomElement !== 'undefined' ){

                if( this._bottomElement.nodeName.toLowerCase() !== 'body' ){
                    var
                        bottomElementHeight = Element.elementHeight(this._bottomElement)
                    ;
                    this._options.offsetBottom = parseInt(bottomElementHeight,10) + parseInt(this._options.originalOffsetBottom,10);
                } else {
                    this._options.offsetBottom = parseInt(this._options.originalOffsetBottom,10);
                }
            }

            this._onScroll();

        },

        /**
         * Function to calculate the 'original size' of the element.
         * It's used in the begining (_init method) and when a scroll happens
         *
         * @method _calculateOriginalSizes
         * @private
         */
        _calculateOriginalSizes: function(){

            if( typeof this._options.originalOffsetTop === 'undefined' ){
                this._options.originalOffsetTop = parseInt(this._options.offsetTop,10);
                this._options.originalOffsetBottom = parseInt(this._options.offsetBottom,10);
            }
            this._options.originalTop = parseInt(this._rootElement.offsetTop,10);
            this._options.originalLeft = parseInt(this._rootElement.offsetLeft,10);
            if(isNaN(this._options.originalWidth = parseInt(this._dims.width,10))) {
                this._options.originalWidth = 0;
            }
            this._options.originalWidth = parseInt(this._computedStyle.width,10);
        }

    };

    return Sticky;

});
