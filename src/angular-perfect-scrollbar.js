var Ps = require('perfect-scrollbar');

angular.module('perfect_scrollbar', []).directive('perfectScrollbar',
  ['$parse', '$window', function($parse, $window) {

    //Ps options to test against when creating options{}
    var psOptions = [
      'wheelSpeed', 'wheelPropagation', 'minScrollbarLength', 'useBothWheelAxes',
      'useKeyboard', 'suppressScrollX', 'suppressScrollY', 'scrollXMarginOffset',
      'scrollYMarginOffset', 'includePadding'//, 'onScroll', 'scrollDown'
    ];

    return {
      restrict: 'EA',
      transclude: true,
      template: '<div><div ng-transclude></div></div>',
      replace: true,
      scope: {
        scrollToTop: '=',
        scrollToPos: '=',
        elementSize: '=',
        itemPosition: '=',
        elementScrollOffset: "="
      },
      link: function($scope, $elem, $attr) {
        if ($attr.perfectScrollbar == "false") return;
        var el = $elem[0];
        var jqWindow = angular.element($window);
        var options = {};

        //search Ps lib options passed as attrs to wrapper
        for (var i=0, l=psOptions.length; i<l; i++) {
          var opt = psOptions[i];
          if (typeof $attr[opt] !== 'undefined') {
            options[opt] = $parse($attr[opt])();
          }
        }

        $scope.$evalAsync(function() {
          Ps.initialize(el, options);
          var onScrollHandler = $parse($attr.onScroll);
          $elem.on('scroll', function(){
            var scrollTop = el.scrollTop;
            var scrollHeight = el.scrollHeight - el.clientHeight;
            $scope.$apply(function() {
              onScrollHandler($scope, {
                scrollTop: scrollTop,
                scrollHeight: scrollHeight
              })
            })
          });
        });

        function update(event) {
          $scope.$evalAsync(function() {
            if ($attr.scrollDown == 'true' && event != 'mouseenter') {
              setTimeout(function () {
                el.scrollTop = el.scrollHeight;
              }, 100);
            }
            Ps.update(el);
          });
        }

        // This is necessary when you don't watch anything with the scrollbar
        $elem.bind('mouseenter', function() {update('mouseenter')});

      $scope.$watch('scrollToTop', function(n,o) {
        if(n) {
          $elem.scrollTop(0);
          $scope.scrollToTop = false;
          update();
        }
      });

      $scope.$watch('scrollToPos', function(n,o) {
          if(n) {

            // move higher or lower to show the item
            if(($scope.itemPosition - $scope.elementSize) <= $elem.scrollTop()){
              $elem.scrollTop($scope.itemPosition - $scope.elementSize);
            }
            else if (($scope.itemPosition + $scope.elementSize) >= ($elem.scrollTop() + $elem.height() - $scope.elementScrollOffset))
            {
              $elem.scrollTop($scope.itemPosition - $scope.elementSize);
            }
            // otherwise item should already be in view.

            $scope.scrollToPos = false;
            update();
          }
      });

      // Possible future improvement - check the type here and use the appropriate watch for non-arrays
      if ($attr.refreshOnChange) {

        $scope.$watchCollection($attr.refreshOnChange, function() {
          update();
        });
      }

        // update scrollbar once window is resized
        if ($attr.refreshOnResize) {
          jqWindow.on('resize', update);
        }

        $elem.bind('$destroy', function() {
          jqWindow.off('resize', update);
          Ps.destroy(el);
        });

    }
  };
}]);
