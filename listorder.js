/* listorder version 1.0
* Copyright (c) 2012 Michel Bobillier aka Athos99 www.athos99.com
*
* GNU General Public License, version 3 (GPL-3.0) http://www.gnu.org/licenses/gpl-3.0.en.html
*
* Description:
*   listorder is a jQuery Plugin for ordered and filtered select option list. Can ordered and filter other list of type li or div
*   http://www.athos99.com/listorder
*
*   Usage : $("#idlist").listorder();
*           $("select").listorder( {filter:'asc'});
*           $("ul").listorder( {filter:'asc',child:'ul'});
*/
"use strict";
(function( $ ){
    // protected functions

    /**
     * return a array of children itmes
     */
    function _load($list, element) {
        var list = [];
        $list.children(element).each(  function() {
            list.push( $(this));
        });
        return list;
    }

    function _orderAsc(datas) {
        datas.savelist.sort(function(a,b) {
            a = datas.settings.childValue.call(a);
            b = datas.settings.childValue.call(b);
            //            a= a.text().toLowerCase();
            //            b= b.text().toLowerCase();
            if ($.isNumeric(a) && $.isNumeric(b)) {
                return a-b;
            }
            return ( (a<b) ? -1 : ((a>b) ? 1 : 0) );
        });
    }
    function _orderDesc(datas) {
        datas.savelist.sort(function(b,a) {
            a = datas.settings.childValue.call(a);
            b = datas.settings.childValue.call(b);
            if ($.isNumeric(a) && $.isNumeric(b)) {
                return a-b;
            }
            return ( (a<b) ? -1 : ((a>b) ? 1 : 0) );
        });
    }
    function _orderRand(datas) {
        datas.savelist.sort(function(b,a) {
            return Math.random()<0.5?1:-1;
        });
    }
    /**
     * ordered the save list
     */
    function _order( datas) {
        switch (datas.settings.order) {
            case 'asc' :
                return _orderAsc(datas);
            case 'desc' :
                return _orderDesc(datas);
            case 'rand' :
                return _orderRand(datas);
        }
    }
    /**
     * display the items list.
     * - Take the value from save list
     * - Apply the filter
     */
    function _display($list,datas) {
        var filter = datas.settings.filter.toLowerCase();
        $.each(datas.savelist, function(index,value) {
            var disp = true;
            if ( filter.length) {
                if( datas.settings.filterExact) {
                    disp = (datas.settings.childValue.call(value).toLowerCase().indexOf(filter)=== 0);
                } else {
                    disp = (datas.settings.childValue.call(value).toLowerCase().indexOf(filter)!==-1);
                }
            }
            if ( disp)
            {
                $list.append(value);
            } else {
                value.detach();
            }
        });
    }
    function  _selectAll($list) {
        var datas = $list.data('listorder');
        var $filter = datas.settings.filter;
        datas.settings.filter = '';
        _display( $list, datas)  ;
        datas.settings.filter = $filter;
        $list.children(datas.settings.child).each( function(){
            $(this).attr("selected", "selected");
        });
    }
    function _bindSubmitAll($list) {
        var $form = $list.closest('form');
        $form.on("submit", function() {
            _selectAll($list);
        });
    }
    function _moveTo( $e, $src, $dst, event) {
        //        event.stopImmediatePropagation();
        $e.off('click.listorder');
        $e.removeAttr("selected");
        $src.listorder('remove',$e);
        $dst.listorder('add',$e);
        $e.on('click.listorder',function(event) {
            _moveTo( $(this), $dst,$src,event);
        });
    }
    // public methods
    var methods = {
        /**
         * Initialize the plugin, set the options
         *   Options :
         *       order : 'asc', 'desc', 'rand' or 'none'. Default : 'asc'
         *       filter : string. Default: ''
         *       filterExact : true, false,0,1 :  filter selection begin at pos 0 or is include in item : defaut false
         *       child : tag_name of child list, 'option','div','li'. Default : 'option'
         *       childValue : function for returning the element value.
         *                    For select the 1st column of a table,  set for parameter a anonymous function
         *                    function(){return $(this.children()[0]).text();}, [0] is for the column number 0
         *       submitAll : true, false,0,1 :  if true and if list is in form, select all child when form is submit
         *
         *  Remarque:
         *   After un ajax load of children list, you need to init this list $(#list).listorder('init');
         */
        init : function( options ) {
            return this.each(function() {
                var datas = {};
                var $list = $(this);
                datas.settings = $.extend({
                    order : 'asc',
                    child: 'option',
                    childValue: function() {
                        return this.text();
                    },
                    filter: '',
                    filterExact: false,
                    submitAll : false
                }, options);

                // validate parameters
                if ( $.isNumeric(datas.settings.filterExact)) {
                    datas.settings.filterExact = parseInt( datas.settings.filterExact,10);
                }
                if ( $.isNumeric(datas.settings.submitAll)) {
                    datas.settings.submitAll = parseInt( datas.settings.submitAll,10);
                }
                // datas.savelist is a copy of all list children
                datas.savelist = _load($list, datas.settings.element);
                $list.data('listorder',datas);
                _order(datas);
                _display($list, datas);
                // submit binder
                if ( datas.settings.submitAll) {
                    _bindSubmitAll($list);
                }
            });

        },
        /**
         * Set and refresh the display list filter value
         *
         *  usage : $('#list1').listorder('filter', filter,filterExact);
         *
         *  filter : match string
         *  filterExact: (optional) indication if filter selection begin at pos 0 or is include in item.
         *                value : true, false, '1','0',1,0
         */
        filter : function( filter, filterExact ) {
            return this.each(function() {
                var $list = $(this);
                var datas = $list.data('listorder');
                if ( filterExact !== undefined) {
                    if ($.isNumeric(filterExact)) {
                        filterExact = parseInt( filterExact,10);
                    }
                    datas.settings.filterExact = filterExact;
                }
                if ( typeof(filter) === "string") {
                    datas.settings.filter = filter;
                } else {
                    datas.settings.filter = '';
                }
                _display($list, datas);
            });
        },
        /**
         * select all list items
         *
         *  usage : $('#list1').listorder('selectAll');
         *
         */
        selectAll : function() {
            return this.each(function() {
                _selectAll($(this));
            });
        },
        /**
         * unselect all list items
         *
         *  usage : $('#list1').listorder('unselectAll');
         *
         */
        unselectAll : function() {
            return this.each(function() {
                var $list = $(this);
                var datas = $list.data('listorder');
                $.each(datas.savelist, function(){
                    $(this).removeAttr("selected");
                });
                _display( $list, datas)  ;
            });
        },
        /**
         * refresh the display list
         *
         *  usage : $('#list1').listorder('display');
         *
         */
        display : function() {
            return this.each(function() {
                var $list = $(this);
                var datas = $list.data('listorder');
                _display( $list, datas)  ;
            });
        },
        /**
         * Exclude items from a external list
         *
         *  usage : $('#list1').listorder('exclude', $select);
         *
         *  $select : element list to remove, must be a jQuery element like this $('#list1')
         */
        exclude : function( $select) {
            return this.each(function() {
                var $list = $(this);
                var datas = $list.data('listorder');
                var exclude = [];
                if ( $select !== undefined) {
                    $select.children(datas.settings.child).each(  function() {
                        exclude[$(this).text()] = 1;
                    });
                    var i;
                    for( i=0; i<datas.savelist.length; )
                    {
                        if( datas.savelist[i].text() in exclude )
                        {
                            datas.savelist.splice(i,1);
                            $($list.children()[i]).detach();
                        } else {
                            i++;
                        }
                    }
                }
                _display( $list, datas)  ;
            });
        },
        /**
         * Include items from a external list
         *
         *  usage : $('#list1').listorder('include', $select);
         *
         *  $select : element list to include, must be a jQuery list element like this $('#list1')
         */
        include : function( $select) {
            return this.each(function() {
                var $list = $(this);
                var datas = $list.data('listorder');
                var include = [];
                if ( $select != undefined) {
                    $.each(datas.savelist, function() {
                        include[$(this).text()] = $(this);
                    });
                    $select.children(datas.settings.child).each(  function() {
                        if ( !($(this).text() in include)) {
                            datas.savelist.push( $(this).clone());
                        }
                    });
                    _order(datas);
                }
                _display( $list, datas)  ;
            });
        },
        /**
         * Order and display the list
         *
         *  usage : $('#list1').listorder('order', order);
         *
         *  order : order type value : 'asc', 'desc' or 'rand'
         */
        order : function( order ) {
            return this.each(function() {
                var $list = $(this);
                var datas = $list.data('listorder');
                datas.settings.order = order;
                _order(datas);
                _display($list, datas);
            });
        },
        /**
         * Add a element to the list
         *
         *  usage : $('#list1').listorder('add', $element, force);
         *
         *  element : a jquery element item  ex: $('<option>').text('item_1').val(1) ( can bea removed element of another list or un element liste clone copy)
         *  force : (optional, default false) force the insert if the element exist
         *           value : true, false, '1','0',1,0
         */
        add : function( $element, force) {
            return this.each(function() {
                var toAdd = true;
                var $list = $(this);
                var datas = $list.data('listorder');
                if ( !force) {
                    $.each(datas.savelist, function(){
                        if($element.text() === $(this).text()) {
                            toAdd = false;
                            return
                        }
                    });
                }
                if ( toAdd) {
                    datas.savelist.push($element);
                }
                _order(datas);
                _display( $list, datas)  ;
            });
        },
        /**
         * Remove a element from the list
         *
         *  usage : $('#list1').listorder('remove', value);;
         *
         *  value : text string or jquery item object
         */
        remove : function( value) {
            return this.each(function() {
                var attribut = 'text';
                var $list = $(this);
                var datas = $list.data('listorder');
                if ( typeof(value) != "string")  {
                    attribut = 'object';
                }

                for( var i=0; i<datas.savelist.length; )
                {
                    var rmv;
                    if( attribut == 'object' ) {
                        rmv = ( datas.savelist[i][0] === value[0]);
                    } else {
                        rmv = ( datas.settings.childValue.call(datas.savelist[i]) === value);
                    }
                    if ( rmv)
                    {
                        datas.savelist.splice(i,1);
                        $($list.children()[i]).detach();
                    } else {
                        i++;
                    }
                }
                _display( $list, datas)  ;
            })
        },
        /**
         * Attach a second list, for add or remove item by clicking
         *  - a click on the list, remove the item
         *  - a click on the source list, add the item on the list  (if the item is not present)
         *  usage : $('#list1').listorder('duo', $source);;
         *
         *  $source : list to associate, must be a jQuery list element like this $('#list1')
         */
        duo : function( $source) {
            var $list = $(this);
            var datas = $list.data('listorder');
            var datasSrc = $source.data('listorder');

            $list.children(datas.settings.child).on('click.listorder',function(){
                $(this).removeAttr("selected");
                $list.listorder('remove',$(this));
            });
            $source.children(datasSrc.settings.child).on('click.listorder',function(event){
                $(this).removeAttr("selected");
                var $obj = $(this).clone().on('click',function() {
                    $list.listorder('remove',$(this));
                });
                $list.listorder('add',$obj);
            });
        },
        /**
         * Attach a second list, for add or remove item by clicking
         *  - at init, copy all element of the source list (if the item is not present)
         *  - a click on  list, remove the item
         *  - a click on source list, add the item on the list (if the item is not present)
         *  usage : $('#list1').listorder('duo', $source);
         *
         *  $source : list to associate, must be a jQuery list element like this $('#list1')
         */
        duoInclude : function ($source) {
            var $list = $(this);
            methods.include.call($source,$list);
            methods.duo.call($list,$source);

        },
        /**
         * Attach a second list, for add or remove item by clicking
         *  - at init, all elements present in the list are removed from the source list
         *  - a click on list, remove the item and add it in source list
         *  - a click on source list, remove the item and add the item on the list
         *  usage : $('#list1').listorder('duo', $source);
         *
         *  $source : list to associate, must be a jQuery list element like this $('#list1')
         */
        duoExclude : function( $source) {
            var $list = $(this);
            var datas = $list.data('listorder');
            var datasSrc = $list.data('listorder');
            methods.exclude.call($source,$list);

            $list.children(datas.settings.child).on('click.listorder',function(event){
                _moveTo( $(this), $list, $source, event);
            });
            $source.children(datasSrc.settings.child).on('click.listorder',function(event){
                _moveTo( $(this),  $source, $list, event);
            });

        },
        /**
         * Set the child selection value
         *
         *  usage : $('#list1').listorder('setChildValue', fnchildValue);
         *
         *  fbchildValue : a callback function to select the value of element of the list
         *          ie : - function(){return this.text();}
         *               - function(){return $(this.children()[0]).text();}
         */

        setChildValue : function( fnChildValue) {
            return this.each(function() {
                var $list = $(this);
                var datas = $list.data('listorder');
                datas.settings.childValue = fnChildValue;
                 _order(datas);
                _display($list, datas);
            });
        }
    }


    $.fn.listorder = function( method ) {

        // Method calling logic
        if ( methods[method] ) {
            return methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
        } else if ( typeof method === 'object' || ! method ) {
            return methods.init.apply( this, arguments );
        } else {
            $.error( 'Method ' +  method + ' does not exist on jQuery.listorder' );
        }
        return false;
    };
})( jQuery );
