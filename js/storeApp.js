var storeApp = angular.module('storeApp', ['ngRoute', 'ngCookies']);

storeApp.run(function (bookFactory, $rootScope,$cookieStore, $window, $location) {
  //initial cart
  $rootScope.booksisbn = [];
  //get books isbn from cookie
  if($cookieStore.get('booksadded'))
    $rootScope.booksadded = $cookieStore.get('booksadded');
  else 
    $rootScope.booksadded = [];
  //initial store books list 
  $rootScope.bookList = [];
  $rootScope.cartHover = false;
  //page scroll to top when changing view 
  $rootScope.$on('$routeChangeSuccess', function () {
    var interval = setInterval(function () {
      if(document.readyState == 'complete') {
        $window.scrollTo(0, 0);
        clearInterval(interval);
      }
    }, 200);
  });
  $rootScope.gotocart = function () {
    $location.path('/cart');
  };
});

//angular router configuration, 2 views: store, shopping cart
storeApp.config(['$routeProvider',
  function ($routeProvider) {
    $routeProvider.
    when('/store', {
      templateUrl: '../templates/store.html',
      controller: 'storeCtrl'
    }).
    when('/cart', {
      templateUrl: '../templates/shoppingcart.html',
      controller: 'cartCtrl'
    }).
    otherwise({
      redirectTo: '/store'
    });
  }
]);

//set some constant if needed
storeApp.constant('settings', {
  baseURL: 'http://henri-potier.xebia.fr/books'
});

//a custom directive for book item in store view
storeApp.directive('bookItem', function () {
  return {
    template:
      '<div class="post book">'
      + '<img class="bookCover" ng-src="{{book.cover}}">'
      + '<h2><span class="bookTitle">{{book.title}}</span></h2>'
      + '<h2><span class="bookPrice">&euro; {{book.price}}</span></h2>'
      + '<h2><add-to-cart-button class="addtocart myButton" ng-click="add(book)" targetsrc="{{book.cover}}">Add to cart</add-to-cart-button>'
      + '<button class="myButton buy" ng-click="buy(book)">Buy</button></h2>'
      + '</div>'
  };
});

//directive to prevent page scrolling when scorlling overflowed shopping cart menu
storeApp.directive('isolateScrolling', function () {
  startY = 0;
  return {
    restrict: 'A',
      link: function (scope, element, attr) {
        element.bind('DOMMouseScroll', function (e) {
          if(e.detail > 0 && this.clientHeight + this.scrollTop == this.scrollHeight) {
            this.scrollTop = this.scrollHeight - this.clientHeight;
            e.stopPropagation();
            e.preventDefault();
            return false;
          }
          else if(e.detail < 0 && this.scrollTop <= 0) {
            this.scrollTop = 0;
            e.stopPropagation();
            e.preventDefault();
            return false;
          }
        });
        element.bind('mousewheel', function (e) {
          console.log(e.deltaY);
          if(e.deltaY > 0 && this.clientHeight + this.scrollTop >= this.scrollHeight) {
            this.scrollTop = this.scrollHeight - this.clientHeight;
            e.stopPropagation();
            e.preventDefault();
            return false;
          }
          else if(e.deltaY < 0 && this.scrollTop <= 0) {
            this.scrollTop = 0;
            e.stopPropagation();
            e.preventDefault();
            return false;
          }

          return true;
        });
        element.bind('touchstart', function (e) {
          startY = e.touches[0].pageY;
        });
        element.bind('touchmove', function (e) {
          console.log(e);
          console.log(this.scrollTop);
          console.log(this.scrollHeight);
          if(startY - event.touches[0].pageY > 0 && this.clientHeight + this.scrollTop >= this.scrollHeight) {
            this.scrollTop = this.scrollHeight - this.clientHeight;
            e.stopPropagation();
            e.preventDefault();
            return false;
          }
          else if(startY - event.touches[0].pageY < 0 && this.scrollTop <= 0) {
            this.scrollTop = 0;
            e.stopPropagation();
            e.preventDefault();
            return false;
          }
          return true;
        });
      
      }
  };
});

//add to card button with flying to cart effect 
storeApp.directive('addToCartButton', function ($window) {
  function link (scope, element, attributes) {
    element.on('click', function (event) {
      var imgSrc = attributes.targetsrc;
      var cartElem = angular.element(document.getElementsByClassName("shopping-cart"));
      var offsetTopCart = cartElem.prop('offsetTop');
      var offsetLeftCart = cartElem.prop('offsetLeft');
      var widthCart = cartElem.prop('offsetWidth');
      var heightCart = cartElem.prop('offsetHeight');
      if(angular.element(event.target.parentNode.parentNode.parentNode.firstChild).prop('className') == 'bookCover'){
        var parentElem = angular.element(event.target.parentNode.parentNode.parentNode);
        var imgElem = angular.element(event.target.parentNode.parentNode.parentNode.childNodes[0]);
      }
      else {
        var parentElem = angular.element(event.target.parentNode.parentNode);
        var imgElem = angular.element(event.target.parentNode.parentNode.childNodes[0]);
      }
      var offsetLeft = imgElem.prop("offsetLeft");
      var offsetTop = imgElem.prop("offsetTop");
      var height = imgElem.prop("height");
      var imgClone = angular.element('<img src="' + imgSrc + '"/>');
      imgClone.css({
        'height': height,
        'position': 'absolute',
        'top': offsetTop + 'px',
        'left': offsetLeft + 'px',
        'opacity': 0.7
      });
      imgClone.addClass('itemaddedanimate');
      parentElem.append(imgClone);
      setTimeout(function () {
        imgClone.css({
          'height': '75px',
          'top': (offsetTopCart + heightCart/2 + $window.scrollY)+'px',
          'left': (offsetLeftCart+widthCart/2)+'px',
          'opacity': 0.5,
          'z-index': 99
        });
      }, 500);
      setTimeout(function () {
        imgClone.css({
          'height': 0,
          'opacity': 0.5
          
        });
        angular.element(angular.element(cartElem.prop("childNodes")[1]).prop("childNodes")[1]).addClass('shakeit');
      }, 1000);
      setTimeout(function () {
        angular.element(angular.element(cartElem.prop("childNodes")[1]).prop("childNodes")[1]).removeClass('shakeit');
        imgClone.remove();
      }, 1500);
    });
  };
  return {
    restrict: 'E',
    link: link,
    transclude: true,
    replace: true,
    scope: {},
    template: '<button class="add-to-cart" ng-transclude></button>'
  };
});

//factory for generating http get requests
storeApp.factory('bookFactory', function ($http, settings, $q) {
  return {
    //get book list
    getBooks: function () {
      var def = $q.defer();
      $http.get(settings.baseURL)
      //$http.get('http://localhost:1337/henri-potier.xebia.fr/books')
      .success(function (data) {
        var bookList = data;
        def.resolve(bookList);
      })
      .error(function () {
        def.reject("Failed to get bookList");
      });
      return def.promise;
    },
    //get discount list for a selection of books
    getDiscount: function (booksisbn) {
      var def = $q.defer();
      $http.get(settings.baseURL + '/' +  booksisbn.join(',') + '/commercialOffers')
      //$http.get('http://localhost:1337/henri-potier.xebia.fr/books' + '/' +  booksisbn.join(',') + '/commercialOffers')
      .success(function (data) {
        var discountList = data;
        def.resolve(discountList);
      })
      .error(function () {
        def.reject("Failed to get discountList");
      });
      return def.promise;

    }
  }
});

//shopping cart services: addbook, minusbook, removebook, update cart, calculate best discount, save cookie
storeApp.service('cartService', function ($rootScope, $cookieStore, $cookies) {
    this.getBestDiscount = function (data, subtotal) {
      //data: discount information in json
      var bestDiscount = 0;
      var offers = data.offers;
      //loop in each kind of discount to find the best
      angular.forEach(offers, function (offer) {
        //type percentage
        if(offer.type == 'percentage') {
          var discount = subtotal * offer.value / 100;
        }
        //type minus
        else if(offer.type == 'minus') {
          var discount = offer.value;
        }
        //type slice
        else if(offer.type == 'slice') {
          var discount = offer.value * Math.floor(subtotal / offer.sliceValue);
        }
        else {
          var discount = 0;
        }
        //if current discount is better 
        if(discount > bestDiscount) bestDiscount = discount;
      });
      return bestDiscount;
    };
    //add book to cart
    this.addCart = function (book, nb) {
      var find = false;
      angular.forEach($rootScope.booksadded, function (item) {
        if(item.isbn == book.isbn) {
          item.nb += nb;
          find = true;
        }
      });
      if(!find) {
        $rootScope.booksadded.push(book);
        $rootScope.booksadded[$rootScope.booksadded.length-1].nb = nb;
      }
      this.saveCart();
    };
    //modify book quantity
    this.addOrMinusBook= function (book, nb) {
      angular.forEach($rootScope.booksadded, function (item) {
        if(item.isbn == book.isbn) {
          item.nb = nb;
        }
      });
      this.saveCart();
    };
    //called when shopping cart changed, save the cookie
    this.saveCart = function () {
      $cookieStore.put('booksadded',  $rootScope.booksadded);
    };
    //entirely remove a book 
    this.removeBook = function (idx) {
      $rootScope.booksadded.splice(idx, 1);
      this.saveCart();
    };
});

