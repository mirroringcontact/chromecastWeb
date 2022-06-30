const context = cast.framework.CastReceiverContext.getInstance();
const playerManager = context.getPlayerManager();

let playerManagerStop = function() {
    if (playerManager.getPlayerState() !== 'IDLE') {
        playerManager.stop();
    }
};

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

function putImageData(ctx, imageData, dx, dy,
    dirtyX, dirtyY, dirtyWidth, dirtyHeight) {
  let data = imageData.data;
  let height = imageData.height;
  let width = imageData.width;
  dirtyX = dirtyX || 0;
  dirtyY = dirtyY || 0;
  dirtyWidth = dirtyWidth !== undefined? dirtyWidth: width;
  dirtyHeight = dirtyHeight !== undefined? dirtyHeight: height;
  let limitBottom = dirtyY + dirtyHeight;
  let limitRight = dirtyX + dirtyWidth;
  for (let y = dirtyY; y < limitBottom; y++) {
    for (let x = dirtyX; x < limitRight; x++) {
      var pos = y * width + x;
      ctx.fillStyle = 'rgba(' + data[pos*4+0]
                        + ',' + data[pos*4+1]
                        + ',' + data[pos*4+2]
                        + ',' + (data[pos*4+3]/255) + ')';
      ctx.fillRect(x + dx, y + dy, 1, 1);
    }
  }
}

playerManager.setMessageInterceptor(
    cast.framework.messages.MessageType.LOAD,
    request => {
        console.log('request: ' + JSON.stringify(request, null, 2));
        imageControl.stopStream();
        imageControl.clearImg(); 
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
            imageControl.stopStream();
            playerManagerStop();
            // imageControl.setImgSrc(url);
            putImageData(ctx, customEvent.data, 150, 0, 50, 50, 25, 25);
            break;
        case type === 'stream':
            playerManagerStop(); 
            webRTCAdaptor.join("stream1");
            break;
        case type === 'stop':
            imageControl.stopStream();
            imageControl.clearImg();
            playerManagerStop();  
    }
});

context.start({disableIdleTimeout: true});
