!function () {
    "use strict";
    function t(t) { return Array.prototype.map.call(t, function (t) { return "string" == typeof t ? document.createTextNode(t) : t; }); }
    [Element.prototype, DocumentFragment.prototype].forEach(function (e) { e.replaceChildren || (e.replaceChildren = function () { for (; this.firstChild;)
        this.removeChild(this.firstChild); var e = this; t(arguments).forEach(function (t) { e.appendChild(t); }); }), e.append || (e.append = function () { var e = this; t(arguments).forEach(function (t) { e.appendChild(t); }); }); }), Element.prototype.before || (Element.prototype.before = function () { var e = this; t(arguments).forEach(function (t) { e.parentNode.insertBefore(t, e); }); });
}();
