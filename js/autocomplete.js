/**
 * Created by Apptory ltd on 03/03/2016.
 * www.apptory.co.il
 */
angular.module("apAutocomplete", []).directive("autocpl", ["$compile", "$http", function($compile, $http) {

    var TAG = "Apptory [Autocomplete]: ";
    var CONFIG_PROPERTY = "autocpl"

    var _config = {};
    var _debug = false;
    var _lastSelection = undefined;

    var _bootElement = undefined;
    var _navIndex = undefined;

    /**
     * Manipulation Function
     * @param scope
     * @param element
     * @param attr
     */
    function link(scope, element, attr)
    {
        /* Validating */
        if(!_validateBoot(attr, scope)) return;

        /* Assign Config */
        _config = scope[attr[CONFIG_PROPERTY]];

        _config['ngModelKey'] = attr.ngModel;

        /* Assign Element */
        _bootElement = element;

        /* Assign Debug Mode */
        _debug = (_config['debug'] ? _config['debug'] : false);

        _log("Booting Autocomplete with attr: [ ", attr, " ], scope: [ ", scope, " ], element: [ ", element, " ]");

        /* Create Typing Watcher */
        scope.$watch(attr.ngModel, function(newValue, oldValue) {

            _log("Needle Update: ", newValue);

            /* Prevent Looping */
            if(_lastSelection == newValue) return;

            var results = [];

            /* Check how it need be filtered - By Objects..? */
            if(typeof(scope[_config['haystack']][0]) == "object")
            {
                if(!_config['searchKey']) {
                    _error("`searchKey` is required. The haystack is object based. Please add `searchKey` to autocomplete config.");
                    return;
                }

                /* Searching */
                results = _objectSearch(newValue, scope[_config['haystack']]);

                _log("Filter Object");
            }

            /* or by array..? */
            if(typeof(scope[_config['haystack']][0]) == "array") {
                _log("Filter array");
            }

            /* Aborting */
            if(results.length == 0 || newValue.length == 0) return _hideAvailableList();

            if(results.length > 15) results = results.slice(0, 15);

            /* Display List */
            _showAvailableList.call(element, scope, results);
        });

        /* Watching haystack */
        scope.$watch(_config['haystack'], function() {
            _log("Haystack Update: ", scope[_config['haystack']]);
        });

        _bootElement[0].addEventListener("keydown", _keyNavigation, false);

        _log("ELEMENT", element);
        _log("ATTR:", attr);
        _log("SCOPE:", scope);
    }

    /**
     * Validating Link boot
     * @private
     */
    function _validateBoot(attr, scope)
    {
        /* Validate Required Params */
        if(!attr.ngModel || !attr[CONFIG_PROPERTY] || !scope[attr[CONFIG_PROPERTY]].haystack)
        {
            _error("Usage Error. Visit https://github.com/Apptory/Angular-Directive-Autocomplete For Usage Example");

            return false;
        }

        return true;
    }

    /**
     * Dipslay Error Message
     * @param message
     * @private
     */
    function _error(message)
    {
        if(console.error) {
            console.error(TAG, message);
        } else {
            throw new Error(TAG + message);
        }
    }

    /**
     * Array Search
     * @private
     */
    function _arraySearch(needle, haystack)
    {

    }

    /**
     *
     * @param needle
     * @param haystack
     * @private
     */
    function _objectSearch(needle, haystack)
    {
        var output = [];

        angular.forEach(haystack, function(element, index) {
            /* Pushing the element */
            if(element[_config['searchKey']] && element[_config['searchKey']] != null && element[_config['searchKey']].indexOf(needle) !== -1) output.push(element);
        });

        return output;
    }

    /**
     * Hiding the list
     * @private
     */
    function _hideAvailableList()
    {
        if(document.querySelector(".apt-autocomplete-wrapper") != null) document.querySelector(".apt-autocomplete-wrapper").remove();

        _navIndex = undefined;
    }

    /**
     * Present Available List
     * @param list
     * @private
     */
    function _showAvailableList(scope, list)
    {
        _log("Resulted List:", list);

        /* Assign List to Scope */
        scope.aptAutoCompleteList = list;
        if(!scope.aptOnSelectCallback) scope.aptOnSelectCallback = _onSelect;

        /* Prevent Double Inject */
        if(document.querySelector(".apt-autocomplete-wrapper") != null) return;

        /* Compiling the HTML */
        var newElement = $compile(_getTemplate(_config['searchKey'], _config['onSelect']))(scope);

        if(this.siblings().length > 0)
        {
            this.siblings().first().before(newElement);
        }
        else
        {
            /* Appending to Body */
            this.parent().append(newElement);
        }
    }

    /**
     * Dispatched when user select something
     * @param event
     * @private
     */
    function _onSelect(event)
    {
        _log("onSelect: ", this[_config['searchKey']]);

        /* Update Label */
        var label = this[_config['searchKey']][_config['searchKey']];
        _bootElement.val(label);

        /* TODO: Update Model */
        _lastSelection = label;

        _hideAvailableList();

        event.selected = this[_config['searchKey']];

        /* Calling Scope Method */
        if(typeof(this.$parent[_config['onSelect']]) == "function") this.$parent[_config['onSelect']].call(this, event);
    }

    /**
     * Return Angular HTML Template
     * @param key
     * @private
     */
    function _getTemplate(key, callable)
    {
        return "<div class=\"apt-autocomplete-wrapper\">" +
                    "<ul><li ng-repeat='" + key + " in aptAutoCompleteList'>" +
                        "<span ng-click='aptOnSelectCallback($event)'>{{" + key + "." + key + "}}</span>" +
                    "</li></ul>" +
                "</div>";
    }

    /**
     * Provide Navigation between the lines
     * @param event
     * @private
     */
    function _keyNavigation(event)
    {
        var code = event.which;
        var up = 38;
        var down = 40;
        var enter = 13;

        /* Perfoming Selection */
        if(code == enter)
        {
            var element = document.querySelector(".apt-autocomplete-wrapper ul").children[_navIndex];

            /* Performing selection */
            _onSelect.call(angular.element(element).scope(), event);
            return;
        }

        /* Any other key is allowed */
        if(code != up && code != down) return;

        /* Preventing Default */
        event.preventDefault();

        var list = document.querySelector(".apt-autocomplete-wrapper ul");

        /* Check if not first selection */
        if(list.querySelector(".selected") != null)
        {
            /* Removing Selected */
            if(_navIndex == 0 && code == up) return list.querySelector(".selected").classList.remove("selected");

            /* Validate According to press */
            if(list.children[(code == down ? (_navIndex + 1) : (_navIndex - 1))])
            {
                /* Updating According to press */
                _navIndex = (code == down ? (_navIndex + 1) : (_navIndex - 1));

                list.querySelector(".selected").classList.remove("selected");

                list.children[_navIndex].classList.add("selected");
            }

            return;
        }

        if(code == down && !_navIndex) _navIndex = 0;

        /* If moving up for first time */
        if(code == up && !_navIndex) return;

        /* Adding Selected Class */
        if(list.children[_navIndex]) list.children[_navIndex].classList.add("selected");
    }

    /**
     * Consoling the data
     * @private
     */
    function _log()
    {
        var args = Array.prototype.slice.call(arguments);
        args.unshift(TAG);

        /* Loggin just if debug it true */
        if(_debug) console.log.apply(console, args);
    }

    return {
        scope: '@',
        link:link
    }
}]);
