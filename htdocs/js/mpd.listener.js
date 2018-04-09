export class MpdListener {

  get mpd() {
    return this._mpd;
  }

  set mpd(value) {
    this._mpd = value;
  }

  constructor(mpd) {
    this._mpd = mpd;

    $('#btnrandom').on('click', (event) => {
      this.mpd.socket.send('MPD_API_TOGGLE_RANDOM,' +
          ($(event.currentTarget).hasClass('active') ? 0 : 1));
    });

    $('#btnconsume').on('click', (event) => {
      this.mpd.socket.send('MPD_API_TOGGLE_CONSUME,' +
          ($(event.currentTarget).hasClass('active') ? 0 : 1));
    });

    $('#btnsingle').on('click', (event) => {
      this.mpd.socket.send('MPD_API_TOGGLE_SINGLE,' +
          ($(event.currentTarget).hasClass('active') ? 0 : 1));
    });

    $('#btncrossfade').on('click', (event) => {
      this.mpd.socket.send('MPD_API_TOGGLE_CROSSFADE,' +
          ($(event.currentTarget).hasClass('active') ? 0 : 1));
    });

    $('#btnrepeat').on('click', (event) => {
      this.mpd.socket.send('MPD_API_TOGGLE_REPEAT,' +
          ($(event.currentTarget).hasClass('active') ? 0 : 1));
    });

    $('#btn-settings').on('click', () => {
      this.mpd.getHost();
      $('#settings').modal('show');
    });

    $('#btnnotify').on('click', () => {
      if (localStorage.getItem('notification') === 'true') {
        localStorage.setItem('notification', false);
      } else {
        Notification.requestPermission((permission) => {
          if (!('permission' in Notification)) {
            Notification.permission = permission;
          }

          if (permission === 'granted') {
            localStorage.setItem('notification', true);
            $('btnnotify').addClass('active');
          }
        });
      }
    });

    $('body').on('click', '#btn-stop', () => {
      this.mpd.socket.send('MPD_API_SET_STOP');
    });

    $('body').on('click', '#btn-backward', () => {
      this.mpd.socket.send('MPD_API_SET_PREV');
    });

    $('body').on('click', '#btn-forward', () => {
      this.mpd.socket.send('MPD_API_SET_NEXT');
    });

    $('body').on('click', '#btn-play', () => {
      this.mpd.clickPlay();
    });

    $('body').on('click', '#to-top', () => {
      this.mpd.topFunction();
    });

    $('#search').submit(() => {
      window.location.href = '#/search/' + $('#search > div > input').val();
      return false;
    });

    $('#next').on('click', () => {
      this.mpd.pagination = parseInt(parseInt(this.mpd.pagination) +
          parseInt(this.mpd.MAX_ELEMENTS_PER_PAGE));
      switch (this.mpd.currentApp) {
        case 'queue':
          window.location.href = '#/' + this.mpd.pagination;
          break;
        case 'browse':
          window.location.href = '#/browse/' + this.mpd.pagination + '/' +
              this.mpd.browsepath;
          break;
      }
    });

    $('#prev').on('click', () => {
      this.mpd.pagination = parseInt(parseInt(this.mpd.pagination) -
          parseInt(this.mpd.MAX_ELEMENTS_PER_PAGE));
      if (this.mpd.pagination <= 0) {
        this.mpd.pagination = 0;
      }
      switch (this.mpd.currentApp) {
        case 'queue':
          window.location.href = '#/' + this.mpd.pagination;
          break;
        case 'browse':
          window.location.href = '#/browse/' + this.mpd.pagination + '/' +
              this.mpd.browsepath;
          break;
      }
    });

    $('#mpd_password_set > button').on('click', () => {
      this.mpd.socket.send('MPD_API_SET_MPDPASS,');
      $('#mpd_pw').val('');
      $('#mpd_pw_con').val('');
      $('#mpd_password_set').hide();
    });

    $('#track-icon').on('click', this.mpd.clickPlay);

    $('#confirm-settings').on('click', this.mpd.confirmSettings);

    $('#save-queue').on('click', this.mpd.saveQueue);

    $('#clear-queue').on('click', () => {
      this.mpd.socket.send('MPD_API_RM_ALL');
      this.mpd.notify('Cleared queue');
    });

    $('#update-db').on('click', this.mpd.updateDB);

    $(document).keydown((event) => {
      if (event.target.tagName === 'INPUT') {
        return;
      }
      switch (event.which) {
        case 37: //left
          this.mpd.socket.send('MPD_API_SET_PREV');
          break;
        case 39: //right
          this.mpd.socket.send('MPD_API_SET_NEXT');
          break;
        case 32: //space
          this.mpd.clickPlay();
          break;
        default:
          return;
      }
      event.preventDefault();
    });

    $('body').on('change', '#volume-slider', (event) => {
      this.mpd.socket.send('MPD_API_SET_VOLUME,' + event.value.newValue);
    });

    $('body').on('slide', '#volume-slider', (event) => {
      this.mpd.socket.send('MPD_API_SET_VOLUME,' + event.value);
    });

    $('body').on('change', '#progress-slider', (event) => {
      if (this.mpd.socket === undefined || this.mpd.currentSong === undefined) {
        event.preventDefault();
        return;
      }
      this.mpd.socket.send('MPD_API_SET_SEEK,' +
          this.mpd.currentSong.currentSongId + ',' +
          event.value.newValue);
    });

    $('body').on('slide', '#progress-slider', (event) => {
      if (this.mpd.socket === undefined || this.mpd.currentSong === undefined) {
        event.preventDefault();
        return;
      }
      this.mpd.socket.send('MPD_API_SET_SEEK,' +
          this.mpd.currentSong.currentSongId + ',' +
          event.value);
    });
  }
}