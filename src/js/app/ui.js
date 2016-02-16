/**
 * UI Functions
 */

$(function() {

    /**
     * Call Mute and Unmute
     */
    $('#mic-mute').change(function() {
        if( $(this).prop('checked') ) {
            mexcla_mic_unmute();

        } else {
            mexcla_mic_mute(); 
        }
     
    });

    /**
     * Page Language
     * Switch language when language switched
     */
    $('#language-links a').click(function(event) {

        event.preventDefault();
        $('html')[0].lang = $(this).data('lang');

    });


    /**
     * Room Link
     * Add URL to room-link field so it can be copied
     */
    $('#room-link').val( $(location).attr('href') );

    /**
     * Participants
     * Toggle `on` class when participant controls are clicked
     */
    $('#participants').on('click', 'button', function(event) {

        $(this).toggleClass('on');

    });

    /**
     * Channel Controls
     * Toggle Channel Controls
     */
    $('#channels').on('click', 'button.join', function(event) {

        $(this).toggleClass('on');
        $('#channels button.leave').toggleClass('on');
        //$(this).hasClass('on').attr('title', 'Leave Channel').html('Leave');

    });

    $('#channels').on('click', 'button.leave', function(event) {

        $(this).toggleClass('on');
        $('#channels button.join').toggleClass('on');
        //$(this).hasClass('on').attr('title', 'Leave Channel').html('Leave');

    });

    /**
     * Collaboration
     * Load collaboration iframes when tab is clicked
     */
    $('#collaboration a[data-toggle="tab"]').click(function(event) {

        event.preventDefault();

        $(this).tab('show');

        var panelId = $(event.target).attr('href');

        var src = $(panelId).attr('data-src');
        // if the iframe hasn't already been loaded once
        if($(panelId + ' iframe').attr('src')=='') {
            $(panelId + ' iframe').attr('src',src);
        }

    });


    /**
     * Activate Bootstrap tooltips
     * This isn't working for dynamic elements
     */
    // $.when.apply($, Views.RoomSidebar).done(function() {
    //     $('[data-toggle="tooltip"]').tooltip();
    // });

    /**
     * Activate Clipboard
     */
    new Clipboard('.copy-link');

    $('.copy-link').click(function() {

        $(this).toggleClass( "cursor-grabbling" );

    });

});


/**
 * Collaboration Functions
 */

 // var roomnum = app.room.attributes._id;

 // var collabTools = {
 //    notepad: 'https://pad.riseup.net/p/' + roomnum + '?showChat=false',
 //    spreadsheet: 'https://calc.mayfirst.org/' + roomnum, 
 //    chat: 'https://irc.koumbit.net/?channels=#' + roomnum + '&nick=guest'
 // }
