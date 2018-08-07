function createRestaurantBlocksPlugin(wp, pinegrow) {
    //Create new Pinegrow framework object
    var type_prefix = 'pg.restaurant-blocks';

    var f = new PgFramework(type_prefix, 'Restaurant Blocks');

    //This will prevent activating multiple versions of the plugin, provided that other versions set the same type
    f.allow_single_type = true;
    f.type = type_prefix;

    var terms = '<br><small class="text-muted">TERMS OF USE: <b>You can use PG Restaurant Blocks</b> to build and deploy websites for yourself and your clients, free or paid, as many as you want. <b>You can NOT use restaurant Blocks</b> to create templates and themes that you then sell in template marketplaces or give away for free.</small>';

    f.author = 'Ben Hanna @ Plugins For Pinegrow';
    f.author_link = 'https://pluginsforpinegrow.com';
    //f.info_badge = 'New';

    f.setScriptFileByScriptTagId('plugin-pg-restaurant-blocks');

    //Don't show these files in CSS tab
    f.ignore_css_files = [/font\-awesome/i];

    f.detect = function(pgPage) {
        return false;
    }

    var fs = require('fs');
    var path = require('path');

    var source_relative = 'code/';

    //Tell Pinegrow about the framework
    pinegrow.addFramework(f);

    var combined_css = '';
    var combined_css_file_included = {};

    var components_map = {};

    var getComponent = function(type) {
        return components_map[type_prefix + '.' + type];
    }

    var ifType = function(type, c, func) {
        if(c.type == type_prefix + '.' + type) func(c);
    }

    var showRefreshMessage = function(what, single) {
        if(!what) what = 'the element';
        pinegrow.showQuickMessage('<b>Refresh page (CMD + R)</b> to activate ' + what + '.', 3000, single);
    }

    f.pgbCreateComponent = function(source_url, selector, name, transform_code) {
        var clist = [];
        var sourceNode = pgbGetSourceNode(source_url);
        var list = sourceNode.find(selector);
        for(var i = 0; i < list.length; i++) {
            var pgel = list[i];
            var suff = list.length > 1 ? '-' + (i+1) : '';
            var key = selector.replace('.', '') + suff;
            var type = type_prefix + '.' + key;
            var c = new PgComponentType(type, name + suff);
            c.selector = selector;

            if(list.length > 1) {
                c.selector += suff;
                pgel.addClass(c.selector.replace('.',''));
            }
            c.parent_selector = 'body';
            c.sections = {};

            if(transform_code) transform_code(pgel, c, i);

            c.code = pgel.toStringOriginal(true);
			c.preview_image = c.type.replace('.wp.', '.') + '.jpg';
            c.button_image = c.preview_image;

            c.tags = 'block';

            var bck_el = pgel.findOne('.background-image-holder');
            if(bck_el) {
                addBackgroundControl(c, '.background-image-holder');
            }

            f.addComponentType(c);

            clist.push(c);

            components_map[c.type] = c;
        }
        var a = source_url.split('/');
        processCSSFile(a[0], a[1].replace('.html', '.css'));

        return clist;
    }

    var processCSSFile = function(dir, name) {
        var css_file = f.getResourceFile(source_relative + dir + '/css/' + name);
        if(!(css_file in combined_css_file_included)) {
            try {
                var css = fs.readFileSync( css_file, {encoding: 'utf8'});
                combined_css += css;
                combined_css_file_included[ css_file ] = true;
            } catch(err) {}
        }
    }

    var addTo = function(list, new_list) {
        for(var i = 0; i < new_list.length; i++) {
            list.push(new_list[i]);
        }
    }

   var addBackgroundControl = function(c, selector) {
        c.sections[c.type + '.bck'] = {
            name : 'Background image',
            fields : {
                'pg.restaurant-blocks.bck.image' : {
                    type : 'image',
                    name: 'Image',
                    action : 'custom',
                    get_value: function (pgel) {
 
                        if (selector) pgel = pgel.findOne(selector);
                        if(pgel) {
                            var style = pgel.getAttr('style');
                            if (style) {
                                var m = style.match(/background\-image\:\s*url\(([^\)]*)\)\;?/);
                                if (m) {
                                    var url = m[1].replace(/['"]/g, '');
                                    return url;
                                }
                            }
                        }
                        return null;
                    },
                    set_value: function (pgel, value, values, oldValue, eventType) {
 
                        if (selector) pgel = pgel.findOne(selector);
                        if(pgel) {
                            var style = pgel.getAttr('style') || '';
 
                            style = style.replace(/background\-image\:\s*url\([^\)]*\)\;?/, '');
                            if (value) {
                                style += 'background-image:url(\'' + value + '\');';
                            }
                            pgel.setAttr('style', style);
                        }
                        return value;
                    }
                },
                'pg.restaurant-blocks.bck.header' : {
                    type: 'checkbox',
                    name: 'Image headers area',
                    action: 'apply_class',
                    value: 'bg-image-header'
                }
            }
        }
    }

    var source_base = f.getResourceUrl(source_relative);

    var pgbGetSourceFileUrl = function( fn ) {
        return source_base + fn;
    }

    var source_cache = {};

    var pgbGetSourceNode = function(fn) {
        if(!(fn in source_cache)) {
            source_cache[fn] = pinegrow.getSourceNodeOfUrl( pgbGetSourceFileUrl( fn ), true);
        }
        return source_cache[fn];
    }

    var pgbAddSection = function(key, name, list) {
        var section = new PgFrameworkLibSection(type_prefix + '.' + key, name);
        section.setComponentTypes(list);
        f.addLibSection(section);
    }
	
	//Navigation
    var navigations = [];

    var navigation_counts = [1];

    for(var n = 0; n < navigation_counts.length; n++) {
        for(var i = 1; i <= navigation_counts[n]; i++) {
            (function(i) {
                addTo(navigations, f.pgbCreateComponent( '1-navigation-blocks/navigation-blocks-' + (n + 1) + '.html', '.pg-restaurant-navigation-' + (n + 1) + '-' + i, 'Navigation ' + (n + 1) + '-' + i, function(pgel, c) {
                    addBackgroundControl(c);
                } ));
            })(i);
        }
    }

    pgbAddSection( 'navigation', 'Navigation blocks', navigations);
	
	//====================
    //Slider
    var sliders = [];

    var slider_counts = [1];

    for(var n = 0; n < slider_counts.length; n++) {
        for(var i = 1; i <= slider_counts[n]; i++) {
            (function(i) {
                addTo(sliders, f.pgbCreateComponent( '2-slider-blocks/slider-blocks-' + (n + 1) + '.html', '.pg-restaurant-slider-' + (n + 1) + '-' + i, 'Slider ' + (n + 1) + '-' + i, function(pgel, c) {
                    addBackgroundControl(c);
                } ));
            })(i);
        }
    }

    pgbAddSection( 'slider', 'Slider blocks', sliders);
	

	
	//====================
    //Header
    var headers = [];

    var header_counts = [2];

    for(var n = 0; n < header_counts.length; n++) {
        for(var i = 1; i <= header_counts[n]; i++) {
            (function(i) {
                addTo(headers, f.pgbCreateComponent( '3-header-blocks/header-blocks-' + (n + 1) + '.html', '.pg-restaurant-header-' + (n + 1) + '-' + i, 'Header ' + (n + 1) + '-' + i, function(pgel, c) {
                    addBackgroundControl(c);
                } ));
            })(i);
        }
    }

    pgbAddSection( 'header', 'Header blocks', headers);
	
	//====================
    //Service
    var services = [];

    var service_counts = [2];

    for(var n = 0; n < service_counts.length; n++) {
        for(var i = 1; i <= service_counts[n]; i++) {
            (function(i) {
                addTo(services, f.pgbCreateComponent( '4-service-blocks/service-blocks-' + (n + 1) + '.html', '.pg-restaurant-service-' + (n + 1) + '-' + i, 'Service ' + (n + 1) + '-' + i, function(pgel, c) {
                    addBackgroundControl(c);
                } ));
            })(i);
        }
    }

    pgbAddSection( 'service', 'Service blocks', services);
	
	//====================
    //Content
    var contents = [];

    var content_counts = [10];

    for(var n = 0; n < content_counts.length; n++) {
        for(var i = 1; i <= content_counts[n]; i++) {
            (function(i) {
                addTo(contents, f.pgbCreateComponent( '5-content-blocks/content-blocks-' + (n + 1) + '.html', '.pg-restaurant-content-' + (n + 1) + '-' + i, 'Content ' + (n + 1) + '-' + i, function(pgel, c) {
                    addBackgroundControl(c);
                } ));
            })(i);
        }
    }

    pgbAddSection( 'content', 'Content blocks', contents);

	//====================
    //Menu
    var menus = [];

    var menu_counts = [1];

    for(var n = 0; n < menu_counts.length; n++) {
        for(var i = 1; i <= menu_counts[n]; i++) {
            (function(i) {
                addTo(menus, f.pgbCreateComponent( '6-menu-blocks/menu-blocks-' + (n + 1) + '.html', '.pg-restaurant-menu-' + (n + 1) + '-' + i, 'Menu ' + (n + 1) + '-' + i, function(pgel, c) {
                    addBackgroundControl(c);
                } ));
            })(i);
        }
    }

    pgbAddSection( 'menu', 'Menu blocks', menus);
	
	 //====================
    //Reservation
    var reservations = [];

    var reservation_counts = [1];

    for(var n = 0; n < reservation_counts.length; n++) {
        for(var i = 1; i <= reservation_counts[n]; i++) {
            (function(i) {
                addTo(reservations, f.pgbCreateComponent( '7-reservation-blocks/reservation-blocks-' + (n + 1) + '.html', '.pg-restaurant-reservation-' + (n + 1) + '-' + i, 'Reservation ' + (n + 1) + '-' + i, function(pgel, c) {
                    addBackgroundControl(c);
                } ));
            })(i);
        }
    }

    pgbAddSection( 'reservation', 'Reservation blocks', reservations);
	
	 //====================
    //Gallery
    var gallerys = [];

    var gallery_counts = [1];

    for(var n = 0; n < gallery_counts.length; n++) {
        for(var i = 1; i <= gallery_counts[n]; i++) {
            (function(i) {
                addTo(gallerys, f.pgbCreateComponent( '8-gallery-blocks/gallery-blocks-' + (n + 1) + '.html', '.pg-restaurant-gallery-' + (n + 1) + '-' + i, 'Gallery ' + (n + 1) + '-' + i, function(pgel, c) {
                    addBackgroundControl(c);
                } ));
            })(i);
        }
    }

    pgbAddSection( 'gallery', 'Gallery blocks', gallerys);
	
	 //====================
    //Blog
    var blogs = [];

	var blog_counts = [1]

    for(var n = 0; n < blog_counts.length; n++) {
        for(var i = 1; i <= blog_counts[n]; i++) {
            (function(i) {
                addTo(blogs, f.pgbCreateComponent( '9-blog-blocks/blog-blocks-' + (n + 1) + '.html', '.pg-restaurant-blog-' + (n + 1) + '-' + i, 'Blog ' + (n + 1) + '-' + i, function(pgel, c) {
                    addBackgroundControl(c);
                } ));
            })(i);
        }
    }

    pgbAddSection( 'blog', 'Blog blocks', blogs);
	 
	 //====================
    //Testimonial
    var testimonials = [];

    var testimonial_counts = [1];

    for(var n = 0; n < testimonial_counts.length; n++) {
        for(var i = 1; i <= testimonial_counts[n]; i++) {
            (function(i) {
                addTo(testimonials, f.pgbCreateComponent( '10-testimonial-blocks/testimonial-blocks-' + (n + 1) + '.html', '.pg-restaurant-testimonial-' + (n + 1) + '-' + i, 'Testimonial ' + (n + 1) + '-' + i, function(pgel, c) {
                    addBackgroundControl(c);
                } ));
            })(i);
        }
    }

    pgbAddSection( 'testimonial', 'Testimonial blocks', testimonials);
	
	//====================
    //Team
    var teams = [];

    var team_counts = [1];

    for(var n = 0; n < team_counts.length; n++) {
        for(var i = 1; i <= team_counts[n]; i++) {
            (function(i) {
                addTo(teams, f.pgbCreateComponent( '11-team-blocks/team-blocks-' + (n + 1) + '.html', '.pg-restaurant-team-' + (n + 1) + '-' + i, 'Team ' + (n + 1) + '-' + i, function(pgel, c) {
                    addBackgroundControl(c);
                } ));
            })(i);
        }
    }

    pgbAddSection( 'team', 'Team blocks', teams);
	
	//====================
    //Contact
    var contacts = [];

    var contact_counts = [2];

    for(var n = 0; n < contact_counts.length; n++) {
        for(var i = 1; i <= contact_counts[n]; i++) {
            (function(i) {
                addTo(contacts, f.pgbCreateComponent( '12-contact-blocks/contact-blocks-' + (n + 1) + '.html', '.pg-restaurant-contact-' + (n + 1) + '-' + i, 'Contact ' + (n + 1) + '-' + i, function(pgel, c) {
                    addBackgroundControl(c);
                } ));
            })(i);
        }
    }

    pgbAddSection( 'contact', 'Contact blocks', contacts);
	
	 //====================
    //Footer
    var footers = [];

    var footer_counts = [1];

    for(var n = 0; n < footer_counts.length; n++) {
        for(var i = 1; i <= footer_counts[n]; i++) {
            (function(i) {
                addTo(footers, f.pgbCreateComponent( '13-footer-blocks/footer-blocks-' + (n + 1) + '.html', '.pg-restaurant-footer-' + (n + 1) + '-' + i, 'Footer ' + (n + 1) + '-' + i, function(pgel, c) {
                    addBackgroundControl(c);
                } ));
            })(i);
        }
    }

    pgbAddSection( 'footer', 'Footer blocks', footers);
	
	
	
	//====================
    var body = {
        'type' : 'pg-restaurant-blocks.body',
        'selector' : 'body',
        'name' : 'Body',
        //'display_name' : 'tag',
        //'priority' : 1000,
        not_main_type: true,
        'sections' : {
        }
    }
    addBackgroundControl(body);
    f.addComponentType(body);


    var takePhotos = function(list) {

        var resizeImage = function(file, w, h, new_file) {
            crsaResizeImage(file, w, h, new_file);
        }

        var url = f.getResourceUrl('../restaurantblocks/HTML Files/Skeleton File/photo.html');

        var gui = require('nw.gui');


        var current = 0;

        var preview_win = gui.Window.open(url, {
            width: 1024,
            height: 600
        });

        var chrome_width;
        var chrome_height;
        var $body;
        var $photo;

        var loaded = false;

        preview_win.on('loaded', function() {
            if(loaded) return;
            loaded = true;

            $body = $(preview_win.window.document.body);
            $photo = $body.find('#photo');

            var width = $body.width();
            chrome_width = preview_win.width - width;
            chrome_height = preview_win.height - $body.height();

            $body.removeAttr('style');
            $body.closest('html').removeAttr('style');

            var takePhoto = function() {
                $photo.html(list[current].code);
                console.log('SET - ' + list[current].type);

                if(list[current].take_photo_script) {
                    var scr = preview_win.window.document.createElement('script');
                    scr.async = false;
                    scr.text = list[current].take_photo_script;
                    $body.get(0).appendChild(scr);

                }

                setTimeout(function() {
                    var w = $photo.outerWidth(true);
                    w = 1024;
                    var h = $photo.outerHeight();
                    //preview_win.width = w + chrome_width;
                    preview_win.height = h + chrome_height;

                    console.log('PHOTO - ' + list[current].type);

                    preview_win.capturePage(function(buffer){
                        var big_file = f.getResourceFile('images/' + list[current].type + '.png');
                        fs.writeFileSync( big_file, buffer);

                        resizeImage(big_file, parseInt(w/1), parseInt(h/1), big_file);
                        console.log('DONE - ' + list[current].type);
                        current++;
                        if(current < list.length) {
                            takePhoto();
                        }
                    }, { format : 'png', datatype : 'buffer'} );

                }, list[current].take_photo_delay || 1000);
            }

            takePhoto();
        })
    }
    //takePhotos( contacts );

    if(!wp && false) {
        var photo_list = [];
        for(var t in f.component_types) {
           photo_list.push( f.component_types[t] );
        }


        takePhotos( photo_list );
    }



    var toLocalPath = function(p) {
        return p.replace(/\//g, path.sep);
    }

    //add resources
    var res_files = ['css/pg-restaurant.css', 'images', 'js/pg-restaurant.js'];
    for(var i = 0; i < res_files.length; i++) {
        var file = f.getResourceFile('template/' + res_files[i]);
        var r = new PgComponentTypeResource(file);
        r.relative_url = res_files[i];
        r.source = toLocalPath(file);
        r.footer = res_files[i].indexOf('.js') >= 0;
        f.resources.add(r);
    }
    var res = new PgComponentTypeResource('https://fonts.googleapis.com/css?family=Aguafina+Script');
	res.type = 'text/css';
    f.resources.add(res);
	
    res = new PgComponentTypeResource('https://fonts.googleapis.com/css?family=Alex+Brush');
    res.type = 'text/css';
	f.resources.add(res);

    res = new PgComponentTypeResource('https://fonts.googleapis.com/css?family=Alfa+Slab+One');
    res.type = 'text/css';
	f.resources.add(res);
	
	res = new PgComponentTypeResource('https://fonts.googleapis.com/css?family=Arya');
    res.type = 'text/css';
	f.resources.add(res);
	
    res = new PgComponentTypeResource('https://fonts.googleapis.com/css?family=Bitter');
    res.type = 'text/css';
	f.resources.add(res);
	
	res = new PgComponentTypeResource('https://fonts.googleapis.com/css?family=Bree+Serif');
    res.type = 'text/css';
	f.resources.add(res);
	
	res = new PgComponentTypeResource('https://fonts.googleapis.com/css?family=Dancing+Script');
    res.type = 'text/css';
	f.resources.add(res);
	
	res = new PgComponentTypeResource('https://fonts.googleapis.com/css?family=Engagement');
    res.type = 'text/css';
	f.resources.add(res);


	res = new PgComponentTypeResource('https://fonts.googleapis.com/css?family=Euphoria+Script');
    res.type = 'text/css';
	f.resources.add(res);

	res = new PgComponentTypeResource('https://fonts.googleapis.com/css?family=Great+Vibes');
    res.type = 'text/css';
	f.resources.add(res);

	res = new PgComponentTypeResource('https://fonts.googleapis.com/css?family=Herr+Von+Muellerhoff');
    res.type = 'text/css';
	f.resources.add(res);
	

	
    res = new PgComponentTypeResource('https://fonts.googleapis.com/css?family=Italiana');
	res.type = 'text/css';
    f.resources.add(res);

	res = new PgComponentTypeResource('https://fonts.googleapis.com/css?family=Italianno');
    res.type = 'text/css';
	f.resources.add(res);
	
    res = new PgComponentTypeResource('https://fonts.googleapis.com/css?family=Josefin+Sans');
    res.type = 'text/css';
	f.resources.add(res);
	
	res = new PgComponentTypeResource('https://fonts.googleapis.com/css?family=Lato');
    res.type = 'text/css';
	f.resources.add(res);
	
    res = new PgComponentTypeResource('https://fonts.googleapis.com/css?family=Leckerli+One');
    res.type = 'text/css';
	f.resources.add(res);
	
	res = new PgComponentTypeResource('https://fonts.googleapis.com/css?family=Montserrat');
    res.type = 'text/css';
	f.resources.add(res);
	
	res = new PgComponentTypeResource('https://fonts.googleapis.com/css?family=Montez');
    res.type = 'text/css';
	f.resources.add(res);
	
	res = new PgComponentTypeResource('https://fonts.googleapis.com/css?family=Mrs+Saint+Delafield');
    res.type = 'text/css';
	f.resources.add(res);
	
	res = new PgComponentTypeResource('https://fonts.googleapis.com/css?family=Oleo+Script+Swash+Caps');
    res.type = 'text/css';
	f.resources.add(res);
	
    res = new PgComponentTypeResource('https://fonts.googleapis.com/css?family=Oswald');
    res.type = 'text/css';
	f.resources.add(res);
	
    res = new PgComponentTypeResource('https://fonts.googleapis.com/css?family=Pacifico');
    res.type = 'text/css';
	f.resources.add(res);
	
	res = new PgComponentTypeResource('https://fonts.googleapis.com/css?family=Playfair+Display');
    res.type = 'text/css';
	f.resources.add(res);
	
	res = new PgComponentTypeResource('https://fonts.googleapis.com/css?family=Poppins');
    res.type = 'text/css';
	f.resources.add(res);
	
	res = new PgComponentTypeResource('https://fonts.googleapis.com/css?family=PT+Serif');
    res.type = 'text/css';
	f.resources.add(res);
	
	res = new PgComponentTypeResource('https://fonts.googleapis.com/css?family=Raleway');
    res.type = 'text/css';
	f.resources.add(res);
	
    res = new PgComponentTypeResource('https://fonts.googleapis.com/css?family=Rancho');
    res.type = 'text/css';
	f.resources.add(res);
	
    res = new PgComponentTypeResource('https://fonts.googleapis.com/css?family=Reenie+Beanie');
    res.type = 'text/css';
	f.resources.add(res);

	res = new PgComponentTypeResource('https://fonts.googleapis.com/css?family=Signika');
    res.type = 'text/css';
	f.resources.add(res);
	
	res = new PgComponentTypeResource('https://fonts.googleapis.com/css?family=Tangerine');
    res.type = 'text/css';
	f.resources.add(res);

    res = new PgComponentTypeResource('https://fonts.googleapis.com/css?family=Vollkorn');
    res.type = 'text/css';
	f.resources.add(res);

    res = new PgComponentTypeResource('https://fonts.googleapis.com/css?family=Yanone+Kaffeesatz');
    res.type = 'text/css';
	f.resources.add(res);
	
	res = new PgComponentTypeResource('https://fonts.googleapis.com/css?family=Zilla+Slab');
    res.type = 'text/css';
	f.resources.add(res);
	
	res = new PgComponentTypeResource('https://fonts.googleapis.com/css?family=Zilla+Slab+Highlight');
    res.type = 'text/css';
	f.resources.add(res);
	
    f.resources.description = "CSS and JS files needed for restaurant Blocks to work. Placeholder images.";
	

    if(wp) {
        var res_files = ['inc'];
        for(var i = 0; i < res_files.length; i++) {
            var file = f.getResourceFile('template/' + res_files[i]);
            var r = new PgComponentTypeResource(file);
            r.relative_url = res_files[i];
            r.source = toLocalPath(file);
            r.footer = res_files[i].indexOf('.js') >= 0;
            f.resources.add(r);
        }
       
    }
    
    source_cache = {};
}

$(function() {

    //Wait for Pinegrow to wake-up
    $('body').one('pinegrow-ready', function(e, pinegrow) {

        createRestaurantBlocksPlugin(true, pinegrow);

    });
});