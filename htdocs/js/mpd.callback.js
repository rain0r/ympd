export class MpdCallback {

  constructor(mpd) {
    this._mpd = mpd;
    this.onMessageOutputnames = this.onMessageOutputnames.bind(this);
    this.onMessageQueue = this.onMessageQueue.bind(this);
    this.onMessageBrowse = this.onMessageBrowse.bind(this);
    this.onMessageState = this.onMessageState.bind(this);
    this.onMessageOutputs = this.onMessageOutputs.bind(this);
    this.onDisconnected = this.onDisconnected.bind(this);
    this.onUpdateQueue = this.onUpdateQueue.bind(this);
    this.onSongChange = this.onSongChange.bind(this);
    this.onMpdHost = this.onMpdHost.bind(this);
  }

  get mpd() {
    return this._mpd;
  }

  set mpd(value) {
    this._mpd = value;
  }

  onMessageQueue(obj) {
    if (this._mpd.currentApp !== 'queue') {
      return;
    }

    $('#mainTable > tbody').empty();
    const toAppend = [];

    for (let song in obj.data) {
      const minutes = Math.floor(obj.data[song].duration / 60);
      const seconds = obj.data[song].duration - minutes * 60;
      const tr = $('<tr>').
          data('trackId', obj.data[song].id).
          append($('<td>').text(obj.data[song].pos + 1),
              $('<td>').text(obj.data[song].title), $('<td>').
                  text(minutes + ':' + (seconds < 10 ? '0' : '') + seconds),
              $('<td>').text(' '));
      toAppend.push(tr);
    }

    $('#mainTable > tbody').append(toAppend);

    if (obj.data[obj.data.length - 1] &&
        obj.data[obj.data.length - 1].pos + 1 >=
        this._mpd.pagination + this._mpd.MAX_ELEMENTS_PER_PAGE) {
      $('#next').show();
    }
    if (this._mpd.pagination > 0) {
      $('#prev').show();
    }
    if (this._mpd.isTouch) {

      const title = $('<a>').
          addClass('float-right btn-group-hover').
          attr({'href': '#/'}).
          append('<i>').
          addClass('far fa-trash-alt').
          click((event) => {
            this.mpd.socket.send('MPD_API_RM_TRACK,' +
                $(clickEvent.currentTarget).parents('tr').data('trackId'));
            $(event.currentTarget).parents('tr').remove();
          },);
      $('#mainTable > tbody > tr > td:last-child').append(title);

    } else {

      $('#mainTable > tbody > tr').on({
        'mouseover': (event) => {
          const elem = $('<a>').
              addClass('float-right btn-group-hover').
              attr({'href': '#/'}).
              click((clickEvent) => {
              debugger;
                this.mpd.socket.send('MPD_API_RM_TRACK,' +
                    $(clickEvent.currentTarget).parents('tr').data('trackId'));
                $(clickEvent.currentTarget).parents('tr').remove();
              }).append($('<i>').addClass('far fa-trash-alt'));

          if ($(event.currentTarget).children().last().has('a').length === 0) {
            $(event.currentTarget).
                children().
                last().
                append(elem).
                find('a').
                fadeTo('fast', 1);
          }
        },
        'mouseleave': (event) => {
          $(event.currentTarget).children().last().find('a').stop().remove();
        },
      });
    }

    $('#mainTable > tbody > tr').on('click', (event) => {
          $('#mainTable > tbody > tr').removeClass('active');
          this._mpd.socket.send('MPD_API_PLAY_TRACK,' +
              $(event.currentTarget).data('trackId'));
          $(this).addClass('active');
        },
    );
  }

  onMessageBrowse(obj) {
    if (this._mpd.currentApp !== 'browse' &&
        this._mpd.currentApp !== 'search') {
      return;
    }

    const toAppend = [];

    /* The use of encodeURI() below might seem useless, but it's not. It prevents
     * some browsers, such as Safari, from changing the normalization form of the
     * URI from NFD to NFC, breaking our link with MPD.
     */
    for (let item in obj.data) {
      let tr = null;
      let tds = [];
      switch (obj.data[item].type) {
        case 'directory':
          tr = $('<tr>').attr({
            'uri': encodeURI(obj.data[item].dir),
            'class': 'dir',
          }).append(
              $('<td>').append(
                  $('<i>').addClass('fas fa-folder-open'),
              ),
              $('<td>').append(
                  $('<a>').text(this._mpd.basename(obj.data[item].dir))),
              $('<td>'),
              $('<td>'),
          );

          tr.append(tds);
          toAppend.push(tr);
          break;
        case 'playlist':
          tr = $('<tr>').
              attr({'uri': encodeURI(obj.data[item].plist)}).
              addClass('plist').
              append(
                  $('<td>').append(
                      $('<i>').addClass('fas fa-list-ul'),
                  ),
                  $('<td>').text(this._mpd.basename(obj.data[item].plist)),
                  $('<td>').text(''),
                  $('<td>').text(''),
              );
          toAppend.push(tr);
          break;
        case 'song':
          const minutes = Math.floor(obj.data[item].duration / 60);
          const seconds = obj.data[item].duration - minutes * 60;

          tr = $('<tr>').attr({
            'uri': encodeURI(obj.data[item].uri),
            'class': 'song',
          }).append(
              $('<td>').append(
                  $('<i>').addClass('fas fa-music'),
              ),
              $('<td>').append(
                  $('<a>').text(this._mpd.basename(obj.data[item].title)),
              ),
              $('<td>').text(minutes + ':' + (seconds < 10 ? '0' : '') +
                  seconds),
              $('<td>'),
          );
          toAppend.push(tr);
          break;
        case 'wrap':
          if (this._mpd.currentApp === 'browse') {
            $('#next').show();
          } else {
            tr = $('<tr>').
                append($('<td>').append($('<i>').addClass('fas fa-minus'),),
                    $('<td>').
                        text('Too many results, please refine your search!'),
                    $('<td>').text(''), $('<td>').text(''));
            toAppend.push(tr);
          }
          break;
      }

      if (this._mpd.pagination > 0) {
        $('#prev').show();
      }
    }
    toAppend.sort((a, b) => {
      const clazz = a.attr('class').localeCompare(b.attr('class'));
      if (clazz === 0) {
        const name = a.text().
            toLowerCase().
            localeCompare(b.text().toLowerCase());
        return name;
      }
      return clazz;
    });
    $('#mainTable > tbody').append(toAppend);

    if (this._mpd.isTouch) {
      this._mpd.appendClickableIcon(
          $('#mainTable > tbody > tr.dir > td:last-child'),
          'MPD_API_ADD_TRACK', 'fas fa-plus');
      this._mpd.appendClickableIcon(
          $('#mainTable > tbody > tr.song > td:last-child'),
          'MPD_API_ADD_TRACK', 'far fa-play-circle');
    } else {
      $('#mainTable > tbody > tr').on({
        'mouseenter': (e) => {
          if ($(e.currentTarget).is('.dir')) {
            this._mpd.appendClickableIcon($(e.currentTarget).children().last(),
                'MPD_API_ADD_TRACK', 'fas fa-plus');
          }
          else if ($(e.currentTarget).is('.song')) {
            this._mpd.appendClickableIcon($(e.currentTarget).children().last(),
                'MPD_API_ADD_PLAY_TRACK', 'far fa-play-circle');
          }
        },
        mouseleave: (e) => {
          $(e.currentTarget).children().last().find('a').stop().remove();
        },
      });
    }

    $('#mainTable > tbody > tr').on({
      click: (e) => {
        let notificationText = '';
        switch ($(e.currentTarget).attr('class')) {
          case 'dir':
            this._mpd.pagination = 0;
            this._mpd.browsepath = $(e.currentTarget).attr('uri');
            $('#browse > a').
                attr('href', '#/browse/' + this._mpd.pagination + '/' +
                    this._mpd.browsepath);
            location.href = '#/browse/' + this._mpd.pagination + '/' +
                this._mpd.browsepath;
            break;
          case 'song':
            this._mpd.socket.send('MPD_API_ADD_TRACK,' +
                decodeURI($(e.currentTarget).attr('uri')));
            notificationText = 'Added title: \'' +
                $('td:nth-child(2)', $(e.currentTarget)).text() + '\'';
            this._mpd.notify(notificationText);
            break;
          case 'plist':
            this._mpd.socket.send('MPD_API_ADD_PLAYLIST,' +
                decodeURI($(e.currentTarget).attr('uri')));
            notificationText = 'Added playlist: \'' +
                $('td:nth-child(2)', $(e.currentTarget)).text() + '\'';
            this._mpd.notify(notificationText);
            break;
        }
      },
    });
  }

  onMessageState(obj) {
    this._mpd.updatePlayIcon(obj.data.state);
    this._mpd.updateVolumeIcon(obj.data.volume);

    if (JSON.stringify(obj) === JSON.stringify(this._mpd.lastState)) {
      return;
    }

    this._mpd.currentSong.totalTime = obj.data.totalTime;
    this._mpd.currentSong.currentSongId = obj.data.currentsongid;
    const totalMinutes = Math.floor(obj.data.totalTime / 60);
    const totalSeconds = obj.data.totalTime - totalMinutes * 60;

    const elapsedMinutes = Math.floor(obj.data.elapsedTime / 60);
    const elapsedSeconds = obj.data.elapsedTime - elapsedMinutes * 60;

    // $('#volumeslider').slider(obj.data.volume);
    $('#volume-slider').slider({
      formatter: (value) => {
        return value;
      },
    });

    $('#volume-slider').slider('setValue', obj.data.volume);

    $('#progress-slider').slider('setValue', obj.data.elapsedTime);

    $('#progress-slider').
        slider('setAttribute', 'max', obj.data.totalTime);

    $('#counter').text(elapsedMinutes + ':' +
        (elapsedSeconds < 10 ? '0' : '') + elapsedSeconds + ' / ' +
        totalMinutes + ':' + (totalSeconds < 10 ? '0' : '') +
        totalSeconds);

    $('#mainTable > tbody > tr').
        removeClass('active').
        css('font-weight', '');

    $('#mainTable > tbody > tr').filter((k, v) => {
      return $(v).data('trackId') === obj.data.currentsongid;
    }).addClass('active').css('font-weight', 'bold');

    if (obj.data.random) {
      $('#btnrandom').addClass('active');
    } else {
      $('#btnrandom').removeClass('active');
    }

    if (obj.data.consume) {
      $('#btnconsume').addClass('active');
    } else {
      $('#btnconsume').removeClass('active');
    }
    if (obj.data.single) {
      $('#btnsingle').addClass('active');
    } else {
      $('#btnsingle').removeClass('active');
    }
    if (obj.data.crossfade) {
      $('#btncrossfade').addClass('active');
    } else {
      $('#btncrossfade').removeClass('active');
    }
    if (obj.data.repeat) {
      $('#btnrepeat').addClass('active');
    } else {
      $('#btnrepeat').removeClass('active');
    }
    this._mpd.lastState = obj;
  }

  onMessageOutputnames(obj) {
    $('#btn-outputs-block button').remove();
    $.each(obj.data, (id, name) => {

      const btn = $('<button>').
          attr({'id': 'btnoutput' + id}).
          click((event) => {
            this._mpd.toggleoutput($(event.currentTarget), id);
          }).
          addClass('btn btn-light').
          append($('<i>').addClass('fas fa-volume-up')).
          append(name);
      $('#btn-outputs-block').append(btn);
    });
    /* remove cache, since the buttons have been recreated */
    this.mpd.lastOutputs = '';
  }

  onMessageOutputs(obj) {
    if (JSON.stringify(obj) === JSON.stringify(this.mpd.lastOutputs)) {
      return;
    }
    $.each(obj.data, (id, enabled) => {
      if (enabled) {
        $('#btnoutput' + id).addClass('active');
      } else {
        $('#btnoutput' + id).removeClass('active');
      }
    });
    this.mpd.lastOutputs = obj;
  }

  onDisconnected() {
    this._mpd.notify('ympd lost connection to MPD');
  }

  onUpdateQueue() {
    if (this._mpd.currentApp === 'queue') {
      this._mpd.socket.send('MPD_API_GET_QUEUE,' + this._mpd.pagination);
    }
  }

  onSongChange(obj) {
    $('#album').text('');
    $('#artist').text('');

    if (obj.data.artist) {
      $('#artist').text(obj.data.artist);
    }

    if (obj.data.album) {
      $('#album').text(obj.data.album);
    }

    $('#currenttrack').text(' ' + obj.data.title);

    if (localStorage.getItem('notification') === 'true') {
      this.songNotify(obj.data.title, obj.data.artist, obj.data.album);
    }
  }

  songNotify(title, artist, album) {
    let textNotification = '';

    if (typeof artist !== 'undefined' && artist.length > 0) {
      textNotification += ' ' + artist;
    }

    if (typeof album !== 'undefined' && album.length > 0) {
      textNotification += '\n ' + album;
    }

    const notification = new Notification(title,
        {icon: 'assets/favicon.ico', body: textNotification});
    setTimeout(function(notification) {
      notification.close();
    }, 3000, notification);
  }

  onMpdHost(obj) {
    $('#mpdhost').val(obj.data.host);
    $('#mpdport').val(obj.data.port);
    if (obj.data.passwort_set) {
      $('#mpd_password_set').show();
    }
  }

  onMessage(msg) {
    $('#spinner').hide();

    if (msg === this._mpd.lastState || msg.length === 0) {
      return;
    }

    let obj = null;
    try {
      obj = JSON.parse(msg);
    } catch (error) {
      return;
    }

    switch (obj.type) {
      case 'queue':
        this.onMessageQueue(obj);
        break;
      case 'search':
      case 'browse':
        this.onMessageBrowse(obj);
        break;
      case 'state':
        this.onMessageState(obj);
        break;
      case 'outputnames':
        this.onMessageOutputnames(obj);
        break;
      case 'outputs':
        this.onMessageOutputs(obj);
        break;
      case 'disconnected':
        this.onDisconnected();
        break;
      case 'update_queue':
        this.onUpdateQueue();
        break;
      case 'song_change':
        this.onSongChange(obj);
        break;
      case 'mpdhost':
        this.onMpdHost(obj);
        break;
      case 'error':
        this._mpd.notify(obj.data);
    }
  }

  onClose() {
    this._mpd.setConnectedStatus(false);
    this._mpd.notify('Connection to ympd lost, retrying in 3 seconds');
  }
}