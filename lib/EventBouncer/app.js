
var EventBouncer = {
	eventId: null,
	apiKey: "AIzaSyDK_glRCmncqXOP9VSpo2h2i296AKC0zcs",
    authDomain: "event-bouncer.firebaseapp.com",
    databaseURL: "https://event-bouncer.firebaseio.com",
    projectId: "event-bouncer",
    storageBucket: "event-bouncer.appspot.com",
    messagingSenderId: "781638137622",
    appId: "1:781638137622:web:c8628fb62be2551d584237",
    measurementId: "G-S1B5JT8CWV",

	init: function(eventId, eventName, $onSuccess, $onLockout) {
		var app = EventBouncer;

		if(typeof $onLockout !== 'function') {
			$onLockout = function(){};
		}

		if(!eventId || typeof eventId !== 'number') {
			return console.error('Please set the event ID before constructing Event Bouncer.');
		}

		app.eventId = eventId;
		app.onSuccess = $onSuccess;
		app.onLockout = $onLockout;
		app.eventName = eventName;

		(function($, $app) {

			var firebaseConfig = {
				apiKey: $app.apiKey,
			    authDomain: $app.authDomain,
			    databaseURL: $app.databaseURL,
			    projectId: $app.projectId,
			    storageBucket: $app.storageBucket,
			    messagingSenderId: $app.messagingSenderId,
			    appId: $app.appId,
			    measurementId: $app.measurementId
			};

			var lang = {
				token_prompt: 'Please enter your email address to view this page..',
				overwrite_session: 'Another person is currently viewing this page using the same token, would you like to continue?',
				error_validation: 'An issue occurred when trying to validate your token.',
				error_invalid_token: 'The token provided is invalid, please close this page and try again.',
				error_loading_page: 'An error occured loading the page!',
				ip_changed: 'Somebody else is using this token, please reload the page to gain access.'
			};

			var token = false;
			var ip = false;
			firebase.initializeApp(firebaseConfig);
			var database = firebase.database();

			/* Get the users IP */
			$.getJSON('https://api.ipify.org?format=jsonp&callback=?', function(data) {
			  if(typeof data == 'object' && typeof data.ip !== 'undefined') {
			  	ip = String(data.ip);

			  	if(location.search.indexOf('?token') > -1) {
					var args = location.search.replace('?', '').split('&');
					for (var i = 0; i < args.length; i++) {
						if(args[i].indexOf('=') > -1) {
							var arg = args[i].split('=');
							if($.trim(arg[0]) == 'token') {
								token = $.trim(arg[1]);
							}
						}
					}

					validate_token(token);

				} else {

					$.confirm({
						title: lang.token_prompt,
						useBootstrap: false,
						content: '' +
					    '<form action="" class="uk-form-stacked">' +
					    '<div>' +
					    '<label class="uk-form-label">Enter the email address you used when purchasing your ticket..</label>' +
					    '<div class="uk-form-controls">' +
					    '<input type="text" placeholder="you@example.com" class="email uk-input" required />' +
					    '</div>' +
					    '</div>' +
					    '</form>',
					    buttons: {
					        formSubmit: {
					            text: 'Confirm',
					            btnClass: 'btn-blue',
					            action: function () {
					                var email = this.$content.find('.email').val();
					                if(!email){
					                    $.alert({
					                    	title: 'Hmm..',
					                    	content: '<p>You must provide a valid email address</p>',
					                    	useBootstrap: false
					                    });
					                    return false;
					                }

					                validate_token(CryptoJS.MD5(email.toLowerCase()));

					            }
					        }
					    },
					    onContentReady: function () {
					        // bind to events
					        var jc = this;
					        this.$content.find('form').on('submit', function (e) {
					            e.preventDefault();
					            jc.$$formSubmit.trigger('click');
					        });
					    }
					})

				}

				return;
				if(token) {

				} else {
					alert(lang.error_invalid_token);
				}

			  }
			});

			function validate_token(token) {
			    const entry = firebase.database().ref('/' + $app.eventName + '/' + token)
				entry.once('value').then(function(e) {
					var data = e.val();

					if(typeof data.events[$app.eventId] !== 'undefined') {

						data = data.events[$app.eventId];

						var count = parseInt(data.count);
						var ip_address = String(data.ip);

						if(isNaN(count)) {
							count = 0;
						}

						if(location.protocol == 'file:') {
							$('html > body').html('<h1>Local test mode</h1>');
							$('html').attr('app-loaded', 'true');
						} else {
							firebase.database().ref('/users/' + token + '/events/' + $app.eventId).set({
								ip: ip,
								count: parseInt(count) + 1
							}).then(function(e) {
								$app.onSuccess(data);
								// $.ajax({ 
								// 	url: './view.html', 
								// 	success: function(data) { 

								// 		// $('html > body').append('<main></main>');
								// 		// $('html > body > main').html(data);
								// 		// $('html').attr('app-loaded', 'true'); 
								// 	},
								// 	error: function(e) {
										
								// 		// return $.alert({
					   //   //                	title: 'Permission Denied',
					   //   //                	content: '<p>You do not have permission to view this page.</p>',
					   //   //                	useBootstrap: false
					   //   //                });
								// 	}
								// });

								entry.on('child_changed', function(e) {
								     var data = e.val();
								     if(String(data.ip) !== ip) {
								     	$('html > body > main').html('');
								     	setTimeout(function() {
								     		$('html').removeAttr('app-loaded');
								     		$app.onLockout();
								     		return $.alert({
						                    	title: 'Locked Out',
						                    	content: '<p>Somebody else is using this token, please reload the page to gain access.</p>',
						                    	useBootstrap: false
						                    });
								     	}, 1000);
								     }
								});

							});
						}
							

					} else {
						return $.alert({
			            	title: 'Permission Denied',
			            	content: '<p>You do not have permission to view this page.</p>',
			            	useBootstrap: false
			            });
					}




				}).catch(function(e) {
					console.log(e);
					return $.alert({
			            	title: 'Permission Denied',
			            	content: '<p>The information provided could not be validated, please try again.</p>',
			            	useBootstrap: false
			            });
				});
			}

		})(jQuery, app);

	}

};

