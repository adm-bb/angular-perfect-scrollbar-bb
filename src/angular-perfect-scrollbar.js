angular.module('perfect_scrollbar', []).directive('perfectScrollbar',
  ['$parse', '$window', function($parse, $window) {
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
    link: function($scope, $elem, $attr) {
      var jqWindow = angular.element($window);
      var options = {};

      for (var i=0, l=psOptions.length; i<l; i++) {
        var opt = psOptions[i];
        if ($attr[opt] !== undefined) {
          options[opt] = $parse($attr[opt])();
        }
      }

      obs_opts = {
        childList: true,
        subtree: true,
        characterData: true,
      };

      if(typeof MutationObserver === "function") {
        obs = new MutationObserver(function () {
          $elem.perfectScrollbar('update');
        });
        obs.observe($elem[0], obs_opts);
      } else {
        console.warn("Your browser does not support MutationObserver");
      }

      $scope.$evalAsync(function() {
        $elem.perfectScrollbar(options);
        var onScrollHandler = $parse($attr.onScroll)
        $elem.scroll(function(){
          var scrollTop = $elem.scrollTop()
          var scrollHeight = $elem.prop('scrollHeight') - $elem.height()
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
              $($elem).scrollTop($($elem).prop("scrollHeight"));
            }, 100);
          }
          $elem.perfectScrollbar('update');
        });
      }

      // This is necessary when you don't watch anything with the scrollbar
      $elem.bind('mouseenter', update('mouseenter'));

      $scope.$watch('scrollToTop', function(n,o) {
        if(n) {
          $elem.scrollTop(0);
          $scope.scrollToTop = false;
          update();
        }
      });

      $scope.$watch('scrollToPos', function(n,o) {
          if(n) {

            // work around if the values are on the scope instead of the controller
            if(!$scope.vm){
              $scope.vm = $scope;
            }

            // move higher or lower to show the item
            if(($scope.vm.itemPosition - $scope.vm.elementSize) <= $elem.scrollTop()){
              $elem.scrollTop($scope.vm.itemPosition - $scope.vm.elementSize);
            }
            else if (($scope.vm.itemPosition + $scope.vm.elementSize) >= ($elem.scrollTop() + $elem.height() - $scope.vm.elementScrollOffset))
            {
              $elem.scrollTop($scope.vm.itemPosition - $scope.vm.elementSize);
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

      // this is from a pull request - I am not totally sure what the original issue is but seems harmless
      if ($attr.refreshOnResize) {
        jqWindow.on('resize', update);
      }

      $elem.bind('$destroy', function() {
        jqWindow.off('resize', update);
        $elem.perfectScrollbar('destroy');
      });

    }
  };
}]);
