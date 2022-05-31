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
import WebRtcErrors from './errors/WebRtcErrors';
import 'regenerator-runtime/runtime';

function WebRtcHandler(config) {

    config = config || {};
    const videoModel = config.videoModel;
    let instance,
        peer,
        channelUrl,
        viewerResourceUrl,
        iceGatheringTimeout;

    function setup() {
        peer = new RTCPeerConnection({
            iceServers: [{urls: 'stun:stun.l.google.com:19302'}]
        });
        peer.onicegatheringstatechange = _onIceGatheringStateChange;
        peer.ontrack = onTrackEvent;
    }

    async function _onIceGatheringStateChange() {
        if (peer.iceGatheringState === 'complete') {
            await iceGatheringComplete();
        }
    }

    async function iceGatheringComplete() {
        clearTimeout(iceGatheringTimeout);
        const response = await fetch(viewerResourceUrl, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({answer: peer.localDescription.sdp})
        });
        if (!response.ok) {
            console.error(response.statusText);
        }
    }

    function onTrackEvent(evt) {
        if (evt.streams && evt.streams[0]) {
            videoModel.getElement().srcObject = evt.streams[0];
        }
    }

    function setChannelUrl(url) {
        channelUrl = url;
        _startPlayback();
    }

    function _startPlayback() {
        if (!channelUrl) {
            return;
        }
        const fetchConfig = {
            method: 'POST',
            // headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "https://web.whip.eyevinn.technology:443", "Access-Control-Allow-Method": "POST" },
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': 'https://broadcaster-wrtc.dev.eyevinn.technology:443',
                'Access-Control-Allow-Method': 'POST'
            },
            body: JSON.stringify({})
        };
        console.log(channelUrl);
        fetch(channelUrl, fetchConfig)
            .then((response) => {
                viewerResourceUrl = response.headers.get('location');
                return response.json();
            })
            .then(async (whppOffer) => {
                await peer.setRemoteDescription({type: 'offer', sdp: whppOffer.offer});
                const answer = peer.createAnswer();
                peer.setLocalDescription(answer);
            })
            .then(() => {
                iceGatheringTimeout = setTimeout(async () => {
                    await iceGatheringComplete();
                }, 5000);
            });
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
