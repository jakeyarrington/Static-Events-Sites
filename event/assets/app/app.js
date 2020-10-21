(function($) {

	function show_message($message) {
		return $('div#loader').html('<p>' + $message + '</p>');
	};

	/* No ID specified */
	if(window.location.search.substring(0,4) !== '?id=') {
		return show_message('Oh no, the URL is not valid, please close this window.');
	}

	var data = JSON.parse(atob(window.location.search.replace('?id=', '')));

	if(typeof data !== 'object') {
		return show_message('Oh no, the URL provided is invalid, please close this window.');
	}

	var path = typeof data.is_product == 'undefined' ? 'get_event' : 'get_event_by_product';

	$.get(data.url + '/wp-json/events/v1/' + path + '/' + data.id, function(data) {

		var date = new Date(data.start_date);
		var now = new Date();

		if(now < date) {
			$('div#loader').html('<p>'+data.pre_event_message+'</p>');
			setTimeout(function() {
				window.location.reload();
			}, 30000);

			return;
		}

		$('div#container > h1.title').text(data.title);
		$('div#container > div.video').html(data.embed_code);
		$('div#loader').addClass('uk-hidden');
		$('div#container').removeClass('uk-hidden');
	});



})(jQuery);