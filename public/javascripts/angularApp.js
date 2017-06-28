var app = angular.module('diccionero', ['ui.router']);

app.config([
	'$stateProvider',
	'$urlRouterProvider',
	function($stateProvider, $urlRouterProvider){
		$stateProvider.state('home', {
			url:'/home',
			templateUrl: '/home.html',
			controller: 'MainCtrl',
			resolve: {
				postPromise: ['posts', function(posts){
					return posts.getAll();
				}],
				votedPromise: ['voted', 'auth', function(voted, auth){
					if (auth.isLoggedIn()) {
						return voted.getAll();
					}
				}]
			}
		})
		.state('posts', {
			url:'/posts/{id}',
			templateUrl:'/posts.html',
			controller:'PostsCtrl',
			resolve: {
				post: ['$stateParams', 'posts', function($stateParams, posts){
					return posts.get($stateParams.id);
				}],
				votedPromise: ['voted', function(voted){
					return voted.getAll();
				}],
				votedCommPromise: ['votedcomm', function(votedcomm){
					return votedcomm.getAll();
				}]
			}
		})
		.state('login', {
			url: '/login',
			templateUrl: '/login.html',
			controller: 'AuthCtrl',
			onEnter: ['$state', 'auth', function($state, auth){
				if (auth.isLoggedIn()) {
					$state.go('home');
				}
			}]
		})
		.state('addPost', {
			url: '/post',
			templateUrl: '/post.html',
			controller: 'MainCtrl'
		})
		.state('register', {
			url: '/register',
			templateUrl: '/register.html',
			controller: 'AuthCtrl',
			onEnter: ['$state', 'auth', function($state, auth){
				if (auth.isLoggedIn()) {
					$state.go('home');
				}
			}]
		});
		$urlRouterProvider.otherwise('home');
	}]);

app.factory('posts', ['$http', 'auth', function($http, auth){
	var o = {
		posts: []
	};
	o.getAll = function(){
		return $http.get('posts').success(function(data){
			angular.copy(data, o.posts);
		});
	};
	o.create = function(post){
		return $http.post('/posts', post, {
			headers: {Authorization: 'Bearer '+auth.getToken()}
		}).success(function(data){
			o.posts.push(data);
		});
	};
	o.upvote = function(post){
		return $http.put('/posts/' + post._id + '/upvote', null, {
			headers: {Authorization: 'Bearer '+auth.getToken()}
		}).success(function(data){
			post.upvotes += 1;
		});
	};
	o.downvote = function(post){
		return $http.put('/posts/' + post._id + '/downvote', null, {
			headers: {Authorization: 'Bearer '+auth.getToken()}
		}).success(function(data){
			post.downvotes += 1;
		});
	};
	o.get = function(id){
		return $http.get('/posts/'+ id).then(function(res){
			return res.data;
		});
	};
	o.addComment = function(id, comment){
		return $http.post('/posts/'+ id + '/comments', comment, {
			headers: {Authorization: 'Bearer '+auth.getToken()}
		});
	};
	o.downvoteComment = function(post, comment) {
	  return $http.put('/posts/' + post._id + '/comments/'+ comment._id + '/downvote', null, {
	  	headers: {Authorization: 'Bearer '+auth.getToken()}
	  }).success(function(data){
	      comment.downvotes += 1;
    });
	};
	o.upvoteComment = function(post, comment) {
	  return $http.put('/posts/' + post._id + '/comments/'+ comment._id + '/upvote', null, {
	  	headers: {Authorization: 'Bearer '+auth.getToken()}
	  }).success(function(data){
	      comment.upvotes += 1;
    });  
};
	o.removeVoted = function(id, comment){
		return $http.delete('/api/removepostvoted/'+post._id, null, {
			headers: {Authorization: 'Bearer '+auth.getToken()}
		});
	};
	return o;
}]);

app.factory('voted', ['$http', 'auth', function($http, auth){
	var v = {
		votedposts: []
	};
	v.getAll = function(){
		return $http.post('/api/getpostsvoted', null, {
			headers: {Authorization: 'Bearer '+auth.getToken()}}).success(function(data){
			angular.copy(data, v.votedposts);
		});
	};
	return v;
}]);

app.factory('votedcomm', ['$http', 'auth', function($http, auth){
	var v = {
		votedcomments: []
	};
	v.getAll = function(){
		return $http.post('/api/getcommentsvoted', null, {
			headers: {Authorization: 'Bearer '+auth.getToken()}}).success(function(data){
			angular.copy(data, v.votedcomments);
		});
	};
	return v;
}]);

app.factory('auth', ['$http', '$window', function($http, $window){
	var auth = {};

	auth.saveToken = function(token){
		$window.localStorage['flapper-news-token'] = token;
	};

	auth.getToken = function(){
		return $window.localStorage['flapper-news-token'];
	};

	auth.isLoggedIn = function(){
		var token = auth.getToken();

		if (token) {
			var payload = JSON.parse($window.atob(token.split('.')[1]));

			return payload.exp > Date.now() /1000;
		} else{
			return false;
		}
	};

	auth.currentUser = function(){
		if (auth.isLoggedIn()) {
			var token = auth.getToken();
			var payload = JSON.parse($window.atob(token.split('.')[1]));

			return payload.username;
		}
	};

	auth.currentUserId = function(){
		if (auth.isLoggedIn()) {
			var token = auth.getToken();
			var payload = JSON.parse($window.atob(token.split('.')[1]));

			return payload._id;
		}
	};

	auth.register = function(user){
		return $http.post('/register', user).success(function(data){
			auth.saveToken(data.token);
		});
	};

	auth.logIn = function(user){
		return $http.post('/login', user).success(function(data){
			auth.saveToken(data.token);
		});
	};

	auth.logOut = function(){
		$window.localStorage.removeItem('flapper-news-token');
	};

	$http.defaults.headers.common['Authorization'] = "Bearer " + $window.localStorage['flapper-news-token'];
	return auth;
}]);


app.controller('MainCtrl', [
		'$scope',
		'voted',
		'posts',
		'auth',
		'$state',
		function($scope, voted, posts, auth, $state){
			$scope.voted = voted.votedposts;
			$scope.posts = posts.posts;
			$scope.isLoggedIn = auth.isLoggedIn;
			$scope.addPost = function(){
				if (!$scope.title || $scope.title === '') {return;};
				posts.create({
					title: $scope.title,
					definition : $scope.definition,
					example: $scope.example,
					country: $scope.country,
					tags: $scope.tags
				});
				$scope.title='';
				$scope.definition='';
				$scope.example='';
				$scope.country='';
				$scope.tags='';
			};
			$scope.incrementUpvotes = function(post){
				if($scope.voted.indexOf(post._id) > -1)
        			return;
				posts.upvote(post);
				$scope.voted.push(post._id);
			};
			$scope.decrementUpvotes = function(post){
				if($scope.voted.indexOf(post._id) > -1)
        			return;
			  posts.downvote(post);
			  $scope.voted.push(post._id);
			};
			$scope.IsVotedAlready = function(postId) {
			    if($scope.voted.indexOf(postId) > -1)
			        return true;
			    return false;
			};
			$scope.changeState = function(){
			$state.go('addPost');
			};
}])
.controller('PostsCtrl', [
	'$scope',
	'posts',
	'post',
	'voted',
	'votedcomm',
	'auth',
	function($scope, posts, post, voted, votedcomm, auth){
		$scope.voted = voted.votedposts;
		$scope.votedcomments = votedcomm.votedcomments;
		$scope.post = post;
		$scope.isLoggedIn = auth.isLoggedIn;

		$scope.addComment = function(){
			if ($scope.body === '') {return;}
			posts.addComment(post._id, {
				body: $scope.body,
				author: auth.currentUser,
			}).success(function(comment){
				$scope.post.comments.push(comment);
			});
			$scope.body = '';
		};
		$scope.incrementUpvotes = function(post){
			if($scope.voted.indexOf(post._id) > -1)
       			return;
			posts.upvote(post);
			$scope.voted.push(post._id);
		};
		$scope.decrementUpvotes = function(post){
			if($scope.voted.indexOf(post._id) > -1)
       			return;
		  posts.downvote(post);
		  $scope.voted.push(post._id);
		};
		$scope.IsVotedAlready = function(postId) {
		    if($scope.voted.indexOf(postId) > -1)
		        return true;
		    return false;
		};
		$scope.incrementUpvotesC = function(comment){
			if($scope.votedcomments.indexOf(comment._id) > -1)
       			return;
		  posts.upvoteComment(post, comment);
		  $scope.votedcomments.push(comment._id);
		};
		$scope.decrementUpvotesC = function(comment){
			if($scope.votedcomments.indexOf(comment._id) > -1)
       			return;
		  posts.downvoteComment(post, comment);
		  $scope.votedcomments.push(comment._id);
		};
		$scope.IsVotedAlreadyC = function(commentId) {
		    if($scope.votedcomments.indexOf(commentId) > -1)
		        return true;
		    return false;
		};
}])
.controller('AuthCtrl', [
	'$scope',
	'$state',
	'auth',
	function($scope, $state, auth){
		$scope.user = {};

		$scope.register = function(){
			auth.register($scope.user).error(function(error){
				$scope.error = error;
			}).then(function(){
				$state.go('home');
			});
		};
		$scope.logIn = function(){
			auth.logIn($scope.user).error(function(error){
				$scope.error = error;
			}).then(function(){
				$state.go('home');
			});
		};
}])
.controller('NavCtrl', [
	'$scope',
	'auth',
	'$state',
	function($scope, auth, $state){
		$scope.isLoggedIn = auth.isLoggedIn;
		$scope.currentUser = auth.currentUser;
		$scope.logOut = auth.logOut;
		$scope.changeState = function(){
			$state.go('addPost');
			};
}]);