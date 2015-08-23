(function($) {
    "use strict";

    /*
     * This class handle all the posts related functions
     *
     */
    var PostHandler = function() {

        this.postSelector = '.cont-post-article';
        this.$post = $(this.postSelector);
        this.$pagination = $("[data-paginationurl]");
        this.$paginationContainer = this.$pagination.parents('.pagination');
        this.$tagMenu = $('.menu-list-tag:not(.single-post-tags)');
        this.$container = $('.post-container');
        this.$searchInput = $('input[data-element="search-input"]');
        this.$searchForm = $('#search-form');
        this.$searchSubmit = $('.submit-search');
        this.searchNothingFound = '<div class="cont-post-article fadeUp no-image"><article class="post"><h3>Sorry, nothing found!</h3><p>Please try again.</p></article></div>';
        this.disqusShortname = '';
        this.tagMenuHeight = 41; // .view-menu height If you change the .view-menu, maybe you will need to change this value
        this.postCount = 0;
        this.postPerPage = 0;
        this.pageCount = 0;
        this.actualPage = 1;
        this.showedPost = 0;
        this.paginationUrl = '';
        this.allPosts = [];
        this.postQueue = [];
        this.tags = [];
        this.filter = '';
        this.allFilter = '';

        var self = this;

        /*
         * Set diqus account (we take it from the data-disqus attribute inside the body tag)
         */

        function setDisqusAccount() {
            self.disqusShortname = $('body').attr('data-disqus');
        }



        /*
         * Start the discus comment on the single post page
         */
        this.startDisqusComment = function (id){
            var disqus_shortname = self.disqusShortname;
            var disqus_identifier = id;


            (function() {
                var dsq = document.createElement('script'); dsq.type = 'text/javascript'; dsq.async = true;
                dsq.src = '//' + disqus_shortname + '.disqus.com/embed.js';
                (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(dsq);
            })();
        };


        /*
         * Dynamically load disqus comments
         */

        function getDisqusNumReplies() {
            // Please do not change anything inside this function
            var links = document.getElementsByTagName('a');
            var query = '?';
            for (var i = 0; i < links.length; i++) {
                if (links[i].href.indexOf('#disqus_thread') >= 0) {
                    query += 'url' + i + '=' + encodeURIComponent(links[i].href) + '&';
                }
            }
            var s = document.createElement('script');
            s.type = 'text/javascript';
            s.src = '//' + self.disqusShortname + '.disqus.com/get_num_replies.js' + query;
            var body = document.getElementsByTagName('body')[0];
            body.appendChild(s);
        }

        /*
         * Check if there is the pagination element
         *
         * @returns {Bool}
         *
         */

        function checkPagination() {
            return (self.$pagination.length > 0);
        }

        /*
         * If there is the pagination, load other pages url and the total number of pages
         *
         */

        function setPaginationData() {
            self.postCount = self.postPerPage = self.$post.length;
            if (checkPagination) {
                self.paginationUrl = self.$pagination.attr('data-paginationurl');
                self.pageCount = self.$pagination.attr('data-pagecount');
            }

        }
        /*
         * Make an ajax call to load a new page; if the call is successful, addPost() function is called with the result
         *
         * @param {String} The url of the page to load
         * @param {Integer} The page number
         * @param {Function} Function to be called after all posts have been preloaded
         *
         */

        function ajaxCall(url, page, callback) {
            return $.ajax({
                url: url,
                type: "GET",
                dataType: "html"
            }).done(function(html) {
                var postObj,
                    post = $(html).find(self.postSelector);

                addPost(post, page, callback);
            });

        }

        /*
         * Is there is more than one page, preload all the posts using ajaxCall() function
         * @param {Function} Function to be called after all posts have been preloaded
         *
         */

        function ajaxPreload(loadedCallback) {
            if (checkPagination()) {
                var urlAr = self.paginationUrl.split('/'),
                    p = -1,
                    newUrl;

                for (var i = urlAr.length - 1; i >= 0; i--) {
                    if (parseInt(urlAr[i], 10) > 1) {
                        p = i;
                    }
                }

                for (var j = parseInt(urlAr[p], 10); j <= self.pageCount; j++) {
                    urlAr[p] = j;
                    newUrl = urlAr.join('/');
                    if (j == self.pageCount && typeof loadedCallback === 'function') {
                        ajaxCall(newUrl, j, loadedCallback);
                    } else {
                        ajaxCall(newUrl, j);
                    }
                }
            } else {
                $('.pagination').hide();
                if (typeof loadedCallback === 'function')
                    loadedCallback();
            }
        }


        /*
         * Add the post's tags to the tag menu, checking that are no duplicated values
         *
         * @param {Object} JQuery object of a post
         *
         */

        function setPostTags($post) {

            var res = [],
                term;

            $post.find('.hidden-tag-list li').each(function(index, el) {
                term = $(el).text();
                res.push(term);
                if (self.tags.indexOf(term) < 0) {
                    self.tags.push(term);
                    self.$tagMenu.append('<li><a href="#" data-tag="' + term + '">' + term + '</a></li>');
                }
            });

            return res;
        }

        /*
         * Fetch the post object and add it to the preloaded collection
         *
         * @param {Array} List of html of all post loaded inside a single
         * @param {Integer} Page number
         * @param {Function} Function to be called after all posts have been preloaded
         *
         */

        function addPost(posts, page, callback) {
            var postObj;
            $.each(posts, function(index, val) {
                //console.log(val);
                postObj = {
                    page: page,
                    html: val,
                    classes: setPostTags($(val)),
                    searchableText: $(val).find('.search-content').text(),
                    searchableTitle: $(val).find('.post-title a').text()
                };
                if(!checkPostExist(postObj))
                    self.allPosts.push(postObj);
            });

            if (typeof callback === 'function') {
                callback();
            }
        }

        function checkPostExist(post){
            var found = false;
            $.each(self.allPosts, function(index, val) {
                var check;

                if(val.searchableTitle === post.searchableTitle){
                    if($(val.html).html() === $(post.html).html()){
                        found = true;
                    }
                }

                if(found)
                    return false;
            });
            return found;
        }

        /*
         * Refresh the $post collection and its length
         *
         */

        function updateShowedPostCount() {
            self.$post = $(self.postSelector);
            self.showedPost = self.$post.length;
        }

        /*
         * Append a post to the page
         *
         * @param {Object} Post object to append
         *
         */

        function appendPost(post) {
            var $pst = $(post.html).hide();
            self.$container.append($pst);
            $pst.fadeIn('slow');
            checkMedia();
            getDisqusNumReplies();
        }

        /*
         * Check if the post contains a image or an Iframe and add a class to the post
         *
         */

        function checkMedia() {
            $(self.postSelector).each(function(index, val) {
                if ($(val).find('.post-image iframe, .post-image img').length > 0) {
                    $(val).addClass('has-image');
                } else {
                    $(val).addClass('no-image');
                }
            });
        }

        //Public methods

        /*
         * Constructor; it sets all the elements and preload all the posts
         *
         */
        this.init = function() {
            setPaginationData();
            var allTagTxt = $('.btn-select').text(),
                $allTagEl = $('<li><a href="#" data-tag="' + allTagTxt + '">' + allTagTxt + '</a></li>').hide();

            self.allFilter = allTagTxt;
            self.filter = allTagTxt;
            self.$tagMenu.append($allTagEl);

            //tagMenuHeight


            addPost(self.$post, 1);
            updateShowedPostCount();
            ajaxPreload(function(){
                self.tagMenuHeight = self.$tagMenu.height();

                self.hideTags();

                self.$tagMenu.css({
                    height: 0
                });
            });
            checkMedia();
            setDisqusAccount();
            if (this.disqusShortname)
                getDisqusNumReplies();

            if ($('.single-post-tags li').length === 0) {
                $('.post-content-tag').hide();
            }
        };

        /*
         * Load another page, depending on which tag filter is active
         *
         */
        this.loadPage = function() {
            if (self.filter === self.allFilter && self.$searchInput.val() === '') {
                if (self.actualPage < self.pageCount) {
                    var $pst;
                    self.actualPage++;
                    $.each(self.allPosts, function(index, val) {
                        if (val.page == self.actualPage) {
                            appendPost(val);
                        }
                    });
                    updateShowedPostCount();
                    if (self.actualPage >= self.pageCount) {
                        self.$paginationContainer.hide();
                    }

                }
            } else {
                updateShowedPostCount();
                if (self.postQueue.length >= self.showedPost) {
                    self.actualPage++;
                    for (var i = self.showedPost; i < self.postQueue.length; i++) {
                        appendPost(self.postQueue[i]);
                    }
                    updateShowedPostCount();
                    if (self.showedPost >= self.postQueue.length) {
                        self.$paginationContainer.hide();
                    }
                }
            }
        };

        /*
         * Display the tag menu list
         *
         */
        this.showTags = function() {
            self.$tagMenu.css({
                'border-top': false
            });
            self.$tagMenu.animate({
                height: self.tagMenuHeight
            }, 200);
        };

        /*
         * Hide the tag menu list
         *
         */
        this.hideTags = function() {
            self.$tagMenu.animate({
                height: 0
            }, 200, function() {
                self.$tagMenu.css({
                    'border-top': 0
                });
            });
        };

        /*
         * Combine showTags and hideTags method; mainly used to be attached to touch events
         *
         */
        this.showHideTags = function() {
            if (self.$tagMenu.css('height') === 0) {
                showTags();
            } else {
                hideTags();
            }
        };

        /*
         * Filter the displayed posts hiding posts without the selected tag
         *
         * @param {String} The tag to use for filtering
         */
        this.filterPosts = function(tag) {
            self.filter = tag;
            self.postQueue = [];
            self.$container.html('');

            $('.btn-select').text(tag);
            self.$tagMenu.find('li').show();
            $('[data-tag="' + tag + '"]').parent('li').hide();

            $.each(self.allPosts, function(index, el) {
                if (el.classes.indexOf(tag) >= 0 || tag === self.allFilter) {
                    self.postQueue.push(el);
                    if (self.postQueue.length <= (self.postPerPage * self.actualPage)) {
                        appendPost(el);
                    }
                }
            });
            updateShowedPostCount();
            if (self.showedPost >= self.postQueue.length) {
                self.$paginationContainer.hide();
            } else {
                self.$paginationContainer.show();
            }
        };

        /**
         * Search through the posts and filter them using a the words inside the search input
         *
         * @param  {Objext} e The event that started the search (usually a submit )
         */
        this.filterBySearch = function(e) {
            e.preventDefault();
            self.resetSearch();
            var searched = self.$searchInput.val(),
                founds = [],
                f = {},
                searchedRegex = new RegExp(searched, 'gi'),
                singleRegex = new RegExp(searched, 'i'),
                mTitle,
                mText,
                $el;

            self.$container.html('');
            if (searched !== '') {

                self.$searchForm.append('<span class="searched-term"></span>');

                self.postQueue = [];
                $.each(self.allPosts, function(index, el) {
                    mTitle = el.searchableTitle.match(searchedRegex);
                    mText = el.searchableText.match(searchedRegex);
                    f = {
                        titleOcc: (mTitle) ? mTitle.length : 0,
                        textOcc: (mText) ? mText.length : 0,
                    };

                    if (f.titleOcc > 0 || f.textOcc > 0) {
                        founds.push(f);
                        $el = $(el.html);

                        var $exc = $el.find('.post-excerpt'),
                            $tit = $el.find('.post-title a'),
                            excMatches = $exc.html().match(searchedRegex),
                            titleMatches = $tit.html().match(searchedRegex),
                            contentMatches = ($el.find('.search-content').html().match(searchedRegex) !== null) ? $el.find('.search-content').html().match(searchedRegex) : [];

                        if ((excMatches && excMatches.length > 0) || (titleMatches && titleMatches.length > 0)) {

                            var i;
                            if(excMatches && excMatches.length > 0){
                                for (i = 0; i < excMatches.length; i++) {
                                    $exc.html($exc.html().replace(singleRegex, "<span class='found'>" + excMatches[i] + "</span>"));
                                }
                            }

                            if(titleMatches && titleMatches.length > 0){
                                for (i = 0; i < titleMatches.length; i++) {
                                    $tit.html($tit.html().replace(searchedRegex, "<span class='found'>" + titleMatches[i] + "</span>"));
                                }
                            }
                        }

                        if (excMatches && contentMatches.length > excMatches.length) {
                            $exc.html($exc.html().replace('…', "<span class='found'>…</span>"));
                        }
                        self.postQueue.push(el);
                        if (self.postQueue.length <= (self.postPerPage * self.actualPage)) {
                            appendPost(el);
                        }
                    }
                });
                updateShowedPostCount();
                if(self.postQueue.length === 0){
                    self.$container.html(self.searchNothingFound);
                    //self.$container.html('bella ziooo');
                }
                if (self.showedPost >= self.postQueue.length) {
                    self.$paginationContainer.hide();
                } else {
                    self.$paginationContainer.show();
                }
            } else {
                self.clearSearch();
            }
        };

        /**
         * Starts the search
         */
        this.searchInit = function() {
            self.$searchSubmit.on('click',function(){
                self.$searchForm.submit();
            });
            self.$searchForm.on('submit', self.filterBySearch);
            this.clearSearchBind();
        };


        /**
         * Resets the search result and sets the system ready for a new search
         */
        this.resetSearch = function(){
            $('.searched-term').remove();
            self.postQueue = [];
            self.$container.html('');
            var $el;
            $.each(self.allPosts, function(index, el) {
                $el = $(el.html);
                $el.find('span.found').each(function(indexF,f){
                    $(f).replaceWith($(f).text());
                });
            });
            updateShowedPostCount();
            if (self.showedPost >= self.postQueue.length) {
                self.$paginationContainer.hide();
            } else {
                self.$paginationContainer.show();
            }
        };

        /**
        * Clear the search result and input
        */
        this.clearSearch = function(){
            $('.searched-term').remove();
            self.$searchInput.val('').show();

            self.postQueue = [];
            self.$container.html('');
            var $el;
            $.each(self.allPosts, function(index, el) {
                $el = $(el.html);
                $el.find('span.found').each(function(indexF,f){
                    $(f).replaceWith($(f).text());
                });
                self.postQueue.push(el);
                if (self.postQueue.length <= (self.postPerPage * self.actualPage)) {

                    appendPost(el);
                }
            });
            updateShowedPostCount();
            if (self.showedPost >= self.postQueue.length) {
                self.$paginationContainer.hide();
            } else {
                self.$paginationContainer.show();
            }
        };

        /**
        * Binds a link to the Clear Search function
        */
        this.clearSearchBind = function(){
            $(document).on('click','.searched-term',this.clearSearch);
        };

        /**
         * Finds the common values inside two arrays
         * @param  {Array} array1 The first array to check
         * @param  {Array} array2 The second array to check
         * @return {Integer}        The number of common elements found
         */
        function checkArraysCommon(array1,array2){
            var common = 0;
            $.each(array1,function(index,el){
                if(array2.indexOf(el) >= 0)
                    common++;
            });
            return common;
        }

        /**
         * Load the posts that have some tags in common with the actual article
         */
        this.loadRelatedPost = function(){

            var tags = [],
                allRelated = [],
                commonsRel = [],
                relPost,
                calls =[],
                c;

            $('.post-meta a').each(function(index, el){
                tags.push($(el).text());

                c = ajaxCall($(el).attr('href'), 1);
                calls.push(c);
            });

            $.when.apply($,calls).done(function(){
                appendRelatedPost();
            });
        };

        /**
         * Inserts into the html the related posts
         */
        function appendRelatedPost(){

            if(self.allPosts.length === 0){
                $('.js-related').hide();
            }

            var $relatedTpl = $('.post-related'),
                $related,
                $post,
                postData,
                done = 0;

            $.each(self.allPosts,function(idx,post){
                var $actualPost = $('article.post .sez-right-post');
                $post = $(post.html);

                postData = {
                    title : $post.find('.post-title').text(),
                    meta : $post.find('.post-meta').html(),
                    date  : $post.find('.date-post').html(),
                    datetime : $post.find('.date-post').attr('datetime'),
                    url : $post.find('.post-info-more').attr('href')

                };
                if(postData.title != $('.post-title').text()){
                    $related = $relatedTpl.clone();
                    $related.removeClass('hidden');


                    $related.find('.post-title a').text(postData.title);
                    $related.find('.post-title a').attr('href',postData.url);
                    $related.find('.post-meta').html(postData.meta);
                    $related.find('.date-post').html(postData.date);
                    $related.find('.date-post').attr('datetime',postData.datetime);

                    $('.js-related').append($related);

                    done++;

                }
                if(done === 0){
                    $('.tit-related').hide();
                } else if(done >=2){
                    return false;
                }
            });

        }
    };


    $(document).ready(function() {
        // Script initialization
        var poster = new PostHandler();
        poster.init();

        if($('article[data-postid]').length > 0){
            poster.startDisqusComment($('article[data-postid]').attr('data-postid'));
        }

        // Load more posts
        $('.load-more-post').on('click', function(e) {
            e.preventDefault();
            poster.loadPage();
        });

        if($('.post-template').length > 0){
            poster.loadRelatedPost();
        }
        // Tag menu visibility for mouse events
        $('.btn-select').on('mouseenter', poster.showTags);
        $('.menu-list-tag').on('mouseleave', poster.hideTags);
        // Tag menu visibility for touch events
        $('.btn-select, .menu-list-tag').on('tap', poster.showHideTags);
        // Filter menu events
        $(document).on('click', '.menu-list-tag a', function(e) {
            e.preventDefault();
            poster.filterPosts($(this).attr('data-tag'));
        });
        // Search input
        poster.searchInit();
    });

}(jQuery));
