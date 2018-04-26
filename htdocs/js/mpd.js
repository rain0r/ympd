const ReconnectingWebSocket = require(
    'reconnecting-websocket/dist/reconnecting-websocket.amd.js');

export class Mpd {

  constructor() {
    this.socket = null;
    this.lastState = null;
    this.lastOutputs = null;
    this.currentApp = null;
    this.pagination = 0;
    this.browsepath = '';
    this.currentSong = {};
    this.MAX_ELEMENTS_PER_PAGE = 1024;
    this.isTouch = 'ontouchstart' in document.documentElement;
    this._mpdCallback = null;

    this.updateDB = this.updateDB.bind(this);
    this.confirmSettings = this.confirmSettings.bind(this);
    this.saveQueue = this.saveQueue.bind(this);
  }

  get mpdCallback() {
    return this._mpdCallback;
  }

  set mpdCallback(value) {
    this._mpdCallback = value;
  }

  defaultNotifySettings() {
    return {
      // settings
      element: 'body',
      position: 'fixed',
      type: 'info',
      allow_dismiss: true,
      newest_on_top: false,
      showProgressbar: false,
      placement: {
        from: 'bottom',
        align: 'center',
      },
      offset: 0,
      spacing: 0,
      z_index: 1031,
      delay: 1000,
      timer: 1000,
      // url_target: '_blank',
      mouse_over: null,
      animate: {
        enter: 'animated slideInDown',
        exit: 'animated slideOutDown',
      },
      onShow: null,
      onShown: null,
      onClose: null,
      onClosed: null,
      icon_type: 'class',
      template: '<div data-notify="container" class="xs-11 col-sm-4 alert alert-{0}" role="alert"><button type="button" aria-hidden="true" class="close" data-notify="dismiss">&times;</button><span data-notify="icon"></span> <span data-notify="title">{1}</span> <span data-notify="message">{2}</span><div class="progress" data-notify="progressbar"><div class="progress-bar progress-bar-{0}" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="width: 0%;"></div></div><a href="{3}" target="{4}" data-notify="url"></a></div>',
    };
  }

  notify(pText) {
    $.notify({
      // options
      message: pText,
    }, this.defaultNotifySettings());
  }

  toggleoutput(button, id) {
    this.socket.send('MPD_API_TOGGLE_OUTPUT,' + id + ',' +
        ($(button).hasClass('active') ? 0 : 1));
  }

  getHost() {
    this.socket.send('MPD_API_GET_MPDHOST');

    function onEnter(event) {
      if (event.which === 13) {
        this.confirmSettings();
      }
    }

    $('#mpdhost').keypress(onEnter);
    $('#mpdport').keypress(onEnter);
    $('#mpd_pw').keypress(onEnter);
    $('#mpd_pw_con').keypress(onEnter);
  }

  updateVolumeIcon(volume) {
    $('#volume-icon').removeClass('fa-volume-off');
    $('#volume-icon').removeClass('fa-volume-up');
    $('#volume-icon').removeClass('fa-volume-down');

    if (volume === 0) {
      $('#volume-icon').addClass('fa-volume-off');
    } else if (volume < 50) {
      $('#volume-icon').addClass('fa-volume-down');
    } else {
      $('#volume-icon').addClass('fa-volume-up');
    }
  }

  updatePlayIcon(state) {
    $('#play-icon').removeClass();
    $('#track-icon').removeClass();

    let classToAdd = 'fas ';

    switch (state) {
      case 1:
        // stop
        classToAdd += 'fa-play';
        break;
      case 2:
        // pause
        classToAdd += 'fa-pause';
        break;
      case 3:
        // play
        classToAdd += 'fa-play';
        break;
    }

    $('#play-icon').addClass(classToAdd);
    $('#track-icon').addClass(classToAdd);
  }

  updateDB() {
    this.socket.send('MPD_API_UPDATE_DB');
    this.notify('Updating MPD Database... ');
  }

  clickPlay() {
    debugger;
    if (this.lastState.data.state === 1 || this.lastState.data.state === 3) {
      this.socket.send('MPD_API_SET_PLAY');
    }
    else {
      this.socket.send('MPD_API_SET_PAUSE');
    }
  }

  basename(path) {
    return path.split('/').reverse()[0];
  }

  saveQueue() {
    if ($('#playlistname').val().length > 0) {
      this.socket.send('MPD_API_SAVE_QUEUE,' + $('#playlistname').val());
    }
    $('#savequeue').modal('hide');
  }

  confirmSettings() {
    if ($('#mpd_pw').val().length + $('#mpd_pw_con').val().length > 0) {
      if ($('#mpd_pw').val() !== $('#mpd_pw_con').val()) {
        $('#mpd_pw_con').popover('show');
        setTimeout(() => {
          $('#mpd_pw_con').popover('hide');
        }, 2000);
        return;
      } else {
        this.socket.send('MPD_API_SET_MPDPASS,' + $('#mpd_pw').val());
      }
    }
    this.socket.send('MPD_API_SET_MPDHOST,' + $('#mpdport').val() + ',' +
        $('#mpdhost').val());
    $('#settings').modal('hide');
  }

  getAppropriateWsUrl() {
    let protocol;
    let url = document.URL;

    /*
    /* We open the webmy.socket encrypted if this page came on an
    /* https:// url itself, otherwise unencrypted
    /*/

    if (url.substring(0, 5) === 'https') {
      protocol = 'wss://';
      url = url.substr(8);
    } else {
      protocol = 'ws://';
      if (url.substring(0, 4) === 'http') {
        url = url.substr(7);
      }
    }

    url = url.split('#');

    return protocol + url[0] + '/ws';
  }

  appendClickableIcon(appendTo, onClickAction, faClass) {
    const aElem = $('<a>').
        attr({'role': 'button'}).
        addClass('float-right btn-group-hover');
    const iElem = $('<i>').addClass(faClass);

    aElem.append(iElem);
    aElem.click((event) => {
      event.stopPropagation();
      this.socket.send(onClickAction + ',' +
          decodeURI($(event.currentTarget).parents('tr').attr('uri')));
      const notificationText = 'Added dir: \'' +
          $('td:nth-child(2)', $(event.currentTarget).parents('tr')).text() +
          '\'';
      this.notify(notificationText);
    }).fadeTo('fast', 1);
    $(appendTo).append(aElem);
  }

  initVolumeSlider() {
    $('#volume-slider').slider({
      formatter: (value) => {
        return value;
      },
      tooltip_position: 'bottom',
    });
  }

  initProgressSlider() {
    $('#progress-slider').slider({
      formatter: (value) => {
        return value;
      },
      tooltip_position: 'bottom',
    });
  }

  openWebSocket() {
    return new Promise((resolve, reject) => {

      const ws = new ReconnectingWebSocket(this.getAppropriateWsUrl());

      ws.addEventListener('message', (event) => {
        this._mpdCallback.onMessage(event.data);
      });

      ws.addEventListener('open', () => {
        this.setConnectedStatus(true);
        resolve(ws);
      });

      ws.addEventListener('error', (err) => {
        reject(err);
      });

      ws.addEventListener('close', (err) => {
        this._mpdCallback.onClose();
        reject(err);
      });
    });
  }

  setConnectedStatus(isConnected) {
    if (isConnected) {
      $('#connected-status').
          html($('<i>').addClass('fas fa-circle').attr({'title': 'Connected'}));
    }
    else {
      $('#connected-status').
          html($('<i>').
              addClass('far fa-circle').
              attr({'title': 'Not connected'}));
    }
  }

  runBrowse() {
    this.currentApp = 'queue';
    $('#breadcrumb').hide();
    $('#mainTable').show().find('tr:gt(0)').remove();
    this.socket.send('MPD_API_GET_QUEUE,' + this.pagination);

    $('#card-heading').text('Queue');
    $('#queue').addClass('active');
  }

  prepare() {
    $('#nav_links > li').removeClass('active');
    $('#prev').hide();
    $('#add-all-songs').hide();
    this.pagination = 0;
    this.browsepath = '';
  }

  queue() {
    this.prepare();
    this.pagination = parseInt(window.location.href.split('/').pop()) || 0;
    this.runBrowse();
  }

  browse() {
    $('#spinner').show();

    this.prepare();
    this.currentApp = 'browse';

    const splittedPath = window.location.hash.split('/');
    splittedPath.shift(); // remove "#"
    splittedPath.shift(); // remove browse"
    this.pagination = splittedPath.shift();
    this.browsepath = decodeURI(splittedPath.join('/'));

    const breadcrumRoot = $('<li>').
        addClass('breadcrumb-item').
        append($('<a>').attr({'href': '#/browse/0/'}).text('root'));
    $('#breadcrumb').
        show().
        empty().
        append(breadcrumRoot);

    $('#mainTable').show().find('tr:gt(0)').remove();

    this.socket.send('MPD_API_GET_BROWSE,' + this.pagination + ',' +
        (this.browsepath ? this.browsepath : '/'));
    // Don't add all songs from root
    if (this.browsepath) {
      const add_all_songs = $('#add-all-songs');
      add_all_songs.off(); // remove previous binds
      add_all_songs.on('click', () => {
        this.socket.send('MPD_API_ADD_TRACK,' + this.browsepath);
        this.notify('Added all');
      });
      add_all_songs.show();
    }

    $('#card-heading').text('Browse database: ' + this.browsepath);
    const path_array = this.browsepath.split('/');
    let full_path = '';
    $.each(path_array, (index, chunk) => {
      if (path_array.length - 1 === index) {
        const liElem = $('<li>').addClass('breadcrumb-item active').text(chunk);
        $('#breadcrumb').append(liElem);
        return;
      }

      full_path = full_path + chunk;
      const liElem = $('<li>').
          addClass('breadcrumb-item').
          append(
              $('<a>').attr({'href': '#/browse/0/' + full_path}).text(chunk));
      $('#breadcrumb').append(liElem);
      full_path += '/';
    });
    $('#browse').addClass('active');
    if (this.pagination > 0) {
      $('#prev').show();
    }
  }

  search() {
    this.currentApp = 'search';
    $('#mainTable').find('tr:gt(0)').remove();
    const splittedPath = window.location.hash.split('/');
    const searchstr = decodeURI(splittedPath[2].trim());
    $('#search > div > input').val(searchstr);
    this.socket.send('MPD_API_SEARCH,' + searchstr);
    $('#card-heading').text('Search: ' + searchstr);
  }

  route() {
    const url = window.location.href;
    switch (true) {
      case /\#\/(\d+)/.test(url):
        this.queue();
        break;
      case /\#\/browse\/(\d+)\/(.*)/.test(url):
        this.browse();
        break;
      case /#\/search\/(.*)/.test(url):
        this.search();
        break;
      default:
        window.location.href = '#/0';
        break;
    }
  }

  scrollFunction() {
    const scrollTop = 250;
    if (document.body.scrollTop > scrollTop ||
        document.documentElement.scrollTop > scrollTop) {
      $('#to-top').show();
    } else {
      $('#to-top').hide();
    }
  }

  // When the user clicks on the button, scroll to the top of the document
  topFunction() {
    document.body.scrollTop = 0; // For Safari
    document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
  }

  startUp() {

    this.openWebSocket().then(server => {

      this.socket = server;
      this.notify('Connected to ympd');
      /* emit initial request for output names */
      this.socket.send('MPD_API_GET_OUTPUTS');
      this.initVolumeSlider();
      this.initProgressSlider();
      if (this.isTouch) {
        $('#mainTable').addClass('smaller-font');
      }
      $('#progress-slider').slider('setValue', 0);

      if (!('Notification' in window)) {
        $('#btnnotify').addClass('disabled');
      }
      else if (localStorage.getItem('notification') === 'true') {
        $('#btnnotify').addClass('active');
      }
      this.route();

      window.onhashchange = this.route.bind(this);
      // When the user scrolls down 20px from the top of the document, show the button
      window.onscroll = this.scrollFunction;
    });
  }
}
