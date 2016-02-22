// Based off of  Mayfirst's mexcla's client: live.mayfirst.org/mexcla
// big thanks! <3

// GLOBALS:
var cur_call = null;
var verto = null;
var conf = null;
// my_key keeps track of the user's unique id for this call,, which is
// used as the css/dom id for the user's row in the participants list.
var my_key = null;

/// API;
// mexcla_login() -> logs into freeswitch
// mexcla_call_init(conf, name, callbacks) -> joins conference,
// mexcla_hangup() -> hangsup the call. sets cur_call back to null

function mexcla_login() {
  verto = new $.verto({
    login: config.impi,
    passwd: config.password,
    socketUrl: config.websocket_proxy_url,
    tag: "audio-remote",
    videoParams: {},
    audioParams: {
      googAutoGainControl: false,
      googNoiseSuppression: false,
      googHighpassFilter: false
    },
    iceServers: true
  }, {});
}

var verto_call_callbacks = {
  onDialogState: function(d) {
    cur_call = d;
    switch (d.state) {
    case $.verto.enum.state.requesting:
      console.log('connecting...');
      break;
    case $.verto.enum.state.active:
      console.log('active');
      mexcla_join_conference(conf);
      // Record what my unique key is so I can reference it when sending special chat messages.
      my_key = cur_call.callID;
      break;
    case $.verto.enum.state.hangup:
      console.log('hangup');
      //mexcla_hangup();
      break;
    }
  }
};

// input: number, string, object 
function mexcla_call_init(conf, name, verto_call_callbacks) {
  if(conf > 999999999) {
    console.error("Conference numbers must be equal to or below 999,999,999. Your number is " + conf);
    return;
  }
  
  if(cur_call) {
    console.error("There is already a calling going on. Hand up first if you'd like to start another call.");
    return;
  }

  cur_call = verto.newCall({
    destination_number: "9999",
    caller_id_name: name,
    caller_id_number: conf,
    useVideo: false,
    useStereo: false
  }, verto_call_callbacks);

  // Specify function to run if the user navigates away from this page.
  $.verto.unloadJobs = [ mexcla_hangup ];
};

function mexcla_hangup() {
  if(cur_call) {
    cur_call.hangup();
    // Unset cur_call so when the user tries to re-connect we know to re-connect
    cur_call = null;
  }
}


function mexcla_join_conference(conf) {
  if(conf == 0) {
    alert("Failed to capture the conference number. Please try again.");
    return;
  }

  mexcla_dtmf(conf + '#');
  // If the conference number starts with a 6 - it means it's a big
  // group call, so we want people to start off muted.
  // Wait a few seconds for the call to fully complete, then start off the
  // user muted, so we don't have a cacaphony of noise as new people join.
  // if(conf[0] == 6) {
  //   setTimeout(mexcla_mic_mute, 7000);
  // }
}

function mexcla_dtmf(key) {
  if(cur_call) {
    var ret = cur_call.dtmf(key);
    return true;
  } else {
    console.error('error joining conference');
    return false;
  }
}
