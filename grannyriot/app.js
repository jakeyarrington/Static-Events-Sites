(function($) {

	var firebaseConfig = {
		apiKey: "AIzaSyDK_glRCmncqXOP9VSpo2h2i296AKC0zcs",
	    authDomain: "event-bouncer.firebaseapp.com",
	    databaseURL: "https://event-bouncer.firebaseio.com",
	    projectId: "event-bouncer",
	    storageBucket: "event-bouncer.appspot.com",
	    messagingSenderId: "781638137622",
	    appId: "1:781638137622:web:c8628fb62be2551d584237",
	    measurementId: "G-S1B5JT8CWV"
	};

	var lang = {
		token_prompt: 'Please enter your token to view this page..',
		overwrite_session: 'Another person is currently viewing this page using the same token, would you like to continue?',
		error_validation: 'An issue occurred when trying to validate your token.',
		error_invalid_token: 'The token provided is invalid, please close this page and try again.',
		error_loading_page: 'An error occured loading the page!'
	};

	var token = false;
	var ip = false;
	firebase.initializeApp(firebaseConfig);
	var database = firebase.database();

	$.getJSON('https://json.geoiplookup.io/api?callback=?', function(data) {
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
		} else {
			token = window.prompt(lang.token_prompt);
		}

		if(token) {

			firebase.database().ref('/users/' + token).once('value').then(function(e) {
				var data = e.val();
				var overwrite = true;
				var views = parseInt(data.count);
				var my_ip = String(data.ip);

				if(my_ip !== ip) {
					overwrite = confirm(lang.overwrite_session);
				}

				if(isNaN(views)) {
					views = 0;
				}

				if(overwrite) {
					if(location.protocol == 'file:') {
						$('html > body').html('<h1>Local test mode</h1>');
						$('html').attr('app-loaded', 'true');
					} else {
						firebase.database().ref('/users/' + token).set({
							ip: ip,
							count: parseInt(views) + 1
						}).then(function(e) {

							$.ajax({ 
								url: './view.html', 
								success: function(data) { 
									$('html > body').html(data);
									$('html').attr('app-loaded', 'true'); 
								},
								error: function(e) {
									alert(lang.error_loading_page);
								}
							});

						});
					}
					
				}



			}).catch(function(e) {
				console.log(e);
				alert(lang.error_validation);
			});

		} else {
			alert(lang.error_invalid_token);
		}

	  }
	});



	


	

})(jQuery);