var gSession;
// Temporarily define language strings here.
var lang_connect = 'Connect';
var lang_connecting = 'Connecting';
var lang_disconnect = 'Disconnect';
var lang_not_yet_connected = 'Your call is not yet connected';
var lang_direct_link = 'Direct link';

function mexcla_toggle_call_status() {
  if(gSession) {
    mexcla_hangup();
  } else {
    mexcla_call_init();
  }
}

function mexcla_hangup() {
  if(gSession) {
    gSession.terminate();
    // Unset gSession so when the user tries to re-connect
    // we know to re-connect
    gSession = null;
  }
  change_submit_button_value(lang_connect);
  // Seems to prevent reconnection without a page reload
  location.reload();
}

function mexcla_init() {
  conf = mexcla_get_conference_number();
  console.log("Conference is: " + conf);
  $('.pstn-instructions-conference-number').append(conf);
  mexcla_init_language_links();
  mexcla_init_iframes();
}

function mexcla_init_language_links() {
  // Update the en and es page links to include the
  // given URL parameters.
  path = window.location.pathname;
  if(-1 != path.indexOf('/en/')) {
    en = path;
    es = path.replace('/en/','/es/');
  }
  else {
    es = path;
    en = path.replace('/es/','/en/');
  }
  document.getElementById('es-switch-link').href = es;
  document.getElementById('en-switch-link').href = en;
}

function mexcla_init_iframes() {
  params = mexcla_get_url_params()
  for (var i = 0; i < params.length; i++) {
    param = params[i];
    if(param.substr(0,3) == 'irc') {
      mexcla_toggle_irc();
    }
    else if(param.substr(0,4) == 'calc') {
      mexcla_toggle_calc();
    }
  }
}

function mexcla_toggle_irc() {
  mexcla_toggle_iframe('irc-frame', 'https://irc.koumbit.net/?channels=#' + mexcla_get_hash() + '&nick=guest');
}

function mexcla_toggle_pad() {
  // We use mexcla_get_hash so the calc pages created aren't so trivially discovered.
  mexcla_toggle_iframe('pad-frame', 'https://pad.riseup.net/p/' + mexcla_get_hash());
}

function mexcla_toggle_iframe(id,url, extra)  {
  if($('#' + id).length == 0) {
    // The element doesn't exist, add it.
    mexcla_add_iframe(id, url, extra);
    $('.draggable').draggable();
  }
  else{
    $('#' + id).remove();
  }
}

function mexcla_toggle_calc() {
  // We use mexcla_get_hash so the calc pages created aren't so trivially discovered.
  mexcla_toggle_iframe('calc-frame', 'https://calc.mayfirst.org/' + mexcla_get_hash());
}

// Generate a random-looking hash that will be the same for everyone on the
// same conference call.
function mexcla_get_hash() {
  return 'mexcla-' + mexcla_get_conference_number();
}

function mexcla_call_init() {
  var config = {
    realm: 'talk.mayfirst.org',
    impi: 'public',
    impu: 'sip:public@talk.mayfirst.org',
    password: 'public',
    enable_rtcweb_breaker: false,
    outbound_proxy_url: 'udp://talk.mayfirst.org:5060',
    // use 10062 webrtc2sip and 7443 with freeswitch webrtc
    // websocket_proxy_url: 'wss://talk.mayfirst.org:10062',
    websocket_proxy_url: 'wss://talk.mayfirst.org:7443',
    // websocket_proxy_url: 'ws://paul.mayfirst.org:10060',
    //websocket_proxy_url: 'ws://paul.mayfirst.org:5066',
    ice_servers: [{"urls":"turn:talk.mayfirst.org:5349", "username": "mayfirst", "credential":"1IGdfbft23EVjtV"}]
    // ice_servers: [{"url":"turn:talk.mayfirst.org:5349"}]
}
  // Ensure we have a conference number
  conf = mexcla_get_conference_number();
  if(conf == 0) {
    alert("Failed to get the conference number.");
    return false;
  }
  if(conf > 999999999) {
    alert("Conference numbers must be equal to or below 999,999,999. Your number is " + conf);
    return false;
  }
  // Initialize the engine
  var configuration = {
      'ws_servers': config.websocket_proxy_url,
      'uri': config.impu,
      'password': config.password,
      // Seems like a bug - if this is left out (default true), we get an error:
      // 422 Session Interval Too Small
      'session_timers': false
  };
  var coolPhone = new JsSIP.UA(configuration);
  coolPhone.start();
  var audioRemote =  document.getElementById('audio-remote');
  var eventHandlers = {
    'connecting':   function(e){
      // Setting lang_connecting value at the top of this file
      // TODO: generate a legitimate mechanism for alternative languages.
      change_submit_button_value(lang_connecting);
    },
    'failed':     function(e){
      mexcla_handle_error(e);
    },
    'confirmed':  function(e){
      change_submit_button_value(lang_disconnect);
      mexcla_join_conference();
      // Attach local stream to selfView
      // selfView.src = window.URL.createObjectURL(session.connection.getLocalStreams()[0]);
    },
    'addstream':  function(e) {
      var stream = e.stream;

      // Attach remote stream to remoteView
      audioRemote.src = window.URL.createObjectURL(stream);
    },
    'ended':      function(e){ /* Your code here */ }
  };
  var options = {
    'eventHandlers': eventHandlers,
    // 'extraHeaders': [ 'X-Foo: foo', 'X-Bar: bar' ],
    'mediaConstraints': {'audio': true, 'video': false},
    'pcConfig': {
      'iceServers': config.ice_servers
     }

  };

  session = coolPhone.call('sip:9999@talk.mayfirst.org', options);
  // Initialize radio buttons
  mexcla_check_radio_button('mic-unmute');
  mexcla_check_radio_button('mode-original');

  // Save session in global variable
  // so we can call the dtmf method
  // throughout the call
  gSession = session;
}

function mexcla_handle_error(data) {
  console.log(data);
  alert(data.cause);


}
function mexcla_get_url_params() {
  // Split the url by /, skipping the first / so we don't have an empty value first.
  parts = window.location.pathname.substr(1).split('/');
  // Delete empty parts
  for (var i = 0; i < parts.length; i++) {
    if(parts[i] == '') {
      delete parts[i];
    }
  }
  return parts;
}

function mexcla_get_conference_number() {
  var params = mexcla_get_url_params();
  // Find the numeric argument. Pick the first one we find
  // and we use that as the conference number.
  // Thanks to http://stackoverflow.com/questions/18082/validate-numbers-in-javascript-isnumeric
  conf = 0;
  for (var i = 0; i < params.length; i++) {
    param = params[i];
    if(!isNaN(parseFloat(param)) && isFinite(param)) {
      conf = param;
      break;
    }
  }
  return conf
}

function mexcla_join_conference() {
  conf = mexcla_get_conference_number();

  if(conf == 0) {
    alert("Failed to capture the conference number. Please try again.");
    return;
  }

  // We have to send the conference number in single digits followed by #.
  digits = conf.split('');
  for (var i = 0; i < digits.length; i++) {
    // If we send the digits too quickly freeswitch can't process
    // them reliably.
    mexcla_pause(200);
    mexcla_dtmf(digits[i]);
  }
  mexcla_pause(200);
  mexcla_dtmf('#');
  // If the conference number starts with a 6 - it means it's a big
  // group call, so we want people to start off muted.
  // Wait a few seconds for the call to fully complete, then start off the
  // user muted, so we don't have a cacaphony of noise as new people join.
  if(digits[0] == 6) {
    setTimeout(mexcla_mic_mute, 7000);
  }
}

function mexcla_dtmf(key) {
  if(gSession) {
    var ret = gSession.sendDTMF(key);
    // alert("Sent " + key + " got " + ret);
    return true;
  } else {
    alert(lang_not_yet_connected);
    return false;
  }
}

function mexcla_check_radio_button(id) {
  document.getElementById(id).checked = true;

}

// Make the interval id global
intervalId = 0;
function change_submit_button_value(val) {
  $('#connect-button-text').text(val);
  var current_src = $('#phone').attr('src');
  var target_src = '';
  if(val == lang_connect) {
    // We're disconnecting, so change the picture to the
    // disconnected phone.
    // target_src = current_src.replace('phone.connected.png', 'phone.disconnected.png');
  }
  else if(val  == lang_disconnect) {
    // We're connecting... kill the dots animation.
    clearInterval(intervalId);
    // Ensure there are no current dots.
    mexcla_dots('');
    // target_src = current_src.replace('phone.disconnected.png', 'phone.connected.png');
    $('#microphone-status').show();
  }
  else {
    // When we are connecting... the picture should remain showing
    // the disconnected phone.
    // However, we should update the text to add an animation effect
    // of the dots progressing...
    intervalId = setInterval(mexcla_dots,500);
    return;
  }
  $('#phone').attr('src', target_src);
}

// Simulate an animation of dots
function mexcla_dots(next) {
  // Can't pass default values, so set it here. The default
  // value should be null
  next = typeof next === 'undefined' ? null : next;
  cur = $('#connect-dots').text();
  if (next === null) {
    next = '';
    if(cur == '') {
      next = '.';
    }
    else if(cur == '.') {
      next = '..';
    }
    else if(cur == '..') {
      next = '...';
    }
  }
  $('#connect-dots').text(next);
}

function mexcla_mic_mute() {
  if(mexcla_dtmf('*')) {
    mexcla_check_radio_button('mic-mute');
    var current_src = $('#mic').attr('src');
    target_src = current_src.replace('mic.unmuted.png', 'mic.muted.png');
    $('#mic').attr('src', target_src);
  }
  else {
    mexcla_check_radio_button('mic-unmute');
  }

}
function mexcla_mic_unmute() {
  if(mexcla_dtmf('*')) {
    mexcla_check_radio_button('mic-unmute');
    var current_src = $('#mic').attr('src');
    target_src = current_src.replace('mic.muted.png', 'mic.unmuted.png');
    $('#mic').attr('src', target_src);
  }
  else {
    mexcla_check_radio_button('mic-mute');
  }
}
function mexcla_mode_original() {
  if(mexcla_dtmf('0')) {
    var current_src = $('#headset').attr('src');
    target_src = current_src.replace(/headset\.(terp|mono)\.png/, 'headset.bi.png');
    $('#headset').attr('src', target_src);
    mexcla_check_radio_button('mode-original');
  }
}
function mexcla_mode_hear_interpretation() {
  if(mexcla_dtmf('1')) {
    var current_src = $('#headset').attr('src');
    target_src = current_src.replace(/headset\.(bi|terp)\.png/, 'headset.mono.png');
    $('#headset').attr('src', target_src);
    mexcla_check_radio_button('mode-hear-interpretation');
  }
}
function mexcla_mode_provide_interpretation() {
  if(mexcla_dtmf('2')) {
    var current_src = $('#headset').attr('src');
    target_src = current_src.replace(/headset\.(bi|mono)\.png/, 'headset.terp.png');
    $('#headset').attr('src', target_src);
    mexcla_check_radio_button('mode-provide-interpretation');
  }
}

// Thanks to http://stackoverflow.com/questions/951021/what-do-i-do-if-i-want-a-javascript-version-of-sleep
// I realize this is "wrong" and freezes up the browser, but setTimeout doesn't
// seem to work when called within the sipml context.
function mexcla_pause(s) {
  var date = new Date();
  var curDate = null;
  do { curDate = new Date(); }
  while(curDate - date < s);
}

function mexcla_add_iframe(id, src, extra) {
  $("#user-objects").append('<td class="user-object" id="' + id + '"><span class="extra">' + extra + '</span> <span class="direct-link">' + lang_direct_link + ': <a target="_blank" href="' + src + '">' + src + '</a></span><br /><iframe class="draggable resizable" src="' + src + '"/></td>');
}

