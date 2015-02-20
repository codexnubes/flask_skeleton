var ngApp = angular.module('ngApp', []);
ngApp.config(function($interpolateProvider) {
    $interpolateProvider.startSymbol('[{[');
    $interpolateProvider.endSymbol(']}]');
});

ngApp.controller('ngController', ['$scope', '$http', function($scope, $http) {
    // These 2 bools control wether the signup/login panels are shown.
    // At any time, at most one of them is true.
    $scope.isLogin = false;
    $scope.isSignup = false;
    $scope.isLoading = false;

    $scope.closeSignup = function() {
        $scope.isSignup = false;
        $scope.isLogin = false;
        ga('send', 'event', 'click', 'close-signup');
    }

    $scope.closeLogin = function() {
        $scope.isSignup = false;
        $scope.isLogin = false;
        ga('send', 'event', 'click', 'close-login');
    }

    $scope.showLogin = function() {
        $scope.isSignup = false;
        $scope.isLogin = true;
        ga('send', 'event', 'click', 'show-login');
    }

    $scope.showSignup = function() {
        $scope.isLogin = false;
        $scope.isSignup = true;
        ga('send', 'event', 'click', 'show-signup');
    }

    // ------------- Signup controller ---------------
    $scope.stripe_error = "";
    $scope.monthList = [{name: "January", value: 1}, {name: "February", value: 2}, {name: "March", value: 3}, {name: "April", value: 4}, {name: "May", value: 5}, {name: "June", value: 6}, {name: "July", value: 7}, {name: "August", value: 8}, {name: "September", value: 9}, {name: "October", value: 10}, {name: "November", value: 11}, {name: "December", value: 12}];
    $scope.card_month = $scope.monthList[0];  // to bind later to $scope.card.exp_month
    $scope.yearList = [2015, 2016, 2017, 2018, 2019, 2020, 2021];
    $scope.signup = {
        user_info: {
            email: "",
            password: "",
            first_name: "",
            last_name: "",
            phone_number: ""
        }
    };
    $scope.card = {
        number: "",
        cvc: "",
        exp_month: 1,
        exp_year: 2015
    }

    $scope.$watch("card_month", function () {
        $scope.card.exp_month = $scope.card_month.value;
    }, true);

    $scope.trySignup = function() {
        // does email already exist ? if not, try create stripe token.
        $scope.isLoading = true;
        ga('send', 'event', 'click', 'trySignup');
        $http.get("/api/v1/check-new-email?email=" + $scope.signup.user_info.email)
            .error(function(data, status, headers, config) {
                $scope.isLoading = false;
                ga('send', 'event', 'click', 'trySignup', 'error-mail');
                alert('An account already exists for this email.');
            })
            .success(function(data, status, headers, config) {
                ga('send', 'event', 'click', 'trySignup', 'success-mail');
                // get stripe single use token.
                // on success of stripe response : finalize signup, else say we have bad card number.
                Stripe.card.createToken($scope.card, 
                    function(status, response) {
                        // Stripe Token creation callback. If successful, tries to register on our
                        // website. If registration successful, redirect to /products.
                        if (response.error) {
                            $scope.isLoading = false;
                            $scope.stripe_error = response.error.message;
                            $scope.$apply();
                            ga('send', 'event', 'click', 'trySignup', 'error-stripe');
                        } else {
                            ga('send', 'event', 'click', 'trySignup', 'success-stripe');
                            $scope.signup.stripe_token = response.id;
                            $scope.stripe_error = "";
                            $http.post("/api/v1/register", $scope.signup)
                                .success(function(jsonData, status, headers, config) {
                                    $scope.isLoading = false;
                                    ga('send', 'event', 'click', 'trySignup', 'success-final');
                                    window.location.href = "/dashboard";
                                })
                                .error(function(jsonData, status, headers, config) {
                                    $scope.isLoading = false;
                                    ga('send', 'event', 'click', 'trySignup', 'error-final');
                                    alert('Error in account creation. Please contact us if you have any problem');
                                });
                        }
                    }
                );
            });
    }

    // ------------- Login controller ---------------
    $scope.login = {
        email: "",
        password: "",
        remember: false        
    };

    $scope.tryLogin = function() {
        $scope.isLoading = true;
        $http.post("/api/v1/login", $scope.login)
            .success(function(jsonData, status, headers, config) {
                $scope.isLoading = false;
                window.location.href = "/dashboard";
            })
            .error(function(jsonData, status, headers, config) {
                $scope.isLoading = false;
                alert('Cant connect. Sign up, use the forget your password functionality or contact us if you have any problem.');
            });
    }


    $scope.forgotPassword = function() {
        if (!$scope.login.email) {
            alert('Email missing');
            return;
        }
        $scope.isLoading = true;
        $http.get("/api/v1/forgot_password?email=" + $scope.login.email)
            .success(function(jsonData, status, headers, config) {
                $scope.isLoading = false;
                alert('Email succesfully sent');
            })
            .error(function(jsonData, status, headers, config) {
                $scope.isLoading = false;
                alert('Could not send the password to the specified email. Account may not exist.');
            });
    }
}]);