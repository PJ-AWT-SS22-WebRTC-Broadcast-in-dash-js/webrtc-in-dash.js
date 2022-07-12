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
import {WHPPClient} from '@eyevinn/whpp-client';
import FactoryMaker from '../core/FactoryMaker';

function WebRtcHandler() {

    let instance,
        videoModel,
        webRtcPeer;

    function setup() {
    }

    function setConfig(config) {
        if (config.videoModel) {
            videoModel = config.videoModel;
        }
    }

    function loadFromManifest(manifest) {
        // TODO: only use non-multiplexed representations (i.e. only video, only audio, only subtitles, ...
        let webRtcAdaptationSet;

        // TODO: implement a more sophisticated logic to get the latest WebRTC adaptation set
        const periods = manifest.Period_asArray;
        for (let i = periods.length - 1; i >= 0 && !webRtcAdaptationSet; i--) {
            webRtcAdaptationSet = periods[i].AdaptationSet_asArray
                .find((adaptationSet) => adaptationSet.mimeType === 'video RTP/AVP');
        }

        if (webRtcAdaptationSet) {
            const success = _initializeWebRtcPeer(webRtcAdaptationSet['xlink:rel']);
            if (success) {
                const channelUrl = webRtcAdaptationSet['xlink:href'];
                const client = new WHPPClient(webRtcPeer, channelUrl);
                client.connect()
                    .then(() => console.log('WebRTC connected.'))
                    .catch(console.warn);
                return true;
            }
            return false;
        } else {
            return false;
        }
    }

    function _initializeWebRtcPeer(sessionNegotiationProtocol) {
        switch (sessionNegotiationProtocol) {
            case 'urn:ietf:params:whip:whpp':
                webRtcPeer = new RTCPeerConnection();
                webRtcPeer.ontrack = (evt) => {
                    if (evt.streams && evt.streams[0]) {
                        videoModel.getElement().srcObject = evt.streams[0];
                    }
                };
                return true;
            default:
                // TODO: implement proper error handling
                console.error(`Unknown WebRTC session negotiation protocol '${sessionNegotiationProtocol}'.`);
                return false;
        }
    }

    function destroy() {
        if (webRtcPeer) {
            webRtcPeer.close();
            videoModel.getElement().srcObject = null;  // player.destroy() doesn't clean up the srcObject
        }
    }

    instance = {
        setConfig,
        loadFromManifest,
        destroy
    };

    setup();

    return instance;
}

WebRtcHandler.__dashjs_factory_name = 'WebRtcHandler';
export default FactoryMaker.getSingletonFactory(WebRtcHandler);
