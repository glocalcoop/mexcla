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
     
    })

    /**
     * Call Mute and Unmute
     */
    $('#collaboration').click('a', function (event) {

        event.preventDefault()

    })
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
