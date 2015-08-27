//controller of store view
storeApp.controller('storeCtrl', function ($scope, $rootScope, bookFactory, cartService, settings, $cookies, $cookieStore, $location) {
	//get book list when entering this view
	$scope.init = function () {
		bookFactory.getBooks()
		.then(function (response) {
			$rootScope.bookList = response;
        },
        function (data) {
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
storeApp.controller('cartCtrl', function ($timeout, $scope, $rootScope, bookFactory, settings, cartService, $cookies, $cookieStore, $window) {
	$scope.init = function () {
		$scope.selectedIndex = -1;
		$scope.selection = [];
		$scope.nberror = false;
		$scope.allChecked = true;
		$scope.allUnchecked = false;
		$scope.allCheckClicked();	
	};
	//select all or deselect all in shopping cart
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
	//when book selection changed
	//check the books are all selected or not 
	$scope.allCheckOrNot = function (book) {
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
    //modify book quantiy in cart
	$scope.addOrMinus = function (book) {
		//if nb is number and nb > 0
		//else do nothing
		var num = /^[0-9\s\+]+$/;
		if(book.nb && book.nb.toString().match(num) && book.nb <= 30) {
			cartService.addOrMinusBook(book, book.nb);
			$scope.updateDiscount();
		} 
		else if(book.nb === null) {
			//do nothing
		}
		else {
			addErrorMessage();
			$timeout(function () {
				book.nb = 1;
				cartService.addOrMinusBook(book, book.nb);
				$scope.updateDiscount();
			}, 1000);
			
		}
		
	};
	//entirely remove a book
	$scope.remove = function (idx, book) {
		$scope.selectedIndex = idx;
		$timeout(function () {
			cartService.removeBook(idx);
			$scope.selectedIndex = -1;
			$scope.updateDiscount();
		}, 500);
	};
	//when cart changed without error
	//update the discount and the final price
	//only calculate the selected books in shopping cart
	$scope.updateDiscount = function () {
		$scope.subtotal = 0;
		$scope.discount = 0;
		$scope.total = 0;
		$scope.booksisbn = [];
		if(!$scope.allUnchecked && ($rootScope.booksadded.length != 0)) {
			angular.forEach($rootScope.booksadded, function (item) {
				if(item.Selected) {
					var j = item.nb;
					while (j>0) {
						$scope.booksisbn.push(item.isbn);
						$scope.subtotal += item.price;
						j--;
					}
				}
			});
			bookFactory.getDiscount($scope.booksisbn)
			.then(function (response) {
				$scope.discount = cartService.getBestDiscount(response, $scope.subtotal);
		        $scope.total = $scope.subtotal - $scope.discount;
		        if($scope.discount > 0) $scope.discount = '-'+$scope.discount;
	        },
	        function (data) {
	            console.log('discountList retrieval failed.')
	        });
		}
	};
	//when number input invalide, add a error message in page
	function addErrorMessage () {
		var message = angular.element('<div class="nberrormessage animate-hide" ng-class="{\'errormessage\': nberror}">Number error, please insert a number larger than 0 and smaller than 30.</div>');
		var body = angular.element(document).find('body').eq(0);
		console.log($window.pageYOffset);
		message.css (
			{
				top: ($window.pageYOffset)+'px'
			}
		);
		$timeout(function () {
			message.css (
				{
					top: ($window.pageYOffset+65)+'px',
					opacity: 1
				}
			);
		}, 200);
		$timeout(function () {
			message.css (
			{
				top: ($window.pageYOffset+100)+'px',
				opacity: 0
			}
		);
		}, 2000);
		body.append(message);
		$timeout(function () {
			message.remove();
		}, 3000);
		
	}
});