(function($) {
    "use strict";

    /*
	* Dynamically set the url to share
	*/
	function setShareUrl(){
		var actualUrl = window.location.href.replace('#disqus_thread','');
		var twitterUrl = 'http://twitter.com/share?text={title}&url={url}'.replace('{url}',actualUrl).replace('{title}',encodeURIComponent(document.title).replace(/%20/g,'+'));
		var facebookUrl = 'https://www.facebook.com/sharer/sharer.php?u={url}'.replace('{url}',actualUrl);
		var googleUrl = 'https://plus.google.com/share?url={url}'.replace('{url}',actualUrl);

		$('a.icon-twitter').attr('href',twitterUrl);
		$('a.icon-facebook').attr('href',facebookUrl);
		$('a.icon-google-plus').attr('href',googleUrl);
	}


    $(document).ready(function() {
    	setShareUrl();
        $(".post").fitVids();
    });


}(jQuery));