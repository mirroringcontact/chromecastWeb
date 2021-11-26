const context = cast.framework.CastReceiverContext.getInstance();
const playerManager = context.getPlayerManager();

let playerManagerStop = function() {
    if (playerManager.getPlayerState() !== 'IDLE') {
        playerManager.stop();
    }
};

let youtubeControl = (function() {
    let self = {};

    self.setVideoId = function (videoId) {
        var content = document.getElementById('iframe').contentWindow.document; 
        content.body.innerHTML = '<html><iframe width="413" height="231" src="https://www.youtube.com/embed/' + videoId + '" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></html>';
    }

    self.clearContent = function () {
        var content = document.getElementById('iframe').contentWindow.document;
        content.body.innerHTML = "";  
    } 
}) ();

let imageControl = (function() {
    let self = {};
    self.$image = document.getElementById('image');
    self.$imageWrapper = document.getElementById('image-wrapper');

    self.setImgSrc = function(src) {
        console.log('setImgSrc = ' + src);
        self.$image.src = src;
        self.$imageWrapper.style.display = 'block';
    };

    self.clearImg = function () {
        self.$imageWrapper.style.display = 'none';
    };

    self.streamUrl = null;
    self.streamErrors = 0;
    self.currentIndex = 0;
    self.streamTimeout = null;

    self.startStream = function(url) {
        self.streamErrors = 0;
        self.streamUrl = url.indexOf('?') > 0 ? url + '&' : url + '?';
        self.$image.onload = function() {
            self.streamNextFrame();
            self.streamErrors = 0;
        };
        self.$image.onerror = function() {
            self.streamNextFrame();
            if (++self.streamErrors >= 100) {
                console.error('Stop streaming after 100 errors');
                self.stopStream();
            }
        };
        self.streamNextFrame();
    };

    self.stopStream = function() {
        self.streamUrl = null;
        self.$image.onload = function() {};
        self.$image.onerror = function() {};
        self.clearImg();
    };

    self.streamNextFrame = function() {
        if (self.streamUrl === null) {
            self.stopStream();
            return;
        }

        ++self.currentIndex;
        let url = self.streamUrl + 'time=' + self.currentIndex
        self.setImgSrc(url);

        if (self.streamTimeout !== null) {
            clearTimeout(self.streamTimeout);
        }
        self.streamTimeout = setTimeout(function() {
            ++self.streamErrors;
            self.streamNextFrame();
        }, 1500);
    };

    return self;
})();

playerManager.setMessageInterceptor(
    cast.framework.messages.MessageType.LOAD,
    request => {
        console.log('request: ' + JSON.stringify(request, null, 2));
        imageControl.stopStream();
        imageControl.clearImg();
        youtubeControl.clearContent();
        return request;
    });

const CUSTOM_CHANNEL = 'urn:x-cast:com.mirroring.screen.sharing';
context.addCustomMessageListener(CUSTOM_CHANNEL, function(customEvent) {
    console.log('EVENT: ' + JSON.stringify(customEvent, null, 2));
    if (!customEvent.data || !customEvent.data.type) {
        return;
    }

    let type = customEvent.data.type;
    let url = customEvent.data.url || '';
    switch (true) {
        case type.indexOf('image') === 0:
            youtubeControl.clearContent();
            imageControl.stopStream();
            playerManagerStop();
            youtubeControl.clearContent();
            imageControl.setImgSrc(url);
            break;
        case type === 'stream':
            youtubeControl.clearContent();
            playerManagerStop();
            imageControl.startStream(url);
            break;
        case type === 'stop':
            imageControl.stopStream();
            imageControl.clearImg();
            playerManagerStop();
            youtubeControl.clearContent();
        case type === 'youtube':
            playerManagerStop(); 
            imageControl.stopStream();
            imageControl.clearImg();
            youtubeControl.setVideoId(url)
        break;
    }
});

context.start({disableIdleTimeout: true});
