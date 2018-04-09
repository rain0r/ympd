require('bootstrap/dist/js/bootstrap.min.js');
require('bootstrap-notify/bootstrap-notify.min.js');
require('bootstrap-slider/dist/bootstrap-slider.js');

import {Mpd} from '../htdocs/js/mpd';
import {MpdListener} from '../htdocs/js/mpd.listener';
import {MpdCallback} from '../htdocs/js/mpd.callback';

const mpd = new Mpd();
const mpdListener = new MpdListener(mpd);
const mpdCallback = new MpdCallback(mpd);

mpd.mpdCallback = mpdCallback;
mpd.startUp();