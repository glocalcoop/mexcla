/**
 * UI Functions
 */

$(function() {

    /**
     * Instantiate Toggler
     */
    $('#mic-mute').bootstrapToggle({
      on: 'Unmuted',
      off: 'Muted'
    });

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
})