// Generated by CoffeeScript 1.10.0
(function() {
  module.exports = function(string) {
    return "return require('jsedn').parse(\"" + (string.replace(/"/g, '\\"').replace(/\n/g, " ").trim()) + "\")";
  };

}).call(this);
