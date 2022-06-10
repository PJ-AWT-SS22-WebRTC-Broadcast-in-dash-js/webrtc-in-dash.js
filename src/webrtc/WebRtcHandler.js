/**
 * The copyright in this software is being made available under the BSD License,
 * included below. This software may be subject to other third party and contributor
 * rights, including patent rights, and no such rights are granted under this license.
 *
 * Copyright (c) 2013, Dash Industry Forum.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *  * Redistributions of source code must retain the above copyright notice, this
 *  list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above copyright notice,
 *  this list of conditions and the following disclaimer in the documentation and/or
 *  other materials provided with the distribution.
 *  * Neither the name of Dash Industry Forum nor the names of its
 *  contributors may be used to endorse or promote products derived from this software
 *  without specific prior written permission.
 *
 *  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS AS IS AND ANY
 *  EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 *  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 *  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 *  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 *  NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 *  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 *  WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 *  POSSIBILITY OF SUCH DAMAGE.
 */
import {WebRTCPlayer} from '@eyevinn/webrtc-player';
import Events from '../core/events/Events';
import EventBus from '../core/EventBus';
import WebRtcErrors from './errors/WebRtcErrors';

function WebRtcHandler(config) {

    config = config || {};
    const context = this.context;
    const eventBus = EventBus(context).getInstance();
    const videoModel = config.videoModel;

    let instance,
        player,
        mediaRecorder;

    function setup() {
        const videoElement = videoModel.getElement();
        player = new WebRTCPlayer({
            type: 'se.eyevinn.whpp',
            video: {
                onPeerTrack: _onPeerTrack,
                onMute: (mute) => videoModel.getElement().muted = mute,
                onStop: () => {
                    videoElement.src = null;
                    videoElement.load();
                }
            },
            debug: true
        });
        player.on('message', (message) => {
            console.log(message);
        });
    }

    function setChannelUrl(url) {
        if (url) {
            player.load(new URL(url));
        }
    }

    /**
     * @private
     */
    function _onPeerTrack(event) {
        if (event.streams && event.streams[0]) {
            const stream = event.streams[0];
            videoModel.getElement().srcObject = stream; // bypass mse

            mediaRecorder = new MediaRecorder(stream);
            mediaRecorder.ondataavailable = _onDataAvailable;
            mediaRecorder.start(1000);
        }
    }

    /**
     * @private
     */
    function _onDataAvailable(event) {
        if (event.data.size > 0) {
            eventBus.trigger(Events.LOADING_COMPLETED, {
                request: null,
                response: event.data || null,
                error: null,
                sender: instance
            });
        }
    }

    instance = {
        setChannelUrl
    };

    setup();

    return instance;
}

WebRtcHandler.__dashjs_factory_name = 'WebRtcHandler';
const factory = dashjs.FactoryMaker.getClassFactory(WebRtcHandler); /* jshint ignore:line */
factory.errors = WebRtcErrors;
dashjs.FactoryMaker.updateClassFactory(WebRtcHandler.__dashjs_factory_name, factory); /* jshint ignore:line */
export default factory; /* jshint ignore:line */
