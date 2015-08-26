//controller of store view
storeApp.controller('storeCtrl', function ($scope, $rootScope, bookFactory, cartService, settings, $cookies, $cookieStore, $location) {
	//get book list when entering this view
	$scope.init = function() {
		bookFactory.getBooks()
		.then(function(response) {
			$rootScope.bookList = response;
        },
        function(data) {
            console.log('bookList retrieval failed.')
        });
		
	};
	//function to add a book in shopping cart
	$scope.add = function (book) {
		cartService.addCart(book,1);
	}
	//function buy 
	$scope.buy = function (book) {
		//add new book
		$scope.add(book);
		//go to shopping cart view
		$location.path('/cart');
	}
	
});

//controller of shopping cart view
storeApp.controller('cartCtrl', function ($timeout, $scope, $rootScope, bookFactory, settings, cartService, $cookies, $cookieStore){
	$scope.init = function() {
		$scope.selectedIndex = -1;
		$scope.selection = [];
		//if ($rootScope.booksadded.length == 0) {
			//$scope.allChecked = false;
			//$scope.allUnchecked = true;
		//} else{
			$scope.allChecked = true;
			$scope.allUnchecked = false;
			$scope.allCheckClicked();
		//}
		
		
	};

	$scope.allCheckClicked = function () {
		var boo = $scope.allChecked;
		console.log($scope.allChecked);
		$scope.allUnchecked = !boo;
		console.log($scope.allUnchecked);
		angular.forEach($rootScope.booksadded, function (item) {
        	item.Selected = boo;
        	console.log(item.Selected);
    	});
		$scope.updateDiscount();
	};
	$scope.clickedbox = function (book) {
        var count = 0;
        angular.forEach($rootScope.booksadded, function (item) {
            if(item.Selected) count++;	    
        });
        if(count == $rootScope.booksadded.length) {
        	$scope.allChecked = true;
        	$scope.allUnchecked = false;
        } 
        else if(count == 0) {
        	$scope.allUnchecked = true;
        	$scope.allChecked = false;
        }
        else {
        	$scope.allChecked = false;
        	$scope.allUnchecked = false;
        } 
        $scope.updateDiscount();
    };
	$scope.addOrMinus = function (book) {
		//if nb is number and nb > 0
		//else do nothing
		var num = /^[0-9\s\+]+$/;
		console.log(book.nb);
		if (book.nb && book.nb.toString().match(num) && book.nb <= 30) {
			cartService.addOrMinusBook(book, book.nb);
			$scope.updateDiscount();
		}
		
	};
	$scope.remove = function (idx, book) {
		$scope.selectedIndex = idx;
		$timeout(function () {
			cartService.removeBook(idx);
			$scope.selectedIndex = -1;
			$scope.updateDiscount();
		}, 500);
	};
	$scope.updateDiscount = function () {
		//$scope.loading = true;
		$scope.subtotal = 0;
		$scope.discount = 0;
		$scope.total = 0;
		$scope.booksisbn = [];
		if(!$scope.allUnchecked && ($rootScope.booksadded.length != 0)) {
			for(var i=0; i<$rootScope.booksadded.length; i++){
				if ($rootScope.booksadded[i].Selected) {
					var j = $rootScope.booksadded[i].nb;
					while (j>0) {
						$scope.booksisbn.push($rootScope.booksadded[i].isbn);
						$scope.subtotal += $rootScope.booksadded[i].price;
						j--;
					}
				}
			}
			bookFactory.getDiscount($scope.booksisbn)
			.then(function(response) {
				$scope.discount = cartService.getBestDiscount(response, $scope.subtotal);
		        $scope.total = $scope.subtotal - $scope.discount;
		        if ($scope.discount > 0) $scope.discount = '-'+$scope.discount;
	        },
	        function(data) {
	            console.log('discountList retrieval failed.')
	        });
		}
	};
});